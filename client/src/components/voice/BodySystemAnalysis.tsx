import { motion } from 'framer-motion';
import { Activity, Heart, Wind, Zap, ShieldCheck } from 'lucide-react';

interface SystemPoint {
    id: string;
    name: string;
    x: number;
    y: number;
    icon: any;
    value: number;
    color: string;
    description: string;
}

const systems: SystemPoint[] = [
    { id: 'respiratory', name: 'Respiratory', x: 50, y: 35, icon: Wind, value: 88, color: '#06b6d4', description: 'Airflow stability and lung capacity indicators' },
    { id: 'cardiovascular', name: 'Cardiovascular', x: 45, y: 45, icon: Heart, value: 92, color: '#f43f5e', description: 'Heart rate variability and circulation markers' },
    { id: 'nervous', name: 'Nervous System', x: 50, y: 15, icon: Zap, value: 75, color: '#8b5cf6', description: 'Stress response and neurotransmitter balance' },
    { id: 'muscular', name: 'Vocal Musculature', x: 50, y: 25, icon: Activity, value: 95, color: '#10b981', description: 'Vocal fold coordination and physical fatigue' },
    { id: 'immune', name: 'Immune Resilience', x: 60, y: 55, icon: ShieldCheck, value: 82, color: '#f59e0b', description: 'General inflammatory and vitality markers' },
];

export default function BodySystemAnalysis() {
    return (
        <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-indigo-400" />
                        </div>
                        Body System Correlation
                    </h3>
                    <p className="text-slate-500 text-sm mt-2">Vocal biomarkers mapped to physiological performance</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Silhouette View */}
                    <div className="relative aspect-[3/4] max-w-[300px] mx-auto w-full">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-900 stroke-slate-800 transition-all group-hover:stroke-indigo-500/30">
                            {/* Human Silhouette Path (Simplified) */}
                            <path d="M50 5 C45 5 42 10 42 15 C42 20 45 23 50 23 C55 23 58 20 58 15 C58 10 55 5 50 5 Z M40 25 L60 25 L65 45 L58 45 L58 70 L62 95 L52 95 L50 75 L48 95 L38 95 L42 70 L42 45 L35 45 Z" />
                        </svg>

                        {/* Indicator Points */}
                        {systems.map((s) => (
                            <motion.div
                                key={s.id}
                                className="absolute w-3 h-3 rounded-full cursor-pointer z-20 group/point"
                                style={{ top: `${s.y}%`, left: `${s.x}%`, backgroundColor: s.color, boxShadow: `0 0 15px ${s.color}` }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.5 }}
                            >
                                {/* Connector Line (Hover) */}
                                <div className={`absolute h-[1px] bg-gradient-to-r from-${s.color} to-transparent w-24 top-1/2 -translate-y-1/2 left-full pointer-events-none opacity-0 group-hover/point:opacity-100 transition-opacity`} />

                                {/* Tooltip (Hover) */}
                                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl w-48 pointer-events-none opacity-0 group-hover/point:opacity-100 transition-all -translate-x-2 group-hover/point:translate-x-0">
                                    <p className="font-bold text-white text-xs">{s.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{s.description}</p>
                                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full"
                                            style={{ backgroundColor: s.color }}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${s.value}%` }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Details List */}
                    <div className="space-y-4">
                        {systems.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                                                <Icon className="w-4 h-4" style={{ color: s.color }} />
                                            </div>
                                            <span className="font-bold text-slate-200 text-sm">{s.name} Resilience</span>
                                        </div>
                                        <span className="text-xl font-black tabular-nums" style={{ color: s.color }}>{s.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}40` }}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${s.value}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
