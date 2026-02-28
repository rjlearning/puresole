/**
 * Programmatic audio generation for PureSoul melodies
 * Uses Web Audio API-compatible PCM generation to create genuine WAV files.
 * Runs with Node.js — no external dependencies required.
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'client', 'public', 'sounds');
const SAMPLE_RATE = 44100;
const DURATION = 30; // 30 seconds per loop
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

/**
 * Write PCM samples as a proper WAV file
 */
function writeWav(filename, samples) {
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = SAMPLE_RATE * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = samples.length * blockAlign;

    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk1 size (PCM)
    buffer.writeUInt16LE(1, 20);  // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
    }
    writeFileSync(join(OUTPUT_DIR, filename), buffer);
    console.log(`✓ Generated ${filename} (${dataSize} bytes)`);
}

/**
 * Generate a gentle piano-like tone: series of overlapping sine waves with slow attack/decay
 */
function generatePiano() {
    const samples = new Float32Array(NUM_SAMPLES);
    // Pentatonic melody notes (frequencies) timed so they overlap nicely
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 349.23, 293.66];
    const noteDuration = (DURATION / notes.length) * SAMPLE_RATE;
    const attackTime = SAMPLE_RATE * 0.3;
    const decayTime = SAMPLE_RATE * 2.0;
    const releaseTime = SAMPLE_RATE * 1.0;

    notes.forEach((freq, ni) => {
        const start = Math.floor(ni * noteDuration);
        for (let i = 0; i < noteDuration + releaseTime; i++) {
            const idx = start + i;
            if (idx >= NUM_SAMPLES) break;

            // Plain sine wave
            const wave = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
            // Add slight harmonic (octave + fifth)
            const harm2 = 0.3 * Math.sin(2 * Math.PI * freq * 2 * i / SAMPLE_RATE);
            const harm3 = 0.15 * Math.sin(2 * Math.PI * freq * 3 * i / SAMPLE_RATE);

            // Envelope
            let env;
            if (i < attackTime) {
                env = i / attackTime;
            } else if (i < attackTime + decayTime) {
                env = 1 - ((i - attackTime) / decayTime) * 0.6; // decay to 0.4
            } else if (i < noteDuration) {
                env = 0.4;
            } else {
                env = 0.4 * (1 - (i - noteDuration) / releaseTime);
            }

            samples[idx] += (wave + harm2 + harm3) * env * 0.25;
        }
    });
    return samples;
}

/**
 * Generate an ethereal synth sound: slow-moving filtered noise + sine drones
 */
function generateSynth() {
    const samples = new Float32Array(NUM_SAMPLES);
    const droneFreqs = [55, 82.5, 110, 165]; // A1 + harmonics

    for (let i = 0; i < NUM_SAMPLES; i++) {
        const t = i / SAMPLE_RATE;
        let s = 0;

        // Drone layers with very slow LFO
        for (const freq of droneFreqs) {
            const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.08 * t);
            s += 0.15 * lfo * Math.sin(2 * Math.PI * freq * t);
        }

        // Very gentle pink-noise-like layer
        const noise = (Math.random() * 2 - 1) * 0.04;
        // Simple LP filter approximation: blend previous sample
        samples[i] = (i > 0 ? samples[i - 1] * 0.6 : 0) + noise * 0.4;
        samples[i] = s + samples[i] * 0.3;
    }

    // Global fade in/out
    const fade = SAMPLE_RATE * 2;
    for (let i = 0; i < fade; i++) {
        samples[i] *= i / fade;
        samples[NUM_SAMPLES - 1 - i] *= i / fade;
    }
    return samples;
}

/**
 * Generate binaural-style drone: two slightly detuned sine waves
 */
function generateBinaural() {
    const samples = new Float32Array(NUM_SAMPLES);
    const baseFreq = 174; // Solfeggio "healing" frequency
    const beatFreq = 4;   // Delta brainwave: ~4Hz difference between ears
    // In mono we approximate with amplitude modulation

    for (let i = 0; i < NUM_SAMPLES; i++) {
        const t = i / SAMPLE_RATE;

        // Left channel approximation: base freq
        const left = Math.sin(2 * Math.PI * baseFreq * t);
        // Right channel approximation: base + beat freq
        const right = Math.sin(2 * Math.PI * (baseFreq + beatFreq) * t);
        // Mono mix with slow amplitude modulation to simulate binaural beating
        const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * (beatFreq / 2) * t);

        // Add harmonics
        const harm = 0.2 * Math.sin(2 * Math.PI * baseFreq * 2 * t);

        samples[i] = (left * am + right * (1 - am) + harm) * 0.25;
    }

    // Apply slow fade in/out
    const fade = SAMPLE_RATE * 3;
    for (let i = 0; i < fade; i++) {
        samples[i] *= i / fade;
        samples[NUM_SAMPLES - 1 - i] *= i / fade;
    }
    return samples;
}

/**
 * Generate wind chimes: randomized bell-like tones
 */
function generateChimes() {
    const samples = new Float32Array(NUM_SAMPLES);
    // Pentatonic scale frequencies (metallic-like, higher pitched)
    const chimeFreqs = [659.25, 783.99, 880.00, 987.77, 1046.5, 1174.66];

    for (let chime = 0; chime < 60; chime++) {
        const startSample = Math.floor(Math.random() * NUM_SAMPLES * 0.95);
        const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
        const maxDuration = SAMPLE_RATE * 2.5;

        for (let j = 0; j < maxDuration; j++) {
            const idx = startSample + j;
            if (idx >= NUM_SAMPLES) break;

            // Metallic sine + weak high harmonics
            const wave = Math.sin(2 * Math.PI * freq * j / SAMPLE_RATE);
            const harm2 = 0.4 * Math.sin(2 * Math.PI * freq * 2.756 * j / SAMPLE_RATE); // inharmonic!
            const harm3 = 0.2 * Math.sin(2 * Math.PI * freq * 5.404 * j / SAMPLE_RATE);

            // Exponential decay (bell characteristic: quick attack, slow ring)
            const env = Math.exp(-j / (SAMPLE_RATE * 0.9));

            samples[idx] += (wave + harm2 + harm3) * env * 0.15;
        }
    }
    return samples;
}

/**
 * Generate a singing bowl sound: rich fundamental + harmonic ring
 */
function generateBowl() {
    const samples = new Float32Array(NUM_SAMPLES);
    // Tibetan bowl fundamental (high C)
    const fundamental = 256;
    const strikes = 4; // Strike the bowl 4 times through the clip
    const strikePeriod = NUM_SAMPLES / strikes;

    for (let strike = 0; strike < strikes; strike++) {
        const startSample = Math.floor(strike * strikePeriod);

        for (let j = 0; j < strikePeriod * 1.5; j++) {
            const idx = startSample + j;
            if (idx >= NUM_SAMPLES) break;

            const wave = Math.sin(2 * Math.PI * fundamental * j / SAMPLE_RATE);
            const harm2 = 0.5 * Math.sin(2 * Math.PI * fundamental * 2.756 * j / SAMPLE_RATE);
            const harm3 = 0.3 * Math.sin(2 * Math.PI * fundamental * 5.404 * j / SAMPLE_RATE);
            const harm4 = 0.15 * Math.sin(2 * Math.PI * fundamental * 8.933 * j / SAMPLE_RATE);

            // Bowl has slow attack and very long ring
            const attackTime = SAMPLE_RATE * 0.05;
            const attackEnv = Math.min(1, j / attackTime);
            const decayTime = strikePeriod * 1.2;
            const decayEnv = Math.exp(-j / (decayTime * 0.55));

            samples[idx] += (wave + harm2 + harm3 + harm4) * attackEnv * decayEnv * 0.2;
        }
    }
    return samples;
}

// Generate all 5 melody files
console.log('🎵 Generating melody audio files...\n');
writeWav('piano.wav', generatePiano());
writeWav('synth.wav', generateSynth());
writeWav('binaural.wav', generateBinaural());
writeWav('chimes.wav', generateChimes());
writeWav('bowl.wav', generateBowl());
console.log('\n✅ All melodies generated successfully!');
