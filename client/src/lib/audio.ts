// Programmatic audio generation using the Web Audio API
let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

export const playChime = () => {
  const ctx = initAudio();
  if (!ctx) return;

  // Resume context if suspended (needed for some browsers that require user interaction)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create oscillator and gain node
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  // Connect the nodes: oscillator -> gain -> destination (speakers)
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Configure sound: Zen chime/bowl
  osc.type = 'sine'; // Smooth, pure tone
  osc.frequency.setValueAtTime(432, ctx.currentTime); // 432 Hz - often associated with healing/calmness
  osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 3); // slight downward bend

  // Configure envelope (volume arc)
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  // Quick attack
  gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
  // Long, slow release (fade out)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);

  // Play the sound
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 4.5);
};

export const playDoubleChime = () => {
  const ctx = initAudio();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const playSingleTap = (delay: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Higher pitch, shorter duration tap
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + delay + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.6);
  };

  playSingleTap(0);
  playSingleTap(0.3); // Play second tap 300ms later
};

/**
 * INHALE tone — a slow, rising sweep from 220 Hz to 440 Hz over ~1.5s.
 * Brain interprets rising pitch as "expand / breathe in".
 */
export const playInhaleTone = () => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2);
};

/**
 * HOLD tone — a short, warm single ping at neutral pitch (330 Hz).
 * Signals "stay still / hold what you have".
 */
export const playHoldTone = () => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, ctx.currentTime);
  // Slight harmonic overtone gives a "bowl" quality
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(660, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

  gain2.gain.setValueAtTime(0, ctx.currentTime);
  gain2.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.4);
  osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 1);
};

/**
 * EXHALE tone — a smooth, falling slide from 440 Hz to 220 Hz over ~1.5s.
 * Brain interprets falling pitch as "release / let go / breathe out".
 */
export const playExhaleTone = () => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.5);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2.2);
};

/**
 * WHOOSH tone — turbulent filtered noise that mimics the audible exhale through the mouth.
 * Used specifically for the 4-7-8 technique's 8-count exhale.
 */
export const playWhooshTone = () => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  // White noise buffer
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass filter to shape noise into a breath-like whoosh
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.5);
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.18, ctx.currentTime + 1.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + 2.1);
};

// Generative Ambient Drone State
let droneOscillators: OscillatorNode[] = [];
let droneGainNodes: GainNode[] = [];
let droneLFOs: OscillatorNode[] = [];
let droneTimeouts: NodeJS.Timeout[] = [];
let isDronePlaying = false;

export const startBinauralDrone = (baseFreq: number = 174, spread: number = 0.5) => {
  if (isDronePlaying) return;

  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  isDronePlaying = true;

  // Master gain for the drone
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Fade in very slowly (10 seconds)
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 10); // Keep overall volume very low (5%)

  // Create a complex chord/drone using multiple sine waves
  const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2]; // e.g. Solfeggio 174Hz (healing) + harmonics

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    // The main oscillator
    osc.type = 'sine';
    // Slightly detune the left and right by changing frequency very slightly to create binaural beats
    osc.frequency.value = freq + (index * spread);

    // The LFO (Low-Frequency Oscillator) to create the slow "breathing" swell
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + (Math.random() * 0.02); // Very slow cycle (every 20 seconds)

    // Connect LFO to the oscillator's gain to modulate volume
    lfo.connect(lfoGain);
    // Base volume + LFO modulation
    lfoGain.connect(oscGain.gain);
    lfoGain.gain.value = 0.3; // Depth of the swell

    osc.connect(oscGain);

    // Simple stereo panning: alternate left and right
    const panner = ctx.createStereoPanner();
    panner.pan.value = index % 2 === 0 ? -0.4 : 0.4;

    oscGain.connect(panner);
    panner.connect(masterGain);

    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    droneOscillators.push(osc);
    droneGainNodes.push(oscGain, masterGain); // Keep track of master to fade out later
    droneLFOs.push(lfo);
  });

  // Melodic elements (pentatonic scale based on baseFreq)
  const pentatonicRatios = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

  const playMelodyNote = () => {
    if (!isDronePlaying || !ctx) return;

    // Clean up finished timeouts from array
    droneTimeouts = droneTimeouts.filter(t => t as any !== setTimeout); // Hacky clean, not perfect, but we just clear all on stop

    const ratio = pentatonicRatios[Math.floor(Math.random() * pentatonicRatios.length)];
    const octave = Math.random() > 0.5 ? 2 : 4; // Higher octaves for a twinkling/chime melody effect
    const noteFreq = baseFreq * ratio * octave;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = noteFreq;

    osc.connect(gain);

    const panner = ctx.createStereoPanner();
    panner.pan.value = (Math.random() * 0.8) - 0.4; // Random panning
    gain.connect(panner);
    panner.connect(masterGain);

    // Envelope for a gentle, bell-like melodic note
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5); // Soft, slow attack
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 7); // Long, echoing release

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 7.5);

    // Schedule next note randomly between 3 to 8 seconds
    const nextTime = Math.random() * 5000 + 3000;
    const timeout = setTimeout(playMelodyNote, nextTime);
    droneTimeouts.push(timeout);
  };

  // Start the generative melody after the drone fades in
  const initialTimeout = setTimeout(playMelodyNote, 6000);
  droneTimeouts.push(initialTimeout);
};

export const stopBinauralDrone = () => {
  if (!isDronePlaying) return;

  const ctx = initAudio();
  if (!ctx) return;

  isDronePlaying = false;

  // We find the master gain (the last one pushed or tracked)
  // To keep it simple, we just fade out all gain nodes we created for the drone
  const now = ctx.currentTime;

  droneGainNodes.forEach(gainNode => {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 3); // 3 second fade out
  });

  // Stop oscillators after fade out
  setTimeout(() => {
    droneOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { }
      osc.disconnect();
    });
    droneLFOs.forEach(lfo => {
      try { lfo.stop(); } catch (e) { }
      lfo.disconnect();
    });

    // Clear timeouts
    droneTimeouts.forEach(clearTimeout);

    // Clear arrays
    droneOscillators = [];
    droneGainNodes = [];
    droneLFOs = [];
    droneTimeouts = [];
  }, 4000);
};

// ── Breathing Exercise Ambient Music ─────────────────────────────────────────
// Peaceful synthesized ambient pad — no WAV files needed.
// Mimics the soft, evolving background music in guided breathing videos.

type BreathAmbientState = {
  nodes: AudioNode[];
  oscs: OscillatorNode[];
  gains: GainNode[];
  master: GainNode | null;
  timeouts: ReturnType<typeof setTimeout>[];
  active: boolean;
};

const bState: BreathAmbientState = { nodes: [], oscs: [], gains: [], master: null, timeouts: [], active: false };

/** Play a soft ambient count tick — very subtle, just a light percussive touch */
export const playCountTick = (countNum: number, totalCounts: number) => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Slight pitch increase per count gives a sense of progression
  const baseFreq = 520 + countNum * 12;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.015, ctx.currentTime + 0.06);

  // Last count of each phase is slightly louder
  const vol = countNum === totalCounts ? 0.12 : 0.07;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
};

export const startBreathingAmbient = () => {
  if (bState.active) return;
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  bState.active = true;

  // Master gain — fade in softly
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4);
  master.connect(ctx.destination);
  bState.master = master;

  // ── Chord pad: Cmaj7 spread across 3 octaves ──
  // Frequencies: C3, E3, G3, B3, C4 (peaceful, open)
  const chordFreqs = [130.81, 164.81, 196.00, 246.94, 261.63, 329.63];
  chordFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Very slow LFO swell on each note
    lfo.type = 'sine';
    lfo.frequency.value = 0.04 + i * 0.006;
    lfo.connect(lg);
    lg.gain.value = 0.04;
    lg.connect(g.gain);

    g.gain.value = 0.06;
    osc.connect(g);
    g.connect(master);

    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);

    bState.oscs.push(osc, lfo);
    bState.gains.push(g, lg);
  });

  // ── Warm sub bass pulse — very slow, barely perceptible ──
  const bass = ctx.createOscillator();
  const bassG = ctx.createGain();
  const bassLfo = ctx.createOscillator();
  const bassLg = ctx.createGain();

  bass.type = 'sine';
  bass.frequency.value = 65.41; // C2
  bassLfo.type = 'sine';
  bassLfo.frequency.value = 0.025; // one cycle every 40 sec
  bassLfo.connect(bassLg);
  bassLg.gain.value = 0.03;
  bassLg.connect(bassG.gain);
  bassG.gain.value = 0.04;

  bass.connect(bassG);
  bassG.connect(master);
  bass.start(ctx.currentTime);
  bassLfo.start(ctx.currentTime);
  bState.oscs.push(bass, bassLfo);
  bState.gains.push(bassG, bassLg);

  // ── Occasional high sparkle tones ──
  const sparkleFreqs = [1047, 1175, 1319, 1397]; // C6, D6, E6, F6
  const scheduleSparkle = () => {
    if (!bState.active || !ctx) return;
    const freq = sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(master);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 4.5);

    const next = 4000 + Math.random() * 5000;
    bState.timeouts.push(setTimeout(scheduleSparkle, next));
  };
  bState.timeouts.push(setTimeout(scheduleSparkle, 5000));
};

export const stopBreathingAmbient = () => {
  if (!bState.active) return;
  bState.active = false;

  const ctx = initAudio();
  if (ctx && bState.master) {
    const now = ctx.currentTime;
    bState.master.gain.cancelScheduledValues(now);
    bState.master.gain.setValueAtTime(bState.master.gain.value, now);
    bState.master.gain.linearRampToValueAtTime(0, now + 3);
  }

  bState.timeouts.forEach(clearTimeout);
  bState.timeouts = [];

  setTimeout(() => {
    bState.oscs.forEach(o => { try { o.stop(); } catch { } o.disconnect(); });
    bState.gains.forEach(g => g.disconnect());
    bState.master?.disconnect();
    bState.oscs = [];
    bState.gains = [];
    bState.master = null;
  }, 3500);
};

