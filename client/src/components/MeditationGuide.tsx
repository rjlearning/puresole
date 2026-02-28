import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { playChime, playDoubleChime, playInhaleTone, playHoldTone } from '@/lib/audio';

interface MeditationGuideProps {
  type: 'mindfulness' | 'body-scan';
  duration: number; // in minutes
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
}

const meditationSteps = {
  mindfulness: [
    { phase: 'Settle In', duration: 60, instruction: 'Find a comfortable position. Close your eyes or soften your gaze.' },
    { phase: 'Breath Awareness', duration: 120, instruction: 'Notice the natural rhythm of your breathing. In and out.' },
    { phase: 'Observe Thoughts', duration: 180, instruction: 'When thoughts arise, acknowledge them without judgment.' },
    { phase: 'Body Awareness', duration: 120, instruction: 'Scan your body from head to toe, releasing any tension.' },
    { phase: 'Expand Awareness', duration: 90, instruction: 'Notice sounds around you. The feeling of your body in space.' },
    { phase: 'Closing', duration: 30, instruction: 'Slowly bring movement back. Take a deep breath.' }
  ],
  'body-scan': [
    { phase: 'Begin', duration: 60, instruction: 'Lie down comfortably. Close your eyes and take three deep breaths.' },
    { phase: 'Feet & Toes', duration: 90, instruction: 'Bring attention to your toes. Notice sensations. Relax them completely.' },
    { phase: 'Legs', duration: 90, instruction: 'Move up through your feet, ankles, calves, and thighs. Release all tension.' },
    { phase: 'Core', duration: 90, instruction: 'Scan your hips, abdomen, chest, and back. Breathe into any tightness.' },
    { phase: 'Arms & Hands', duration: 90, instruction: 'Relax your shoulders, arms, hands, and fingers. Let them feel heavy.' },
    { phase: 'Head & Face', duration: 60, instruction: 'Release tension in your neck, jaw, face, and scalp.' },
    { phase: 'Full Body', duration: 120, instruction: 'Feel your entire body relaxed and at peace. Rest here.' },
    { phase: 'Closing', duration: 30, instruction: 'Slowly open your eyes when ready. Notice how you feel.' }
  ]
};

export default function MeditationGuide({ type, duration, onComplete, onStart, onPause }: MeditationGuideProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPreamble, setIsPreamble] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeInStep, setTimeInStep] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const steps = meditationSteps[type];
  const currentStepData = steps[currentStep];
  const totalDuration = duration * 60; // convert to seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeInStep(prev => prev + 1);
        setTotalElapsed(prev => {
          const newElapsed = prev + 1;

          // Check if meditation is complete
          if (newElapsed >= totalDuration) {
            setIsActive(false);
            playChime(); // Play closing chime
            onComplete?.();
            return totalDuration;
          }

          return newElapsed;
        });

        // Move to next step when current step duration is complete
        if (timeInStep + 1 >= currentStepData.duration && currentStep < steps.length - 1) {
          playChime(); // Soft transition chime
          setCurrentStep(prev => prev + 1);
          setTimeInStep(0);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeInStep, currentStep, currentStepData, steps.length, totalDuration, onComplete]);

  // Audio tone on step change — rising tone signals a new meditation phase
  useEffect(() => {
    if (isActive && !isPreamble) {
      playInhaleTone();
    }
  }, [currentStep, isActive, isPreamble]);

  const handleStart = () => {
    playDoubleChime(); // Soft opening signal — two gentle chime taps
    setIsPreamble(true);
    // Brief musical pause before starting (1.5s) — replaces spoken preamble
    setTimeout(() => {
      setIsPreamble(false);
      setIsActive(true);
      setCurrentStep(0);
      setTimeInStep(0);
      setTotalElapsed(0);
      playInhaleTone(); // Rising tone signals "we begin — breathe in and settle"
      onStart?.();
    }, 1500);
  };

  const handlePause = () => {
    if (isPreamble) setIsPreamble(false);
    setIsActive(false);
    playHoldTone(); // Neutral ping — softer than chime, signals "pause here"
    onPause?.();
  };

  const handleReset = () => {
    if (isPreamble) setIsPreamble(false);
    setIsActive(false);
    setCurrentStep(0);
    setTimeInStep(0);
    setTotalElapsed(0);
    onPause?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const overallProgress = (totalElapsed / totalDuration) * 100;
  const pulseScale = isActive ? 1 + (Math.sin(Date.now() / 2000) * 0.1) : 1;

  return (
    <Card className="p-10 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100 shadow-lg mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-100/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="relative text-center z-10">
        {/* Progress indicators */}
        <div className="mb-8 space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm font-bold text-purple-900/70 tracking-wide uppercase">
            <span>Step {currentStep + 1} / {steps.length}</span>
            <span>{formatTime(totalElapsed)} / {formatTime(totalDuration)}</span>
          </div>
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner border border-purple-100">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-1000 shadow-sm"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Animated visualization */}
        <div className="relative w-80 h-80 mx-auto mb-10">
          {/* Outer rings - breathing effect */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200/40 to-fuchsia-200/40 transition-transform duration-2000 ease-in-out"
            style={{ transform: `scale(${pulseScale})` }}
          />
          <div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-200/60 to-fuchsia-200/60 transition-transform duration-2000 ease-in-out delay-500 border border-purple-100/50"
            style={{ transform: `scale(${pulseScale})` }}
          />

          {/* Center circle with current phase */}
          <div className="absolute inset-16 rounded-full bg-white shadow-2xl flex items-center justify-center p-6 border-4 border-purple-50">
            <div className="text-center z-10">
              {isPreamble && (
                <div className="text-2xl font-bold text-purple-900 leading-tight">
                  Listen...
                </div>
              )}
              {isActive && !isPreamble && (
                <>
                  <div className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">
                    {currentStepData.phase}
                  </div>
                  <div className="text-5xl font-black text-purple-900 tabular-nums">
                    {formatTime(currentStepData.duration - timeInStep)}
                  </div>
                </>
              )}
              {!isActive && !isPreamble && totalElapsed === 0 && (
                <div className="text-3xl font-bold text-purple-900">
                  Ready
                </div>
              )}
            </div>
          </div>

          {/* Step indicators around the circle */}
          {steps.map((_, index) => {
            const angle = (index / steps.length) * 360 - 90; // Start from top
            const radian = (angle * Math.PI) / 180;
            const radius = 150;
            const x = Math.cos(radian) * radius + 160;
            const y = Math.sin(radian) * radius + 160;

            return (
              <div
                key={index}
                className={`absolute w-3 h-3 rounded-full transition-all duration-500 shadow-sm ${index < currentStep
                  ? 'bg-purple-400'
                  : index === currentStep
                    ? 'bg-fuchsia-500 scale-150 ring-4 ring-fuchsia-100'
                    : 'bg-purple-200'
                  }`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            );
          })}
        </div>

        {/* Current instruction */}
        {isActive && (
          <div className="mb-8 max-w-lg mx-auto p-6 bg-white/60 rounded-2xl border border-purple-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-bold text-purple-400 uppercase tracking-wide">Current Focus</p>
            </div>
            <p className="text-xl font-medium text-purple-900 leading-relaxed">
              {currentStepData.instruction}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isActive && !isPreamble && totalElapsed === 0 && (
            <Button
              onClick={handleStart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              size="lg"
            >
              <Play className="w-6 h-6 mr-3" />
              Begin Meditation
            </Button>
          )}

          {(isActive || isPreamble) && (
            <Button
              onClick={handlePause}
              className="bg-amber-100 text-amber-900 hover:bg-amber-200 px-8 py-6 rounded-full font-bold"
              size="lg"
            >
              <Pause className="w-6 h-6 mr-2" />
              Pause
            </Button>
          )}

          {!isActive && !isPreamble && totalElapsed > 0 && totalElapsed < totalDuration && (
            <>
              <Button
                onClick={handleStart}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-full shadow-lg"
                size="lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-6 rounded-full font-bold"
                size="lg"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        {!isActive && totalElapsed === 0 && (
          <div className="mt-10 mx-auto max-w-2xl bg-white/60 p-6 rounded-xl border border-purple-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4 text-left">
              <div className="bg-purple-100 p-2 rounded-lg">
                <div className="text-xl">🧘‍♂️</div>
              </div>
              <div>
                <p className="font-bold text-purple-900 mb-2">Meditation Tips</p>
                <ul className="space-y-1 text-purple-800/80 text-sm font-medium">
                  <li>Find a quiet, comfortable space free from distractions.</li>
                  <li>Use headphones for a more immersive experience.</li>
                  <li>It's normal for your mind to wander - gently return focus.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
