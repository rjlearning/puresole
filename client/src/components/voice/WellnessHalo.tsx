import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WellnessHaloProps {
    stage?: string;
    cycleDay?: number;
    energyLevel?: number;
    primaryEmotion?: string;
    size?: number;
}

/**
 * WellnessHalo: An organic, breathing visualization for the Women's Wellness Hub.
 * It uses SVG filters and motion to create a "living bio-ring" aesthetic.
 */
export const WellnessHalo: React.FC<WellnessHaloProps> = ({
    stage = 'general',
    cycleDay = 1,
    energyLevel = 3,
    primaryEmotion = 'neutral',
    size = 280,
}) => {
    // Map stage/emotion to a specific color theme
    const theme = useMemo(() => {
        const defaultTheme = {
            primary: '#f472b6', // rose-400
            secondary: '#c084fc', // purple-400
            glow: 'rgba(244, 114, 182, 0.4)',
        };

        if (stage === 'trimester4') return { primary: '#fb7185', secondary: '#fda4af', glow: 'rgba(251, 113, 133, 0.4)' };
        if (stage === 'follicular') return { primary: '#8b5cf6', secondary: '#c084fc', glow: 'rgba(139, 92, 246, 0.4)' };
        if (stage === 'ovulatory') return { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.4)' };
        if (stage === 'luteal') return { primary: '#2dd4bf', secondary: '#14b8a6', glow: 'rgba(45, 212, 191, 0.4)' };

        return defaultTheme;
    }, [stage]);

    // Dynamically calculate pulse speed and size variation based on energyLevel
    const pulseDuration = 6 - (energyLevel * 0.8); // Higher energy = faster pulse
    const scaleVariance = 1 + (energyLevel * 0.02);

    return (
        <div className="relative flex items-center justify-center p-8" style={{ width: size, height: size }}>
            <svg width="100%" height="100%" viewBox="0 0 200 200" className="overflow-visible">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <linearGradient id="haloGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={theme.primary} />
                        <stop offset="100%" stopColor={theme.secondary} />
                    </linearGradient>

                    <filter id="liquid">
                        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>

                {/* Inner liquid core */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="60"
                    fill="url(#haloGradient)"
                    style={{ filter: 'url(#liquid)', opacity: 0.15 }}
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: pulseDuration * 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Breathing Ring 1 */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="url(#haloGradient)"
                    strokeWidth="0.5"
                    strokeDasharray="10 5"
                    animate={{
                        scale: [1, scaleVariance, 1],
                        rotate: [0, 90, 180, 270, 360],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: pulseDuration,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Glowing Soft Outer Ring */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="75"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="2"
                    style={{ filter: 'url(#glow)', opacity: 0.4 }}
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: pulseDuration * 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Activity Nodes */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <motion.circle
                        key={i}
                        cx={100 + 70 * Math.cos((angle * Math.PI) / 180)}
                        cy={100 + 70 * Math.sin((angle * Math.PI) / 180)}
                        r="3"
                        fill={theme.secondary}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [0.8, 1.5, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10"
                >
                    <span className="text-3xl filter drop-shadow-md">
                        {stage === 'follicular' ? '🌱' : stage === 'ovulatory' ? '✨' : stage === 'luteal' ? '🌙' : stage === 'trimester4' ? '👶' : '🤍'}
                    </span>
                </motion.div>
            </div>
        </div>
    );
};
