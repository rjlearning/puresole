import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, Activity } from 'lucide-react';
import { playChime, playDoubleChime, playInhaleTone, playHoldTone, startBinauralDrone, stopBinauralDrone } from '@/lib/audio';

interface SomaticGuideProps {
    type: 'vagus-reset' | 'tension-release';
    duration: number; // in minutes
    onComplete?: () => void;
    onStart?: () => void;
    onPause?: () => void;
}

const somaticSteps = {
    'vagus-reset': [
        { phase: 'Prepare', duration: 30, instruction: 'Sit comfortably. Interlace your fingers and place them behind your head.' },
        { phase: 'Right Shift', duration: 45, instruction: 'Keeping your head perfectly still, move only your eyes to look as far to the right as possible.' },
        { phase: 'Hold Right', duration: 60, instruction: 'Keep looking right. Wait for a natural sigh, swallow, or yawn. This signals nervous system release.' },
        { phase: 'Center', duration: 30, instruction: 'Bring your eyes back to center. Take a deep, slow breath.' },
        { phase: 'Left Shift', duration: 45, instruction: 'Now, keeping your head still, move only your eyes to look as far to the left as possible.' },
        { phase: 'Hold Left', duration: 60, instruction: 'Keep looking left. Wait again for that natural sigh, swallow, or yawn.' },
        { phase: 'Center', duration: 30, instruction: 'Bring your eyes back to center. Notice any shifts in your body.' }
    ],
    'tension-release': [
        { phase: 'Grounding', duration: 30, instruction: 'Stand comfortably with your feet shoulder-width apart. Feel the floor beneath you.' },
        { phase: 'Hand Shake', duration: 45, instruction: 'Begin shaking your hands. Just your hands. Let the wrists be completely loose.' },
        { phase: 'Arm Shake', duration: 45, instruction: 'Let the shaking move up into your elbows and shoulders. Shake your entire arms.' },
        { phase: 'Leg Shake', duration: 60, instruction: 'Pause your arms. Shift weight to your left leg and shake your right leg vigorously. Now switch, shake the left leg.' },
        { phase: 'Full Body', duration: 90, instruction: 'Now shake your whole body. Arms, legs, hips, shoulders. Jump lightly if it feels right. Release the stored energy.' },
        { phase: 'Stillness', duration: 30, instruction: 'Stop immediately. Stand perfectly still. Notice the buzzing energy and blood flow in your body.' }
    ]
};

export default function SomaticGuide({ type, duration, onComplete, onStart, onPause }: SomaticGuideProps) {
    const [isActive, setIsActive] = useState(false);
    const [isPreamble, setIsPreamble] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [timeInStep, setTimeInStep] = useState(0);
    const [totalElapsed, setTotalElapsed] = useState(0);

    const steps = somaticSteps[type];
    const currentStepData = steps[currentStep];
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && !isPreamble) {
            interval = setInterval(() => {
                setTimeInStep(prev => prev + 1);
                setTotalElapsed(prev => {
                    const newElapsed = prev + 1;

                    // Check if exercise is complete
                    if (newElapsed >= totalDuration) {
                        setIsActive(false);
                        playChime();
                        stopBinauralDrone();
                        onComplete?.();
                        return totalDuration;
                    }

                    return newElapsed;
                });

                // Move to next step when current step duration is complete
                if (timeInStep + 1 >= currentStepData.duration && currentStep < steps.length - 1) {
                    playChime();
                    setCurrentStep(prev => prev + 1);
                    setTimeInStep(0);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, isPreamble, timeInStep, currentStep, currentStepData, steps.length, totalDuration, onComplete]);

    // Audio tone on step change — rising tone signals a new somatic phase
    useEffect(() => {
        if (isActive && !isPreamble) {
            playInhaleTone();
        }
    }, [currentStep, isActive, isPreamble]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopBinauralDrone();
        };
    }, []);

    const handleStart = () => {
        playDoubleChime(); // Soft opening signal
        setIsPreamble(true);
        // Start Solfeggio frequency immediately (396 Hz — liberating fear/tension)
        startBinauralDrone(396, 2.5);
        // Musical pause replaces spoken preamble
        setTimeout(() => {
            setIsPreamble(false);
            setIsActive(true);
            setCurrentStep(0);
            setTimeInStep(0);
            setTotalElapsed(0);
            playInhaleTone(); // Rising tone: "begin, open"
            onStart?.();
        }, 1500);
    };

    const handlePause = () => {
        if (isPreamble) setIsPreamble(false);
        setIsActive(false);
        stopBinauralDrone();
        playHoldTone(); // Neutral ping on pause
        onPause?.();
    };

    const handleReset = () => {
        if (isPreamble) setIsPreamble(false);
        setIsActive(false);
        stopBinauralDrone();
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
    const pulseScale = isActive ? 1 + (Math.sin(Date.now() / 1000) * 0.05) : 1;

    return (
        <Card className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-lg mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-100/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

            <div className="relative text-center z-10">
                <div className="mb-8 space-y-3 max-w-md mx-auto">
                    <div className="flex items-center justify-between text-sm font-bold text-emerald-900/70 tracking-wide uppercase">
                        <span>Phase {currentStep + 1} / {steps.length}</span>
                        <span>{formatTime(totalElapsed)} / {formatTime(totalDuration)}</span>
                    </div>
                    <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner border border-emerald-100">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 shadow-sm"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>

                {/* Animated visualization */}
                <div className="relative w-80 h-80 mx-auto mb-10">
                    <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 transition-transform duration-1000 ease-in-out ${isActive ? (type === 'tension-release' ? 'animate-bounce' : '') : ''}`}
                        style={{ transform: `scale(${pulseScale})` }}
                    />
                    <div
                        className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-200/60 to-teal-200/60 transition-transform duration-1000 ease-in-out delay-100 border border-emerald-100/50"
                        style={{ transform: `scale(${pulseScale})` }}
                    />

                    <div className="absolute inset-16 rounded-full bg-white shadow-2xl flex items-center justify-center p-6 border-4 border-emerald-50">
                        <div className="text-center z-10">
                            {isPreamble && (
                                <div className="text-2xl font-bold text-emerald-900 leading-tight">
                                    Listen...
                                </div>
                            )}
                            {isActive && !isPreamble && (
                                <>
                                    <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-1">
                                        {currentStepData.phase}
                                    </div>
                                    <div className="text-5xl font-black text-emerald-900 tabular-nums">
                                        {formatTime(currentStepData.duration - timeInStep)}
                                    </div>
                                </>
                            )}
                            {!isActive && !isPreamble && totalElapsed === 0 && (
                                <div className="text-3xl font-bold text-emerald-900">
                                    Ready
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Current instruction */}
                {isActive && (
                    <div className="mb-8 max-w-lg mx-auto p-6 bg-white/60 rounded-2xl border border-emerald-100 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <p className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Action Required</p>
                        </div>
                        <p className="text-xl font-medium text-emerald-900 leading-relaxed">
                            {currentStepData.instruction}
                        </p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    {!isActive && !isPreamble && totalElapsed === 0 && (
                        <Button
                            onClick={handleStart}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                            size="lg"
                        >
                            <Play className="w-6 h-6 mr-3" />
                            Begin Release
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-full shadow-lg"
                                size="lg"
                            >
                                <Play className="w-6 h-6 mr-2" />
                                Resume
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8 py-6 rounded-full font-bold"
                                size="lg"
                            >
                                <RotateCcw className="w-6 h-6 mr-2" />
                                Reset
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}
