/* --- CONFIGURACIÓN Y UTILIDADES --- */
const SPANISH_NOTES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const A4_FREQ = 440;
const A4_MIDI = 69;

// Variable global de contexto de audio (se inicia cuando se necesita)
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function initAudio() {
    return getAudioContext();
}

function getFreqFromMidi(midi) {
    return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

function showToast(msg) {
    let el = document.querySelector('.toast');
    if(!el) {
        el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el);
    }
    el.innerText = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

// Sintetizador simple genérico
function playTone(freq, duration = 0.5, type = 'sine', time = 0) {
    const ctx = getAudioContext();
    const t = time || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    
    osc.start(t);
    osc.stop(t + duration);
}

/* --- 1. LÓGICA CÍRCULO DE QUINTAS --- */
const circleApp = {
    data: {
        'C': { acc: '', accName: 'Ninguna', rel: 'Am', sig: 0 },
        'G': { acc: 'F#', accName: '1 Sostenido', rel: 'Em', sig: 1 },
        'D': { acc: 'F#, C#', accName: '2 Sostenidos', rel: 'Bm', sig: 2 },
        'A': { acc: 'F#, C#, G#', accName: '3 Sostenidos', rel: 'F#m', sig: 3 },
        'E': { acc: 'F#, C#, G#, D#', accName: '4 Sostenidos', rel: 'C#m', sig: 4 },
        'B': { acc: 'F#, C#, G#, D#, A#', accName: '5 Sostenidos', rel: 'G#m', sig: 5 },
        'F#': { acc: 'F#, C#, G#, D#, A#, E#', accName: '6 Sostenidos', rel: 'D#m', sig: 6 },
        'C#': { acc: 'F#, C#, G#, D#, A#, E#, B#', accName: '7 Sostenidos', rel: 'A#m', sig: 7 },
        'F': { acc: 'Bb', accName: '1 Bemol', rel: 'Dm', sig: -1 },
        'Bb': { acc: 'Bb, Eb', accName: '2 Bemoles', rel: 'Gm', sig: -2 },
        'Eb': { acc: 'Bb, Eb, Ab', accName: '3 Bemoles', rel: 'Cm', sig: -3 },
        'Ab': { acc: 'Bb, Eb, Ab, Db', accName: '4 Bemoles', rel: 'Fm', sig: -4 },
        'Db': { acc: 'Bb, Eb, Ab, Db, Gb', accName: '5 Bemoles', rel: 'Bbm', sig: -5 },
        'Gb': { acc: 'Bb, Eb, Ab, Db, Gb, Cb', accName: '6 Bemoles', rel: 'Ebm', sig: -6 },
        'Cb': { acc: 'Bb, Eb, Ab, Db, Gb, Cb, Fb', accName: '7 Bemoles', rel: 'Abm', sig: -7 },
    },
    init() {
        try {
            const btn = document.querySelector('#playScaleBtn');
            if(btn) btn.onclick = () => this.playScale();
            this.renderCircle();
        } catch(e) { console.error("Error iniciando Círculo:", e); }
    },
    renderCircle() {
        const svg = document.querySelector('#circleSvg');
        if(!svg) return;
        svg.innerHTML = '';
        const sortedKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        
        sortedKeys.forEach((key, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const r1 = 120; const r2 = 80;
            const pathMajor = this.createSegment(angle, r1, 140, key, 'major');
            svg.appendChild(pathMajor);
            const rel = this.data[key] ? this.data[key].rel : 'm';
            const pathMinor = this.createSegment(angle, 40, r2, rel, 'minor');
            svg.appendChild(pathMinor);
        });
    },
    /**
     * Creates an SVG segment (sector) with text for a circular visualization.
     * @param {number} angle - The starting angle in radians for the segment.
     * @param {number} rInner - The inner radius of the segment.
     * @param {number} rOuter - The outer radius of the segment.
     * @param {string} text - The text content to display in the segment.
     * @param {string} type - The segment type ('major' or 'minor') that determines styling and interactivity.
     * @returns {SVGGElement} A group element containing the segment path and text.
     */
    createSegment(angle, rInner, rOuter, text, type) {
        const cx = 160, cy = 160;
        const x1 = cx + rInner * Math.cos(angle); const y1 = cy + rInner * Math.sin(angle);
        const x2 = cx + rOuter * Math.cos(angle); const y2 = cy + rOuter * Math.sin(angle);
        const x3 = cx + rOuter * Math.cos(angle + 0.5); const y3 = cy + rOuter * Math.sin(angle + 0.5);
        const x4 = cx + rInner * Math.cos(angle + 0.5); const y4 = cy + rInner * Math.sin(angle + 0.5);
        const d = `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1}`;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d); path.setAttribute("fill", type === 'major' ? '#1e1e24' : '#2a2a35');
        path.setAttribute("stroke", '#333'); path.setAttribute("class", "circle-segment");
        const tx = cx + ((rInner + rOuter)/2) * Math.cos(angle + 0.25); const ty = cy + ((rInner + rOuter)/2) * Math.sin(angle + 0.25);
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", tx); txt.setAttribute("y", ty); txt.textContent = text;
        txt.setAttribute("transform", `rotate(${(angle * 180 / Math.PI) + 90}, ${tx}, ${ty})`);
        txt.style.fill = "#fff";
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.appendChild(path); group.appendChild(txt);
        if(type === 'major') group.onclick = () => this.selectKey(text);
        return group;
    },
    selectKey(key) {
        initAudio();
        const info = this.data[key] || { acc: '-', accName: '-', rel: '-' };
        const panel = document.getElementById('infoPanel');
        if(panel) panel.style.opacity = '1';

        document.querySelector('#keyTitle').innerText = `${key} Mayor`;
        document.querySelector('#keySignature').innerText = info.accName;
        document.querySelector('#keyAccidentals').innerText = info.acc ? info.acc : '(Naturales)';
        document.querySelector('#relativeMinor').innerText = info.rel;
        
        const idx = SPANISH_NOTES.indexOf(key);
        const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
        const scaleNotes = intervals.map(i => SPANISH_NOTES[(idx + i) % 12]);
        const scaleContainer = document.querySelector('#scaleNotes');
        if(scaleContainer) scaleContainer.innerHTML = scaleNotes.map(n => `<span style="color:#fff; font-size:1rem; margin-right:5px; font-weight:bold;">${n}</span>`).join(' ');

        const chordRoots = [0, 2, 4, 5, 7, 9, 11];
        const chordTypes = ['', 'm', 'm', '', '', 'm', '°'];
        const chordNames = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
        const chordContainer = document.querySelector('#chordGrid');
        if(chordContainer) {
            chordContainer.innerHTML = '';
            chordRoots.forEach((offset, i) => {
                const rootIdx = (idx + offset) % 12;
                const rootName = SPANISH_NOTES[rootIdx];
                const btn = document.createElement('div');
                btn.className = 'chord-btn';
                btn.innerHTML = `<strong>${chordNames[i]}</strong><br>${rootName}${chordTypes[i]}`;
                btn.onclick = () => this.playChord(rootIdx, chordTypes[i]);
                chordContainer.appendChild(btn);
            });
        }
        this.playChord(idx, '');
    },
    playScale() {
        const title = document.querySelector('#keyTitle').innerText.split(' ')[0];
        const idx = SPANISH_NOTES.indexOf(title);
        const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
        let now = getAudioContext().currentTime;
        intervals.forEach(interval => {
            const noteIdx = (idx + interval) % 12;
            const midi = 60 + noteIdx;
            playTone(getFreqFromMidi(midi), 0.5, 'sine', now);
            now += 0.5;
        });
    },
    playChord(rootIdx, type) {
        const midiRoot = 60 + rootIdx;
        const freq = getFreqFromMidi(midiRoot);
        playTone(freq, 1.0, 'triangle');
        if (type === 'm') playTone(freq * 1.059, 1.0, 'triangle');
        else if (type !== '°') playTone(freq * 1.122, 1.0, 'triangle');
        if (type === '°') playTone(freq * 1.414, 1.0, 'triangle');
        else playTone(freq * 1.498, 1.0, 'triangle');
    }
};

/* --- 2. LÓGICA AFINADOR --- */
const tunerApp = {
    isRunning: false, analyser: null, mediaStream: null, bufferLength: null, dataArray: null, rafId: null, needlePosition: 50,
    init() {
        try {
            const btn = document.getElementById('tunerToggleBtn');
            const refBtn = document.getElementById('playRefBtn');
            const sel = document.getElementById('refNoteSelect');
            
            if(btn) btn.addEventListener('click', () => this.toggle());
            if(refBtn) refBtn.addEventListener('click', () => this.playReference());
            
            this.populateRefSelect();
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        } catch(e) { console.error("Error iniciando Afinador:", e); }
    },
    populateRefSelect() {
        const sel = document.getElementById('refNoteSelect');
        if(!sel) return;
        const octaves = [3, 4];
        octaves.forEach(o => { 
            SPANISH_NOTES.forEach(n => {
                const opt = document.createElement('option'); 
                opt.text = `${n} ${o}`; 
                opt.value = `${n}-${o}`; 
                sel.appendChild(opt);
            }); 
        });
    },
    resizeCanvas() {
        const canvas = document.getElementById('waveCanvas');
        if(canvas) {
            canvas.width = canvas.parentElement.clientWidth; 
            canvas.height = canvas.parentElement.clientHeight;
        }
    },
    async toggle() {
        if (this.isRunning) this.stop(); else this.start();
    },
    async start() {
        try {
            const ctx = getAudioContext();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
            this.mediaStream = ctx.createMediaStreamSource(stream);
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.fftSize;
            this.dataArray = new Float32Array(this.bufferLength);
            this.mediaStream.connect(this.analyser);
            this.isRunning = true;
            const btn = document.getElementById('tunerToggleBtn');
            if(btn) {
                btn.classList.add('active-state');
                const span = btn.querySelector('span');
                if(span) span.innerText = "Detener";
            }
            this.update();
        } catch (e) { console.error(e); showToast("Error al acceder al micrófono."); }
    },
    stop() {
        if (this.mediaStream) { this.mediaStream.disconnect(); this.mediaStream = null; }
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.isRunning = false;
        const btn = document.getElementById('tunerToggleBtn');
        if(btn) {
            btn.classList.remove('active-state');
            const span = btn.querySelector('span');
            if(span) span.innerText = "Iniciar Micrófono";
        }
        const noteDisplay = document.getElementById('noteDisplay');
        const freqDisplay = document.getElementById('freqDisplay');
        const statusText = document.getElementById('statusText');
        const needle = document.getElementById('needle');
        const canvas = document.getElementById('waveCanvas');
        
        if(noteDisplay) noteDisplay.innerText = "--";
        if(freqDisplay) freqDisplay.innerText = "0.0 Hz";
        if(statusText) {
            statusText.innerText = "Listo";
            statusText.className = "status-text";
        }
        this.needlePosition = 50;
        if(needle) needle.style.left = "50%";
        if(canvas) {
            const ctx = canvas.getContext('2d'); 
            ctx.clearRect(0, 0, 1000, 1000);
        }
    },
    update() {
        if (!this.isRunning) return;
        this.rafId = requestAnimationFrame(() => this.update());
        this.analyser.getFloatTimeDomainData(this.dataArray);
        this.drawWaveform();
        const pitch = this.autoCorrelate(this.dataArray, getAudioContext().sampleRate);
        if (pitch === -1) {
            const statusText = document.getElementById('statusText');
            if(statusText) {
                statusText.innerText = "Escuchando...";
                statusText.className = "status-text";
            }
            this.needlePosition = 50 + (this.needlePosition - 50) * 0.9;
        } else {
            const midiNote = Math.round(12 * (Math.log(pitch / A4_FREQ) / Math.log(2)) + A4_MIDI);
            const noteName = SPANISH_NOTES[midiNote % 12];
            const octave = Math.floor(midiNote / 12) - 1;
            const baseFreq = A4_FREQ * Math.pow(2, (midiNote - A4_MIDI) / 12);
            const cents = 1200 * Math.log(pitch / baseFreq) / Math.log(2);
            
            const noteDisplay = document.getElementById('noteDisplay');
            const freqDisplay = document.getElementById('freqDisplay');
            const statusText = document.getElementById('statusText');
            const needle = document.getElementById('needle');

            if(noteDisplay) noteDisplay.innerText = noteName;
            if(freqDisplay) freqDisplay.innerText = Math.round(pitch) + " Hz";
            let targetPos = 50 + cents;
            if (targetPos > 100) targetPos = 100; if (targetPos < 0) targetPos = 0;
            this.needlePosition = this.needlePosition + (targetPos - this.needlePosition) * 0.15;
            if(needle) needle.style.left = `${this.needlePosition}%`;
            
            if(statusText) {
                if (Math.abs(cents) < 10) {
                    statusText.innerText = "¡Perfecto!";
                    statusText.className = "status-text status-perfect";
                } else if (cents < 0) {
                    statusText.innerText = "Bajo";
                    statusText.className = "status-text status-flat";
                } else {
                    statusText.innerText = "Alto";
                    statusText.className = "status-text status-sharp";
                }
            }
        }
        const needle = document.getElementById('needle');
        if(needle) needle.style.left = `${this.needlePosition}%`;
    },
    autoCorrelate(buf, sampleRate) {
        let SIZE = buf.length; let rms = 0;
        for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1;
        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        buf = buf.slice(r1, r2); SIZE = buf.length;
        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
        let T0 = maxpos;
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
        return sampleRate / T0;
    },
    drawWaveform() {
        const canvas = document.getElementById('waveCanvas'); if(!canvas) return;
        const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
        ctx.lineWidth = 2; ctx.strokeStyle = '#00e5ff'; ctx.beginPath();
        const sliceWidth = w * 1.0 / this.bufferLength; let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] * 4; const y = (h / 2) + (v * h / 2);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(w, h / 2); ctx.stroke();
    },
    playReference() {
        const val = document.getElementById('refNoteSelect').value;
        const [note, oct] = val.split('-');
        const noteIdx = SPANISH_NOTES.indexOf(note);
        const midi = (parseInt(oct) + 1) * 12 + noteIdx;
        const freq = A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
        const osc = getAudioContext().createOscillator(); const gain = getAudioContext().createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        osc.connect(gain); gain.connect(getAudioContext().destination);
        osc.start(); gain.gain.setValueAtTime(0.1, getAudioContext().currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, getAudioContext().currentTime + 1);
        osc.stop(getAudioContext().currentTime + 1);
    }
};

/* --- 3. METRÓNOMO --- */
const metronomeApp = {
    isPlaying: false, tempo: 100, lookahead: 25.0, scheduleAheadTime: 0.1, nextNoteTime: 0.0, currentBeat: 0, beatsPerBar: 4, timerID: null,
    init() {
        try {
            const bpmInput = document.getElementById('bpmInput');
            const bpmSlider = document.getElementById('bpmSlider');
            if(bpmInput) bpmInput.addEventListener('change', (e) => this.setBPM(e.target.value));
            if(bpmSlider) bpmSlider.addEventListener('input', (e) => this.setBPM(e.target.value));
            
            const radios = document.getElementsByName('timeSig');
            if(radios.length > 0) {
                radios.forEach(r => r.addEventListener('change', (e) => this.setTimeSig(e.target.value)));
            }
        } catch(e) { console.error("Error iniciando Metrónomo:", e); }
    },
    setBPM(val) {
        this.tempo = parseInt(val);
        const bpmInput = document.getElementById('bpmInput');
        const bpmSlider = document.getElementById('bpmSlider');
        if(bpmInput) bpmInput.value = this.tempo;
        if(bpmSlider) bpmSlider.value = this.tempo;
    },
    adjustBPM(delta) { this.setBPM(this.tempo + delta); },
    setTimeSig(val) {
        this.beatsPerBar = parseInt(val);
        document.querySelectorAll('.beat-dot').forEach(d => { d.classList.remove('active'); d.style.opacity = '0.3'; });
        for(let i=0; i<this.beatsPerBar; i++) {
            const dot = document.getElementById(`beat${i}`);
            if(dot) dot.style.opacity = '1';
        }
    },
    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeat++;
        if (this.currentBeat === this.beatsPerBar) this.currentBeat = 0;
    },
    scheduleNote(beatNumber, time) {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 1500;
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        if (beatNumber === 0) { osc.frequency.value = 1200; gain.gain.setValueAtTime(0.5, time);
        } else { osc.frequency.value = 800; gain.gain.setValueAtTime(0.3, time); }
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.start(time); osc.stop(time + 0.05);
        const drawTime = (time - ctx.currentTime) * 1000;
        setTimeout(() => {
            document.querySelectorAll('.beat-dot').forEach(d => { d.classList.remove('beat-1', 'beat-weak'); d.style.transform = 'scale(1)'; });
            const dot = document.getElementById(`beat${beatNumber}`);
            if(dot) {
                dot.classList.add(beatNumber === 0 ? 'beat-1' : 'beat-weak');
                dot.style.transform = 'scale(1.2)';
            }
        }, Math.max(0, drawTime));
    },
    scheduler() {
        const ctx = getAudioContext();
        while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime); this.nextNote();
        }
        if (this.isPlaying) this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    },
    toggle() {
        this.isPlaying = !this.isPlaying; const btn = document.getElementById('metroToggleBtn');
        if (this.isPlaying) {
            initAudio();
            this.currentBeat = 0; this.nextNoteTime = getAudioContext().currentTime + 0.05; this.scheduler();
            if(btn) {
                btn.classList.add('active-state'); 
                btn.innerText = "Detener";
            }
        } else {
            window.clearTimeout(this.timerID); 
            if(btn) {
                btn.classList.remove('active-state'); 
                btn.innerText = "Iniciar Metrónomo";
            }
            document.querySelectorAll('.beat-dot').forEach(d => d.classList.remove('beat-1', 'beat-weak'));
        }
    }
};

/* --- 4. BEAT BOX --- */
const beatBoxApp = {
    isPlaying: false, tempo: 120, currentStep: 0, nextNoteTime: 0, timerID: null,
    tracks: [
        { name: 'Bombo', color: 'row-0', active: new Array(16).fill(false) },
        { name: 'Caja', color: 'row-1', active: new Array(16).fill(false) },
        { name: 'Hat', color: 'row-2', active: new Array(16).fill(false) },
        { name: 'Clap', color: 'row-3', active: new Array(16).fill(false) }
    ],
    init() {
        try {
            const grid = document.getElementById('sequencerGrid'); 
            if(!grid) return;
            grid.innerHTML = '';
            this.tracks.forEach((track, trackIdx) => {
                const label = document.createElement('div'); label.className = 'track-label'; label.innerText = track.name; grid.appendChild(label);
                for(let i=0; i<16; i++) {
                    const btn = document.createElement('div'); btn.className = `step-btn ${track.color}`;
                    btn.onclick = () => { track.active[i] = !track.active[i]; btn.classList.toggle('active', track.active[i]); };
                    grid.appendChild(btn);
                }
            });
        } catch(e) { console.error("Error iniciando BeatBox:", e); }
    },
    toggle() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('beatPlayBtn');
        if(!btn) return;

        if(this.isPlaying) {
            initAudio();
            this.currentStep = 0; this.nextNoteTime = getAudioContext().currentTime; this.scheduler();
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Detener`;
        } else {
            clearTimeout(this.timerID); btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tocar`;
        }
    },
    setBpm(val) { this.tempo = parseInt(val); },
    clearPattern() { this.tracks.forEach(t => t.active.fill(false)); document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active')); },
    scheduler() {
        const ctx = getAudioContext();
        while (this.nextNoteTime < ctx.currentTime + 0.1) {
            this.playStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += 60.0 / this.tempo / 4;
            this.currentStep = (this.currentStep + 1) % 16;
        }
        if(this.isPlaying) this.timerID = requestAnimationFrame(() => this.scheduler());
    },
    playStep(step, time) {
        // Highlight visual simplificado (resaltamos todos los botones activos del paso)
        setTimeout(() => {
            document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('step-current'));
            // Nota: El selector CSS nth-child para grid puede ser complejo, simplificamos visualmente
            const allBtns = document.querySelectorAll('.step-btn');
            // Highlight logic simplified for stability
        }, (time - getAudioContext().currentTime) * 1000);

        this.tracks.forEach((track, idx) => {
            if(track.active[step]) {
                if(idx === 0) this.playKick(time);
                if(idx === 1) this.playSnare(time);
                if(idx === 2) this.playHat(time);
                if(idx === 3) this.playClap(time);
            }
        });
    },
    playKick(time) {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, time); osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time); osc.stop(time + 0.5);
    },
    playSnare(time) {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'triangle'; osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(250, time); gain.gain.setValueAtTime(0.5, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time); osc.stop(time + 0.2);
    },
    playHat(time) {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); const filter = ctx.createBiquadFilter();
        osc.type = 'square'; osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        filter.type = 'highpass'; filter.frequency.value = 8000;
        osc.frequency.setValueAtTime(800, time); gain.gain.setValueAtTime(0.1, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.start(time); osc.stop(time + 0.05);
    },
    playClap(time) {
         const ctx = getAudioContext();
         const osc = ctx.createOscillator(); const gain = ctx.createGain();
         osc.type = 'sawtooth'; osc.connect(gain); gain.connect(ctx.destination);
         osc.frequency.setValueAtTime(1200, time); gain.gain.setValueAtTime(0.3, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
         osc.start(time); osc.stop(time + 0.1);
    }
};

/* --- 5. EAR TRAINER --- */
const earApp = {
    currentInterval: null,
    intervals: {
        '3m': { semitones: 3, name: '3ra Menor' },
        '3M': { semitones: 4, name: '3ra Mayor' },
        '5J': { semitones: 7, name: '5ta Justa' },
        '8va': { semitones: 12, name: 'Octava' }
    },
    init() {
        try {
            const playBtn = document.getElementById('earPlayBtn');
            if(playBtn) playBtn.addEventListener('click', () => this.playQuestion());
            
            const answerBtns = document.querySelectorAll('.ear-answer-btn');
            answerBtns.forEach(btn => {
                btn.addEventListener('click', () => this.checkAnswer(btn.dataset.interval));
            });
        } catch(e) { console.error("Error iniciando Ear Trainer:", e); }
    },
    playQuestion() {
        const keys = Object.keys(this.intervals);
        this.currentInterval = keys[Math.floor(Math.random() * keys.length)];
        const rootMidi = 48 + Math.floor(Math.random() * 12); 
        const rootFreq = getFreqFromMidi(rootMidi);
        const semitones = this.intervals[this.currentInterval].semitones;
        const targetFreq = rootFreq * Math.pow(2, semitones / 12);
        
        playTone(rootFreq, 0.5, 'sine', getAudioContext().currentTime + 0.1);
        playTone(targetFreq, 0.5, 'sine', getAudioContext().currentTime + 0.8);
        
        const feedback = document.getElementById('earFeedback');
        if(feedback) {
            feedback.innerText = "Escucha..."; 
            feedback.className = "";
        }
        const btn = document.getElementById('earPlayBtn');
        if(btn) {
            btn.classList.add('active-state');
            setTimeout(() => btn.classList.remove('active-state'), 1000);
        }
    },
    checkAnswer(answer) {
        if(!this.currentInterval) return;
        const isCorrect = answer === this.currentInterval;
        const feedback = document.getElementById('earFeedback');
        if(feedback) {
            if(isCorrect) {
                feedback.innerText = "¡Correcto! " + this.intervals[this.currentInterval].name;
                feedback.style.color = "var(--success)";
                this.playQuestion();
            } else {
                feedback.innerText = "Incorrecto. Era " + this.intervals[this.currentInterval].name;
                feedback.style.color = "var(--secondary)";
            }
        }
    }
};

/* --- 6. DRONE --- */
const droneApp = {
    activeOscillators: {},
    init() {
        try {
            const container = document.getElementById('droneKeys');
            if(!container) return;
            const naturalNotes = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
            naturalNotes.forEach(note => {
                const div = document.createElement('div'); div.className = 'drone-key'; div.innerText = note;
                div.addEventListener('mousedown', () => this.playNote(note, div));
                div.addEventListener('mouseup', () => this.stopNote(note, div));
                div.addEventListener('mouseleave', () => this.stopNote(note, div));
                div.addEventListener('touchstart', (e) => { e.preventDefault(); this.playNote(note, div); });
                div.addEventListener('touchend', (e) => { e.preventDefault(); this.stopNote(note, div); });
                container.appendChild(div);
            });
        } catch(e) { console.error("Error iniciando Drone:", e); }
    },
    playNote(note, uiElement) {
        initAudio();
        if (this.activeOscillators[note]) return;
        const ctx = getAudioContext();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        const idx = SPANISH_NOTES.indexOf(note); const midi = 60 + idx;
        const freq = getFreqFromMidi(midi);
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 600;
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.start(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
        this.activeOscillators[note] = { osc, gain, uiElement }; uiElement.classList.add('playing');
    },
    stopNote(note, uiElement) {
        if (!this.activeOscillators[note]) return;
        const { osc, gain } = this.activeOscillators[note];
        gain.gain.cancelScheduledValues(getAudioContext().currentTime); gain.gain.setValueAtTime(gain.gain.value, getAudioContext().currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, getAudioContext().currentTime + 0.5);
        osc.stop(getAudioContext().currentTime + 0.5);
        delete this.activeOscillators[note]; uiElement.classList.remove('playing');
    },
    stopAll() { Object.keys(this.activeOscillators).forEach(note => this.stopNote(note, this.activeOscillators[note].uiElement)); }
};

/* --- 7. SONÓGRAFO CON ECUALIZADOR DE ARMÓNICOS --- */
const spectrometerApp = {
    isRunning: false,
    analyser: null,
    mediaStream: null,
    rafId: null,
    speed: 2, // Velocidad de desplazamiento
    
    // Nodos de Audio para el EQ
    harmonicFilter: null, 
    isHarmonicsBoosted: false,

    init() {
        try {
            console.log("Iniciando SONÓGRAFO (Cascada) + EQ");
            const btn = document.getElementById('spectroToggleBtn');
            const harmonicBtn = document.getElementById('harmonicToggleBtn');
            
            if (!btn) return;
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => this.toggle());

            // Evento del botón de Armonicos
            if(harmonicBtn) {
                harmonicBtn.addEventListener('click', () => this.toggleHarmonics(harmonicBtn));
            }

            // Slider de velocidad
            const speedSlider = document.getElementById('speedSlider');
            if(speedSlider) {
                speedSlider.addEventListener('input', (e) => { this.speed = parseInt(e.target.value); });
            }

            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        } catch(e) { console.error("Error iniciando:", e); }
    },

    resizeCanvas() {
        const canvas = document.getElementById('spectroCanvas');
        if(canvas) {
            canvas.width = canvas.parentElement.clientWidth; 
            canvas.height = canvas.parentElement.clientHeight;
        }
    },

    async toggle() {
        if (this.isRunning) this.stop(); 
        else this.start();
    },

    toggleHarmonics(btnElement) {
        this.isHarmonicsBoosted = !this.isHarmonicsBoosted;
        const ctx = getAudioContext();

        if (this.isHarmonicsBoosted) {
            btnElement.innerText = "ON";
            btnElement.style.background = "var(--success)";
            btnElement.style.color = "#000";
            showToast("Ecualizador: ACTIVO (2kHz - 4kHz)");

            if (this.harmonicFilter && this.isRunning) {
                this.harmonicFilter.gain.cancelScheduledValues(ctx.currentTime);
                this.harmonicFilter.gain.linearRampToValueAtTime(12, ctx.currentTime + 0.1);
            }
        } else {
            btnElement.innerText = "OFF";
            btnElement.style.background = "#333";
            btnElement.style.color = "#fff";
            showToast("Ecualizador: INACTIVO");

            if (this.harmonicFilter && this.isRunning) {
                this.harmonicFilter.gain.cancelScheduledValues(ctx.currentTime);
                this.harmonicFilter.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            }
        }
    },

    async start() {
        try {
            const ctx = getAudioContext();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
            
            this.mediaStream = ctx.createMediaStreamSource(stream);
            
            // --- CONFIGURACIÓN AUDIO ---
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 4096; // Alta resolución para líneas finas
            
            // Crear filtro para armónicos
            this.harmonicFilter = ctx.createBiquadFilter();
            this.harmonicFilter.type = 'peaking';
            this.harmonicFilter.frequency.value = 2500; // Zona de formantes vocales
            this.harmonicFilter.Q.value = 2.0; // Ancho de banda

            // Aplicar estado inicial del EQ
            this.harmonicFilter.gain.value = this.isHarmonicsBoosted ? 12 : 0;

            // Conectar: Mic -> Filtro -> Analizador
            this.mediaStream.connect(this.harmonicFilter);
            this.harmonicFilter.connect(this.analyser);
            
            this.isRunning = true;
            
            const btn = document.getElementById('spectroToggleBtn');
            if(btn) {
                btn.classList.add('active-state');
                btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Detener`;
            }
            this.draw();
            
        } catch (e) { 
            console.error("Error al iniciar:", e); 
            showToast("Error: " + e.message); 
        }
    },

    stop() {
        if (this.mediaStream) { this.mediaStream.disconnect(); this.mediaStream = null; }
        if (this.harmonicFilter) { this.harmonicFilter.disconnect(); this.harmonicFilter = null; }
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.isRunning = false;
        
        const btn = document.getElementById('spectroToggleBtn');
        if(btn) {
            btn.classList.remove('active-state');
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg> Iniciar Micrófono`;
        }
        
        const canvas = document.getElementById('spectroCanvas');
        if(canvas) {
            const ctx = canvas.getContext('2d'); 
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

        draw() {
        if (!this.isRunning) return;
        
        // Programar el siguiente frame
        this.rafId = requestAnimationFrame(() => this.draw());

        const canvas = document.getElementById('spectroCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        // 1. DESPLAZAR (Scroll effect)
        ctx.drawImage(canvas, -this.speed, 0);

        // 2. DIBUJAR COLUMNA NUEVA
        const xPos = w - this.speed;
        ctx.fillStyle = '#000000';
        ctx.fillRect(xPos, 0, this.speed, h);

        // --- CONFIGURACIÓN DE "SEPARACIÓN DE LÍNEAS" ---
        // Aumentamos este valor para líneas más gordas y separadas
        const pixelStep = 3; 
        
        // Crear imagen de datos para la nueva columna
        const imgData = ctx.createImageData(this.speed, h);
        const data = imgData.data;

        for (let y = 0; y < h; y += pixelStep) {
            // Invertir Y (0 es agudos arriba)
            const percent = 1 - (y / h); 
            
            // Mapeo Logarítmico
            const index = Math.floor(Math.pow(percent, 2.5) * bufferLength);
            const safeIndex = Math.min(index, bufferLength - 1);
            
            const value = dataArray[safeIndex];
            
            // Obtener color del mapa de calor
            const color = this.getHeatmapColor(value);
            
            // Llenar el bloque vertical (pixelStep alto)
            // Esto crea líneas horizontales sólidas y gordas
            for (let x = 0; x < this.speed; x++) {
                const cell = (y * this.speed + x) * 4;
                data[cell] = color.r;     // R
                data[cell + 1] = color.g; // G
                data[cell + 2] = color.b; // B
                data[cell + 3] = 255;   // Alpha (Opaco)
            }
        }

        // Poner la imagen en el canvas
        ctx.putImageData(imgData, xPos, 0);
    },

       // Función de colores: Mapa de Calor (Verde -> Rojo)
    getHeatmapColor(value) {
        // Si es silencio absoluto, devuelve Negro
        if (value === 0) return { r: 0, g: 0, b: 0 };

        // Normalizar valor de 0 a 1
        const val = value / 255;
        let r, g, b;

        // --- INTERPOLACIÓN DE COLORES ---
        // Queremos: Verde (Suave) -> Amarillo (Medio) -> Rojo (Fuerte)
        
        if (val < 0.5) {
            // Fase 1: Verde a Amarillo (0.0 a 0.5)
            // R sube: 0 -> 255
            // G se mantiene: 255
            // B se mantiene: 0
            r = Math.floor(val * 2 * 255); 
            g = 255;
            b = 0;
        } else {
            // Fase 2: Amarillo a Rojo (0.5 a 1.0)
            // R se mantiene: 255
            // G baja: 255 -> 0
            // B se mantiene: 0
            r = 255;
            g = Math.floor((1 - (val - 0.5) * 2) * 255);
            b = 0;
        }

        return { r, g, b };
    }
};

/* --- ROUTING DE INICIALIZACIÓN --- */
window.addEventListener('DOMContentLoaded', () => {
    try {
        const path = window.location.pathname;
        
        // Marcar link activo en menú
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if(href && path.includes(href)) link.classList.add('active');
        });

        console.log("App iniciada en:", path);

        // Iniciar herramienta correcta
        if (path.includes('circle.html')) circleApp.init();
        else if (path.includes('tuner.html')) tunerApp.init();
        else if (path.includes('metronome.html')) metronomeApp.init();
        else if (path.includes('beatbox.html')) beatBoxApp.init();
        else if (path.includes('ear.html')) earApp.init();
        else if (path.includes('drone.html')) droneApp.init();
        else if (path.includes('spectrometer.html')) spectrometerApp.init();
        
    } catch(e) {
        console.error("Error crítico al iniciar la aplicación:", e);
        showToast("Error al iniciar la app. Revisa la consola (F12).");
    }
});