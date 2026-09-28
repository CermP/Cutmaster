# CutMaster 🎙️

> **L'outil ultime d'entraînement oral et de prononciation.**  
> Maîtrisez l'élocution anglaise grâce à la méthode du Shadowing avec alignement parfait texte-audio, et préparez vos propres fichiers grâce à un outil de découpage intelligent intégré.

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://cermp.github.io/Cutmaster/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-In--Browser-orange?style=for-the-badge)](https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API)
[![OpenAI Whisper](https://img.shields.io/badge/AI-Whisper_Speech--to--Text-violet?style=for-the-badge)](https://github.com/openai/whisper)

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités principales](#-fonctionnalités-principales)
  - [1. Application Web (100% Client-Side)](#1-application-web-client-side)
  - [2. Suite CLI & IA Python](#2-suite-cli--ia-python)
- [Démonstration en direct](#-démonstration-en-direct)
- [Installation & Démarrage](#-installation--démarrage)
  - [Utiliser la WebApp](#utiliser-lapplication-web)
  - [Utiliser les outils Python](#utiliser-les-outils-python)
- [Guide d'utilisation](#-guide-dutilisation)
  - [Entraînement au Shadowing (Outil principal)](#mode-shadowing)
  - [Découpage audio (Option Web & CLI)](#mode-découpage-audio)
  - [Génération de synchronisation avec Whisper & PDF](#génération-de-synchronisation-ia)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Licence](#-licence)

---

## 🌟 Aperçu

**CutMaster** est conçu pour les apprenants de langues étrangères, professeurs, créateurs de contenu et podcasteurs.

Il répond à une problématique majeure de la méthode d'apprentissage par **Shadowing** (répétition à voix haute) :
- Les enregistrements natifs s'enchaînent souvent trop rapidement sans laisser le temps de répéter.
- Il est fastidieux d'aligner manuellement un texte avec un fichier audio.

CutMaster offre une double réponse :
1. **Une application Web autonome** exécutée directement dans le navigateur (aucune donnée n'est envoyée à un serveur).
2. **Une boîte à outils Python avancée** s'appuyant sur OpenAI Whisper pour chronométrer et aligner précisément textes, PDFs et flux audio.

---

## ✨ Fonctionnalités principales

### 1. Application Web (Client-Side)

Accessible sans installation depuis n'importe quel navigateur moderne :

- 🗣️ **CutMaster (Entraînement au Shadowing)** :
  - 📚 **Bibliothèque intégrée (Annales CC-INP)** : Accès direct en un clic aux 134 textes officiels synchronisés mot à mot, avec moteur de recherche instantané, aperçu (durée, nombre de mots) et navigation fluide entre les textes (*Précédent* / *Suivant*).
  - 📁 **Import Personnalisé** : Support complet pour importer n'importe quel fichier audio `.mp3` et de synchronisation `.json` tiers.
  - Découpage dynamique selon 3 niveaux de granularité : **Phrases**, **Virgules** (clauses), ou **Mots**.
  - Mode **Auto-pause** paramétrable (multiplicateur de durée de pause de 1× à 4×).
  - Surlignage karaoké en temps réel du texte prononcé.

- ✂️ **Option de Découpage Intelligent** :
  - Détection automatique des pauses et des silences pour préparer vos propres fichiers.
  - Insertion de silences proportionnels après chaque phrase pour laisser le temps de répéter.
  - Visualisation en direct de l'onde sonore via [WaveSurfer.js](https://wavesurfer.xyz/).
  - Export direct en `.wav` ou en `.mp3` (encodé à la volée via `lamejs`).

### 2. Suite CLI & IA Python

Pour les traitements par lot et les fonctionnalités d'analyse avancées :

- ⚡ `advanced_audio.py` :
  - Traitement d'un fichier unique ou d'un dossier complet (mode batch).
  - **Détection de silence adaptative** : analyse le profil de volume local au lieu d'un seuil global fixe, idéal pour les audios avec bruit de fond.
  - Fusion automatique des micro-segments (bruits de bouche, clics) pour éviter les faux positifs.
  - Ajustement de la vitesse vocale sans modifier la tonalité/hauteur (filtre `atempo` via FFmpeg).
  - Bips sonores optionnels de fin de phrase pour rythmer l'exercice.
  - Normalisation sonore automatique et fondus croisés (*crossfade*).
  - Bornes min/max configurables sur la durée des pauses.
- 🤖 `generate_sync.py` :
  - Transcription automatique avec horodatage mot à mot via **OpenAI Whisper**.
  - **Modèle configurable** (`tiny` à `large`, défaut : `medium` pour le meilleur rapport précision/vitesse).
  - **Langue explicite** et **prompt de contexte** pour guider Whisper sur le domaine/vocabulaire.
  - **Rapport de qualité automatique** : détecte les mots trop courts/longs, gaps, chevauchements.
  - Correction automatique des chevauchements temporels entre mots.
- 📄 `generate_sync_pdf.py` :
  - Extraction de texte officiel depuis un fichier de cours au format PDF (via PyMuPDF).
  - **Alignement amélioré** avec scoring de similarité phonétique (gère les variantes orthographiques).
  - **Répartition proportionnelle** du temps basée sur l'estimation syllabique (au lieu d'une distribution uniforme).
  - **Rapport de qualité** : taux d'alignement exact, matches flous, interpolations, confiance moyenne.

---

## 🚀 Démonstration en direct

L'interface web est automatiquement déployée sur **GitHub Pages** :

👉 **[Accéder à CutMaster en ligne](https://cermp.github.io/Cutmaster/)**

---

## 🛠️ Installation & Démarrage

### Utiliser l'application Web

#### En ligne
Rendez-vous simplement sur [https://cermp.github.io/Cutmaster/](https://cermp.github.io/Cutmaster/).

#### En local
Ouvrez simplement le fichier `webapp/index.html` dans votre navigateur ou lancez un serveur HTTP local :

```bash
cd webapp
python3 -m http.server 8080
```
Puis accédez à `http://localhost:8080`.

---

### Utiliser les outils Python

#### 1. Prérequis système
- **Python 3.10+**
- **FFmpeg** (indispensable pour le décodage et l'encodage audio) :
  - **macOS** : `brew install ffmpeg`
  - **Ubuntu / Debian** : `sudo apt update && sudo apt install ffmpeg`
  - **Windows** : via [ffmpeg.org](https://ffmpeg.org/download.html) ou `winget install Gyan.FFmpeg`

#### 2. Cloner le dépôt et configurer l'environnement

```bash
git clone https://github.com/CermP/Cutmaster.git
cd Cutmaster

# Création de l'environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installation des dépendances de base
pip install -r requirements.txt
```

#### 3. Dépendances optionnelles pour l'IA (Whisper & PDF)

Si vous souhaitez utiliser les scripts de synchronisation intelligente :

```bash
pip install openai-whisper pymupdf
```

---

## 📖 Guide d'utilisation

### Mode Shadowing (Outil principal)

1. Ouvrez la WebApp, le mode **Entraînement** s'affiche par défaut.
2. Utilisez la bibliothèque intégrée (📚) pour choisir une leçon pré-synchronisée.
3. Ou générez/récupérez un fichier de synchronisation `.json` correspondant à votre propre audio et utilisez l'import personnalisé (📁).
4. Sélectionnez votre niveau de segmentation (**Phrases**, **Virgules**, **Mots**).
5. Lancez la lecture avec l'**Auto-pause** activée pour vous entraîner à répéter après chaque phrase.

---

### Mode Découpage Audio (Optionnel)

#### Via l'application Web
1. Ouvrez la WebApp et sélectionnez l'onglet **Outil de découpage**.
2. Glissez votre fichier audio (`.mp3`, `.wav`, `.m4a`, etc.).
3. Ajustez le seuil de silence (dB) et la durée minimale de silence (ms).
4. Cliquez sur **Lancer le traitement**, écoutez le résultat puis téléchargez l'audio exporté pour préparer vos propres fichiers d'entraînement.

#### Via le script CLI `advanced_audio.py`
```bash
# Exemple simple : fichier unique avec pause x1.5 et bips
python advanced_audio.py input.mp3 output.mp3 --pause-mult 1.5 --beep --normalize

# Mode adaptatif pour audio avec bruit de fond
python advanced_audio.py input.mp3 output.mp3 --adaptive --min-chunk 500 --pause-mult 2.0

# Mode batch sur tout un dossier avec bornes de pause
python advanced_audio.py "./dossier_source" "./dossier_sortie" --speed 0.95 --pause-mult 2.0 --min-pause 1000 --max-pause 8000
```

**Options de détection de silence :**
- `--min-silence <ms>` : Durée minimale pour considérer un silence (défaut : 700 ms).
- `--thresh <dB>` : Seuil de détection du silence relatif au volume moyen (défaut : -16 dB).
- `--keep-silence <ms>` : Silence naturel conservé au début/fin de chaque segment (défaut : 250 ms).
- `--adaptive` : Active le seuil adaptatif basé sur le profil de volume local (recommandé pour les audios bruités).
- `--min-chunk <ms>` : Durée minimale d'un segment valide — les micro-segments sont fusionnés (défaut : 300 ms).

**Options de pause :**
- `--pause-mult <ratio>` : Multiplicateur du temps de silence inséré (ex: 2.0 pour doubler la pause).
- `--min-pause <ms>` : Durée minimale de la pause insérée (défaut : 0).
- `--max-pause <ms>` : Durée maximale de la pause insérée (défaut : 0 = pas de max).

**Options audio :**
- `--speed <vitesse>` : Vitesse de lecture audio sans changer la hauteur de voix (ex: 0.9).
- `--beep` : Ajoute un signal sonore à la fin de chaque segment.
- `--normalize` : Égalise les niveaux sonores.
- `--crossfade <ms>` : Fondu croisé entre les segments (défaut : 50 ms).

---

### Génération de synchronisation IA

#### À partir de l'audio seul (Whisper)
```bash
# Utilisation simple (modèle medium par défaut)
python generate_sync.py mon_audio.mp3

# Avec modèle plus précis et prompt de contexte personnalisé
python generate_sync.py mon_audio.mp3 --model large --prompt "Medical terminology lecture"

# Mode batch sur un dossier
python generate_sync.py ./dossier/ --model medium --language en
```

**Options disponibles :**
- `--model <nom>` : Modèle Whisper (`tiny`, `base`, `small`, `medium`, `large`, `turbo` — défaut : `medium`).
- `--language <code>` : Code langue ISO (défaut : `en`). Forcer la langue améliore la précision.
- `--prompt <texte>` : Prompt de contexte pour guider Whisper (vocabulaire, domaine).
- `--temperature <float>` : Température de décodage (défaut : 0.0 = déterministe).

#### À partir de l'audio et d'un texte de cours PDF
```bash
# Usage simple
python generate_sync_pdf.py 1.mp3 cours.pdf

# Avec modèle plus précis
python generate_sync_pdf.py 42.mp3 annales.pdf --model large --language en

# Mode batch
python generate_sync_pdf.py ./audio/ cours.pdf --model medium
```

---

## 📁 Structure du projet

```
CutMaster/
├── webapp/                   # Application Web statique (GitHub Pages)
│   ├── index.html            # Landing page interactive avec animations
│   ├── index.css / index.js  # Styles & moteur de particules/aurora
│   ├── app.html              # Interface utilisateur (Découpage & Shadowing)
│   ├── app.css / app.js      # Logique Web Audio API, WaveSurfer & lamejs
│   ├── shadowing.html        # Vue dédiée au shadowing
│   └── style.css             # Styles partagés
│
├── .github/workflows/        # CI/CD
│   └── pages.yml             # Déploiement automatique sur GitHub Pages
│
├── advanced_audio.py         # Script CLI avancé (batch, pitch-preserved speed, bips)
├── process_audio.py          # Script de base pour le découpage pydub
├── generate_sync.py          # Générateur de timestamps mot à mot via Whisper
├── generate_sync_pdf.py      # Extracteur et aligneur PDF ↔ Audio via Whisper
├── test_whisper.py           # Script de test de transcription Whisper
├── test_whisper_words.py     # Script de test d'extraction mot à mot
├── requirements.txt          # Dépendances Python de base
└── README.md                 # Documentation du projet
```

---

## 💻 Technologies utilisées

- **Frontend** : HTML5, CSS3 (Vanilla moderne, Glassmorphism, animations fluides), JavaScript ES6+
- **Audio Web** : [Web Audio API](https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API), [WaveSurfer.js](https://wavesurfer.xyz/), [lamejs](https://github.com/zhuker/lamejs)
- **Traitement Audio Python** : [PyDub](https://github.com/jiaaro/pydub), [FFmpeg](https://ffmpeg.org/)
- **Intelligence Artificielle & NLP** : [OpenAI Whisper](https://github.com/openai/whisper), [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/), `difflib`
- **Hébergement & CI/CD** : GitHub Actions & GitHub Pages

---

## 📄 Licence

Ce projet est sous licence MIT. N'hésitez pas à l'utiliser, le modifier et y contribuer !
