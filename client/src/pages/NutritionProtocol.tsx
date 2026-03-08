import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Utensils,
    RefreshCw,
    Baby,
    Flame,
    Zap,
    Scale,
    Brain,
    ChevronLeft,
    CheckCircle2,
    ShoppingCart,
    ListTodo,
    Sparkles,
    Activity,
    ShieldCheck,
    Target,
    ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MeshBackground from "@/components/MeshBackground";
import { useAuth } from "@/hooks/useAuth";

export default function NutritionProtocol() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [showGroceryList, setShowGroceryList] = useState(false);

    const { data: plan, isLoading: planLoading, isRefetching } = useQuery<any>({
        queryKey: ["/api/postpartum/meal-plan"],
        queryFn: async () => {
            const res = await fetch("/api/postpartum/meal-plan", { credentials: 'include' });
            if (!res.ok) return null;
            return res.json();
        }
    });

    const { data: context } = useQuery<any>({
        queryKey: ["/api/postpartum/context"],
        queryFn: async () => {
            const res = await fetch("/api/postpartum/context", { credentials: 'include' });
            if (!res.ok) return null;
            return res.json();
        }
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/postpartum/meal-plan/generate", {
                method: "POST",
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to generate plan");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/postpartum/meal-plan"] });
        }
    });

    const groceryMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/postpartum/meal-plan/grocery-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({
                    breakfast: plan?.breakfast,
                    lunch: plan?.lunch,
                    dinner: plan?.dinner,
                    snacks: plan?.snacks
                })
            });
            if (!res.ok) throw new Error("Failed to generate list");
            return res.json();
        }
    });

    if (planLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <MeshBackground variant="rose" />
                <div className="relative z-10 text-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto opacity-50" />
                    <p className="text-rose-200/50 font-black uppercase tracking-[0.3em] text-xs">Synthesizing Adaptive Protocol</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 text-slate-200 overflow-x-hidden relative max-w-full">
            <MeshBackground variant="rose" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 relative z-10">
                <Link href="/women">
                    <Button variant="ghost" size="sm" className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px]">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Vitality Hub
                    </Button>
                </Link>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-500/10 p-2.5 rounded-2xl border border-rose-500/20">
                                <Sparkles className="w-6 h-6 text-rose-400" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none italic font-serif">Precision Protocol</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-lg text-slate-400 font-medium tracking-tight">
                                {context?.deliveryDate ? (
                                    `Day ${Math.max(1, Math.ceil((new Date().getTime() - new Date(context.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)))} of recovery.`
                                ) : (
                                    `Your adaptive nutrition guide.`
                                )}
                            </p>
                            {plan?.breastfeedingAdjustment && (
                                <span className="flex items-center gap-2 bg-rose-500/10 text-rose-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-rose-500/20 whitespace-nowrap">
                                    <Baby className="w-3 h-3" /> Lactation Support Active
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 lg:flex-none h-14 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border-white/10 transition-all"
                            onClick={() => {
                                setShowGroceryList(!showGroceryList);
                                if (!groceryMutation.data) groceryMutation.mutate();
                            }}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" /> {showGroceryList ? 'Hide List' : 'Grocery List'}
                        </Button>

                        <Button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending || isRefetching}
                            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_15px_30px_rgba(244,63,94,0.3)] border-none active:scale-95 transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending || isRefetching ? 'animate-spin' : ''}`} />
                            {generateMutation.isPending || isRefetching ? 'Synchronizing...' : 'Regenerate Protocol'}
                        </Button>
                    </div>
                </div>

                {showGroceryList && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                        <Card className="p-8 bg-slate-900/60 border-white/5 backdrop-blur-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                            <div className="flex items-center gap-3 mb-8">
                                <ListTodo className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Precision Shopping List</h2>
                            </div>

                            {groceryMutation.isPending ? (
                                <div className="py-12 text-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Categorizing ingredients...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {groceryMutation.data?.categories?.map((cat: any) => (
                                        <div key={cat.name} className="space-y-4">
                                            <h3 className="text-[10px] font-black text-emerald-400/70 uppercase tracking-[0.2em]">{cat.name}</h3>
                                            <ul className="space-y-3">
                                                {cat.items.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <StatBox label="Metabolic Load" value={plan?.targetCalories} unit="kcal" icon={Flame} color="rose" />
                    <StatBox label="Repair Proteins" value={plan?.targetProteinGrams} unit="g" icon={Zap} color="indigo" />
                    <StatBox label="Energy Substrate" value={plan?.targetCarbGrams} unit="g" icon={Scale} color="amber" />
                    <StatBox label="Hormonal Anchor" value={plan?.targetFatGrams} unit="g" icon={Brain} color="teal" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <MealCard
                            title="Morning Ritual"
                            time="Metabolic Anchor"
                            content={plan?.breakfast}
                            icon="🍳"
                            accent="bg-rose-500"
                        />
                        <MealCard
                            title="Vitality Lunch"
                            time="Peak Energy Window"
                            content={plan?.lunch}
                            icon="🥗"
                            accent="bg-indigo-500"
                        />
                        <MealCard
                            title="Restoration Meal"
                            time="Cellular Repair"
                            content={plan?.dinner}
                            icon="🥩"
                            accent="bg-teal-500"
                        />
                        <MealCard
                            title="Cycle Support"
                            time="Endocrine Fuel"
                            content={plan?.snacks}
                            icon="🫐"
                            accent="bg-amber-500"
                        />
                    </div>

                    <div className="space-y-6">
                        <Card className="p-8 bg-slate-900 border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                            <h3 className="text-xl font-black text-rose-100 mb-6 flex items-center gap-3">
                                <Brain className="w-6 h-6 text-rose-400" /> AI Rationale
                            </h3>
                            <p className="text-slate-400 leading-relaxed italic text-sm font-medium">
                                "{(plan?.adaptiveFactors?.sleep && plan?.adaptiveFactors?.hrv)
                                    ? (plan?.adaptiveFactors?.biomarkerInsights?.length > 0
                                        ? `Integrating ${plan.adaptiveFactors.biomarkerInsights.map((i: any) => i.type).join(' & ')} needs into your ${plan?.breastfeedingAdjustment ? 'lactation-optimized' : 'recovery'} protocol with real-time wearable adjustments.`
                                        : "Your protocol is optimized for general postpartum vitality, adjusted daily based on your wearable data.")
                                    : (plan?.adaptiveFactors?.biomarkerInsights?.length > 0
                                        ? `Calibrating for ${plan.adaptiveFactors.biomarkerInsights.map((i: any) => i.type).join(' & ')} using clinical baselines.`
                                        : "Using recovery baseline protocols for postpartum vitality and hormone stabilization.")
                                }"
                            </p>
                            <div className="mt-10 pt-8 border-t border-white/5">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-6">Biometric Feedback</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-slate-400">Sleep Status</span>
                                        <span className="text-xs font-black text-rose-400">{plan?.adaptiveFactors?.sleep ? `${plan.adaptiveFactors.sleep}h` : 'Optimal'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-slate-400">Recovery HRV</span>
                                        <span className="text-xs font-black text-indigo-400">{plan?.adaptiveFactors?.hrv ? `${plan.adaptiveFactors.hrv}ms` : 'Stabilized'}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 bg-slate-900 border-white/5">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Target className="w-6 h-6 text-emerald-400" /> Recovery Action
                            </h3>
                            <div className="space-y-4">
                                {plan?.recoverySteps?.length > 0 ? (
                                    plan.recoverySteps.map((step: string, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-rose-500/20 transition-all items-center">
                                            <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400">
                                                <div className="w-4 h-4 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                            </div>
                                            <p className="text-xs text-slate-400 font-black leading-tight uppercase tracking-wide">{step}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-xs text-slate-600 font-bold italic uppercase tracking-widest">Generating bio-logical steps...</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="p-6 text-center">
                            <div className="inline-flex items-center gap-2 bg-slate-900 px-5 py-2 rounded-full border border-white/5">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Physiological Integrity Guard</span>
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
        teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
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
                <span className="text-2xl font-black text-white">{value || '--'}</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase">{unit}</span>
            </div>
        </Card>
    );
}

function MealCard({ title, time, content, icon, accent }: any) {
    return (
        <Card className="p-8 bg-slate-900/60 border-white/5 backdrop-blur-xl group hover:border-rose-500/20 transition-all overflow-hidden relative">
            <span className="absolute top-0 right-0 p-10 text-6xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">{icon}</span>
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-1.5 h-6 ${accent} rounded-full`} />
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{time}</span>
                    <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
                </div>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-medium relative z-10">{content || 'Calibrating meal suggestions...'}</p>
        </Card>
    );
}
