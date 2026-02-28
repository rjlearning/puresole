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
    Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function NutritionProtocol() {
    const queryClient = useQueryClient();
    const [showGroceryList, setShowGroceryList] = useState(false);

    const { data: plan, isLoading: planLoading } = useQuery<any>({
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

    if (planLoading) return <div className="p-12 text-center text-slate-500 font-medium">Synthesizing adaptive protocol...</div>;

    return (
        <div className="container mx-auto p-6 font-sans max-w-5xl">
            <div className="flex items-center gap-2 mb-8">
                <Link href="/women/metabolic">
                    <Button variant="ghost" size="sm" className="rounded-full text-slate-500 hover:bg-slate-100">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Trends
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-slate-900 font-serif">Precision Protocol</h1>
                        {plan?.breastfeedingAdjustment && (
                            <span className="flex items-center gap-1 bg-sky-50 text-sky-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-sky-100">
                                <Baby className="w-3 h-3" /> Lactation Support Active
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-lg">
                        {context?.deliveryDate ? (
                            `Day ${Math.max(1, Math.ceil((new Date().getTime() - new Date(context.deliveryDate).getTime()) / (1000 * 60 * 60 * 24)))} of your recovery journey.`
                        ) : (
                            `Your adaptive nutrition guide.`
                        )}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 gap-2 h-12"
                        onClick={() => {
                            setShowGroceryList(!showGroceryList);
                            if (!groceryMutation.data) groceryMutation.mutate();
                        }}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {showGroceryList ? 'Hide List' : 'Grocery List'}
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-2xl border-2 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50 gap-2 h-12"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                    >
                        <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                        Regenerate Protocol
                    </Button>
                </div>
            </div>

            {showGroceryList && (
                <Card className="p-8 border-none shadow-xl bg-white mb-10 overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <ListTodo className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Precision Shopping List</h2>
                    </div>

                    {groceryMutation.isPending ? (
                        <div className="py-12 text-center text-slate-400 font-medium">Categorizing ingredients...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {groceryMutation.data?.categories?.map((cat: any) => (
                                <div key={cat.name}>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{cat.name}</h3>
                                    <ul className="space-y-3">
                                        {cat.items.map((item: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatsCard icon={Flame} label="Calories" value={plan?.targetCalories} unit="kcal" color="rose" />
                <StatsCard icon={Zap} label="Protein" value={plan?.targetProteinGrams} unit="g" color="indigo" />
                <StatsCard icon={Scale} label="Carbs" value={plan?.targetCarbGrams} unit="g" color="amber" />
                <StatsCard icon={Brain} label="Fat" value={plan?.targetFatGrams} unit="g" color="teal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <MealCard
                        title="Breakfast"
                        time="Morning Fuel"
                        content={plan?.breakfast}
                        icon="☕"
                    />
                    <MealCard
                        title="Lunch"
                        time="Peak Energy"
                        content={plan?.lunch}
                        icon="🥗"
                    />
                    <MealCard
                        title="Dinner"
                        time="Restorative Evening"
                        content={plan?.dinner}
                        icon="🥩"
                    />
                    <MealCard
                        title="Snacks & Hydration"
                        time="Metabolic Support"
                        content={plan?.snacks}
                        icon="🫐"
                    />
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-2xl bg-indigo-900 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                        <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-indigo-300" /> AI Reasoning
                        </h3>
                        <p className="text-indigo-100/90 leading-relaxed italic relative z-10 text-sm">
                            {(plan?.adaptiveFactors?.sleep && plan?.adaptiveFactors?.hrv)
                                ? (plan?.adaptiveFactors?.biomarkerInsights?.length > 0
                                    ? `Integrating ${plan.adaptiveFactors.biomarkerInsights.map((i: any) => i.type).join(' & ')} needs into your ${plan?.breastfeedingAdjustment ? 'lactation-optimized' : 'recovery'} protocol with real-time wearable adjustments.`
                                    : "Your protocol is optimized for general postpartum vitality, adjusted daily based on your wearable data.")
                                : (plan?.adaptiveFactors?.biomarkerInsights?.length > 0
                                    ? `Calibrating for ${plan.adaptiveFactors.biomarkerInsights.map((i: any) => i.type).join(' & ')} using clinical baselines (no wearable data active).`
                                    : "Using recovery baseline protocols for postpartum vitality and hormone stabilization.")
                            }
                        </p>
                        <div className="mt-8 pt-8 border-t border-indigo-800 relative z-10">
                            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-4 font-sans">Adaptive Factors</p>
                            <div className="space-y-3">
                                <FactorItem label="Sleep Load" value={plan?.adaptiveFactors?.sleep ? `${plan.adaptiveFactors.sleep}h` : 'Baseline'} />
                                <FactorItem label="HRV Status" value={plan?.adaptiveFactors?.hrv ? `${plan.adaptiveFactors.hrv}ms` : 'Baseline'} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-lg bg-white overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-50 rounded-xl">
                                <Sparkles className="w-5 h-5 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Recovery Action Plan</h3>
                        </div>
                        <div className="space-y-4">
                            {plan?.recoverySteps?.length > 0 ? (
                                plan.recoverySteps.map((step: string, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{step}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 opacity-40">
                                    <p className="text-sm text-slate-400 font-medium italic">Generating recovery steps based on biometrics...</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-lg bg-white overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Metabolic Focus</h3>
                        <div className="space-y-4">
                            {plan?.adaptiveFactors?.biomarkerInsights?.map((insight: any) => (
                                <div key={insight.type} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="w-2 h-full bg-rose-400 rounded-full" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{insight.type}</p>
                                        <p className="text-sm font-bold text-slate-700">{insight.interpretation}</p>
                                    </div>
                                </div>
                            ))}
                            {!plan?.adaptiveFactors?.biomarkerInsights?.length && (
                                <div className="text-center py-6">
                                    <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm text-slate-400 font-medium">All biomarkers within range.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon: Icon, label, value, unit, color }: any) {
    const colorMap: any = {
        rose: 'text-rose-500 bg-rose-50',
        indigo: 'text-indigo-500 bg-indigo-50',
        amber: 'text-amber-500 bg-amber-50',
        teal: 'text-teal-500 bg-teal-50'
    };

    return (
        <Card className="p-5 border-none shadow-md bg-white hover:shadow-xl transition-shadow group">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${colorMap[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{value || '--'}</span>
                <span className="text-[10px] text-slate-400 font-bold">{unit}</span>
            </div>
        </Card>
    );
}

function MealCard({ title, time, content, icon }: any) {
    return (
        <Card className="p-8 border-none shadow-lg bg-white group hover:scale-[1.01] transition-transform overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 group-hover:scale-125 transition-transform duration-500">
                {icon}
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Utensils className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{time}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                    {content || 'Calibrating meal suggestions based on current load...'}
                </p>
            </div>
        </Card>
    );
}

function FactorItem({ label, value }: any) {
    return (
        <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-indigo-300">{label}</span>
            <span className="text-white bg-indigo-800 px-3 py-1 rounded-lg">{value}</span>
        </div>
    );
}
