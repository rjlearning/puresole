import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import {
    MessageCircle, ClipboardCheck, Moon, Heart, HeartPulse,
    Users, Baby, ChevronRight, Sparkles, Activity, ArrowRight, Brain, ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { WellnessHalo } from '@/components/voice/WellnessHalo';
import { motion, AnimatePresence } from 'framer-motion';

const STAGE_LABELS: Record<string, string> = {
    trimester4: 'Fourth Trimester',
    early: 'Early Postpartum',
    middle: 'Matrescence',
    late: 'Late Postpartum',
    weaning: 'Weaning Phase',
    general: 'General Wellness',
};

export default function WomenPage() {
    const [stage, setStage] = useState('general');
    const [cycleData, setCycleData] = useState({ day: 1, phase: 'follicular' as any });
    const [bodyData, setBodyData] = useState({ sleep: 7.5, energy: 3 });

    useEffect(() => {
        const saved = localStorage.getItem('women_stage');
        if (saved) setStage(saved);

        // Load previews from storage
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

    const stageLabel = STAGE_LABELS[stage] || 'General Wellness';

    const bentoVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="min-h-screen pb-32 bg-[#fafafa]">
            {/* Top Navigation & Status */}
            <div className="relative overflow-hidden bg-white border-b border-slate-100 pt-20">
                <div className="max-w-6xl mx-auto px-6 pb-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Innovative Wellness Bloom Area */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-4 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Bio-Hormonal Sync Active</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Your Wellness <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-500">Bloom</span>
                        </h1>
                        <p className="text-slate-500 max-w-md leading-relaxed mb-8">
                            A workspace built around your biology. Synchronizing your physical recovery, hormonal cycles, and emotional identity.
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {Object.entries(STAGE_LABELS).map(([id, label]) => (
                                <button
                                    key={id}
                                    onClick={() => { setStage(id); localStorage.setItem('women_stage', id); }}
                                    className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${stage === id
                                        ? 'bg-slate-900 text-white shadow-xl scale-105'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <WellnessHalo stage={stage} energyLevel={bodyData.energy} />
                    </div>
                </div>

                {/* Subtle Neural Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            {/* Bento Grid Dashboard */}
            <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {/* Primary Companion Action - Large Span */}
                    <motion.div
                        custom={0} variants={bentoVariants} initial="hidden" animate="visible"
                        className="md:col-span-2 md:row-span-2 group"
                    >
                        <Link href="/women/companion">
                            <div className="h-full rounded-[2.5rem] bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 p-8 text-white relative overflow-hidden cursor-pointer shadow-2xl hover:shadow-rose-200/50 transition-all border-4 border-white">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-auto">
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                            <MessageCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl">Emotional Companion</h3>
                                            <p className="text-white/70 text-sm">Postpartum-aware AI support</p>
                                        </div>
                                    </div>

                                    <div className="mt-12 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem]">
                                        <p className="text-sm font-medium mb-4 italic text-white/90">
                                            "How are you feeling today? Based on your stage being {stageLabel}, it's normal to feel a range of shifts."
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white text-rose-500 w-max px-4 py-2 rounded-full">
                                            Start New Session <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {/* Aesthetic Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Cycle & Hormones - Square */}
                    <motion.div
                        custom={1} variants={bentoVariants} initial="hidden" animate="visible"
                        className="group"
                    >
                        <Link href="/women/cycle">
                            <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 p-6 cursor-pointer hover:border-purple-200 hover:shadow-xl transition-all shadow-sm flex flex-col">
                                <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                                    <Moon className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="font-black text-slate-900 mb-1">Cycle Phase</h3>
                                <p className="text-xs text-slate-400 mb-4">Day {cycleData.day} of cycle</p>
                                <div className="mt-auto">
                                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                        Follicular
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Body & Recovery */}
                    <motion.div
                        custom={2} variants={bentoVariants} initial="hidden" animate="visible"
                        className="group"
                    >
                        <Link href="/women/body">
                            <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 p-6 cursor-pointer hover:border-teal-200 hover:shadow-xl transition-all shadow-sm flex flex-col">
                                <div className="bg-teal-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                                    <HeartPulse className="w-6 h-6 text-teal-500" />
                                </div>
                                <h3 className="font-black text-slate-900 mb-1">Recovery</h3>
                                <p className="text-xs text-slate-400 mb-4">{bodyData.sleep}h Sleep · Energy {bodyData.energy}/5</p>
                                <div className="mt-auto flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= bodyData.energy ? 'bg-teal-400' : 'bg-slate-100'}`} />
                                    ))}
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Metabolic Card - Wide in mobile */}
                    <motion.div
                        custom={3} variants={bentoVariants} initial="hidden" animate="visible"
                        className="md:col-span-1 group"
                    >
                        <Link href="/women/metabolic">
                            <div className="h-full rounded-[2.5rem] bg-slate-900 p-6 text-white cursor-pointer hover:scale-[1.02] transition-all shadow-xl">
                                <Activity className="w-6 h-6 text-amber-400 mb-4" />
                                <h3 className="font-black text-lg mb-1">Metabolic</h3>
                                <p className="text-xs text-slate-400 mb-4 italic">Biomarker-led precision</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Syncing...</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Mood Check-In */}
                    <motion.div
                        custom={4} variants={bentoVariants} initial="hidden" animate="visible"
                        className="group"
                    >
                        <Link href="/women/checkin">
                            <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 p-6 cursor-pointer hover:border-rose-200 hover:shadow-xl transition-all shadow-sm">
                                <ClipboardCheck className="w-6 h-6 text-rose-400 mb-4" />
                                <h3 className="font-bold text-slate-900 mb-1">Mood Check</h3>
                                <p className="text-xs text-slate-400 leading-snug">EPDS · GAD-7 screening</p>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Family & Partner */}
                    <motion.div
                        custom={5} variants={bentoVariants} initial="hidden" animate="visible"
                        className="md:col-span-2 group"
                    >
                        <Link href="/women/relationships">
                            <div className="h-full rounded-[2.5rem] bg-amber-50 border border-amber-100 p-6 cursor-pointer hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center gap-6">
                                <div className="bg-amber-100 w-16 h-16 rounded-[1.5rem] flex-shrink-0 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-amber-900 mb-1">Partner & Family</h3>
                                    <p className="text-sm text-amber-700/70">Navigate identity shifts and invisible labor together.</p>
                                </div>
                                <div className="ml-auto bg-white p-3 rounded-2xl text-amber-600">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Personalized Setup CTA */}
            <div className="max-w-6xl mx-auto px-6 mt-12">
                <Link href="/women/onboarding">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center">
                                <Brain className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Precision Protocol</h3>
                                <p className="text-sm text-slate-500">Configure your biomarkers and nutrition based on lab results.</p>
                            </div>
                        </div>
                        <Button className="rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-slate-900 text-white font-black transition-all">
                            Personalize My Hub
                        </Button>
                    </div>
                </Link>
            </div>

            {/* Safety Footer */}
            <div className="max-w-2xl mx-auto px-6 mt-16 text-center">
                <div className="inline-flex items-center gap-2 mb-4 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medical Disclaimer</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                    This workspace provides emotional support and wellness tracking — not medical advice.
                    Always consult with your specialist for clinical concerns.
                </p>
            </div>
        </div>
    );
}
