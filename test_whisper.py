import whisper
import json
import os
import sys
import warnings

# Ignorer les warnings habituels de Whisper/PyTorch
warnings.filterwarnings("ignore")

def process_audio(audio_path):
    print("Chargement du modèle Whisper (modèle 'base' pour être rapide)...")
    model = whisper.load_model("base")

    print(f"Écoute et transcription de : {os.path.basename(audio_path)} ...")
    # fp16=False est recommandé sur CPU/Mac classique pour éviter un warning
    result = model.transcribe(audio_path, fp16=False)

    segments = []
    for segment in result["segments"]:
        segments.append({
            "id": segment["id"],
            "start": round(segment["start"], 2),
            "end": round(segment["end"], 2),
            "text": segment["text"].strip()
        })

    out_path = os.path.splitext(audio_path)[0] + ".json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ Succès ! {len(segments)} phrases ont été chronométrées.")
    print(f"Fichier de synchronisation sauvegardé ici : {out_path}")
    
    # Afficher un petit aperçu
    print("\nAperçu des 3 premières phrases :")
    for s in segments[:3]:
        print(f"[{s['start']}s -> {s['end']}s] {s['text']}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_whisper.py <chemin_vers_audio>")
        sys.exit(1)
        
    process_audio(sys.argv[1])
