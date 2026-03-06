import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Trophy, Zap } from "lucide-react";
import { getStreak, hoursUntilStreakReset, hasCheckedInToday, StreakState } from "@/lib/streakEngine";

const MILESTONES = [3, 7, 14, 30, 60, 100];

function getMilestoneLabel(streak: number): string | null {
    if (streak >= 100) return "🏆 Legend";
    if (streak >= 60) return "⚡ Unstoppable";
    if (streak >= 30) return "🌟 Warrior";
    if (streak >= 14) return "💎 Devoted";
    if (streak >= 7) return "🔥 On Fire";
    if (streak >= 3) return "✨ Building";
    return null;
}

export function DailyStreakBanner({ onStreakCheck }: { onStreakCheck?: (streak: number) => void }) {
    const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, lastCheckInDate: null, longestStreak: 0 });
    const [expanded, setExpanded] = useState(false);
    const [hoursLeft, setHoursLeft] = useState(0);

    useEffect(() => {
        const s = getStreak();
        setStreak(s);
        setHoursLeft(hoursUntilStreakReset());
        onStreakCheck?.(s.currentStreak);
    }, []);

    const n = streak.currentStreak;
    const checkedInToday = hasCheckedInToday();
    const milestoneLabel = getMilestoneLabel(n);
    const isOnFire = n >= 7;

    // Next milestone progress
    const nextMilestone = MILESTONES.find(m => m > n) ?? 100;
    const prevMilestone = [...MILESTONES].reverse().find(m => m <= n) ?? 0;
    const pct = nextMilestone > 0 ? ((n - prevMilestone) / (nextMilestone - prevMilestone)) * 100 : 100;

    return (
        <>
            {/* Pill banner */}
            <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setExpanded(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isOnFire
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/40 hover:border-amber-400/60"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
            >
                <motion.span
                    animate={isOnFire ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-base"
                >
                    🔥
                </motion.span>
                <span className={`font-black text-sm tabular-nums ${isOnFire ? "text-amber-400" : "text-slate-300"}`}>
                    {n}
                </span>
                <span className="text-slate-500 text-xs font-medium">day streak</span>
                {milestoneLabel && (
                    <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-amber-400/70">{milestoneLabel}</span>
                )}
                {/* FOMO nudge when not checked in and within 3h of midnight */}
                {!checkedInToday && hoursLeft <= 3 && n > 0 && (
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-1 text-[10px] font-black text-rose-400 uppercase"
                    >
                        {hoursLeft}h left!
                    </motion.span>
                )}
            </motion.button>

            {/* Expanded modal */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-end justify-center p-4"
                        onClick={() => setExpanded(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 pb-8"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-white">Your Journey</h3>
                                <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            {/* Big streak number */}
                            <div className="text-center mb-8">
                                <div className="text-7xl font-black text-white mb-1 tabular-nums">{n}</div>
                                <div className="text-slate-400 font-medium">day streak</div>
                                {milestoneLabel && (
                                    <div className="mt-2 text-lg font-bold text-amber-400">{milestoneLabel}</div>
                                )}
                            </div>

                            {/* Progress to next milestone */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
                                    <span>{prevMilestone}d</span>
                                    <span>Next: {nextMilestone}d</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-800/60 rounded-2xl p-4 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div className="text-2xl font-black text-white">{streak.longestStreak}</div>
                                    <div className="text-xs text-slate-500 font-medium">Longest streak</div>
                                </div>
                                <div className="bg-slate-800/60 rounded-2xl p-4 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Zap className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div className="text-2xl font-black text-white">{checkedInToday ? "✓" : `${hoursLeft}h`}</div>
                                    <div className="text-xs text-slate-500 font-medium">{checkedInToday ? "Done today" : "Until reset"}</div>
                                </div>
                            </div>

                            {/* Milestones row */}
                            <div className="mt-6 flex justify-between gap-1">
                                {MILESTONES.map(m => (
                                    <div
                                        key={m}
                                        className={`flex-1 text-center py-2 rounded-xl text-xs font-black transition-all ${n >= m
                                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                : "bg-slate-800/40 text-slate-600"
                                            }`}
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
