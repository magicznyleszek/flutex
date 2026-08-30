import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Music, Play, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';

// --- BAZA WIEDZY ---

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const INSTRUMENTS = {
  whistle_d: {
    name: "Tin Whistle (tonacja D)",
    hasThumb: false,
    fingering: {
      "D5": [1, 1, 1, 1, 1, 1], "E5": [1, 1, 1, 1, 1, 0], "F#5": [1, 1, 1, 1, 0, 0],
      "G5": [1, 1, 1, 0, 0, 0], "A5": [1, 1, 0, 0, 0, 0], "B5": [1, 0, 0, 0, 0, 0],
      "C6": [0, 1, 1, 0, 0, 0], "C#6": [0, 0, 0, 0, 0, 0], "D6": [0, 1, 1, 1, 1, 1],
    }
  },
  recorder: {
    name: "Flet prosty (Sopranowy)",
    hasThumb: true,
    fingering: {
      "C5": [1, 1, 1, 1, 1, 1, 1, 1], "D5": [1, 1, 1, 1, 1, 1, 1, 0],
      "E5": [1, 1, 1, 1, 1, 1, 0, 0], "F5": [1, 1, 1, 1, 1, 0, 1, 1],
      "F#5": [1, 1, 1, 1, 0, 1, 1, 0], "G5": [1, 1, 1, 1, 0, 0, 0, 0],
      "A5": [1, 1, 1, 0, 0, 0, 0, 0], "B5": [1, 1, 0, 0, 0, 0, 0, 0],
      "C6": [1, 0, 1, 0, 0, 0, 0, 0], "C#6": [0, 1, 1, 0, 0, 0, 0, 0],
      "D6": [0, 0, 1, 0, 0, 0, 0, 0],
    }
  }
};

const DIFFICULTY_LEVELS = {
  loose: { label: "Luźna (±50c)", tolerance: 50 },
  normal: { label: "Normalna (±25c)", tolerance: 25 },
  strict: { label: "Ścisła (±10c)", tolerance: 10 }
};

const PENALTY_MODES = {
  wait: "Czekaj (Brak kary)",
  back: "Cofnij o 3 nuty",
  restart: "Wróć do początku"
};

// Piosenka: The Shire / Concerning Hobbits
const SONG_HOBBIT = [
  "D5", "E5", "F#5", "A5", "G5", "F#5", "D5", 
  "E5", "F#5", "G5", "F#5", "E5", "D5", "D5", "A5", "B5", "A5"
];

// Pomocnicze funkcje muzyczne
const noteToMidi = (noteStr) => {
  const name = noteStr.slice(0, -1);
  const oct = parseInt(noteStr.slice(-1));
  return NOTE_STRINGS.indexOf(name) + (oct + 1) * 12;
};
const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// --- KOMPONENT WIZUALIZACJI FLETU ---
const FluteDiagram = ({ note, instrumentId }) => {
  const instrument = INSTRUMENTS[instrumentId];
  const holes = instrument.fingering[note];
  
  if (!holes) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 h-[340px]">
        <div className="text-rose-400 p-4 border border-rose-500/30 bg-rose-500/10 rounded-xl text-center">
          Dźwięk niedostępny na <br/>wybranym instrumencie.
        </div>
      </div>
    );
  }

  const hasThumb = instrument.hasThumb;
  const topHoles = hasThumb ? holes.slice(1) : holes;
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative bg-slate-800 border-2 border-slate-600 rounded-full w-16 h-80 flex flex-col items-center py-4 shadow-xl">
        {hasThumb && (
          <div className="absolute -left-6 top-6 flex items-center">
            <span className="text-xs text-slate-400 mr-2">Tył</span>
            <div className={`w-5 h-5 rounded-full border-2 border-slate-500 transition-colors duration-300 ${holes[0] ? 'bg-amber-400' : 'bg-slate-900'}`} />
          </div>
        )}
        {hasThumb && <div className="w-12 h-1 bg-slate-700 rounded-full mb-4"></div>}
        <div className={`flex flex-col w-full items-center z-10 ${hasThumb ? 'space-y-4' : 'space-y-6 mt-2'}`}>
          {topHoles.map((isClosed, index) => (
            <div key={index} className={`w-5 h-5 rounded-full border-2 border-slate-500 transition-colors duration-300 ${isClosed ? 'bg-emerald-400 border-emerald-500' : 'bg-slate-900'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- GŁÓWNA APLIKACJA ---
export default function App() {
  const [instrumentId, setInstrumentId] = useState(() => {
    return localStorage.getItem('fluteTrainer_instrument') || 'whistle_d';
  });
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem('fluteTrainer_difficulty') || 'normal';
  });
  const [penaltyMode, setPenaltyMode] = useState(() => {
    return localStorage.getItem('fluteTrainer_penalty') || 'wait';
  });
  const [isListening, setIsListening] = useState(false);

  // Zapis ustawień do localStorage przy każdej ich zmianie
  useEffect(() => {
    localStorage.setItem('fluteTrainer_instrument', instrumentId);
  }, [instrumentId]);

  useEffect(() => {
    localStorage.setItem('fluteTrainer_difficulty', difficulty);
  }, [difficulty]);
  
  useEffect(() => {
    localStorage.setItem('fluteTrainer_penalty', penaltyMode);
  }, [penaltyMode]);
  
  // Stany renderowania
  const [detectedNote, setDetectedNote] = useState('--');
  const [centsOff, setCentsOff] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0); 
  const [mistakeProgress, setMistakeProgress] = useState(0);
  const [songFinished, setSongFinished] = useState(false);
  const [inCooldown, setInCooldown] = useState(false); 

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  
  const gameState = useRef({
    targetNote: SONG_HOBBIT[0],
    matchFrames: 0,
    mistakeFrames: 0,
    requiredFrames: 15,
    cooldownFrames: 0 
  });

  const autoCorrelate = (buf, sampleRate) => {
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return -1; 

    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < size / 2; i++) if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }
    buf = buf.slice(r1, r2);
    size = buf.length;

    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    let t0 = maxpos;

    let x1 = c[t0 - 1], x2 = c[t0], x3 = c[t0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) t0 = t0 - b / (2 * a);

    return sampleRate / t0;
  };

  const detectLoop = () => {
    if (!analyserRef.current) return;

    const buffer = new Float32Array(2048);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const pitchInHz = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    const state = gameState.current;

    // Obsługa Cooldown (przerwa między zaliczeniami)
    if (state.cooldownFrames > 0) {
      state.cooldownFrames--;
      if (state.cooldownFrames === 0) setInCooldown(false);
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    let currentDetected = '--';
    let currentCentsOff = 0;

    if (pitchInHz > 450 && pitchInHz < 2500) {
      const noteNum = 12 * (Math.log(pitchInHz / 440) / Math.log(2));
      const midi = Math.round(noteNum) + 69;
      currentDetected = `${NOTE_STRINGS[midi % 12]}${Math.floor(midi / 12) - 1}`;
      
      const targetMidi = noteToMidi(state.targetNote);
      const targetFreq = midiToFreq(targetMidi);
      currentCentsOff = 1200 * Math.log2(pitchInHz / targetFreq);
    }

    setDetectedNote(currentDetected);
    setCentsOff(currentCentsOff);

    if (!songFinished) {
      const tolerance = DIFFICULTY_LEVELS[difficulty].tolerance;
      const isCorrectNote = currentDetected === state.targetNote;
      const isWithinTolerance = Math.abs(currentCentsOff) <= tolerance && isCorrectNote;

      if (isWithinTolerance) {
        state.matchFrames += 1;
        if (state.mistakeFrames > 0) state.mistakeFrames -= 1;
      } else if (currentDetected !== '--') {
        if (state.matchFrames > 0) state.matchFrames -= 0.5;
        state.mistakeFrames += 0.5; 
      } else {
        if (state.matchFrames > 0) state.matchFrames -= 0.5;
        if (state.mistakeFrames > 0) state.mistakeFrames -= 0.5;
      }

      setMatchProgress(Math.min(100, Math.max(0, (state.matchFrames / state.requiredFrames) * 100)));
      setMistakeProgress(Math.min(100, Math.max(0, (state.mistakeFrames / (state.requiredFrames * 2)) * 100)));

      if (state.matchFrames >= state.requiredFrames) {
        handleNoteHit();
      } else if (state.mistakeFrames >= state.requiredFrames * 2) { 
        handleMistake();
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  };

  const handleNoteHit = () => {
    setMatchProgress(0);
    setMistakeProgress(0);
    setInCooldown(true);
    
    gameState.current.matchFrames = 0;
    gameState.current.mistakeFrames = 0;
    gameState.current.cooldownFrames = 20; 
    
    setCurrentNoteIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= SONG_HOBBIT.length) {
        setSongFinished(true);
        return prev;
      }
      gameState.current.targetNote = SONG_HOBBIT[nextIndex];
      return nextIndex;
    });
  };

  const handleMistake = () => {
    setMatchProgress(0);
    setMistakeProgress(0);
    gameState.current.matchFrames = 0;
    gameState.current.mistakeFrames = 0;

    if (penaltyMode === 'wait') return; 

    setInCooldown(true);
    gameState.current.cooldownFrames = 30; 

    setCurrentNoteIndex(prev => {
      let nextIndex = prev;
      if (penaltyMode === 'back') {
        nextIndex = Math.max(0, prev - 3);
      } else if (penaltyMode === 'restart') {
        nextIndex = 0;
      }
      gameState.current.targetNote = SONG_HOBBIT[nextIndex];
      return nextIndex;
    });
  };

  const toggleMic = async () => {
    if (isListening) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) await audioCtxRef.current.close();
      setIsListening(false);
      setDetectedNote('--');
      setCentsOff(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        setIsListening(true);
        if (songFinished) resetSong();
        detectLoop();
      } catch (err) {
        alert('Brak dostępu do mikrofonu. Upewnij się, że przeglądarka ma uprawnienia.');
      }
    }
  };

  const resetSong = () => {
    setCurrentNoteIndex(0);
    setSongFinished(false);
    setMatchProgress(0);
    setMistakeProgress(0);
    setInCooldown(false);
    gameState.current.targetNote = SONG_HOBBIT[0];
    gameState.current.matchFrames = 0;
    gameState.current.mistakeFrames = 0;
    gameState.current.cooldownFrames = 0;
  };

  const targetNote = SONG_HOBBIT[currentNoteIndex];
  const prevNote = currentNoteIndex > 0 ? SONG_HOBBIT[currentNoteIndex - 1] : null;
  const nextNote = currentNoteIndex < SONG_HOBBIT.length - 1 ? SONG_HOBBIT[currentNoteIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans">
      
      {/* HEADER Z WYBOREM OPCJI */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mb-8 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Music className="w-10 h-10 text-emerald-400" />
          <h1 className="text-3xl font-bold">Mistrz Fletu</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-wrap justify-end">
          <div className="flex items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wide mr-2">Instrument:</span>
            <select value={instrumentId} onChange={(e) => { setInstrumentId(e.target.value); resetSong(); }} className="bg-slate-800 text-emerald-400 text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer">
              {Object.entries(INSTRUMENTS).map(([id, data]) => <option key={id} value={id}>{data.name}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wide mr-2">Dokładność:</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-slate-800 text-amber-400 text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer">
              {Object.entries(DIFFICULTY_LEVELS).map(([id, data]) => <option key={id} value={id}>{data.label}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-slate-900 p-2 rounded-xl border border-slate-800 mt-2 sm:mt-0">
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wide mr-2">Przy błędzie:</span>
            <select value={penaltyMode} onChange={(e) => setPenaltyMode(e.target.value)} className="bg-slate-800 text-rose-400 text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer">
              {Object.entries(PENALTY_MODES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEWA KOLUMNA - Cel i Flet */}
        <div className={`bg-slate-900 rounded-3xl p-8 border ${mistakeProgress > 80 ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-slate-800 shadow-2xl'} flex flex-col items-center relative overflow-hidden transition-all duration-300`}>
          {songFinished && (
            <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-4" />
              <h2 className="text-3xl font-bold mb-4">Utwór zaliczony!</h2>
              <button onClick={resetSong} className="px-6 py-3 bg-emerald-500 text-slate-900 font-bold rounded-xl hover:bg-emerald-400">Graj ponownie</button>
            </div>
          )}

          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-slate-400 uppercase tracking-widest text-sm font-bold">Sekwencja Dźwięków</h2>
            <button 
              onClick={resetSong} 
              title="Wróć do początku utworu"
              className="flex items-center text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Od nowa
            </button>
          </div>
          
          {/* Wyraźne 3 kółka obok siebie (Poprzedni -> Aktualny -> Następny) */}
          <div className="flex items-center justify-center space-x-3 mb-6 w-full px-4">
            <div className="flex flex-col items-center w-1/3 opacity-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold mb-1">Poprzedni</span>
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-400 text-sm">{prevNote || '-'}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex flex-col items-center w-1/3">
              <span className="text-xs uppercase text-amber-400 font-bold mb-1">Cel</span>
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-colors ${inCooldown ? 'bg-emerald-500 border-emerald-400 text-slate-900' : 'bg-amber-400 border-amber-300 text-slate-900'}`}>
                {targetNote}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex flex-col items-center w-1/3 opacity-50">
              <span className="text-[10px] uppercase text-slate-500 font-bold mb-1">Następny</span>
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-400 text-sm">{nextNote || '-'}</div>
            </div>
          </div>

          <FluteDiagram note={targetNote} instrumentId={instrumentId} />

          {/* Pasek postępu trafienia i błędu */}
          <div className="w-full space-y-2 mt-8">
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
               {inCooldown && <div className="absolute inset-0 bg-emerald-500/50 flex items-center justify-center"><span className="text-[10px] font-bold text-slate-900">ODDECH...</span></div>}
              <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${matchProgress}%` }}></div>
            </div>
            
            {/* Pasek narastającego błędu */}
            {penaltyMode !== 'wait' && (
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative opacity-70">
                <div className="h-full bg-rose-500 transition-all duration-75" style={{ width: `${mistakeProgress}%` }}></div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center min-h-[1.5rem]">
            {inCooldown 
              ? "Przerwij na chwilę dźwięk!" 
              : (mistakeProgress > 50 ? <span className="text-rose-400">Grasz zły dźwięk!</span> : "Utrzymaj idealny dźwięk by przejść dalej")
            }
          </p>
        </div>

        {/* PRAWA KOLUMNA - Status i Mikrofon */}
        <div className="flex flex-col space-y-8">
          
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col items-center justify-center h-full">
            <h2 className="text-slate-400 uppercase tracking-widest text-sm font-bold mb-6">Wykrywany dźwięk</h2>
            
            <div className={`text-8xl font-black mb-6 transition-colors duration-200 ${
              detectedNote === targetNote && Math.abs(centsOff) <= DIFFICULTY_LEVELS[difficulty].tolerance 
              ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
              : 'text-slate-500'
            }`}>
              {detectedNote}
            </div>
            
            {/* WIZUALNY TUNER - Skala Centów */}
            <div className="w-full mb-8">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 px-1 uppercase">
                <span>Za nisko</span>
                <span>Idealnie</span>
                <span>Za wysoko</span>
              </div>
              <div className="relative w-full h-4 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
                {/* Strefa sukcesu bazująca na trudności */}
                <div className="absolute top-0 bottom-0 bg-emerald-900/50" style={{ 
                  left: `calc(50% - ${(DIFFICULTY_LEVELS[difficulty].tolerance / 100) * 50}%)`, 
                  width: `${DIFFICULTY_LEVELS[difficulty].tolerance}%` 
                }}></div>
                {/* Środek */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 transform -translate-x-1/2"></div>
                {/* Igła Tunera */}
                <div 
                  className="absolute top-0 bottom-0 w-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] transition-all duration-75"
                  style={{ 
                    left: `calc(50% + ${Math.max(-48, Math.min(48, centsOff))}%)`,
                    transform: 'translateX(-50%)',
                    opacity: detectedNote === '--' ? 0 : 1
                  }}
                ></div>
              </div>
              <div className="text-center mt-2 text-xs text-slate-500 font-mono">
                {detectedNote !== '--' ? `${centsOff > 0 ? '+' : ''}${centsOff.toFixed(1)} c` : 'Cisza...'}
              </div>
            </div>
            
            <button
              onClick={toggleMic}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 text-lg font-bold transition-all ${
                isListening 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' 
                  : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isListening ? (
                <><MicOff className="w-6 h-6" /><span>Przerwij nasłuchiwanie</span></>
              ) : (
                <><Play className="w-6 h-6" /><span>Zacznij grać utwór</span></>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}