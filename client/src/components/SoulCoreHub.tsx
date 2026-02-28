import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Mic, Sparkles, Zap, Moon, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SoulCoreHub() {
    const [isOpen, setIsOpen] = useState(false);
    const [, setLocation] = useLocation();

    const toggleCore = () => setIsOpen(!isOpen);

    const handleNavigate = (path: string) => {
        setIsOpen(false);
        setLocation(path);
    };

    const tools = [
        {
            id: 'voice',
            label: 'Voice Journal',
            icon: <Mic className="w-6 h-6" />,
            path: '/voice-journal',
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/20',
            hoverColor: 'hover:bg-rose-500/20',
            position: { x: 0, y: -120 } // Straight Up
        },
        {
            id: 'chat',
            label: 'AI Companion',
            icon: <Sparkles className="w-6 h-6" />,
            path: '/ai-companion',
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20',
            hoverColor: 'hover:bg-indigo-500/20',
            position: { x: -70, y: -95 } // Top Left
        },
        {
            id: 'activities',
            label: 'Activities',
            icon: <Zap className="w-6 h-6" />,
            path: '/activities',
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            hoverColor: 'hover:bg-amber-500/20',
            position: { x: -110, y: -45 } // Left Top
        },
        {
            id: 'sleep',
            label: 'Sleep & Restore',
            icon: <Moon className="w-6 h-6" />,
            path: '/sleep',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            hoverColor: 'hover:bg-purple-500/20',
            position: { x: -120, y: 20 } // Left (slightly down)
        }
    ];

    return (
        <>
            {/* Dimmed Background Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Floating Action Container */}
            <div className="fixed bottom-[100px] lg:bottom-8 right-6 lg:right-8 z-[70] flex items-center justify-center">

                {/* Expanded Tool Nodes */}
                <AnimatePresence>
                    {isOpen && (
                        <div className="absolute inset-0 flex items-center justify-center self-center w-full h-full pointer-events-none">
                            {tools.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                    animate={{
                                        opacity: 1,
                                        x: tool.position.x,
                                        y: tool.position.y,
                                        scale: 1
                                    }}
                                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: index * 0.05
                                    }}
                                    className="absolute pointer-events-auto"
                                >
                                    <button
                                        onClick={() => handleNavigate(tool.path)}
                                        className={cn(
                                            "group relative flex flex-col items-center justify-center gap-2",
                                            "w-20 h-20 rounded-full border shadow-xl backdrop-blur-md transition-all",
                                            tool.bgColor, tool.borderColor, tool.hoverColor
                                        )}
                                    >
                                        <div className={cn("transition-transform group-hover:scale-110", tool.color)}>
                                            {tool.icon}
                                        </div>
                                        {/* Tooltip Label */}
                                        <span className="absolute -bottom-8 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold tracking-wider uppercase rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {tool.label}
                                        </span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* The Soul Core Button */}
                <motion.button
                    onClick={toggleCore}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "relative w-16 h-16 rounded-full flex items-center justify-center outline-none focus:outline-none transition-shadow",
                        isOpen ? "bg-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.5)]" : "bg-black shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                    )}
                >
                    {/* Animated Glow Layers */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        {!isOpen && (
                            <>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -inset-2 bg-indigo-500/40 rounded-full blur-xl"
                                />
                                <motion.div
                                    animate={{ scale: [1, 0.9, 1], opacity: [0.8, 1, 0.8] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                    className="absolute inset-0 bg-rose-500/30 rounded-full blur-lg"
                                />
                            </>
                        )}
                    </div>

                    <div className="relative z-10 text-white flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X className="w-7 h-7" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Maximize2 className="w-7 h-7" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.button>

            </div>
        </>
    );
}
