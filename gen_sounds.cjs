const fs = require('fs');

function generateWav(filename, generateSample) {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const duration = 20; // 20 seconds loop
    const numSamples = sampleRate * duration;

    const buffer = Buffer.alloc(44 + numSamples * 2);
    // write WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * 2, 28);
    buffer.writeUInt16LE(numChannels * 2, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
        let sample = generateSample(i, sampleRate);
        // clamp
        if (isNaN(sample)) sample = 0;
        sample = Math.max(-1, Math.min(1, sample));
        const val = sample < 0 ? sample * 32768 : sample * 32767;
        buffer.writeInt16LE(Math.round(val), 44 + i * 2);
    }

    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename}`);
}

// 1. White noise
generateWav('client/public/sounds/whitenoise.wav', () => Math.random() * 2 - 1);

// 2. Fire (Brown noise + random pops)
let fireLastOut = 0;
generateWav('client/public/sounds/fire.wav', () => {
    let white = Math.random() * 2 - 1;
    // brown noise approximation
    fireLastOut = (fireLastOut + (0.02 * white)) / 1.02;
    let out = fireLastOut * 3.5;

    // crackle
    if (Math.random() < 0.005) {
        out += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.3 + 0.3);
    }
    return out * 0.5;
});

// 3. Wind (Filtered noise with slow amplitude modulation)
let windLastOut = 0;
generateWav('client/public/sounds/wind.wav', (i, sr) => {
    let white = Math.random() * 2 - 1;
    windLastOut = (windLastOut + (0.03 * white)) / 1.03;
    let mod = Math.sin(i / sr * Math.PI * 0.1) * 0.5 + 0.5;
    return windLastOut * 2.5 * mod * 0.8;
});

// 4. Forest Night (Ambient noise + crickets)
let forestLastOut = 0;
generateWav('client/public/sounds/forest.wav', (i, sr) => {
    let white = Math.random() * 2 - 1;
    forestLastOut = (forestLastOut + (0.01 * white)) / 1.01;

    // Crickets chirp rhythm
    // Two fast chirps per second
    let chirpEnv = Math.sin(i / sr * Math.PI * 8) > 0.8 ? 1 : 0;
    // High frequency tone (around 4.5kHz)
    let highTone = Math.sin(i * 0.65);

    let ambient = forestLastOut * 0.5;
    let crickets = chirpEnv * highTone * 0.15;

    return ambient + crickets;
});
