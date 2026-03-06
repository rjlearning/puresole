import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import { Flame, Check, Lock, ChevronRight } from "lucide-react";

// ── Protocol card config ──────────────────────────────────────────────────────

interface ProtocolCard {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    duration: string;
    color: string;         // for glow / gradient
    colorRgb: string;      // for box-shadow rgba
    category: string;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

const PROTOCOL_SETS: Record<string, ProtocolCard[]> = {
    morning: [
        { id: "breath-am", emoji: "🌬️", title: "Breath Expansion", subtitle: "Oxygenate body & mind", duration: "3 min", color: "from-sky-400 to-indigo-500", colorRgb: "99,102,241", category: "breathing" },
        { id: "journal-am", emoji: "🌅", title: "Set Intentions", subtitle: "Anchor your purpose today", duration: "5 min", color: "from-violet-400 to-purple-600", colorRgb: "167,139,250", category: "journaling" },
        { id: "ground-am", emoji: "🌿", title: "Body Scan", subtitle: "Feel grounded in the now", duration: "4 min", color: "from-emerald-400 to-teal-600", colorRgb: "52,211,153", category: "grounding" },
    ],
    afternoon: [
        { id: "focus-pm", emoji: "🎯", title: "Focus Reset", subtitle: "Clear mental fog, sharpen edge", duration: "5 min", color: "from-amber-400 to-orange-500", colorRgb: "251,191,36", category: "meditation" },
        { id: "move-pm", emoji: "⚡", title: "Energy Flow", subtitle: "Move stagnant energy", duration: "7 min", color: "from-rose-400 to-pink-600", colorRgb: "251,113,133", category: "movement" },
        { id: "breath-pm", emoji: "🌊", title: "Box Breathing", subtitle: "Regulate nervous system", duration: "3 min", color: "from-sky-400 to-blue-600", colorRgb: "56,189,248", category: "breathing" },
    ],
    evening: [
        { id: "reflect-ev", emoji: "🌙", title: "Day Reflection", subtitle: "Process, release, integrate", duration: "5 min", color: "from-indigo-400 to-slate-500", colorRgb: "129,140,248", category: "journaling" },
        { id: "release-ev", emoji: "🫶", title: "Somatic Release", subtitle: "Melt the tension away", duration: "8 min", color: "from-violet-400 to-indigo-600", colorRgb: "167,139,250", category: "somatic" },
        { id: "wind-ev", emoji: "✨", title: "Wind Down", subtitle: "Prepare for deep restoration", duration: "6 min", color: "from-slate-500 to-slate-700", colorRgb: "148,163,184", category: "meditation" },
    ],
};

const TOD_LABELS: Record<string, string> = {
    morning: "Morning Ritual",
    afternoon: "Afternoon Reset",
    evening: "Evening Wind-Down",
};

const TOD_EMOJIS: Record<string, string> = {
    morning: "☀️",
    afternoon: "⚡",
    evening: "🌙",
};

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
    const colors = ["#6366f1", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899"];
    return (
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
            {Array.from({ length: 32 }, (_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: colors[i % colors.length] }}
                    initial={{ x: `${20 + Math.random() * 60}vw`, y: "-10px", rotate: 0, opacity: 1, scale: 1 }}
                    animate={{ y: "108vh", rotate: Math.random() > 0.5 ? 720 : -540, x: `${Math.random() * 100}vw`, opacity: [1, 1, 0], scale: [1, 1, 0.4] }}
                    transition={{ duration: 1.8 + Math.random() * 1.5, ease: "easeIn", delay: Math.random() * 0.8 }}
                />
            ))}
        </div>
    );
}

// ── Single ritual card ────────────────────────────────────────────────────────
function RitualCard({ card, index, isLocked, isDone, onStart }: {
    card: ProtocolCard;
    index: number;
    isLocked: boolean;
    isDone: boolean;
    onStart: () => void;
}) {
    const [hovering, setHovering] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12, type: "spring", stiffness: 200, damping: 20 }}
            onHoverStart={() => !isLocked && !isDone && setHovering(true)}
            onHoverEnd={() => setHovering(false)}
            onClick={() => !isLocked && !isDone && onStart()}
            className="relative cursor-pointer select-none"
            style={{ userSelect: "none" }}
        >
            {/* Ambient glow orb — pulses on hover */}
            <motion.div
                className={`absolute -inset-2 rounded-[2.5rem] blur-2xl bg-gradient-to-br ${card.color} opacity-0 pointer-events-none`}
                animate={{ opacity: hovering ? 0.35 : isDone ? 0.08 : 0 }}
                transition={{ duration: 0.4 }}
            />

            {/* Card body */}
            <motion.div
                animate={
                    !isDone && !isLocked
                        ? {
                            boxShadow: hovering
                                ? `0 0 40px 4px rgba(${card.colorRgb}, 0.35), 0 0 0 1.5px rgba(${card.colorRgb}, 0.5)`
                                : `0 0 0 1px rgba(${card.colorRgb}, 0.15)`
                        }
                        : { boxShadow: "0 0 0 1px rgba(71,85,105,0.4)" }
                }
                transition={{ duration: 0.4 }}
                className={`relative rounded-[2rem] p-5 overflow-hidden transition-all duration-300 ${isDone
                    ? "bg-slate-900/60 opacity-60"
                    : isLocked
                        ? "bg-slate-900/40 opacity-50"
                        : "bg-slate-900"
                    }`}
            >
                {/* Breathing glow inside card */}
                {!isDone && !isLocked && (
                    <div
                        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${card.color} blur-3xl opacity-10 pointer-events-none`}
                    />
                )}

                <div className="flex items-center gap-4 relative z-10">
                    {/* Emoji with pulsing ring */}
                    <div className="relative shrink-0">
                        {!isDone && !isLocked && (
                            <div
                                className={`absolute -inset-2 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-md`}
                            />
                        )}
                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDone
                            ? "bg-slate-800/60"
                            : isLocked
                                ? "bg-slate-800/40"
                                : `bg-gradient-to-br ${card.color} shadow-lg`
                            }`}>
                            {isLocked ? <Lock className="w-5 h-5 text-slate-600" /> : card.emoji}
                        </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-base leading-tight mb-0.5 ${isDone ? "text-slate-600 line-through" : isLocked ? "text-slate-700" : "text-white"}`}>
                            {card.title}
                        </h3>
                        <p className={`text-xs leading-snug ${isDone || isLocked ? "text-slate-700" : "text-slate-400"}`}>
                            {card.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? "text-slate-700" : isLocked ? "text-slate-700" : `text-slate-500`}`}>
                                {card.duration}
                            </span>
                        </div>
                    </div>

                    {/* Right CTA */}
                    <div className="shrink-0">
                        {isDone ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                                className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
                            >
                                <Check className="w-5 h-5 text-emerald-400" />
                            </motion.div>
                        ) : isLocked ? (
                            <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-slate-700" />
                            </div>
                        ) : (
                            <motion.div
                                animate={hovering ? { scale: 1.15 } : { scale: 1 }}
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                            >
                                <ChevronRight className="w-5 h-5 text-white font-black" />
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Connecting line to next card */}
            {index < 2 && (
                <div className="flex justify-center py-1">
                    <div className={`w-0.5 h-4 rounded-full transition-all duration-700 ${isDone ? "bg-emerald-500/40" : "bg-slate-800"}`} />
                </div>
            )}
        </motion.div>
    );
}

// ── Main Section ──────────────────────────────────────────────────────────────
interface TodaysProtocolProps {
    onAllComplete?: () => void;
}

export function TodaysProtocol({ onAllComplete }: TodaysProtocolProps) {
    const [, setLocation] = useLocation();
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [allDone, setAllDone] = useState(false);

    const tod = getTimeOfDay();
    const cards = PROTOCOL_SETS[tod];

    // Sequential unlock — card N+1 is locked until card N is done
    const isLocked = (idx: number) => idx > 0 && !completed.has(cards[idx - 1].id);

    const handleStart = (card: ProtocolCard, idx: number) => {
        const next = new Set(completed).add(card.id);
        setCompleted(next);

        if (next.size === cards.length) {
            setShowConfetti(true);
            setAllDone(true);
            setTimeout(() => setShowConfetti(false), 3500);
            onAllComplete?.();
        }

        // Navigate after brief delay so the completion animation fires
        setTimeout(() => {
            if (card.category === "journaling") {
                setLocation("/voice-journal");
            } else {
                setLocation(`/activities?recommended=true&category=${card.category}`);
            }
        }, 350);
    };

    const doneCount = completed.size;
    const pct = Math.round((doneCount / cards.length) * 100);

    return (
        <>
            {showConfetti && <Confetti />}

            <div className="relative">
                {/* Static ambient background — no animation to block scroll */}
                <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-indigo-900/15 via-transparent to-slate-900/0 pointer-events-none blur-xl" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5 px-1">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-lg">{TOD_EMOJIS[tod]}</span>
                                <h3 className="text-sm font-black text-white tracking-tight">{TOD_LABELS[tod]}</h3>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-7">
                                {doneCount === cards.length ? "✓ Complete" : `${doneCount} of ${cards.length} rituals done`}
                            </p>
                        </div>

                        {/* Circular progress ring */}
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
                                <motion.circle
                                    cx="20" cy="20" r="16"
                                    fill="none"
                                    stroke="url(#ringGrad)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 16}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - pct / 100) }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#f43f5e" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-black text-white">{pct}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Sequential cards */}
                    {cards.map((card, idx) => (
                        <RitualCard
                            key={card.id}
                            card={card}
                            index={idx}
                            isLocked={isLocked(idx)}
                            isDone={completed.has(card.id)}
                            onStart={() => handleStart(card, idx)}
                        />
                    ))}

                    {/* Completion state */}
                    <AnimatePresence>
                        {allDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 text-center py-4 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20"
                            >
                                <p className="text-sm font-black text-emerald-400">🎉 Ritual complete — your streak grew!</p>
                                <p className="text-[10px] text-slate-500 mt-1">See you tomorrow for another round.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
