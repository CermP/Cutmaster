let allWords = []; 
let sentences = []; 
let currentSentenceIndex = -1;
let audioPlayer = document.getElementById('audioPlayer');
let isTraining = false;
let autoPauseMode = true;
let syncInterval = null;
let progressRAF = null;
let currentGranularity = 'sentence';
let pauseMultiplier = 1.5;

document.getElementById('loadBtn').addEventListener('click', async () => {
    const audioFile = document.getElementById('audioInput').files[0];
    const jsonFile = document.getElementById('jsonInput').files[0];

    if (!audioFile || !jsonFile) return;

    audioPlayer.src = URL.createObjectURL(audioFile);
    allWords = JSON.parse(await jsonFile.text());

    groupWords();
    buildTextUI();

    document.getElementById('setupCard').classList.add('hidden');
    document.getElementById('playerCard').classList.remove('hidden');
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
            if (currentGranularity === 'word' && currentStart > 0.05) {
                currentStart += 0.04;
            }
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
    cancelAnimationFrame(progressRAF);
    document.getElementById('progressBarContainer').classList.add('hidden');
    updateStatus('En pause', 'neutral');
}

function jumpToSentence(index) {
    currentSentenceIndex = index;
    if (isTraining) {
        clearInterval(syncInterval);
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
                    // Mode Lecture Continue (sans auto-pause)
                    // On ne met PAS en pause. On attend juste que l'audio naturel atteigne le début de la phrase suivante.
                    if (currentSentenceIndex + 1 < sentences.length) {
                        const nextStart = sentences[currentSentenceIndex + 1].start;
                        if (audioPlayer.currentTime >= nextStart) {
                            currentSentenceIndex++;
                            highlightSentence(currentSentenceIndex);
                        }
                    } else {
                        // Fin du dernier texte
                        if (audioPlayer.ended || audioPlayer.currentTime >= audioPlayer.duration - 0.5) {
                            stopTraining();
                            updateStatus("Entraînement terminé ! 🎉", "success");
                        }
                    }
                }
            }
        }
    }, 50);
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
