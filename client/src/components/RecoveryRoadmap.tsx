import { Card } from "@/components/ui/card";
import { Sparkles, Milestone, Brain, TrendingUp } from "lucide-react";

interface MilestoneItem {
    week: number;
    label: string;
    description: string;
}

interface AnalysisData {
    recoveryScore: number;
    currentPhaseName: string;
    physiologicalBridge: string;
    milestones: MilestoneItem[];
    bioScoreBreakdown: {
        nutritional: number;
        hormonal: number;
        physical: number;
    };
}

export default function RecoveryRoadmap({ data }: { data: AnalysisData }) {
    if (!data) return null;

    return (
        <Card className="p-8 border-none shadow-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 rounded-lg">
                            <Sparkles className="w-4 h-4 text-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Precision Recovery Roadmap</h2>
                    </div>
                    <p className="text-slate-500 text-sm">AI-generated physiological trajectory</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Current Phase</p>
                        <p className="text-sm font-bold text-indigo-600">{data.currentPhaseName}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                {/* Visual Roadmap */}
                <div className="lg:col-span-8">
                    <div className="relative pl-8 space-y-10">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                        {data.milestones.map((milestone, idx) => (
                            <div key={idx} className="relative group">
                                <div className={`absolute -left-8 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all group-hover:scale-125 z-10 ${idx === 0 ? 'bg-rose-500' : 'bg-slate-200'
                                    }`}>
                                    {idx === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            Week {milestone.week}
                                        </span>
                                        <h4 className="font-bold text-slate-800">{milestone.label}</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                        {milestone.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insights Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900 text-white relative h-full">
                        <Brain className="w-8 h-8 text-rose-400 mb-4 opacity-50" />
                        <h3 className="text-lg font-bold mb-4">The Metabolic Bridge</h3>
                        <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-rose-500 pl-4 py-1">
                            {data.physiologicalBridge}
                        </p>

                        <div className="mt-8 space-y-4">
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Score Analysis</p>
                            <div className="space-y-4">
                                <ScoreIndicator label="Nutritional" score={data.bioScoreBreakdown.nutritional} color="rose" />
                                <ScoreIndicator label="Hormonal" score={data.bioScoreBreakdown.hormonal} color="emerald" />
                                <ScoreIndicator label="Physical" score={data.bioScoreBreakdown.physical} color="indigo" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function ScoreIndicator({ label, score, color }: { label: string, score: number, color: string }) {
    const colors: any = {
        rose: 'bg-rose-500',
        emerald: 'bg-emerald-500',
        indigo: 'bg-indigo-500'
    };

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">{label}</span>
                <span>{score}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${colors[color]} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
}
