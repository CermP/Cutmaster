// ====== GLOBAL LOGIC ======
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const modeBtns = document.querySelectorAll('.mode-btn');
    const panels = document.querySelectorAll('.panel');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // Hash-based routing (e.g. app.html#shadowing)
    if (window.location.hash === '#shadowing') {
        modeBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.querySelector('[data-target="panel-shadowing"]').classList.add('active');
        document.getElementById('panel-shadowing').classList.add('active');
    }

    // ====== DÉCOUPAGE LOGIC ======
    const dropZone = document.getElementById('decoupage-drop-zone');
    const fileInput = document.getElementById('decoupage-file');
    const browseBtn = document.getElementById('decoupage-browse');
    const fileNameDisplay = document.getElementById('decoupage-file-name');
    const processBtn = document.getElementById('decoupage-process');
    const statusDisplay = document.getElementById('decoupage-status');
    const resultArea = document.getElementById('decoupage-result');
    const playBtn = document.getElementById('decoupage-play');
    const downloadBtn = document.getElementById('decoupage-download');
    
    let audioContext = null;
    let originalAudioBuffer = null;
    let processedAudioBlob = null;
    let ws = null;
    let outputFilename = "processed_audio";

    // File selection
    browseBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileNameDisplay.textContent = file.name;
            originalAudioBuffer = null; // reset
            resultArea.classList.add('hidden');
            statusDisplay.textContent = "Fichier sélectionné. Prêt pour le traitement.";
            
            const parts = file.name.split('.');
            parts.pop();
            outputFilename = parts.join('.') + "_cutmaster";
        }
    }

    processBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            statusDisplay.textContent = "Veuillez d'abord sélectionner un fichier.";
            return;
        }

        const file = fileInput.files[0];
        const minSilenceMs = parseFloat(document.getElementById('min-silence').value);
        const threshDb = parseFloat(document.getElementById('thresh-db').value);
        const pauseMult = parseFloat(document.getElementById('pause-mult').value);
        const format = document.getElementById('export-format').value;

        try {
            statusDisplay.textContent = "Chargement et décodage...";
            processBtn.disabled = true;
            
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            if (!originalAudioBuffer) {
                const arrayBuffer = await file.arrayBuffer();
                originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            }

            statusDisplay.textContent = "Analyse des silences en cours...";
            
            // Allow UI to update before heavy processing
            await new Promise(r => setTimeout(r, 50));
            
            const resultBuffer = await processAudio(originalAudioBuffer, minSilenceMs, threshDb, pauseMult);
            
            if (!resultBuffer) {
                statusDisplay.textContent = "Aucune phrase détectée. Ajustez les paramètres.";
                processBtn.disabled = false;
                return;
            }
            
            statusDisplay.textContent = "Encodage du fichier...";
            await new Promise(r => setTimeout(r, 50));

            if (format === 'wav') {
                processedAudioBlob = audioBufferToWav(resultBuffer);
                outputFilename += ".wav";
            } else {
                processedAudioBlob = audioBufferToMp3(resultBuffer);
                outputFilename += ".mp3";
            }

            statusDisplay.textContent = "Traitement terminé !";
            resultArea.classList.remove('hidden');

            if (ws) ws.destroy();
            ws = WaveSurfer.create({
                container: '#waveform',
                waveColor: '#4C566A',      // nord3
                progressColor: '#88C0D0',   // nord8
                cursorColor: '#81A1C1',     // nord9
                barWidth: 2,
                barRadius: 2,
                barGap: 1,
                height: 80,
                normalize: true,
            });

            ws.loadBlob(processedAudioBlob);

        } catch (err) {
            console.error(err);
            statusDisplay.textContent = "Erreur: " + err.message;
        } finally {
            processBtn.disabled = false;
        }
    });

    playBtn.addEventListener('click', () => {
        if (ws) ws.playPause();
    });

    downloadBtn.addEventListener('click', () => {
        if (processedAudioBlob) {
            const url = URL.createObjectURL(processedAudioBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = outputFilename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        }
    });

    async function processAudio(buffer, minSilenceMs, threshDb, pauseMult) {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        
        // Compute overall RMS and convert to dBFS, then apply relative threshold
        const step = 10;
        let totalSum = 0;
        for (let i = 0; i < data.length; i += step) {
            totalSum += data[i] * data[i];
        }
        const overallRMS = Math.sqrt(totalSum / (data.length / step));
        const dbfs = overallRMS > 0 ? 20 * Math.log10(overallRMS) : -100;
        const thresholdDb = dbfs + threshDb; // relative threshold in dBFS

        const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
        const minSilenceSamples = Math.floor((minSilenceMs / 1000) * sampleRate);
        
        function getRMS(arr, start, end) {
            let sum = 0;
            for (let i = start; i < end; i++) {
                sum += arr[i] * arr[i];
            }
            return Math.sqrt(sum / (end - start));
        }

        // Find silences using sliding window
        const chunks = [];
        let isSilent = false;
        let silenceStart = 0;
        let chunkStart = 0;
        
        for (let i = 0; i < data.length; i += windowSize) {
            const end = Math.min(i + windowSize, data.length);
            const rms = getRMS(data, i, end);
            const db = rms > 0 ? 20 * Math.log10(rms) : -100;
            
            if (db < thresholdDb) {
                if (!isSilent) {
                    isSilent = true;
                    silenceStart = i;
                }
            } else {
                if (isSilent) {
                    isSilent = false;
                    const silenceDuration = i - silenceStart;
                    if (silenceDuration >= minSilenceSamples) {
                        chunks.push({ start: chunkStart, end: silenceStart });
                        chunkStart = i;
                    }
                }
            }
        }
        
        // Add final chunk
        if (chunkStart < data.length) {
            chunks.push({ start: chunkStart, end: data.length });
        }

        if (chunks.length === 0) return null;

        statusDisplay.textContent = `${chunks.length} phrases détectées. Construction...`;
        await new Promise(r => setTimeout(r, 50));

        // Rebuild buffer
        const paddingSamples = Math.floor(0.25 * sampleRate);
        let totalNewSamples = 0;
        const paddedChunks = chunks.map(c => {
            const s = Math.max(0, c.start - paddingSamples);
            const e = Math.min(data.length, c.end + paddingSamples);
            const len = e - s;
            const pauseLen = Math.floor(len * pauseMult);
            totalNewSamples += len + pauseLen;
            return { s, e, len, pauseLen };
        });

        const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, totalNewSamples, sampleRate);
        let offset = 0;

        paddedChunks.forEach(c => {
            const chunkBuffer = offlineCtx.createBuffer(buffer.numberOfChannels, c.len, sampleRate);
            for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
                const chanData = buffer.getChannelData(ch);
                const outData = chunkBuffer.getChannelData(ch);
                for(let i=0; i<c.len; i++) {
                    outData[i] = chanData[c.s + i];
                }
            }
            const source = offlineCtx.createBufferSource();
            source.buffer = chunkBuffer;
            source.connect(offlineCtx.destination);
            source.start(offset / sampleRate);
            
            offset += c.len + c.pauseLen;
        });

        return await offlineCtx.startRendering();
    }

    function audioBufferToWav(buffer) {
        let numOfChan = buffer.numberOfChannels;
        let length = buffer.length * numOfChan * 2 + 44;
        let out = new ArrayBuffer(length);
        let view = new DataView(out);
        let channels = [];
        let offset = 0;
        let pos = 0;
        function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
        function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
        setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
        setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164);
        setUint32(length - pos - 4);
        for(let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
        while(pos < length) {
            for(let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        return new Blob([out], {type: "audio/wav"});
    }

    function audioBufferToMp3(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
        const mp3Data = [];
        const left = buffer.getChannelData(0);
        const right = numChannels > 1 ? buffer.getChannelData(1) : left;
        const sampleBlockSize = 1152;
        const leftInt16 = new Int16Array(left.length);
        const rightInt16 = new Int16Array(right.length);
        for (let i = 0; i < left.length; i++) {
            let l = Math.max(-1, Math.min(1, left[i]));
            leftInt16[i] = l < 0 ? l * 32768 : l * 32767;
            if (numChannels > 1) {
                let r = Math.max(-1, Math.min(1, right[i]));
                rightInt16[i] = r < 0 ? r * 32768 : r * 32767;
            }
        }
        for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
            const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
            let mp3buf;
            if (numChannels > 1) {
                const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
                mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            } else {
                mp3buf = mp3encoder.encodeBuffer(leftChunk);
            }
            if (mp3buf.length > 0) mp3Data.push(mp3buf);
        }
        const finalMp3buf = mp3encoder.flush();
        if (finalMp3buf.length > 0) mp3Data.push(finalMp3buf);
        return new Blob(mp3Data, {type: 'audio/mp3'});
    }


    // ====== SHADOWING LOGIC ======
    const shadAudioInput = document.getElementById('shadowing-audio');
    const shadJsonInput = document.getElementById('shadowing-json');
    const shadLoadBtn = document.getElementById('shadowing-load');
    const shadControlsBar = document.getElementById('shadowing-controls-bar');
    const shadPlayBtn = document.getElementById('shadowing-play');
    const shadStatus = document.getElementById('shadowing-status');
    const shadStatusText = document.getElementById('shadowing-status-text');
    const shadProgress = document.getElementById('shadowing-progress');
    const shadTextDisplay = document.getElementById('shadowing-text');
    const shadPauseMultInput = document.getElementById('shadowing-pause-mult');
    const shadPauseValDisplay = document.getElementById('shadowing-pause-val');
    const shadAutoPauseToggle = document.getElementById('auto-pause-toggle');
    const shadSegBtns = document.querySelectorAll('.seg-btn');

    // Library Elements
    const sourceTabs = document.querySelectorAll('.source-tab');
    const sourceTabsContainer = document.getElementById('shadowing-source-tabs');
    const sourceLibrary = document.getElementById('source-library');
    const sourceCustom = document.getElementById('source-custom');
    const librarySearch = document.getElementById('library-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const librarySelect = document.getElementById('library-select');
    const libraryStartBtn = document.getElementById('library-start-btn');
    const previewNum = document.getElementById('preview-lesson-num');
    const previewTitle = document.getElementById('preview-lesson-title');
    const previewDuration = document.getElementById('preview-lesson-duration');
    const previewWords = document.getElementById('preview-lesson-words');

    // In-Player Navigation Elements
    const activeLessonNum = document.getElementById('active-lesson-num');
    const activeLessonTitle = document.getElementById('active-lesson-title');
    const prevLessonBtn = document.getElementById('prev-lesson-btn');
    const nextLessonBtn = document.getElementById('next-lesson-btn');
    const changeLessonBtn = document.getElementById('change-lesson-btn');

    let shadAudioElement = document.getElementById('shadowing-audio-player');
    let shadWords = [];
    let shadSegments = [];
    let shadGranularity = 'sentence';
    let shadCurrentSegmentIndex = -1;
    let shadIsPlaying = false;
    let shadLoopTimeout = null;
    let shadPauseStartTime = 0;
    let shadPauseDuration = 0;
    let shadAnimFrame = null;

    let libraryLessons = [];
    let currentLessonIndex = -1;

    // Source Tabs (Library vs Custom Upload)
    sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.source;
            if (target === 'library') {
                sourceLibrary.classList.remove('hidden');
                sourceCustom.classList.add('hidden');
            } else {
                sourceLibrary.classList.add('hidden');
                sourceCustom.classList.remove('hidden');
            }
        });
    });

    // Load library lessons index from audio/lessons.json
    async function initLibrary() {
        try {
            const resp = await fetch('audio/lessons.json');
            if (!resp.ok) throw new Error("Status " + resp.status);
            libraryLessons = await resp.json();
            populateLibrarySelect(libraryLessons);
            if (libraryLessons.length > 0) {
                updatePreviewCard(libraryLessons[0]);
            }
        } catch (e) {
            console.warn("Impossible de charger la bibliothèque distante :", e);
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

    function updatePreviewCard(lesson) {
        if (!lesson) return;
        if (previewNum) previewNum.textContent = `Texte ${lesson.id}`;
        if (previewTitle) previewTitle.textContent = lesson.title;
        if (previewDuration) previewDuration.textContent = lesson.duration;
        if (previewWords) previewWords.textContent = `${lesson.wordsCount} mots`;
    }

    if (librarySelect) {
        librarySelect.addEventListener('change', () => {
            const idx = parseInt(librarySelect.value, 10);
            if (!isNaN(idx) && libraryLessons[idx]) {
                updatePreviewCard(libraryLessons[idx]);
            }
        });
    }

    // Search / filter in library
    if (librarySearch) {
        librarySearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) {
                if (q) clearSearchBtn.classList.remove('hidden');
                else clearSearchBtn.classList.add('hidden');
            }

            if (!q) {
                populateLibrarySelect(libraryLessons);
                if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
                return;
            }

            const filtered = libraryLessons.filter(l => 
                l.title.toLowerCase().includes(q) || 
                String(l.id).includes(q)
            );
            populateLibrarySelect(filtered);
            if (filtered.length > 0) {
                updatePreviewCard(filtered[0]);
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            librarySearch.value = '';
            clearSearchBtn.classList.add('hidden');
            populateLibrarySelect(libraryLessons);
            if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
        });
    }

    // Load selected library lesson
    async function loadLibraryLesson(index) {
        if (index < 0 || index >= libraryLessons.length) return;
        stopShadowing();

        const lesson = libraryLessons[index];
        currentLessonIndex = index;

        libraryStartBtn.disabled = true;
        libraryStartBtn.textContent = "⏳ Chargement...";

        try {
            const res = await fetch(lesson.jsonUrl);
            if (!res.ok) throw new Error("Échec du chargement du fichier JSON de synchronisation.");
            shadWords = await res.json();
            shadAudioElement.src = lesson.audioUrl;

            buildSegments();
            renderText();

            // Update active lesson banner
            if (activeLessonNum) activeLessonNum.textContent = `Texte ${lesson.id}`;
            if (activeLessonTitle) activeLessonTitle.textContent = lesson.title;
            if (prevLessonBtn) prevLessonBtn.disabled = (index === 0);
            if (nextLessonBtn) nextLessonBtn.disabled = (index === libraryLessons.length - 1);
            if (prevLessonBtn) prevLessonBtn.classList.remove('hidden');
            if (nextLessonBtn) nextLessonBtn.classList.remove('hidden');

            // Switch view
            sourceTabsContainer.classList.add('hidden');
            sourceLibrary.classList.add('hidden');
            sourceCustom.classList.add('hidden');

            shadControlsBar.classList.remove('hidden');
            shadStatus.classList.remove('hidden');
            shadStatusText.textContent = "Prêt à démarrer";
            shadStatus.className = "shadowing-status";

            shadCurrentSegmentIndex = 0;
            highlightSegment(0);

        } catch (err) {
            alert("Erreur lors du chargement de la leçon : " + err.message);
        } finally {
            libraryStartBtn.disabled = false;
            libraryStartBtn.textContent = "🚀 Charger et Commencer l'entraînement";
        }
    }

    if (libraryStartBtn) {
        libraryStartBtn.addEventListener('click', () => {
            const selectedIdx = parseInt(librarySelect.value, 10);
            if (!isNaN(selectedIdx)) {
                loadLibraryLesson(selectedIdx);
            }
        });
    }

    // In-Player Navigation
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
            stopShadowing();
            shadControlsBar.classList.add('hidden');
            sourceTabsContainer.classList.remove('hidden');
            const activeTab = document.querySelector('.source-tab.active');
            const target = activeTab ? activeTab.dataset.source : 'library';
            if (target === 'library') {
                sourceLibrary.classList.remove('hidden');
                sourceCustom.classList.add('hidden');
            } else {
                sourceLibrary.classList.add('hidden');
                sourceCustom.classList.remove('hidden');
            }
        });
    }

    // Pause Multiplier
    shadPauseMultInput.addEventListener('input', (e) => {
        shadPauseValDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });

    // Granularity
    shadSegBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shadSegBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            shadGranularity = btn.dataset.granularity;
            if (shadWords.length > 0) {
                buildSegments();
                renderText();
            }
        });
    });

    // Manual Upload Loading
    shadLoadBtn.addEventListener('click', async () => {
        if (!shadAudioInput.files.length || !shadJsonInput.files.length) {
            alert("Veuillez sélectionner les deux fichiers.");
            return;
        }

        const audioFile = shadAudioInput.files[0];
        const jsonFile = shadJsonInput.files[0];

        shadAudioElement.src = URL.createObjectURL(audioFile);

        try {
            const text = await jsonFile.text();
            shadWords = JSON.parse(text);
            
            buildSegments();
            renderText();
            
            currentLessonIndex = -1;
            if (activeLessonNum) activeLessonNum.textContent = "Fichier local";
            if (activeLessonTitle) activeLessonTitle.textContent = audioFile.name;
            if (prevLessonBtn) prevLessonBtn.classList.add('hidden');
            if (nextLessonBtn) nextLessonBtn.classList.add('hidden');

            sourceTabsContainer.classList.add('hidden');
            sourceLibrary.classList.add('hidden');
            sourceCustom.classList.add('hidden');

            shadControlsBar.classList.remove('hidden');
            shadStatus.classList.remove('hidden');
            shadStatusText.textContent = "Prêt à démarrer";
            shadStatus.className = "shadowing-status";

            shadCurrentSegmentIndex = 0;
            highlightSegment(0);

        } catch (e) {
            alert("Erreur de lecture du JSON.");
        }
    });

    // Initialize library on load
    initLibrary();

    function buildSegments() {
        shadSegments = [];
        let currentSeg = { text: "", start: -1, end: -1, words: [] };
        
        for (let i = 0; i < shadWords.length; i++) {
            const w = shadWords[i];
            
            if (currentSeg.start === -1) currentSeg.start = w.start;
            currentSeg.end = w.end;
            currentSeg.words.push(w);
            currentSeg.text += (currentSeg.text ? " " : "") + w.text;

            let cut = false;
            if (shadGranularity === 'word') cut = true;
            else if (shadGranularity === 'comma') {
                if (/[.,;!?]/.test(w.text)) cut = true;
            } else if (shadGranularity === 'sentence') {
                if (/[.!?]/.test(w.text)) cut = true;
            }

            if (cut || i === shadWords.length - 1) {
                shadSegments.push({...currentSeg});
                currentSeg = { text: "", start: -1, end: -1, words: [] };
            }
        }
    }

    function renderText() {
        shadTextDisplay.innerHTML = '';
        shadSegments.forEach((seg, i) => {
            const span = document.createElement('span');
            span.className = 'segment-span';
            span.textContent = seg.text + ' ';
            span.dataset.index = i;
            span.addEventListener('click', () => {
                jumpToSegment(i);
            });
            shadTextDisplay.appendChild(span);
        });
    }

    function highlightSegment(index) {
        document.querySelectorAll('.segment-span').forEach((el, i) => {
            if (i === index) {
                el.classList.add('active');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('active');
            }
        });
    }

    shadPlayBtn.addEventListener('click', () => {
        if (shadIsPlaying) {
            stopShadowing();
        } else {
            if (shadCurrentSegmentIndex === -1) shadCurrentSegmentIndex = 0;
            startShadowing();
        }
    });

    function jumpToSegment(index) {
        shadCurrentSegmentIndex = index;
        if (shadIsPlaying) {
            stopShadowing();
            startShadowing();
        } else {
            highlightSegment(index);
        }
    }

    function stopShadowing() {
        shadIsPlaying = false;
        shadPlayBtn.textContent = "Play";
        shadAudioElement.pause();
        clearTimeout(shadLoopTimeout);
        cancelAnimationFrame(shadAnimFrame);
        shadStatus.className = "shadowing-status";
        shadStatusText.textContent = "En pause";
        shadProgress.style.width = '0%';
    }

    function startShadowing() {
        if (shadCurrentSegmentIndex >= shadSegments.length) {
            shadCurrentSegmentIndex = 0;
        }
        shadIsPlaying = true;
        shadPlayBtn.textContent = "Pause";
        playSegment(shadCurrentSegmentIndex);
    }

    function playSegment(index) {
        if (!shadIsPlaying) return;
        if (index >= shadSegments.length) {
            stopShadowing();
            shadStatusText.textContent = "Terminé !";
            return;
        }

        const seg = shadSegments[index];
        highlightSegment(index);
        
        shadStatus.className = "shadowing-status state-listening";
        shadStatusText.textContent = "Écoutez...";
        shadProgress.style.width = '0%';

        shadAudioElement.currentTime = seg.start;
        shadAudioElement.play();

        const checkEnd = () => {
            if (!shadIsPlaying) return;
            if (shadAudioElement.currentTime >= seg.end) {
                shadAudioElement.pause();
                
                if (shadAutoPauseToggle.checked) {
                    doPausePhase(seg, index);
                } else {
                    // Continuous mode
                    shadCurrentSegmentIndex++;
                    playSegment(shadCurrentSegmentIndex);
                }
            } else {
                shadAnimFrame = requestAnimationFrame(checkEnd);
            }
        };
        shadAnimFrame = requestAnimationFrame(checkEnd);
    }

    function doPausePhase(seg, index) {
        // 1s prep time
        shadStatus.className = "shadowing-status state-success";
        shadStatusText.textContent = "Préparez-vous...";
        
        shadLoopTimeout = setTimeout(() => {
            if (!shadIsPlaying) return;
            
            // Speaking time
            shadStatus.className = "shadowing-status state-speaking";
            shadStatusText.textContent = "À vous !";
            
            const mult = parseFloat(shadPauseMultInput.value);
            const duration = Math.max(1.0, (seg.end - seg.start) * mult);
            
            shadPauseStartTime = performance.now();
            shadPauseDuration = duration * 1000;
            
            const updateProgress = () => {
                if (!shadIsPlaying) return;
                const elapsed = performance.now() - shadPauseStartTime;
                const percent = Math.min(100, (elapsed / shadPauseDuration) * 100);
                shadProgress.style.width = percent + '%';
                
                if (elapsed < shadPauseDuration) {
                    shadAnimFrame = requestAnimationFrame(updateProgress);
                } else {
                    shadProgress.style.width = '0%';
                    shadCurrentSegmentIndex++;
                    playSegment(shadCurrentSegmentIndex);
                }
            };
            shadAnimFrame = requestAnimationFrame(updateProgress);
            
        }, 1000);
    }
});
