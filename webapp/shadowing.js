let allWords = []; 
let sentences = []; 
let currentSentenceIndex = -1;
let audioPlayer = document.getElementById('audioPlayer');
let isTraining = false;
let autoPauseMode = true;
let syncInterval = null;
let progressRAF = null;
let waitTimeout = null;
let currentGranularity = 'sentence';
let pauseMultiplier = 1.5;

let libraryLessons = [];
let currentLessonIndex = -1;

// DOM Elements
const tabLibrary = document.getElementById('tabLibrary');
const tabCustom = document.getElementById('tabCustom');
const librarySection = document.getElementById('librarySection');
const customSection = document.getElementById('customSection');
const librarySearch = document.getElementById('librarySearch');
const librarySelect = document.getElementById('librarySelect');
const startLibraryBtn = document.getElementById('startLibraryBtn');
const previewNum = document.getElementById('previewNum');
const previewTitle = document.getElementById('previewTitle');
const previewDuration = document.getElementById('previewDuration');
const previewWords = document.getElementById('previewWords');

const activeNum = document.getElementById('activeNum');
const activeTitle = document.getElementById('activeTitle');
const prevLessonBtn = document.getElementById('prevLessonBtn');
const nextLessonBtn = document.getElementById('nextLessonBtn');
const changeLessonBtn = document.getElementById('changeLessonBtn');

// Tab Switching
if (tabLibrary && tabCustom) {
    tabLibrary.addEventListener('click', () => {
        tabLibrary.classList.add('active');
        tabCustom.classList.remove('active');
        librarySection.classList.remove('hidden');
        customSection.classList.add('hidden');
    });

    tabCustom.addEventListener('click', () => {
        tabCustom.classList.add('active');
        tabLibrary.classList.remove('active');
        customSection.classList.remove('hidden');
        librarySection.classList.add('hidden');
    });
}

// Load Library from audio/lessons.json
async function initLibrary() {
    try {
        const resp = await fetch('audio/lessons.json');
        if (!resp.ok) throw new Error("Status " + resp.status);
        libraryLessons = await resp.json();
        populateLibrarySelect(libraryLessons);
        if (libraryLessons.length > 0) {
            updatePreview(libraryLessons[0]);
        }
    } catch (e) {
        console.warn("Bibliothèque distante non accessible :", e);
        if (librarySelect) {
            librarySelect.innerHTML = '<option value="">⚠️ Bibliothèque indisponible (lancez un serveur local ou ouvrez via GitHub)</option>';
        }
    }
}

function populateLibrarySelect(lessons) {
    if (!librarySelect) return;
    librarySelect.innerHTML = '';
    lessons.forEach((l, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Texte ${l.id} : ${l.title} (${l.duration})`;
        librarySelect.appendChild(opt);
    });
}

function updatePreview(lesson) {
    if (!lesson) return;
    if (previewNum) previewNum.textContent = `Texte ${lesson.id}`;
    if (previewTitle) previewTitle.textContent = lesson.title;
    if (previewDuration) previewDuration.textContent = lesson.duration;
    if (previewWords) previewWords.textContent = lesson.wordsCount;
}

if (librarySelect) {
    librarySelect.addEventListener('change', () => {
        const idx = parseInt(librarySelect.value, 10);
        if (!isNaN(idx) && libraryLessons[idx]) {
            updatePreview(libraryLessons[idx]);
        }
    });
}

// Search / Filter
if (librarySearch) {
    librarySearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
            populateLibrarySelect(libraryLessons);
            if (libraryLessons.length > 0) updatePreview(libraryLessons[0]);
            return;
        }

        const filtered = libraryLessons.filter(l => 
            l.title.toLowerCase().includes(q) || 
            String(l.id).includes(q)
        );
        populateLibrarySelect(filtered);
        if (filtered.length > 0) {
            updatePreview(filtered[0]);
        }
    });
}

// Load Library Lesson
async function loadLibraryLesson(index) {
    if (index < 0 || index >= libraryLessons.length) return;
    stopTraining();

    const lesson = libraryLessons[index];
    currentLessonIndex = index;

    startLibraryBtn.disabled = true;
    startLibraryBtn.textContent = "⏳ Chargement...";

    try {
        const res = await fetch(lesson.jsonUrl);
        if (!res.ok) throw new Error("Impossible de charger le JSON.");
        allWords = await res.json();
        audioPlayer.src = lesson.audioUrl;

        groupWords();
        buildTextUI();

        if (activeNum) activeNum.textContent = `Texte ${lesson.id}`;
        if (activeTitle) activeTitle.textContent = lesson.title;
        if (prevLessonBtn) prevLessonBtn.disabled = (index === 0);
        if (nextLessonBtn) nextLessonBtn.disabled = (index === libraryLessons.length - 1);
        if (prevLessonBtn) prevLessonBtn.classList.remove('hidden');
        if (nextLessonBtn) nextLessonBtn.classList.remove('hidden');

        document.getElementById('setupCard').classList.add('hidden');
        document.getElementById('playerCard').classList.remove('hidden');

        currentSentenceIndex = 0;
        highlightSentence(0);
        updateStatus("Prêt ! Cliquez sur Lancer pour démarrer.", "neutral");

    } catch (err) {
        alert("Erreur lors du chargement : " + err.message);
    } finally {
        startLibraryBtn.disabled = false;
        startLibraryBtn.textContent = "🚀 Charger et Commencer l'entraînement";
    }
}

if (startLibraryBtn) {
    startLibraryBtn.addEventListener('click', () => {
        const idx = parseInt(librarySelect.value, 10);
        if (!isNaN(idx)) {
            loadLibraryLesson(idx);
        }
    });
}

// Navigation buttons
if (prevLessonBtn) {
    prevLessonBtn.addEventListener('click', () => {
        if (currentLessonIndex > 0) {
            loadLibraryLesson(currentLessonIndex - 1);
        }
    });
}

if (nextLessonBtn) {
    nextLessonBtn.addEventListener('click', () => {
        if (currentLessonIndex < libraryLessons.length - 1) {
            loadLibraryLesson(currentLessonIndex + 1);
        }
    });
}

if (changeLessonBtn) {
    changeLessonBtn.addEventListener('click', () => {
        stopTraining();
        document.getElementById('playerCard').classList.add('hidden');
        document.getElementById('setupCard').classList.remove('hidden');
    });
}

// Manual File Load
document.getElementById('loadBtn').addEventListener('click', async () => {
    const audioFile = document.getElementById('audioInput').files[0];
    const jsonFile = document.getElementById('jsonInput').files[0];

    if (!audioFile || !jsonFile) {
        alert("Veuillez sélectionner les deux fichiers.");
        return;
    }

    audioPlayer.src = URL.createObjectURL(audioFile);
    allWords = JSON.parse(await jsonFile.text());

    groupWords();
    buildTextUI();

    currentLessonIndex = -1;
    if (activeNum) activeNum.textContent = "Fichier local";
    if (activeTitle) activeTitle.textContent = audioFile.name;
    if (prevLessonBtn) prevLessonBtn.classList.add('hidden');
    if (nextLessonBtn) nextLessonBtn.classList.add('hidden');

    document.getElementById('setupCard').classList.add('hidden');
    document.getElementById('playerCard').classList.remove('hidden');

    currentSentenceIndex = 0;
    highlightSentence(0);
    updateStatus("Prêt ! Cliquez sur Lancer.", "neutral");
});

// Boutons de granularité
document.querySelectorAll('.gran-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.gran-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentGranularity = e.target.getAttribute('data-val');
        
        changeGranularitySeamlessly();
    });
});

// Multiplicateur de pause
document.getElementById('pauseMult').addEventListener('input', (e) => {
    pauseMultiplier = parseFloat(e.target.value);
    document.getElementById('pauseVal').innerText = pauseMultiplier.toFixed(1);
});

document.getElementById('autoPauseToggle').addEventListener('change', (e) => {
    autoPauseMode = e.target.checked;
});

function changeGranularitySeamlessly() {
    let time = audioPlayer.currentTime;
    
    groupWords();
    buildTextUI();
    
    let newIndex = 0;
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].start <= time && time <= sentences[i].end) {
            newIndex = i;
            break;
        }
    }
    
    if (newIndex === 0 && sentences.length > 0 && time > sentences[0].end) {
        for (let i = 0; i < sentences.length - 1; i++) {
            if (time > sentences[i].end && time < sentences[i+1].start) {
                newIndex = i + 1;
                break;
            }
        }
    }
    
    currentSentenceIndex = newIndex;
    highlightSentence(currentSentenceIndex);
}

function groupWords() {
    sentences = [];
    let currentChunk = [];
    let currentStart = null;

    allWords.forEach((wordObj, i) => {
        if (currentStart === null) {
            currentStart = wordObj.start;
        }
        
        currentChunk.push(wordObj.text);

        const text = wordObj.text;
        const isLastWord = i === allWords.length - 1;
        let shouldCut = false;
        
        if (currentGranularity === 'word') {
            shouldCut = true;
        } else if (currentGranularity === 'comma') {
            if (text.match(/[,;:\.!\?]"?$/)) shouldCut = true;
        } else if (currentGranularity === 'sentence') {
            if (text.match(/[\.!\?]"?$/)) shouldCut = true;
        }

        if (shouldCut || isLastWord) {
            sentences.push({
                start: currentStart,
                end: wordObj.end,
                text: currentChunk.join(' ')
            });
            currentChunk = [];
            currentStart = null;
        }
    });
}

function buildTextUI() {
    const container = document.getElementById('textContainer');
    container.innerHTML = '';

    sentences.forEach((s, index) => {
        const span = document.createElement('span');
        span.className = 'sentence';
        span.id = `sent-${index}`;
        span.innerText = s.text + ' ';
        
        span.addEventListener('click', () => {
            jumpToSentence(index);
        });

        container.appendChild(span);
    });
}

document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (isTraining) {
        stopTraining();
    } else {
        startTraining();
    }
});

function startTraining() {
    isTraining = true;
    document.getElementById('playPauseBtn').innerText = '⏸️ Pause';
    if (currentSentenceIndex === -1) currentSentenceIndex = 0;
    
    playSentence(currentSentenceIndex);
}

function stopTraining() {
    isTraining = false;
    audioPlayer.pause();
    document.getElementById('playPauseBtn').innerText = '▶️ Reprendre';
    clearInterval(syncInterval);
    clearTimeout(waitTimeout);
    cancelAnimationFrame(progressRAF);
    document.getElementById('progressBarContainer').classList.add('hidden');
    updateStatus('En pause', 'neutral');
}

function jumpToSentence(index) {
    currentSentenceIndex = index;
    if (isTraining) {
        clearInterval(syncInterval);
        clearTimeout(waitTimeout);
        cancelAnimationFrame(progressRAF);
        playSentence(index);
    } else {
        highlightSentence(index);
        audioPlayer.currentTime = sentences[index].start; 
    }
}

function highlightSentence(index) {
    document.querySelectorAll('.sentence').forEach(s => s.classList.remove('active'));
    if (index >= 0 && index < sentences.length) {
        const span = document.getElementById(`sent-${index}`);
        if (span) {
            span.classList.add('active');
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function startPauseTimer(durationMs, callback) {
    const startTime = performance.now();
    const fill = document.getElementById('progressBarFill');
    const container = document.getElementById('progressBarContainer');
    
    container.classList.remove('hidden');
    fill.style.width = '0%';
    
    function animate(time) {
        if (!isTraining) {
            container.classList.add('hidden');
            return;
        }
        
        let elapsed = time - startTime;
        let percent = (elapsed / durationMs) * 100;
        
        if (percent >= 100) {
            fill.style.width = '100%';
            container.classList.add('hidden');
            callback();
        } else {
            fill.style.width = percent + '%';
            progressRAF = requestAnimationFrame(animate);
        }
    }
    
    progressRAF = requestAnimationFrame(animate);
}

function playSentence(index) {
    if (index >= sentences.length) {
        stopTraining();
        updateStatus("Entraînement terminé ! 🎉", "success");
        return;
    }

    const sentence = sentences[index];
    highlightSentence(index);
    updateStatus("🎧 Écoutez...", "listening");

    audioPlayer.currentTime = sentence.start;
    audioPlayer.play();

    clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        if (currentSentenceIndex >= 0 && currentSentenceIndex < sentences.length) {
            const currentEnd = sentences[currentSentenceIndex].end;
            
            if (audioPlayer.currentTime >= currentEnd) {
                if (autoPauseMode) {
                    audioPlayer.pause();
                    clearInterval(syncInterval);
                    
                    const duration = currentEnd - sentences[currentSentenceIndex].start;
                    let pauseTimeMs = duration * 1000 * pauseMultiplier; 
                    if (pauseTimeMs < 1000) pauseTimeMs = 1000; 
                    
                    updateStatus(`⏳ Préparez-vous...`, "neutral");
                    
                    waitTimeout = setTimeout(() => {
                        if (!isTraining) return; 
                        
                        updateStatus(`🗣️ À vous !`, "speaking");
                        
                        startPauseTimer(pauseTimeMs, () => {
                            currentSentenceIndex++;
                            playSentence(currentSentenceIndex);
                        });
                    }, 1000); 
                    
                } else {
                    if (currentSentenceIndex + 1 < sentences.length) {
                        const nextStart = sentences[currentSentenceIndex + 1].start;
                        if (audioPlayer.currentTime >= nextStart) {
                            currentSentenceIndex++;
                            highlightSentence(currentSentenceIndex);
                        }
                    } else {
                        if (audioPlayer.ended || audioPlayer.currentTime >= audioPlayer.duration - 0.5) {
                            stopTraining();
                            updateStatus("Entraînement terminé ! 🎉", "success");
                        }
                    }
                }
            }
        }
    }, 10); // Vérification toutes les 10ms pour une coupe plus précise
}

function updateStatus(text, state) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    statusText.innerText = text;
    indicator.className = `status-indicator ${state}`;
    
    if (state !== 'speaking') {
        document.getElementById('progressBarContainer').classList.add('hidden');
        cancelAnimationFrame(progressRAF);
    }
}

// Initialiser la bibliothèque au chargement
initLibrary();
