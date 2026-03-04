import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card } from "@/components/ui/card";
import {
    HeartPulse, ChevronLeft, Plus, Check, Moon, Zap, Droplets,
    Activity, ShieldCheck, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type BodyEntry = {
    date: string;
    sleepHours: number;
    sleepQuality: number;
    energy: number;
    hrv: number;
    physicalLoad: number;
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
                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${n <= value ? `${color} text-white shadow-lg` : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800'}`}>
                    {labels?.[n - 1] ?? n}
                </button>
            ))}
        </div>
    );
}

function NumInput({ value, onChange, min, max, step = 1, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit: string }) {
    return (
        <div className="flex items-center gap-4">
            <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xl text-slate-400 hover:bg-slate-700 transition-colors">−</button>
            <div className="flex-1 text-center"><span className="text-3xl font-black text-white">{value}</span><span className="text-xs text-slate-500 ml-2 font-bold uppercase">{unit}</span></div>
            <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xl text-slate-400 hover:bg-slate-700 transition-colors">+</button>
        </div>
    );
}

export default function MenBioscanPage() {
    const { user } = useAuth();
    const userId = user?.id || 'guest';
    const storageKey = `men_bioscan_entries_${userId}`;

    const [tab, setTab] = useState<'log' | 'trends'>('log');
    const [entries, setEntries] = useState<BodyEntry[]>([]);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ sleepHours: 7, sleepQuality: 3, energy: 3, hrv: 0, physicalLoad: 3, hydration: 8, notes: '' });

    useEffect(() => {
        try {
            const e = localStorage.getItem(storageKey);
            if (e) {
                const arr = JSON.parse(e);
                setEntries(arr);
                const t = arr.find((x: BodyEntry) => x.date === todayISO());
                if (t) {
                    const { date, ...r } = t;
                    setForm(r);
                    setSaved(true);
                }
            }
        } catch { }
    }, [storageKey]);

    const upd = (key: string, val: any) => { setForm(p => ({ ...p, [key]: val })); setSaved(false); };

    const save = () => {
        const today = todayISO();
        const entry: BodyEntry = { date: today, ...form };
        const next = [...entries.filter(e => e.date !== today), entry];
        setEntries(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(true);
    };

    const week7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]; });
    const days7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const WeekBar = ({ field, max, color }: { field: keyof BodyEntry; max: number; color: string }) => (
        <div className="flex gap-2 items-end h-20">
            {week7.map((date, i) => {
                const val = (entries.find(e => e.date === date)?.[field] as number) ?? 0;
                const pct = Math.max(5, Math.round((val / max) * 100));
                return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-800 rounded-lg overflow-hidden flex-1 flex flex-col justify-end">
                            <div className={`w-full rounded-lg ${color} shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-700`} style={{ height: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{days7[i]}</p>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />

            <div className="max-w-2xl mx-auto px-5 pt-12 sm:pt-20">

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg">
                        <HeartPulse className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1">Bioscan Core</h1>
                        <p className="text-xs text-cyan-500 font-black uppercase tracking-[0.2em]">Daily Biometric Calibration</p>
                    </div>
                </div>

                <div className="flex bg-slate-900 rounded-2xl p-1 border border-white/5 shadow-2xl gap-1 mb-8">
                    <button onClick={() => setTab('log')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'log' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}>Daily Log</button>
                    <button onClick={() => setTab('trends')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'trends' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>Biometric Trends</button>
                </div>

                <div className="space-y-6">
                    {tab === 'log' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <LogCard icon={Moon} label="Hours of Sleep" color="text-cyan-400">
                                <NumInput value={form.sleepHours} onChange={v => upd('sleepHours', v)} min={0} max={14} step={0.5} unit="hrs" />
                            </LogCard>

                            <LogCard label="Sleep Architecture (Quality)" color="text-cyan-400">
                                <BarRating value={form.sleepQuality} onChange={v => upd('sleepQuality', v)} color="bg-cyan-600" labels={['Poor', 'Fair', 'Solid', 'Peak', 'Elite']} />
                            </LogCard>

                            <LogCard icon={Zap} label="Metabolic Energy" color="text-amber-400">
                                <BarRating value={form.energy} onChange={v => upd('energy', v)} color="bg-amber-500" labels={['Depleted', 'Low', 'Moderate', 'Strong', 'Maximal']} />
                            </LogCard>

                            <LogCard icon={Activity} label="Physical Load (Training Stress)" color="text-indigo-400">
                                <BarRating value={form.physicalLoad} onChange={v => upd('physicalLoad', v)} color="bg-indigo-600" labels={['Rest', 'Active', 'Moderate', 'Heavy', 'Maximal']} />
                            </LogCard>

                            <LogCard label="HRV Delta (ms)" color="text-cyan-400">
                                <NumInput value={form.hrv} onChange={v => upd('hrv', v)} min={0} max={250} step={1} unit="ms" />
                                {form.hrv > 0 && (
                                    <p className="text-[10px] text-cyan-400 mt-4 text-center font-black uppercase tracking-widest opacity-80">
                                        {form.hrv < 45 ? '⚠️ High Stress — Rest Advised' : form.hrv < 80 ? '🟡 Moderate Recovery' : '🟢 Peak Parasympathetic Tone'}
                                    </p>
                                )}
                            </LogCard>

                            <button onClick={save} className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-none ${saved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white text-slate-900 hover:bg-cyan-500 hover:text-white shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-[0.98]'}`}>
                                {saved ? <><Check className="w-4 h-4" /> Synchronization Complete</> : <><Plus className="w-4 h-4" /> Initialize Daily Scan</>}
                            </button>

                            <div className="flex justify-center pt-4">
                                <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Isolated Biometric Vault</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'trends' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            {[
                                { label: 'Sleep Trajectory', field: 'sleepHours' as keyof BodyEntry, max: 12, color: 'bg-cyan-500' },
                                { label: 'Energy Capacity', field: 'energy' as keyof BodyEntry, max: 5, color: 'bg-amber-500' },
                                { label: 'Physical Load Stress', field: 'physicalLoad' as keyof BodyEntry, max: 5, color: 'bg-indigo-500' },
                                { label: 'HRV baseline', field: 'hrv' as keyof BodyEntry, max: 150, color: 'bg-emerald-500' },
                            ].map(({ label, field, max, color }) => (
                                <Card key={field as string} className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-md">
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                                        <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
                                    </div>
                                    <WeekBar field={field} max={max} color={color} />
                                </Card>
                            ))}
                            {entries.length === 0 && (
                                <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-white/5 border-dashed">
                                    <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No Scan Data Found</p>
                                    <p className="text-xs text-slate-700 mt-2">Initialize your first scan to begin mapping trends.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LogCard({ icon: Icon, label, children, color }: any) {
    return (
        <Card className="p-7 bg-slate-900/40 border-white/5 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                {Icon && <Icon className={`w-4 h-4 ${color}`} />}
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </Card>
    );
}
