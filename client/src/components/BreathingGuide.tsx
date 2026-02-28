import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Music, Volume2, VolumeX } from 'lucide-react';
import {
  playDoubleChime,
  playInhaleTone,
  playHoldTone,
  playWhooshTone,
  playCountTick,
  startBreathingAmbient,
  stopBreathingAmbient,
} from '@/lib/audio';

interface BreathingGuideProps {
  type: '4-7-8' | 'box';
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
}

const patterns = {
  '4-7-8': [
    { name: 'Exhale', duration: 4, instruction: 'Empty your lungs through your mouth', color: 'from-indigo-400 to-teal-300', sound: 'whoosh' as const },
    { name: 'Inhale', duration: 4, instruction: 'Slowly through your nose', color: 'from-teal-300 to-emerald-400', sound: 'inhale' as const },
    { name: 'Hold', duration: 7, instruction: 'Hold gently — keep still', color: 'from-emerald-400 to-teal-400', sound: 'hold' as const },
    { name: 'Exhale', duration: 8, instruction: 'Out through your mouth — all the way', color: 'from-teal-400 to-indigo-400', sound: 'whoosh' as const },
  ],
  'box': [
    { name: 'Inhale', duration: 4, instruction: 'Slowly through your nose', color: 'from-teal-300 to-emerald-400', sound: 'inhale' as const },
    { name: 'Hold', duration: 4, instruction: 'Stay relaxed', color: 'from-emerald-400 to-teal-400', sound: 'hold' as const },
    { name: 'Exhale', duration: 4, instruction: 'Out through your mouth', color: 'from-teal-400 to-indigo-400', sound: 'whoosh' as const },
    { name: 'Hold', duration: 4, instruction: 'Lungs empty — stay still', color: 'from-indigo-400 to-teal-300', sound: 'hold' as const },
  ],
};

const howItWorks = {
  '4-7-8': [
    'Place your tongue tip lightly behind your upper front teeth throughout.',
    'Start by exhaling completely to empty your lungs.',
    'Breathe in slowly through your nose — 4 counts.',
    'Hold your breath — 7 counts.',
    'Exhale fully through your mouth — 8 counts.',
    'Repeat 4 times. Lightheadedness is normal at first.',
  ],
  'box': [
    'Sit upright. Relax your shoulders.',
    'Breathe in slowly — 4 counts.',
    'Hold with full lungs — 4 counts.',
    'Breathe out slowly — 4 counts.',
    'Hold with empty lungs — 4 counts.',
    'Repeat 5 cycles. Imagine tracing a square.',
  ],
};

export default function BreathingGuide({ type, onComplete, onStart, onPause }: BreathingGuideProps) {
  const currentPattern = patterns[type];
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  const musicRef = useRef(musicOn);
  musicRef.current = musicOn;

  const currentPhaseData = currentPattern[phase];
  const targetCycles = type === '4-7-8' ? 4 : 5;

  /* ── Timer: tick every second ── */
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const next = (phase + 1) % currentPattern.length;
          if (next === 0) {
            const newCycle = cycleCount + 1;
            setCycleCount(newCycle);
            if (newCycle >= targetCycles) {
              setIsActive(false);
              stopBreathingAmbient();
              playDoubleChime();
              onComplete?.();
              return 0;
            }
          }
          setPhase(next);
          return currentPattern[next].duration;
        }

        const elapsed = currentPhaseData.duration - (prev - 1);
        playCountTick(elapsed, currentPhaseData.duration);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isActive, timeLeft, phase, cycleCount, currentPattern, currentPhaseData, targetCycles, onComplete]);

  /* ── Phase-change tone ── */
  useEffect(() => {
    if (!isActive) return;
    const { sound } = currentPhaseData;
    if (sound === 'inhale') playInhaleTone();
    else if (sound === 'hold') playHoldTone();
    else playWhooshTone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isActive]);

  /* ── Music toggle ── */
  useEffect(() => {
    if (!isActive) return;
    if (musicOn) startBreathingAmbient();
    else stopBreathingAmbient();
  }, [musicOn, isActive]);

  useEffect(() => () => { stopBreathingAmbient(); }, []);

  const handleStart = () => {
    setShowInstructions(false);
    setIsActive(true);
    setPhase(0);
    setTimeLeft(currentPattern[0].duration);
    setCycleCount(0);
    playDoubleChime();
    if (musicRef.current) startBreathingAmbient();
    onStart?.();
  };

  const handlePause = () => {
    setIsActive(false);
    stopBreathingAmbient();
    onPause?.();
  };

  const handleReset = () => {
    setIsActive(false);
    stopBreathingAmbient();
    setPhase(0);
    setTimeLeft(0);
    setCycleCount(0);
    setShowInstructions(true);
    onPause?.();
  };

  const circleScale = (() => {
    if (!isActive) return 1;
    const progress = 1 - (timeLeft / currentPhaseData.duration);
    if (currentPhaseData.name === 'Inhale') return 1 + progress * 0.5;
    if (currentPhaseData.name === 'Exhale') return 1.5 - progress * 0.5;
    return 1.5;
  })();

  const elapsedDots = currentPhaseData.duration - timeLeft;

  return (
    <Card className="p-10 bg-gradient-to-br from-teal-50 to-emerald-50/50 border-teal-100 shadow-lg mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      <div className="relative text-center z-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-teal-700/80 uppercase tracking-widest">
            Cycle {Math.min(cycleCount + 1, targetCycles)} / {targetCycles}
          </p>
          <button
            onClick={() => setMusicOn(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${musicOn ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
          >
            {musicOn ? <Music className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {musicOn ? 'Music on' : 'Music off'}
          </button>
        </div>

        {showInstructions && (
          <div className="mb-8 bg-white/70 rounded-2xl p-6 text-left border border-teal-100 shadow-sm backdrop-blur-sm">
            <p className="font-bold text-teal-800 mb-3 text-sm uppercase tracking-wider">How it works</p>
            <ol className="space-y-2">
              {howItWorks[type].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-teal-900/80">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="relative w-64 h-64 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-teal-200/50 scale-110" />
          <div className="absolute inset-0 rounded-full border border-teal-100/30 scale-125" />
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentPhaseData.color} shadow-2xl shadow-teal-200/50 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center`}
            style={{ transform: `scale(${circleScale})`, opacity: 0.92 }}
          >
            {isActive && (
              <>
                <div className="text-7xl font-black text-white drop-shadow-md mb-0.5 tabular-nums">{timeLeft}</div>
                <div className="text-xl font-bold text-white uppercase tracking-widest opacity-95">{currentPhaseData.name}</div>
                <div className="text-xs font-medium text-white/80 mt-1.5 px-4 text-center leading-snug">{currentPhaseData.instruction}</div>
              </>
            )}
            {!isActive && timeLeft === 0 && <div className="text-4xl font-bold text-white tracking-tight">Ready</div>}
            {!isActive && timeLeft > 0 && <div className="text-3xl font-bold text-white">Paused</div>}
          </div>
        </div>

        {isActive && (
          <div className="flex justify-center gap-1.5 mb-5">
            {Array.from({ length: currentPhaseData.duration }).map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i < elapsedDots ? 'w-3 h-3 bg-teal-500 scale-110 shadow-sm shadow-teal-300' : 'w-2.5 h-2.5 bg-teal-200'}`} />
            ))}
          </div>
        )}

        {isActive && (
          <div className="w-full max-w-xs mx-auto h-1.5 bg-teal-100 rounded-full overflow-hidden mb-8">
            <div
              className={`h-full bg-gradient-to-r ${currentPhaseData.color} transition-all duration-1000 ease-linear`}
              style={{ width: `${((currentPhaseData.duration - timeLeft) / currentPhaseData.duration) * 100}%` }}
            />
          </div>
        )}

        <div className="flex justify-center gap-4">
          {!isActive && timeLeft === 0 && (
            <Button onClick={handleStart} className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              <Play className="w-6 h-6 mr-3" /> Begin
            </Button>
          )}
          {isActive && (
            <Button onClick={handlePause} className="bg-amber-100 text-amber-900 hover:bg-amber-200 px-8 py-6 rounded-full font-bold">
              <Pause className="w-6 h-6 mr-2" /> Pause
            </Button>
          )}
          {!isActive && timeLeft > 0 && (
            <>
              <Button onClick={handleStart} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-full shadow-lg">
                <Play className="w-6 h-6 mr-2" /> Resume
              </Button>
              <Button onClick={handleReset} variant="outline" className="border-2 border-teal-200 text-teal-700 hover:bg-teal-50 px-8 py-6 rounded-full font-bold">
                <RotateCcw className="w-6 h-6 mr-2" /> Reset
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
