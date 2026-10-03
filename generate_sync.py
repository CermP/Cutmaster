import whisper
import json
import sys
import os
import glob
import warnings
import argparse
import time

warnings.filterwarnings("ignore")

# ── Constantes ──────────────────────────────────────────────────────────
SUPPORTED_EXTENSIONS = ("*.mp3", "*.wav", "*.m4a", "*.mp4", "*.ogg", "*.flac")

# Prompt de contexte pour guider Whisper sur le domaine (anglais académique)
DEFAULT_PROMPT = (
    "This is a clear English academic text read aloud, "
    "with proper punctuation and complete sentences."
)


def compute_quality_metrics(words_data):
    """Calcule des métriques de qualité sur la transcription mot à mot."""
    if not words_data:
        return {"total_words": 0, "quality": "EMPTY"}

    total = len(words_data)
    issues = []

    # 1. Mots avec durée suspecte (< 30ms ou > 3s)
    short_words = 0
    long_words = 0
    for w in words_data:
        duration = w["end"] - w["start"]
        if duration < 0.03:
            short_words += 1
        elif duration > 3.0:
            long_words += 1

    # 2. Gaps entre mots consécutifs (> 2s sans raison)
    large_gaps = 0
    for i in range(1, len(words_data)):
        gap = words_data[i]["start"] - words_data[i - 1]["end"]
        if gap > 2.0:
            large_gaps += 1

    # 3. Chevauchements temporels
    overlaps = 0
    for i in range(1, len(words_data)):
        if words_data[i]["start"] < words_data[i - 1]["end"] - 0.01:
            overlaps += 1

    # 4. Score global
    issue_count = short_words + long_words + large_gaps + overlaps
    ratio = issue_count / total if total > 0 else 0

    if ratio < 0.02:
        quality = "EXCELLENT"
    elif ratio < 0.05:
        quality = "BON"
    elif ratio < 0.15:
        quality = "ACCEPTABLE"
    else:
        quality = "ATTENTION REQUISE"

    metrics = {
        "total_words": total,
        "quality": quality,
        "short_words": short_words,
        "long_words": long_words,
        "large_gaps": large_gaps,
        "overlaps": overlaps,
        "issue_ratio": round(ratio * 100, 1),
    }

    if short_words > 0:
        issues.append(f"  ⚠ {short_words} mot(s) avec durée < 30ms")
    if long_words > 0:
        issues.append(f"  ⚠ {long_words} mot(s) avec durée > 3s")
    if large_gaps > 0:
        issues.append(f"  ⚠ {large_gaps} gap(s) > 2s entre mots")
    if overlaps > 0:
        issues.append(f"  ⚠ {overlaps} chevauchement(s) temporel(s)")

    metrics["issues_detail"] = issues
    return metrics


def fix_overlaps(words_data):
    """Corrige les chevauchements temporels entre mots consécutifs."""
    for i in range(1, len(words_data)):
        if words_data[i]["start"] < words_data[i - 1]["end"]:
            # Placer la frontière au milieu du chevauchement
            mid = (words_data[i]["start"] + words_data[i - 1]["end"]) / 2
            words_data[i - 1]["end"] = round(mid, 3)
            words_data[i]["start"] = round(mid, 3)
    return words_data


def process_file(audio_path, model, args):
    print(f"\n{'─' * 50}")
    print(f"  Traitement de {os.path.basename(audio_path)}")
    print(f"{'─' * 50}")

    # Validation du fichier
    if not os.path.isfile(audio_path):
        print(f"  ✗ Fichier introuvable : {audio_path}")
        return False

    file_size = os.path.getsize(audio_path)
    if file_size == 0:
        print(f"  ✗ Fichier vide : {audio_path}")
        return False

    print(f"  Taille : {file_size / (1024*1024):.1f} MB")

    start_time = time.time()

    try:
        # Transcription avec paramètres optimisés
        transcribe_opts = {
            "fp16": False,
            "word_timestamps": True,
            "language": args.language,
        }

        # Prompt de contexte pour améliorer la précision
        if args.prompt:
            transcribe_opts["initial_prompt"] = args.prompt

        # Température basse = plus déterministe, plus précis
        if args.temperature is not None:
            transcribe_opts["temperature"] = args.temperature

        result = model.transcribe(audio_path, **transcribe_opts)

    except Exception as e:
        print(f"  ✗ Erreur de transcription : {e}")
        print("    Vérifiez que FFmpeg est installé et que le fichier n'est pas corrompu.")
        return False

    words_data = []

    for segment in result["segments"]:
        for word in segment.get("words", []):
            words_data.append({
                "start": round(float(word["start"]), 3),
                "end": round(float(word["end"]), 3),
                "text": word["word"].strip()
            })

    if not words_data:
        print("  ✗ Aucun mot détecté dans la transcription.")
        return False

    # Post-traitement : corriger les chevauchements
    words_data = fix_overlaps(words_data)

    # Métriques de qualité
    metrics = compute_quality_metrics(words_data)

    elapsed = time.time() - start_time

    # Sauvegarde
    out_path = os.path.splitext(audio_path)[0] + ".json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(words_data, f, indent=2, ensure_ascii=False)

    # Rapport
    print(f"  ✅ {metrics['total_words']} mots chronométrés en {elapsed:.1f}s")
    print(f"  📊 Qualité : {metrics['quality']} ({metrics['issue_ratio']}% d'anomalies)")

    for detail in metrics.get("issues_detail", []):
        print(detail)

    print(f"  📁 Sauvegardé → {out_path}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Génère un fichier de synchronisation mot-à-mot (.json) à partir d'un audio, via OpenAI Whisper.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python generate_sync.py audio.mp3
  python generate_sync.py ./dossier/ --model medium --language en
  python generate_sync.py audio.mp3 --model large --prompt "Scientific vocabulary"
        """
    )

    parser.add_argument("path", help="Fichier audio ou dossier contenant des fichiers audio")
    parser.add_argument(
        "--model", default="medium",
        choices=["tiny", "base", "small", "medium", "large", "turbo"],
        help="Modèle Whisper à utiliser (défaut: medium). Plus le modèle est grand, plus il est précis mais lent."
    )
    parser.add_argument(
        "--language", default="en",
        help="Code langue ISO (défaut: en). Forcer la langue évite les erreurs de détection automatique."
    )
    parser.add_argument(
        "--prompt", default=DEFAULT_PROMPT,
        help="Prompt de contexte initial pour guider Whisper (vocabulaire, domaine, style)."
    )
    parser.add_argument(
        "--temperature", type=float, default=0.0,
        help="Température de décodage (défaut: 0.0 = déterministe). Augmenter pour plus de variété."
    )

    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════╗")
    print("║          Diclo — Synchronisation Whisper        ║")
    print("╚══════════════════════════════════════════════════╝")
    print(f"  Modèle   : {args.model}")
    print(f"  Langue   : {args.language}")
    print(f"  Prompt   : {args.prompt[:60]}{'...' if len(args.prompt) > 60 else ''}")
    print()

    print("Chargement du modèle Whisper...")
    try:
        model = whisper.load_model(args.model)
    except Exception as e:
        print(f"✗ Impossible de charger le modèle '{args.model}' : {e}")
        sys.exit(1)

    print(f"Modèle '{args.model}' chargé avec succès.\n")

    success_count = 0
    fail_count = 0

    if os.path.isdir(args.path):
        print(f"Mode batch : traitement du dossier {args.path}")
        files = []
        for ext in SUPPORTED_EXTENSIONS:
            files.extend(glob.glob(os.path.join(args.path, ext)))

        files.sort()

        if not files:
            print(f"  ✗ Aucun fichier audio trouvé dans {args.path}")
            sys.exit(1)

        print(f"  {len(files)} fichier(s) trouvé(s).\n")

        for f in files:
            ok = process_file(f, model, args)
            if ok:
                success_count += 1
            else:
                fail_count += 1
    else:
        if not os.path.exists(args.path):
            print(f"✗ Erreur : '{args.path}' n'existe pas.")
            sys.exit(1)

        ok = process_file(args.path, model, args)
        if ok:
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'═' * 50}")
    print(f"  🎉 Terminé ! {success_count} réussi(s), {fail_count} échoué(s).")
    print(f"{'═' * 50}")


if __name__ == "__main__":
    main()
