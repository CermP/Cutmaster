// ========================================================
// CutMaster — Web Application Logic (v3)
// ========================================================
// Redesigned for clarity: library → player flow,
// desktop/mobile dual interface, settings drawer.
// ========================================================

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // TOAST NOTIFICATIONS
    // ========================================================
    const APP_ICONS = {
        info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
        clipboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        folder: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
        headphones: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
        mic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
        speaker: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
        pause: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
        trophy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M7 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="M17 9h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3"/></svg>`,
        hourglass: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        starOutline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        starFilled: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    };

    const toastContainer = document.getElementById('toast-container');
    function showToast(message, iconSvg = APP_ICONS.info) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="toast-icon">${iconSvg}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
    }

    // ========================================================
    // LOCAL STORAGE SETTINGS
    // ========================================================
    const SETTINGS_KEY = 'cutmaster_settings_v2';
    const defaultSettings = {
        speed: 1.0,
        pauseMult: 1.2,
        prepTime: 1.0,
        autoPause: true,
        autoNextSentence: true,
        autoNextWord: false,
        loopMode: 0,
        hideText: false,
        highlightWord: true,
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
            if (!saved) return { ...defaultSettings };
            const parsed = JSON.parse(saved);
            if (parsed.pauseMult === 2.0 || parsed.pauseMult === '2.0' || parsed.pauseMult === 2) {
                parsed.pauseMult = 1.2;
            }
            if (parsed.autoNextWord === undefined) {
                parsed.autoNextWord = false;
            }
            return { ...defaultSettings, ...parsed };
        } catch (e) { return { ...defaultSettings }; }
    }
    function saveSettings(settings) {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
        catch (e) {}
    }

    let userSettings = loadSettings();

    // ========================================================
    // STARRED / FAVORITES
    // ========================================================
    function getStarredKey(lessonId) { return `cutmaster_starred_lesson_${lessonId}`; }
    function getStarredSegments(lessonId) {
        try {
            const data = localStorage.getItem(getStarredKey(lessonId));
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }
    function toggleStarredSegment(lessonId, segmentIndex) {
        let list = getStarredSegments(lessonId);
        const idx = list.indexOf(segmentIndex);
        if (idx === -1) {
            list.push(segmentIndex);
            list.sort((a, b) => a - b);
        } else {
            list.splice(idx, 1);
        }
        try { localStorage.setItem(getStarredKey(lessonId), JSON.stringify(list)); } catch (e) {}
        return list;
    }

    // ========================================================
    // MODE SWITCHING (Entraînement / Découpage)
    // ========================================================
    const modeBtns = document.querySelectorAll('.topbar-tab');
    const panels = document.querySelectorAll('.panel');

    function switchMode(targetPanelId) {
        modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.target === targetPanelId));
        panels.forEach(panel => panel.classList.toggle('active', panel.id === targetPanelId));
        
        if (targetPanelId === 'panel-shadowing' && !viewPlayer.classList.contains('hidden')) {
            document.body.classList.add('training-active');
        } else {
            document.body.classList.remove('training-active');
        }
    }
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchMode(btn.dataset.target);
            window.location.hash = btn.dataset.target === 'panel-decoupage' ? '#decoupage' : '#shadowing';
        });
    });
    function applyHashRoute() {
        switchMode(window.location.hash === '#decoupage' ? 'panel-decoupage' : 'panel-shadowing');
    }
    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);

    // ========================================================
    // SETTINGS DRAWER
    // ========================================================
    const settingsDrawer = document.getElementById('settings-drawer');
    const settingsOverlay = document.getElementById('settings-drawer-overlay');
    const settingsCloseBtn = document.getElementById('settings-drawer-close');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const mobileSettingsBtn = document.getElementById('mobile-settings-btn');

    function openDrawer() {
        settingsDrawer.classList.remove('hidden');
        settingsOverlay.classList.remove('hidden');
        requestAnimationFrame(() => settingsDrawer.classList.add('open'));
    }
    function closeDrawer() {
        settingsDrawer.classList.remove('open');
        setTimeout(() => {
            settingsDrawer.classList.add('hidden');
            settingsOverlay.classList.add('hidden');
        }, 250);
    }

    if (btnOpenSettings) btnOpenSettings.addEventListener('click', openDrawer);
    if (mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openDrawer);
    if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeDrawer);
    if (settingsOverlay) settingsOverlay.addEventListener('click', closeDrawer);

    // ========================================================
    // SHORTCUTS MODAL
    // ========================================================
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
    const shortcutsClose = document.getElementById('shortcuts-modal-close');
    const shortcutsFooterClose = document.getElementById('btn-close-shortcuts-footer');

    // Also accept old settings modal IDs for backwards compat
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalClose = document.getElementById('settings-modal-close');

    function openModal(modal) { if (modal) modal.classList.remove('hidden'); }
    function closeModal(modal) { if (modal) modal.classList.add('hidden'); }

    if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', () => openModal(shortcutsModal));
    if (shortcutsClose) shortcutsClose.addEventListener('click', () => closeModal(shortcutsModal));
    if (shortcutsFooterClose) shortcutsFooterClose.addEventListener('click', () => closeModal(shortcutsModal));
    if (settingsModalClose) settingsModalClose.addEventListener('click', () => closeModal(settingsModal));

    [shortcutsModal, settingsModal].forEach(modal => {
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
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

    const presetsConfig = {
        standard: { silence: 700, thresh: -16, mult: 1.2 },
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
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
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
            fileNameDisplay.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} Mo)`;
            decoupageOriginalBuffer = null;
            resultArea.classList.add('hidden');
            statusDisplay.textContent = "Prêt pour le traitement.";
            const parts = file.name.split('.'); parts.pop();
            decoupageOutputFilename = parts.join('.') + "_cutmaster";
        }
    }

    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            if (!fileInput.files.length) {
                statusDisplay.textContent = "⚠️ Sélectionnez un fichier audio.";
                return;
            }
            const file = fileInput.files[0];
            const minSilenceMs = parseFloat(minSilenceInput.value);
            const threshDb = parseFloat(threshDbInput.value);
            const pauseMult = parseFloat(pauseMultInput.value);
            const format = exportFormatSelect.value;

            try {
                statusDisplay.textContent = "Chargement de l'audio…";
                processBtn.disabled = true;
                if (!decoupageAudioCtx) decoupageAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (decoupageAudioCtx.state === 'suspended') await decoupageAudioCtx.resume();
                if (!decoupageOriginalBuffer) {
                    const arrayBuffer = await file.arrayBuffer();
                    decoupageOriginalBuffer = await decoupageAudioCtx.decodeAudioData(arrayBuffer);
                }
                statusDisplay.textContent = "Analyse des silences…";
                await new Promise(r => setTimeout(r, 60));
                const resultBuffer = await processAudioAlgorithm(decoupageOriginalBuffer, minSilenceMs, threshDb, pauseMult);
                if (!resultBuffer) {
                    statusDisplay.textContent = "Aucun segment détecté. Ajustez les seuils.";
                    processBtn.disabled = false;
                    return;
                }
                statusDisplay.textContent = `Encodage en .${format.toUpperCase()}…`;
                await new Promise(r => setTimeout(r, 60));
                if (format === 'wav') {
                    decoupageResultBlob = audioBufferToWav(resultBuffer);
                    decoupageOutputFilename = decoupageOutputFilename.replace(/\.(wav|mp3)$/i, '') + ".wav";
                } else {
                    decoupageResultBlob = audioBufferToMp3(resultBuffer);
                    decoupageOutputFilename = decoupageOutputFilename.replace(/\.(wav|mp3)$/i, '') + ".mp3";
                }
                statusDisplay.textContent = "✅ Traitement terminé.";
                resultArea.classList.remove('hidden');
                if (decoupageWs) decoupageWs.destroy();
                decoupageWs = WaveSurfer.create({
                    container: '#waveform',
                    waveColor: '#6b6965',
                    progressColor: '#5eadb6',
                    cursorColor: '#5eadb6',
                    barWidth: 2, barRadius: 2, barGap: 1,
                    height: 70, normalize: true,
                });
                decoupageWs.loadBlob(decoupageResultBlob);
                showToast("Fichier prêt !", APP_ICONS.success);
            } catch (err) {
                console.error(err);
                statusDisplay.textContent = "❌ Erreur: " + err.message;
            } finally {
                processBtn.disabled = false;
            }
        });
    }

    if (playBtn) playBtn.addEventListener('click', () => { if (decoupageWs) decoupageWs.playPause(); });
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (decoupageResultBlob) {
                const url = URL.createObjectURL(decoupageResultBlob);
                const a = document.createElement('a');
                a.style.display = 'none'; a.href = url; a.download = decoupageOutputFilename;
                document.body.appendChild(a); a.click();
                URL.revokeObjectURL(url); a.remove();
                showToast("Téléchargement lancé", APP_ICONS.save);
            }
        });
    }

    // Audio processing algorithm (unchanged)
    async function processAudioAlgorithm(buffer, minSilenceMs, threshDb, pauseMult) {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const step = 10;
        let totalSum = 0;
        for (let i = 0; i < data.length; i += step) totalSum += data[i] * data[i];
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
        let inSilence = false, silenceStart = 0;
        for (let i = 0; i < data.length - windowSize; i += windowSize) {
            const rms = getRMS(data, i, i + windowSize);
            const currentDb = rms > 0 ? 20 * Math.log10(rms) : -100;
            if (currentDb < thresholdDb) {
                if (!inSilence) { inSilence = true; silenceStart = i; }
            } else {
                if (inSilence) {
                    inSilence = false;
                    if (i - silenceStart >= minSilenceSamples) silences.push({ start: silenceStart, end: i });
                }
            }
        }
        if (inSilence && (data.length - silenceStart >= minSilenceSamples)) silences.push({ start: silenceStart, end: data.length });

        const segments = [];
        let lastEnd = 0;
        for (const s of silences) {
            if (s.start > lastEnd) segments.push({ start: lastEnd, end: s.start });
            lastEnd = s.end;
        }
        if (lastEnd < data.length) segments.push({ start: lastEnd, end: data.length });
        if (segments.length === 0) return null;

        let totalNewSamples = 0;
        for (const seg of segments) {
            totalNewSamples += (seg.end - seg.start) + Math.floor((seg.end - seg.start) * pauseMult);
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
                writePtr += segLength + Math.floor(segLength * pauseMult);
            }
        }
        return newBuffer;
    }

    function audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const numSamples = buffer.length;
        const dataByteCount = numSamples * blockAlign;
        const totalByteCount = 44 + dataByteCount;
        const out = new Uint8Array(totalByteCount);
        const view = new DataView(out.buffer);
        function writeString(offset, str) { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
        writeString(0, 'RIFF'); view.setUint32(4, totalByteCount - 8, true); writeString(8, 'WAVE');
        writeString(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true); writeString(36, 'data'); view.setUint32(40, dataByteCount, true);
        let offset = 44;
        const channels = [];
        for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));
        for (let i = 0; i < numSamples; i++) {
            for (let c = 0; c < numChannels; c++) {
                let sample = Math.max(-1, Math.min(1, channels[c][i]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(offset, sample, true); offset += 2;
            }
        }
        return new Blob([out.buffer], { type: 'audio/wav' });
    }

    function audioBufferToMp3(buffer) {
        if (typeof lamejs === 'undefined') return audioBufferToWav(buffer);
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
                const mp3buf = mp3encoder.encodeBuffer(samples.subarray(i, i + sampleBlockSize));
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
        } else {
            const left = floatToInt16(buffer.getChannelData(0));
            const right = floatToInt16(buffer.getChannelData(1));
            for (let i = 0; i < left.length; i += sampleBlockSize) {
                const mp3buf = mp3encoder.encodeBuffer(left.subarray(i, i + sampleBlockSize), right.subarray(i, i + sampleBlockSize));
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
        }
        const endBuf = mp3encoder.flush();
        if (endBuf.length > 0) mp3Data.push(endBuf);
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }

    // ========================================================
    // SHADOWING — DOM REFERENCES
    // ========================================================
    const sourceTabs = document.querySelectorAll('.source-tab');
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

    // Views
    const viewLibrary = document.getElementById('view-library');
    const viewPlayer = document.getElementById('view-player');

    // Player header
    const activeLessonNum = document.getElementById('active-lesson-num');
    const activeLessonTitle = document.getElementById('active-lesson-title');
    const prevLessonBtn = document.getElementById('prev-lesson-btn');
    const nextLessonBtn = document.getElementById('next-lesson-btn');
    const changeLessonBtn = document.getElementById('change-lesson-btn');
    const filterStarredBtn = document.getElementById('filter-starred-btn');
    const filterStarredCount = document.getElementById('filter-starred-count');

    // Timeline
    const timelineContainer = document.getElementById('timeline-container');
    const timelineTrack = document.getElementById('timeline-track');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineThumb = document.getElementById('timeline-thumb');
    const timeCurrentDisplay = document.getElementById('time-current');
    const timeTotalDisplay = document.getElementById('time-total');
    const segmentCurrentDisplay = document.getElementById('segment-current');
    const segmentTotalDisplay = document.getElementById('segment-total');

    // Desktop transport
    const shadPlayBtn = document.getElementById('shadowing-play');
    const playBtnLabel = document.getElementById('play-btn-label');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const prevSegBtn = document.getElementById('prev-seg-btn');
    const nextSegBtn = document.getElementById('next-seg-btn');
    const replaySegBtn = document.getElementById('replay-seg-btn');
    const starCurrentBtn = document.getElementById('star-current-btn');

    // Mobile controls
    const mobilePlayBtn = document.getElementById('mobile-play-btn');
    const mobilePlayIcon = document.getElementById('mobile-play-icon');
    const mobilePauseIcon = document.getElementById('mobile-pause-icon');
    const mobilePrevSeg = document.getElementById('mobile-prev-seg');
    const mobileNextSeg = document.getElementById('mobile-next-seg');
    const mobileReplaySeg = document.getElementById('mobile-replay-seg');
    const mobileStarBtn = document.getElementById('mobile-star-btn');
    const mobileMicBtn = document.getElementById('mobile-mic-btn');

    // Desktop controls
    const shadSpeedInput = document.getElementById('shadowing-speed');
    const shadSpeedVal = document.getElementById('shadowing-speed-val');
    const speedPills = document.querySelectorAll('#desktop-controls .speed-pill');
    const shadPauseMultInput = document.getElementById('shadowing-pause-mult');
    const shadPauseVal = document.getElementById('shadowing-pause-val');
    const shadPrepTimeInput = document.getElementById('shadowing-prep-time');
    const shadPrepVal = document.getElementById('shadowing-prep-val');
    const shadSegBtns = document.querySelectorAll('#desktop-controls .seg-btn');

    // Toggles (desktop)
    const autoPauseToggle = document.getElementById('auto-pause-toggle');
    const autoNextToggle = document.getElementById('auto-next-toggle');
    const hideTextToggle = document.getElementById('hide-text-toggle');
    const highlightWordToggle = document.getElementById('highlight-word-toggle');
    const beepToggle = document.getElementById('beep-toggle');
    const micRecordToggle = document.getElementById('mic-record-toggle');
    const loopPills = document.querySelectorAll('#desktop-controls .loop-pill');

    // Drawer controls (mirror)
    const drawerSpeed = document.getElementById('drawer-speed');
    const drawerSpeedVal = document.getElementById('drawer-speed-val');
    const drawerSpeedPills = document.querySelectorAll('#drawer-speed-pills .speed-pill');
    const drawerPauseMult = document.getElementById('drawer-pause-mult');
    const drawerPauseVal = document.getElementById('drawer-pause-val');
    const drawerPrepTime = document.getElementById('drawer-prep-time');
    const drawerPrepVal = document.getElementById('drawer-prep-val');
    const drawerGranularity = document.querySelectorAll('#drawer-granularity .seg-btn');
    const drawerLoopPills = document.querySelectorAll('#drawer-loop-pills .loop-pill');
    const drawerAutoPause = document.getElementById('drawer-auto-pause');
    const drawerAutoNext = document.getElementById('drawer-auto-next');
    const drawerHideText = document.getElementById('drawer-hide-text');
    const drawerHighlightWord = document.getElementById('drawer-highlight-word');
    const drawerBeep = document.getElementById('drawer-beep');
    const drawerMic = document.getElementById('drawer-mic');

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

    // Text Display
    const textAreaCard = document.getElementById('text-area-card');
    const shadTextDisplay = document.getElementById('shadowing-text');
    const btnFontDecrease = document.getElementById('btn-font-decrease');
    const btnFontIncrease = document.getElementById('btn-font-increase');
    const btnToggleFocus = document.getElementById('btn-toggle-focus');
    const btnCopyText = document.getElementById('btn-copy-text');

    // Audio elements
    const shadAudio = document.getElementById('shadowing-audio-player');
    const userAudio = document.getElementById('user-audio-player');

    // Upload
    const shadAudioInput = document.getElementById('shadowing-audio');
    const shadJsonInput = document.getElementById('shadowing-json');
    const shadLoadBtn = document.getElementById('shadowing-load');

    // The old invisible container ref for backward compat with keyboard shortcuts check
    const shadControlsBar = document.getElementById('shadowing-controls-bar');

    // ========================================================
    // SHADOWING STATE
    // ========================================================
    let libraryLessons = [];
    let currentLessonIndex = -1;
    let currentLessonId = null;
    let shadWords = [];
    let shadSegments = [];
    let shadCurrentSegmentIndex = -1;
    let shadIsPlaying = false;
    let shadAnimFrame = null;
    let timeUpdateInterval = null;
    let loopMode = userSettings.loopMode;
    let segmentLoopCounter = 0;
    let filterOnlyStarred = false;
    let lastRecordedSegmentIndex = -1;
    let lastActiveWordIdx = -1;

    // Mic
    let mediaRecorder = null;
    let audioStream = null;
    let recordedChunks = [];
    let lastUserAudioBlobUrl = null;
    let lastOriginalSegmentSlice = null;
    let isRecordingIntended = false;

    // Beep
    let beepCtx = null;
    function initBeepContext() {
        if (!(beepToggle && beepToggle.checked) && !(drawerBeep && drawerBeep.checked)) return;
        try {
            if (!beepCtx) beepCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (beepCtx.state === 'suspended') beepCtx.resume();
        } catch (e) {}
    }
    function playBeep() {
        const beepOn = (beepToggle && beepToggle.checked) || (drawerBeep && drawerBeep.checked);
        if (!beepOn) return;
        try {
            if (!beepCtx) initBeepContext();
            if (beepCtx.state === 'suspended') beepCtx.resume();
            const osc = beepCtx.createOscillator();
            const gain = beepCtx.createGain();
            osc.connect(gain); gain.connect(beepCtx.destination);
            osc.frequency.value = 880; osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, beepCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, beepCtx.currentTime + 0.14);
            osc.start(beepCtx.currentTime); osc.stop(beepCtx.currentTime + 0.14);
        } catch (e) {}
    }

    // ========================================================
    // MIC RECORDING
    // ========================================================
    function isMicEnabled() {
        return (micRecordToggle && micRecordToggle.checked) || (drawerMic && drawerMic.checked);
    }

    async function startRecording(segmentIndex) {
        if (!isMicEnabled()) return;
        isRecordingIntended = true;
        try {
            if (!audioStream) audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isRecordingIntended || !shadIsPlaying) return;
            recordedChunks = [];
            const mimeType = (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
                ? 'audio/webm;codecs=opus'
                : ((typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm')) ? 'audio/webm'
                : ((typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/mp4')) ? 'audio/mp4' : ''));
            mediaRecorder = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mimeType || 'audio/webm' });
                if (lastUserAudioBlobUrl) URL.revokeObjectURL(lastUserAudioBlobUrl);
                lastUserAudioBlobUrl = URL.createObjectURL(blob);
                if (userAudio) userAudio.src = lastUserAudioBlobUrl;
                if (comparisonCard && compSegmentLabel) {
                    lastRecordedSegmentIndex = segmentIndex;
                    compSegmentLabel.textContent = `Segment ${segmentIndex + 1}`;
                    comparisonCard.classList.remove('hidden');
                }
            };
            mediaRecorder.start();
        } catch (err) {
            console.warn("Micro:", err);
            syncMicToggle(false);
            showToast("Accès au micro impossible", APP_ICONS.warning);
        }
    }

    function stopRecording() {
        isRecordingIntended = false;
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            try { mediaRecorder.stop(); } catch (e) {}
        }
    }

    if (compPlayOriginalBtn) {
        compPlayOriginalBtn.addEventListener('click', () => {
            if (lastOriginalSegmentSlice && shadAudio) {
                shadAudio.pause();
                shadAudio.currentTime = lastOriginalSegmentSlice.start;
                shadAudio.play();
                const stopAt = () => {
                    if (shadAudio.currentTime >= lastOriginalSegmentSlice.end) shadAudio.pause();
                    else requestAnimationFrame(stopAt);
                };
                requestAnimationFrame(stopAt);
            }
        });
    }
    if (compPlayUserBtn) {
        compPlayUserBtn.addEventListener('click', () => {
            if (userAudio && lastUserAudioBlobUrl) { userAudio.currentTime = 0; userAudio.play(); }
        });
    }
    if (compRetrySegBtn) {
        compRetrySegBtn.addEventListener('click', () => {
            if (lastRecordedSegmentIndex >= 0) { jumpToSegment(lastRecordedSegmentIndex); startShadowing(); }
        });
    }

    // ========================================================
    // SYNC CONTROLS (desktop ↔ drawer ↔ mobile)
    // ========================================================
    function syncSpeedUI(newSpeed) {
        if (shadSpeedInput) shadSpeedInput.value = newSpeed;
        if (shadSpeedVal) shadSpeedVal.textContent = parseFloat(newSpeed).toFixed(2) + 'x';
        if (drawerSpeed) drawerSpeed.value = newSpeed;
        if (drawerSpeedVal) drawerSpeedVal.textContent = parseFloat(newSpeed).toFixed(2) + 'x';
        [speedPills, drawerSpeedPills].forEach(pills => {
            pills.forEach(p => p.classList.toggle('active', parseFloat(p.dataset.speed) === parseFloat(newSpeed)));
        });
    }

    function syncPauseUI(val) {
        if (shadPauseMultInput) shadPauseMultInput.value = val;
        if (shadPauseVal) shadPauseVal.textContent = parseFloat(val).toFixed(1) + 'x';
        if (drawerPauseMult) drawerPauseMult.value = val;
        if (drawerPauseVal) drawerPauseVal.textContent = parseFloat(val).toFixed(1) + 'x';
    }

    function syncPrepUI(val) {
        if (shadPrepTimeInput) shadPrepTimeInput.value = val;
        if (shadPrepVal) shadPrepVal.textContent = parseFloat(val).toFixed(1) + 's';
        if (drawerPrepTime) drawerPrepTime.value = val;
        if (drawerPrepVal) drawerPrepVal.textContent = parseFloat(val).toFixed(1) + 's';
    }

    function syncAutoPause(checked) {
        if (autoPauseToggle) autoPauseToggle.checked = checked;
        if (drawerAutoPause) drawerAutoPause.checked = checked;
    }

    function syncAutoNext(checked) {
        const isChecked = Boolean(checked);
        if (autoNextToggle) autoNextToggle.checked = isChecked;
        if (drawerAutoNext) drawerAutoNext.checked = isChecked;
    }

    function isAutoNextActive() {
        if (userSettings.granularity === 'word') {
            const desktopChecked = autoNextToggle ? autoNextToggle.checked : false;
            const drawerChecked = drawerAutoNext ? drawerAutoNext.checked : false;
            return desktopChecked || drawerChecked;
        }
        if (autoNextToggle) return autoNextToggle.checked;
        if (drawerAutoNext) return drawerAutoNext.checked;
        return true;
    }

    function syncHideText(checked) {
        if (hideTextToggle) hideTextToggle.checked = checked;
        if (drawerHideText) drawerHideText.checked = checked;
        if (shadTextDisplay) shadTextDisplay.classList.toggle('text-hidden', checked);
    }

    function syncHighlightWord(checked) {
        if (highlightWordToggle) highlightWordToggle.checked = checked;
        if (drawerHighlightWord) drawerHighlightWord.checked = checked;
    }

    function syncBeep(checked) {
        if (beepToggle) beepToggle.checked = checked;
        if (drawerBeep) drawerBeep.checked = checked;
    }

    function syncMicToggle(checked) {
        if (micRecordToggle) micRecordToggle.checked = checked;
        if (drawerMic) drawerMic.checked = checked;
        if (mobileMicBtn) mobileMicBtn.classList.toggle('is-active', checked);
    }

    function syncLoopUI(mode) {
        loopMode = mode;
        [loopPills, drawerLoopPills].forEach(pills => {
            pills.forEach(p => p.classList.toggle('active', parseInt(p.dataset.loop, 10) === mode));
        });
    }

    function syncGranularityUI(gran) {
        [shadSegBtns, drawerGranularity].forEach(btns => {
            btns.forEach(b => b.classList.toggle('active', b.dataset.granularity === gran));
        });
    }

    // ========================================================
    // APPLY SAVED SETTINGS
    // ========================================================
    function applySavedSettings() {
        syncSpeedUI(userSettings.speed);
        if (shadAudio) shadAudio.playbackRate = userSettings.speed;
        syncPauseUI(userSettings.pauseMult);
        syncPrepUI(userSettings.prepTime);
        syncAutoPause(userSettings.autoPause);
        if (userSettings.granularity === 'word') {
            syncAutoNext(Boolean(userSettings.autoNextWord));
        } else {
            syncAutoNext(userSettings.autoNextSentence !== false);
        }
        syncHideText(userSettings.hideText);
        syncHighlightWord(userSettings.highlightWord !== false);
        syncBeep(userSettings.beep);
        syncMicToggle(userSettings.micRecord);
        syncLoopUI(userSettings.loopMode);
        syncGranularityUI(userSettings.granularity);
        applyTypographySettings();
    }

    function applyTypographySettings() {
        if (!shadTextDisplay) return;
        shadTextDisplay.className = 'text-display';
        shadTextDisplay.classList.add(userSettings.fontFamily || 'font-sans');
        shadTextDisplay.classList.add(userSettings.fontSize || 'size-md');
        shadTextDisplay.classList.add(userSettings.textAlign || 'align-left');
        if (userSettings.focusMode) shadTextDisplay.classList.add('mode-focus');
        if ((hideTextToggle && hideTextToggle.checked) || (drawerHideText && drawerHideText.checked)) {
            shadTextDisplay.classList.add('text-hidden');
        }
        if (btnToggleFocus) btnToggleFocus.classList.toggle('active', userSettings.focusMode);

        // Update option pills in drawer
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

    // ========================================================
    // EVENT BINDINGS — CONTROLS
    // ========================================================

    // Speed (desktop + drawer)
    function setPlaybackSpeed(newSpeed) {
        newSpeed = Math.max(0.5, Math.min(2.0, parseFloat(newSpeed.toFixed(2))));
        syncSpeedUI(newSpeed);
        if (shadAudio) shadAudio.playbackRate = newSpeed;
        userSettings.speed = newSpeed;
        saveSettings(userSettings);
    }

    [shadSpeedInput, drawerSpeed].forEach(el => {
        if (el) el.addEventListener('input', (e) => setPlaybackSpeed(parseFloat(e.target.value)));
    });

    [speedPills, drawerSpeedPills].forEach(pills => {
        pills.forEach(pill => {
            pill.addEventListener('click', () => setPlaybackSpeed(parseFloat(pill.dataset.speed)));
        });
    });

    // Pause mult
    [shadPauseMultInput, drawerPauseMult].forEach(el => {
        if (el) el.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            syncPauseUI(val);
            userSettings.pauseMult = val;
            saveSettings(userSettings);
        });
    });

    // Prep time
    [shadPrepTimeInput, drawerPrepTime].forEach(el => {
        if (el) el.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            syncPrepUI(val);
            userSettings.prepTime = val;
            saveSettings(userSettings);
        });
    });

    // Auto-pause
    [autoPauseToggle, drawerAutoPause].forEach(el => {
        if (el) el.addEventListener('change', () => {
            const checked = el.checked;
            syncAutoPause(checked);
            userSettings.autoPause = checked;
            saveSettings(userSettings);
        });
    });

    // Auto-next
    [autoNextToggle, drawerAutoNext].forEach(el => {
        if (el) el.addEventListener('change', () => {
            const checked = Boolean(el.checked);
            syncAutoNext(checked);
            if (userSettings.granularity === 'word') {
                userSettings.autoNextWord = checked;
            } else {
                userSettings.autoNextSentence = checked;
            }
            saveSettings(userSettings);
        });
    });

    // Hide text
    [hideTextToggle, drawerHideText].forEach(el => {
        if (el) el.addEventListener('change', () => {
            const checked = el.checked;
            syncHideText(checked);
            userSettings.hideText = checked;
            saveSettings(userSettings);
        });
    });

    // Highlight word
    [highlightWordToggle, drawerHighlightWord].forEach(el => {
        if (el) el.addEventListener('change', () => {
            const checked = el.checked;
            syncHighlightWord(checked);
            userSettings.highlightWord = checked;
            saveSettings(userSettings);
            if (!checked) clearActiveWordHighlight();
        });
    });

    // Beep
    [beepToggle, drawerBeep].forEach(el => {
        if (el) el.addEventListener('change', () => {
            const checked = el.checked;
            syncBeep(checked);
            userSettings.beep = checked;
            saveSettings(userSettings);
        });
    });

    // Mic
    function handleMicToggle(checked) {
        syncMicToggle(checked);
        userSettings.micRecord = checked;
        saveSettings(userSettings);
        if (checked) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
                audioStream = s;
            }).catch(e => {
                syncMicToggle(false);
                userSettings.micRecord = false;
                saveSettings(userSettings);
                showToast("Accès au micro impossible", APP_ICONS.warning);
            });
        }
    }

    [micRecordToggle, drawerMic].forEach(el => {
        if (el) el.addEventListener('change', () => handleMicToggle(el.checked));
    });
    if (mobileMicBtn) {
        mobileMicBtn.addEventListener('click', () => {
            const newState = !isMicEnabled();
            handleMicToggle(newState);
        });
    }

    // Loop
    [loopPills, drawerLoopPills].forEach(pills => {
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                const mode = parseInt(pill.dataset.loop, 10);
                syncLoopUI(mode);
                segmentLoopCounter = 0;
                userSettings.loopMode = mode;
                saveSettings(userSettings);
            });
        });
    });

    function cycleLoopMode() {
        const order = [0, 2, 3, -1];
        let idx = order.indexOf(loopMode);
        let next = order[(idx + 1) % order.length];
        syncLoopUI(next);
        segmentLoopCounter = 0;
        userSettings.loopMode = next;
        saveSettings(userSettings);
    }

    // Granularity
    function handleGranularityChange(gran) {
        syncGranularityUI(gran);
        userSettings.granularity = gran;
        if (gran === 'word') {
            userSettings.autoNextWord = false;
            syncAutoNext(false);
        } else {
            const shouldNext = userSettings.autoNextSentence !== false;
            userSettings.autoNextSentence = shouldNext;
            syncAutoNext(shouldNext);
        }
        saveSettings(userSettings);
        if (shadWords.length > 0) {
            const wasPlaying = shadIsPlaying;
            const currentTime = shadAudio.currentTime;
            if (wasPlaying) stopShadowing();
            buildSegments(); renderText();
            segmentTotalDisplay.textContent = shadSegments.length;
            let bestIndex = 0;
            for (let i = 0; i < shadSegments.length; i++) {
                if (shadSegments[i].start <= currentTime && currentTime <= shadSegments[i].end) { bestIndex = i; break; }
                if (currentTime > shadSegments[i].end) bestIndex = i;
            }
            shadCurrentSegmentIndex = bestIndex;
            segmentCurrentDisplay.textContent = bestIndex + 1;
            highlightSegment(bestIndex);
            if (wasPlaying) startShadowing();
        }
    }

    [shadSegBtns, drawerGranularity].forEach(btns => {
        btns.forEach(btn => {
            btn.addEventListener('click', () => handleGranularityChange(btn.dataset.granularity));
        });
    });

    // Typography pills in drawer
    document.querySelectorAll('#font-family-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#font-family-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.fontFamily = pill.dataset.font;
            applyTypographySettings(); saveSettings(userSettings);
        });
    });
    document.querySelectorAll('#font-size-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#font-size-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.fontSize = pill.dataset.size;
            applyTypographySettings(); saveSettings(userSettings);
        });
    });
    document.querySelectorAll('#text-align-options .option-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#text-align-options .option-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            userSettings.textAlign = pill.dataset.align;
            applyTypographySettings(); saveSettings(userSettings);
        });
    });

    const focusPrefCheck = document.getElementById('focus-mode-pref');
    if (focusPrefCheck) {
        focusPrefCheck.addEventListener('change', () => {
            userSettings.focusMode = focusPrefCheck.checked;
            applyTypographySettings(); saveSettings(userSettings);
        });
    }

    // Text toolbar buttons
    const fontSizesList = ['size-sm', 'size-md', 'size-lg', 'size-xl'];
    if (btnFontDecrease) {
        btnFontDecrease.addEventListener('click', () => {
            let idx = fontSizesList.indexOf(userSettings.fontSize);
            if (idx > 0) { userSettings.fontSize = fontSizesList[idx - 1]; applyTypographySettings(); saveSettings(userSettings); }
        });
    }
    if (btnFontIncrease) {
        btnFontIncrease.addEventListener('click', () => {
            let idx = fontSizesList.indexOf(userSettings.fontSize);
            if (idx < fontSizesList.length - 1) { userSettings.fontSize = fontSizesList[idx + 1]; applyTypographySettings(); saveSettings(userSettings); }
        });
    }
    if (btnToggleFocus) {
        btnToggleFocus.addEventListener('click', () => {
            userSettings.focusMode = !userSettings.focusMode;
            applyTypographySettings(); saveSettings(userSettings);
        });
    }
    if (btnCopyText) {
        btnCopyText.addEventListener('click', () => {
            if (shadWords.length > 0) {
                const fullText = shadSegments.map(s => s.text).join(' ');
                navigator.clipboard.writeText(fullText).then(() => showToast("Texte copié", APP_ICONS.clipboard))
                    .catch(() => showToast("Échec de la copie", APP_ICONS.warning));
            }
        });
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ========================================================
    // LIBRARY
    // ========================================================
    sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.source === 'library') {
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
            if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
            const initialIdx = userSettings.lastLessonIndex && userSettings.lastLessonIndex < libraryLessons.length ? userSettings.lastLessonIndex : 0;
            if (libraryLessons.length > 0) {
                librarySelect.value = initialIdx;
                updatePreviewCard(libraryLessons[initialIdx]);
            }
        } catch (e) {
            console.warn("Bibliothèque indisponible:", e);
            if (librarySelect) librarySelect.innerHTML = '<option value="">⚠️ Ouvrir en serveur local</option>';
        }
    }

    function populateLibrarySelect(lessons) {
        if (!librarySelect) return;
        librarySelect.innerHTML = '';
        lessons.forEach(l => {
            const opt = document.createElement('option');
            opt.value = libraryLessons.indexOf(l);
            opt.textContent = `${l.id}. ${l.title} (${l.duration})`;
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
            if (!isNaN(idx) && libraryLessons[idx]) updatePreviewCard(libraryLessons[idx]);
        });
    }

    if (librarySearch) {
        librarySearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', !q);
            if (!q) {
                if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
                if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
                if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
                populateLibrarySelect(libraryLessons);
                if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
                if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
                return;
            }
            const filtered = libraryLessons.filter(l => l.title.toLowerCase().includes(q) || String(l.id).includes(q));
            if (searchCountBadge) searchCountBadge.textContent = `${filtered.length} texte${filtered.length > 1 ? 's' : ''}`;
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

    function resetSearch() {
        if (librarySearch) librarySearch.value = '';
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        if (libraryEmptyState) libraryEmptyState.classList.add('hidden');
        if (librarySelectGroup) librarySelectGroup.classList.remove('hidden');
        if (lessonPreviewCard) lessonPreviewCard.classList.remove('hidden');
        populateLibrarySelect(libraryLessons);
        if (searchCountBadge) searchCountBadge.textContent = `${libraryLessons.length} textes`;
        if (libraryLessons.length > 0) updatePreviewCard(libraryLessons[0]);
    }

    if (btnResetSearch) btnResetSearch.addEventListener('click', resetSearch);
    if (clearSearchBtn) clearSearchBtn.addEventListener('click', resetSearch);

    if (btnRandomLesson) {
        btnRandomLesson.addEventListener('click', () => {
            if (!libraryLessons.length) return;
            const randIdx = Math.floor(Math.random() * libraryLessons.length);
            resetSearch();
            if (librarySelect) librarySelect.value = randIdx;
            updatePreviewCard(libraryLessons[randIdx]);
        });
    }

    // ========================================================
    // LOAD LESSON
    // ========================================================
    function showPlayer() {
        viewLibrary.classList.add('hidden');
        viewPlayer.classList.remove('hidden');
        // Mark hidden controls bar visible for keyboard shortcut checks
        shadControlsBar.classList.remove('hidden');
        document.body.classList.add('training-active');
    }

    function showLibrary() {
        stopShadowing();
        viewPlayer.classList.add('hidden');
        viewLibrary.classList.remove('hidden');
        shadControlsBar.classList.add('hidden');
        if (shadTextDisplay) shadTextDisplay.innerHTML = '';
        document.body.classList.remove('training-active');
    }

    async function loadLibraryLesson(index) {
        if (index < 0 || index >= libraryLessons.length) return;
        stopShadowing();
        shadAudio.pause();
        shadAudio.currentTime = 0;
        const lesson = libraryLessons[index];
        currentLessonIndex = index;
        currentLessonId = lesson.id;
        userSettings.lastLessonIndex = index;
        saveSettings(userSettings);

        if (libraryStartBtn) { libraryStartBtn.disabled = true; libraryStartBtn.textContent = "Chargement…"; }

        try {
            const res = await fetch(lesson.jsonUrl);
            if (!res.ok) throw new Error("Échec du chargement JSON.");
            shadWords = await res.json();
            shadAudio.src = lesson.audioUrl;
            shadAudio.load(); // Reinitialize the audio element properly
            buildSegments(); renderText();

            if (activeLessonNum) activeLessonNum.textContent = `Texte ${lesson.id}`;
            if (activeLessonTitle) activeLessonTitle.textContent = lesson.title;
            if (prevLessonBtn) prevLessonBtn.disabled = (index === 0);
            if (nextLessonBtn) nextLessonBtn.disabled = (index === libraryLessons.length - 1);

            updateStarredCounter();
            showPlayer();

            setStatusReady();
            segmentTotalDisplay.textContent = shadSegments.length;
            shadAudio.addEventListener('loadedmetadata', updateTimelineUI, { once: true });
            shadCurrentSegmentIndex = 0;
            segmentCurrentDisplay.textContent = '1';
            highlightSegment(0);
        } catch (err) {
            alert("Erreur: " + err.message);
        } finally {
            if (libraryStartBtn) { libraryStartBtn.disabled = false; libraryStartBtn.textContent = "Commencer l'entraînement"; }
        }
    }

    if (libraryStartBtn) {
        libraryStartBtn.addEventListener('click', () => {
            const selectedIdx = parseInt(librarySelect.value, 10);
            if (!isNaN(selectedIdx)) loadLibraryLesson(selectedIdx);
        });
    }

    // Custom upload
    if (shadLoadBtn) {
        shadLoadBtn.addEventListener('click', async () => {
            if (!shadAudioInput.files.length || !shadJsonInput.files.length) {
                alert("Sélectionnez le fichier audio ET le JSON.");
                return;
            }
            stopShadowing();
            shadAudio.pause();
            shadAudio.currentTime = 0;
            shadAudio.src = URL.createObjectURL(shadAudioInput.files[0]);
            shadAudio.load();
            try {
                shadWords = JSON.parse(await shadJsonInput.files[0].text());
                currentLessonIndex = -1;
                currentLessonId = 'custom_' + shadAudioInput.files[0].name;
                buildSegments(); renderText();
                if (activeLessonNum) activeLessonNum.textContent = "Import";
                if (activeLessonTitle) activeLessonTitle.textContent = shadAudioInput.files[0].name;
                if (prevLessonBtn) prevLessonBtn.disabled = true;
                if (nextLessonBtn) nextLessonBtn.disabled = true;
                showPlayer();
                setStatusReady();
                segmentTotalDisplay.textContent = shadSegments.length;
                shadAudio.addEventListener('loadedmetadata', updateTimelineUI, { once: true });
                shadCurrentSegmentIndex = 0;
                segmentCurrentDisplay.textContent = '1';
                highlightSegment(0);
                updateStarredCounter();
                showToast("Fichier importé", APP_ICONS.folder);
            } catch (e) { alert("Erreur JSON."); }
        });
    }

    // Nav
    if (prevLessonBtn) prevLessonBtn.addEventListener('click', () => { if (currentLessonIndex > 0) loadLibraryLesson(currentLessonIndex - 1); });
    if (nextLessonBtn) nextLessonBtn.addEventListener('click', () => { if (currentLessonIndex < libraryLessons.length - 1) loadLibraryLesson(currentLessonIndex + 1); });
    if (changeLessonBtn) changeLessonBtn.addEventListener('click', showLibrary);

    // ========================================================
    // SEGMENTATION & RENDERING
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
            else if (gran === 'comma') { if (/[.,;!?]/.test(w.text)) cut = true; }
            else { if (/[.!?]/.test(w.text)) cut = true; }
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
            seg.words.forEach((w, wIdx) => {
                const wSpan = document.createElement('span');
                wSpan.className = 'word-span';
                wSpan.textContent = w.text + ' ';
                wSpan.dataset.start = w.start;
                wSpan.dataset.end = w.end;
                wSpan.dataset.wordIndex = wIdx;
                wSpan.title = `"${w.text}" (${w.start.toFixed(1)}s)`;
                // wSpan.addEventListener('click', (e) => { e.stopPropagation(); playWordSnippet(w.start, w.end, wSpan); }); // Removed to allow clicking on the sentence to jump to it
                span.appendChild(wSpan);
            });
            span.addEventListener('click', () => jumpToSegment(i));
            span.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpToSegment(i); } });
            shadTextDisplay.appendChild(span);
        });
    }

    let wordSnippetTimeout = null;
    function playWordSnippet(start, end, wSpan) {
        if (!shadAudio) return;
        if (wSpan) { wSpan.classList.add('is-playing-snippet'); setTimeout(() => wSpan.classList.remove('is-playing-snippet'), 350); }
        const wasPlaying = shadIsPlaying;
        if (wasPlaying) stopShadowing();
        shadAudio.currentTime = Math.max(0, start - 0.04);
        shadAudio.play().catch(() => {});
        const durationMs = Math.max(220, (end - start + 0.12) * 1000);
        if (wordSnippetTimeout) clearTimeout(wordSnippetTimeout);
        wordSnippetTimeout = setTimeout(() => shadAudio.pause(), durationMs);
    }

    function updateActiveWordHighlight(segmentIndex, currentTime) {
        if (userSettings.highlightWord === false) return;
        const seg = shadSegments[segmentIndex];
        if (!seg || !seg.words) return;
        const activeWordIdx = seg.words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
        if (activeWordIdx === lastActiveWordIdx) return;
        lastActiveWordIdx = activeWordIdx;
        const currentSegEl = document.querySelector(`.segment-span[data-index="${segmentIndex}"]`);
        if (!currentSegEl) return;
        currentSegEl.querySelectorAll('.word-span').forEach((wEl, idx) => {
            wEl.classList.toggle('is-active-word', idx === activeWordIdx);
        });
    }

    function clearActiveWordHighlight() {
        document.querySelectorAll('.word-span.is-active-word').forEach(el => el.classList.remove('is-active-word'));
        lastActiveWordIdx = -1;
    }

    function updateStarredCounter() {
        if (!filterStarredCount) return;
        const list = getStarredSegments(currentLessonId);
        filterStarredCount.textContent = list.length;
        const isStarred = list.includes(shadCurrentSegmentIndex);
        if (starCurrentBtn) {
            starCurrentBtn.classList.toggle('is-starred', isStarred);
            const icon = starCurrentBtn.querySelector('.star-icon');
            if (icon) icon.innerHTML = isStarred ? APP_ICONS.starFilled : APP_ICONS.starOutline;
        }
        // Mobile star
        if (mobileStarBtn) {
            const icon = mobileStarBtn.querySelector('.star-icon');
            if (icon) icon.innerHTML = isStarred ? APP_ICONS.starFilled : APP_ICONS.starOutline;
        }
    }

    function handleStarClick() {
        if (shadCurrentSegmentIndex >= 0 && currentLessonId) {
            toggleStarredSegment(currentLessonId, shadCurrentSegmentIndex);
            updateStarredCounter();
            const currentEl = document.querySelector(`.segment-span[data-index="${shadCurrentSegmentIndex}"]`);
            if (currentEl) {
                currentEl.classList.toggle('is-starred', getStarredSegments(currentLessonId).includes(shadCurrentSegmentIndex));
            }
        }
    }

    if (starCurrentBtn) starCurrentBtn.addEventListener('click', handleStarClick);
    if (mobileStarBtn) mobileStarBtn.addEventListener('click', handleStarClick);

    if (filterStarredBtn) {
        filterStarredBtn.addEventListener('click', () => {
            filterOnlyStarred = !filterOnlyStarred;
            filterStarredBtn.classList.toggle('active', filterOnlyStarred);
            renderText(); highlightSegment(shadCurrentSegmentIndex);
        });
    }

    function highlightSegment(index) {
        clearActiveWordHighlight();
        let targetElement = null;
        document.querySelectorAll('.segment-span').forEach(el => {
            const elIdx = parseInt(el.dataset.index, 10);
            el.classList.remove('active', 'past', 'future');
            if (elIdx < index) el.classList.add('past');
            else if (elIdx === index) { el.classList.add('active'); targetElement = el; }
            else el.classList.add('future');
        });
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
    // TIMELINE
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
            if (timelineTrack) timelineTrack.setAttribute('aria-valuenow', Math.round(percent));
        }
    }

    if (timelineTrack) {
        timelineTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && shadAudio.duration > 0) { e.preventDefault(); shadAudio.currentTime = Math.max(0, shadAudio.currentTime - 5); updateTimelineUI(); }
            if (e.key === 'ArrowRight' && shadAudio.duration > 0) { e.preventDefault(); shadAudio.currentTime = Math.min(shadAudio.duration, shadAudio.currentTime + 5); updateTimelineUI(); }
        });
    }

    if (timelineContainer) {
        timelineContainer.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (shadAudio.duration > 0) {
                const targetTime = ratio * shadAudio.duration;
                shadAudio.currentTime = targetTime;
                let match = 0;
                for (let i = 0; i < shadSegments.length; i++) {
                    if (targetTime >= shadSegments[i].start && targetTime <= shadSegments[i].end) { match = i; break; }
                    if (targetTime > shadSegments[i].end) match = i;
                }
                jumpToSegment(match);
            }
        });
    }

    function startTimeUpdater() { stopTimeUpdater(); timeUpdateInterval = setInterval(updateTimelineUI, 200); }
    function stopTimeUpdater() { if (timeUpdateInterval) { clearInterval(timeUpdateInterval); timeUpdateInterval = null; } }

    // ========================================================
    // PLAYBACK
    // ========================================================
    function setStatusReady() {
        if (shadStatus) {
            shadStatus.className = 'status-bar';
            shadStatusText.textContent = 'Prêt';
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.headphones;
            shadProgress.style.width = '0%';
            countdownTimer.classList.add('hidden');
        }
    }

    function updatePlayButtonUI(playing) {
        // Desktop
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
        // Mobile
        if (mobilePlayBtn) {
            if (playing) {
                mobilePlayIcon.classList.add('hidden');
                mobilePauseIcon.classList.remove('hidden');
                mobilePlayBtn.classList.add('is-playing');
            } else {
                mobilePlayIcon.classList.remove('hidden');
                mobilePauseIcon.classList.add('hidden');
                mobilePlayBtn.classList.remove('is-playing');
            }
        }
    }

    function handlePlayClick() {
        if (shadIsPlaying) {
            stopShadowing();
        } else {
            if (shadCurrentSegmentIndex === -1) shadCurrentSegmentIndex = 0;
            initBeepContext();
            startShadowing();
        }
    }

    shadPlayBtn.addEventListener('click', handlePlayClick);
    if (mobilePlayBtn) mobilePlayBtn.addEventListener('click', handlePlayClick);

    // Segment navigation
    function handlePrevSeg() { if (shadCurrentSegmentIndex > 0) jumpToSegment(shadCurrentSegmentIndex - 1); }
    function handleNextSeg() { if (shadCurrentSegmentIndex < shadSegments.length - 1) jumpToSegment(shadCurrentSegmentIndex + 1); }
    function handleReplaySeg() { if (shadCurrentSegmentIndex >= 0) jumpToSegment(shadCurrentSegmentIndex); }

    if (prevSegBtn) prevSegBtn.addEventListener('click', handlePrevSeg);
    if (nextSegBtn) nextSegBtn.addEventListener('click', handleNextSeg);
    if (replaySegBtn) replaySegBtn.addEventListener('click', handleReplaySeg);
    if (mobilePrevSeg) mobilePrevSeg.addEventListener('click', handlePrevSeg);
    if (mobileNextSeg) mobileNextSeg.addEventListener('click', handleNextSeg);
    if (mobileReplaySeg) mobileReplaySeg.addEventListener('click', handleReplaySeg);

    function jumpToSegment(index) {
        shadCurrentSegmentIndex = index;
        segmentLoopCounter = 0;
        if (shadIsPlaying) { stopShadowing(); startShadowing(); }
        else highlightSegment(index);
    }

    function stopShadowing() {
        shadIsPlaying = false;
        updatePlayButtonUI(false);
        shadAudio.pause();
        cancelAnimationFrame(shadAnimFrame);
        stopTimeUpdater();
        stopRecording();
        clearActiveWordHighlight();
        if (shadStatus) {
            shadStatus.className = 'status-bar';
            shadStatusText.textContent = 'En pause';
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.pause;
            shadProgress.style.width = '0%';
            countdownTimer.classList.add('hidden');
        }
    }

    function startShadowing() {
        if (shadCurrentSegmentIndex >= shadSegments.length) shadCurrentSegmentIndex = 0;
        shadIsPlaying = true;
        updatePlayButtonUI(true);
        shadAudio.playbackRate = parseFloat(userSettings.speed);
        startTimeUpdater();
        playSegment(shadCurrentSegmentIndex);
    }

    function getNextSegmentIndex(fromIndex) {
        if (!filterOnlyStarred) return fromIndex + 1;
        const starred = getStarredSegments(currentLessonId);
        for (let i = fromIndex + 1; i < shadSegments.length; i++) {
            if (starred.includes(i)) return i;
        }
        return shadSegments.length;
    }

    function playSegment(index) {
        if (!shadIsPlaying) return;
        if (index >= shadSegments.length) {
            stopShadowing();
            shadStatusText.textContent = "Terminé ! Bravo";
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.trophy;
            shadStatus.className = "status-bar state-done";
            showToast("Leçon terminée", APP_ICONS.success);
            return;
        }
        const seg = shadSegments[index];
        lastOriginalSegmentSlice = { start: seg.start, end: seg.end };
        highlightSegment(index);

        shadStatus.className = "status-bar state-listening";
        shadStatusText.textContent = "Écoutez…";
        if (statusIcon) statusIcon.innerHTML = APP_ICONS.headphones;
        shadProgress.style.width = '0%';
        countdownTimer.classList.add('hidden');

        const doPlay = () => {
            if (!shadIsPlaying) return; // Prevent rogue playback if stopped before loadedmetadata fires
            
            // First set currentTime in case it works synchronously (for non-Safari)
            shadAudio.currentTime = seg.start;
            
            const playPromise = shadAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Safari/mobile workaround: enforce seek after playback starts
                    if (Math.abs(shadAudio.currentTime - seg.start) > 0.3) {
                        shadAudio.currentTime = seg.start;
                    }
                }).catch(() => {});
            }
        };
        
        if (shadAudio.readyState >= 1) {
            doPlay();
        } else {
            shadAudio.addEventListener('loadedmetadata', doPlay, { once: true });
        }

        const checkEnd = () => {
            if (!shadIsPlaying) return;
            updateTimelineUI();
            updateActiveWordHighlight(index, shadAudio.currentTime);
            if (shadAudio.currentTime >= seg.end) {
                clearActiveWordHighlight();
                shadAudio.pause();
                const isAutoPause = (autoPauseToggle && autoPauseToggle.checked) || (drawerAutoPause && drawerAutoPause.checked);
                if (isAutoPause) {
                    doPausePhase(seg, index);
                } else {
                    const isAutoNext = isAutoNextActive();
                    if (!isAutoNext) {
                        stopShadowing();
                    } else {
                        shadCurrentSegmentIndex = getNextSegmentIndex(index);
                        playSegment(shadCurrentSegmentIndex);
                    }
                }
            } else {
                shadAnimFrame = requestAnimationFrame(checkEnd);
            }
        };
        shadAnimFrame = requestAnimationFrame(checkEnd);
    }

    function doPausePhase(seg, index) {
        const prepTime = parseFloat(userSettings.prepTime) * 1000;
        if (prepTime > 0) {
            shadStatus.className = "status-bar state-prep";
            shadStatusText.textContent = "Préparez-vous…";
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.hourglass;
            countdownTimer.classList.remove('hidden');
            const prepStart = performance.now();
            const animatePrep = () => {
                if (!shadIsPlaying) return;
                const elapsed = performance.now() - prepStart;
                countdownTimer.textContent = Math.max(0, (prepTime - elapsed) / 1000).toFixed(1) + 's';
                if (elapsed >= prepTime) doSpeakingPhase(seg, index);
                else shadAnimFrame = requestAnimationFrame(animatePrep);
            };
            shadAnimFrame = requestAnimationFrame(animatePrep);
        } else {
            doSpeakingPhase(seg, index);
        }
    }

    function doSpeakingPhase(seg, index) {
        playBeep();
        const isRecording = isMicEnabled();
        if (isRecording) {
            startRecording(index);
            shadStatus.className = "status-bar state-recording";
            shadStatusText.textContent = "À vous ! (Enregistrement)";
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.mic;
        } else {
            shadStatus.className = "status-bar state-speaking";
            shadStatusText.textContent = "À vous !";
            if (statusIcon) statusIcon.innerHTML = APP_ICONS.speaker;
        }
        countdownTimer.classList.remove('hidden');
        const mult = parseFloat(userSettings.pauseMult);
        const duration = Math.max(1.0, (seg.end - seg.start) * mult);
        const pauseStartTime = performance.now();
        const pauseDurationMs = duration * 1000;

        const updateProgress = () => {
            if (!shadIsPlaying) { stopRecording(); return; }
            const elapsed = performance.now() - pauseStartTime;
            shadProgress.style.width = Math.min(100, (elapsed / pauseDurationMs) * 100) + '%';
            countdownTimer.textContent = Math.max(0, (pauseDurationMs - elapsed) / 1000).toFixed(1) + 's';
            if (elapsed < pauseDurationMs) {
                shadAnimFrame = requestAnimationFrame(updateProgress);
            } else {
                stopRecording();
                shadProgress.style.width = '0%';
                countdownTimer.classList.add('hidden');
                segmentLoopCounter++;
                let shouldRepeat = false;
                if (loopMode === -1) shouldRepeat = true;
                else if (loopMode > 1 && segmentLoopCounter < loopMode) shouldRepeat = true;
                if (shouldRepeat) {
                    playSegment(index);
                } else {
                    segmentLoopCounter = 0;
                    const isAutoNext = isAutoNextActive();
                    if (!isAutoNext) {
                        stopShadowing();
                    } else {
                        shadCurrentSegmentIndex = getNextSegmentIndex(index);
                        playSegment(shadCurrentSegmentIndex);
                    }
                }
            }
        };
        shadAnimFrame = requestAnimationFrame(updateProgress);
    }

    // ========================================================
    // KEYBOARD SHORTCUTS
    // ========================================================
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
            e.preventDefault();
            shortcutsModal.classList.contains('hidden') ? openModal(shortcutsModal) : closeModal(shortcutsModal);
            return;
        }

        if (e.code === 'Escape') {
            if (settingsDrawer && settingsDrawer.classList.contains('open')) { closeDrawer(); return; }
            if (settingsModal && !settingsModal.classList.contains('hidden')) { closeModal(settingsModal); return; }
            if (!shortcutsModal.classList.contains('hidden')) { closeModal(shortcutsModal); return; }
            if (shadIsPlaying) { stopShadowing(); return; }
            return;
        }

        const shadPanel = document.getElementById('panel-shadowing');
        if (!shadPanel.classList.contains('active')) return;
        if (shadControlsBar.classList.contains('hidden')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                handlePlayClick();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handlePrevSeg();
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleNextSeg();
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
                handleReplaySeg();
                break;
            case 'KeyS':
                e.preventDefault();
                handleStarClick();
                break;
            case 'KeyH':
                e.preventDefault();
                const newHide = !(hideTextToggle && hideTextToggle.checked);
                syncHideText(newHide);
                userSettings.hideText = newHide;
                saveSettings(userSettings);
                break;
            case 'KeyL':
                e.preventDefault();
                cycleLoopMode();
                break;
            case 'KeyM':
                e.preventDefault();
                handleMicToggle(!isMicEnabled());
                break;
            case 'Equal':
            case 'NumpadAdd':
                e.preventDefault();
                setPlaybackSpeed(parseFloat(userSettings.speed) + 0.1);
                break;
            case 'Minus':
            case 'NumpadSubtract':
                e.preventDefault();
                setPlaybackSpeed(parseFloat(userSettings.speed) - 0.1);
                break;
        }
    });

    // ========================================================
    // INIT
    // ========================================================
    applySavedSettings();
    initLibrary();
});
