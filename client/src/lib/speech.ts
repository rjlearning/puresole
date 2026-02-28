
let currentUtterance: SpeechSynthesisUtterance | null = null;

export type SpeechState = 'idle' | 'speaking' | 'paused';
let _state: SpeechState = 'idle';

// Listeners that components can subscribe to for state changes
const listeners: Array<(s: SpeechState) => void> = [];

function setState(s: SpeechState) {
  _state = s;
  listeners.forEach(fn => fn(s));
}

export function getSpeechState(): SpeechState {
  return _state;
}

export function onSpeechStateChange(fn: (s: SpeechState) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Speak text using the browser's Web Speech API (speechSynthesis).
 * Optimised for soft, slow, calming bedtime narration.
 */
export const speakProfoundly = (text: string, onEnd?: () => void): Promise<void> => {
  return new Promise((resolve) => {
    cancelSpeech();

    if (!('speechSynthesis' in window)) {
      console.warn('speechSynthesis not supported in this browser');
      if (onEnd) onEnd();
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;
      // Prefer warm, natural-sounding English voices
      const preferred = [
        'Samantha',          // macOS — warm and natural
        'Karen',             // macOS AU
        'Moira',             // macOS IE
        'Google UK English Female',
        'Microsoft Aria Online (Natural)',
        'Google US English',
      ];
      for (const name of preferred) {
        const v = voices.find(v => v.name === name);
        if (v) return v;
      }
      return voices.find(v => v.lang.startsWith('en') && /female|samantha|karen|aria|alice|vicki|victoria|susan|serena/i.test(v.name))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];
    };

    const applyVoiceAndSpeak = () => {
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      // Ultra-soft, slow, calming narration settings
      utterance.rate = 0.70;   // Very slow — meditative pace
      utterance.pitch = 0.85;  // Lower pitch — soothing, not high-pitched
      utterance.volume = 0.85; // Slightly reduced for a gentle feel
      utterance.lang = 'en-US';

      utterance.onstart = () => setState('speaking');

      utterance.onpause = () => setState('paused');

      utterance.onresume = () => setState('speaking');

      utterance.onend = () => {
        currentUtterance = null;
        setState('idle');
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        // 'interrupted' is fired when the user pauses/stops - not a real error
        if (e.error === 'interrupted') return;
        console.error('SpeechSynthesis error:', e.error);
        currentUtterance = null;
        setState('idle');
        if (onEnd) onEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      applyVoiceAndSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', applyVoiceAndSpeak, { once: true });
      setTimeout(() => {
        if (currentUtterance === utterance) applyVoiceAndSpeak();
      }, 600);
    }
  });
};

export const pauseSpeech = () => {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    setState('paused');
  }
};

export const resumeSpeech = () => {
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setState('speaking');
  }
};

export const cancelSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
  setState('idle');
};
