import { motion } from 'framer-motion';
import { Activity, Waves, Dna } from 'lucide-react';

interface QuantumCoherenceProps {
    score: number; // 0-100 wellness score
}

export default function QuantumCoherence({ score }: QuantumCoherenceProps) {
    // Score > 60: Wave mode (relaxed, intuitive, superposition)
    // Score <= 60: Particle mode (tense, anxious, collapsed)
    const isWave = score > 60;

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 border border-slate-800 p-8 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <Dna className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Quantum Coherence</h3>
            </div>

            <div className="absolute top-8 right-8">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 ${isWave ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {isWave ? 'Superposition Wave' : 'Particle Collapse'}
                </div>
            </div>

            <div className="relative w-full h-48 flex items-center justify-center mt-12 mb-6">
                {isWave ? (
                    // Wave Mode: Fluid, expanding rings
                    <>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={`wave-${i}`}
                                className="absolute rounded-full border border-indigo-500/30"
                                style={{ width: i * 40, height: i * 40 }}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.1, 0.5, 0.1],
                                    rotate: [0, 180, 360]
                                }}
                                transition={{
                                    duration: 4 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                        <motion.div
                            className="absolute w-24 h-24 bg-indigo-500/20 blur-xl rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <Waves className="w-8 h-8 text-indigo-400 relative z-10" />
                    </>
                ) : (
                    // Particle Mode: Rigid, tense, jittery dots
                    <>
                        {[...Array(12)].map((_, i) => {
                            const angle = (i / 12) * Math.PI * 2;
                            const radius = 60;
                            return (
                                <motion.div
                                    key={`particle-${i}`}
                                    className="absolute w-2 h-2 bg-rose-500 rounded-full"
                                    initial={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }}
                                    animate={{
                                        x: Math.cos(angle) * radius + (Math.random() * 10 - 5),
                                        y: Math.sin(angle) * radius + (Math.random() * 10 - 5),
                                        scale: [1, 1.5, 1],
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                />
                            );
                        })}
                        <motion.div
                            className="absolute w-20 h-20 border-2 border-dashed border-rose-500/50 rounded-lg"
                            animate={{ rotate: [0, 90, 180, 270, 360] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="relative z-10">
                            <Activity className="w-8 h-8 text-rose-500" />
                        </motion.div>
                    </>
                )}
            </div>

            <div className="mt-8 text-center z-10 max-w-sm">
                <p className="text-sm font-medium text-slate-300">
                    {isWave
                        ? "Your mind is holding lateral possibilities fluidly. Intuition is heightened."
                        : "Your thoughts have collapsed into a rigid, anxious focal point. Tension detected."}
                </p>
            </div>
        </div>
    );
}
