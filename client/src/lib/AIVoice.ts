
export type AIVoiceState = 'idle' | 'generating' | 'playing' | 'paused';
export type AIVoiceType = 'nova' | 'onyx' | 'alloy' | 'fable' | 'shimmer' | 'echo';

let audioContext: AudioContext | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;
let currentAudioBuffer: AudioBuffer | null = null;
let startTime = 0;
let pausedAt = 0;
let _state: AIVoiceState = 'idle';
let currentOnEnd: (() => void) | null = null;

const listeners: Array<(s: AIVoiceState) => void> = [];

function setState(s: AIVoiceState) {
    _state = s;
    listeners.forEach(fn => fn(s));
}

export function getAIVoiceState(): AIVoiceState {
    return _state;
}

export function onAIVoiceStateChange(fn: (s: AIVoiceState) => void): () => void {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
    };
}

export function initAIVoice() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => { });
    }
}

export async function speakWithAIVoice(text: string, voice: AIVoiceType = 'nova', onEnd?: () => void): Promise<void> {
    stopAIVoice();
    setState('generating');
    currentOnEnd = onEnd || null;

    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice })
        });

        if (!response.ok) throw new Error("Failed to fetch AI voice");

        const arrayBuffer = await response.arrayBuffer();

        initAIVoice(); // Ensure context is ready and resumed

        if (audioContext) {
            currentAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            playFrom(0);
        }

    } catch (error) {
        console.error("AIVoice error:", error);
        setState('idle');
        if (currentOnEnd) currentOnEnd();
    }
}

function playFrom(offset: number) {
    if (!audioContext || !currentAudioBuffer) return;

    stopSource();

    currentBufferSource = audioContext.createBufferSource();
    currentBufferSource.buffer = currentAudioBuffer;
    currentBufferSource.connect(audioContext.destination);

    currentBufferSource.onended = () => {
        if (_state === 'playing') {
            setState('idle');
            if (currentOnEnd) currentOnEnd();
        }
    };

    startTime = audioContext.currentTime - offset;
    currentBufferSource.start(0, offset);
    setState('playing');
}

function stopSource() {
    if (currentBufferSource) {
        try {
            // Clear onended explicitly so standard stops/pauses don't trigger the idle state reset
            currentBufferSource.onended = null;
            currentBufferSource.stop();
        } catch (e) { }
        currentBufferSource.disconnect();
        currentBufferSource = null;
    }
}

export function pauseAIVoice() {
    if (_state === 'playing' && audioContext) {
        pausedAt = audioContext.currentTime - startTime;
        stopSource();
        setState('paused');
    }
}

export function resumeAIVoice() {
    if (_state === 'paused') {
        playFrom(pausedAt);
    }
}

export function stopAIVoice() {
    stopSource();
    currentAudioBuffer = null;
    pausedAt = 0;
    setState('idle');
}

export function seekForward(amount = 15) {
    if (_state === 'playing' && audioContext && currentAudioBuffer) {
        const currentOffset = audioContext.currentTime - startTime;
        let newOffset = currentOffset + amount;
        if (newOffset >= currentAudioBuffer.duration) {
            stopAIVoice();
        } else {
            playFrom(newOffset);
        }
    } else if (_state === 'paused') {
        pausedAt += amount;
        if (currentAudioBuffer && pausedAt >= currentAudioBuffer.duration) {
            stopAIVoice();
        }
    }
}

export function seekBackward(amount = 15) {
    if (_state === 'playing' && audioContext) {
        let currentOffset = audioContext.currentTime - startTime;
        let newOffset = Math.max(0, currentOffset - amount);
        playFrom(newOffset);
    } else if (_state === 'paused') {
        pausedAt = Math.max(0, pausedAt - amount);
    }
}
