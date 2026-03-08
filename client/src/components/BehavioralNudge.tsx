import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    Bell,
    X,
    ArrowRight,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Nudge {
    id: string;
    type: 'threshold_low' | 'threshold_high' | 'evening_reminder' | 'streak_celebration';
    title: string;
    message: string;
    ctaText: string;
    ctaLink: string;
    severity: 'info' | 'warning' | 'success';
}

export function BehavioralNudge() {
    const [isVisible, setIsVisible] = useState(false);
    const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);

    const { data } = useQuery<{ nudge: Nudge | null }>({
        queryKey: ["/api/nudges"],
        refetchInterval: 30000, // Poll every 30 seconds
    });

    const nudge = data?.nudge;

    useEffect(() => {
        if (nudge && !dismissedNudges.includes(nudge.id)) {
            // Small delay before showing to make it feel organic
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [nudge, dismissedNudges]);

    const handleDismiss = () => {
        if (nudge) {
            setDismissedNudges(prev => [...prev, nudge.id]);
            setIsVisible(false);
        }
    };

    if (!nudge) return null;

    const getIcon = () => {
        switch (nudge.severity) {
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
            case 'success': return <Sparkles className="w-5 h-5 text-emerald-400" />;
            case 'info': return <Info className="w-5 h-5 text-blue-400" />;
            default: return <Bell className="w-5 h-5 text-indigo-400" />;
        }
    };

    const getGradient = () => {
        switch (nudge.severity) {
            case 'warning': return "from-amber-500/20 to-orange-500/20";
            case 'success': return "from-emerald-500/20 to-teal-500/20";
            case 'info': return "from-blue-500/20 to-indigo-500/20";
            default: return "from-indigo-500/20 to-purple-500/20";
        }
    };

    const getBorder = () => {
        switch (nudge.severity) {
            case 'warning': return "border-amber-500/30";
            case 'success': return "border-emerald-500/30";
            case 'info': return "border-blue-500/30";
            default: return "border-indigo-500/30";
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-96"
                >
                    <div className={`relative overflow-hidden rounded-[2rem] border ${getBorder()} bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6`}>
                        {/* Ambient Background Glow */}
                        <div className={`absolute -inset-24 bg-gradient-to-br ${getGradient()} blur-3xl opacity-50 pointer-events-none`} />

                        <div className="relative flex gap-4">
                            <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-800/80 border ${getBorder()}`}>
                                {getIcon()}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-black text-white tracking-tight">
                                        {nudge.title}
                                    </h4>
                                    <button
                                        onClick={handleDismiss}
                                        className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                    {nudge.message}
                                </p>

                                <Link href={nudge.ctaLink}>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-xs font-black text-white hover:text-white/80 transition-colors group"
                                        onClick={() => setIsVisible(false)}
                                    >
                                        {nudge.ctaText}
                                        <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
