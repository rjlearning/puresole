import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  Moon,
  Cloud,
  CloudRain,
  Waves,
  Wind,
  TreePine,
  Flame,
  Music,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Timer,
  X,
  BookOpen,
  Sparkles,
  Loader2,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import MainNavigation from '@/components/MainNavigation';
import {
  speakWithAIVoice,
  stopAIVoice,
  pauseAIVoice,
  resumeAIVoice,
  getAIVoiceState,
  onAIVoiceStateChange,
  seekForward,
  seekBackward,
  initAIVoice,
  type AIVoiceState,
  type AIVoiceType
} from '@/lib/AIVoice';
import { AmbientMixer } from '@/components/audio/AmbientMixer';

interface SleepStory {
  id: string;
  title: string;
  duration: string;
  narrator: string;
  voice: AIVoiceType;
  description: string;
  coverEmoji: string;
  suggestedSound: string;
}

const sleepStories: SleepStory[] = [
  {
    id: '1',
    title: 'The Enchanted Garden',
    duration: '3-4 min',
    narrator: 'Nova (Warm)',
    voice: 'nova',
    description: 'A deeply personalized journey through a magical moonlit garden',
    coverEmoji: '🌙',
    suggestedSound: 'forest'
  },
  {
    id: '2',
    title: 'Ocean Dreams',
    duration: '3-4 min',
    narrator: 'Onyx (Deep)',
    voice: 'onyx',
    description: 'Drift away on gentle waves under starlit skies built just for you',
    coverEmoji: '🌊',
    suggestedSound: 'ocean'
  },
  {
    id: '3',
    title: 'Mountain Serenity',
    duration: '3-4 min',
    narrator: 'Alloy (Balanced)',
    voice: 'alloy',
    description: 'Find peace in a cozy cabin nestled in snowy peaks',
    coverEmoji: '🏔️',
    suggestedSound: 'wind'
  },
  {
    id: '4',
    title: 'Starlight Journey',
    duration: '3-4 min',
    narrator: 'Shimmer (Soft)',
    voice: 'shimmer',
    description: 'Float through the cosmos on a bed of clouds as you release your worries',
    coverEmoji: '✨',
    suggestedSound: 'whitenoise'
  },
];

export default function SleepPage() {
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<'sounds' | 'stories'>('sounds');

  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [activeStoryTitle, setActiveStoryTitle] = useState<string>('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [speechState, setSpeechState] = useState<AIVoiceState>(() => getAIVoiceState());

  // Subscribe to speech state changes so UI stays in sync
  useEffect(() => {
    const unsub = onAIVoiceStateChange(setSpeechState);
    return unsub;
  }, []);

  const handleStopStory = () => {
    stopAIVoice();
    setActiveStory(null);
    setActiveStoryTitle('');
    setIsGeneratingStory(false);
  };

  const handlePauseResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speechState === 'paused') {
      resumeAction();
    } else {
      pauseAIVoice();
    }
  };

  const resumeAction = () => {
    resumeAIVoice();
  };

  // Synthesize a soothing chime using Web Audio API
  const playChime = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;

      const audioCtx = new Ctx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(432, audioCtx.currentTime); // 432 Hz - calming frequency
      oscillator.frequency.exponentialRampToValueAtTime(216, audioCtx.currentTime + 1.5);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 2.5);
    } catch (e) {
      console.error("Could not play chime", e);
    }
  };

  const handleStorySelect = async (story: SleepStory) => {
    // 0. Synchronously initialize audio context to prevent mobile browser suspension rules
    initAIVoice();

    if (activeStory === story.id) {
      handleStopStory();
      return;
    }

    // Play a gentle, instant chime as feedback before anything else loads
    playChime();

    // Stop current
    handleStopStory();

    // Set UI state
    setActiveStory(story.id);
    setActiveStoryTitle(story.title);
    setIsGeneratingStory(true);

    try {
      // 1. Generate story text personalized to the user
      const response = await fetch('/api/sleep/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: story.title })
      });

      if (!response.ok) throw new Error("Failed to generate story");

      const { storyText } = await response.json();
      setIsGeneratingStory(false);

      // 2. Narrate the text using our HD AI Voice engine
      await speakWithAIVoice(storyText, story.voice, () => {
        // Upon finish
        setActiveStory(null);
      });

    } catch (error) {
      console.error(error);
      setIsGeneratingStory(false);
      setActiveStory(null);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-24 px-4 sm:px-6">
      {/* Tab Switcher */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        <Button
          onClick={() => setActiveTab('sounds')}
          className={`px-6 py-6 rounded-full text-base transition-all shadow-sm ${activeTab === 'sounds'
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            : 'bg-white text-muted-foreground hover:bg-gray-50'
            }`}
        >
          <Wind className="mr-2 h-5 w-5" /> Sound Mixer
        </Button>
        <Button
          onClick={() => setActiveTab('stories')}
          className={`px-6 py-6 rounded-full text-base transition-all shadow-sm ${activeTab === 'stories'
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            : 'bg-white text-muted-foreground hover:bg-gray-50'
            }`}
        >
          <BookOpen className="mr-2 h-5 w-5" /> Sleep Stories
        </Button>
      </div>

      {/* Play Area */}
      {activeTab === 'sounds' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AmbientMixer />
        </motion.div>
      )}

      {activeTab === 'stories' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass-panel p-12 text-center border-indigo-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Sleep Stories Library</h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Narrated bed-time stories designed to help you drift off peacefully. Our AI narrator uses soothing tones to guide you into deep sleep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sleepStories.map((story, index) => {
              const isThisStoryActive = activeStory === story.id;

              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isGeneratingStory && handleStorySelect(story)}
                  className={`bg-white p-6 rounded-[2rem] border ${isThisStoryActive ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-slate-100'} flex items-center gap-6 transition-all ${isGeneratingStory && !isThisStoryActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md group relative overflow-hidden'}`}
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl shadow-md shadow-indigo-100 relative z-10">
                    {story.coverEmoji}
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4 className={`font-bold text-lg mb-1 ${isThisStoryActive ? 'text-indigo-700' : 'text-slate-900'}`}>{story.title}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{story.description}</p>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{story.duration}</span>
                      <span>•</span>
                      <span>{story.narrator}</span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="relative z-10 hidden md:block">
                    {isThisStoryActive ? (
                      isGeneratingStory ? (
                        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <div className="flex gap-1">
                            <span className="w-1 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-1 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="w-1 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                        <Play className="h-4 w-4 ml-1" />
                      </div>
                    )}
                  </div>

                  {/* Pulse overlay if active */}
                  {isThisStoryActive && (
                    <div className="absolute inset-0 bg-indigo-50/50 animate-pulse pointer-events-none"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Floating now-playing bar */}
      <AnimatePresence>
        {activeStory && !isGeneratingStory && (
          <motion.div
            initial={{ opacity: 0, y: 32, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 32, x: "-50%" }}
            className="fixed bottom-32 lg:bottom-6 left-1/2 z-50 bg-white border border-indigo-100 shadow-2xl shadow-indigo-200 rounded-2xl px-3 py-3 sm:px-6 sm:py-4 flex items-center gap-2 sm:gap-4 w-[calc(100%-2rem)] max-w-[480px]"
          >
            {/* Waveform animation */}
            <div className="flex gap-1 items-center">
              {[0, 0.1, 0.2, 0.1, 0].map((delay, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-indigo-500 ${speechState === 'playing' ? 'animate-bounce' : ''}`}
                  style={{ height: `${10 + i * 4}px`, animationDelay: `${delay}s` }}
                />
              ))}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Now playing</p>
              <p className="font-semibold text-slate-900 truncate text-xs sm:text-sm leading-tight">{activeStoryTitle}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {/* Rewind */}
              <button
                onClick={(e) => { e.stopPropagation(); seekBackward(15); }}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                title="Rewind 15s"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              {/* Pause / Resume */}
              <button
                onClick={handlePauseResume}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors"
                title={speechState === 'paused' ? 'Resume' : 'Pause'}
              >
                {speechState === 'paused'
                  ? <Play className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5" />
                  : <Pause className="h-3 w-3 sm:h-4 sm:w-4" />}
              </button>

              {/* Fast Forward */}
              <button
                onClick={(e) => { e.stopPropagation(); seekForward(15); }}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                title="Skip Forward 15s"
              >
                <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              {/* Stop */}
              <button
                onClick={(e) => { e.stopPropagation(); handleStopStory(); }}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                title="Stop"
              >
                <Square className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Tips */}
      <div className="glass-panel p-8 mt-12 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          Sleep Hygiene Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
            <span className="text-3xl">🌙</span>
            <div>
              <strong className="text-slate-900 block mb-1">Consistent schedule</strong>
              <p className="text-muted-foreground text-sm">Go to bed at the same time daily to regulate your circadian rhythm.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
            <span className="text-3xl">📱</span>
            <div>
              <strong className="text-slate-900 block mb-1">Screen-free hour</strong>
              <p className="text-muted-foreground text-sm">Avoid blue light 60 minutes before bed to boost melatonin.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
            <span className="text-3xl">🧘</span>
            <div>
              <strong className="text-slate-900 block mb-1">Relaxation ritual</strong>
              <p className="text-muted-foreground text-sm">Try 4-7-8 breathing or a body scan meditation to unwind.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
            <span className="text-3xl">🌡️</span>
            <div>
              <strong className="text-slate-900 block mb-1">Cool environment</strong>
              <p className="text-muted-foreground text-sm">Keep bedroom at 65-68°F (18-20°C) for optimal sleep.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
