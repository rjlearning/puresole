import { useState, useRef } from 'react';
import { CheckCircle2, RefreshCw, Brain, Wind, ClipboardList, Trophy, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Check, X } from 'lucide-react';

// ───────────────────────────────────────────────────────────────────────────────
//  SECTION 1: BINGO DATA
// ───────────────────────────────────────────────────────────────────────────────
const BINGO_SQUARES = [
    { id: 0, text: 'Do some exercise', emoji: '🏃', desc: 'Any movement counts — a walk, stretching, dancing in your kitchen.' },
    { id: 1, text: 'Call a friend or family member', emoji: '📞', desc: 'Real connection, not a text. Even 5 minutes matters.' },
    { id: 2, text: 'Take a relaxing bath or shower', emoji: '🛁', desc: 'Warm water activates the parasympathetic nervous system. Not a luxury — a reset.' },
    { id: 3, text: 'Spend time in nature', emoji: '🌿', desc: '20 minutes outside reduces cortisol measurably. No headphones needed.' },
    { id: 4, text: 'Practice deep breathing', emoji: '🌬️', desc: '4-7-8: inhale 4s, hold 7s, exhale 8s. Three rounds resets your nervous system.' },
    { id: 5, text: 'Write in a journal', emoji: '📓', desc: 'Expressive writing for 15 minutes reduces psychological distress (Pennebaker, 1997).' },
    { id: 6, text: 'Try a new hobby or activity', emoji: '🎨', desc: 'Novelty builds neural pathways and boosts dopamine.' },
    { id: 7, text: 'Help someone else out', emoji: '🤝', desc: 'Prosocial behavior increases serotonin in both giver and receiver.' },
    { id: 8, text: 'Watch a funny film or TV show', emoji: '😂', desc: 'Laughter reduces cortisol, adrenaline, and increases endorphins.' },
    { id: 9, text: 'Cook a healthy meal', emoji: '🥗', desc: 'Gut health and mental health are directly connected. Feed both.' },
    { id: 10, text: 'Practice mindfulness or meditation', emoji: '🧘', desc: '8 weeks of daily practice produces measurable changes in brain structure.' },
    { id: 11, text: 'Listen to music you enjoy', emoji: '🎵', desc: 'Music regulates emotion more effectively than many other interventions.' },
    { id: 12, text: 'Get a good night\'s sleep', emoji: '💤', desc: 'Sleep deprivation impairs emotional regulation more than almost anything else.' },
    { id: 13, text: 'Limit social media', emoji: '📵', desc: '30 minutes/day limit is associated with reduced depression and loneliness (Hunt et al., 2018).' },
    { id: 14, text: 'Drink enough water', emoji: '💧', desc: 'Even mild dehydration impairs mood and cognitive function.' },
    { id: 15, text: 'Spend time with a pet', emoji: '🐾', desc: 'Petting an animal for 10 minutes reduces cortisol significantly.' },
    { id: 16, text: 'Express gratitude — write 3 things', emoji: '🙏', desc: 'Gratitude practice rewires the brain\'s negativity bias over time.' },
    { id: 17, text: 'Talk to a therapist or counselor', emoji: '💬', desc: 'Professional support isn\'t a last resort — it\'s a powerful first step.' },
    { id: 18, text: 'Do something creative', emoji: '✏️', desc: 'Creative expression activates the default mode network — the brain\'s self-healing mode.' },
    { id: 19, text: 'Take a screen break', emoji: '🌅', desc: 'Step outside or just sit quietly for 10 minutes. No phone.' },
    { id: 20, text: 'Progressive muscle relaxation', emoji: '💆', desc: 'Tense and release each muscle group from toes to face. 15 minutes.' },
    { id: 21, text: 'Connect with a support group', emoji: '👥', desc: 'Shared experience reduces shame. Community is medicine.' },
    { id: 22, text: 'Random act of kindness', emoji: '💝', desc: 'Five acts of kindness per day for 6 weeks increases wellbeing (Lyubomirsky, 2005).' },
    { id: 23, text: 'Set a healthy boundary', emoji: '🚧', desc: 'Saying no to one thing today that doesn\'t serve you.' },
    { id: 24, text: 'Positive self-talk ★ FREE', emoji: '⭐', desc: 'Speak to yourself as you would a close friend. This square is yours — mark it now.' },
];

// ───────────────────────────────────────────────────────────────────────────────
//  SECTION 2: ANTs (CBT THOUGHT TOOL) DATA
// ───────────────────────────────────────────────────────────────────────────────
const ANT_TYPES = [
    'All-or-nothing thinking', 'Catastrophising', 'Mind reading', 'Fortune telling',
    'Emotional reasoning', 'Should statements', 'Labelling', 'Personalisation',
    'Mental filtering', 'Magnification / minimisation'
];

const CHALLENGE_QUESTIONS = [
    'What evidence supports this thought? What evidence contradicts it?',
    'Am I confusing a thought with a fact?',
    'Would a good friend agree with this thought, or challenge it?',
    'What is the worst that could realistically happen? Could I handle it?',
    'Am I using "all-or-nothing" thinking? Is there a middle ground?',
    'Is this thought based on how I feel, rather than actual facts?',
    'What would I tell a close friend if they had this thought?',
    'Am I catastrophising — imagining the worst possible outcome?',
    'Am I taking too much responsibility for something outside my control?',
    'In 5 years, will this matter as much as it feels like it does now?',
];

// ───────────────────────────────────────────────────────────────────────────────
//  SECTION 3: REGULATION TECHNIQUES DATA
// ───────────────────────────────────────────────────────────────────────────────
const REGULATION_TECHNIQUES = [
    {
        id: 'breath',
        title: 'Breath Awareness',
        emoji: '🌬️',
        source: 'Breath Awareness — PositivePsychology.com',
        desc: 'Slow breathing activates the vagus nerve, shifting your nervous system from stress to rest.',
        steps: [
            'Find a comfortable position. Sit or lie down.',
            'Close your eyes or soften your gaze.',
            'Breathe in slowly through your nose for 4 counts.',
            'Hold gently for 2 counts.',
            'Exhale slowly through your mouth for 6 counts.',
            'Notice where you feel the breath in your body — chest, belly, nostrils.',
            'With each exhale, imagine tension releasing.',
            'Continue for 5–10 breath cycles.',
        ],
        duration: 120,
        color: 'from-blue-400 to-cyan-500',
    },
    {
        id: 'senses',
        title: '5-4-3-2-1 Grounding',
        emoji: '👁️',
        source: 'Five Senses Worksheet — PositivePsychology.com',
        desc: 'When anxiety spikes, this grounds you in the present moment through the 5 senses.',
        steps: [
            'Notice 5 things you can SEE right now. Name them silently.',
            'Notice 4 things you can TOUCH. Feel their texture.',
            'Notice 3 things you can HEAR in your environment.',
            'Notice 2 things you can SMELL (or things you enjoy smelling).',
            'Notice 1 thing you can TASTE right now.',
            'Take one slow deep breath.',
            'Notice how your anxiety has shifted.',
        ],
        duration: 90,
        color: 'from-violet-400 to-purple-500',
    },
    {
        id: 'shake',
        title: 'Shake It Off',
        emoji: '🫨',
        source: 'Shake It Off — Somatic Experiencing, PositivePsychology.com',
        desc: 'Animals shake after stress to discharge nervous system activation. Humans can too.',
        steps: [
            'Stand with your feet shoulder-width apart.',
            'Begin to gently shake your hands — loosely, like you\'re flicking water off.',
            'Let the shaking travel up into your arms and shoulders.',
            'Shake your legs one at a time.',
            'Let your whole body vibrate gently for 1–2 minutes.',
            'Come to stillness. Take 3 slow breaths.',
            'Notice the difference in your body.',
        ],
        duration: 120,
        color: 'from-amber-400 to-orange-500',
    },
    {
        id: 'acceptance',
        title: 'Radical Acceptance',
        emoji: '🌊',
        source: 'Radical Acceptance (DBT) — PositivePsychology.com',
        desc: 'Pain × resistance = suffering. Acceptance doesn\'t mean approval — it means releasing the struggle.',
        steps: [
            'Identify the painful reality you\'re fighting against. Name it clearly.',
            'Notice your body\'s resistance: tension, tightness, holding.',
            'Say internally: "This is what is happening right now."',
            'You don\'t have to like it. You don\'t have to agree with it.',
            'Say: "I can bear this. This moment, I accept what I cannot change."',
            'Feel your body soften slightly as you stop fighting the facts.',
            'Remind yourself: acceptance creates space for response. Resistance doesn\'t.',
        ],
        duration: 90,
        color: 'from-teal-400 to-emerald-500',
    },
    {
        id: 'window',
        title: 'Widen Your Window',
        emoji: '🪟',
        source: 'Skills for Regulating Emotions — PositivePsychology.com',
        desc: 'Your "window of tolerance" is the zone where you can feel emotions without being overwhelmed.',
        steps: [
            'Check in: are you over-activated (anxious, agitated) or under-activated (numb, shutdown)?',
            'Name the emotion without judgment: "There is anxiety present right now."',
            'For over-activation: slow your exhale. Make it longer than your inhale.',
            'For under-activation: move your body. Tapping your legs or stretching activates energy.',
            'Direct attention to one positive thing in your environment.',
            'Breathe slowly and ask: "What is one small thing within my control right now?"',
            'Take one action from that answer.',
        ],
        duration: 90,
        color: 'from-rose-400 to-pink-500',
    },
];

// ───────────────────────────────────────────────────────────────────────────────
//  SECTION 4: SELF-CARE DOMAINS
// ───────────────────────────────────────────────────────────────────────────────
const SELF_CARE_DOMAINS = [
    {
        id: 'physical', label: 'Physical', emoji: '💪',
        color: 'bg-emerald-400', lightBg: 'bg-emerald-50', border: 'border-emerald-200',
        suggestions: ['30 mins of movement today', 'Sleep 7–9 hours tonight', 'Hydrate — 8 glasses', 'Eat one nourishing meal'],
    },
    {
        id: 'emotional', label: 'Emotional', emoji: '💜',
        color: 'bg-violet-400', lightBg: 'bg-violet-50', border: 'border-violet-200',
        suggestions: ['Name one feeling you\'re carrying', 'Journal for 10 minutes', 'Breathe when overwhelmed', 'Let yourself feel — don\'t bypass'],
    },
    {
        id: 'social', label: 'Social', emoji: '🤝',
        color: 'bg-blue-400', lightBg: 'bg-blue-50', border: 'border-blue-200',
        suggestions: ['Text one person you care about', 'Ask for help with one thing', 'Be present in one conversation', 'Set a boundary if needed'],
    },
    {
        id: 'creative', label: 'Creative', emoji: '🎨',
        color: 'bg-amber-400', lightBg: 'bg-amber-50', border: 'border-amber-200',
        suggestions: ['Doodle or sketch freely for 10 mins', 'Write one page without editing', 'Listen to music you loved at 16', 'Try something you\'ve never made'],
    },
    {
        id: 'professional', label: 'Work/Purpose', emoji: '🎯',
        color: 'bg-rose-400', lightBg: 'bg-rose-50', border: 'border-rose-200',
        suggestions: ['Do one meaningful task, then rest', 'Protect lunch from work emails', 'Acknowledge one small win', 'Clarify one unclear expectation'],
    },
    {
        id: 'spiritual', label: 'Spiritual', emoji: '✨',
        color: 'bg-teal-400', lightBg: 'bg-teal-50', border: 'border-teal-200',
        suggestions: ['Sit in nature for 10 minutes', 'Read or listen to something meaningful', 'Practice gratitude for 3 things', 'Connect with something larger than yourself'],
    },
];

// ───────────────────────────────────────────────────────────────────────────────
//  BINGO COMPONENT
// ───────────────────────────────────────────────────────────────────────────────
function BingoSection() {
    const [marked, setMarked] = useState<Set<number>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('bingo_marked') || '[]')); } catch { return new Set([24]); }
    });
    const [selected, setSelected] = useState<number | null>(null);
    const [bingo, setBingo] = useState(false);

    const LINES = [
        [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // rows
        [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // cols
        [0, 6, 12, 18, 24], [4, 8, 12, 16, 20], // diagonals
    ];

    const toggle = (id: number) => {
        const next = new Set(marked);
        next.has(id) ? next.delete(id) : next.add(id);
        setMarked(next);
        localStorage.setItem('bingo_marked', JSON.stringify(Array.from(next)));
        setBingo(LINES.some(line => line.every(i => next.has(i))));
    };

    const reset = () => { setMarked(new Set([24])); localStorage.removeItem('bingo_marked'); setBingo(false); };

    const sq = BINGO_SQUARES[selected ?? -1];

    return (
        <div>
            {bingo && (
                <div className="mb-5 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 p-4 flex items-center gap-3 shadow-lg">
                    <Trophy className="w-8 h-8 text-white flex-shrink-0" />
                    <div><p className="font-black text-white text-lg">BINGO! 🎉</p><p className="text-white/90 text-sm">You completed a row of wellness activities — incredible work.</p></div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
                {BINGO_SQUARES.map(sq => {
                    const done = marked.has(sq.id);
                    const isFree = sq.id === 24;
                    return (
                        <button key={sq.id} onClick={() => { toggle(sq.id); setSelected(sq.id); }}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all text-xs font-medium leading-tight border-2 ${done ? 'bg-gradient-to-br from-violet-500 to-pink-500 border-transparent text-white shadow-md scale-95'
                                : 'bg-white border-slate-100 text-slate-600 hover:border-violet-200 hover:bg-violet-50'
                                }`}>
                            <span className="text-base mb-0.5">{sq.emoji}</span>
                            <span className={`text-[9px] leading-none ${done ? 'text-white/90' : 'text-slate-500'}`}>
                                {isFree ? '★ FREE' : sq.text.split(' ').slice(0, 3).join(' ')}
                            </span>
                            {done && <Check className="w-3 h-3 mt-0.5 text-white" />}
                        </button>
                    );
                })}
            </div>

            {/* Selected square detail */}
            {selected !== null && sq && (
                <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{sq.emoji}</span>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{sq.text}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sq.desc}</p>
                        </div>
                        <button onClick={() => setSelected(null)} className="ml-auto text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{marked.size}/25 completed · tap any square to mark it done</p>
                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
//  ANTs CBT THOUGHT TOOL
// ───────────────────────────────────────────────────────────────────────────────
function ANTsSection() {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [thought, setThought] = useState('');
    const [antType, setAntType] = useState('');
    const [challenge, setChallenge] = useState('');
    const [replacement, setReplacement] = useState('');
    const [saved, setSaved] = useState<{ thought: string; replacement: string }[]>(() => {
        try { return JSON.parse(localStorage.getItem('ants_log') || '[]'); } catch { return []; }
    });

    const save = () => {
        const entry = { thought, replacement };
        const next = [entry, ...saved].slice(0, 5);
        setSaved(next);
        localStorage.setItem('ants_log', JSON.stringify(next));
        setStep(4);
    };

    const restart = () => { setThought(''); setAntType(''); setChallenge(''); setReplacement(''); setStep(1); };

    const steps = [
        { n: 1, label: 'Catch the ANT', color: 'bg-red-400', icon: '🪲' },
        { n: 2, label: 'Identify the type', color: 'bg-amber-400', icon: '🔍' },
        { n: 3, label: 'Challenge & replace', color: 'bg-green-400', icon: '✨' },
    ];

    return (
        <div>
            {/* Step progress */}
            <div className="flex gap-2 mb-5">
                {steps.map(s => (
                    <div key={s.n} className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${step >= s.n ? `${s.color} text-white` : 'bg-slate-100 text-slate-400'
                        }`}>
                        <span>{s.icon}</span><span className="hidden sm:inline">{s.label}</span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">What's the automatic negative thought?</p>
                        <p className="text-xs text-slate-400 mb-3">Write it exactly as it appears in your mind — no filtering.</p>
                        <textarea value={thought} onChange={e => setThought(e.target.value)} placeholder="e.g. 'I always mess everything up' or 'Nobody really cares about me'"
                            className="w-full rounded-xl border-2 border-slate-100 focus:border-violet-300 outline-none p-3 text-sm text-slate-700 resize-none"
                            rows={3} />
                    </div>
                    <button disabled={!thought.trim()} onClick={() => setStep(2)}
                        className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold disabled:bg-slate-200 transition-all">
                        Caught it → Next
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                        <p className="text-xs text-violet-500 font-semibold mb-1">Your thought:</p>
                        <p className="text-sm text-violet-900 italic">"{thought}"</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-2">What type of thinking trap is this?</p>
                        <div className="flex flex-wrap gap-2">
                            {ANT_TYPES.map(t => (
                                <button key={t} onClick={() => setAntType(t)}
                                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${antType === t ? 'bg-violet-500 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                                        }`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-2">Which question challenges it most?</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {CHALLENGE_QUESTIONS.map(q => (
                                <button key={q} onClick={() => setChallenge(q)}
                                    className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${challenge === q ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200'
                                        }`}>{q}</button>
                            ))}
                        </div>
                    </div>
                    <button disabled={!antType || !challenge} onClick={() => setStep(3)}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-bold disabled:bg-slate-200 transition-all">
                        Challenge it → Next
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 space-y-2">
                        <div><p className="text-xs text-amber-600 font-semibold">ANT type: {antType}</p></div>
                        <div><p className="text-xs text-amber-700 italic">"{challenge}"</p></div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">Write a balanced, realistic replacement thought</p>
                        <p className="text-xs text-slate-400 mb-3">Not forced positivity — just a more accurate version of reality.</p>
                        <textarea value={replacement} onChange={e => setReplacement(e.target.value)}
                            placeholder="e.g. 'I make mistakes sometimes, but I also do a lot of things well. This one setback doesn't define me.'"
                            className="w-full rounded-xl border-2 border-slate-100 focus:border-green-300 outline-none p-3 text-sm text-slate-700 resize-none"
                            rows={3} />
                    </div>
                    <button disabled={!replacement.trim()} onClick={save}
                        className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold disabled:bg-slate-200 transition-all">
                        Save this reframe ✓
                    </button>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4">
                    <div className="text-center py-4">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                        <p className="font-bold text-slate-800">Thought reframed.</p>
                        <p className="text-sm text-slate-500 mt-1">That's a concrete act of cognitive restructuring.</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <p className="text-xs text-green-600 font-semibold mb-1">From:</p>
                        <p className="text-sm text-slate-600 italic mb-2">"{thought}"</p>
                        <p className="text-xs text-green-600 font-semibold mb-1">To:</p>
                        <p className="text-sm text-slate-800 font-medium">"{replacement}"</p>
                    </div>
                    <button onClick={restart} className="w-full py-3 rounded-xl border-2 border-violet-200 text-violet-600 font-bold hover:bg-violet-50 transition-all">
                        Work through another thought
                    </button>
                    {saved.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">Recent reframes</p>
                            <div className="space-y-2">
                                {saved.slice(0, 3).map((s, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs text-slate-400 line-through">{s.thought.slice(0, 60)}…</p>
                                        <p className="text-xs text-slate-700 font-medium mt-1">→ {s.replacement.slice(0, 80)}…</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
//  REGULATION TOOLKIT COMPONENT
// ───────────────────────────────────────────────────────────────────────────────
function RegulationSection() {
    const [active, setActive] = useState<string | null>(null);
    const [stepIdx, setStepIdx] = useState(0);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const technique = REGULATION_TECHNIQUES.find(t => t.id === active);

    const startTimer = () => {
        setRunning(true);
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    };
    const pauseTimer = () => { setRunning(false); if (timerRef.current) clearInterval(timerRef.current); };
    const resetTimer = () => { pauseTimer(); setElapsed(0); setStepIdx(0); };
    const openTechnique = (id: string) => { setActive(id); setStepIdx(0); resetTimer(); };

    if (active && technique) {
        const progress = Math.min((elapsed / technique.duration) * 100, 100);
        return (
            <div>
                <button onClick={() => { resetTimer(); setActive(null); }} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-4">
                    ← Back to techniques
                </button>
                <div className={`rounded-2xl p-5 bg-gradient-to-br ${technique.color} text-white mb-5 shadow-lg`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{technique.emoji}</span>
                        <div>
                            <p className="font-bold text-lg">{technique.title}</p>
                            <p className="text-white/80 text-xs">{technique.source}</p>
                        </div>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">{technique.desc}</p>
                </div>

                {/* Timer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Timer</p>
                        <p className="text-sm font-bold text-slate-700 tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} / {Math.floor(technique.duration / 60)}:{String(technique.duration % 60).padStart(2, '0')}</p>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full bg-gradient-to-r ${technique.color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={running ? pauseTimer : startTimer}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r ${technique.color} text-white`}>
                            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
                        </button>
                        <button onClick={resetTimer} className="w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center hover:bg-slate-50">
                            <RotateCcw className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                    {technique.steps.map((s, i) => (
                        <button key={i} onClick={() => setStepIdx(i)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${stepIdx === i ? 'border-violet-300 bg-violet-50 text-violet-800 font-semibold' :
                                i < stepIdx ? 'border-green-100 bg-green-50 text-green-700' : 'border-slate-100 bg-white text-slate-600'
                                }`}>
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${i < stepIdx ? 'bg-green-400 text-white' : stepIdx === i ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>{i < stepIdx ? '✓' : i + 1}</span>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {REGULATION_TECHNIQUES.map(t => (
                <button key={t.id} onClick={() => openTechnique(t.id)}
                    className="w-full text-left bg-white rounded-2xl border-2 border-slate-100 hover:border-violet-200 hover:shadow-md p-4 flex items-center gap-4 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${t.color} flex-shrink-0 shadow`}>{t.emoji}</div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{t.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.desc.slice(0, 70)}…</p>
                    </div>
                    <Play className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
            ))}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
//  SELF-CARE CHECKUP COMPONENT
// ───────────────────────────────────────────────────────────────────────────────
function SelfCareSection() {
    const [scores, setScores] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem('selfcare_scores') || '{}'); } catch { return {}; }
    });
    const [expanded, setExpanded] = useState<string | null>(null);

    const setScore = (id: string, val: number) => {
        const next = { ...scores, [id]: val };
        setScores(next);
        localStorage.setItem('selfcare_scores', JSON.stringify(next));
    };

    const avg = Object.values(scores).length ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length : 0;

    return (
        <div>
            {/* Overall score */}
            {Object.keys(scores).length > 0 && (
                <div className="bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl p-4 mb-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-white/80">Overall self-care score</p>
                            <p className="text-3xl font-black">{avg.toFixed(1)}<span className="text-lg opacity-70">/10</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-white/70">{Object.keys(scores).length}/6 areas rated</p>
                            <p className="text-xs text-white/60 mt-0.5">{avg < 5 ? 'Room to grow 🌱' : avg < 7 ? 'Steady ground 🌿' : 'Thriving 🌟'}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {SELF_CARE_DOMAINS.map(domain => {
                    const score = scores[domain.id];
                    const isOpen = expanded === domain.id;
                    return (
                        <div key={domain.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${domain.border} ${isOpen ? domain.lightBg : 'bg-white'}`}>
                            <button className="w-full px-4 py-3.5 flex items-center gap-3" onClick={() => setExpanded(isOpen ? null : domain.id)}>
                                <span className="text-xl">{domain.emoji}</span>
                                <span className="font-bold text-slate-800 text-sm flex-1 text-left">{domain.label}</span>
                                {score != null && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${domain.color}`} style={{ width: `${score * 10}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 tabular-nums">{score}/10</span>
                                    </div>
                                )}
                                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>

                            {isOpen && (
                                <div className="px-4 pb-4">
                                    <p className="text-xs text-slate-500 mb-3">How well are you caring for this area right now?</p>
                                    <div className="flex gap-1.5 mb-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <button key={n} onClick={() => setScore(domain.id, n)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${score === n ? `${domain.color} text-white shadow-sm` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}>{n}</button>
                                        ))}
                                    </div>
                                    {score != null && score <= 6 && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 mb-2">💡 Try one of these today:</p>
                                            <div className="space-y-1.5">
                                                {domain.suggestions.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-white rounded-xl px-3 py-2 border border-slate-100">
                                                        <span className="text-slate-300 mt-0.5">→</span>{s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ───────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'bingo', label: 'Wellness Bingo', emoji: '🎯', color: 'from-violet-500 to-pink-500', component: BingoSection },
    { id: 'ants', label: 'CBT Thought Tool', emoji: '🧠', color: 'from-amber-400 to-orange-500', component: ANTsSection },
    { id: 'regulate', label: 'Regulation Toolkit', emoji: '🌿', color: 'from-teal-400 to-emerald-500', component: RegulationSection },
    { id: 'selfcare', label: 'Self-Care Checkup', emoji: '💜', color: 'from-rose-400 to-pink-500', component: SelfCareSection },
];

export default function MentalWellnessPage() {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const section = SECTIONS.find(s => s.id === activeSection);

    if (activeSection && section) {
        const Component = section.component;
        return (
            <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #fdf4ff 50%, #fff1f5 100%)' }}>
                <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">
                    <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6">
                        ← Back to activities
                    </button>
                    <div className={`rounded-3xl p-5 bg-gradient-to-br ${section.color} text-white mb-6 shadow-xl`}>
                        <span className="text-3xl">{section.emoji}</span>
                        <h2 className="text-xl font-black mt-2">{section.label}</h2>
                    </div>
                    <Component />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #fdf4ff 50%, #fff1f5 100%)' }}>
            <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-violet-500 to-pink-500 shadow">🧩</div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Mental Wellness<br />Activities</h1>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Evidence-based interactive tools drawn from CBT, DBT, somatic therapy, and positive psychology. Built to use, not just read.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        Source: <a href="https://positivepsychology.com/mental-health-activities-worksheets-books/" target="_blank" className="underline hover:text-violet-500">PositivePsychology.com</a>
                    </p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: 'Bingo squares', value: (() => { try { return JSON.parse(localStorage.getItem('bingo_marked') || '[]').length; } catch { return 1; } })(), icon: '🎯' },
                        { label: 'Thoughts reframed', value: (() => { try { return JSON.parse(localStorage.getItem('ants_log') || '[]').length; } catch { return 0; } })(), icon: '🧠' },
                        { label: 'Self-care areas', value: (() => { try { return Object.keys(JSON.parse(localStorage.getItem('selfcare_scores') || '{}')).length; } catch { return 0; } })(), icon: '💜' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm">
                            <p className="text-xl mb-0.5">{stat.icon}</p>
                            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                            <p className="text-xs text-slate-400 leading-tight">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Activity cards */}
                <div className="grid grid-cols-2 gap-4">
                    {SECTIONS.map(section => {
                        const Component = section.component;
                        return (
                            <button key={section.id} onClick={() => setActiveSection(section.id)}
                                className="rounded-3xl overflow-hidden shadow-lg hover:scale-[1.02] transition-all text-left">
                                <div className={`p-5 bg-gradient-to-br ${section.color}`}>
                                    <span className="text-3xl">{section.emoji}</span>
                                    <p className="font-black text-white text-base mt-2 leading-snug">{section.label}</p>
                                </div>
                                <div className="bg-white px-4 py-3 border-t border-slate-50">
                                    <p className="text-xs text-slate-500 leading-snug">
                                        {section.id === 'bingo' && 'Mark off wellness activities. 5 in a row = BINGO 🎉'}
                                        {section.id === 'ants' && 'Catch, challenge & reframe negative thoughts (CBT)'}
                                        {section.id === 'regulate' && 'Guided breathing, grounding & somatic regulation'}
                                        {section.id === 'selfcare' && 'Rate 6 domains with personalised suggestions'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Research note */}
                <div className="mt-8 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-600 mb-2">📚 Evidence base</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        These tools draw from <strong>Cognitive Behavioral Therapy (CBT)</strong>, <strong>Dialectical Behavior Therapy (DBT)</strong>, <strong>Somatic Experiencing</strong>, and positive psychology research. They are psychoeducational tools — not a substitute for professional therapy.
                    </p>
                </div>
            </div>
        </div>
    );
}
