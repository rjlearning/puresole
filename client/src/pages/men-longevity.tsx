import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, Sparkles, TrendingUp, ShieldCheck, Dna, Zap,
    Clock, Heart, Activity, Info
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

export default function MenLongevityPage() {
    const { data: longevityData, isLoading } = useQuery<any>({
        queryKey: ["/api/men/longevity"],
    });

    const biologicalAge = longevityData?.biologicalAge || 28.5;
    const chronologicalAge = longevityData?.chronologicalAge || 32;
    const markers = longevityData?.markers || [];
    const timeline = longevityData?.timeline || [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin text-indigo-500"><Activity className="w-8 h-8" /></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full -mr-64 -mt-32 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20">
                <Link href="/men">
                    <Button variant="ghost" size="sm" className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/5">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Evolution Hub
                    </Button>
                </Link>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
                                <Dna className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">Longevity Engine</h1>
                        </div>
                        <p className="text-lg text-slate-400 max-w-xl font-medium">Biological age derivation & cellular performance trajectory.</p>
                    </div>

                    <Card className="p-8 bg-indigo-950/40 border-white/5 backdrop-blur-2xl flex items-center gap-8 shadow-2xl">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">Biological Age</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-black text-white tracking-tighter">{biologicalAge}</span>
                                <span className="text-xs font-bold text-indigo-400 uppercase">Yrs</span>
                            </div>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">Age Delta</p>
                            <div className="flex items-center justify-center text-emerald-400">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                <span className="text-2xl font-black tracking-tighter">-{chronologicalAge - biologicalAge}.5</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8 bg-slate-900/40 border-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Biological Trajectory</h2>
                                    <p className="text-sm text-slate-500">Projected cellular age based on biomarker velocity</p>
                                </div>
                                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeline}>
                                        <defs>
                                            <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                        <YAxis domain={[25, 35]} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none' }}
                                            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="age" stroke="#818cf8" strokeWidth={4} fill="url(#colorAge)" animationDuration={3000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {markers.map((m: any) => (
                                <Card key={m.name} className="p-6 bg-slate-900 border-white/5 group hover:border-indigo-500/20 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{m.name}</h3>
                                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5 uppercase tracking-tighter">{m.status}</span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="w-2/3 h-2 bg-slate-800 rounded-full overflow-hidden self-center">
                                            <div className="h-full transition-all duration-1000" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
                                        </div>
                                        <span className="text-2xl font-black text-white">{m.score}%</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-8 bg-slate-900/60 border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all" />
                            <Sparkles className="w-8 h-8 text-indigo-400 mb-6" />
                            <h3 className="text-xl font-black text-white mb-4">AI Longevity Audit</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
                                Your baseline markers suggest high metabolic flexibility, contributing to a 3.5 year age reduction. Maintaining current testosterone-to-cortisol ratios is critical for sustained longevity.
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-1 h-full bg-indigo-500 rounded-full" />
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Focus on Glycemic stability during REM window.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-1 h-full bg-emerald-500 rounded-full" />
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Telomere support stack initialized.</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 bg-indigo-950 border-none relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-black text-white text-sm uppercase tracking-widest">Structural Protection</h3>
                            </div>
                            <p className="text-xs text-indigo-200/60 italic leading-relaxed font-medium">
                                "Cellular age is a derived metric based on endocrine trajectory and glycemic load. This is not a diagnostic clinical age."
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
