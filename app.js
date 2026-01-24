/* --- CONFIGURACIÓN --- */
const SPANISH_NOTES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const A4_FREQ = 440;
const A4_MIDI = 69;

/* --- UTILIDADES --- */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
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

// Sintetizador simple
function playTone(freq, duration = 0.5, type = 'sine', time = 0) {
    const t = time || audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    
    osc.start(t);
    osc.stop(t + duration);
}

/* --- INICIALIZACIÓN POR PÁGINA --- */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Marcar link activo en menú
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.getAttribute('href') === path.split('/').pop()) {
            link.classList.add('active');
        }
    });

    if (path.includes('circle.html')) circleApp.init();
    else if (path.includes('tuner.html')) tunerApp.init();
    else if (path.includes('metronome.html')) metronomeApp.init();
    // Añadir aquí el resto de herramientas...
});

/* --- LÓGICA CÍRCULO DE QUINTAS --- */
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
        // (Simplificado: usar bemoles para la otra mitad en una app completa, aquí usamos sostenidos por brevedad)
        'F': { acc: 'Bb', accName: '1 Bemol', rel: 'Dm', sig: -1 },
        'Bb': { acc: 'Bb, Eb', accName: '2 Bemoles', rel: 'Gm', sig: -2 },
        'Eb': { acc: 'Bb, Eb, Ab', accName: '3 Bemoles', rel: 'Cm', sig: -3 },
        'Ab': { acc: 'Bb, Eb, Ab, Db', accName: '4 Bemoles', rel: 'Fm', sig: -4 },
        'Db': { acc: 'Bb, Eb, Ab, Db, Gb', accName: '5 Bemoles', rel: 'Bbm', sig: -5 },
    },
    init() {
        this.renderCircle();
        document.querySelector('#playScaleBtn').onclick = () => this.playScale();
    },
    renderCircle() {
        // SVG Setup simplificado
        const svg = document.querySelector('#circleSvg');
        const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
        // Orden correcto círculo quintas: C G D A E B F# C# Gb Db Ab Eb Bb F
        const sortedKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        
        sortedKeys.forEach((key, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const r1 = 120; // Radio exterior
            const r2 = 80;  // Radio interior (menores)
            
            // Segmento Mayor
            const pathMajor = this.createSegment(angle, r1, 140, key, 'major');
            svg.appendChild(pathMajor);
            
            // Segmento Menor (Relativa)
            // Nota relativa = Tónica + 9 semitonos (o -3)
            const rel = this.data[key] ? this.data[key].rel : 'm';
            const pathMinor = this.createSegment(angle, 40, r2, rel, 'minor');
            svg.appendChild(pathMinor);
        });
    },
    createSegment(angle, rInner, rOuter, text, type) {
        const x1 = 160 + rInner * Math.cos(angle);
        const y1 = 160 + rInner * Math.sin(angle);
        const x2 = 160 + rOuter * Math.cos(angle);
        const y2 = 160 + rOuter * Math.sin(angle);
        
        const x3 = 160 + rOuter * Math.cos(angle + 0.5);
        const y3 = 160 + rOuter * Math.sin(angle + 0.5);
        const x4 = 160 + rInner * Math.cos(angle + 0.5);
        const y4 = 160 + rInner * Math.sin(angle + 0.5);

        const d = `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1}`;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", type === 'major' ? '#1e1e24' : '#2a2a35');
        path.setAttribute("stroke", '#333');
        path.setAttribute("class", "circle-segment");
        
        // Texto
        const tx = 160 + ((rInner + rOuter)/2) * Math.cos(angle + 0.25);
        const ty = 160 + ((rInner + rOuter)/2) * Math.sin(angle + 0.25);
        
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", tx);
        txt.setAttribute("y", ty);
        txt.textContent = text;
        txt.setAttribute("transform", `rotate(${(angle * 180 / Math.PI) + 90}, ${tx}, ${ty})`);
        
        // Click Event
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.appendChild(path);
        group.appendChild(txt);
        
        if(type === 'major') {
            group.onclick = () => this.selectKey(text);
        }

        return group;
    },
    selectKey(key) {
        initAudio();
        const info = this.data[key] || { acc: '-', accName: '-', rel: '-' };
        
        document.querySelector('#keyTitle').innerText = `${key} Mayor`;
        document.querySelector('#keySignature').innerText = info.accName;
        document.querySelector('#keyAccidentals').innerText = info.acc ? info.acc : '(Naturales)';
        document.querySelector('#relativeMinor').innerText = info.rel;
        
        // Generar Escala
        // Fórmula Mayor: T T ST T T T ST (2 2 1 2 2 2 1 semitonos)
        const idx = SPANISH_NOTES.indexOf(key);
        const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
        const scaleNotes = intervals.map(i => SPANISH_NOTES[(idx + i) % 12]);
        
        const scaleContainer = document.querySelector('#scaleNotes');
        scaleContainer.innerHTML = scaleNotes.map(n => `<span class="detail-value" style="color:var(--text-main); font-size:1rem; margin-right:5px;">${n}</span>`).join(' ');

        // Generar Acordes (I, ii, iii, IV, V, vi, vii°)
        const chordRoots = [0, 2, 4, 5, 7, 9, 11]; // Grados
        const chordTypes = ['', 'm', 'm', '', '', 'm', '°']; // Calidad
        const chordNames = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
        
        const chordContainer = document.querySelector('#chordGrid');
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
        
        // Reproducir acorde tónico al seleccionar
        this.playChord(idx, '');
    },
    playScale() {
        const title = document.querySelector('#keyTitle').innerText.split(' ')[0];
        const idx = SPANISH_NOTES.indexOf(title);
        const intervals = [0, 2, 4, 5, 7, 9, 11, 12];
        let now = audioCtx.currentTime;
        intervals.forEach(interval => {
            const noteIdx = (idx + interval) % 12;
            const midi = 60 + noteIdx; // Do central
            playTone(getFreqFromMidi(midi), 0.5, 'sine', now);
            now += 0.5;
        });
    },
    playChord(rootIdx, type) {
        const midiRoot = 60 + rootIdx;
        const freq = getFreqFromMidi(midiRoot);
        
        playTone(freq, 1.0, 'triangle');
        
        if (type === 'm') playTone(freq * 1.059, 1.0, 'triangle'); // 3ra menor
        else if (type !== '°') playTone(freq * 1.122, 1.0, 'triangle'); // 3ra Mayor
        
        if (type === '°') playTone(freq * 1.414, 1.0, 'triangle'); // 5ta disminuida
        else playTone(freq * 1.498, 1.0, 'triangle'); // 5ta Justa
    }
};

/* --- LÓGICA AFINADOR (Ejemplo Modular) --- */
const tunerApp = {
    init() {
        console.log("Afinador Iniciado");
        // Copiar lógica del afinador aquí...
    }
};ss