import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, Users, ShieldCheck, Sparkles, TrendingUp, Users2,
    MessageSquare, Brain, HeartHandshake, Fingerprint, Ghost
} from "lucide-react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

export default function MenIdentityPage() {
    // Identity Hub: Derived from "Relational Intelligence" and emotional state via voice analysis
    // Mocking data that would normally come from the Voice Journal Analysis
    const intelligenceData = [
        { subject: 'Empathy', A: 85, fullMark: 100 },
        { subject: 'Stability', A: 92, fullMark: 100 },
        { subject: 'Focus', A: 78, fullMark: 100 },
        { subject: 'Social Load', A: 65, fullMark: 100 },
        { subject: 'Recovery', A: 88, fullMark: 100 },
        { subject: 'Resilience', A: 95, fullMark: 100 },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20">
                <Link href="/men">
                    <Button variant="ghost" size="sm" className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/5">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Evolution Hub
                    </Button>
                </Link>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
                                <Fingerprint className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">Identity Hub</h1>
                        </div>
                        <p className="text-lg text-slate-400 max-w-xl font-medium">Relational performance & emotional structural analysis.</p>
                    </div>

                    <Card className="px-8 py-5 bg-indigo-950/40 border-white/5 backdrop-blur-3xl flex items-center gap-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                            92
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-0.5">Stability Score</p>
                            <p className="text-sm font-black text-white">Structural Peak</p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8 bg-slate-900/40 border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl" />
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Psychological Profile</h2>
                                    <p className="text-sm text-slate-500">Derived from 7-day vocal biomarker analysis</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl">
                                    <Brain className="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={intelligenceData}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                                        <Radar
                                            name="Intelligence"
                                            dataKey="A"
                                            stroke="#818cf8"
                                            fill="#818cf8"
                                            fillOpacity={0.4}
                                            animationDuration={2000}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ValueCard icon={HeartHandshake} label="Empathy Load" value="High" color="text-indigo-400" />
                            <ValueCard icon={Ghost} label="Shadow State" value="Low" color="text-slate-600" />
                            <ValueCard icon={Users2} label="Social Power" value="94%" color="text-emerald-400" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-8 bg-slate-900 border-white/5 group hover:border-indigo-500/20 transition-all">
                            <Sparkles className="w-8 h-8 text-indigo-400 mb-6" />
                            <h3 className="text-xl font-black text-white mb-4">Relational AI Reasoning</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
                                Acoustic biomarkers from your recent journal indicate high emotional stability. Your "Stability Delta" has increased by 14% since you prioritized the biological recovery stack. This suggests a direct neurochemical link between your metabolic state and social performance.
                            </p>
                            <Link href="/voice-insights">
                                <Button className="w-full bg-white text-slate-900 hover:bg-indigo-600 hover:text-white font-black rounded-2xl h-14 uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl">
                                    Deep Voice Analytics
                                </Button>
                            </Link>
                        </Card>

                        <Card className="p-8 bg-indigo-950/20 border-white/5 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-black text-white text-xs uppercase tracking-widest">Protocol Insight</h3>
                            </div>
                            <p className="text-xs text-indigo-200/50 leading-relaxed font-medium">
                                Your current "Identity State" is optimized for high-impact social negotiation and leadership focus.
                            </p>
                        </Card>

                        <div className="p-6 text-center">
                            <div className="inline-flex items-center gap-2 bg-slate-900 px-5 py-2 rounded-full border border-white/5">
                                <ShieldCheck className="w-4 h-4 text-slate-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Psychological Guard Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ValueCard({ icon: Icon, label, value, color }: any) {
    return (
        <Card className="p-6 bg-slate-900 border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        </Card>
    );
}
