import { useState, useEffect } from 'react';
import { Moon, ChevronLeft, Plus, Check, TrendingUp, Droplets, Zap, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { usePhase } from '@/context/PhaseContext';
import MeshBackground from "@/components/MeshBackground";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
type CycleEntry = {
    date: string; // ISO date string YYYY-MM-DD
    day: number;  // cycle day 1-based
    mood: number; // 1-5
    energy: number; // 1-5
    symptoms: string[];
    notes: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PHASES: { id: Phase; label: string; days: string; color: string; bg: string; emoji: string; desc: string }[] = [
    { id: 'menstrual', label: 'Menstrual', days: 'Days 1–5', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', emoji: '🩸', desc: 'Estrogen & progesterone at their lowest. Rest is biological wisdom, not laziness.' },
    { id: 'follicular', label: 'Follicular', days: 'Days 6–13', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', emoji: '🌱', desc: 'Rising estrogen fuels energy, creativity, and social drive. A natural upswing.' },
    { id: 'ovulatory', label: 'Ovulatory', days: 'Days 14–17', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', emoji: '✨', desc: 'Peak estrogen and testosterone. Highest verbal fluency, confidence, and libido.' },
    { id: 'luteal', label: 'Luteal', days: 'Days 18–28', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', emoji: '🌙', desc: 'Progesterone rises then crashes. PMS window. Prioritise warmth, boundaries, slowing down.' },
];

const SYMPTOMS = [
    'Cramps', 'Bloating', 'Headache', 'Tender breasts', 'Fatigue',
    'Mood swings', 'Acne', 'Back pain', 'Cravings', 'Insomnia',
    'Brain fog', 'Irritability', 'Anxiety', 'Low libido', 'Spotting',
];

const MOOD_LABELS = ['', 'Very low', 'Low', 'Neutral', 'Good', 'Great'];
const ENERGY_LABELS = ['', 'Drained', 'Low', 'Moderate', 'Good', 'High'];

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function getPhaseForDay(day: number): Phase {
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'follicular';
    if (day <= 17) return 'ovulatory';
    return 'luteal';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => onChange(n)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${n <= value ? `${color} text-white shadow-sm` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}>{n}</button>
            ))}
        </div>
    );
}

export default function WomenCyclePage() {
    const { phase, phaseInfo } = usePhase();
    const [tab, setTab] = useState<'log' | 'phases' | 'history'>('log');
    const [cycleDay, setCycleDay] = useState(1);
    const [cycleLength, setCycleLength] = useState(28);
    const [entry, setEntry] = useState<Omit<CycleEntry, 'date' | 'day'>>({
        mood: 0, energy: 0, symptoms: [], notes: ''
    });
    const [saved, setSaved] = useState(false);
    const [entries, setEntries] = useState<CycleEntry[]>([]);

    // ── Load ──
    useEffect(() => {
        const d = localStorage.getItem('cycle_day');
        const l = localStorage.getItem('cycle_length');
        const e = localStorage.getItem('cycle_entries');
        if (d) setCycleDay(parseInt(d));
        if (l) setCycleLength(parseInt(l));
        if (e) { try { setEntries(JSON.parse(e)); } catch { } }

        // Check if already logged today
        const today = todayISO();
        if (e) {
            try {
                const arr: CycleEntry[] = JSON.parse(e);
                const todayEntry = arr.find(x => x.date === today);
                if (todayEntry) {
                    setEntry({ mood: todayEntry.mood, energy: todayEntry.energy, symptoms: todayEntry.symptoms, notes: todayEntry.notes });
                    setSaved(true);
                }
            } catch { }
        }
    }, []);

    const currentPhase = getPhaseForDay(cycleDay);
    const currentPhaseData = PHASES.find(p => p.id === currentPhase)!;

    const toggleSymptom = (s: string) => {
        setEntry(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(s) ? prev.symptoms.filter(x => x !== s) : [...prev.symptoms, s]
        }));
        setSaved(false);
    };

    const saveEntry = () => {
        const today = todayISO();
        const newEntry: CycleEntry = { date: today, day: cycleDay, ...entry };
        const next = [...entries.filter(e => e.date !== today), newEntry];
        setEntries(next);
        localStorage.setItem('cycle_entries', JSON.stringify(next));
        setSaved(true);
    };

    const setCycleDayAndSave = (d: number) => {
        setCycleDay(d);
        localStorage.setItem('cycle_day', String(d));
        setSaved(false);
    };

    // ── Tabs header ──────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'log' as const, label: "Today's Log" },
        { id: 'phases' as const, label: 'Phase Guide' },
        { id: 'history' as const, label: 'History' },
    ];

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden text-slate-900">
            <MeshBackground variant="rose" />

            {/* Header */}
            <div className="px-5 pt-10 pb-4 max-w-2xl mx-auto relative z-10">
                <Link href="/women">
                    <span className="flex items-center gap-1.5 text-sm text-rose-500 font-bold hover:text-rose-600 mb-5 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" /> Women's Hub
                    </span>
                </Link>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow" style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}>
                        🌙
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-purple-900">Cycle & Hormones</h1>
                        <p className="text-xs text-purple-400">Track your cycle · understand your patterns</p>
                    </div>
                </div>

                {/* Phase pill */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${currentPhaseData.bg} ${currentPhaseData.color} mb-4`}>
                    <span>{currentPhaseData.emoji}</span>
                    <span>{currentPhaseData.label} Phase</span>
                    <span className="text-xs opacity-60">· Day {cycleDay}</span>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/40 backdrop-blur-xl rounded-2xl p-1 border border-rose-100/50 shadow-sm gap-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:bg-rose-50'
                                }`}>{t.label}</button>
                    ))}
                </div>
            </div>

            <div className="px-5 max-w-2xl mx-auto space-y-4 relative z-10">

                {/* ── TAB: LOG ─────────────────────────────────────────────── */}
                {tab === 'log' && (
                    <>
                        {/* Cycle day selector */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-rose-100 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Cycle Trajectory</p>
                            <div className="flex items-center gap-3 mb-3">
                                <button onClick={() => setCycleDayAndSave(Math.max(1, cycleDay - 1))}
                                    className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-all">
                                    <ChevronLeft className="w-4 h-4 text-purple-500" />
                                </button>
                                <div className="flex-1 text-center">
                                    <p className="text-3xl font-black text-purple-900">Day {cycleDay}</p>
                                    <p className="text-xs text-purple-400">of {cycleLength}-day cycle</p>
                                </div>
                                <button onClick={() => setCycleDayAndSave(Math.min(cycleLength, cycleDay + 1))}
                                    className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-all">
                                    <ChevronRight className="w-4 h-4 text-purple-500" />
                                </button>
                            </div>
                            {/* Visual progress bar */}
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                {PHASES.map((ph, i) => {
                                    const starts = [0, 5, 13, 17];
                                    const ends = [5, 13, 17, cycleLength];
                                    const w = ((ends[i] - starts[i]) / cycleLength) * 100;
                                    const colors = ['bg-rose-400', 'bg-violet-400', 'bg-amber-400', 'bg-teal-400'];
                                    return (
                                        <div key={ph.id} className={`h-full inline-block ${colors[i]} ${i > 0 ? 'border-l border-white' : ''}`}
                                            style={{ width: `${w}%` }} />
                                    );
                                })}
                            </div>
                            <div className="mt-2">
                                <div className="h-2 relative">
                                    <div className="absolute top-0 w-2 h-2 rounded-full bg-rose-600 shadow border-2 border-white transform -translate-x-1/2"
                                        style={{ left: `${((cycleDay - 0.5) / cycleLength) * 100}%` }} />
                                </div>
                            </div>
                            <p className="text-xs text-center text-rose-300 mt-1">{currentPhaseData.emoji} {currentPhaseData.label}</p>
                            {/* Reset to Day 1 */}
                            <button
                                onClick={() => setCycleDayAndSave(1)}
                                className="mt-3 w-full py-1.5 rounded-xl text-xs font-bold text-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all border border-dashed border-purple-200"
                            >
                                🔄 Reset to Day 1 (new cycle started)
                            </button>
                        </div>

                        {/* Mood */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-rose-100 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Mood Balance</p>
                            <StarRating value={entry.mood} onChange={v => { setEntry(e => ({ ...e, mood: v })); setSaved(false); }} color="bg-violet-500" />
                            {entry.mood > 0 && <p className="text-xs text-slate-400 mt-2">{MOOD_LABELS[entry.mood]}</p>}
                        </div>

                        {/* Energy */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-rose-100 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Energy Depth</p>
                            <StarRating value={entry.energy} onChange={v => { setEntry(e => ({ ...e, energy: v })); setSaved(false); }} color="bg-amber-500" />
                            {entry.energy > 0 && <p className="text-xs text-slate-400 mt-2">{ENERGY_LABELS[entry.energy]}</p>}
                        </div>

                        {/* Symptoms */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-rose-100 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Somatic Markers</p>
                            <div className="flex flex-wrap gap-2">
                                {SYMPTOMS.map(s => (
                                    <button key={s} onClick={() => toggleSymptom(s)}
                                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${entry.symptoms.includes(s) ? 'bg-purple-500 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200'
                                            }`}>{s}</button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
                            <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">📝 Notes</p>
                            <textarea value={entry.notes} onChange={e => { setEntry(prev => ({ ...prev, notes: e.target.value })); setSaved(false); }}
                                placeholder="Anything you noticed today — physical, emotional, relational..."
                                className="w-full text-sm text-slate-700 placeholder:text-slate-300 outline-none resize-none"
                                rows={3} />
                        </div>

                        {/* Phase insight */}
                        <div className={`rounded-2xl border p-4 ${currentPhaseData.bg}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${currentPhaseData.color}`}>{currentPhaseData.emoji} Phase insight</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{currentPhaseData.desc}</p>
                        </div>

                        {/* Save */}
                        <button onClick={saveEntry}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saved ? 'bg-green-100 text-green-600' : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg'
                                }`}>
                            {saved ? <><Check className="w-4 h-4" /> Logged for today</> : <><Plus className="w-4 h-4" /> Save today's log</>}
                        </button>
                    </>
                )}

                {/* ── TAB: PHASES ──────────────────────────────────────────── */}
                {tab === 'phases' && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your menstrual cycle is governed by four distinct hormonal phases. Understanding them helps you work <em>with</em> your biology, not against it.
                        </p>
                        {PHASES.map(ph => (
                            <div key={ph.id} className={`rounded-2xl border p-5 ${ph.bg}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{ph.emoji}</span>
                                    <div>
                                        <p className={`font-black text-base ${ph.color}`}>{ph.label} Phase</p>
                                        <p className="text-xs text-slate-400">{ph.days} (avg {ph.label === 'Luteal' ? `${cycleLength - 17}` : ph.days.split('–')[1]?.split(' ')[0]} days)</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">{ph.desc}</p>
                                <div className="mt-3 pt-3 border-t border-white/60">
                                    <p className="text-xs font-semibold text-slate-500 mb-1">Practical adjustments:</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {ph.id === 'menstrual' && 'Reduce intense workouts · prioritise iron-rich foods · cancel what you can · sleep more.'}
                                        {ph.id === 'follicular' && 'Start new projects · schedule hard conversations · try new things · experiment with diet and exercise.'}
                                        {ph.id === 'ovulatory' && 'Negotiate, present, collaborate · high-protein meals · intense exercise tolerated well.'}
                                        {ph.id === 'luteal' && 'Slow down creative output · eat magnesium-rich foods · gentle movement · journal · set limits.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                            <p className="text-xs font-bold text-slate-500 mb-2">📐 My cycle length</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setCycleLength(l => Math.max(21, l - 1)); localStorage.setItem('cycle_length', String(Math.max(21, cycleLength - 1))); }}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-sm font-bold">−</button>
                                <p className="font-black text-2xl text-slate-800 flex-1 text-center">{cycleLength} <span className="text-sm text-slate-400 font-normal">days</span></p>
                                <button onClick={() => { setCycleLength(l => Math.min(35, l + 1)); localStorage.setItem('cycle_length', String(Math.min(35, cycleLength + 1))); }}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-sm font-bold">+</button>
                            </div>
                            <p className="text-xs text-slate-300 text-center mt-1">Average is 21–35 days</p>
                        </div>
                    </div>
                )}

                {/* ── TAB: HISTORY ─────────────────────────────────────────── */}
                {tab === 'history' && (
                    <div className="space-y-3">
                        {entries.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center shadow-sm">
                                <p className="text-4xl mb-3">🌙</p>
                                <p className="font-bold text-slate-600">No logs yet</p>
                                <p className="text-sm text-slate-400 mt-1">Start logging today to build your pattern history.</p>
                            </div>
                        ) : [...entries].reverse().map((e, i) => {
                            const ph = PHASES.find(p => p.id === getPhaseForDay(e.day))!;
                            return (
                                <div key={i} className={`rounded-2xl border p-4 ${ph.bg}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{ph.emoji}</span>
                                            <div>
                                                <p className={`text-xs font-bold ${ph.color}`}>{ph.label}</p>
                                                <p className="text-xs text-slate-400">Day {e.day} · {e.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 text-right">
                                            {e.mood > 0 && <div className="text-center"><p className="text-xs text-slate-400">Mood</p><p className="font-black text-slate-700">{e.mood}/5</p></div>}
                                            {e.energy > 0 && <div className="text-center"><p className="text-xs text-slate-400">Energy</p><p className="font-black text-slate-700">{e.energy}/5</p></div>}
                                        </div>
                                    </div>
                                    {e.symptoms.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {e.symptoms.map(s => <span key={s} className="text-xs bg-white/80 text-slate-500 px-2 py-0.5 rounded-full">{s}</span>)}
                                        </div>
                                    )}
                                    {e.notes && <p className="text-xs text-slate-500 italic leading-relaxed">"{e.notes}"</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
