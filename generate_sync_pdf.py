import whisper
import json
import sys
import os
import glob
import warnings
import fitz  # PyMuPDF
import re
import difflib

warnings.filterwarnings("ignore")

def extract_text_for_number(pdf_path, text_num):
    doc = fitz.open(pdf_path)
    text = ""
    start_found = False
    
    header_pattern = re.compile(rf"Texte {text_num}\b")
    next_header_pattern = re.compile(rf"Texte {text_num+1}\b")
    
    for page in doc:
        page_text = page.get_text()
        if not start_found:
            if header_pattern.search(page_text):
                start_found = True
                parts = header_pattern.split(page_text, 1)
                text += parts[1]
        else:
            if next_header_pattern.search(page_text):
                parts = next_header_pattern.split(page_text, 1)
                text += parts[0]
                break
            else:
                text += page_text
                
    if not text:
        return ""
        
    # Nettoyage
    text = re.sub(r"Adapted from.*?(\n|$)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\(\d+\s*words\)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"_{5,}", "", text)
    text = re.sub(r"\[\.\.\.\]", "", text)
    text = re.sub(r"\.\.\.", "", text)
    
    # Nettoyer les sauts de lignes et espaces multiples
    text = re.sub(r"\s+", " ", text).strip()
    return text

def clean_word(w):
    return re.sub(r'[^\w\s]', '', w.lower())

def process_file(audio_path, pdf_path, model):
    base_name = os.path.basename(audio_path)
    print(f"\n--- Traitement de {base_name} ---")
    
    match = re.match(r'(\d+)\.mp3', base_name)
    if not match:
        print(f"Ignoré : impossible de déduire le numéro depuis {base_name}")
        return
        
    text_num = int(match.group(1))
    
    print(f"Extraction du 'Texte {text_num}' depuis le PDF...")
    pdf_text = extract_text_for_number(pdf_path, text_num)
    if not pdf_text:
        print(f"Erreur : Texte {text_num} introuvable dans le PDF.")
        return
        
    pdf_words = pdf_text.split()
    print(f"Texte officiel extrait ({len(pdf_words)} mots).")
    
    print("Écoute audio avec Whisper pour obtenir les temps...")
    result = model.transcribe(audio_path, fp16=False, word_timestamps=True)
    
    whisper_words = []
    for segment in result["segments"]:
        for w in segment.get("words", []):
            whisper_words.append({
                "word": w["word"].strip(),
                "start": w["start"],
                "end": w["end"]
            })
            
    # Alignement
    pdf_clean = [clean_word(w) for w in pdf_words]
    wh_clean = [clean_word(w["word"]) for w in whisper_words]
    
    sm = difflib.SequenceMatcher(None, pdf_clean, wh_clean)
    aligned_data = []
    
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for idx in range(i2 - i1):
                aligned_data.append({
                    "start": whisper_words[j1+idx]["start"],
                    "end": whisper_words[j1+idx]["end"],
                    "text": pdf_words[i1+idx]
                })
        elif tag == 'replace':
            if j2 > j1:
                block_start = whisper_words[j1]["start"]
                block_end = whisper_words[j2-1]["end"]
            else:
                # Fallback if no audio matching
                block_start = None
                block_end = None
                
            num_words = i2 - i1
            if num_words == 0: continue
            
            if block_start is not None and block_end is not None:
                duration_per_word = (block_end - block_start) / num_words
                for idx in range(num_words):
                    aligned_data.append({
                        "start": block_start + idx * duration_per_word,
                        "end": block_start + (idx + 1) * duration_per_word,
                        "text": pdf_words[i1+idx]
                    })
            else:
                for idx in range(num_words):
                    aligned_data.append({"start": None, "end": None, "text": pdf_words[i1+idx]})
                    
        elif tag == 'delete':
            for idx in range(i1, i2):
                aligned_data.append({"start": None, "end": None, "text": pdf_words[idx]})
                
    # Second pass: fill Nones
    for i, item in enumerate(aligned_data):
        if item["start"] is None:
            prev_end = 0
            for j in range(i-1, -1, -1):
                if aligned_data[j]["end"] is not None:
                    prev_end = aligned_data[j]["end"]
                    break
                    
            next_start = prev_end
            for j in range(i+1, len(aligned_data)):
                if aligned_data[j]["start"] is not None:
                    next_start = aligned_data[j]["start"]
                    break
                    
            item["start"] = prev_end
            item["end"] = next_start
            
    # Format and save
    final_output = []
    for item in aligned_data:
        final_output.append({
            "start": round(float(item["start"]), 2),
            "end": round(float(item["end"]), 2),
            "text": item["text"]
        })

    out_path = os.path.splitext(audio_path)[0] + ".json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Succès ! {len(final_output)} mots du PDF ont été alignés sur l'audio.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_sync_pdf.py <dossier_ou_fichier_audio> <fichier_pdf>")
        sys.exit(1)
        
    path = sys.argv[1]
    pdf_path = sys.argv[2]
    
    print("Chargement du modèle Whisper...")
    model = whisper.load_model("base")
    
    if os.path.isdir(path):
        files = glob.glob(os.path.join(path, "*.mp3"))
        for f in files:
            process_file(f, pdf_path, model)
    else:
        process_file(path, pdf_path, model)
        
    print("\n🎉 Terminé ! L'alignement parfait est généré.")
