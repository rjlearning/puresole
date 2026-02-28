import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, PenTool, CheckCircle2 } from 'lucide-react';

interface JournalingGuideProps {
  type?: 'gratitude' | 'reflection' | 'stress';
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
}

const journalingPrompts = {
  gratitude: [
    {
      prompt: 'What are three things you\'re grateful for today?',
      guidance: 'They can be big or small - from a warm cup of coffee to a meaningful conversation.',
      minTime: 120 // 2 minutes minimum per prompt
    },
    {
      prompt: 'Who is someone that made a positive impact on you recently?',
      guidance: 'Reflect on specific actions or qualities that made a difference.',
      minTime: 120
    },
    {
      prompt: 'What is something about yourself that you appreciate?',
      guidance: 'This could be a skill, quality, or something you accomplished.',
      minTime: 120
    }
  ],
  reflection: [
    {
      prompt: 'How are you feeling right now, physically and emotionally?',
      guidance: 'Check in with your body and mind without judgment.',
      minTime: 120
    },
    {
      prompt: 'What was the highlight of your day or week?',
      guidance: 'What moment made you smile or feel accomplished?',
      minTime: 120
    },
    {
      prompt: 'What challenge did you face, and how did you handle it?',
      guidance: 'Reflect on your response and what you learned.',
      minTime: 120
    },
    {
      prompt: 'What do you want to focus on tomorrow or this week?',
      guidance: 'Set an intention or goal for moving forward.',
      minTime: 120
    }
  ],
  stress: [
    {
      prompt: 'What is causing you stress or anxiety right now?',
      guidance: 'Name it clearly and specifically. Writing it down can help.',
      minTime: 120
    },
    {
      prompt: 'What parts of this situation are within your control?',
      guidance: 'Separate what you can influence from what you cannot.',
      minTime: 120
    },
    {
      prompt: 'What is one small action you can take to address this?',
      guidance: 'Focus on something manageable and concrete.',
      minTime: 120
    },
    {
      prompt: 'What would you tell a friend in this situation?',
      guidance: 'Practice self-compassion by offering yourself the same kindness.',
      minTime: 120
    }
  ]
};

export default function JournalingGuide({ type = 'reflection', onComplete, onStart, onPause }: JournalingGuideProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [timeOnPrompt, setTimeOnPrompt] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);

  const prompts = journalingPrompts[type];
  const currentPromptData = prompts[currentPrompt];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeOnPrompt(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  // Initialize responses array
  useEffect(() => {
    if (responses.length === 0) {
      setResponses(new Array(prompts.length).fill(''));
    }
  }, [prompts.length, responses.length]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentPrompt(0);
    setTimeOnPrompt(0);
    onStart?.();
  };

  const handlePause = () => {
    setIsActive(false);
    onPause?.();
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPrompt(0);
    setTimeOnPrompt(0);
    setResponses(new Array(prompts.length).fill(''));
    onPause?.();
  };

  const handleNext = () => {
    if (currentPrompt + 1 < prompts.length) {
      setCurrentPrompt(prev => prev + 1);
      setTimeOnPrompt(0);
    } else {
      setIsActive(false);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentPrompt > 0) {
      setCurrentPrompt(prev => prev - 1);
      setTimeOnPrompt(0);
    }
  };

  const handleResponseChange = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentPrompt] = value;
    setResponses(newResponses);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentPrompt + 1) / prompts.length) * 100;
  const hasMinTime = timeOnPrompt >= currentPromptData.minTime;

  return (
    <Card className="p-10 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-lg mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="relative text-center z-10">
        {/* Progress */}
        <div className="mb-8 space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm font-bold text-indigo-900/70 tracking-wide uppercase">
            <span>Prompt {currentPrompt + 1} / {prompts.length}</span>
            <span className="flex items-center gap-2">
              <span className={hasMinTime ? 'text-indigo-600' : 'text-indigo-400'}>
                {formatTime(timeOnPrompt)}
              </span>
              {hasMinTime && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </span>
          </div>
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner border border-indigo-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Journaling icon */}
        {!isActive && currentPrompt === 0 && (
          <div className="mb-10">
            <div className="w-40 h-40 mx-auto rounded-full bg-white/60 flex items-center justify-center border-4 border-indigo-50 shadow-xl backdrop-blur-sm">
              <PenTool className="w-20 h-20 text-indigo-600 ml-1" />
            </div>
            <h3 className="text-2xl font-bold text-indigo-900 mt-6">Ready to reflect?</h3>
            <p className="text-indigo-700/80 mt-2 max-w-md mx-auto">
              Clear your mind and let your thoughts flow freely.
            </p>
          </div>
        )}

        {/* Current prompt */}
        {isActive && (
          <div className="mb-8 space-y-6">
            {/* Prompt card */}
            <div className="p-8 bg-white/80 border border-indigo-100 rounded-2xl text-left shadow-lg backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-400"></div>
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-2 rounded-lg mt-1">
                  <PenTool className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-indigo-900 mb-2 leading-tight">
                    {currentPromptData.prompt}
                  </h3>
                  <p className="text-indigo-700/80 text-base font-medium">
                    {currentPromptData.guidance}
                  </p>
                </div>
              </div>
            </div>

            {/* Writing area */}
            <div className="text-left bg-white rounded-2xl p-1 shadow-sm border border-indigo-100/50">
              <Textarea
                value={responses[currentPrompt] || ''}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Start writing... Take your time and be honest with yourself."
                className="bg-transparent border-0 text-slate-700 placeholder:text-slate-400 min-h-[250px] focus-visible:ring-0 text-lg leading-relaxed p-6 resize-none"
              />
            </div>
            <p className="text-xs text-indigo-400 mt-2 italic text-center font-medium">
              {!hasMinTime
                ? `Take at least ${formatTime(currentPromptData.minTime - timeOnPrompt)} more to reflect deeply`
                : 'Great reflection. Ready to continue when you are.'}
            </p>


            {/* Navigation buttons */}
            <div className="flex justify-between items-center gap-3 pt-4">
              <Button
                onClick={handlePrevious}
                disabled={currentPrompt === 0}
                variant="outline"
                className="border-2 border-indigo-100 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 px-6"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!hasMinTime}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-8 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {currentPrompt + 1 < prompts.length ? (
                  <>
                    Next Prompt
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete Journal
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isActive && currentPrompt === 0 && (
            <Button
              onClick={handleStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              size="lg"
            >
              <Play className="w-6 h-6 mr-3" />
              Begin Journaling
            </Button>
          )}

          {isActive && (
            <Button
              onClick={handlePause}
              className="bg-amber-100 text-amber-900 hover:bg-amber-200 px-8 py-6 rounded-full font-bold"
            >
              <Pause className="w-6 h-6 mr-2" />
              Pause
            </Button>
          )}

          {!isActive && currentPrompt > 0 && currentPrompt < prompts.length && (
            <>
              <Button
                onClick={handleStart}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-full shadow-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-8 py-6 rounded-full font-bold"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Tips */}
        {!isActive && currentPrompt === 0 && (
          <div className="mt-10 mx-auto max-w-2xl bg-white/60 p-6 rounded-xl border border-indigo-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4 text-left">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <div className="text-xl">✍️</div>
              </div>
              <div>
                <p className="font-bold text-indigo-900 mb-2">Journaling Tips</p>
                <ul className="space-y-1 text-indigo-800/80 text-sm font-medium">
                  <li>Write freely without worrying about grammar or spelling.</li>
                  <li>Be honest with yourself - this space is for you.</li>
                  <li>Take your time to reflect deeply on each prompt.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
