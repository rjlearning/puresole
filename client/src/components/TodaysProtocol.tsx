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
    category: string; // maps to real activity category
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

const PROTOCOL_SETS: Record<string, ProtocolCard[]> = {
    morning: [
        { id: "breath-am", emoji: "🫁", title: "Morning Breath", duration: "3 min", gradient: "from-sky-500 to-indigo-600", category: "breathing" },
        { id: "journal-am", emoji: "📝", title: "Set Intentions", duration: "5 min", gradient: "from-violet-500 to-purple-600", category: "journaling" },
        { id: "ground-am", emoji: "🌍", title: "Body Scan", duration: "4 min", gradient: "from-emerald-500 to-teal-600", category: "grounding" },
    ],
    afternoon: [
        { id: "focus-pm", emoji: "🎯", title: "Focus Reset", duration: "5 min", gradient: "from-amber-500 to-orange-600", category: "meditation" },
        { id: "move-pm", emoji: "🤸", title: "Energy Flow", duration: "7 min", gradient: "from-rose-500 to-pink-600", category: "movement" },
        { id: "breath-pm", emoji: "💨", title: "Box Breathing", duration: "3 min", gradient: "from-sky-500 to-blue-600", category: "breathing" },
    ],
    evening: [
        { id: "reflect-ev", emoji: "🌙", title: "Day Reflect", duration: "5 min", gradient: "from-indigo-500 to-slate-600", category: "journaling" },
        { id: "release-ev", emoji: "🫶", title: "Somatic Release", duration: "8 min", gradient: "from-violet-500 to-indigo-600", category: "somatic" },
        { id: "wind-ev", emoji: "✨", title: "Wind Down", duration: "6 min", gradient: "from-slate-600 to-slate-800", category: "meditation" },
    ],
};

// Confetti that sprays at completion
function Confetti() {
    const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4"];
    return (
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
            {Array.from({ length: 24 }, (_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    initial={{ x: `${25 + Math.random() * 50}vw`, y: "-10px", rotate: 0, opacity: 1 }}
                    animate={{ y: "105vh", rotate: Math.random() > 0.5 ? 720 : -540, x: `${Math.random() * 100}vw`, opacity: [1, 1, 0] }}
                    transition={{ duration: 1.8 + Math.random() * 1.4, ease: "easeIn", delay: Math.random() * 0.6 }}
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
    const todLabel = { morning: "☀️ Morning", afternoon: "⚡ Afternoon", evening: "🌙 Evening" }[tod];

    const handleCardTap = (card: ProtocolCard) => {
        if (completed.has(card.id)) return;

        // Mark complete optimistically
        const next = new Set(completed).add(card.id);
        setCompleted(next);

        if (next.size === cards.length) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3200);
            onAllComplete?.();
        }

        // Navigate to the right activity category
        if (card.category === "journaling") {
            setLocation("/voice-journal");
        } else {
            setLocation(`/activities?recommended=true&category=${card.category}`);
        }
    };

    return (
        <>
            {showConfetti && <Confetti />}

            <div className="w-full">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{todLabel} Protocol</span>
                    <span className="text-[10px] text-slate-500 font-bold tabular-nums">{completed.size}/{cards.length} done</span>
                </div>

                {/* Scrollable story strip */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                    {cards.map((card, idx) => {
                        const done = completed.has(card.id);
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.07 }}
                                className="relative flex-none w-[126px] snap-start cursor-pointer select-none"
                                onClick={() => handleCardTap(card)}
                            >
                                {/* Story glow ring */}
                                <div
                                    className={`absolute -inset-[3px] rounded-[22px] transition-all duration-500 ${done ? "bg-slate-800/40" : `bg-gradient-to-tr ${card.gradient}`
                                        }`}
                                />

                                <div
                                    className={`relative m-[3px] rounded-[20px] p-4 transition-all duration-300 ${done ? "bg-slate-900/90 opacity-60" : "bg-slate-950 active:scale-95"
                                        }`}
                                >
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
                                    <div className={`text-xs font-black leading-tight mb-1.5 ${done ? "text-slate-600" : "text-white"}`}>
                                        {card.title}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{card.duration}</div>

                                    {!done && (
                                        <div className={`mt-3 text-[9px] font-black uppercase tracking-widest text-center py-1 rounded-full bg-gradient-to-r ${card.gradient} text-white/90`}>
                                            Start
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* All done */}
                <AnimatePresence>
                    {completed.size === cards.length && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 text-center py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">🎉 Protocol Complete — Streak Updated!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
