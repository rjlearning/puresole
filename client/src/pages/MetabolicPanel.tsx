import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
    HeartPulse,
    ChevronRight,
    ChevronLeft,
    Info,
    History,
    TrendingDown,
    TrendingUp,
    Minus,
    Sparkles,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import RecoveryRoadmap from "@/components/RecoveryRoadmap";
import { Gauge } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const RECOMMENDATIONS: Record<string, string> = {
    ferritin: "Increase iron-rich foods (lentils, spinach) + Vitamin C for absorption.",
    vitaminD: "Daily morning sunlight + K2/D3 supplement protocol recommended.",
    tsh: "Monitor thyroid function; ensure adequate iodine and selenium intake.",
    glucose: "Focus on low-glycemic index meals to stabilize postpartum hormones."
};

const RANGES: Record<string, { min: number, max: number, unit: string }> = {
    ferritin: { min: 30, max: 150, unit: 'ng/mL' },
    vitaminD: { min: 30, max: 100, unit: 'ng/mL' },
    tsh: { min: 0.5, max: 4.5, unit: 'mIU/L' },
    glucose: { min: 70, max: 100, unit: 'mg/dL' }
};

export default function MetabolicPanel() {
    const { data: biomarkers = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/postpartum/biomarkers"],
    });

    const { data: context = null } = useQuery<any>({
        queryKey: ["/api/postpartum/context"],
    });

    const { data: analysis = null } = useQuery<any>({
        queryKey: ["/api/postpartum/comprehensive-analysis"],
    });

    if (isLoading) return <div className="p-8 text-center">Calibrating metabolic engine...</div>;

    const latestStats = biomarkers?.reduce((acc: any, b: any) => {
        acc[b.biomarkerType] = b.value;
        return acc;
    }, {});

    return (
        <div className="container mx-auto p-6 font-sans">
            <div className="mb-4">
                <Link href="/women">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-500 hover:bg-rose-50 -ml-2 h-8">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Hub
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">Metabolic Panel</h1>
                    <p className="text-slate-500">Biomarker-driven precision health tracking.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                    {analysis?.recoveryScore && (
                        <Card className="px-5 py-3 border-none shadow-md bg-white flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="20" cy="20" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                    <circle
                                        cx="20" cy="20" r="18" fill="none" stroke="#f43f5e" strokeWidth="4"
                                        strokeDasharray={113}
                                        strokeDashoffset={113 - (113 * analysis.recoveryScore) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-bold text-slate-700">{analysis.recoveryScore}</span>
                            </div>
                            <div>
                                <p className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Recovery Score</p>
                                <p className="text-sm font-bold text-slate-900">Precision Analysis</p>
                            </div>
                        </Card>
                    )}

                    {context?.deliveryDate && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                                {Math.ceil((new Date().getTime() - new Date(context.deliveryDate).getTime()) / (1000 * 60 * 60 * 24 * 7))}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Recovery Week</p>
                                <p className="text-sm font-bold text-rose-900">{context.deliveryType === 'vaginal' ? 'Standard' : 'Complex'} Protocol Active</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(RANGES).map(([key, range]) => {
                    const val = Number(latestStats?.[key] || 0);
                    const isOptimal = val >= range.min && val <= range.max;

                    return (
                        <Card key={key} className="p-6 border-none shadow-lg bg-white/80 backdrop-blur-sm group hover:scale-[1.02] transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl ${isOptimal ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <HeartPulse className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isOptimal ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isOptimal ? 'Optimal' : 'Needs Focus'}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{key}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-2xl font-bold text-slate-800">{val || '--'}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{range.unit}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div
                                    className={`h-full transition-all duration-700 ${isOptimal ? 'bg-teal-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min((val / range.max) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                {RECOMMENDATIONS[key]}
                            </p>
                        </Card>
                    );
                })}
            </div>

            <div className="mb-8">
                {analysis && <RecoveryRoadmap data={analysis} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Biomarker Trends</h2>
                            <p className="text-sm text-slate-400">90-day metabolic trajectory</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold">30D</Button>
                            <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold bg-slate-100">90D</Button>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={biomarkers}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="testedAt"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVal)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6 border-none shadow-lg bg-indigo-600 text-white overflow-hidden relative group">
                        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold mb-2">AI Precision Protocol</h3>
                        <p className="text-sm text-indigo-100/80 mb-6 leading-relaxed">
                            Based on your suboptimal Ferritin and HRV load, we've adjusted your Week 4 meal plan.
                        </p>
                        <Link href="/women/protocol">
                            <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl h-11">
                                View Meal Plan Adjustments
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-6 border-none shadow-lg bg-white overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-800">Recent Labs</h3>
                        </div>
                        <div className="space-y-4">
                            {biomarkers?.slice(-3).reverse().map((b: any) => (
                                <div key={b.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{b.biomarkerType}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(b.testedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{b.value}{b.unit}</p>
                                        <p className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Manual Entry</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
