import { useState, useEffect } from 'react';
import { HeartPulse, ChevronLeft, Plus, Check, Moon, Zap, Droplets } from 'lucide-react';
import { Link } from 'wouter';
import MeshBackground from "@/components/MeshBackground";

type BodyEntry = {
    date: string;
    sleepHours: number;
    sleepQuality: number;
    energy: number;
    hrv: number;
    feedingSessions: number;
    hydration: number;
    notes: string;
};

function todayISO() { return new Date().toISOString().split('T')[0]; }

function BarRating({ value, max = 5, onChange, color, labels }: {
    value: number; max?: number; onChange: (v: number) => void; color: string; labels?: string[];
}) {
    return (
        <div className="flex gap-1.5">
            {Array.from({ length: max }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => onChange(n)}
                    className={`flex-1 h-8 rounded-xl text-xs font-bold transition-all ${n <= value ? `${color} text-white shadow-sm` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                    {labels?.[n - 1] ?? n}
                </button>
            ))}
        </div>
    );
}

function NumInput({ value, onChange, min, max, step = 1, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit: string }) {
    return (
        <div className="flex items-center gap-3">
            <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-lg hover:bg-slate-200">−</button>
            <div className="flex-1 text-center"><span className="text-2xl font-black text-slate-800">{value}</span><span className="text-sm text-slate-400 ml-1">{unit}</span></div>
            <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-lg hover:bg-slate-200">+</button>
        </div>
    );
}

export default function WomenBodyPage() {
    const [tab, setTab] = useState<'log' | 'trends' | 'tips'>('log');
    const [entries, setEntries] = useState<BodyEntry[]>([]);
    const [saved, setSaved] = useState(false);
    const [showFeeding, setShowFeeding] = useState(false);
    const [form, setForm] = useState({ sleepHours: 7, sleepQuality: 3, energy: 3, hrv: 0, feedingSessions: 0, hydration: 6, notes: '' });

    useEffect(() => {
        try {
            const e = localStorage.getItem('body_entries');
            const s = localStorage.getItem('body_show_feeding');
            if (e) { const arr = JSON.parse(e); setEntries(arr); const t = arr.find((x: BodyEntry) => x.date === todayISO()); if (t) { const { date, ...r } = t; setForm(r); setSaved(true); } }
            if (s) setShowFeeding(s === 'true');
        } catch { }
    }, []);

    const upd = (key: string, val: any) => { setForm(p => ({ ...p, [key]: val })); setSaved(false); };

    const save = () => {
        const today = todayISO();
        const entry: BodyEntry = { date: today, ...form };
        const next = [...entries.filter(e => e.date !== today), entry];
        setEntries(next);
        localStorage.setItem('body_entries', JSON.stringify(next));
        localStorage.setItem('women_biometrics', JSON.stringify({ sleepHours: form.sleepHours, sleepQuality: form.sleepQuality, energy: form.energy, hrv: form.hrv, hydration: form.hydration }));
        setSaved(true);
    };

    const week7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]; });
    const days7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const WeekBar = ({ field, max, color }: { field: keyof BodyEntry; max: number; color: string }) => (
        <div className="flex gap-1.5 items-end" style={{ height: 64 }}>
            {week7.map((date, i) => {
                const val = (entries.find(e => e.date === date)?.[field] as number) ?? 0;
                const pct = Math.max(2, Math.round((val / max) * 100));
                return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-slate-100 rounded-lg overflow-hidden flex-1 flex flex-col justify-end">
                            <div className={`w-full rounded-lg ${color}`} style={{ height: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400">{days7[i]}</p>
                    </div>
                );
            })}
        </div>
    );

    const tabs = [{ id: 'log' as const, label: 'Today' }, { id: 'trends' as const, label: 'This Week' }, { id: 'tips' as const, label: 'Recovery Tips' }];

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden text-slate-900">
            <MeshBackground variant="rose" />
            <div className="px-5 pt-10 pb-4 max-w-2xl mx-auto relative z-10">
                <Link href="/women">
                    <span className="flex items-center gap-1.5 text-sm text-teal-500 font-bold hover:text-teal-600 mb-5 cursor-pointer">← Women's Hub</span>
                </Link>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow text-white font-bold" style={{ background: 'linear-gradient(135deg,#2dd4bf,#34d399)' }}>💓</div>
                    <div><h1 className="text-xl font-black text-slate-900">Body & Recovery</h1><p className="text-xs text-teal-500">Sleep · HRV · energy · feeding</p></div>
                </div>
                <div className="flex bg-white/40 backdrop-blur-xl rounded-2xl p-1 border border-teal-100 shadow-sm gap-1">
                    {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-500 hover:bg-teal-50'}`}>{t.label}</button>)}
                </div>
            </div>

            <div className="px-5 max-w-2xl mx-auto space-y-4 relative z-10">
                {tab === 'log' && <>
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-teal-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3"><Moon className="w-4 h-4 text-teal-400" /><p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Hours of sleep</p></div>
                        <NumInput value={form.sleepHours} onChange={v => upd('sleepHours', v)} min={0} max={12} step={0.5} unit="hrs" />
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-3">😴 Sleep quality</p>
                        <BarRating value={form.sleepQuality} onChange={v => upd('sleepQuality', v)} color="bg-teal-500" labels={['Poor', 'Fair', 'OK', 'Good', 'Great']} />
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-amber-400" /><p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Energy level</p></div>
                        <BarRating value={form.energy} onChange={v => upd('energy', v)} color="bg-amber-400" labels={['Depleted', 'Low', 'Moderate', 'Good', 'High']} />
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1">💓 HRV (optional)</p>
                        <p className="text-xs text-slate-400 mb-3">From Apple Watch, Oura, Garmin, etc. Leave 0 if not tracking.</p>
                        <NumInput value={form.hrv} onChange={v => upd('hrv', v)} min={0} max={200} step={1} unit="ms" />
                        {form.hrv > 0 && <p className="text-xs text-teal-400 mt-2 text-center">{form.hrv < 40 ? '⚠️ Low — prioritise rest and gentle movement today' : form.hrv < 70 ? '🟡 Moderate — listen to your body' : '🟢 High — strong recovery today'}</p>}
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3"><Droplets className="w-4 h-4 text-blue-400" /><p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Hydration</p></div>
                        <NumInput value={form.hydration} onChange={v => upd('hydration', v)} min={0} max={12} step={1} unit="glasses" />
                        {form.hydration < 6 && <p className="text-xs text-amber-400 text-center mt-2">💧 Breastfeeding increases fluid needs — try one more glass.</p>}
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">🍼 Feeding sessions</p>
                            <button onClick={() => { setShowFeeding(!showFeeding); localStorage.setItem('body_show_feeding', String(!showFeeding)); }} className="text-xs text-slate-400 hover:text-teal-500">{showFeeding ? 'Hide' : 'In postpartum? Show'}</button>
                        </div>
                        {showFeeding ? <NumInput value={form.feedingSessions} onChange={v => upd('feedingSessions', v)} min={0} max={24} step={1} unit="sessions" /> : <p className="text-xs text-slate-300 text-center">Tap to track breastfeeding/bottle sessions</p>}
                    </div>
                    <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                        <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">📝 Body notes</p>
                        <textarea value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Pain, tightness, soreness — anything you noticed..." className="w-full text-sm text-slate-700 placeholder:text-slate-300 outline-none resize-none" rows={3} />
                    </div>
                    <button onClick={save} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saved ? 'bg-green-100 text-green-600' : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'}`}>
                        {saved ? <><Check className="w-4 h-4" /> Saved — companion has this context</> : <><Plus className="w-4 h-4" /> Save body log</>}
                    </button>
                    <p className="text-xs text-teal-400/60 text-center pb-2">Your biometrics feed into the Emotional Companion's understanding of your physical load.</p>
                </>}

                {tab === 'trends' && <div className="space-y-5">
                    <p className="text-xs text-slate-400 text-center">Your past 7 days</p>
                    {[
                        { label: '💤 Sleep hours', field: 'sleepHours' as keyof BodyEntry, max: 10, color: 'bg-violet-400' },
                        { label: '😴 Sleep quality', field: 'sleepQuality' as keyof BodyEntry, max: 5, color: 'bg-teal-400' },
                        { label: '⚡ Energy', field: 'energy' as keyof BodyEntry, max: 5, color: 'bg-amber-400' },
                        { label: '💧 Hydration', field: 'hydration' as keyof BodyEntry, max: 10, color: 'bg-blue-400' },
                    ].map(({ label, field, max, color }) => (
                        <div key={field as string} className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
                            <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-3">{label}</p>
                            <WeekBar field={field} max={max} color={color} />
                        </div>
                    ))}
                    {entries.length === 0 && <div className="bg-white rounded-2xl border border-teal-100 p-8 text-center"><p className="text-4xl mb-2">💓</p><p className="font-bold text-slate-600">No data yet</p><p className="text-sm text-slate-400">Log today to start seeing trends.</p></div>}
                </div>}

                {tab === 'tips' && <div className="space-y-4">
                    {[
                        { title: '💤 Fourth trimester sleep', content: 'Fragmented postpartum sleep is a genuine physiological burden — but your body is also running on oxytocin and prolactin. Rest over productivity whenever you can.', color: 'bg-violet-50 border-violet-100' },
                        { title: '💓 What HRV tells you', content: 'Heart Rate Variability reflects your nervous system\'s adaptability. Postpartum HRV is typically lower, especially with broken sleep. Track weekly trends — not single readings.', color: 'bg-teal-50 border-teal-100' },
                        { title: '💧 Postpartum hydration', content: 'Breastfeeding adds up to 600–900ml of extra fluid demand per day. Dehydration mimics depression, causes fatigue, and reduces milk supply. Keep water visible and close.', color: 'bg-blue-50 border-blue-100' },
                        { title: '⚡ Energy windows', content: 'Track energy not to optimise but to notice patterns. Protect the 1–2 windows each day when you do have capacity, and let go of the rest without guilt.', color: 'bg-amber-50 border-amber-100' },
                        { title: '🏃 Returning to exercise', content: 'Most pelvic floor physios recommend 6–12 weeks post-vaginal and 12+ weeks post-caesarean before higher impact exercise. Walking, breathing, and rest are valid recovery strategies.', color: 'bg-emerald-50 border-emerald-100' },
                    ].map((tip, i) => (
                        <div key={i} className={`rounded-2xl border p-5 ${tip.color}`}>
                            <p className="font-bold text-slate-800 text-sm mb-2">{tip.title}</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{tip.content}</p>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    );
}
