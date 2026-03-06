import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Brain, Zap, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

export default function OnboardingAssessment() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        stress: 50,
        sleep: 50,
        focus: 50
    });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            setLocation('/auth');
        }
    }, [isLoading, isAuthenticated, setLocation]);

    const nextStep = () => {
        if (step < 2) {
            setStep(s => s + 1);
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        setStep(3); // Processing state
        try {
            // Simulate saving baseline assessment 
            // In reality, this would POST to /api/assessments or /api/auth/profile
            await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'baseline_onboarding',
                    data: answers,
                    severity: answers.stress > 70 ? 'high' : answers.stress > 40 ? 'moderate' : 'low'
                })
            });

            // Delay for AI "Processing" aesthetic
            setTimeout(() => {
                setLocation('/dashboard');
            }, 2500);

        } catch (err) {
            console.error("Failed to save onboarding baseline", err);
            setLocation('/dashboard');
        }
    };

    const currentConfig = [
        {
            id: "stress",
            title: "How busy does your mind feel right now?",
            icon: Brain,
            color: "from-rose-400 to-indigo-500",
            labels: ["Calm & Clear", "Racing"]
        },
        {
            id: "sleep",
            title: "How restorative was your sleep recently?",
            icon: Moon,
            color: "from-indigo-400 to-blue-600",
            labels: ["Exhausted", "Deeply Rested"]
        },
        {
            id: "focus",
            title: "What is your main energy goal?",
            icon: Zap,
            color: "from-emerald-400 to-teal-500",
            labels: ["Find Peace", "Build Power"]
        }
    ];

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
            </div>

            <div className="absolute top-8 left-8">
                <Logo size="sm" showText={true} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">

                    {step < 3 ? (
                        <motion.div
                            key={`step-${step}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col items-center"
                        >
                            <div className="flex items-center gap-2 mb-12">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
                                ))}
                            </div>

                            {(() => {
                                const config = currentConfig[step];
                                const Icon = config.icon;
                                const value = answers[config.id as keyof typeof answers];

                                return (
                                    <>
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${config.color} flex items-center justify-center shadow-2xl mb-8`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>

                                        <h2 className="text-3xl font-light text-center leading-tight mb-16 px-4">
                                            {config.title}
                                        </h2>

                                        <div className="w-full px-4 mb-20 relative">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 px-2">
                                                <span>{config.labels[0]}</span>
                                                <span>{config.labels[1]}</span>
                                            </div>

                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={value}
                                                onChange={(e) => setAnswers(prev => ({ ...prev, [config.id]: parseInt(e.target.value) }))}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 relative z-10"
                                            />

                                            {/* Visual Tracker */}
                                            <motion.div
                                                className={`absolute top-12 h-1 rounded-full bg-gradient-to-r ${config.color} opacity-50`}
                                                style={{ left: '1rem', right: '1rem', width: `calc(${value}% - 2rem)` }}
                                            />
                                        </div>

                                        <button
                                            onClick={nextStep}
                                            className="w-full max-w-[200px] py-4 rounded-full bg-white text-slate-950 font-black tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2"
                                        >
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </>
                                );
                            })()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center py-20"
                        >
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 p-1 mb-8">
                                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-light mb-4">Building Your Baseline</h2>
                            <p className="text-slate-400">The AI is generating your progressive journey...</p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
