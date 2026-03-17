import { useState } from 'react';
import { Play, CheckCircle2, Clock } from 'lucide-react';
import { playDoubleChime } from '@/lib/audio';

// ─── Per-category prepare content ────────────────────────────────────────────
const PREPARE_CONFIG: Record<string, {
    emoji: string;
    title: string;
    tagline: string;
    steps: string[];
    gradient: string;
    btnColor: string;
}> = {
    breathing: {
        emoji: '🌬️',
        title: 'Prepare to Breathe',
        tagline: 'A few moments of preparation make the difference between going through the motions and actually shifting your nervous system.',
        steps: [
            'Find a comfortable seat — chair, floor, or bed. Keep your spine gently tall.',
            'Close your eyes or soften your gaze toward the floor.',
            'Let your hands rest open in your lap.',
            'Take one slow, unguided breath before we begin.',
        ],
        gradient: 'from-teal-400 to-emerald-500',
        btnColor: 'bg-teal-500 hover:bg-teal-600',
    },
    meditation: {
        emoji: '🧘',
        title: 'Prepare to Meditate',
        tagline: 'The quality of your meditation is largely set in the first 30 seconds. Take that time now.',
        steps: [
            'Choose a quiet space where you won\'t be interrupted.',
            'Sit comfortably — a cushion on the floor or the back of a chair both work.',
            'If you\'re wearing headphones, check they\'re comfortable.',
            'Set your phone to silent and let the people around you know you\'re unavailable.',
        ],
        gradient: 'from-purple-400 to-fuchsia-500',
        btnColor: 'bg-purple-500 hover:bg-purple-600',
    },
    grounding: {
        emoji: '🌱',
        title: 'Prepare to Ground',
        tagline: 'Grounding works best when you actually look around the room. This isn\'t a thought exercise — use your senses.',
        steps: [
            'You can do this sitting, standing, or lying down.',
            'Wherever you are is the right place — no need to find a quiet space.',
            'If you\'re feeling very activated, take one slow breath right now.',
            'When you\'re ready, open your eyes and look around you.',
        ],
        gradient: 'from-amber-400 to-orange-500',
        btnColor: 'bg-amber-500 hover:bg-amber-600',
    },
    journaling: {
        emoji: '✍️',
        title: 'Prepare to Journal',
        tagline: 'The goal isn\'t perfect writing — it\'s honest thinking. There\'s no grade, no audience.',
        steps: [
            'Grab something to write or type on — whatever feels right.',
            'Give yourself permission to be messy, incomplete, or unsure.',
            'There are no wrong answers to the prompts that follow.',
            'If you feel resistance, write the resistance. Start there.',
        ],
        gradient: 'from-indigo-400 to-violet-500',
        btnColor: 'bg-indigo-500 hover:bg-indigo-600',
    },
    somatic: {
        emoji: '🫁',
        title: 'Prepare Your Body',
        tagline: 'Somatic exercises require physical movement. Give yourself a little space to move freely.',
        steps: [
            'Stand up or find space to sit with your feet flat on the floor.',
            'If you\'re in public, find a private spot — you\'ll be moving your body.',
            'Loosen any tight clothing or shoes if comfortable.',
            'Let your jaw unclench and your shoulders drop away from your ears.',
        ],
        gradient: 'from-emerald-400 to-teal-500',
        btnColor: 'bg-emerald-500 hover:bg-emerald-600',
    },
};

const DEFAULT_CONFIG = PREPARE_CONFIG.meditation;

// ─── Props ────────────────────────────────────────────────────────────────────
interface PrepareScreenProps {
    category: string;
    activityName: string;
    duration: number;
    onReady: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PrepareScreen({ category, activityName, duration, onReady }: PrepareScreenProps) {
    const config = PREPARE_CONFIG[category] ?? DEFAULT_CONFIG;

    const handleBegin = () => {
        playDoubleChime();
        onReady();
    };

    return (
        <div className="mb-24 sm:mb-8 rounded-3xl overflow-hidden shadow-xl border border-border bg-card relative">
            {/* Hero bar */}
            <div className={`bg-gradient-to-r ${config.gradient} px-6 sm:px-8 py-8 text-white`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{config.emoji}</span>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{config.title}</h2>
                            <div className="flex items-center gap-3 mt-1 text-white/80 text-sm font-medium">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{duration} min</span>
                                <span>·</span>
                                <span>{activityName}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-white/90 text-sm sm:text-base leading-relaxed max-w-xl font-medium">{config.tagline}</p>
            </div>

            {/* Simple Instructions */}
            <div className="px-6 py-6 sm:px-8 sm:py-8">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Before you begin</p>
                <ul className="space-y-4 mb-4">
                    {config.steps.map((step, i) => (
                        <li key={i} className="flex gap-4 p-4 rounded-2xl bg-secondary/30 border border-secondary/50 text-foreground">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-secondary-foreground shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed font-medium">
                                {step}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Fixed Bottom CTA for Mobile / Inline for Desktop */}
            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-0 sm:static sm:px-8 sm:pb-8 bg-gradient-to-t from-background via-background to-transparent sm:bg-none z-50">
                <button
                    onClick={handleBegin}
                    className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-[2rem] font-black text-lg text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 ${config.btnColor}`}
                >
                    <Play className="w-6 h-6 fill-white" />
                    Begin Session Now
                </button>
            </div>
        </div>
    );
}
