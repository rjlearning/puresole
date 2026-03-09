import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, MessageCircle, ArrowRight, CheckCircle2, Heart, Sparkles, X, ChevronRight, Video, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface DeEscalationSupportProps {
    onClose: () => void;
    initialEmotion: string;
}

type SupportStep = 'video' | 'chat_intro' | 'retest' | 'summary';

export default function DeEscalationSupport({ onClose, initialEmotion }: DeEscalationSupportProps) {
    const [step, setStep] = useState<SupportStep>('video');
    const [ratingBefore, setRatingBefore] = useState(8);
    const [ratingAfter, setRatingAfter] = useState<number | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const pending = localStorage.getItem('recovery_pending');
        if (pending) {
            setStep('retest');
            localStorage.removeItem('recovery_pending');
        } else {
            // Default to chat_intro now instead of video for speed
            setStep('chat_intro');
        }
    }, []);

    // In a real app, this would be a real video URL. For now, a placeholder.
    const videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

    const handleRatingAfter = async (val: number) => {
        setRatingAfter(val);

        // Log the effectiveness
        try {
            await apiRequest("POST", "/api/women/checkin", {
                mood: 5, // Neutral placeholder
                energyLevel: 5,
                notes: `Overwhelmed Flow: Rated ${ratingBefore}/10 before, ${val}/10 after support interaction.`
            });
        } catch (e) {
            console.error("Failed to log recovery data", e);
        }

        setStep('summary');
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Supportive Presence</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Immediate De-escalation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: VIDEO GUIDE */}
                        {step === 'video' && (
                            <motion.div
                                key="video"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Breathe with us.</h3>
                                    <p className="text-slate-500 font-medium">Take a minute to ground yourself with this guided coping skill.</p>
                                </div>

                                <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-slate-900 shadow-xl group border-4 border-slate-100">
                                    {!isVideoPlaying ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-slate-900/60 to-transparent">
                                            <button
                                                onClick={() => setIsVideoPlaying(true)}
                                                className="w-20 h-20 rounded-full bg-white text-orange-500 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                                            >
                                                <Play className="w-8 h-8 fill-orange-500 ml-1" />
                                            </button>
                                            <p className="text-white font-black text-xs uppercase tracking-widest shadow-sm">1:24 Guided De-escalation</p>
                                        </div>
                                    ) : (
                                        <video
                                            src={videoUrl}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            controls
                                            onEnded={() => setStep('chat_intro')}
                                        />
                                    )}
                                    {/* Medical Integrity Badge */}
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Clinical Protocol</span>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setStep('chat_intro')}
                                        className="text-slate-400 hover:text-orange-500 text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Skip to support chat
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: RETEST */}
                        {step === 'retest' && (
                            <motion.div
                                key="retest"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-12 py-6"
                            >
                                <div className="text-center space-y-3">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Checking in again.</h3>
                                    <p className="text-slate-500 font-medium">How would you rate your level of overwhelm now?</p>
                                </div>

                                <div className="grid grid-cols-5 gap-2 sm:gap-4">
                                    {[2, 4, 6, 8, 10].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleRatingAfter(val)}
                                            className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${ratingAfter === val
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-xl scale-105'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                                                }`}
                                        >
                                            <span className="text-2xl font-black">{val}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest">{val <= 4 ? 'Calm' : val <= 7 ? 'Steady' : 'Intense'}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                    <span>Manageable</span>
                                    <span>Intense</span>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: SUMMARY */}
                        {step === 'summary' && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-8 py-10"
                            >
                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Recovery Logged.</h3>
                                    <p className="text-slate-500 font-medium max-w-sm">
                                        Your recovery from <span className="text-orange-500 font-bold">{ratingBefore}/10</span> to <span className="text-emerald-500 font-bold">{ratingAfter}/10</span> has been noted in your Resilience Trends.
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 w-full flex items-center gap-4">
                                    <Activity className="w-8 h-8 text-indigo-500" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resilience Impact</p>
                                        <p className="text-sm font-bold text-slate-700">Dynamic regulation successfully demonstrated.</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest"
                                >
                                    Return to Dashboard
                                </Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                {step !== 'summary' && (
                    <div className="px-10 pb-10 flex gap-2 justify-center">
                        {(['video', 'chat_intro', 'retest'] as SupportStep[]).map((s, i) => (
                            <div
                                key={s}
                                className={`h-1 rounded-full transition-all duration-500 ${step === s ? 'w-10 bg-orange-500' : 'w-2 bg-slate-100'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
