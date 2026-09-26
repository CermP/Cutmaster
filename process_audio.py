import argparse
import os
from pydub import AudioSegment
from pydub.silence import split_on_silence

def process_audio(input_file, output_file, min_silence_len=500, silence_thresh=-16):
    print(f"Chargement du fichier '{input_file}'...")
    try:
        # Pydub utilise ffmpeg en arrière-plan pour lire le MP4
        audio = AudioSegment.from_file(input_file)
    except Exception as e:
        print(f"Erreur lors du chargement du fichier : {e}")
        print("Assurez-vous d'avoir installé 'ffmpeg' sur votre système (ex: 'brew install ffmpeg').")
        return

    print("Analyse de l'audio et découpage des phrases (cela peut prendre un moment)...")
    
    # Découpage basé sur les silences
    # On ajuste le seuil de silence par rapport au volume moyen de l'audio
    chunks = split_on_silence(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=audio.dBFS + silence_thresh,
        keep_silence=250 # Garde 250ms de silence naturel au début et à la fin
    )
    
    if not chunks:
        print("Aucune phrase détectée. Essayez de diminuer --min-silence ou d'ajuster --thresh.")
        return
        
    print(f"{len(chunks)} phrases trouvées.")
    
    # Création d'un segment audio vide pour assembler le résultat
    final_audio = AudioSegment.empty()
    
    for i, chunk in enumerate(chunks):
        phrase_len = len(chunk)
        
        # Créer un silence exactement de la même durée que la phrase prononcée
        silence = AudioSegment.silent(duration=phrase_len)
        
        # Assembler la phrase suivie de son silence
        final_audio += chunk + silence
        
        # Affichage de la progression
        print(f"Traitement de la phrase {i+1}/{len(chunks)} (durée: {phrase_len/1000:.2f}s)")
        
    print(f"Exportation vers '{output_file}'...")
    # On détermine le format d'exportation en fonction de l'extension (ex: mp3)
    ext = os.path.splitext(output_file)[1][1:].lower()
    if not ext:
        ext = "mp3"
        output_file += ".mp3"
        
    final_audio.export(output_file, format=ext)
    print("Terminé avec succès !")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Espace les phrases d'un fichier audio en ajoutant des silences de même durée.")
    parser.add_argument("input_file", help="Chemin vers le fichier source (ex: cours.mp4)")
    parser.add_argument("output_file", help="Chemin vers le fichier de sortie (ex: resultat.mp3)")
    parser.add_argument("--min-silence", type=int, default=700, help="Durée min d'un silence (en ms) pour séparer deux phrases (défaut: 700)")
    parser.add_argument("--thresh", type=int, default=-16, help="Seuil de silence relatif au volume moyen en dB (défaut: -16)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        print(f"Erreur : Le fichier '{args.input_file}' est introuvable.")
    else:
        process_audio(args.input_file, args.output_file, args.min_silence, args.thresh)
