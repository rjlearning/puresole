import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

interface ProtocolCard {
    id: string;
    emoji: string;
    title: string;
    duration: string;
    gradient: string;
    route: string;
    accentColor: string;
}

// Time-of-day aware activity selection
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

const PROTOCOL_SETS: Record<string, ProtocolCard[]> = {
    morning: [
        { id: "breath-am", emoji: "🫁", title: "Morning Breath", duration: "3 min", gradient: "from-sky-500 to-indigo-600", route: "/activities?recommended=true&type=breathing", accentColor: "sky" },
        { id: "journal-am", emoji: "📝", title: "Intention Set", duration: "5 min", gradient: "from-violet-500 to-purple-600", route: "/voice-journal", accentColor: "violet" },
        { id: "ground-am", emoji: "🌍", title: "Body Scan", duration: "4 min", gradient: "from-emerald-500 to-teal-600", route: "/activities?recommended=true&type=grounding", accentColor: "emerald" },
    ],
    afternoon: [
        { id: "focus-pm", emoji: "🎯", title: "Focus Reset", duration: "5 min", gradient: "from-amber-500 to-orange-600", route: "/activities?recommended=true&type=meditation", accentColor: "amber" },
        { id: "move-pm", emoji: "🤸", title: "Energy Flow", duration: "7 min", gradient: "from-rose-500 to-pink-600", route: "/activities?recommended=true&type=movement", accentColor: "rose" },
        { id: "breath-pm", emoji: "💨", title: "Box Breathing", duration: "3 min", gradient: "from-sky-500 to-blue-600", route: "/activities?recommended=true&type=breathing", accentColor: "sky" },
    ],
    evening: [
        { id: "reflect-ev", emoji: "🌙", title: "Day Reflection", duration: "5 min", gradient: "from-indigo-500 to-slate-600", route: "/voice-journal", accentColor: "indigo" },
        { id: "release-ev", emoji: "🫶", title: "Somatic Release", duration: "8 min", gradient: "from-violet-500 to-indigo-600", route: "/activities?recommended=true&type=somatic", accentColor: "violet" },
        { id: "wind-ev", emoji: "✨", title: "Wind Down", duration: "6 min", gradient: "from-slate-600 to-slate-800", route: "/activities?recommended=true&type=meditation", accentColor: "slate" },
    ],
};

// Confetti component
function Confetti() {
    const pieces = Array.from({ length: 20 }, (_, i) => i);
    return (
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
            {pieces.map(i => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    initial={{
                        x: `${30 + Math.random() * 40}vw`,
                        y: "-10px",
                        rotate: 0,
                        opacity: 1,
                        scale: 1,
                        backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"][i % 5],
                    }}
                    animate={{
                        y: "110vh",
                        rotate: Math.random() > 0.5 ? 720 : -720,
                        x: `${30 + Math.random() * 40}vw`,
                        opacity: [1, 1, 0],
                        scale: [1, 1, 0.5],
                    }}
                    transition={{ duration: 2 + Math.random() * 1.5, ease: "easeIn", delay: Math.random() * 0.5 }}
                />
            ))}
        </div>
    );
}

interface TodaysProtocolProps {
    onAllComplete?: () => void;
}

export function TodaysProtocol({ onAllComplete }: TodaysProtocolProps) {
    const [, setLocation] = useLocation();
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const tod = getTimeOfDay();
    const cards = PROTOCOL_SETS[tod];

    const handleComplete = (cardId: string) => {
        const next = new Set(completed).add(cardId);
        setCompleted(next);
        if (next.size === cards.length) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            onAllComplete?.();
        }
    };

    const todLabel = { morning: "☀️ Morning", afternoon: "⚡ Afternoon", evening: "🌙 Evening" }[tod];

    return (
        <>
            {showConfetti && <Confetti />}
            <div className="w-full">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{todLabel} Protocol</span>
                    <span className="text-[10px] text-slate-500 font-bold">{completed.size}/{cards.length} done</span>
                </div>

                {/* Horizontal scroll strip */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    {cards.map((card, idx) => {
                        const done = completed.has(card.id);
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.08 }}
                                className="relative flex-none w-[130px] snap-start"
                            >
                                {/* Story-ring glow */}
                                <div className={`absolute -inset-[3px] rounded-[22px] transition-all duration-500 ${done
                                        ? "bg-slate-800/60"
                                        : `bg-gradient-to-tr ${card.gradient} opacity-90`
                                    }`} />

                                <div
                                    className={`relative m-[3px] rounded-[20px] p-4 cursor-pointer select-none transition-all duration-300 ${done ? "bg-slate-900/95" : "bg-slate-950 hover:bg-slate-900"
                                        }`}
                                    onClick={() => {
                                        if (!done) {
                                            handleComplete(card.id);
                                            setLocation(card.route);
                                        }
                                    }}
                                >
                                    {/* Check overlay when done */}
                                    <AnimatePresence>
                                        {done && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute top-2 right-2"
                                            >
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="text-2xl mb-3">{card.emoji}</div>
                                    <div className={`text-xs font-black leading-tight mb-1 ${done ? "text-slate-500" : "text-white"}`}>
                                        {card.title}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{card.duration}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* All done celebration */}
                <AnimatePresence>
                    {completed.size === cards.length && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 text-center"
                        >
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">🎉 Protocol Complete!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
