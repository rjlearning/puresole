
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
    Activity,
    Moon,
    MessageCircle,
    Sparkles,
    Play,
    ArrowUpRight,
    Calendar,
    Smile,
    Zap
} from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import type { Assessment, TreatmentPlan } from "@shared/schema";
import { motion, AnimatePresence } from 'framer-motion';

export default function UnifiedDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    // Read from sessionStorage to see if we've already played the intro this session
    const [showIntro, setShowIntro] = useState(() => {
        return sessionStorage.getItem('soul_sync_seen') !== 'true';
    });

    useEffect(() => {
        if (!showIntro) return;

        // Run intro only once per mount
        const timer = setTimeout(() => {
            setShowIntro(false);
            sessionStorage.setItem('soul_sync_seen', 'true');
        }, 2200);
        return () => clearTimeout(timer);
    }, [showIntro]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { data: assessments = [] } = useQuery<Assessment[]>({
        queryKey: ["/api/assessments"],
    });

    const { data: dailyInsight, isLoading: isInsightLoading } = useQuery<{ description: string }>({
        queryKey: ["/api/dashboard/insights"],
        staleTime: 1000 * 60 * 60, // Consider fresh for 1 hour to prevent constant re-fetching
    });

    const { data: userSeason, isLoading: isSeasonLoading } = useQuery<{ title: string, description: string }>({
        queryKey: ["/api/dashboard/season"],
        staleTime: 1000 * 60 * 60,
    });

    const bentoVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 15 },
        visible: (i: number) => ({
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        })
    };

    return (
        <AnimatePresence mode="wait">
            {showIntro ? (
                <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
                >
                    {/* Dark Cosmic Orb Effect */}
                    <div className="relative flex items-center justify-center w-64 h-64 mb-8">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[60px]"
                        />
                        <motion.div
                            animate={{ scale: [1, 0.9, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            className="absolute w-32 h-32 bg-rose-500/30 rounded-full blur-[40px]"
                        />
                        <div className="relative z-10 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="text-2xl md:text-3xl font-serif italic text-white/90 tracking-wide text-center px-6"
                    >
                        Syncing your world, {user?.firstName ? user.firstName : 'Friend'}...
                    </motion.h1>

                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </motion.div>
            ) : (
                <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 min-h-screen bg-[#fafafa] p-6 font-sans text-slate-800 relative"
                >
                    {/* Subtle Neural Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 pt-4 md:pt-6 pb-24 px-2 md:px-0 relative z-10">

                        {/* Premium Header */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-1">
                                    {(() => {
                                        const hour = currentTime.getHours();
                                        if (hour < 12) return "Good Morning";
                                        if (hour < 17) return "Good Afternoon";
                                        return "Good Evening";
                                    })()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-400">{user?.firstName || 'Friend'}</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white border border-slate-100 shadow-sm rounded-full px-5 py-2.5 flex items-center gap-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">System Synced</span>
                            </motion.div>
                        </header>

                        {/* Bento Grid - 2.5rem Smooth Overhaul */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[160px] md:auto-rows-[200px]">

                            {/* AI Companion Hero */}
                            <motion.div custom={0} variants={bentoVariants} initial="hidden" animate="visible" className="row-span-2 md:col-span-2 md:row-span-2">
                                <Link href="/ai-companion">
                                    <div className="h-full rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 p-6 md:p-8 flex flex-col justify-between cursor-pointer group relative overflow-hidden shadow-2xl hover:shadow-indigo-500/20 transition-all border border-slate-800">
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse-slow" />
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight group-hover:text-indigo-200 transition-colors">Quantum AI Companion</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">Analyze emotions safely, without judgment.</p>
                                        </div>

                                        <div className="relative z-10 flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-widest bg-white/10 text-white w-max px-4 py-2 rounded-full border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all">
                                            Begin Session <ArrowUpRight className="w-4 h-4" />
                                        </div>

                                        {/* Cinematic Background Glows */}
                                        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                                        <div className="absolute left-0 bottom-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] -ml-20 -mb-20"></div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Current Season (Informational Banner) */}
                            <motion.div custom={1} variants={bentoVariants} initial="hidden" animate="visible" className="md:col-span-2">
                                <div className="h-full rounded-[2rem] bg-slate-50/80 border border-slate-200/60 p-5 flex flex-col justify-center relative overflow-hidden">
                                    <div className="relative z-10 w-full flex items-center gap-4">
                                        <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-indigo-400 flex-shrink-0">
                                            <Smile className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isSeasonLoading ? (
                                                <div className="space-y-2 animate-pulse mt-1">
                                                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-48 mt-2"></div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 line-clamp-1">Your Present Era</div>
                                                    <div className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1 truncate">
                                                        {userSeason?.title || "Season of Discovery"}
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-500 leading-snug line-clamp-2">
                                                        {userSeason?.description || "Every step forward is worth acknowledging."}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Subtle pattern instead of glow to indicate it's not a button */}
                                    <div className="absolute right-0 top-0 w-24 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200/50 to-transparent opacity-50 pointer-events-none"></div>
                                </div>
                            </motion.div>

                            {/* Quick Start Journal (1x1) */}
                            <motion.div custom={2} variants={bentoVariants} initial="hidden" animate="visible">
                                <Link href="/voice-journal">
                                    <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-6 flex flex-col justify-between cursor-pointer group hover:border-rose-200 hover:shadow-xl transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
                                            <MessageCircle className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Vocal Journal</h3>
                                            <p className="text-sm text-slate-400 font-medium">Record thought</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Activities (1x1) */}
                            <motion.div custom={3} variants={bentoVariants} initial="hidden" animate="visible">
                                <Link href="/activities">
                                    <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-6 flex flex-col justify-between cursor-pointer group hover:border-amber-200 hover:shadow-xl transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                                            <Zap className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Activities</h3>
                                            <p className="text-sm text-slate-400 font-medium">Explore flows</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Quote/Daily Vibe (2x1) */}
                            <motion.div custom={4} variants={bentoVariants} initial="hidden" animate="visible" className="md:col-span-2">
                                <div className="h-full rounded-[2.5rem] p-8 flex items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 border border-indigo-100 group">
                                    <div className="relative z-10 w-full px-4">
                                        {isInsightLoading ? (
                                            <div className="space-y-3 max-w-md mx-auto animate-pulse flex flex-col items-center">
                                                <div className="h-4 bg-indigo-200/50 rounded w-3/4"></div>
                                                <div className="h-4 bg-indigo-200/50 rounded w-1/2"></div>
                                            </div>
                                        ) : (
                                            <p className="text-xl md:text-2xl font-serif italic text-slate-700 leading-relaxed font-medium">
                                                "{dailyInsight?.description || 'You are doing enough, just by breathing.'}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Sleep Link (2x1 mobile, 1x1 desktop - spans empty space) */}
                            <motion.div custom={5} variants={bentoVariants} initial="hidden" animate="visible" className="md:col-span-2">
                                <Link href="/sleep">
                                    <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-8 flex flex-row items-center cursor-pointer group hover:border-purple-200 hover:shadow-xl transition-all gap-6">
                                        <div className="w-16 h-16 rounded-3xl bg-purple-50 flex-shrink-0 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                                            <Moon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Sleep & Restore</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-snug">AI-guided sleep tracking.</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
