import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
    ClipboardCheck, Moon, HeartPulse,
    Users, ChevronRight, Activity, Brain, ShieldCheck, Sparkles,
    Dna, Zap, ArrowRight, ArrowLeft, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { usePhase } from '@/context/PhaseContext';
import { useQuery } from '@tanstack/react-query';
import MeshBackground from "@/components/MeshBackground";

export default function MenPage() {
    const { gender } = usePhase();
    const [bodyData, setBodyData] = useState({ sleep: 7.2, energy: 4 });

    const { data: protocol } = useQuery<any>({
        queryKey: ["/api/men/protocol"]
    });

    const { data: metabolic } = useQuery<any>({
        queryKey: ["/api/men/metabolic"]
    });

    useEffect(() => {
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
        <div className="min-h-screen pb-24 text-slate-200 relative max-w-full overflow-x-hidden" data-testid="men-hub">
            <MeshBackground variant="indigo" />

            {/* ── Top Header ── */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/20 backdrop-blur-xl border-b border-white/5 h-16 sm:h-20 flex items-center px-4 sm:px-6">
                <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link href="/dashboard">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </motion.button>
                        </Link>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] leading-none mb-1">Performance Core</p>
                            <h1 className="text-xl font-black text-white tracking-tight truncate">Men's Evolution Hub</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Global Navigation Links integrated into the hub header */}
                        <div className="hidden md:flex items-center gap-6 mr-4 border-r border-white/5 pr-6">
                            <Link href="/community">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-400 cursor-pointer transition-colors">World</span>
                            </Link>
                            <Link href="/lab-results">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-400 cursor-pointer transition-colors">Lab Results</span>
                            </Link>
                            <Link href="/protocols">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-white border-b-2 border-indigo-500 pb-1">Protocols</span>
                            </Link>
                            <Link href="/settings">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-400 cursor-pointer transition-colors">Settings</span>
                            </Link>
                        </div>

                        <Link href="/phase-select">
                            <motion.button whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 transition-all">
                                <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest">Adjust Profile</span>
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">

                {/* ── Hero / Status Bar ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                    <div className="flex-1 text-center sm:text-left">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 mb-5 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em]">Metabolic Scan Active</span>
                        </motion.div>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">
                            Biometric <br />Optimization
                        </h1>
                        <p className="text-sm sm:text-lg text-slate-300 max-w-lg font-medium leading-relaxed mb-6">
                            Precision recovery, testosterone optimization, and cognitive endurance analysis for the high-performance male biology.
                        </p>
                    </div>
                    <div className="relative shrink-0 perspective-1000">
                        {/* Placeholder for a cool 3D element or similar to WellnessHalo but for men */}
                        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-white/5 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 flex items-center justify-center p-8 relative">
                            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500/20 animate-spin" style={{ animationDuration: '8s' }} />
                            <div className="absolute inset-4 rounded-full border-b-2 border-cyan-500/20 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                            <Zap className="w-16 h-16 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                        </div>
                    </div>
                </motion.div>

                {/* ── Bento Dashboard ── */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">

                    {/* Insights - Performance */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-3 lg:row-span-2 group">
                        <div className="h-full min-h-[320px] rounded-[3rem] bg-indigo-950 p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="bg-indigo-500/20 p-4 rounded-[1.5rem] border border-indigo-400/20">
                                            <Sparkles className="w-7 h-7 text-indigo-300" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Cognitive State</span>
                                            <h3 className="font-black text-2xl tracking-tight">Evolutionary Insights</h3>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                                        <p className="text-indigo-50 leading-relaxed font-bold text-lg sm:text-xl">
                                            {protocol?.reasoning ? "Performance Optimization Active" : "Peak recovery window active."}
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                                <p className="text-sm sm:text-base text-indigo-200/90 font-medium">
                                                    {protocol?.reasoning || "Optimal window for high-intensity anaerobic load."}
                                                </p>
                                            </div>
                                            {metabolic?.latestStats && (
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                                    <p className="text-sm sm:text-base text-indigo-200/90 font-medium">
                                                        Testosterone: {metabolic.latestStats.testosterone} {metabolic.latestStats.testosterone > 600 ? '(Optimal)' : '(Analyzing)'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link href="/men/protocol">
                                    <button className="mt-10 flex items-center gap-3 text-indigo-300 font-black text-xs uppercase tracking-[0.25em] group-hover:text-white transition-all">
                                        Performance Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Testosterone/Metabolic - Hero-like card */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-3">
                        <Link href="/men/metabolic">
                            <div className="h-full min-h-[220px] rounded-[3rem] bg-slate-900 border border-white/5 p-8 flex flex-col justify-between items-start cursor-pointer hover:border-indigo-500/30 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all shadow-sm group">
                                <div className="flex justify-between w-full">
                                    <div className="bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Zap className="w-7 h-7 text-indigo-400 fill-indigo-400" />
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/5 h-max">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing</span>
                                    </div>
                                </div>
                                <div className="mt-6 mb-auto">
                                    <h3 className="font-black text-white text-2xl tracking-tight mb-1">Metabolic Core</h3>
                                    <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Testosterone & Glucose balance</p>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <Activity className="w-5 h-5 text-indigo-400" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Structural scanning</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Recovery - Grid item */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Link href="/men/bioscan">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-slate-900 border border-white/5 p-7 flex flex-col cursor-pointer hover:border-cyan-500/30 hover:shadow-xl transition-all shadow-sm">
                                <div className="bg-cyan-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
                                    <HeartPulse className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="font-black text-white text-lg mb-1">Bioscan</h3>
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-6">{bodyData.sleep}h Sleep Protocol</p>
                                <div className="flex gap-1.5 mt-auto">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`h-2 flex-1 rounded-full ${i <= bodyData.energy ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'bg-slate-800'}`} />
                                    ))}
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* DNA/Longetivity - Dark item */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Link href="/men/longevity">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-slate-950 border border-white/5 p-7 text-white cursor-pointer hover:scale-[1.02] transition-all shadow-lg overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                                <Dna className="w-7 h-7 text-indigo-400 mb-6 group-hover:rotate-12 transition-transform" />
                                <h3 className="font-black text-white text-lg mb-1">Longevity</h3>
                                <p className="text-[9px] text-indigo-500/60 font-black uppercase tracking-widest">Biological Age Analysis</p>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex gap-1.5">
                                        <p className="font-black text-white text-base">Longevity Code</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Social/Family */}
                    <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
                        <Link href="/men/identity">
                            <div className="h-full min-h-[180px] rounded-[2.5rem] bg-slate-800/50 p-7 text-white cursor-pointer hover:bg-slate-800 transition-all shadow-xl flex flex-col justify-between group border border-white/5">
                                <Users className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-black text-white text-xl tracking-tight leading-tight">Identity Hub</h3>
                                <p className="text-xs text-slate-300 mt-2 uppercase tracking-widest font-bold">Relational performance</p>
                            </div>
                        </Link>
                    </motion.div>

                </motion.div>

                {/* ── Action Bar ── */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible"
                    className="mt-16">
                    <Link href="/men/protocol">
                        <div className="bg-slate-900 rounded-[3rem] p-8 sm:p-12 border border-white/5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 text-center sm:text-left">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-950 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform shrink-0">
                                    <Brain className="w-10 h-10 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">Phase 1 Activation</h3>
                                    <p className="text-base sm:text-lg text-slate-300 font-medium mt-2 max-w-xl">Initialize biometric alignment for testosterone support and cognitive focus protocols.</p>
                                </div>
                            </div>
                            <Button className="rounded-2xl h-16 px-12 bg-white text-slate-900 hover:bg-indigo-500 hover:text-white font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 shrink-0 w-full lg:w-auto border-none">
                                Start Optimization
                            </Button>
                        </div>
                    </Link>
                </motion.div>

                {/* ── Footer ── */}
                <footer className="mt-24 text-center px-4 pb-12">
                    <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-full border border-white/10 mb-8 group cursor-help hover:bg-white/10 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Precision Quality Guard</span>
                    </div>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 italic leading-relaxed font-medium mb-3">
                        "Your biometric data is encrypted via military-grade protocols. We do not sell your telemetry. This dashboard is for optimization tracking and does not replace medical diagnostics."
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">&copy; 2024 PureSoul AI Precision Health</p>
                </footer>
            </main>
        </div>
    );
}
