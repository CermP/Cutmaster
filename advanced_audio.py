import argparse
import os
import glob
import tempfile
import subprocess
from pathlib import Path
from tqdm import tqdm
from pydub import AudioSegment
from pydub.silence import split_on_silence
from pydub.generators import Sine
from pydub.effects import normalize

def generate_beep(duration=150, freq=1000, volume=-15):
    """Génère un son de type 'bip' pour signaler la fin d'une phrase."""
    return Sine(freq).to_audio_segment(duration=duration).apply_gain(volume)

def change_audio_speed(chunk, speed):
    """Modifie la vitesse de l'audio sans changer la hauteur de voix (nécessite ffmpeg)."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_in, \
         tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_out:
        
        chunk.export(temp_in.name, format="wav")
        cmd = ["ffmpeg", "-y", "-i", temp_in.name, "-filter:a", f"atempo={speed}", temp_out.name]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        new_chunk = AudioSegment.from_wav(temp_out.name)
        os.unlink(temp_in.name)
        os.unlink(temp_out.name)
        return new_chunk

def process_file(input_file, output_file, args):
    print(f"\n--- Traitement de {os.path.basename(input_file)} ---")
    
    try:
        audio = AudioSegment.from_file(input_file)
    except Exception as e:
        print(f"Erreur de lecture de {input_file} : {e}")
        return

    print("Recherche des phrases...")
    chunks = split_on_silence(
        audio,
        min_silence_len=args.min_silence,
        silence_thresh=audio.dBFS + args.thresh,
        keep_silence=250
    )
    
    if not chunks:
        print("Aucune phrase détectée.")
        return
        
    print(f"{len(chunks)} phrases trouvées. Construction de l'audio...")
    
    final_audio = AudioSegment.empty()
    beep = generate_beep()
    
    for i, chunk in enumerate(tqdm(chunks, desc="Avancement")):
        
        if args.normalize:
            chunk = normalize(chunk)
                
        if args.speed != 1.0:
            chunk = change_audio_speed(chunk, args.speed)
                
        pause_len = int(len(chunk) * args.pause_mult)
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
            
    print(f"Sauvegarde de l'audio dans '{output_file}'...")
    final_audio.export(output_file, format="mp3")

def main():
    parser = argparse.ArgumentParser(description="Traitement audio pour l'apprentissage des langues (Version ultra-légère).")
    parser.add_argument("input", help="Fichier MP4/MP3 ou dossier source")
    parser.add_argument("output", help="Fichier de sortie ou dossier de destination (si mode batch)")
    
    parser.add_argument("--min-silence", type=int, default=700, help="Durée min de silence en ms (défaut: 700)")
    parser.add_argument("--thresh", type=int, default=-16, help="Seuil de silence en dB (défaut: -16)")
    
    parser.add_argument("--pause-mult", type=float, default=1.0, help="Multiplicateur du temps de pause (ex: 1.5)")
    parser.add_argument("--speed", type=float, default=1.0, help="Vitesse de la voix (ex: 0.9 pour ralentir)")
    parser.add_argument("--beep", action="store_true", help="Ajouter un petit bip")
    parser.add_argument("--normalize", action="store_true", help="Harmoniser le volume")
    parser.add_argument("--crossfade", type=int, default=50, help="Durée des fondus croisés (défaut: 50)")
    
    args = parser.parse_args()
            
    if os.path.isdir(args.input):
        print(f"Mode Batch: Traitement du dossier '{args.input}'")
        os.makedirs(args.output, exist_ok=True)
        files = []
        for ext in ('*.mp3', '*.mp4', '*.wav', '*.m4a'):
            files.extend(glob.glob(os.path.join(args.input, ext)))
            
        print(f"{len(files)} fichiers trouvés.")
        for f in files:
            base_name = os.path.splitext(os.path.basename(f))[0]
            out_f = os.path.join(args.output, f"{base_name}_processed.mp3")
            process_file(f, out_f, args)
    else:
        if not os.path.exists(args.input):
            print(f"Erreur : '{args.input}' n'existe pas.")
            return
        process_file(args.input, args.output, args)
        
    print("\n✓ Opération terminée avec succès !")

if __name__ == "__main__":
    main()
