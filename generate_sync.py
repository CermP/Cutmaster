import whisper
import json
import sys
import os
import glob
import warnings

warnings.filterwarnings("ignore")

def process_file(audio_path, model):
    print(f"\n--- Traitement de {os.path.basename(audio_path)} ---")
    result = model.transcribe(audio_path, fp16=False, word_timestamps=True)

    words_data = []

    for segment in result["segments"]:
        for word in segment.get("words", []):
            words_data.append({
                "start": round(float(word["start"]), 2),
                "end": round(float(word["end"]), 2),
                "text": word["word"].strip()
            })

    out_path = os.path.splitext(audio_path)[0] + ".json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(words_data, f, indent=2, ensure_ascii=False)
        
    print(f"✅ {len(words_data)} mots parfaitement chronométrés.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_sync.py <dossier_ou_fichier_audio>")
        sys.exit(1)
        
    path = sys.argv[1]
    
    print("Chargement du modèle Whisper...")
    model = whisper.load_model("base")
    
    if os.path.isdir(path):
        print(f"Mode batch : traitement du dossier {path}")
        files = glob.glob(os.path.join(path, "*.mp3"))
        for f in files:
            process_file(f, model)
    else:
        process_file(path, model)
        
    print("\n🎉 Terminé ! Les fichiers .json sont prêts.")
