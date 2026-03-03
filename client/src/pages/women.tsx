import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
    ClipboardCheck, Moon, HeartPulse,
    Users, ChevronRight, Activity, Brain, ShieldCheck, Sparkles, Droplet,
    Dna, Zap, ArrowRight, ZapOff
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { WellnessHalo } from '@/components/voice/WellnessHalo';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhase } from '@/context/PhaseContext';

export default function WomenPage() {
    const { phase, phaseInfo } = usePhase();
    const [cycleData, setCycleData] = useState({ day: 14, phase: 'ovulatory' });
    const [bodyData, setBodyData] = useState({ sleep: 6.5, energy: 3 });

    useEffect(() => {
        const cDay = localStorage.getItem('cycle_day');
        if (cDay) setCycleData(prev => ({ ...prev, day: parseInt(cDay) }));

        const bEntries = localStorage.getItem('body_entries');
        if (bEntries) {
            try {
                const arr = JSON.parse(bEntries);
                if (arr.length > 0) {
                    const latest = arr[arr.length - 1];
                    setBodyData({ sleep: latest.sleepHours, energy: latest.energy });
                }
            } catch (e) { }
        }
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-50 via-white to-slate-50 overflow-hidden">

            {/* ── Subtle Background Decoral ── */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/20 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/20 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

            {/* ── Top Header ── */}
            <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-b border-rose-100/30 h-16 sm:h-20 flex items-center px-4 sm:px-6">
                <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] leading-none mb-1">Biological Core</p>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Women's Wellness <span className="text-rose-500">Hub</span></h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/phase-select">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 text-[10px] font-black uppercase tracking-widest">
                                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                                Reset Phase
                            </motion.button>
                        </Link>
                        {phase && (
                            <Link href="/phase-select">
                                <motion.button whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition-all">
                                    <span className="text-sm sm:text-base">{phaseInfo.emoji}</span>
                                    <span className="text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest">{phaseInfo.name}</span>
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">

                {/* ── Hero / Status Bar ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                    <div className="flex-1 text-center sm:text-left">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 mb-5 bg-rose-50/80 px-4 py-1.5 rounded-full border border-rose-100 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em]">Bio-Hormonal Sync Active</span>
                        </motion.div>
                        <h2 className="text-3xl sm:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-5">
                            Optimizing for your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-500">{phaseInfo.name} phase</span>.
                        </h2>
                        <p className="text-sm sm:text-lg text-slate-500 max-w-lg font-medium leading-relaxed mb-6">
                            Your biological workspace, structuraly aligned with your cycle for precision recovery and deep physiological insights.
                        </p>
                        <Link href="/phase-select">
                            <motion.button whileTap={{ scale: 0.95 }}
                                className="sm:hidden w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 text-[11px] font-black uppercase tracking-[0.2em]">
                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                Reset Internal Phase
                            </motion.button>
                        </Link>
                    </div>
                    <div className="relative shrink-0 perspective-1000">
                        <motion.div
                            animate={{ rotateY: [0, 5, 0, -5, 0], rotateX: [0, 2, 0, -2, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <WellnessHalo stage={phase || 'general'} energyLevel={bodyData.energy} size={window.innerWidth < 640 ? 240 : 320} />
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Precision Protocol Mastery ── */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
                    <Link href="/women/onboarding">
                        <div className="bg-indigo-950 rounded-[3rem] p-8 sm:p-12 border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 hover:shadow-rose-500/10 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
                            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 text-center sm:text-left">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-900 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform shrink-0">
                                    <Brain className="w-10 h-10 text-rose-400" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 mb-2 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
                                        <Sparkles className="w-3 h-3 text-rose-400" />
                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Foundational Protocol</span>
                                    </div>
                                    <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">Biometric Precision Protocol</h3>
                                    <p className="text-base sm:text-lg text-indigo-200/70 font-medium mt-2 max-w-xl">
                                        Initialize your biometric and endocrine-specific nutrition alignment. Metabolic factors and energy stabilization depend on this protocol.
                                    </p>
                                </div>
                            </div>
                            <Button className="rounded-2xl h-16 px-12 bg-white text-indigo-950 hover:bg-rose-500 hover:text-white font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 shrink-0 w-full lg:w-auto border-none">
                                Start Synchronization
                            </Button>
                        </div>
                    </Link>
                </motion.div>

                {/* ── Bento Dashboard ── */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">

                    {/* Insights - Large Card */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-3 lg:row-span-2 group">
                        <div className="h-full min-h-[320px] rounded-[3rem] bg-indigo-950 p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="bg-indigo-500/20 p-4 rounded-[1.5rem] border border-indigo-400/20">
                                            <Sparkles className="w-7 h-7 text-indigo-300" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Cognitive State</span>
                                            <h3 className="font-black text-2xl tracking-tight">Hub Insights</h3>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                                        <p className="text-indigo-50 leading-relaxed font-bold text-lg sm:text-xl">
                                            Day {cycleData.day} metabolic transition.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-2 h-2 rounded-full bg-rose-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(251,113,133,0.5)]" />
                                                <p className="text-sm sm:text-base text-indigo-200/90 font-medium">Increase complex carb intake (cortisol stability).</p>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                                <p className="text-sm sm:text-base text-indigo-200/90 font-medium">15m Somatic movement for nervous support.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Link href="/dashboard">
                                    <button className="mt-10 flex items-center gap-3 text-indigo-300 font-black text-xs uppercase tracking-[0.25em] group-hover:text-white transition-all">
                                        Clinical Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Cycle Phase - Hero-like card */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-3">
                        <Link href="/women/cycle">
                            <div className="h-full min-h-[220px] rounded-[3rem] bg-white border border-rose-100 p-8 flex flex-col justify-between items-start cursor-pointer hover:border-rose-300 hover:shadow-[0_20px_50px_rgba(251,113,133,0.1)] transition-all shadow-sm group">
                                <div className="flex justify-between w-full">
                                    <div className="bg-rose-50 w-14 h-14 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                                        <Droplet className="w-7 h-7 text-rose-500 fill-rose-500" />
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 h-max">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                                <div className="mt-6 mb-auto">
                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight mb-1">Cycle Symmetry</h3>
                                    <p className="text-xs text-rose-500 font-black uppercase tracking-widest">Day {cycleData.day} · {cycleData.phase}</p>
                                </div>
                                <div className="mt-8 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-rose-100" />)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural tracking</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Recovery - Grid item */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Link href="/women/body">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-white border border-teal-100 p-7 flex flex-col cursor-pointer hover:border-teal-300 hover:shadow-xl transition-all shadow-sm">
                                <div className="bg-teal-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-teal-100">
                                    <HeartPulse className="w-6 h-6 text-teal-500" />
                                </div>
                                <h3 className="font-black text-slate-900 text-lg mb-1">Bioscan</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{bodyData.sleep}h Sleep Protocol</p>
                                <div className="flex gap-1.5 mt-auto">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`h-2 flex-1 rounded-full ${i <= bodyData.energy ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-slate-100'}`} />
                                    ))}
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Metabolic - Dark item */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Link href="/women/metabolic">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-slate-900 border border-slate-800 p-7 text-white cursor-pointer hover:scale-[1.02] transition-all shadow-lg overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
                                <Dna className="w-7 h-7 text-amber-400 mb-6 group-hover:rotate-12 transition-transform" />
                                <h3 className="font-black text-white text-lg mb-1">Metabolic</h3>
                                <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-widest">Precision Biome Scan</p>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map(i => <div key={i} className={`w-1.5 h-4 rounded-full ${i === 1 ? 'bg-amber-500' : 'bg-slate-700'}`} />)}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-amber-400 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Check-In */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
                        <Link href="/women/checkin">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-indigo-500 p-7 text-white cursor-pointer hover:bg-slate-800 transition-all shadow-xl flex flex-col justify-between group">
                                <ClipboardCheck className="w-7 h-7 text-indigo-100 group-hover:text-indigo-400 transition-colors" />
                                <div>
                                    <h3 className="font-black text-white text-xl tracking-tight leading-tight">Mood Core</h3>
                                    <p className="text-xs text-indigo-200/60 mt-2 uppercase tracking-widest font-bold">Bio-feedback screening</p>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Partners - Wide */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-6">
                        <Link href="/women/relationships">
                            <div className="rounded-[3rem] bg-amber-50 border border-amber-100 p-8 flex flex-col sm:flex-row items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-all group overflow-hidden relative shadow-sm gap-6">
                                <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                                    <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center border border-amber-100 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                        <Users className="w-8 h-8 sm:w-10 text-amber-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-xl sm:text-3xl text-amber-900 tracking-tight">Family & Partner Hub</h3>
                                        <p className="text-sm sm:text-base text-amber-700/60 font-medium leading-tight sm:leading-normal">Navigate identity shifts and collective labor.</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl text-amber-400 border border-amber-100 relative z-10 hover:bg-amber-500 hover:text-white transition-all w-full sm:w-auto flex justify-center">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-200/40 to-transparent pointer-events-none" />
                            </div>
                        </Link>
                    </motion.div>

                </motion.div>

                {/* Action Bar Removed - Moved to Top */}

                {/* ── Footer / Safety ── */}
                <footer className="mt-24 text-center px-4 pb-12">
                    <div className="inline-flex items-center gap-3 bg-slate-50 px-6 py-2.5 rounded-full border border-slate-200 mb-8 group cursor-help hover:bg-white transition-colors">
                        <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Clinical Quality Guard</span>
                    </div>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 italic leading-relaxed font-medium mb-3">
                        This environment provides structural support and biological tracking — not a substitute for clinical diagnostics.
                    </p>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">&copy; 2024 PureSoul AI Precision Health</p>
                </footer>
            </main>
        </div>
    );
}
