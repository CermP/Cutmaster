// ========================================================
// CutMaster — Web Application Logic (v2.1)
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // TOAST NOTIFICATIONS
    // ========================================================
    const toastContainer = document.getElementById('toast-container');
    function showToast(message, icon = 'ℹ️') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }

    // ========================================================
    // LOCAL STORAGE SETTINGS MANAGER
    // ========================================================
    const SETTINGS_KEY = 'cutmaster_settings_v2';
    const defaultSettings = {
        speed: 1.0,
        pauseMult: 2.0,
        prepTime: 1.0,
        autoPause: true,
        loopMode: 0, // 0 = off, 2 = 2x, 3 = 3x, -1 = infinite
        hideText: false,
        beep: false,
        micRecord: false,
        fontFamily: 'font-sans',
        fontSize: 'size-md',
        textAlign: 'align-left',
        focusMode: false,
        granularity: 'sentence',
        lastLessonIndex: 0
    };

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
        } catch (e) {
            return { ...defaultSettings };
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn("Impossible de sauvegarder dans localStorage:", e);
        }
    }

    let userSettings = loadSettings();

    // ========================================================
    // STARRED / FAVORITES MANAGER
    // ========================================================
    function getStarredKey(lessonId) {
        return `cutmaster_starred_lesson_${lessonId}`;
    }

    function getStarredSegments(lessonId) {
        try {
            const data = localStorage.getItem(getStarredKey(lessonId));
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function toggleStarredSegment(lessonId, segmentIndex) {
        let list = getStarredSegments(lessonId);
        const idx = list.indexOf(segmentIndex);
        if (idx === -1) {
            list.push(segmentIndex);
            list.sort((a, b) => a - b);
            showToast("Segment ajouté aux favoris ⭐", "⭐");
        } else {
            list.splice(idx, 1);
            showToast("Segment retiré des favoris", "☆");
        }
        try {
            localStorage.setItem(getStarredKey(lessonId), JSON.stringify(list));
        } catch (e) {}
        return list;
    }

    // ========================================================
    // MODE & TAB SWITCHING
    // ========================================================
    const modeBtns = document.querySelectorAll('.mode-btn');
    const panels = document.querySelectorAll('.panel');

    function switchMode(targetPanelId) {
        modeBtns.forEach(btn => {
            const isActive = btn.dataset.target === targetPanelId;
            btn.classList.toggle('active', isActive);
        });
        panels.forEach(panel => {
            const isActive = panel.id === targetPanelId;
            panel.classList.toggle('active', isActive);
        });
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode(btn.dataset.target);
            if (btn.dataset.target === 'panel-decoupage') {
                window.location.hash = '#decoupage';
            } else {
                window.location.hash = '#shadowing';
            }
        });
    });

    // Hash routing
    function applyHashRoute() {
        if (window.location.hash === '#decoupage') {
            switchMode('panel-decoupage');
        } else {
            switchMode('panel-shadowing');
        }
    }
    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);

    // ========================================================
    // MODALS: SETTINGS & SHORTCUTS
    // ========================================================
    const settingsModal = document.getElementById('settings-modal');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
    const settingsClose = document.getElementById('settings-modal-close');
    const shortcutsClose = document.getElementById('shortcuts-modal-close');
    const shortcutsFooterClose = document.getElementById('btn-close-shortcuts-footer');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    function openModal(modal) {
        if (modal) modal.classList.remove('hidden');
    }
    function closeModal(modal) {
        if (modal) modal.classList.add('hidden');
    }

    if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => openModal(settingsModal));
    if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', () => openModal(shortcutsModal));
    if (settingsClose) settingsClose.addEventListener('click', () => closeModal(settingsModal));
    if (shortcutsClose) shortcutsClose.addEventListener('click', () => closeModal(shortcutsModal));
    if (shortcutsFooterClose) shortcutsFooterClose.addEventListener('click', () => closeModal(shortcutsModal));

    [settingsModal, shortcutsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        }
    });

    // ========================================================
    // DÉCOUPAGE LOGIC
    // ========================================================
    const dropZone = document.getElementById('decoupage-drop-zone');
    const fileInput = document.getElementById('decoupage-file');
    const browseBtn = document.getElementById('decoupage-browse');
    const fileNameDisplay = document.getElementById('decoupage-file-name');
    const processBtn = document.getElementById('decoupage-process');
    const statusDisplay = document.getElementById('decoupage-status');
    const resultArea = document.getElementById('decoupage-result');
    const playBtn = document.getElementById('decoupage-play');
    const downloadBtn = document.getElementById('decoupage-download');
    const minSilenceInput = document.getElementById('min-silence');
    const threshDbInput = document.getElementById('thresh-db');
    const pauseMultInput = document.getElementById('pause-mult');
    const exportFormatSelect = document.getElementById('export-format');
    const decoupagePresetPills = document.querySelectorAll('.preset-pill');

    let decoupageAudioCtx = null;
    let decoupageOriginalBuffer = null;
    let decoupageResultBlob = null;
    let decoupageWs = null;
    let decoupageOutputFilename = "cutmaster_audio";

    // Presets
    const presetsConfig = {
        standard: { silence: 700, thresh: -16, mult: 1.0 },
        slow: { silence: 500, thresh: -18, mult: 1.5 },
        fast: { silence: 900, thresh: -14, mult: 0.8 }
    };

    decoupagePresetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            decoupagePresetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const p = presetsConfig[pill.dataset.preset];
            if (p) {
                if (minSilenceInput) minSilenceInput.value = p.silence;
                if (threshDbInput) threshDbInput.value = p.thresh;
                if (pauseMultInput) pauseMultInput.value = p.mult;
            }
        });
    });

    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleDecoupageFile);

    if (dropZone) {
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
                handleDecoupageFile();
            }
        });
    }

    function handleDecoupageFile() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileNameDisplay.textContent = `Fichier : ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} Mo)`;
            decoupageOriginalBuffer = null;
            resultArea.classList.add('hidden');
            statusDisplay.textContent = "Fichier sélectionné. Prêt pour le traitement.";
            const parts = file.name.split('.');
            parts.pop();
            decoupageOutputFilename = parts.join('.') + "_cutmaster";
        }
    }

    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            if (!fileInput.files.length) {
                statusDisplay.textContent = "⚠️ Veuillez d'abord sélectionner un fichier audio.";
                return;
            }

            const file = fileInput.files[0];
            const minSilenceMs = parseFloat(minSilenceInput.value);
            const threshDb = parseFloat(threshDbInput.value);
            const pauseMult = parseFloat(pauseMultInput.value);
            const format = exportFormatSelect.value;

            try {
                statusDisplay.textContent = "⏳ Chargement et décodage de l'audio...";
                processBtn.disabled = true;

                if (!decoupageAudioCtx) {
                    decoupageAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (decoupageAudioCtx.state === 'suspended') {
                    await decoupageAudioCtx.resume();
                }

                if (!decoupageOriginalBuffer) {
                    const arrayBuffer = await file.arrayBuffer();
                    decoupageOriginalBuffer = await decoupageAudioCtx.decodeAudioData(arrayBuffer);
                }

                statusDisplay.textContent = "🔍 Analyse des silences et calcul des pauses...";
                await new Promise(r => setTimeout(r, 60));

                const resultBuffer = await processAudioAlgorithm(decoupageOriginalBuffer, minSilenceMs, threshDb, pauseMult);
                if (!resultBuffer) {
                    statusDisplay.textContent = "⚠️ Aucun segment détecté. Ajustez les seuils de silence.";
                    processBtn.disabled = false;
                    return;
                }

                statusDisplay.textContent = `📦 Encodage en .${format.toUpperCase()}...`;
                await new Promise(r => setTimeout(r, 60));

                if (format === 'wav') {
                    decoupageResultBlob = audioBufferToWav(resultBuffer);
                    decoupageOutputFilename = decoupageOutputFilename.replace(/\.(wav|mp3)$/i, '') + ".wav";
                } else {
                    decoupageResultBlob = audioBufferToMp3(resultBuffer);
                    decoupageOutputFilename = decoupageOutputFilename.replace(/\.(wav|mp3)$/i, '') + ".mp3";
                }

                statusDisplay.textContent = "✅ Traitement terminé avec succès !";
                resultArea.classList.remove('hidden');

                if (decoupageWs) decoupageWs.destroy();
                decoupageWs = WaveSurfer.create({
                    container: '#waveform',
                    waveColor: '#4C566A',
                    progressColor: '#88C0D0',
                    cursorColor: '#81A1C1',
                    barWidth: 2,
                    barRadius: 2,
                    barGap: 1,
                    height: 85,
                    normalize: true,
                });

                decoupageWs.loadBlob(decoupageResultBlob);
                showToast("Fichier découpé prêt à l'écoute et au téléchargement !", "🎉");

            } catch (err) {
                console.error(err);
                statusDisplay.textContent = "❌ Erreur: " + err.message;
            } finally {
                processBtn.disabled = false;
            }
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (decoupageWs) decoupageWs.playPause();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (decoupageResultBlob) {
                const url = URL.createObjectURL(decoupageResultBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = decoupageOutputFilename;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
                showToast("Téléchargement lancé !", "💾");
            }
        });
    }

    async function processAudioAlgorithm(buffer, minSilenceMs, threshDb, pauseMult) {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const step = 10;
        let totalSum = 0;
        for (let i = 0; i < data.length; i += step) {
            totalSum += data[i] * data[i];
        }
        const overallRMS = Math.sqrt(totalSum / (data.length / step));
        const dbfs = overallRMS > 0 ? 20 * Math.log10(overallRMS) : -100;
        const thresholdDb = dbfs + threshDb;

        const windowSize = Math.floor(sampleRate * 0.01);
        const minSilenceSamples = Math.floor((minSilenceMs / 1000) * sampleRate);

        function getRMS(arr, start, end) {
            let sum = 0;
            for (let i = start; i < end; i++) sum += arr[i] * arr[i];
            return Math.sqrt(sum / (end - start));
        }

        const silences = [];
        let inSilence = false;
        let silenceStart = 0;

        for (let i = 0; i < data.length - windowSize; i += windowSize) {
            const rms = getRMS(data, i, i + windowSize);
            const currentDb = rms > 0 ? 20 * Math.log10(rms) : -100;

            if (currentDb < thresholdDb) {
                if (!inSilence) {
                    inSilence = true;
                    silenceStart = i;
                }
            } else {
                if (inSilence) {
                    inSilence = false;
                    const duration = i - silenceStart;
                    if (duration >= minSilenceSamples) {
                        silences.push({ start: silenceStart, end: i });
                    }
                }
            }
        }
        if (inSilence && (data.length - silenceStart >= minSilenceSamples)) {
            silences.push({ start: silenceStart, end: data.length });
        }

        const segments = [];
        let lastEnd = 0;
        for (const s of silences) {
            if (s.start > lastEnd) {
                segments.push({ start: lastEnd, end: s.start });
            }
            lastEnd = s.end;
        }
        if (lastEnd < data.length) {
            segments.push({ start: lastEnd, end: data.length });
        }

        if (segments.length === 0) return null;

        let totalNewSamples = 0;
        for (const seg of segments) {
            const segDuration = seg.end - seg.start;
            const pauseDuration = Math.floor(segDuration * pauseMult);
            totalNewSamples += segDuration + pauseDuration;
        }

        const outCtx = new (window.AudioContext || window.webkitAudioContext)();
        const newBuffer = outCtx.createBuffer(buffer.numberOfChannels, totalNewSamples, sampleRate);

        for (let c = 0; c < buffer.numberOfChannels; c++) {
            const inChan = buffer.getChannelData(c);
            const outChan = newBuffer.getChannelData(c);
            let writePtr = 0;

            for (const seg of segments) {
                const segLength = seg.end - seg.start;
                outChan.set(inChan.subarray(seg.start, seg.end), writePtr);
                writePtr += segLength;
                const pauseLength = Math.floor(segLength * pauseMult);
                writePtr += pauseLength; // zeroes
            }
        }
        return newBuffer;
    }

    function audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const numSamples = buffer.length;
        const dataByteCount = numSamples * blockAlign;
        const headerByteCount = 44;
        const totalByteCount = headerByteCount + dataByteCount;

        const out = new Uint8Array(totalByteCount);
        const view = new DataView(out.buffer);

        function writeString(offset, str) {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        }

        writeString(0, 'RIFF');
        view.setUint32(4, totalByteCount - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataByteCount, true);

        let offset = 44;
        const channels = [];
        for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

        for (let i = 0; i < numSamples; i++) {
            for (let c = 0; c < numChannels; c++) {
                let sample = Math.max(-1, Math.min(1, channels[c][i]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }
        return new Blob([out.buffer], { type: 'audio/wav' });
    }

    function audioBufferToMp3(buffer) {
        if (typeof lamejs === 'undefined') {
            console.warn("lamejs indisponible, export WAV de secours.");
            return audioBufferToWav(buffer);
        }
        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
        const mp3Data = [];

        function floatToInt16(floatArr) {
            const int16 = new Int16Array(floatArr.length);
            for (let i = 0; i < floatArr.length; i++) {
                let s = Math.max(-1, Math.min(1, floatArr[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            return int16;
        }

        const sampleBlockSize = 1152;
        if (channels === 1) {
            const samples = floatToInt16(buffer.getChannelData(0));
            for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const chunk = samples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(chunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
        } else {
            const left = floatToInt16(buffer.getChannelData(0));
            const right = floatToInt16(buffer.getChannelData(1));
            for (let i = 0; i < left.length; i += sampleBlockSize) {
                const leftChunk = left.subarray(i, i + sampleBlockSize);
                const rightChunk = right.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
        }
        const endBuf = mp3encoder.flush();
        if (endBuf.length > 0) mp3Data.push(endBuf);
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    // ========================================================
    // SHADOWING ELEMENTS & STATE
    // ========================================================
    const sourceTabs = document.querySelectorAll('.source-tab');
    const sourceTabsContainer = document.getElementById('shadowing-source-tabs');
    const sourceLibrary = document.getElementById('source-library');
    const sourceCustom = document.getElementById('source-custom');
    const librarySearch = document.getElementById('library-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchCountBadge = document.getElementById('search-count');
    const libraryEmptyState = document.getElementById('library-empty-state');
    const librarySelectGroup = document.getElementById('library-select-group');
    const btnRandomLesson = document.getElementById('btn-random-lesson');
    const btnResetSearch = document.getElementById('btn-reset-search');
    const librarySelect = document.getElementById('library-select');
    const libraryStartBtn = document.getElementById('library-start-btn');
    const lessonPreviewCard = document.getElementById('lesson-preview-card');
    const previewNum = document.getElementById('preview-lesson-num');
    const previewTitle = document.getElementById('preview-lesson-title');
    const previewDuration = document.getElementById('preview-lesson-duration');
    const previewWords = document.getElementById('preview-lesson-words');

    // In-Player Elements
    const shadControlsBar = document.getElementById('shadowing-controls-bar');
    const activeLessonNum = document.getElementById('active-lesson-num');
    const activeLessonTitle = document.getElementById('active-lesson-title');
    const prevLessonBtn = document.getElementById('prev-lesson-btn');
    const nextLessonBtn = document.getElementById('next-lesson-btn');
    const changeLessonBtn = document.getElementById('change-lesson-btn');
    const filterStarredBtn = document.getElementById('filter-starred-btn');
    const filterStarredCount = document.getElementById('filter-starred-count');

    // Scrubber
    const timelineContainer = document.getElementById('timeline-container');
    const timelineTrack = document.getElementById('timeline-track');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineThumb = document.getElementById('timeline-thumb');
    const timeCurrentDisplay = document.getElementById('time-current');
    const timeTotalDisplay = document.getElementById('time-total');
    const segmentCurrentDisplay = document.getElementById('segment-current');
    const segmentTotalDisplay = document.getElementById('segment-total');

    // Play row
    const shadPlayBtn = document.getElementById('shadowing-play');
    const playBtnLabel = document.getElementById('play-btn-label');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const prevSegBtn = document.getElementById('prev-seg-btn');
    const nextSegBtn = document.getElementById('next-seg-btn');
    const replaySegBtn = document.getElementById('replay-seg-btn');
    const starCurrentBtn = document.getElementById('star-current-btn');

    // Granularity & Speed
    const shadSegBtns = document.querySelectorAll('.seg-btn');
    const shadSpeedInput = document.getElementById('shadowing-speed');
    const shadSpeedVal = document.getElementById('shadowing-speed-val');
    const speedPills = document.querySelectorAll('.speed-pill');
    const shadPauseMultInput = document.getElementById('shadowing-pause-mult');
    const shadPauseVal = document.getElementById('shadowing-pause-val');
    const shadPrepTimeInput = document.getElementById('shadowing-prep-time');
    const shadPrepVal = document.getElementById('shadowing-prep-val');

    // Toggles
    const autoPauseToggle = document.getElementById('auto-pause-toggle');
    const hideTextToggle = document.getElementById('hide-text-toggle');
    const beepToggle = document.getElementById('beep-toggle');
    const micRecordToggle = document.getElementById('mic-record-toggle');
    const loopPills = document.querySelectorAll('.loop-pill');

    // Status & Feedback
    const shadStatus = document.getElementById('shadowing-status');
    const statusIcon = document.getElementById('status-icon');
    const shadStatusText = document.getElementById('shadowing-status-text');
    const countdownTimer = document.getElementById('countdown-timer');
    const comparisonCard = document.getElementById('comparison-card');
    const compSegmentLabel = document.getElementById('comp-segment-label');
    const compPlayOriginalBtn = document.getElementById('comp-play-original');
    const compPlayUserBtn = document.getElementById('comp-play-user');
    const compRetrySegBtn = document.getElementById('comp-retry-seg');
    const shadProgress = document.getElementById('shadowing-progress');

    // Text Display & Toolbar
    const textAreaCard = document.getElementById('text-area-card');
    const shadTextDisplay = document.getElementById('shadowing-text');
    const btnFontDecrease = document.getElementById('btn-font-decrease');
    const btnFontIncrease = document.getElementById('btn-font-increase');
    const btnToggleFocus = document.getElementById('btn-toggle-focus');
    const btnCopyText = document.getElementById('btn-copy-text');

    // Audio elements
    const shadAudio = document.getElementById('shadowing-audio-player');
    const userAudio = document.getElementById('user-audio-player');

    // Upload files
    const shadAudioInput = document.getElementById('shadowing-audio');
    const shadJsonInput = document.getElementById('shadowing-json');
    const shadLoadBtn = document.getElementById('shadowing-load');

    // Training State
    let libraryLessons = [];
    let currentLessonIndex = -1;
    let currentLessonId = null;
    let shadWords = [];
    let shadSegments = [];
    let shadCurrentSegmentIndex = -1;
    let shadIsPlaying = false;
    let shadAnimFrame = null;
    let timeUpdateInterval = null;
    let loopMode = userSettings.loopMode; // 0, 2, 3, -1
    let segmentLoopCounter = 0; // count of plays for current segment
    let filterOnlyStarred = false;
    let lastRecordedSegmentIndex = -1;
    let lastActiveWordIdx = -1;

    // Microphone & MediaRecorder
    let mediaRecorder = null;
    let audioStream = null;
    let recordedChunks = [];
    let lastUserAudioBlobUrl = null;
    let lastOriginalSegmentSlice = null;

    // Beep audio context
    let beepCtx = null;

    function initBeepContext() {
        if (!beepToggle.checked) return;
        try {
            if (!beepCtx) beepCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (beepCtx.state === 'suspended') beepCtx.resume();
        } catch (e) {}
    }

    function playBeep() {
        if (!beepToggle.checked) return;
        try {
            if (!beepCtx) initBeepContext();
            if (beepCtx.state === 'suspended') beepCtx.resume();
            
            const osc = beepCtx.createOscillator();
            const gain = beepCtx.createGain();
            osc.connect(gain);
            gain.connect(beepCtx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.18, beepCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, beepCtx.currentTime + 0.16);
            osc.start(beepCtx.currentTime);
            osc.stop(beepCtx.currentTime + 0.16);
        } catch (e) {}
    }

    let isRecordingIntended = false;

    // MediaRecorder functions
    async function startRecording(segmentIndex) {
        if (!micRecordToggle.checked) return;
        isRecordingIntended = true;
        try {
            if (!audioStream) {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            if (!isRecordingIntended || !shadIsPlaying) return;

            recordedChunks = [];
            const mimeType = (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
                ? 'audio/webm;codecs=opus'
                : ((typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm'))
                    ? 'audio/webm'
                    : ((typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/mp4'))
                        ? 'audio/mp4'
                        : ''));

            mediaRecorder = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
                const recordedType = mimeType || 'audio/webm';
                const blob = new Blob(recordedChunks, { type: recordedType });
                if (lastUserAudioBlobUrl) URL.revokeObjectURL(lastUserAudioBlobUrl);
                lastUserAudioBlobUrl = URL.createObjectURL(blob);
                if (userAudio) userAudio.src = lastUserAudioBlobUrl;

                if (comparisonCard && compSegmentLabel) {
                    lastRecordedSegmentIndex = segmentIndex;
                    compSegmentLabel.textContent = `Segment ${segmentIndex + 1}`;
                    comparisonCard.classList.remove('hidden');
                }
                showToast("Enregistrement vocal terminé ! Utilisez la carte ci-dessous pour comparer.", "🎙️");
            };
            mediaRecorder.start();
        } catch (err) {
            console.warn("Microphone non accessible :", err);
            micRecordToggle.checked = false;
            showToast("Accès au microphone refusé ou non supporté.", "⚠️");
        }
    }

    function stopRecording() {
        isRecordingIntended = false;
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            try {
                mediaRecorder.stop();
            } catch (e) {}
        }
    }

    if (compPlayOriginalBtn) {
        compPlayOriginalBtn.addEventListener('click', () => {
            if (lastOriginalSegmentSlice && shadAudio) {
                shadAudio.pause();
                shadAudio.currentTime = lastOriginalSegmentSlice.start;
                shadAudio.play();
                const stopAt = () => {
                    if (shadAudio.currentTime >= lastOriginalSegmentSlice.end) {
                        shadAudio.pause();
                    } else {
                        requestAnimationFrame(stopAt);
                    }
                };
                requestAnimationFrame(stopAt);
            }
        });
    }

    if (compPlayUserBtn) {
        compPlayUserBtn.addEventListener('click', () => {
            if (userAudio && lastUserAudioBlobUrl) {
                userAudio.currentTime = 0;
                userAudio.play();
            }
        });
    }

    if (compRetrySegBtn) {
        compRetrySegBtn.addEventListener('click', () => {
            if (lastRecordedSegmentIndex >= 0) {
                jumpToSegment(lastRecordedSegmentIndex);
                startShadowing();
            }
        });
    }

    // ========================================================
    // INITIALIZE & APPLY SAVED SETTINGS
    // ========================================================
    function applySavedSettings() {
        // Speed
        if (shadSpeedInput) {
            shadSpeedInput.value = userSettings.speed;
            shadSpeedVal.textContent = parseFloat(userSettings.speed).toFixed(2) + 'x';
            shadAudio.playbackRate = userSettings.speed;
        }
        speedPills.forEach(p => {
            p.classList.toggle('active', parseFloat(p.dataset.speed) === parseFloat(userSettings.speed));
        });

        // Pause Mult
        if (shadPauseMultInput) {
            shadPauseMultInput.value = userSettings.pauseMult;
            shadPauseVal.textContent = parseFloat(userSettings.pauseMult).toFixed(1) + 'x';
        }

        // Prep Time
        if (shadPrepTimeInput) {
            shadPrepTimeInput.value = userSettings.prepTime;
            shadPrepVal.textContent = parseFloat(userSettings.prepTime).toFixed(1) + 's';
        }

        // Toggles
        if (autoPauseToggle) autoPauseToggle.checked = userSettings.autoPause;
        if (hideTextToggle) {
            hideTextToggle.checked = userSettings.hideText;
            shadTextDisplay.classList.toggle('text-hidden', userSettings.hideText);
        }
        if (beepToggle) beepToggle.checked = userSettings.beep;
        if (micRecordToggle) micRecordToggle.checked = userSettings.micRecord;

        // Loop mode
        loopMode = userSettings.loopMode;
        loopPills.forEach(pill => {
            pill.classList.toggle('active', parseInt(pill.dataset.loop, 10) === loopMode);
        });

        // Granularity
        shadSegBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.granularity === userSettings.granularity);
        });

        // Typography on text display
        applyTypographySettings();
    }

    function applyTypographySettings() {
        shadTextDisplay.className = 'text-display';
        shadTextDisplay.classList.add(userSettings.fontFamily || 'font-sans');
        shadTextDisplay.classList.add(userSettings.fontSize || 'size-md');
        shadTextDisplay.classList.add(userSettings.textAlign || 'align-left');
        if (userSettings.focusMode) shadTextDisplay.classList.add('mode-focus');
        if (hideTextToggle && hideTextToggle.checked) shadTextDisplay.classList.add('text-hidden');

        if (btnToggleFocus) btnToggleFocus.classList.toggle('active', userSettings.focusMode);

        // Update modal pill states
        document.querySelectorAll('#font-family-options .option-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.font === userSettings.fontFamily);
        });
        document.querySelectorAll('#font-size-options .option-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.size === userSettings.fontSize);
        });
        document.querySelectorAll('#text-align-options .option-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.align === userSettings.textAlign);
        });
        const focusPrefCheck = document.getElementById('focus-mode-pref');
        if (focusPrefCheck) focusPrefCheck.checked = userSettings.focusMode;
    }

    // Settings Modal Options
    document.querySelectorAll('#font-family-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#font-family-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.fontFamily = pill.dataset.font;
            applyTypographySettings();
            saveSettings(userSettings);
        });
    });

    document.querySelectorAll('#font-size-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#font-size-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.fontSize = pill.dataset.size;
            applyTypographySettings();
            saveSettings(userSettings);
        });
    });

    document.querySelectorAll('#text-align-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#text-align-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.textAlign = pill.dataset.align;
            applyTypographySettings();
            saveSettings(userSettings);
        });
    });

    const focusPrefCheck = document.getElementById('focus-mode-pref');
    if (focusPrefCheck) {
        focusPrefCheck.addEventListener('change', () => {
            userSettings.focusMode = focusPrefCheck.checked;
            applyTypographySettings();
            saveSettings(userSettings);
        });
    }

    if (btnSaveSettings) {
        btnSaveSettings.addEventListener('click', () => {
            saveSettings(userSettings);
            closeModal(settingsModal);
            showToast("Préférences d'affichage enregistrées !", "⚙️");
        });
    }

    // Text Toolbar Quick Buttons
    const fontSizesList = ['size-sm', 'size-md', 'size-lg', 'size-xl'];
    if (btnFontDecrease) {
        btnFontDecrease.addEventListener('click', () => {
            let idx = fontSizesList.indexOf(userSettings.fontSize);
            if (idx > 0) {
                userSettings.fontSize = fontSizesList[idx - 1];
                applyTypographySettings();
                saveSettings(userSettings);
            }
        });
    }
    if (btnFontIncrease) {
        btnFontIncrease.addEventListener('click', () => {
            let idx = fontSizesList.indexOf(userSettings.fontSize);
            if (idx < fontSizesList.length - 1) {
                userSettings.fontSize = fontSizesList[idx + 1];
                applyTypographySettings();
                saveSettings(userSettings);
            }
        });
    }
    if (btnToggleFocus) {
        btnToggleFocus.addEventListener('click', () => {
            userSettings.focusMode = !userSettings.focusMode;
            applyTypographySettings();
            saveSettings(userSettings);
            showToast(userSettings.focusMode ? "Mode Focus activé" : "Mode Focus désactivé", "🎯");
        });
    }
    if (btnCopyText) {
        btnCopyText.addEventListener('click', () => {
            if (shadWords.length > 0) {
                const fullText = shadSegments.map(s => s.text).join(' ');
                navigator.clipboard.writeText(fullText).then(() => {
                    showToast("Texte copié dans le presse-papiers !", "📋");
                }).catch(() => {
                    showToast("Échec de la copie", "⚠️");
                });
            }
        });
    }

    // Format time helper (mm:ss)
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ========================================================
    // LIBRARY LESSONS INDEX & SEARCH
    // ========================================================
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

    async function initLibrary() {
        try {
            const resp = await fetch('audio/lessons.json');
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            libraryLessons = await resp.json();
            populateLibrarySelect(libraryLessons);
            if (searchCountBadge) {
                searchCountBadge.textContent = `${libraryLessons.length} textes`;
            }
            
            const initialIdx = userSettings.lastLessonIndex && userSettings.lastLessonIndex < libraryLessons.length ? userSettings.lastLessonIndex : 0;
            if (libraryLessons.length > 0) {
                librarySelect.value = initialIdx;
                updatePreviewCard(libraryLessons[initialIdx]);
            }
        } catch (e) {
            console.warn("Impossible de charger la bibliothèque distante :", e);
            if (librarySelect) {
                librarySelect.innerHTML = '<option value="">⚠️ Bibliothèque indisponible (ouvrez en serveur local)</option>';
            }
        }
    }

    function populateLibrarySelect(lessons) {
        if (!librarySelect) return;
        librarySelect.innerHTML = '';
        lessons.forEach(l => {
            const opt = document.createElement('option');
            opt.value = libraryLessons.indexOf(l);
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

    if (librarySearch) {
        librarySearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle('hidden', !q);
            }
            if (!q) {
                if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
                if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
                if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
                populateLibrarySelect(libraryLessons);
                if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
                if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
                return;
            }
            const filtered = libraryLessons.filter(l => 
                l.title.toLowerCase().includes(q) || 
                String(l.id).includes(q)
            );
            if (searchCountBadge) {
                searchCountBadge.textContent = `${filtered.length} texte${filtered.length > 1 ? 's' : ''}`;
            }
            if (filtered.length === 0) {
                if (libraryEmptyState) libraryEmptyState.classList.remove('hidden');
                if (librarySelectGroup) librarySelectGroup.classList.add('hidden');
                if (lessonPreviewCard) lessonPreviewCard.classList.add('hidden');
            } else {
                if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
                if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
                if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
                populateLibrarySelect(filtered);
                updatePreviewCard(filtered[0]);
            }
        });
    }

    if (btnResetSearch) {
        btnResetSearch.addEventListener('click', () => {
            if (librarySearch) librarySearch.value = '';
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
            if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
            if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
            populateLibrarySelect(libraryLessons);
            if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
            if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
        });
    }

    if (btnRandomLesson) {
        btnRandomLesson.addEventListener('click', () => {
            if (!libraryLessons.length) return;
            const randIdx = Math.floor(Math.random() * libraryLessons.length);
            if (librarySearch && librarySearch.value) {
                librarySearch.value = '';
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
                if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
                if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
                populateLibrarySelect(libraryLessons);
            }
            if (librarySelect) librarySelect.value = randIdx;
            updatePreviewCard(libraryLessons[randIdx]);
            showToast(`Sujet tiré au sort : Texte ${libraryLessons[randIdx].id}`, "🎲");
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            librarySearch.value = '';
            clearSearchBtn.classList.add('hidden');
            if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
            if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
            if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
            populateLibrarySelect(libraryLessons);
            if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
            if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
        });
    }

    // ========================================================
    // LOAD LESSON ENGINE
    // ========================================================
    async function loadLibraryLesson(index) {
        if (index < 0 || index >= libraryLessons.length) return;
        stopShadowing();

        const lesson = libraryLessons[index];
        currentLessonIndex = index;
        currentLessonId = lesson.id;
        userSettings.lastLessonIndex = index;
        saveSettings(userSettings);

        if (libraryStartBtn) {
            libraryStartBtn.disabled = true;
            libraryStartBtn.textContent = "⏳ Chargement de la synchronisation...";
        }

        try {
            const res = await fetch(lesson.jsonUrl);
            if (!res.ok) throw new Error("Échec du chargement du fichier JSON de synchronisation.");
            shadWords = await res.json();
            shadAudio.src = lesson.audioUrl;

            buildSegments();
            renderText();

            // Active lesson banner
            if (activeLessonNum) activeLessonNum.textContent = `Texte ${lesson.id}`;
            if (activeLessonTitle) activeLessonTitle.textContent = lesson.title;
            if (prevLessonBtn) prevLessonBtn.disabled = (index === 0);
            if (nextLessonBtn) nextLessonBtn.disabled = (index === libraryLessons.length - 1);
            if (prevLessonBtn) prevLessonBtn.classList.remove('hidden');
            if (nextLessonBtn) nextLessonBtn.classList.remove('hidden');

            updateStarredCounter();

            // Show training controls, hide picker
            sourceTabsContainer.classList.add('hidden');
            sourceLibrary.classList.add('hidden');
            sourceCustom.classList.add('hidden');

            shadControlsBar.classList.remove('hidden');
            shadStatus.classList.remove('hidden');
            shadStatus.className = "shadowing-status";
            shadStatusText.textContent = "Prêt à démarrer";
            if (statusIcon) statusIcon.textContent = "🎧";

            segmentTotalDisplay.textContent = shadSegments.length;
            shadAudio.addEventListener('loadedmetadata', updateTimelineUI, { once: true });

            shadCurrentSegmentIndex = 0;
            segmentCurrentDisplay.textContent = '1';
            highlightSegment(0);

            showToast(`Texte ${lesson.id} chargé avec succès !`, "🚀");

        } catch (err) {
            alert("Erreur lors du chargement de la leçon : " + err.message);
        } finally {
            if (libraryStartBtn) {
                libraryStartBtn.disabled = false;
                libraryStartBtn.textContent = "🚀 Charger et Commencer l'entraînement";
            }
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

    // Custom File Upload
    if (shadLoadBtn) {
        shadLoadBtn.addEventListener('click', async () => {
            if (!shadAudioInput.files.length || !shadJsonInput.files.length) {
                alert("Veuillez sélectionner le fichier audio ET le fichier JSON.");
                return;
            }

            const audioFile = shadAudioInput.files[0];
            const jsonFile = shadJsonInput.files[0];

            shadAudio.src = URL.createObjectURL(audioFile);

            try {
                const text = await jsonFile.text();
                shadWords = JSON.parse(text);
                currentLessonIndex = -1;
                currentLessonId = 'custom_' + audioFile.name;

                buildSegments();
                renderText();

                if (activeLessonNum) activeLessonNum.textContent = "Fichier local";
                if (activeLessonTitle) activeLessonTitle.textContent = audioFile.name;
                if (prevLessonBtn) prevLessonBtn.classList.add('hidden');
                if (nextLessonBtn) nextLessonBtn.classList.add('hidden');

                sourceTabsContainer.classList.add('hidden');
                sourceLibrary.classList.add('hidden');
                sourceCustom.classList.add('hidden');

                shadControlsBar.classList.remove('hidden');
                shadStatus.classList.remove('hidden');
                shadStatus.className = "shadowing-status";
                shadStatusText.textContent = "Prêt à démarrer";
                if (statusIcon) statusIcon.textContent = "🎧";

                segmentTotalDisplay.textContent = shadSegments.length;
                shadAudio.addEventListener('loadedmetadata', updateTimelineUI, { once: true });

                shadCurrentSegmentIndex = 0;
                segmentCurrentDisplay.textContent = '1';
                highlightSegment(0);
                updateStarredCounter();

                showToast("Fichier importé avec succès !", "📁");
            } catch (e) {
                alert("Erreur de parsing du fichier JSON.");
            }
        });
    }

    // In-Player Navigation
    if (prevLessonBtn) {
        prevLessonBtn.addEventListener('click', () => {
            if (currentLessonIndex > 0) loadLibraryLesson(currentLessonIndex - 1);
        });
    }
    if (nextLessonBtn) {
        nextLessonBtn.addEventListener('click', () => {
            if (currentLessonIndex < libraryLessons.length - 1) loadLibraryLesson(currentLessonIndex + 1);
        });
    }
    if (changeLessonBtn) {
        changeLessonBtn.addEventListener('click', () => {
            stopShadowing();
            shadControlsBar.classList.add('hidden');
            shadStatus.classList.add('hidden');
            shadTextDisplay.innerHTML = '';
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

    // ========================================================
    // SEGMENTATION & TEXT RENDERING
    // ========================================================
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
            const gran = userSettings.granularity;
            if (gran === 'word') cut = true;
            else if (gran === 'comma') {
                if (/[.,;!?]/.test(w.text)) cut = true;
            } else {
                // sentence
                if (/[.!?]/.test(w.text)) cut = true;
            }

            if (cut || i === shadWords.length - 1) {
                shadSegments.push({ ...currentSeg, originalIndex: shadSegments.length });
                currentSeg = { text: "", start: -1, end: -1, words: [] };
            }
        }
    }

    function renderText() {
        shadTextDisplay.innerHTML = '';
        const starredList = getStarredSegments(currentLessonId);

        shadSegments.forEach((seg, i) => {
            const isStarred = starredList.includes(i);
            if (filterOnlyStarred && !isStarred) return;

            const span = document.createElement('span');
            span.className = 'segment-span future';
            span.setAttribute('role', 'button');
            span.setAttribute('tabindex', '0');
            span.setAttribute('aria-label', `Segment ${i + 1}`);
            if (isStarred) span.classList.add('is-starred');
            span.dataset.index = i;

            // Render words inside segment
            seg.words.forEach((w, wIdx) => {
                const wSpan = document.createElement('span');
                wSpan.className = 'word-span';
                wSpan.textContent = w.text + ' ';
                wSpan.dataset.start = w.start;
                wSpan.dataset.end = w.end;
                wSpan.dataset.wordIndex = wIdx;
                wSpan.title = `Écouter "${w.text}" (${w.start.toFixed(1)}s - ${w.end.toFixed(1)}s)`;
                wSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playWordSnippet(w.start, w.end, wSpan);
                });
                span.appendChild(wSpan);
            });

            span.addEventListener('click', () => {
                jumpToSegment(i);
            });
            span.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpToSegment(i);
                }
            });

            shadTextDisplay.appendChild(span);
        });
    }

    let wordSnippetTimeout = null;
    function playWordSnippet(start, end, wSpan) {
        if (!shadAudio) return;
        if (wSpan) {
            wSpan.classList.add('is-playing-snippet');
            setTimeout(() => wSpan.classList.remove('is-playing-snippet'), 450);
        }
        const wasPlaying = shadIsPlaying;
        if (wasPlaying) stopShadowing();

        shadAudio.currentTime = Math.max(0, start - 0.04);
        shadAudio.play().catch(() => {});

        const durationMs = Math.max(220, (end - start + 0.12) * 1000);
        if (wordSnippetTimeout) clearTimeout(wordSnippetTimeout);
        wordSnippetTimeout = setTimeout(() => {
            shadAudio.pause();
        }, durationMs);
    }

    function updateActiveWordHighlight(segmentIndex, currentTime) {
        const seg = shadSegments[segmentIndex];
        if (!seg || !seg.words) return;
        const activeWordIdx = seg.words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
        if (activeWordIdx === lastActiveWordIdx) return;
        lastActiveWordIdx = activeWordIdx;

        const currentSegEl = document.querySelector(`.segment-span[data-index="${segmentIndex}"]`);
        if (!currentSegEl) return;

        const allWordSpans = currentSegEl.querySelectorAll('.word-span');
        allWordSpans.forEach((wEl, idx) => {
            if (idx === activeWordIdx) {
                wEl.classList.add('is-active-word');
            } else {
                wEl.classList.remove('is-active-word');
            }
        });
    }

    function clearActiveWordHighlight() {
        document.querySelectorAll('.word-span.is-active-word').forEach(el => {
            el.classList.remove('is-active-word');
        });
        lastActiveWordIdx = -1;
    }

    function updateStarredCounter() {
        if (!filterStarredCount) return;
        const list = getStarredSegments(currentLessonId);
        filterStarredCount.textContent = list.length;
        if (starCurrentBtn) {
            const isStarred = list.includes(shadCurrentSegmentIndex);
            starCurrentBtn.classList.toggle('is-starred', isStarred);
            starCurrentBtn.querySelector('.star-icon').textContent = isStarred ? '⭐' : '☆';
        }
    }

    if (starCurrentBtn) {
        starCurrentBtn.addEventListener('click', () => {
            if (shadCurrentSegmentIndex >= 0 && currentLessonId) {
                toggleStarredSegment(currentLessonId, shadCurrentSegmentIndex);
                updateStarredCounter();
                const currentEl = document.querySelector(`.segment-span[data-index="${shadCurrentSegmentIndex}"]`);
                if (currentEl) {
                    const starredList = getStarredSegments(currentLessonId);
                    currentEl.classList.toggle('is-starred', starredList.includes(shadCurrentSegmentIndex));
                }
            }
        });
    }

    if (filterStarredBtn) {
        filterStarredBtn.addEventListener('click', () => {
            filterOnlyStarred = !filterOnlyStarred;
            filterStarredBtn.classList.toggle('active', filterOnlyStarred);
            renderText();
            highlightSegment(shadCurrentSegmentIndex);
            showToast(filterOnlyStarred ? "Filtre activé : Segments favoris uniquement" : "Filtre désactivé : Tous les segments", "⭐");
        });
    }

    function highlightSegment(index) {
        clearActiveWordHighlight();
        let targetElement = null;
        document.querySelectorAll('.segment-span').forEach(el => {
            const elIdx = parseInt(el.dataset.index, 10);
            el.classList.remove('active', 'past', 'future');
            if (elIdx < index) {
                el.classList.add('past');
            } else if (elIdx === index) {
                el.classList.add('active');
                targetElement = el;
            } else {
                el.classList.add('future');
            }
        });

        // Smooth scroll INSIDE the text area container without jerking the browser window
        if (targetElement && shadTextDisplay) {
            const containerRect = shadTextDisplay.getBoundingClientRect();
            const elRect = targetElement.getBoundingClientRect();
            const relativeTop = elRect.top - containerRect.top + shadTextDisplay.scrollTop;
            const targetScrollTop = Math.max(0, relativeTop - (containerRect.height / 2) + (elRect.height / 2));
            shadTextDisplay.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        }

        segmentCurrentDisplay.textContent = index + 1;
        updateStarredCounter();
        updateTimelineUI();
    }

    // ========================================================
    // TIMELINE SCRUBBER
    // ========================================================
    function updateTimelineUI() {
        const cur = shadAudio.currentTime;
        let dur = shadAudio.duration;
        if ((!dur || isNaN(dur) || !isFinite(dur)) && currentLessonIndex >= 0 && libraryLessons[currentLessonIndex]) {
            dur = libraryLessons[currentLessonIndex].durationSec || 0;
        }
        timeCurrentDisplay.textContent = formatTime(cur);
        timeTotalDisplay.textContent = formatTime(dur);

        if (dur > 0) {
            const percent = Math.min(100, Math.max(0, (cur / dur) * 100));
            timelineProgress.style.width = percent + '%';
            timelineThumb.style.left = percent + '%';
            if (timelineTrack) {
                timelineTrack.setAttribute('aria-valuenow', Math.round(percent));
            }
        }
    }

    if (timelineTrack) {
        timelineTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (shadAudio.duration > 0) {
                    shadAudio.currentTime = Math.max(0, shadAudio.currentTime - 5);
                    updateTimelineUI();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (shadAudio.duration > 0) {
                    shadAudio.currentTime = Math.min(shadAudio.duration, shadAudio.currentTime + 5);
                    updateTimelineUI();
                }
            }
        });
    }

    if (timelineContainer) {
        timelineContainer.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            if (shadAudio.duration > 0) {
                const targetTime = ratio * shadAudio.duration;
                shadAudio.currentTime = targetTime;
                
                // Find matching segment
                let match = 0;
                for (let i = 0; i < shadSegments.length; i++) {
                    if (targetTime >= shadSegments[i].start && targetTime <= shadSegments[i].end) {
                        match = i;
                        break;
                    }
                    if (targetTime > shadSegments[i].end) match = i;
                }
                jumpToSegment(match);
            }
        });
    }

    function startTimeUpdater() {
        stopTimeUpdater();
        timeUpdateInterval = setInterval(updateTimelineUI, 200);
    }
    function stopTimeUpdater() {
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
        }
    }

    // ========================================================
    // PLAYBACK CONTROLS & TRAINING EXECUTION
    // ========================================================
    function updatePlayButtonUI(playing) {
        if (playing) {
            playBtnLabel.textContent = 'Pause';
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            shadPlayBtn.classList.add('is-playing');
        } else {
            playBtnLabel.textContent = 'Démarrer';
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            shadPlayBtn.classList.remove('is-playing');
        }
    }

    shadPlayBtn.addEventListener('click', () => {
        if (shadIsPlaying) {
            stopShadowing();
        } else {
            if (shadCurrentSegmentIndex === -1) shadCurrentSegmentIndex = 0;
            initBeepContext();
            startShadowing();
        }
    });

    if (prevSegBtn) {
        prevSegBtn.addEventListener('click', () => {
            if (shadCurrentSegmentIndex > 0) {
                jumpToSegment(shadCurrentSegmentIndex - 1);
            }
        });
    }
    if (nextSegBtn) {
        nextSegBtn.addEventListener('click', () => {
            if (shadCurrentSegmentIndex < shadSegments.length - 1) {
                jumpToSegment(shadCurrentSegmentIndex + 1);
            }
        });
    }
    if (replaySegBtn) {
        replaySegBtn.addEventListener('click', () => {
            if (shadCurrentSegmentIndex >= 0) {
                jumpToSegment(shadCurrentSegmentIndex);
            }
        });
    }

    function jumpToSegment(index) {
        shadCurrentSegmentIndex = index;
        segmentLoopCounter = 0;
        if (shadIsPlaying) {
            stopShadowing();
            startShadowing();
        } else {
            highlightSegment(index);
        }
    }

    function stopShadowing() {
        shadIsPlaying = false;
        updatePlayButtonUI(false);
        shadAudio.pause();
        cancelAnimationFrame(shadAnimFrame);
        stopTimeUpdater();
        stopRecording();
        clearActiveWordHighlight();

        shadStatus.className = "shadowing-status";
        shadStatusText.textContent = "En pause";
        if (statusIcon) statusIcon.textContent = "⏸️";
        shadProgress.style.width = '0%';
        countdownTimer.classList.add('hidden');
    }

    function startShadowing() {
        if (shadCurrentSegmentIndex >= shadSegments.length) {
            shadCurrentSegmentIndex = 0;
        }
        shadIsPlaying = true;
        updatePlayButtonUI(true);
        shadAudio.playbackRate = parseFloat(shadSpeedInput.value);
        startTimeUpdater();
        playSegment(shadCurrentSegmentIndex);
    }

    function getNextSegmentIndex(fromIndex) {
        if (!filterOnlyStarred) return fromIndex + 1;
        const starred = getStarredSegments(currentLessonId);
        for (let i = fromIndex + 1; i < shadSegments.length; i++) {
            if (starred.includes(i)) return i;
        }
        return shadSegments.length; // finished
    }

    function playSegment(index) {
        if (!shadIsPlaying) return;
        if (index >= shadSegments.length) {
            stopShadowing();
            shadStatusText.textContent = "Leçon terminée ! Bravo ! 🎉";
            if (statusIcon) statusIcon.textContent = "🏆";
            shadStatus.className = "shadowing-status state-done";
            showToast("Leçon terminée avec succès !", "🎉");
            return;
        }

        const seg = shadSegments[index];
        lastOriginalSegmentSlice = { start: seg.start, end: seg.end };
        highlightSegment(index);

        shadStatus.className = "shadowing-status state-listening";
        shadStatusText.textContent = "Écoutez attentivement...";
        if (statusIcon) statusIcon.textContent = "🎧";
        shadProgress.style.width = '0%';
        countdownTimer.classList.add('hidden');

        shadAudio.currentTime = seg.start;
        shadAudio.play();

        const checkEnd = () => {
            if (!shadIsPlaying) return;
            updateTimelineUI();
            updateActiveWordHighlight(index, shadAudio.currentTime);

            if (shadAudio.currentTime >= seg.end) {
                clearActiveWordHighlight();
                shadAudio.pause();
                if (autoPauseToggle.checked) {
                    doPausePhase(seg, index);
                } else {
                    // Continuous mode
                    shadCurrentSegmentIndex = getNextSegmentIndex(index);
                    playSegment(shadCurrentSegmentIndex);
                }
            } else {
                shadAnimFrame = requestAnimationFrame(checkEnd);
            }
        };
        shadAnimFrame = requestAnimationFrame(checkEnd);
    }

    function doPausePhase(seg, index) {
        const prepTime = parseFloat(shadPrepTimeInput.value) * 1000;
        if (prepTime > 0) {
            shadStatus.className = "shadowing-status state-prep";
            shadStatusText.textContent = "Préparez-vous...";
            if (statusIcon) statusIcon.textContent = "⏳";
            countdownTimer.classList.remove('hidden');

            const prepStart = performance.now();
            const animatePrep = () => {
                if (!shadIsPlaying) return;
                const elapsed = performance.now() - prepStart;
                const remaining = Math.max(0, (prepTime - elapsed) / 1000);
                countdownTimer.textContent = remaining.toFixed(1) + 's';

                if (elapsed >= prepTime) {
                    doSpeakingPhase(seg, index);
                } else {
                    shadAnimFrame = requestAnimationFrame(animatePrep);
                }
            };
            shadAnimFrame = requestAnimationFrame(animatePrep);
        } else {
            doSpeakingPhase(seg, index);
        }
    }

    function doSpeakingPhase(seg, index) {
        playBeep();

        const isRecording = micRecordToggle.checked;
        if (isRecording) {
            startRecording(index);
            shadStatus.className = "shadowing-status state-recording";
            shadStatusText.textContent = "À vous ! (Enregistrement micro)";
            if (statusIcon) statusIcon.textContent = "🎙️";
        } else {
            shadStatus.className = "shadowing-status state-speaking";
            shadStatusText.textContent = "À vous ! Répétez la phrase";
            if (statusIcon) statusIcon.textContent = "🗣️";
        }

        countdownTimer.classList.remove('hidden');

        const mult = parseFloat(shadPauseMultInput.value);
        const duration = Math.max(1.0, (seg.end - seg.start) * mult);
        const pauseStartTime = performance.now();
        const pauseDurationMs = duration * 1000;

        const updateProgress = () => {
            if (!shadIsPlaying) {
                stopRecording();
                return;
            }
            const elapsed = performance.now() - pauseStartTime;
            const percent = Math.min(100, (elapsed / pauseDurationMs) * 100);
            const remaining = Math.max(0, (pauseDurationMs - elapsed) / 1000);

            shadProgress.style.width = percent + '%';
            countdownTimer.textContent = remaining.toFixed(1) + 's';

            if (elapsed < pauseDurationMs) {
                shadAnimFrame = requestAnimationFrame(updateProgress);
            } else {
                stopRecording();
                shadProgress.style.width = '0%';
                countdownTimer.classList.add('hidden');

                segmentLoopCounter++;

                // Loop handling:
                // loopMode = 0: no loop
                // loopMode = 2: repeat 2 times then proceed
                // loopMode = 3: repeat 3 times then proceed
                // loopMode = -1: infinite loop
                let shouldRepeat = false;
                if (loopMode === -1) {
                    shouldRepeat = true;
                } else if (loopMode > 1 && segmentLoopCounter < loopMode) {
                    shouldRepeat = true;
                }

                if (shouldRepeat) {
                    playSegment(index);
                } else {
                    segmentLoopCounter = 0;
                    shadCurrentSegmentIndex = getNextSegmentIndex(index);
                    playSegment(shadCurrentSegmentIndex);
                }
            }
        };
        shadAnimFrame = requestAnimationFrame(updateProgress);
    }

    // ========================================================
    // SPEED, PAUSE, PREP & LOOP CONTROLS
    // ========================================================
    function setPlaybackSpeed(newSpeed) {
        newSpeed = Math.max(0.5, Math.min(2.0, parseFloat(newSpeed.toFixed(2))));
        shadSpeedInput.value = newSpeed;
        shadSpeedVal.textContent = newSpeed.toFixed(2) + 'x';
        shadAudio.playbackRate = newSpeed;
        userSettings.speed = newSpeed;
        saveSettings(userSettings);

        speedPills.forEach(p => {
            p.classList.toggle('active', parseFloat(p.dataset.speed) === newSpeed);
        });
    }

    shadSpeedInput.addEventListener('input', (e) => {
        setPlaybackSpeed(parseFloat(e.target.value));
    });

    speedPills.forEach(pill => {
        pill.addEventListener('click', () => {
            setPlaybackSpeed(parseFloat(pill.dataset.speed));
        });
    });

    shadPauseMultInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        shadPauseVal.textContent = val.toFixed(1) + 'x';
        userSettings.pauseMult = val;
        saveSettings(userSettings);
    });

    shadPrepTimeInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        shadPrepVal.textContent = val.toFixed(1) + 's';
        userSettings.prepTime = val;
        saveSettings(userSettings);
    });

    autoPauseToggle.addEventListener('change', () => {
        userSettings.autoPause = autoPauseToggle.checked;
        saveSettings(userSettings);
    });

    hideTextToggle.addEventListener('change', () => {
        shadTextDisplay.classList.toggle('text-hidden', hideTextToggle.checked);
        userSettings.hideText = hideTextToggle.checked;
        saveSettings(userSettings);
    });

    beepToggle.addEventListener('change', () => {
        userSettings.beep = beepToggle.checked;
        saveSettings(userSettings);
    });

    micRecordToggle.addEventListener('change', () => {
        userSettings.micRecord = micRecordToggle.checked;
        saveSettings(userSettings);
        if (micRecordToggle.checked) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
                audioStream = s;
                showToast("Microphone activé pour l'enregistrement vocal.", "🎙️");
            }).catch(e => {
                micRecordToggle.checked = false;
                userSettings.micRecord = false;
                saveSettings(userSettings);
                showToast("Accès au micro impossible.", "⚠️");
            });
        }
    });

    // Loop pills (0, 2, 3, -1)
    loopPills.forEach(pill => {
        pill.addEventListener('click', () => {
            loopPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            loopMode = parseInt(pill.dataset.loop, 10);
            segmentLoopCounter = 0;
            userSettings.loopMode = loopMode;
            saveSettings(userSettings);
            const label = pill.textContent;
            showToast(`Mode boucle : ${label}`, "🔁");
        });
    });

    function cycleLoopMode() {
        const order = [0, 2, 3, -1];
        let idx = order.indexOf(loopMode);
        let next = order[(idx + 1) % order.length];
        const targetPill = document.querySelector(`.loop-pill[data-loop="${next}"]`);
        if (targetPill) targetPill.click();
    }

    // Granularity switcher
    shadSegBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shadSegBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            userSettings.granularity = btn.dataset.granularity;
            saveSettings(userSettings);

            if (shadWords.length > 0) {
                const wasPlaying = shadIsPlaying;
                const currentTime = shadAudio.currentTime;
                if (wasPlaying) stopShadowing();

                buildSegments();
                renderText();
                segmentTotalDisplay.textContent = shadSegments.length;

                let bestIndex = 0;
                for (let i = 0; i < shadSegments.length; i++) {
                    if (shadSegments[i].start <= currentTime && currentTime <= shadSegments[i].end) {
                        bestIndex = i;
                        break;
                    }
                    if (currentTime > shadSegments[i].end) bestIndex = i;
                }
                shadCurrentSegmentIndex = bestIndex;
                segmentCurrentDisplay.textContent = bestIndex + 1;
                highlightSegment(bestIndex);

                if (wasPlaying) startShadowing();
                showToast(`Découpage : ${btn.textContent}`, "✂️");
            }
        });
    });

    // ========================================================
    // KEYBOARD SHORTCUTS ENGINE
    // ========================================================
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

        // ? to toggle shortcuts modal
        if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
            e.preventDefault();
            if (shortcutsModal.classList.contains('hidden')) {
                openModal(shortcutsModal);
            } else {
                closeModal(shortcutsModal);
            }
            return;
        }

        // Escape closes any modal or stops playback
        if (e.code === 'Escape') {
            if (!settingsModal.classList.contains('hidden')) closeModal(settingsModal);
            else if (!shortcutsModal.classList.contains('hidden')) closeModal(shortcutsModal);
            else if (shadIsPlaying) stopShadowing();
            return;
        }

        const shadPanel = document.getElementById('panel-shadowing');
        if (!shadPanel.classList.contains('active')) return;
        if (shadControlsBar.classList.contains('hidden')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (shadIsPlaying) stopShadowing();
                else {
                    if (shadCurrentSegmentIndex === -1) shadCurrentSegmentIndex = 0;
                    startShadowing();
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (shadCurrentSegmentIndex > 0) jumpToSegment(shadCurrentSegmentIndex - 1);
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (shadCurrentSegmentIndex < shadSegments.length - 1) jumpToSegment(shadCurrentSegmentIndex + 1);
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (currentLessonIndex > 0) loadLibraryLesson(currentLessonIndex - 1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (currentLessonIndex < libraryLessons.length - 1) loadLibraryLesson(currentLessonIndex + 1);
                break;

            case 'KeyR':
                e.preventDefault();
                jumpToSegment(shadCurrentSegmentIndex);
                break;

            case 'KeyS':
                e.preventDefault();
                if (starCurrentBtn) starCurrentBtn.click();
                break;

            case 'KeyH':
                e.preventDefault();
                hideTextToggle.checked = !hideTextToggle.checked;
                hideTextToggle.dispatchEvent(new Event('change'));
                showToast(hideTextToggle.checked ? "Texte masqué" : "Texte affiché", "👁️");
                break;

            case 'KeyL':
                e.preventDefault();
                cycleLoopMode();
                break;

            case 'KeyM':
                e.preventDefault();
                micRecordToggle.checked = !micRecordToggle.checked;
                micRecordToggle.dispatchEvent(new Event('change'));
                break;

            case 'Equal':
            case 'NumpadAdd':
                e.preventDefault();
                setPlaybackSpeed(parseFloat(shadSpeedInput.value) + 0.1);
                break;

            case 'Minus':
            case 'NumpadSubtract':
                e.preventDefault();
                setPlaybackSpeed(parseFloat(shadSpeedInput.value) - 0.1);
                break;
        }
    });

    // Apply settings on startup
    applySavedSettings();
    initLibrary();
});
