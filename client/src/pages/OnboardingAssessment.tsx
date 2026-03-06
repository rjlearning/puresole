import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

// ── Types ────────────────────────────────────────────────────────────────────

interface Answers {
    primary_goal: string;
    mood_score: number;       // 1–5
    sleep_quality: number;    // 0–100 slider
    presenting_concern: string;
    duration: string;
}

// ── Step Configs ─────────────────────────────────────────────────────────────

const GOALS = [
    { id: "stress", label: "Manage Stress", emoji: "🌪️" },
    { id: "anxiety", label: "Ease Anxiety", emoji: "🫧" },
    { id: "sleep", label: "Better Sleep", emoji: "🌙" },
    { id: "mood", label: "Lift My Mood", emoji: "☀️" },
    { id: "burnout", label: "Beat Burnout", emoji: "🔋" },
];

const MOODS = [
    { score: 1, emoji: "😔", label: "Really low" },
    { score: 2, emoji: "😟", label: "Struggling" },
    { score: 3, emoji: "😐", label: "So-so" },
    { score: 4, emoji: "🙂", label: "Pretty good" },
    { score: 5, emoji: "😊", label: "Great" },
];

const CONCERNS = [
    { id: "stressed", label: "Constantly overwhelmed", gradient: "from-rose-500 to-orange-500" },
    { id: "anxious", label: "Worried about everything", gradient: "from-orange-500 to-amber-500" },
    { id: "low", label: "Feeling low or empty", gradient: "from-indigo-500 to-blue-500" },
    { id: "disconnected", label: "Disconnected from life", gradient: "from-slate-600 to-slate-800" },
    { id: "okay", label: "Mostly fine, want growth", gradient: "from-emerald-500 to-teal-500" },
];

const DURATIONS = [
    { id: "days", label: "A few days" },
    { id: "weeks", label: "A few weeks" },
    { id: "months", label: "A few months" },
    { id: "ongoing", label: "A long time" },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingAssessment() {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    const [step, setStep] = useState(0);           // 0–4 = questions, 5 = processing
    const [planId, setPlanId] = useState<string | null>(null);
    const [planLabel, setPlanLabel] = useState("your wellness");
    const [answers, setAnswers] = useState<Answers>({
        primary_goal: "",
        mood_score: 3,
        sleep_quality: 50,
        presenting_concern: "",
        duration: "",
    });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) setLocation("/auth");
    }, [isLoading, isAuthenticated, setLocation]);

    // Derive personalized copy for the processing screen
    useEffect(() => {
        if (step === 5) {
            const goal = GOALS.find(g => g.id === answers.primary_goal)?.label?.toLowerCase() || "your wellness";
            setPlanLabel(goal);
            submitToBackend();
        }
    }, [step]);

    const submitToBackend = async () => {
        try {
            const goalLabels = answers.primary_goal
                ? [GOALS.find(g => g.id === answers.primary_goal)?.label || answers.primary_goal]
                : [];

            const res = await fetch("/api/onboarding/complete", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    responses: answers,
                    userGoals: goalLabels,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const id = data.planId;
                // Minimum 2.5s for the processing animation to feel purposeful
                setTimeout(() => {
                    if (id) {
                        setLocation(`/treatment-plan/${id}`);
                    } else {
                        setLocation("/dashboard");
                    }
                }, 2800);
            } else {
                setTimeout(() => setLocation("/dashboard"), 2800);
            }
        } catch {
            setTimeout(() => setLocation("/dashboard"), 2800);
        }
    };

    const next = () => setStep(s => s + 1);

    const set = <K extends keyof Answers>(key: K, val: Answers[K]) =>
        setAnswers(prev => ({ ...prev, [key]: val }));

    if (isLoading || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Logo */}
            <div className="absolute top-8 left-8">
                <Logo size="sm" showText />
            </div>

            {/* Progress dots */}
            {step < 5 && (
                <div className="absolute top-8 right-8 flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-500 ${i === step
                                    ? "w-5 h-1.5 bg-indigo-400"
                                    : i < step
                                        ? "w-1.5 h-1.5 bg-indigo-600"
                                        : "w-1.5 h-1.5 bg-slate-800"
                                }`}
                        />
                    ))}
                </div>
            )}

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">

                    {/* ── Step 0: Primary Goal ─────────────────────────────── */}
                    {step === 0 && (
                        <motion.div key="s0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}>
                            <h2 className="text-3xl font-light text-center mb-2">What brings you here?</h2>
                            <p className="text-slate-400 text-center text-sm mb-10">Choose what resonates most with you right now.</p>
                            <div className="grid grid-cols-1 gap-3 mb-10">
                                {GOALS.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => { set("primary_goal", g.id); next(); }}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 text-left hover:scale-[1.02] active:scale-100 ${answers.primary_goal === g.id
                                                ? "border-indigo-500 bg-indigo-500/10"
                                                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                                            }`}
                                    >
                                        <span className="text-2xl">{g.emoji}</span>
                                        <span className="font-semibold text-lg">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 1: Mood ─────────────────────────────────────── */}
                    {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="text-center">
                            <h2 className="text-3xl font-light mb-2">How has your mood been?</h2>
                            <p className="text-slate-400 text-sm mb-12">Lately, overall — not just today.</p>
                            <div className="flex justify-center gap-4 mb-12">
                                {MOODS.map(m => (
                                    <button
                                        key={m.score}
                                        onClick={() => { set("mood_score", m.score); next(); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 hover:scale-110 active:scale-95 ${answers.mood_score === m.score
                                                ? "border-indigo-500 bg-indigo-500/10"
                                                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                                            }`}
                                    >
                                        <span className="text-3xl">{m.emoji}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 2: Sleep Slider ─────────────────────────────── */}
                    {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="text-center">
                            <h2 className="text-3xl font-light mb-2">How rested do you feel?</h2>
                            <p className="text-slate-400 text-sm mb-12">In the mornings, on average lately.</p>
                            <div className="px-4 mb-12">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
                                    <span>Exhausted</span>
                                    <span>Fully Restored</span>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    value={answers.sleep_quality}
                                    onChange={e => set("sleep_quality", parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="mt-6 text-5xl font-extralight text-indigo-400 tabular-nums">
                                    {answers.sleep_quality}<span className="text-2xl text-slate-600">%</span>
                                </div>
                            </div>
                            <button
                                onClick={next}
                                className="w-full max-w-[200px] mx-auto py-4 rounded-full bg-white text-slate-950 font-black tracking-wide flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step 3: Presenting Concern ───────────────────────── */}
                    {step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}>
                            <h2 className="text-3xl font-light text-center mb-2">Which resonates most?</h2>
                            <p className="text-slate-400 text-center text-sm mb-10">Be honest — there is no wrong answer.</p>
                            <div className="grid grid-cols-1 gap-3 mb-10">
                                {CONCERNS.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { set("presenting_concern", c.id); next(); }}
                                        className={`relative flex items-center px-5 py-4 rounded-2xl border transition-all duration-200 text-left overflow-hidden hover:scale-[1.02] active:scale-100 ${answers.presenting_concern === c.id
                                                ? "border-white/30 bg-white/10"
                                                : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                                            }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${c.gradient} opacity-80`} />
                                        <span className="ml-4 font-semibold text-lg">{c.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 4: Duration ─────────────────────────────────── */}
                    {step === 4 && (
                        <motion.div key="s4" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="text-center">
                            <h2 className="text-3xl font-light mb-2">How long has this been going on?</h2>
                            <p className="text-slate-400 text-sm mb-12">A rough estimate is perfectly fine.</p>
                            <div className="grid grid-cols-2 gap-3 mb-12">
                                {DURATIONS.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => { set("duration", d.id); next(); }}
                                        className={`py-5 rounded-2xl border font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95 ${answers.duration === d.id
                                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 5: AI Processing ────────────────────────────── */}
                    {step === 5 && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center py-16"
                        >
                            {/* Concentric spinning rings */}
                            <div className="relative w-32 h-32 mb-10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 border-2 border-rose-500/20 border-b-rose-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-8 border border-emerald-500/20 border-t-emerald-500 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                                </div>
                            </div>

                            <motion.h2
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-2xl font-light mb-3"
                            >
                                Designing your plan
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-slate-400 text-sm max-w-xs leading-relaxed"
                            >
                                The AI is personalizing a progression map for{" "}
                                <span className="text-indigo-400 font-medium">{planLabel}</span>. This takes a moment.
                            </motion.p>

                            {/* Animated dots */}
                            <div className="flex gap-2 mt-8">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-indigo-500 rounded-full"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
