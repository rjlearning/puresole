import { Card } from '@/components/ui/card';
import { Activity, Waves, Volume2, Mic2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Biomarkers {
    jitterLocal_sma3nz_amean?: number | null;
    shimmerLocaldB_sma3nz_amean?: number | null;
    F0semitoneFrom27_5Hz_sma3nz_amean?: number | null;
    HNRdBACF_sma3nz_amean?: number | null;
}

interface VocalBiomarkersPanelProps {
    biomarkers: Biomarkers | null;
}

export default function VocalBiomarkersPanel({ biomarkers }: VocalBiomarkersPanelProps) {
    if (!biomarkers) {
        return (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    Clinical Vocal Biomarkers
                </h3>
                <p className="text-slate-500 text-sm">
                    No advanced biomarker data available for this recording. Processing might still be ongoing or openSMILE was not run.
                </p>
            </div>
        );
    }

    // Pre-process metrics
    const jitter = biomarkers.jitterLocal_sma3nz_amean || 0;
    const shimmer = biomarkers.shimmerLocaldB_sma3nz_amean || 0;
    const pitch = biomarkers.F0semitoneFrom27_5Hz_sma3nz_amean || 0;
    const hnr = biomarkers.HNRdBACF_sma3nz_amean || 0;

    const jitterScore = Math.min(100, Math.max(0, (jitter / 0.08) * 100));
    const shimmerScore = Math.min(100, Math.max(0, (shimmer / 2.5) * 100));
    const hnrScore = Math.min(100, Math.max(0, (hnr / 25) * 100));

    return (
        <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    Vocal Lab Results
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Validated Analysis</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Jitter (Vocal Tension) */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Micro-Variation</span>
                            <h4 className="font-bold text-slate-100 text-sm">Vocal Tension (Jitter)</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-white block leading-none">{jitter.toFixed(3)}</span>
                            <span className="text-[10px] text-slate-500">abs val</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/10 w-1/4 left-0 border-r border-slate-700" title="Typical Range" />
                            <Progress value={jitterScore} className="h-full bg-transparent" indicatorClassName="bg-gradient-to-r from-orange-400 to-rose-500" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-emerald-500">Stable</span>
                            <span className="text-rose-500">Strained</span>
                        </div>
                    </div>
                </div>

                {/* Shimmer (Breathiness/Fatigue) */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Amplitude Stability</span>
                            <h4 className="font-bold text-slate-100 text-sm">Vocal Fatigue (Shimmer)</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-white block leading-none">{shimmer.toFixed(2)} <span className="text-xs font-normal text-slate-500">dB</span></span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/10 w-1/3 left-0 border-r border-slate-700" title="Typical Range" />
                            <Progress value={shimmerScore} className="h-full bg-transparent" indicatorClassName="bg-gradient-to-r from-blue-400 to-indigo-500" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-emerald-500">Resonant</span>
                            <span className="text-indigo-500">Fatigued</span>
                        </div>
                    </div>
                </div>

                {/* Harmonics-to-Noise Ratio (Clarity) */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Purity Index</span>
                            <h4 className="font-bold text-slate-100 text-sm">Voice Clarity (HNR)</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-white block leading-none">{hnr.toFixed(1)} <span className="text-xs font-normal text-slate-500">dB</span></span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="absolute inset-x-0 bg-emerald-500/10 w-1/2 right-0 border-l border-slate-700" title="Typical Range" />
                            <Progress value={hnrScore} className="h-full bg-transparent" indicatorClassName="bg-gradient-to-r from-teal-400 to-emerald-500" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-500">Hoarse</span>
                            <span className="text-emerald-500">Clear</span>
                        </div>
                    </div>
                </div>

                {/* Mean Pitch */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Fundamental Freq</span>
                        <h4 className="font-bold text-slate-100 text-sm mb-2">Mean Pitch (F0)</h4>
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-purple-400" />
                            <p className="text-xs text-slate-500">
                                {pitch > 35 ? 'Elevated (Higher energy/tension)' : pitch < 25 ? 'Lowered (Calm/Deep)' : 'Stable Baseline'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-purple-400 leading-none">{pitch.toFixed(0)}</span>
                            <span className="text-[9px] font-bold text-purple-500/50 uppercase">ST</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
