import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Eye, Hand, Ear, Flower, Coffee, ChevronRight } from 'lucide-react';
import { playChime, playDoubleChime, playInhaleTone, playHoldTone, playWhooshTone } from '@/lib/audio';

interface GroundingGuideProps {
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
}

const groundingSteps = [
  {
    sense: 'Sight',
    count: 5,
    instruction: 'Name 5 things you can see around you',
    prompt: 'Look around slowly and identify objects, colors, or details',
    icon: Eye,
    color: 'from-blue-400 to-cyan-400',
    duration: 60 // seconds per item
  },
  {
    sense: 'Touch',
    count: 4,
    instruction: 'Name 4 things you can touch or feel',
    prompt: 'Notice textures, temperatures, or physical sensations',
    icon: Hand,
    color: 'from-purple-400 to-pink-400',
    duration: 60
  },
  {
    sense: 'Hearing',
    count: 3,
    instruction: 'Name 3 things you can hear',
    prompt: 'Listen carefully to sounds near and far',
    icon: Ear,
    color: 'from-emerald-400 to-teal-400',
    duration: 60
  },
  {
    sense: 'Smell',
    count: 2,
    instruction: 'Name 2 things you can smell',
    prompt: 'Notice scents in your environment or on your skin',
    icon: Flower,
    color: 'from-amber-400 to-orange-400',
    duration: 60
  },
  {
    sense: 'Taste',
    count: 1,
    instruction: 'Name 1 thing you can taste',
    prompt: 'Notice any taste in your mouth or take a mindful sip',
    icon: Coffee,
    color: 'from-pink-400 to-rose-400',
    duration: 60
  }
];

export default function GroundingGuide({ onComplete, onStart, onPause }: GroundingGuideProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPreamble, setIsPreamble] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [timeInItem, setTimeInItem] = useState(0);

  const currentStepData = groundingSteps[currentStep];
  const totalItems = groundingSteps.reduce((sum, step) => sum + step.count, 0);
  const completedItems = groundingSteps
    .slice(0, currentStep)
    .reduce((sum, step) => sum + step.count, 0) + currentItem;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeInItem(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);


  const handleStart = () => {
    playDoubleChime(); // Opening signal: two gentle taps
    setIsPreamble(true);
    // Brief musical moment replaces spoken preamble
    setTimeout(() => {
      setIsPreamble(false);
      setIsActive(true);
      setCurrentStep(0);
      setCurrentItem(0);
      setTimeInItem(0);
      playInhaleTone(); // Rising tone: attention up, exercise begins
      onStart?.();
    }, 1000);
  };

  const handlePause = () => {
    if (isPreamble) setIsPreamble(false);
    setIsActive(false);
    playHoldTone(); // Neutral ping on pause
    onPause?.();
  };

  const handleReset = () => {
    if (isPreamble) setIsPreamble(false);
    setIsActive(false);
    setCurrentStep(0);
    setCurrentItem(0);
    setTimeInItem(0);
    onPause?.();
  };

  const handleNext = () => {
    if (currentItem + 1 < currentStepData.count) {
      // Same sense, next item — soft single ping
      playHoldTone();
      setCurrentItem(prev => prev + 1);
      setTimeInItem(0);
    } else if (currentStep + 1 < groundingSteps.length) {
      // New sense — distinct double chime (two taps = new area)
      playDoubleChime();
      setCurrentStep(prev => prev + 1);
      setCurrentItem(0);
      setTimeInItem(0);
    } else {
      // Complete — whoosh (release) then double chime (done)
      playWhooshTone();
      setTimeout(() => playDoubleChime(), 600);
      setIsActive(false);
      onComplete?.();
    }
  };

  const progress = (completedItems / totalItems) * 100;
  const CurrentIcon = currentStepData.icon;

  // Calculate positions for the circular display
  const getCirclePositions = () => {
    const positions = [];
    for (let i = 0; i < currentStepData.count; i++) {
      const angle = (i / currentStepData.count) * 360 - 90;
      const radian = (angle * Math.PI) / 180;
      const radius = 100;
      const x = Math.cos(radian) * radius + 128;
      const y = Math.sin(radian) * radius + 128;
      positions.push({ x, y });
    }
    return positions;
  };

  const circlePositions = getCirclePositions();

  return (
    <Card className="p-10 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 shadow-lg mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="relative text-center z-10">
        {/* Overall Progress */}
        <div className="mb-8 space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm font-bold text-amber-900/70 tracking-wide uppercase">
            <span>5-4-3-2-1 Grounding</span>
            <span>{completedItems} / {totalItems} items</span>
          </div>
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner border border-amber-100">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Animated visualization */}
        <div className="relative w-80 h-80 mx-auto mb-10">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-200/50 scale-105"></div>
          <div className="absolute inset-0 rounded-full border border-amber-100/30 scale-125"></div>

          {/* Center icon circle */}
          <div className={`absolute inset-16 rounded-full bg-gradient-to-br ${currentStepData.color} shadow-2xl flex items-center justify-center transition-all duration-700 p-8`}>
            <div className="text-center text-white">
              {isPreamble && (
                <div className="text-2xl font-bold leading-tight">
                  Listen...
                </div>
              )}
              {isActive && !isPreamble && (
                <>
                  <CurrentIcon className="w-20 h-20 mb-3 mx-auto drop-shadow-md" />
                  <div className="text-4xl font-black mb-1 drop-shadow-sm">
                    {currentItem + 1} <span className="text-white/60 text-2xl">/</span> {currentStepData.count}
                  </div>
                  <div className="text-lg font-bold uppercase tracking-wide opacity-90">
                    {currentStepData.sense}
                  </div>
                </>
              )}
              {!isActive && !isPreamble && completedItems === 0 && (
                <>
                  <CurrentIcon className="w-20 h-20 mb-3 mx-auto drop-shadow-md" />
                  <div className="text-3xl font-bold mt-2">
                    Ready
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Item indicators around the circle */}
          {circlePositions.map((pos, index) => (
            <div
              key={index}
              className={`absolute w-4 h-4 rounded-full transition-all duration-500 shadow-sm ${index < currentItem
                ? 'bg-white scale-100'
                : index === currentItem
                  ? 'bg-amber-400 scale-150 ring-4 ring-amber-100 shadow-lg'
                  : 'bg-amber-200/50'
                }`}
              style={{
                left: `${pos.x + 32}px`, // Adjusted for larger size (original x centered on 256, now 320)
                top: `${pos.y + 32}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>

        {/* Current instruction */}
        {isActive && (
          <div className="mb-8 max-w-lg mx-auto p-8 bg-white/80 rounded-2xl border border-amber-100 shadow-lg backdrop-blur-sm transform transition-all">
            <h3 className="text-2xl font-bold text-amber-900 mb-3 leading-tight">
              {currentStepData.instruction}
            </h3>
            <p className="text-amber-800/80 text-lg font-medium">
              {currentStepData.prompt}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                Take your time...
              </span>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all rounded-full px-6"
              >
                {currentItem + 1 < currentStepData.count
                  ? 'Next Item'
                  : currentStep + 1 < groundingSteps.length
                    ? 'Next Sense'
                    : 'Complete'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isActive && !isPreamble && completedItems === 0 && (
            <Button
              onClick={handleStart}
              className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              size="lg"
            >
              <Play className="w-6 h-6 mr-3" />
              Begin Grounding
            </Button>
          )}

          {(isActive || isPreamble) && (
            <Button
              onClick={handlePause}
              className="bg-orange-100 text-orange-900 hover:bg-orange-200 px-8 py-6 rounded-full font-bold"
              size="lg"
            >
              <Pause className="w-6 h-6 mr-2" />
              Pause
            </Button>
          )}

          {!isActive && !isPreamble && completedItems > 0 && completedItems < totalItems && (
            <>
              <Button
                onClick={handleStart}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 rounded-full shadow-lg"
                size="lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-2 border-amber-200 text-amber-700 hover:bg-amber-50 px-8 py-6 rounded-full font-bold"
                size="lg"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        {!isActive && completedItems === 0 && (
          <div className="mt-10 mx-auto max-w-2xl bg-white/60 p-6 rounded-xl border border-amber-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4 text-left">
              <div className="bg-amber-100 p-2 rounded-lg">
                <div className="text-xl">🛡️</div>
              </div>
              <div>
                <p className="font-bold text-amber-900 mb-2">About this technique</p>
                <ul className="space-y-1 text-amber-800/80 text-sm font-medium">
                  <li>The 5-4-3-2-1 technique helps ground you in the present moment.</li>
                  <li>Great for managing anxiety or overwhelming emotions.</li>
                  <li>Take your time with each sense - there's no rush.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
