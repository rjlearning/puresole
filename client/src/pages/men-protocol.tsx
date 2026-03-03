import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Utensils, RefreshCw, Flame, Zap, Scale, Brain,
    ChevronLeft, ListTodo, Sparkles, ShieldCheck, Activity, Target
} from "lucide-react";

export default function MenProtocol() {
    const [isGenerating, setIsGenerating] = useState(false);

    const protocol = {
        calories: 2850,
        protein: 195,
        carbs: 240,
        fats: 85,
        reasoning: "Focusing on anaerobic recovery and cognitive endurance. Strategic cortisol management through micronutrient timing. Magnesium/Zinc stack active for REM support.",
        meals: [
            { id: 1, title: 'Power Start', icon: '🍳', content: '4 Eggs, avocado, smoked salmon, handful of walnuts. High fat-protein anchor for cognitive stability.' },
            { id: 2, title: 'Mid-Day Fuel', icon: '🥩', content: 'Grass-fed beef bowl, sweet potato, fermented greens. Glycemic load optimized for afternoon anabolic window.' },
            { id: 3, title: 'Restoration', icon: '🥗', content: 'Roasted chicken, olive oil, asparagus, heap of baby spinach. Micronutrient density for neurotransmitter synthesis.' },
            { id: 4, title: 'Performance Stack', icon: '🫐', content: 'Greek yogurt with berries & raw honey (Pre-sleep). Cortisol blunting for deep recovery.' }
        ]
    };

    const handleSync = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-900 pb-24 text-slate-200 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 relative z-10">
                <Link href="/men/metabolic">
                    <Button variant="ghost" size="sm" className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Metabolic Cell
                    </Button>
                </Link>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
                                <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">Evolution Stack</h1>
                        </div>
                        <p className="text-lg text-slate-400 max-w-2xl font-medium">Precision nutrition & biometric alignment for peak androgenic performance.</p>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <Button
                            onClick={handleSync}
                            disabled={isGenerating}
                            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_15px_30px_rgba(79,70,229,0.3)] border-none active:scale-95 transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Calibrating...' : 'Synchronize Protocol'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <StatBox label="Energy Load" value={protocol.calories} unit="kcal" icon={Flame} color="rose" />
                    <StatBox label="Anabolic Load" value={protocol.protein} unit="g" icon={Zap} color="indigo" />
                    <StatBox label="Glycemic Load" value={protocol.carbs} unit="g" icon={Scale} color="amber" />
                    <StatBox label="Endocrine Fuel" value={protocol.fats} unit="g" icon={Brain} color="cyan" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {protocol.meals.map((meal) => (
                            <Card key={meal.id} className="p-8 bg-slate-900/60 border-white/5 backdrop-blur-xl group hover:border-indigo-500/20 transition-all overflow-hidden relative">
                                <span className="absolute top-0 right-0 p-10 text-6xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">{meal.icon}</span>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-2xl font-black text-white tracking-tight">{meal.title}</h3>
                                </div>
                                <p className="text-slate-400 text-lg leading-relaxed font-medium relative z-10">{meal.content}</p>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <Card className="p-8 bg-indigo-950 border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Brain className="w-6 h-6 text-indigo-400" /> AI Rationale
                            </h3>
                            <p className="text-indigo-100/70 leading-relaxed italic text-sm font-medium">
                                "{protocol.reasoning}"
                            </p>

                            <div className="mt-10 pt-8 border-t border-indigo-900">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Biometric Feedback</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-slate-400">Sleep Score</span>
                                        <span className="text-xs font-black text-indigo-400">84/100</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-slate-400">HRV Delta</span>
                                        <span className="text-xs font-black text-emerald-400">+12ms</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 bg-slate-900 border-white/5">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Target className="w-6 h-6 text-cyan-400" /> Optimization Goals
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-indigo-500/20 transition-all items-center">
                                    <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                                        <Brain className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold">Mitigate afternoon cognitive lag.</p>
                                </div>
                                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-cyan-500/20 transition-all items-center">
                                    <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold">Maximize glycolytic replenishment.</p>
                                </div>
                            </div>
                        </Card>

                        <div className="p-6 text-center">
                            <div className="inline-flex items-center gap-2 bg-slate-900 px-5 py-2 rounded-full border border-white/5">
                                <ShieldCheck className="w-4 h-4 text-slate-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Medical Quality Guard</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, unit, color }: any) {
    const colors: any = {
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    };

    return (
        <Card className="p-5 bg-slate-900/50 border-white/5 group hover:border-white/10 transition-all ring-1 ring-white/5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase">{unit}</span>
            </div>
        </Card>
    );
}
