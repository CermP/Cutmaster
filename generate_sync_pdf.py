import whisper
import json
import sys
import os
import glob
import warnings
import argparse
import time
import re
import difflib

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

warnings.filterwarnings("ignore")

# ── Constantes ──────────────────────────────────────────────────────────
SUPPORTED_EXTENSIONS = ("*.mp3", "*.wav", "*.m4a", "*.mp4", "*.ogg", "*.flac")

DEFAULT_PROMPT = (
    "This is a clear English academic text read aloud, "
    "with proper punctuation and complete sentences."
)

# ── Extraction PDF ──────────────────────────────────────────────────────

def extract_text_for_number(pdf_path, text_num):
    """Extrait le texte numéroté depuis un PDF de cours (ex: 'Texte 42')."""
    if fitz is None:
        print("  ✗ PyMuPDF (fitz) n'est pas installé. Lancez : pip install pymupdf")
        return ""

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"  ✗ Impossible d'ouvrir le PDF : {e}")
        return ""

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

    # Nettoyage amélioré
    text = re.sub(r"Adapted from.*?(\n|$)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\(\d+\s*words\)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"_{5,}", "", text)
    text = re.sub(r"\[\.\.\.\]", "", text)
    text = re.sub(r"\.\.\.", "", text)
    # Supprimer les numéros de page isolés
    text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
    # Supprimer les headers/footers récurrents (lignes très courtes en haut/bas de page)
    text = re.sub(r"(?:^|\n)\s*(?:Page|CC-INP|Annales)\s*\d*\s*(?:\n|$)", "\n", text, flags=re.IGNORECASE)

    # Nettoyer les sauts de lignes et espaces multiples
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Normalisation pour alignement ───────────────────────────────────────

def normalize_word(w):
    """Normalisation agressive pour comparaison : minuscule, sans ponctuation,
    avec simplification phonétique des cas courants."""
    w = w.lower().strip()
    w = re.sub(r'[^a-z0-9\s]', '', w)
    w = w.strip()
    return w


def phonetic_similarity(w1, w2):
    """Score de similarité entre deux mots, tenant compte de l'écriture
    phonétiquement proche (ex: 'colour' vs 'color')."""
    n1, n2 = normalize_word(w1), normalize_word(w2)
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0

    # Ratio de similarité difflib (Ratcliff/Obershelp)
    ratio = difflib.SequenceMatcher(None, n1, n2).ratio()

    # Bonus si l'un est préfixe de l'autre (pluriel, conjugaison)
    if n1.startswith(n2) or n2.startswith(n1):
        ratio = max(ratio, 0.85)

    return ratio


def estimate_word_duration(word):
    """Estime une durée relative d'un mot basée sur sa longueur en syllables approximatives."""
    w = re.sub(r'[^a-zA-Z]', '', word.lower())
    if not w:
        return 1.0

    # Estimation simple du nombre de syllabes
    vowels = 'aeiouy'
    count = 0
    prev_vowel = False
    for ch in w:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel

    # 'e' muet final
    if w.endswith('e') and count > 1:
        count -= 1

    return max(1.0, float(count))


# ── Alignement amélioré ────────────────────────────────────────────────

def align_words(pdf_words, whisper_words):
    """Aligne les mots du PDF sur les timestamps Whisper avec scoring de confiance."""

    pdf_clean = [normalize_word(w) for w in pdf_words]
    wh_clean = [normalize_word(w["word"]) for w in whisper_words]

    sm = difflib.SequenceMatcher(None, pdf_clean, wh_clean, autojunk=False)
    aligned_data = []

    stats = {
        "exact_matches": 0,
        "fuzzy_matches": 0,
        "interpolated": 0,
        "total_pdf_words": len(pdf_words),
        "total_whisper_words": len(whisper_words),
    }

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for idx in range(i2 - i1):
                aligned_data.append({
                    "start": whisper_words[j1 + idx]["start"],
                    "end": whisper_words[j1 + idx]["end"],
                    "text": pdf_words[i1 + idx],
                    "confidence": 1.0,
                    "method": "exact"
                })
                stats["exact_matches"] += 1

        elif tag == 'replace':
            pdf_block = pdf_words[i1:i2]
            wh_block = whisper_words[j1:j2]

            if not wh_block:
                # Mots du PDF sans correspondance audio → interpolation
                for idx in range(len(pdf_block)):
                    aligned_data.append({
                        "start": None, "end": None,
                        "text": pdf_block[idx],
                        "confidence": 0.0,
                        "method": "no_audio"
                    })
                    stats["interpolated"] += 1
                continue

            block_start = wh_block[0]["start"]
            block_end = wh_block[-1]["end"]
            block_duration = block_end - block_start

            if len(pdf_block) == 0:
                continue

            # Calculer la similarité moyenne du bloc
            avg_similarity = 0.0
            pairs = min(len(pdf_block), len(wh_block))
            for k in range(pairs):
                avg_similarity += phonetic_similarity(pdf_block[k], wh_block[k]["word"])
            avg_similarity /= max(pairs, 1)

            # Répartir le temps proportionnellement à la durée estimée de chaque mot
            durations = [estimate_word_duration(w) for w in pdf_block]
            total_duration = sum(durations)

            cursor = block_start
            for idx, word in enumerate(pdf_block):
                word_share = durations[idx] / total_duration
                word_duration = block_duration * word_share

                aligned_data.append({
                    "start": cursor,
                    "end": cursor + word_duration,
                    "text": word,
                    "confidence": round(min(avg_similarity, 0.9), 2),
                    "method": "fuzzy"
                })
                cursor += word_duration
                stats["fuzzy_matches"] += 1

        elif tag == 'delete':
            # Mots dans le PDF mais pas dans Whisper
            for idx in range(i1, i2):
                aligned_data.append({
                    "start": None, "end": None,
                    "text": pdf_words[idx],
                    "confidence": 0.0,
                    "method": "interpolated"
                })
                stats["interpolated"] += 1

    return aligned_data, stats


def fill_none_timestamps(aligned_data):
    """Seconde passe : interpole les timestamps manquants de manière intelligente."""
    for i, item in enumerate(aligned_data):
        if item["start"] is not None:
            continue

        # Trouver le timestamp précédent valide
        prev_end = 0.0
        for j in range(i - 1, -1, -1):
            if aligned_data[j]["end"] is not None:
                prev_end = aligned_data[j]["end"]
                break

        # Trouver le timestamp suivant valide
        next_start = prev_end
        for j in range(i + 1, len(aligned_data)):
            if aligned_data[j]["start"] is not None:
                next_start = aligned_data[j]["start"]
                break

        # Compter combien de mots None consécutifs partagent cet intervalle
        none_start = i
        while none_start > 0 and aligned_data[none_start - 1]["start"] is None:
            none_start -= 1

        none_end = i
        while none_end < len(aligned_data) - 1 and aligned_data[none_end + 1]["start"] is None:
            none_end += 1

        # Répartir proportionnellement à la durée estimée
        none_words = [aligned_data[k]["text"] for k in range(none_start, none_end + 1)]
        durations = [estimate_word_duration(w) for w in none_words]
        total_d = sum(durations)
        gap = next_start - prev_end

        cursor = prev_end
        for k in range(none_start, none_end + 1):
            idx_in_block = k - none_start
            word_share = durations[idx_in_block] / total_d if total_d > 0 else 1.0 / len(none_words)
            word_duration = gap * word_share

            aligned_data[k]["start"] = cursor
            aligned_data[k]["end"] = cursor + word_duration
            cursor += word_duration

    return aligned_data


# ── Traitement principal ────────────────────────────────────────────────

def process_file(audio_path, pdf_path, model, args):
    base_name = os.path.basename(audio_path)
    print(f"\n{'─' * 50}")
    print(f"  Traitement de {base_name}")
    print(f"{'─' * 50}")

    # Validation
    if not os.path.isfile(audio_path):
        print(f"  ✗ Fichier audio introuvable : {audio_path}")
        return False

    # Déduire le numéro du texte depuis le nom de fichier
    match = re.match(r'(\d+)\.(?:mp3|wav|m4a|mp4|ogg|flac)', base_name)
    if not match:
        print(f"  ✗ Impossible de déduire le numéro depuis '{base_name}'")
        print(f"    Le fichier doit être nommé '<numéro>.mp3' (ex: 42.mp3)")
        return False

    text_num = int(match.group(1))

    # Extraction du texte PDF
    print(f"  📄 Extraction du 'Texte {text_num}' depuis le PDF...")
    pdf_text = extract_text_for_number(pdf_path, text_num)
    if not pdf_text:
        print(f"  ✗ Texte {text_num} introuvable dans le PDF.")
        return False

    pdf_words = pdf_text.split()
    print(f"  ✅ Texte officiel extrait ({len(pdf_words)} mots).")

    # Transcription Whisper
    print(f"  🎧 Transcription audio avec Whisper (modèle: {args.model})...")
    start_time = time.time()

    try:
        transcribe_opts = {
            "fp16": False,
            "word_timestamps": True,
            "language": args.language,
        }
        if args.prompt:
            transcribe_opts["initial_prompt"] = args.prompt
        if args.temperature is not None:
            transcribe_opts["temperature"] = args.temperature

        result = model.transcribe(audio_path, **transcribe_opts)
    except Exception as e:
        print(f"  ✗ Erreur de transcription : {e}")
        return False

    whisper_words = []
    for segment in result["segments"]:
        for w in segment.get("words", []):
            whisper_words.append({
                "word": w["word"].strip(),
                "start": w["start"],
                "end": w["end"]
            })

    elapsed = time.time() - start_time
    print(f"  ✅ Whisper : {len(whisper_words)} mots transcrits en {elapsed:.1f}s")

    if not whisper_words:
        print("  ✗ Aucun mot détecté par Whisper.")
        return False

    # Alignement amélioré
    print("  🔗 Alignement texte officiel ↔ audio...")
    aligned_data, stats = align_words(pdf_words, whisper_words)

    # Remplir les timestamps manquants
    aligned_data = fill_none_timestamps(aligned_data)

    # Formatage final (sans les métadonnées internes)
    final_output = []
    confidence_sum = 0.0
    low_confidence_count = 0

    for item in aligned_data:
        start = round(float(item["start"]), 3) if item["start"] is not None else 0.0
        end = round(float(item["end"]), 3) if item["end"] is not None else 0.0

        final_output.append({
            "start": start,
            "end": end,
            "text": item["text"]
        })

        confidence_sum += item.get("confidence", 0.5)
        if item.get("confidence", 1.0) < 0.5:
            low_confidence_count += 1

    # Sauvegarde
    out_path = os.path.splitext(audio_path)[0] + ".json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)

    # Rapport de qualité
    avg_confidence = confidence_sum / len(aligned_data) if aligned_data else 0
    exact_pct = (stats["exact_matches"] / stats["total_pdf_words"] * 100) if stats["total_pdf_words"] > 0 else 0

    if exact_pct > 90:
        quality = "EXCELLENT"
    elif exact_pct > 75:
        quality = "BON"
    elif exact_pct > 50:
        quality = "ACCEPTABLE"
    else:
        quality = "ATTENTION REQUISE"

    print(f"\n  📊 Rapport de qualité :")
    print(f"     Qualité globale    : {quality}")
    print(f"     Correspondances    : {stats['exact_matches']}/{stats['total_pdf_words']} exactes ({exact_pct:.0f}%)")
    print(f"     Matches flous      : {stats['fuzzy_matches']}")
    print(f"     Interpolations     : {stats['interpolated']}")
    print(f"     Confiance moyenne  : {avg_confidence:.0%}")
    if low_confidence_count > 0:
        print(f"     ⚠ {low_confidence_count} mot(s) à faible confiance")

    print(f"\n  📁 Sauvegardé → {out_path}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Aligne un texte PDF officiel sur un fichier audio via Whisper.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python generate_sync_pdf.py 1.mp3 cours.pdf
  python generate_sync_pdf.py ./audio/ cours.pdf --model medium
  python generate_sync_pdf.py 42.mp3 annales.pdf --model large --language en
        """
    )

    parser.add_argument("path", help="Fichier audio ou dossier d'audios (nommés <numéro>.mp3)")
    parser.add_argument("pdf", help="Fichier PDF contenant les textes numérotés")
    parser.add_argument(
        "--model", default="medium",
        choices=["tiny", "base", "small", "medium", "large", "turbo"],
        help="Modèle Whisper (défaut: medium)"
    )
    parser.add_argument("--language", default="en", help="Code langue ISO (défaut: en)")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT, help="Prompt de contexte initial")
    parser.add_argument("--temperature", type=float, default=0.0, help="Température de décodage (défaut: 0.0)")

    args = parser.parse_args()

    # Validation PDF
    if not os.path.isfile(args.pdf):
        print(f"✗ Fichier PDF introuvable : {args.pdf}")
        sys.exit(1)

    if fitz is None:
        print("✗ PyMuPDF requis. Installez-le avec : pip install pymupdf")
        sys.exit(1)

    print("╔══════════════════════════════════════════════════╗")
    print("║       Diclo — Alignement PDF ↔ Audio (v2)      ║")
    print("╚══════════════════════════════════════════════════╝")
    print(f"  Modèle   : {args.model}")
    print(f"  Langue   : {args.language}")
    print(f"  PDF      : {os.path.basename(args.pdf)}")
    print()

    print("Chargement du modèle Whisper...")
    try:
        model = whisper.load_model(args.model)
    except Exception as e:
        print(f"✗ Impossible de charger le modèle '{args.model}' : {e}")
        sys.exit(1)

    print(f"Modèle '{args.model}' chargé.\n")

    success_count = 0
    fail_count = 0

    if os.path.isdir(args.path):
        files = []
        for ext in SUPPORTED_EXTENSIONS:
            files.extend(glob.glob(os.path.join(args.path, ext)))
        files.sort()

        if not files:
            print(f"  ✗ Aucun fichier audio trouvé dans {args.path}")
            sys.exit(1)

        print(f"  Mode batch : {len(files)} fichier(s)\n")

        for f in files:
            ok = process_file(f, args.pdf, model, args)
            if ok:
                success_count += 1
            else:
                fail_count += 1
    else:
        if not os.path.exists(args.path):
            print(f"✗ '{args.path}' n'existe pas.")
            sys.exit(1)

        ok = process_file(args.path, args.pdf, model, args)
        if ok:
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'═' * 50}")
    print(f"  🎉 Terminé ! {success_count} réussi(s), {fail_count} échoué(s).")
    print(f"{'═' * 50}")


if __name__ == "__main__":
    main()
