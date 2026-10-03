# Diclo 🎙️

> **L'outil ultime d'entraînement oral et de prononciation.**  
> Maîtrisez l'élocution et le débit en anglais grâce à la répétition orale active avec alignement texte-audio synchronisé mot à mot, et préparez vos propres supports grâce à un outil de découpage intelligent intégré.

[![Demo GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://cermp.github.io/Diclo/)
[![Lighthouse 100%](https://img.shields.io/badge/Lighthouse-100%2F100-success?style=for-the-badge&logo=lighthouse)](https://cermp.github.io/Diclo/)
[![Privacy 100% Local](https://img.shields.io/badge/Privacy-100%25%20Client--Side-blue?style=for-the-badge&logo=shield)](https://cermp.github.io/Diclo/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-In--Browser-orange?style=for-the-badge)](https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API)
[![OpenAI Whisper](https://img.shields.io/badge/AI-Whisper_Speech--to--Text-violet?style=for-the-badge)](https://github.com/openai/whisper)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Points forts & Philosophie](#-points-forts--philosophie)
- [Fonctionnalités principales](#-fonctionnalités-principales)
  - [1. Application Web (100% Client-Side)](#1-application-web-100-client-side)
  - [2. Suite CLI & IA Python](#2-suite-cli--ia-python)
- [Raccourcis Clavier](#-raccourcis-clavier)
- [Démonstration en direct](#-démonstration-en-direct)
- [Installation & Démarrage](#-installation--démarrage)
  - [Utiliser la WebApp](#utiliser-lapplication-web)
  - [Utiliser les outils Python](#utiliser-les-outils-python)
- [Guide d'utilisation](#-guide-dutilisation)
  - [Mode Entraînement Oral](#mode-entraînement-oral-outil-principal)
  - [Mode Découpage Audio](#mode-découpage-audio-optionnel)
  - [Génération de synchronisation IA](#génération-de-synchronisation-ia)
- [Structure du projet](#-structure-du-projet)
- [Technologies & Performance](#-technologies--performance)
- [Licence & Contributions](#-licence--contributions)

---

## 🌟 Aperçu

**Diclo** est conçu pour les candidats aux concours exigeants (notamment les **oraux CC-INP**), les étudiants, les professeurs et tous les apprenants souhaitant perfectionner leur accent et fluidité orale.

Il résout une difficulté majeure de la répétition orale à voix haute (*shadowing* et écoute active) :
- Les enregistrements natifs s'enchaînent souvent trop rapidement sans laisser le temps de répéter.
- Aligner manuellement un texte avec un fichier audio est un travail fastidieux.

Diclo offre une réponse complète en deux volets :
1. **Une application Web autonome** exécutée à 100 % dans le navigateur : zéro latence, aucune donnée envoyée à un serveur, respect total de la vie privée.
2. **Une boîte à outils Python avancée** s'appuyant sur OpenAI Whisper pour chronométrer et synchroniser automatiquement textes, PDFs et flux audio.

---

## ⚡ Points forts & Philosophie

- 🔒 **100 % Client-Side & Confidentialité Totale** : Vos enregistrements vocaux et vos fichiers audio sont traités exclusivement dans votre mémoire navigateur (Web Audio API & MediaRecorder). Aucune donnée n'est envoyée à un serveur externe.
- 🚀 **Performance & Éco-conception (Lighthouse 100/100)** : Zéro dépendance CDN bloquante, polices WOFF2 variables auto-hébergées, animations composées sur GPU, démarrage instantané même en 4G lente.
- 📚 **Bibliothèque CC-INP Intégrée** : 134 textes et audios officiels de concours synchronisés mot à mot, prêts à l'entraînement sans configuration.
- ✂️ **Découpage Intelligent & Calibré** : Détection automatique des silences et insertion de pauses proportionnelles pour répéter à son propre rythme.

---

## ✨ Fonctionnalités principales

### 1. Application Web (100% Client-Side)

Accessible immédiatement sans aucune installation :

#### 🗣️ Entraînement Oral (Diclo v2.1)
- 📚 **Bibliothèque intégrée (134 textes CC-INP)** : Accès direct avec recherche instantanée, aperçu de la durée et du nombre de mots, navigation fluide (*Précédent* / *Suivant*).
- 📁 **Import Personnalisé** : Glissez n'importe quel fichier audio (`.mp3`, `.wav`) et son fichier de synchronisation `.json` généré par Whisper.
- 🎚️ **Scrubber Audio & Timeline Interactive** : Barre de progression cliquable avec synchronisation en temps réel de chaque segment.
- ⚡ **Contrôle de vitesse dynamique** : Ajustement continu de **0.5x à 2.0x** avec préservation de la hauteur de voix (*pitch-preserving*) et boutons d'accès rapide (0.75x, 1.0x, 1.25x, 1.5x).
- 🔁 **Modes de boucle personnalisés** : Répétez chaque segment 2 fois, 3 fois, ou en boucle infinie (∞) avant d'avancer automatiquement.
- 🎙️ **Enregistrement vocal comparatif** : Enregistrez votre propre voix pendant la phase de pause "À vous !" et comparez-la instantanément au locuteur natif.
- ⭐ **Système de Favoris** : Marquez les phrases difficiles (touche `S`) pour filtrer et concentrer vos révisions sur vos points faibles.
- 🔍 **Prononciation mot à mot au clic** : Cliquez sur n'importe quel mot du texte pour écouter son extrait audio exact à la milliseconde près.
- 🎨 **Confort de lecture & Typographie** : Choix de polices (Moderne, Monospace, Livre), réglage de la taille de texte (A- / A+), alignements et **Mode Focus** estompant les phrases secondaires.
- 💾 **Sauvegarde automatique locale** : Vos favoris, réglages et dernière leçon consultée sont conservés dans votre navigateur (`localStorage`).

#### ✂️ Découpage & Espacement Audio Intelligent
- **Préréglages en un clic** : Profils adaptés selon votre niveau (*Standard*, *Apprenant*, *Rapide*) ou réglages personnalisés (seuil dB, durée min. de silence).
- **Pauses calculées** : Insertion automatique d'un silence proportionnel après chaque phrase pour laisser le temps de répéter à voix haute.
- **Visualiseur Waveform** : Visualisation interactive de l'onde sonore via [WaveSurfer.js](https://wavesurfer.xyz/).
- **Export direct** : Téléchargement instantané en `.wav` haute fidélité ou en `.mp3` léger encodé à la volée dans le navigateur via `lamejs`.

---

### 2. Suite CLI & IA Python

Pour la préparation par lot, l'alignement IA automatique et les cours universitaires :

- ⚡ [`advanced_audio.py`](file:///Users/merlinclaret/Desktop/Diclo/advanced_audio.py) :
  - **Détection de silence adaptative** : analyse le profil de volume local au lieu d'un seuil global fixe (idéal pour les audios avec bruit de fond).
  - Fusion automatique des micro-segments parasites (bruits de bouche, clics).
  - Vitesse modulable avec préservation du timbre vocal (filtre `atempo` via FFmpeg).
  - Bips sonores optionnels en fin de phrase pour rythmer l'exercice.
  - Normalisation sonore automatique et fondus croisés (*crossfade*).
- 🤖 [`generate_sync.py`](file:///Users/merlinclaret/Desktop/Diclo/generate_sync.py) :
  - Transcription automatique avec horodatage mot à mot via **OpenAI Whisper**.
  - **Modèle configurable** (`tiny`, `base`, `small`, `medium`, `large-v3`, `turbo` — défaut : `medium`).
  - **Langue explicite** et **prompt de contexte** pour guider Whisper sur le vocabulaire technique ou spécialisé.
  - Correction automatique des chevauchements temporels entre mots et rapport qualité.
- 📄 [`generate_sync_pdf.py`](file:///Users/merlinclaret/Desktop/Diclo/generate_sync_pdf.py) :
  - Extraction de texte officiel depuis un cours au format PDF (via PyMuPDF).
  - **Alignement amélioré** avec score de similarité phonétique et tolérance aux variantes orthographiques.
  - **Répartition proportionnelle** du temps basée sur l'estimation syllabique.
  - Rapport de qualité : taux d'alignement exact, matches flous, confiance moyenne.

---

## ⌨️ Raccourcis Clavier

Contrôlez l'ensemble de votre séance d'entraînement sans toucher à la souris :

| Touche | Action |
| :---: | :--- |
| <kbd>Espace</kbd> | Lecture / Pause |
| <kbd>→</kbd> | Segment suivant |
| <kbd>←</kbd> | Segment précédent |
| <kbd>R</kbd> | Rejouer le segment actuel |
| <kbd>S</kbd> | Ajouter / Retirer le segment des favoris (★) |
| <kbd>H</kbd> | Masquer / Afficher le texte (entraînement à l'aveugle) |
| <kbd>L</kbd> | Activer / Désactiver la boucle infinie sur la phrase |
| <kbd>+</kbd> / <kbd>-</kbd> | Augmenter / Diminuer la vitesse de lecture (par pas de 0.05x) |
| <kbd>M</kbd> | Activer / Couper le microphone |
| <kbd>?</kbd> | Afficher l'aide des raccourcis clavier |

---

## 🚀 Démonstration en direct

L'application est disponible en continu sur **GitHub Pages** :

👉 **[Ouvrir Diclo en ligne (cermp.github.io/Diclo)](https://cermp.github.io/Diclo/)**

---

## 🛠️ Installation & Démarrage

### Utiliser l'application Web

#### En ligne (immédiat)
Rendez-vous simplement sur [https://cermp.github.io/Diclo/](https://cermp.github.io/Diclo/).

#### En local
Clonez le dépôt et lancez un simple serveur HTTP local :

```bash
cd webapp
python3 -m http.server 8080
```
Puis ouvrez [`http://localhost:8080`](http://localhost:8080) dans votre navigateur.

---

### Utiliser les outils Python

#### 1. Prérequis système
- **Python 3.10+**
- **FFmpeg** (indispensable pour le traitement et l'alignement audio) :
  - **macOS** : `brew install ffmpeg`
  - **Ubuntu / Debian** : `sudo apt update && sudo apt install ffmpeg`
  - **Windows** : `winget install Gyan.FFmpeg` ou via [ffmpeg.org](https://ffmpeg.org/download.html)

#### 2. Installation de l'environnement virtuel

```bash
git clone https://github.com/CermP/Diclo.git
cd Diclo

# Création et activation de l'environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installation des dépendances audio de base
pip install -r requirements.txt
```

#### 3. Dépendances optionnelles IA (Whisper & PDF)

Pour générer des synchronisations mot à mot automatiques avec Whisper :

```bash
pip install openai-whisper pymupdf
```

---

## 📖 Guide d'utilisation

### Mode Entraînement Oral (Outil principal)

1. Ouvrez l'application web ([`app.html`](file:///Users/merlinclaret/Desktop/Diclo/webapp/app.html)).
2. Cliquez sur l'icône de bibliothèque (**📚**) pour choisir l'un des **134 textes officiels CC-INP**.
3. Ou glissez votre propre audio et fichier `.json` via l'icône d'import (**📁**).
4. Choisissez le mode de segmentation souhaité (**Phrases**, **Virgules** ou **Mots**).
5. Lancez la lecture : écoutez le locuteur natif, répétez à voix haute pendant la pause, et réécoutez votre voix enregistrée !

---

### Mode Découpage Audio (Optionnel)

#### Via la WebApp
1. Ouvrez l'onglet **Découpage** dans l'application web.
2. Déposez votre fichier audio (`.mp3`, `.wav`, `.m4a`).
3. Choisissez un préréglage ou ajustez le seuil de silence et la durée minimale.
4. Téléchargez le fichier avec pauses insérées en `.wav` ou `.mp3`.

#### Via le terminal (`advanced_audio.py`)
```bash
# Exemple simple : fichier unique avec pause x1.5, bips sonores et normalisation
python advanced_audio.py input.mp3 output.mp3 --pause-mult 1.5 --beep --normalize

# Mode adaptatif pour audio avec bruit de fond
python advanced_audio.py input.mp3 output.mp3 --adaptive --min-chunk 500 --pause-mult 2.0

# Traitement par lot sur tout un dossier avec bornes min/max
python advanced_audio.py "./dossier_source" "./dossier_sortie" --speed 0.95 --pause-mult 2.0 --min-pause 1000 --max-pause 8000
```

---

### Génération de synchronisation IA

#### À partir de l'audio seul (Whisper)
```bash
# Utilisation standard (modèle medium recommandé)
python generate_sync.py mon_audio.mp3

# Avec modèle large et prompt de domaine spécialisé
python generate_sync.py cours_eco.mp3 --model large --language en --prompt "Macroeconomics and inflation lecture"

# Mode dossier complet
python generate_sync.py ./audios/ --model medium --language en
```

#### À partir d'un audio et d'un document de cours PDF
```bash
# Alignement automatique texte PDF ↔ audio
python generate_sync_pdf.py 1.mp3 cours.pdf

# Traitement par lot sur toute une série
python generate_sync_pdf.py ./audio/ annales_2026.pdf --model medium
```

---

## 📁 Structure du projet

```
Diclo/
├── webapp/                         # Application Web autonome (GitHub Pages)
│   ├── index.html                  # Landing page ultra-rapide (Score Lighthouse 100)
│   ├── index.css / index.js        # Design system sombre, animations GPU et canvas sinusoïde
│   ├── app.html                    # Interface principale (Entraînement Oral & Découpage)
│   ├── app.css / app.js            # Moteur Web Audio API, scrubber, MediaRecorder, WaveSurfer & lamejs
│   ├── fonts/                      # Polices WOFF2 sous-ensembles auto-hébergées (Space Grotesk & JetBrains Mono)
│   ├── audio/                      # 134 textes/audios officiels CC-INP et index lessons.json
│   ├── robots.txt / sitemap.xml    # Référencement naturel & SEO
│   └── google*.html                # Validation Google Search Console
│
├── .github/workflows/              # Automatisation CI/CD
│   └── pages.yml                   # Déploiement automatisé sur GitHub Pages
│
├── advanced_audio.py               # Découpage CLI adaptatif avancé (pitch-preserving, bips, batch)
├── process_audio.py                # Découpage simple via pydub
├── generate_sync.py                # Générateur de synchronisation mot à mot avec Whisper
├── generate_sync_pdf.py            # Extracteur PDF et alignement phonétique/syllabique
├── requirements.txt                # Dépendances Python
└── README.md                       # Documentation officielle
```

---

## 💻 Technologies & Performance

- **Frontend & Web App** : HTML5 sémantique, CSS3 Vanilla moderne (Glassmorphism, CSS Variables, `clamp()`), JavaScript ES6+ modulaire.
- **Audio & Médias** : [Web Audio API](https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API), [MediaStream Recording API](https://developer.mozilla.org/fr/docs/Web/API/MediaStream_Recording_API), [WaveSurfer.js](https://wavesurfer.xyz/), [lamejs](https://github.com/zhuker/lamejs).
- **Core Web Vitals & Optimisation Mobile** :
  - ⚡ **Score Performance Mobile** : 100 / 100
  - 🎯 **FCP** : ~1,2 s | **LCP** : ~1,3 s | **Speed Index** : ~1,2 s
  - 🛡️ **TBT & CLS** : 0 ms / 0.000
  - 🎨 **Typographie locale** : Polices WOFF2 variables (Space Grotesk & JetBrains Mono) sous licence OFL, zéro dépendance tierce.
- **Python & IA Speech-to-Text** : [OpenAI Whisper](https://github.com/openai/whisper), [PyMuPDF](https://pymupdf.readthedocs.io/), [PyDub](https://github.com/jiaaro/pydub), [FFmpeg](https://ffmpeg.org/).

---

## 📄 Licence & Contributions

Ce projet est distribué sous **licence MIT**.  
Les contributions, suggestions d'améliorations et signalements de bugs sont les bienvenus via les [Issues GitHub](https://github.com/CermP/Diclo/issues) !

*Développé avec passion pour l'apprentissage linguistique et l'excellence orale.*
