import { motion } from 'framer-motion';

type AnimationType = 'breathing' | 'meditation' | 'movement' | 'grounding' | 'journaling' | 'somatic' | 'default';

interface ActivityAnimationProps {
    type: AnimationType;
    className?: string;
}

export function ActivityAnimation({ type, className = '' }: ActivityAnimationProps) {
    // Removed bg-slate-900/50. Using type-specific soft backgrounds or transparent if handled by parent.
    const containerClass = `w-full h-64 rounded-xl overflow-hidden flex items-center justify-center relative ${className}`;

    switch (type) {
        case 'breathing':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-teal-50/50 to-emerald-50/50`}>
                    {/* Breathing: Expanding/Contracting Circle - Teal/Sage */}
                    <motion.div
                        className="w-32 h-32 rounded-full bg-teal-200/40 border-2 border-teal-300/50 backdrop-blur-sm relative z-10 flex items-center justify-center"
                        animate={{
                            scale: [1, 1.5, 1.5, 1],
                            opacity: [0.6, 0.9, 0.9, 0.6],
                        }}
                        transition={{
                            duration: 10, // 4-7-8 rhythm
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    >
                        <motion.div
                            className="w-16 h-16 rounded-full bg-teal-400/30"
                            animate={{ scale: [1, 0.8, 0.8, 1] }}
                            transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
                        />
                    </motion.div>
                    {/* Helper Rings */}
                    <motion.div
                        className="absolute w-48 h-48 rounded-full border border-teal-500/20"
                        animate={{ scale: [1, 1.2, 1.2, 1], opacity: [0.3, 0, 0, 0.3] }}
                        transition={{ duration: 10, ease: "easeInOut", repeat: Infinity, delay: 0.2 }}
                    />
                </div>
            );

        case 'meditation':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-indigo-50/50 to-violet-50/50`}>
                    {/* Meditation: Floating/Glowing Orb - Indigo/Lavender */}
                    <motion.div
                        className="relative"
                        animate={{
                            y: [-10, 10, -10],
                        }}
                        transition={{
                            duration: 6,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-300/40 to-violet-300/40 blur-xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                            }}
                            transition={{
                                duration: 8,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 w-24 h-24 rounded-full border border-indigo-300/50"
                            animate={{
                                rotate: [0, -180, 0],
                                scale: [1.1, 1, 1.1],
                            }}
                            transition={{
                                duration: 12,
                                ease: "linear",
                                repeat: Infinity,
                            }}
                        />
                    </motion.div>
                    {/* Floating Specks */}
                    <motion.div
                        className="absolute w-2 h-2 bg-indigo-400/30 rounded-full"
                        style={{ top: '30%', left: '30%' }}
                        animate={{ y: -20, opacity: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                </div>
            );

        case 'movement':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-cyan-50/50 to-blue-50/50`}>
                    {/* Movement: Flowing Line/Path - Cyan/Blue */}
                    <svg className="w-full h-full absolute inset-0" viewBox="0 0 200 100" preserveAspectRatio="none">
                        <motion.path
                            d="M0,50 Q50,20 100,50 T200,50"
                            fill="none"
                            stroke="url(#gradient-movement)"
                            strokeWidth="3"
                            animate={{
                                d: [
                                    "M0,50 Q50,20 100,50 T200,50",
                                    "M0,50 Q50,80 100,50 T200,50",
                                    "M0,50 Q50,20 100,50 T200,50"
                                ]
                            }}
                            transition={{
                                duration: 5,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        />
                        <defs>
                            <linearGradient id="gradient-movement" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Central Moving Box */}
                    <motion.div
                        className="w-16 h-16 border-2 border-cyan-400/50 rounded-2xl bg-cyan-200/30 backdrop-blur-sm"
                        animate={{
                            rotate: 360,
                            borderRadius: ["20%", "50%", "20%"],
                        }}
                        transition={{
                            duration: 8,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    />
                </div>
            );

        case 'grounding':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-emerald-50/50 to-stone-100/50`}>
                    {/* Grounding: Stacked Stones / Stability */}
                    <div className="flex flex-col items-center gap-1">
                        <motion.div
                            className="w-10 h-8 rounded-full bg-emerald-300/50"
                            animate={{ y: [0, 2, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="w-14 h-10 rounded-full bg-emerald-400/50"
                            animate={{ y: [0, -1, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        />
                        <motion.div
                            className="w-24 h-12 rounded-full bg-emerald-500/50"
                            animate={{ scaleX: [1, 1.05, 1] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>
                </div>
            )

        case 'somatic':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-emerald-50/50 to-teal-50/50`}>
                    {/* Somatic: Pulsing Wave/Vibration */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                            <motion.div
                                key={i}
                                className="w-3 rounded-full bg-emerald-400/50"
                                animate={{ height: [20, h * 15, 20], opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </div>
            )

        case 'journaling':
            return (
                <div className={`${containerClass} bg-gradient-to-br from-orange-50/50 to-pink-50/50`}>
                    {/* Voice Waves */}
                    <div className="flex items-center gap-1.5 h-16">
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                            <motion.div
                                key={i}
                                className="w-2 rounded-full bg-orange-400/60"
                                animate={{ height: [10, h * 8, 10] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </div>
            );

        default: // Default/Fallack
            return (
                <div className={`${containerClass} bg-gradient-to-br from-slate-100 to-slate-200`}>
                    <motion.div
                        className="w-full h-full absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <div className="text-slate-400 text-sm font-medium relative z-10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                        Activity Preview
                    </div>
                </div>
            );
    }
}
