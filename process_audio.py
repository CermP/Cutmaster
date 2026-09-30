import argparse
import os
import sys
from pydub import AudioSegment
from pydub.silence import split_on_silence

def process_audio(input_file, output_file, min_silence_len=500, silence_thresh=-16, keep_silence=250, pause_mult=1.2):
    print(f"Chargement du fichier '{input_file}'...")

    if not os.path.isfile(input_file):
        print(f"✗ Fichier introuvable : '{input_file}'")
        return False

    file_size = os.path.getsize(input_file)
    if file_size == 0:
        print(f"✗ Fichier vide : '{input_file}'")
        return False

    try:
        audio = AudioSegment.from_file(input_file)
    except Exception as e:
        print(f"✗ Erreur lors du chargement : {e}")
        print("  Assurez-vous d'avoir installé 'ffmpeg' (ex: 'brew install ffmpeg').")
        return False

    duration_sec = len(audio) / 1000
    print(f"  Durée : {duration_sec:.1f}s | Taille : {file_size / (1024*1024):.1f} MB")

    print("Analyse de l'audio et découpage des phrases...")

    # Découpage basé sur les silences
    # On ajuste le seuil de silence par rapport au volume moyen de l'audio
    chunks = split_on_silence(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=audio.dBFS + silence_thresh,
        keep_silence=keep_silence
    )

    if not chunks:
        print("✗ Aucune phrase détectée. Suggestions :")
        print(f"  • Diminuer --min-silence (actuellement : {min_silence_len} ms)")
        print(f"  • Ajuster --thresh (actuellement : {silence_thresh} dB)")
        return False

    # Filtrer les segments trop courts (< 200ms = probablement du bruit)
    original_count = len(chunks)
    chunks = [c for c in chunks if len(c) >= 200]
    if len(chunks) < original_count:
        print(f"  {original_count - len(chunks)} micro-segment(s) filtré(s).")

    print(f"{len(chunks)} phrases trouvées.")

    # Création d'un segment audio vide pour assembler le résultat
    final_audio = AudioSegment.empty()

    for i, chunk in enumerate(chunks):
        phrase_len = len(chunk)

        # Créer un silence proportionnel à la durée de la phrase
        pause_duration = int(phrase_len * pause_mult)
        silence = AudioSegment.silent(duration=pause_duration)

        # Assembler la phrase suivie de son silence
        final_audio += chunk + silence

        # Affichage de la progression
        print(f"  Phrase {i+1}/{len(chunks)} (durée: {phrase_len/1000:.2f}s, pause: {pause_duration/1000:.2f}s)")

    print(f"Exportation vers '{output_file}'...")
    ext = os.path.splitext(output_file)[1][1:].lower()
    if not ext:
        ext = "mp3"
        output_file += ".mp3"

    try:
        final_audio.export(output_file, format=ext)
    except Exception as e:
        print(f"✗ Erreur d'export : {e}")
        return False

    output_duration = len(final_audio) / 1000
    ratio = output_duration / duration_sec if duration_sec > 0 else 0
    print(f"✅ Terminé ! {output_duration:.1f}s (×{ratio:.1f} de l'original)")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Espace les phrases d'un fichier audio en ajoutant des silences proportionnels.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python process_audio.py cours.mp4 resultat.mp3
  python process_audio.py audio.mp3 output.mp3 --pause-mult 1.5 --keep-silence 400
        """
    )
    parser.add_argument("input_file", help="Chemin vers le fichier source (ex: cours.mp4)")
    parser.add_argument("output_file", help="Chemin vers le fichier de sortie (ex: resultat.mp3)")
    parser.add_argument("--min-silence", type=int, default=700,
                        help="Durée min d'un silence (ms) pour séparer deux phrases (défaut: 700)")
    parser.add_argument("--thresh", type=int, default=-16,
                        help="Seuil de silence relatif au volume moyen en dB (défaut: -16)")
    parser.add_argument("--keep-silence", type=int, default=250,
                        help="Silence naturel conservé au début/fin de chaque segment en ms (défaut: 250)")
    parser.add_argument("--pause-mult", type=float, default=1.2,
                        help="Multiplicateur du temps de pause (défaut: 1.2 = 1.2x la durée de la phrase)")

    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"✗ Le fichier '{args.input_file}' est introuvable.")
        sys.exit(1)

    ok = process_audio(
        args.input_file,
        args.output_file,
        args.min_silence,
        args.thresh,
        args.keep_silence,
        args.pause_mult
    )
    if not ok:
        sys.exit(1)
