import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
    Activity,
    Moon,
    MessageCircle,
    Sparkles,
    Play,
    ArrowUpRight,
    Smile,
    Zap,
    CheckCircle2,
    Brain,
    Heart,
    Wind,
    CloudRain,
    Flame,
    Timer,
    ChevronRight,
    ArrowRight,
    ExternalLink,
    Mic
} from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import type { Assessment, TreatmentPlan } from "@shared/schema";
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';

// ── Emotion definitions ──
const EMOTIONS = [
    {
        id: 'Anxious',
        emoji: '😰',
        label: 'Anxious',
        sublabel: 'Racing thoughts, tight chest',
        color: 'bg-rose-50 border-rose-200 hover:border-rose-400',
        activeColor: 'bg-rose-500 border-rose-500 text-white',
        iconColor: 'text-rose-500',
        Icon: Wind,
    },
    {
        id: 'Overwhelmed',
        emoji: '😶‍🌫️',
        label: 'Overwhelmed',
        sublabel: 'Too much, too fast',
        color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
        activeColor: 'bg-orange-500 border-orange-500 text-white',
        iconColor: 'text-orange-500',
        Icon: CloudRain,
    },
    {
        id: 'Sad',
        emoji: '🌧️',
        label: 'Sad',
        sublabel: 'Low energy, heavy mood',
        color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
        activeColor: 'bg-blue-500 border-blue-500 text-white',
        iconColor: 'text-blue-500',
        Icon: CloudRain,
    },
    {
        id: 'Angry',
        emoji: '🔥',
        label: 'Frustrated',
        sublabel: 'Irritated, reactive',
        color: 'bg-red-50 border-red-200 hover:border-red-400',
        activeColor: 'bg-red-500 border-red-500 text-white',
        iconColor: 'text-red-500',
        Icon: Flame,
    },
    {
        id: 'Calm',
        emoji: '🌿',
        label: 'Calm',
        sublabel: 'Grounded, present',
        color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
        activeColor: 'bg-emerald-500 border-emerald-500 text-white',
        iconColor: 'text-emerald-500',
        Icon: Heart,
    },
] as const;

const FAST_ACTIONS: Record<string, any> = {
    'Anxious': {
        protocolName: 'Rapid Calm Response',
        immediateAction: { title: '4-7-8 Centering Breath', durationMinutes: 2, instructions: 'Inhale 4 sec → Hold 7 sec → Exhale 8 sec. Repeat 4 cycles to down-regulate your nervous system.' }
    },
    'Overwhelmed': {
        protocolName: 'Clarity Restoration',
        immediateAction: { title: '5-4-3-2-1 Grounding', durationMinutes: 3, instructions: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Returns your brain to the present.' }
    },
    'Sad': {
        protocolName: 'Neurochemical Boost',
        immediateAction: { title: 'Somatic Release', durationMinutes: 5, instructions: 'Gently stretch neck and shoulders. Walk briefly, or stand and shake arms for 60 seconds. Physical movement signals safety to the brain.' }
    },
    'Angry': {
        protocolName: 'Energy Redirection',
        immediateAction: { title: 'Box Breathing', durationMinutes: 4, instructions: 'Inhale 4 → Hold 4 → Exhale 4 → Hold 4. This rhythm stimulates the vagus nerve to break the fight-or-flight loop.' }
    },
    'Calm': {
        protocolName: 'Presence Mastery',
        immediateAction: { title: 'Gratitude Anchor', durationMinutes: 1, instructions: 'Acknowledge three things currently supporting you. Reinforces positive neural pathways and deepens your calm baseline.' }
    }
};

// Map activity title → nearest library activity ID
function getActivityLink(title: string): string {
    const t = (title || '').toLowerCase();
    if (t.includes('4-7-8') || t.includes('centering breath')) return '/activities/breathing-1';
    if (t.includes('box breath')) return '/activities/breathing-2';
    if (t.includes('breath') || t.includes('breathing')) return '/activities/breathing-1';
    if (t.includes('5-4-3-2-1') || t.includes('grounding')) return '/activities/grounding-1';
    if (t.includes('body scan')) return '/activities/meditation-2';
    if (t.includes('mindful') || t.includes('guided')) return '/activities/meditation-1';
    if (t.includes('gratitude')) return '/activities/journaling-1';
    if (t.includes('yoga')) return '/activities/movement-1';
    if (t.includes('walk') || t.includes('somatic')) return '/activities/movement-2';
    return '/activities';
}

const SYNTHESIS_STEPS = [
    'Reading emotional baseline...',
    'Applying evidence-based frameworks...',
    'Structuring 4-week module plan...',
    'Composing personalized activities...',
    'Clinical protocol ready ✓',
];

export default function UnifiedDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showIntro, setShowIntro] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('secure_intro_seen') !== 'true';
    });

    // ── Workflow state ──
    type Step = 'idle' | 'selected' | 'synthesizing' | 'ready';
    const [step, setStep] = useState<Step>('idle');
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
    const [generatedProtocol, setGeneratedProtocol] = useState<any>(null);
    const [newPlanId, setNewPlanId] = useState<string | null>(null);
    const [synthStep, setSynthStep] = useState(0);
    const synthTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const { data: assessments = [] } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
    const { data: dailyInsight, isLoading: isInsightLoading } = useQuery<{ description: string }>({
        queryKey: ["/api/dashboard/insights"],
        staleTime: 1000 * 60 * 60,
    });
    const { data: userSeason, isLoading: isSeasonLoading } = useQuery<{ title: string, description: string }>({
        queryKey: ["/api/dashboard/season"],
        staleTime: 1000 * 60 * 60,
    });

    const { data: voiceEntriesData } = useQuery<{ entries: any[] }>({
        queryKey: ["/api/voice-entries"],
        retry: false,
    });
    const latestVoiceEntry = voiceEntriesData?.entries?.[0];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!showIntro) return;
        const t = setTimeout(() => { setShowIntro(false); sessionStorage.setItem('secure_intro_seen', 'true'); }, 2200);
        return () => clearTimeout(t);
    }, [showIntro]);

    const handleEmotionSelect = async (emotion: string) => {
        setSelectedEmotion(emotion);
        setStep('synthesizing');
        setSynthStep(0);
        setGeneratedProtocol(FAST_ACTIONS[emotion] || null);

        // Animate synthesis steps
        synthTimer.current = setInterval(() => {
            setSynthStep(prev => {
                if (prev >= SYNTHESIS_STEPS.length - 1) {
                    if (synthTimer.current) clearInterval(synthTimer.current);
                    return prev;
                }
                return prev + 1;
            });
        }, 700);

        try {
            const res = await apiRequest("POST", "/api/prescriptions/generate", { emotion });
            const data = await res.json();
            setGeneratedProtocol(data.protocol);
            setNewPlanId(data.planId);
        } catch (error) {
            console.error('Protocol generation failed', error);
        } finally {
            // Let synthesis animation complete before showing ready
            setTimeout(() => {
                if (synthTimer.current) clearInterval(synthTimer.current);
                setSynthStep(SYNTHESIS_STEPS.length - 1);
                setStep('ready');
            }, SYNTHESIS_STEPS.length * 700 + 400);
        }
    };

    const resetFlow = () => {
        setStep('idle');
        setSelectedEmotion(null);
        setGeneratedProtocol(null);
        setNewPlanId(null);
        setSynthStep(0);
    };

    const emotionMeta = EMOTIONS.find(e => e.id === selectedEmotion);

    const bentoVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 15 },
        visible: (i: number) => ({
            opacity: 1, scale: 1, y: 0,
            transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        })
    };

    return (
        <AnimatePresence mode="wait">
            {showIntro ? (
                <motion.div key="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative flex items-center justify-center w-64 h-64 mb-8">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[60px]" />
                        <div className="relative z-10 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
                    </div>
                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}
                        className="text-2xl md:text-3xl font-serif italic text-white/90 tracking-wide text-center px-6">
                        Establishing private space, {user?.firstName || 'Friend'}...
                    </motion.h1>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </motion.div>
            ) : (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="flex-1 min-h-screen bg-[#fafafa] font-sans text-slate-800 relative">

                    {/* Neural Grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-28 relative z-10">

                        {/* ── Header ── */}
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-0.5">
                                    {(() => {
                                        const h = currentTime.getHours();
                                        return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
                                    })()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-400">{user?.firstName || 'Friend'}</span>
                                </h1>
                                <p className="text-sm text-slate-400 font-medium">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                                className="bg-white/80 backdrop-blur-md border border-indigo-100 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 self-start sm:self-auto">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Neural Sync Active</span>
                            </motion.div>
                        </header>

                        {/* ══════════════════════════════════════════════════
                            CLINICAL WORKFLOW CARD
                         ══════════════════════════════════════════════════ */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                            className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden mb-6">

                            {/* Progress bar at top — shows step */}
                            <div className="h-1 w-full bg-slate-100">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-400"
                                    animate={{ width: step === 'idle' ? '5%' : step === 'synthesizing' ? '60%' : '100%' }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>

                            <AnimatePresence mode="wait">

                                {/* ── STEP 1: EMOTION SELECTOR ── */}
                                {step === 'idle' && (
                                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="pt-3 pb-3">

                                        {/* Compact header */}
                                        <div className="flex items-center gap-2 px-4 mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-400">Daily Calibration</span>
                                            <div className="flex-1 h-px bg-slate-100" />
                                            <span className="text-[9px] text-slate-300 font-medium">tap your state</span>
                                        </div>

                                        {/* Compact circle row */}
                                        <div className="flex justify-between items-center px-3 sm:px-6">
                                            {EMOTIONS.map((e) => (
                                                <button
                                                    key={e.id}
                                                    onClick={() => handleEmotionSelect(e.id)}
                                                    className="flex flex-col items-center gap-1 group active:scale-95 transition-all"
                                                >
                                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border transition-all ${e.color.replace('rounded-2xl', '')} shadow-sm group-hover:shadow-md`}>
                                                        <span className="text-2xl sm:text-3xl leading-none">{e.emoji}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-600 transition-colors">{e.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 2: SYNTHESIS ── */}
                                {step === 'synthesizing' && (
                                    <motion.div key="synthesizing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="p-5 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            {emotionMeta && (
                                                <span className="text-3xl">{emotionMeta.emoji}</span>
                                            )}
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">You selected</div>
                                                <div className="font-black text-slate-900 text-lg">{emotionMeta?.label}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                                    className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-300" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Brain className="w-5 h-5 text-indigo-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 text-sm">Clinical AI Orchestrator</div>
                                                <div className="text-slate-400 text-xs">Building your personalized protocol</div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Live</span>
                                            </div>
                                        </div>

                                        {/* Step-by-step synthesis checklist */}
                                        <div className="space-y-2.5 bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
                                            {SYNTHESIS_STEPS.map((s, i) => {
                                                const done = synthStep > i;
                                                const active = synthStep === i;
                                                return (
                                                    <motion.div key={s}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: i <= synthStep ? 1 : 0.3, x: 0 }}
                                                        transition={{ delay: i * 0.15 }}
                                                        className="flex items-center gap-3 text-sm"
                                                    >
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500' : active ? 'bg-indigo-500' : 'bg-slate-200'
                                                            }`}>
                                                            {done ? (
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            ) : active ? (
                                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                                                                    className="w-2 h-2 bg-white rounded-full" />
                                                            ) : (
                                                                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                                                            )}
                                                        </div>
                                                        <span className={`font-medium transition-colors ${done ? 'text-emerald-700 line-through opacity-70' : active ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                                                            {s}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 3: PROTOCOL READY ── */}
                                {step === 'ready' && generatedProtocol && (
                                    <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="p-5 sm:p-8">

                                        {/* Ready header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                {emotionMeta && <span className="text-2xl">{emotionMeta.emoji}</span>}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Protocol Ready</span>
                                                    </div>
                                                    <div className="font-black text-slate-900 text-lg tracking-tight">{generatedProtocol.protocolName}</div>
                                                </div>
                                            </div>
                                            <button onClick={resetFlow} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300">
                                                New Check-in
                                            </button>
                                        </div>

                                        {/* Immediate action */}
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {/* Immediate Action card — dark bg, all text must be explicitly light */}
                                            <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-8 -mt-8" />
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="bg-rose-500 rounded-xl w-7 h-7 flex items-center justify-center">
                                                            <Zap className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Do This Now</span>
                                                    </div>
                                                    <h3 className="text-xl font-black mb-2 tracking-tight text-white">
                                                        {generatedProtocol.immediateAction?.title || generatedProtocol.immediateAction?.name || 'Breathing Exercise'}
                                                    </h3>
                                                    <p className="text-slate-300 text-sm leading-relaxed mb-5">
                                                        {generatedProtocol.immediateAction?.instructions || generatedProtocol.immediateAction?.description || ''}
                                                    </p>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                            <Timer className="w-3.5 h-3.5" />
                                                            {generatedProtocol.immediateAction?.durationMinutes || generatedProtocol.immediateAction?.duration || 5} min
                                                        </div>
                                                        <Link href={getActivityLink(generatedProtocol.immediateAction?.title || generatedProtocol.immediateAction?.name || '')}>
                                                            <span className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 text-xs font-bold border border-indigo-500/30 hover:border-indigo-400/50 rounded-xl px-3 py-1.5 transition-all cursor-pointer">
                                                                <ExternalLink className="w-3 h-3" /> View in Library
                                                            </span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Full pathway card */}
                                            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="bg-indigo-100 rounded-xl w-7 h-7 flex items-center justify-center">
                                                            <Activity className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">4-Week Clinical Pathway</span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Your Full Protocol</h3>
                                                    <p className="text-slate-500 text-sm leading-relaxed">
                                                        Evidence-based weekly modules structured specifically for your emotional state.
                                                    </p>
                                                </div>
                                                <Link href={newPlanId ? `/treatment-plan/${newPlanId}` : '/treatment-plan'}>
                                                    <button className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors">
                                                        View My Pathway <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </motion.div>

                        {/* ── Bento Grid ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">

                            {/* Clinical Pathway Hero (spans 2 cols, 2 rows) */}
                            <motion.div custom={0} variants={bentoVariants} initial="hidden" animate="visible"
                                className="col-span-2 row-span-2">
                                <Link href="/treatment-plan">
                                    <div className="h-full min-h-[200px] rounded-3xl bg-indigo-950 p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden border border-indigo-900 hover:border-indigo-700 transition-all">
                                        <div className="relative z-10">
                                            <div className="w-11 h-11 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                                                <Activity className="w-5 h-5 text-indigo-300" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tight group-hover:text-indigo-200 transition-colors">My Clinical Pathway</h3>
                                            <p className="text-indigo-300/60 text-sm leading-relaxed">Follow your prescribed activities to achieve measurable progress.</p>
                                        </div>
                                        <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white w-max px-4 py-2 rounded-full border border-emerald-400 group-hover:bg-emerald-400 transition-all">
                                            Continue Protocol <ArrowUpRight className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Season banner */}
                            <motion.div custom={1} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2">
                                <div className="h-full min-h-[96px] rounded-3xl bg-slate-50/80 border border-slate-200/60 p-4 flex items-center gap-4 relative overflow-hidden">
                                    <div className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-indigo-400 flex-shrink-0">
                                        <Smile className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isSeasonLoading ? (
                                            <div className="space-y-1 animate-pulse">
                                                <div className="h-3 bg-slate-200 rounded w-24" />
                                                <div className="h-3 bg-slate-200 rounded w-36" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Your Present Era</div>
                                                <div className="text-sm font-black text-slate-800 leading-tight truncate">{userSeason?.title || "Season of Discovery"}</div>
                                                <div className="text-xs text-slate-500 leading-snug line-clamp-1">{userSeason?.description || "Every step forward matters."}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Vocal Journal */}
                            <motion.div custom={2} variants={bentoVariants} initial="hidden" animate="visible">
                                <Link href="/voice-journal">
                                    <div className="h-full min-h-[96px] rounded-3xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col justify-between cursor-pointer group hover:border-rose-200 transition-all">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm">Vocal Journal</h3>
                                            <p className="text-xs text-slate-400">Record thought</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* AI Support */}
                            <motion.div custom={3} variants={bentoVariants} initial="hidden" animate="visible">
                                <Link href="/ai-companion">
                                    <div className="h-full min-h-[96px] rounded-3xl bg-indigo-50 border border-indigo-100/50 shadow-sm p-5 flex flex-col justify-between cursor-pointer group hover:border-indigo-200 transition-all">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm">AI Support</h3>
                                            <p className="text-xs text-slate-400 font-medium">As-needed</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Daily insight */}
                            <motion.div custom={4} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2">
                                <div className="h-full min-h-[96px] rounded-3xl p-6 flex items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 border border-indigo-100">
                                    {isInsightLoading ? (
                                        <div className="space-y-2 w-full max-w-xs animate-pulse mx-auto">
                                            <div className="h-3 bg-indigo-200/50 rounded w-3/4 mx-auto" />
                                            <div className="h-3 bg-indigo-200/50 rounded w-1/2 mx-auto" />
                                        </div>
                                    ) : (
                                        <p className="text-base sm:text-lg font-serif italic text-slate-700 leading-relaxed">
                                            "{dailyInsight?.description || 'You are doing enough, just by breathing.'}"
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Sleep */}
                            <motion.div custom={5} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2">
                                <Link href="/sleep">
                                    <div className="h-full min-h-[96px] rounded-3xl bg-white border border-slate-100 shadow-sm p-5 flex items-center cursor-pointer group hover:border-purple-200 transition-all gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex-shrink-0 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                            <Moon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm mb-0.5">Sleep & Restore</h3>
                                            <p className="text-xs text-slate-500 font-medium">AI-guided sleep tracking</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {/* Vocal Pulse Overlay (Persistent Evidence) */}
                            {latestVoiceEntry && (
                                <motion.div custom={6} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2 sm:col-span-4">
                                    <Link href="/voice-journal">
                                        <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 p-6 sm:p-8 flex items-center cursor-pointer group hover:border-indigo-500 transition-all gap-6 relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-500">
                                                <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Latest Vocal Pulse</span>
                                                    <div className="h-[1px] flex-1 bg-slate-800" />
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700"> Securely Saved</span>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-white font-black text-xl sm:text-2xl capitalize font-serif italic tracking-tight">
                                                        {latestVoiceEntry.emotionData?.[0]?.primary_emotion ||
                                                            latestVoiceEntry.emotionData?.[0]?.label ||
                                                            (typeof latestVoiceEntry.emotionData === 'string' ? latestVoiceEntry.emotionData : 'Stable State')}
                                                    </h3>
                                                    <span className="text-slate-500 text-xs font-medium">detected {latestVoiceEntry.recordedAt ? new Date(latestVoiceEntry.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}</span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg group-hover:translate-x-1">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}

                        </div>
                    </div>
                </motion.div>
            )}
            {/* Spacer for mobile bottom nav overlap */}
            <div className="h-24 lg:hidden pointer-events-none" />
        </AnimatePresence>
    );
}
