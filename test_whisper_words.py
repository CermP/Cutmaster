import whisper
import json
import sys
import warnings

warnings.filterwarnings("ignore")

audio_path = sys.argv[1]
print("Loading model...")
model = whisper.load_model("base")
print("Transcribing with word timestamps...")
result = model.transcribe(audio_path, fp16=False, word_timestamps=True)

sentences = []
current_sentence = []
current_start = None

for segment in result["segments"]:
    for word in segment.get("words", []):
        if current_start is None:
            current_start = word["start"]
        
        current_sentence.append(word["word"])
        
        # Check if the word ends with terminal punctuation
        text = word["word"].strip()
        if text.endswith('.') or text.endswith('!') or text.endswith('?') or text.endswith('."') or text.endswith('?"'):
            sentences.append({
                "start": round(current_start, 2),
                "end": round(word["end"], 2),
                "text": "".join(current_sentence).strip()
            })
            current_sentence = []
            current_start = None

# If there are left-over words
if current_sentence:
    sentences.append({
        "start": round(current_start, 2),
        "end": round(result["segments"][-1]["end"], 2),
        "text": "".join(current_sentence).strip()
    })

for s in sentences[:5]:
    print(s)

with open(audio_path.replace('.mp3', '.json'), 'w') as f:
    json.dump(sentences, f, indent=2, ensure_ascii=False)
