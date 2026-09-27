import json
import glob
import re
import os

def extract_pdf_titles(pdf_path):
    titles = {}
    try:
        import fitz
        if os.path.exists(pdf_path):
            doc = fitz.open(pdf_path)
            pages_text = [p.get_text() for p in doc]
            full_text = "\n".join(pages_text)
            lines = [l.strip() for l in full_text.splitlines() if l.strip()]

            for i in range(1, 135):
                for idx, l in enumerate(lines):
                    if re.match(rf"^Texte\s+{i}$", l):
                        title_parts = []
                        for next_l in lines[idx+1:idx+6]:
                            letters = [c for c in next_l if c.isalpha()]
                            if not letters:
                                continue
                            upper_count = sum(1 for c in letters if c.isupper())
                            if upper_count / len(letters) > 0.7:
                                title_parts.append(next_l)
                            else:
                                break
                        clean_t = " ".join(title_parts).strip()
                        clean_t = re.sub(r"Adapted from.*", "", clean_t, flags=re.IGNORECASE).strip()
                        titles[i] = clean_t
                        break
    except Exception as e:
        print(f"Warning: could not extract titles from PDF: {e}")
    return titles

def generate_index():
    source_dir = "Fichiers audio/cc-inp 2026 annales anglais"
    pdf_path = "Fichiers audio/Recueil de textes de l'épreuve orale.pdf"
    output_path = "webapp/audio/lessons.json"
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    pdf_titles = extract_pdf_titles(pdf_path)
    
    files = sorted(glob.glob(os.path.join(source_dir, "*.json")), 
                   key=lambda x: int(re.search(r"(\d+)\.json", os.path.basename(x)).group(1)))
    
    lessons = []
    for f in files:
        num = int(re.search(r"(\d+)\.json", os.path.basename(f)).group(1))
        with open(f, "r", encoding="utf-8") as jf:
            data = json.load(jf)
            
        title = pdf_titles.get(num)
        if not title:
            words = [w["text"] for w in data]
            title_words = []
            for w in words[:25]:
                clean = re.sub(r"[^\w]", "", w)
                if not clean:
                    title_words.append(w)
                    continue
                if clean.isupper() or clean.isdigit():
                    title_words.append(w)
                else:
                    break
            title = " ".join(title_words).strip() or f"Texte {num}"
            
        # Clean quotes and dashes
        title = title.replace('“', '"').replace('”', '"').replace('’', "'")
        
        duration_sec = round(data[-1]["end"], 1) if data else 0
        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        duration_str = f"{mins}m {secs:02d}s" if mins > 0 else f"{secs}s"
        
        lessons.append({
            "id": num,
            "title": title,
            "wordsCount": len(data),
            "durationSec": duration_sec,
            "duration": duration_str,
            "audioUrl": f"audio/cc-inp/{num}.mp3",
            "jsonUrl": f"audio/cc-inp/{num}.json"
        })
        
    with open(output_path, "w", encoding="utf-8") as out:
        json.dump(lessons, out, indent=2, ensure_ascii=False)
        
    print(f"Index successfully created with {len(lessons)} lessons at {output_path}")

if __name__ == "__main__":
    generate_index()
