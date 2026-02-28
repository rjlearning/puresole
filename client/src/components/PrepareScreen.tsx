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
    const [checked, setChecked] = useState<Set<number>>(new Set());

    const toggleCheck = (i: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const allChecked = checked.size === config.steps.length;

    const handleBegin = () => {
        playDoubleChime();
        onReady();
    };

    return (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-xl border border-white/50">
            {/* Hero bar */}
            <div className={`bg-gradient-to-r ${config.gradient} px-8 py-6 text-white`}>
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{config.emoji}</span>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">{config.title}</h2>
                        <div className="flex items-center gap-3 mt-1 text-white/80 text-sm font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{duration} min</span>
                            <span>·</span>
                            <span>{activityName}</span>
                        </div>
                    </div>
                </div>
                <p className="mt-3 text-white/90 text-sm leading-relaxed max-w-xl">{config.tagline}</p>
            </div>

            {/* Checklist */}
            <div className="bg-white/70 backdrop-blur-sm px-8 py-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Before you begin</p>
                <div className="space-y-3 mb-8">
                    {config.steps.map((step, i) => (
                        <button
                            key={i}
                            onClick={() => toggleCheck(i)}
                            className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${checked.has(i)
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${checked.has(i) ? 'bg-green-500 border-green-500' : 'border-slate-300'
                                }`}>
                                {checked.has(i) && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
                            </div>
                            <p className={`text-sm leading-relaxed transition-colors ${checked.has(i) ? 'text-green-700 line-through decoration-green-300' : 'text-slate-700'}`}>
                                {step}
                            </p>
                        </button>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleBegin}
                        disabled={false} // Allow starting even if not all checked — just nudge them
                        className={`flex items-center gap-2.5 px-10 py-4 rounded-2xl font-black text-lg text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ${config.btnColor} ${!allChecked ? 'opacity-80' : ''
                            }`}
                    >
                        <Play className="w-5 h-5 fill-white" />
                        {allChecked ? "I'm Ready — Begin" : 'Begin'}
                    </button>
                    {!allChecked && (
                        <p className="text-xs text-slate-400">
                            Tick each step above when ready — or jump straight in.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
