import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
    HeartPulse, Activity, ChevronLeft, Sparkles, TrendingUp, ShieldCheck, Dna, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const RECOMMENDATIONS: Record<string, string> = {
    testosterone: "Resistance training + optimized sleep protocol (aim for 7.5h+).",
    cortisol: "Morning sunlight + magnesium protocol for autonomic balance.",
    shbg: "Focus on micronutrient density (Zinc/Boron) to optimize free index.",
    glucose: "Peak metabolic flexibility. Maintain low-glycemic breakfast load."
};

const RANGES: Record<string, { min: number, max: number, unit: string }> = {
    testosterone: { min: 400, max: 1000, unit: 'ng/dL' },
    cortisol: { min: 6, max: 23, unit: 'mcg/dL' },
    shbg: { min: 16, max: 55, unit: 'nmol/L' },
    glucose: { min: 70, max: 95, unit: 'mg/dL' }
};

export default function MenMetabolicPanel() {
    // Mocking API for now to ensure UI functionality
    const biomarkers = [
        { testedAt: "2024-02-01", biomarkerType: "testosterone", value: 580, unit: 'ng/dL' },
        { testedAt: "2024-02-15", biomarkerType: "testosterone", value: 610, unit: 'ng/dL' },
        { testedAt: "2024-03-01", biomarkerType: "testosterone", value: 645, unit: 'ng/dL' },
    ];

    const latestStats = {
        testosterone: 645,
        cortisol: 14,
        shbg: 32,
        glucose: 88
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20">
                <Link href="/men">
                    <Button variant="ghost" size="sm" className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/5">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Evolution Hub
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                                <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Metabolic Core</h1>
                        </div>
                        <p className="text-slate-400 text-lg max-w-xl">Precision performance biomarkers & endocrine trajectory analysis.</p>
                    </div>

                    <Card className="px-6 py-4 bg-white/5 border-white/10 backdrop-blur-xl flex items-center gap-5">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="22" fill="none" stroke="#1e293b" strokeWidth="4" />
                                <circle
                                    cx="24" cy="24" r="22" fill="none" stroke="#818cf8" strokeWidth="4"
                                    strokeDasharray={138.2}
                                    strokeDashoffset={138.2 - (138.2 * 82) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-black text-indigo-400">82</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-0.5">Performance Score</p>
                            <p className="text-sm font-black text-white">Elite Trajectory</p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {Object.entries(RANGES).map(([key, range]) => {
                        const val = latestStats[key as keyof typeof latestStats];
                        const isOptimal = val >= range.min && val <= range.max;

                        return (
                            <Card key={key} className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-md group hover:border-indigo-500/30 transition-all">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">{key}</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-black text-white">{val}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{range.unit}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full transition-all duration-1000 ${isOptimal ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min((val / range.max) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    {RECOMMENDATIONS[key]}
                                </p>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 p-8 bg-slate-900/40 border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Trajectory Analysis</h2>
                                <p className="text-sm text-slate-500">Endocrine stability over 90 days</p>
                            </div>
                            <div className="flex gap-2 p-1 bg-slate-800 rounded-xl">
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white">30D</Button>
                                <Button size="sm" className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white">90D</Button>
                            </div>
                        </div>

                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={biomarkers}>
                                    <defs>
                                        <linearGradient id="colorTest" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis
                                        dataKey="testedAt"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short' })}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#818cf8"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTest)"
                                        animationDuration={2500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="p-8 bg-indigo-600 border-none shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all pointer-events-none" />
                            <Sparkles className="w-10 h-10 text-white/20 mb-6 group-hover:rotate-12 transition-transform" />
                            <h3 className="text-xl font-black text-white mb-2">Evolutionary Stack</h3>
                            <p className="text-sm text-indigo-100/80 mb-8 leading-relaxed font-medium">
                                Current testosterone load is sub-peak. We've adjusted your optimization protocol for Week 5 focus.
                            </p>
                            <Link href="/men/protocol">
                                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-black rounded-2xl h-14 uppercase tracking-widest text-xs border-none shadow-xl active:scale-95 transition-all">
                                    View Optimization Stack
                                </Button>
                            </Link>
                        </Card>

                        <Card className="p-8 bg-slate-900 border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-white/5 p-2 rounded-xl">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="font-black text-white tracking-tight">Clinical Guards</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-1 h-full bg-emerald-500 rounded-full" />
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Endocrine markers within high-performance tolerance.
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-1 h-full bg-indigo-500 rounded-full" />
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Metabolic flexibility score: 94%.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
