import argparse
import os
import glob
import tempfile
import subprocess
import sys
from pathlib import Path
from tqdm import tqdm
from pydub import AudioSegment
from pydub.silence import split_on_silence, detect_silence
from pydub.generators import Sine
from pydub.effects import normalize

# ── Constantes ──────────────────────────────────────────────────────────
SUPPORTED_EXTENSIONS = ('*.mp3', '*.mp4', '*.wav', '*.m4a', '*.ogg', '*.flac')

def generate_beep(duration=150, freq=1000, volume=-15):
    """Génère un son de type 'bip' pour signaler la fin d'une phrase."""
    return Sine(freq).to_audio_segment(duration=duration).apply_gain(volume)

def change_audio_speed(chunk, speed):
    """Modifie la vitesse de l'audio sans changer la hauteur de voix (nécessite ffmpeg)."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_in, \
         tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_out:

        chunk.export(temp_in.name, format="wav")

        # atempo supporte [0.5, 2.0] — on chaîne les filtres pour les valeurs hors limites
        filters = []
        remaining = speed
        while remaining > 2.0:
            filters.append("atempo=2.0")
            remaining /= 2.0
        while remaining < 0.5:
            filters.append("atempo=0.5")
            remaining /= 0.5
        filters.append(f"atempo={remaining}")
        filter_str = ",".join(filters)

        cmd = ["ffmpeg", "-y", "-i", temp_in.name, "-filter:a", filter_str, temp_out.name]
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

        if result.returncode != 0:
            os.unlink(temp_in.name)
            os.unlink(temp_out.name)
            raise RuntimeError(f"FFmpeg atempo a échoué : {result.stderr.decode()[:200]}")

        new_chunk = AudioSegment.from_wav(temp_out.name)
        os.unlink(temp_in.name)
        os.unlink(temp_out.name)
        return new_chunk


def compute_adaptive_threshold(audio, window_ms=5000, base_thresh=-16):
    """Calcule un seuil de silence adaptatif basé sur l'analyse locale du volume.

    Au lieu d'un seuil fixe basé sur le dBFS global (trompé par la musique de fond
    ou les variations de volume), on analyse le profil de volume par fenêtres
    et utilise le percentile bas comme référence.
    """
    duration_ms = len(audio)

    if duration_ms < window_ms * 3:
        # Audio court : seuil classique
        return audio.dBFS + base_thresh

    # Analyser le volume par fenêtres
    volumes = []
    for start in range(0, duration_ms - window_ms, window_ms // 2):
        segment = audio[start:start + window_ms]
        db = segment.dBFS
        if db > -60:  # Ignorer les fenêtres quasi-silencieuses
            volumes.append(db)

    if not volumes:
        return audio.dBFS + base_thresh

    # Utiliser le percentile 25 comme référence au lieu de la moyenne globale
    volumes.sort()
    p25_index = max(0, len(volumes) // 4)
    reference_db = volumes[p25_index]

    # Le seuil est le point bas + l'offset configuré
    threshold = reference_db + base_thresh

    return threshold


def merge_small_chunks(chunks, audio, min_chunk_ms=300):
    """Fusionne les segments trop courts avec le segment voisin le plus proche.

    Les micro-segments (< min_chunk_ms) sont souvent des artéfacts de détection
    (clics, bruits de bouche) et non des mots réels.
    """
    if len(chunks) <= 1:
        return chunks

    merged = [chunks[0]]
    for chunk in chunks[1:]:
        if len(merged[-1]) < min_chunk_ms:
            # Fusionner avec le suivant
            merged[-1] = merged[-1] + chunk
        elif len(chunk) < min_chunk_ms:
            # Fusionner avec le précédent
            merged[-1] = merged[-1] + chunk
        else:
            merged.append(chunk)

    return merged


def process_file(input_file, output_file, args):
    base_name = os.path.basename(input_file)
    print(f"\n{'─' * 50}")
    print(f"  Traitement de {base_name}")
    print(f"{'─' * 50}")

    # Validation
    if not os.path.isfile(input_file):
        print(f"  ✗ Fichier introuvable : {input_file}")
        return False

    file_size = os.path.getsize(input_file)
    if file_size == 0:
        print(f"  ✗ Fichier vide : {input_file}")
        return False

    try:
        audio = AudioSegment.from_file(input_file)
    except Exception as e:
        print(f"  ✗ Erreur de lecture : {e}")
        print("    Vérifiez que FFmpeg est installé (brew install ffmpeg).")
        return False

    duration_sec = len(audio) / 1000
    print(f"  Durée : {duration_sec:.1f}s | Taille : {file_size / (1024*1024):.1f} MB")

    # Calcul du seuil adaptatif
    if args.adaptive:
        silence_thresh = compute_adaptive_threshold(audio, base_thresh=args.thresh)
        print(f"  Seuil adaptatif : {silence_thresh:.1f} dBFS (vs global: {audio.dBFS + args.thresh:.1f} dBFS)")
    else:
        silence_thresh = audio.dBFS + args.thresh
        print(f"  Seuil fixe : {silence_thresh:.1f} dBFS")

    print("  Recherche des phrases...")
    chunks = split_on_silence(
        audio,
        min_silence_len=args.min_silence,
        silence_thresh=silence_thresh,
        keep_silence=args.keep_silence
    )

    if not chunks:
        print("  ✗ Aucune phrase détectée. Suggestions :")
        print("    • Diminuer --min-silence (actuellement : {} ms)".format(args.min_silence))
        print("    • Ajuster --thresh (actuellement : {} dB)".format(args.thresh))
        print("    • Désactiver --adaptive si l'audio est propre")
        return False

    # Filtrer les micro-segments
    original_count = len(chunks)
    if args.min_chunk > 0:
        chunks = merge_small_chunks(chunks, audio, min_chunk_ms=args.min_chunk)

    print(f"  {len(chunks)} phrases retenues (sur {original_count} détectées).")
    print(f"  Construction de l'audio de sortie...")

    final_audio = AudioSegment.empty()
    beep = generate_beep()

    for i, chunk in enumerate(tqdm(chunks, desc="  Avancement")):

        if args.normalize:
            chunk = normalize(chunk)

        if args.speed != 1.0:
            try:
                chunk = change_audio_speed(chunk, args.speed)
            except RuntimeError as e:
                print(f"\n  ⚠ Erreur vitesse sur segment {i+1}: {e}")
                # Continuer sans modification de vitesse

        pause_len = int(len(chunk) * args.pause_mult)
        if args.min_pause > 0:
            pause_len = max(pause_len, args.min_pause)
        if args.max_pause > 0:
            pause_len = min(pause_len, args.max_pause)

        silence = AudioSegment.silent(duration=pause_len)

        part = chunk
        if args.beep:
            part = part.append(beep, crossfade=10)

        part = part + silence

        if len(final_audio) > 0 and args.crossfade > 0:
            cf = min(args.crossfade, len(final_audio), len(part))
            final_audio = final_audio.append(part, crossfade=cf)
        else:
            final_audio += part

    # Déterminer le format de sortie
    ext = os.path.splitext(output_file)[1][1:].lower()
    if ext not in ('mp3', 'wav', 'ogg', 'flac', 'm4a'):
        ext = 'mp3'

    print(f"  Sauvegarde → '{output_file}' ({ext})...")
    try:
        final_audio.export(output_file, format=ext)
    except Exception as e:
        print(f"  ✗ Erreur d'export : {e}")
        return False

    output_duration = len(final_audio) / 1000
    ratio = output_duration / duration_sec if duration_sec > 0 else 0
    print(f"  ✅ {output_duration:.1f}s (×{ratio:.1f} de l'original)")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Traitement audio avancé pour l'apprentissage des langues.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python advanced_audio.py input.mp3 output.mp3 --pause-mult 1.5 --beep --normalize
  python advanced_audio.py ./dossier/ ./sortie/ --speed 0.95 --pause-mult 2.0 --adaptive
  python advanced_audio.py audio.mp3 result.mp3 --keep-silence 400 --min-chunk 500
        """
    )
    parser.add_argument("input", help="Fichier audio ou dossier source")
    parser.add_argument("output", help="Fichier de sortie ou dossier de destination (mode batch)")

    # ── Détection de silence
    silence_group = parser.add_argument_group("Détection de silence")
    silence_group.add_argument("--min-silence", type=int, default=700,
                               help="Durée min de silence en ms pour couper (défaut: 700)")
    silence_group.add_argument("--thresh", type=int, default=-16,
                               help="Seuil de silence relatif en dB (défaut: -16)")
    silence_group.add_argument("--keep-silence", type=int, default=250,
                               help="Silence naturel conservé au début/fin de chaque segment en ms (défaut: 250)")
    silence_group.add_argument("--adaptive", action="store_true",
                               help="Utiliser un seuil adaptatif basé sur le profil de volume local")
    silence_group.add_argument("--min-chunk", type=int, default=300,
                               help="Durée min d'un segment valide en ms. Les micro-segments sont fusionnés (défaut: 300)")

    # ── Pauses
    pause_group = parser.add_argument_group("Pauses")
    pause_group.add_argument("--pause-mult", type=float, default=1.2,
                             help="Multiplicateur du temps de pause (défaut: 1.2)")
    pause_group.add_argument("--min-pause", type=int, default=0,
                             help="Durée minimale de pause en ms (défaut: 0 = pas de minimum)")
    pause_group.add_argument("--max-pause", type=int, default=0,
                             help="Durée maximale de pause en ms (défaut: 0 = pas de maximum)")

    # ── Audio
    audio_group = parser.add_argument_group("Audio")
    audio_group.add_argument("--speed", type=float, default=1.0,
                             help="Vitesse de lecture sans modifier la hauteur (ex: 0.9 pour ralentir)")
    audio_group.add_argument("--beep", action="store_true",
                             help="Ajouter un bip sonore à la fin de chaque segment")
    audio_group.add_argument("--normalize", action="store_true",
                             help="Égaliser les niveaux sonores entre segments")
    audio_group.add_argument("--crossfade", type=int, default=50,
                             help="Fondu croisé entre segments en ms (défaut: 50)")

    args = parser.parse_args()

    # Validation de la vitesse
    if args.speed <= 0 or args.speed > 4.0:
        print("✗ La vitesse doit être entre 0.1 et 4.0")
        sys.exit(1)

    print("╔══════════════════════════════════════════════════╗")
    print("║        Diclo — Traitement Audio Avancé (v2)     ║")
    print("╚══════════════════════════════════════════════════╝")

    if os.path.isdir(args.input):
        print(f"Mode Batch : Traitement du dossier '{args.input}'")
        os.makedirs(args.output, exist_ok=True)
        files = []
        for ext in SUPPORTED_EXTENSIONS:
            files.extend(glob.glob(os.path.join(args.input, ext)))

        files.sort()

        if not files:
            print(f"  ✗ Aucun fichier audio trouvé dans '{args.input}'")
            sys.exit(1)

        print(f"  {len(files)} fichier(s) trouvé(s).\n")

        success = 0
        fail = 0
        for f in files:
            base_name = os.path.splitext(os.path.basename(f))[0]
            out_f = os.path.join(args.output, f"{base_name}_processed.mp3")
            ok = process_file(f, out_f, args)
            if ok:
                success += 1
            else:
                fail += 1

        print(f"\n{'═' * 50}")
        print(f"  ✓ {success} réussi(s), {fail} échoué(s)")
        print(f"{'═' * 50}")

    else:
        if not os.path.exists(args.input):
            print(f"✗ '{args.input}' n'existe pas.")
            sys.exit(1)

        ok = process_file(args.input, args.output, args)
        if ok:
            print(f"\n{'═' * 50}")
            print(f"  ✓ Opération terminée avec succès !")
            print(f"{'═' * 50}")
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
