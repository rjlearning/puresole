import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Loader2, ChevronDown, Clock, Dumbbell, Wind, PenTool, Brain, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Assessment, TreatmentPlan } from "@shared/schema";
import { useQuery } from '@tanstack/react-query';

interface Activity {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    duration: number;
    icon_emoji: string;
}

interface RecommendedActivitiesProps {
    recentAssessment?: Assessment;
    activePlan?: TreatmentPlan;
}

export function RecommendedActivities({ recentAssessment }: RecommendedActivitiesProps) {
    const { data: allActivities, isLoading } = useQuery<{ activities: Activity[] }>({
        queryKey: ['/api/activities'],
    });

    const activities = allActivities?.activities || [];

    const getTailoredActivities = (all: Activity[], assessment?: Assessment) => {
        if (!all.length) return [];
        if (!assessment) {
            const breathing = all.find(a => a.category === 'breathing');
            const journaling = all.find(a => a.category === 'journaling');
            const movement = all.find(a => a.category === 'movement');
            return [breathing, journaling, movement].filter(Boolean) as Activity[];
        }

        const type = assessment.type.toLowerCase();
        const recommended: Activity[] = [];
        if (type.includes('anxiety') || type.includes('stress')) {
            recommended.push(...all.filter(a => a.category === 'breathing' || a.category === 'grounding'));
        } else if (type.includes('depression') || type.includes('mood')) {
            recommended.push(...all.filter(a => a.category === 'movement' || a.category === 'journaling'));
        } else if (type.includes('sleep') || type.includes('insomnia')) {
            recommended.push(...all.filter(a => a.category === 'meditation' || a.category === 'breathing'));
        }

        const uniqueRecs = Array.from(new Set(recommended));
        if (uniqueRecs.length < 3) {
            const remaining = all.filter(a => !uniqueRecs.find(r => r.id === a.id));
            uniqueRecs.push(...remaining);
        }
        return uniqueRecs;
    };

    const tailoredActivities = getTailoredActivities(activities, recentAssessment);

    const getCategoryStyles = (category: string) => {
        switch (category.toLowerCase()) {
            case 'breathing':
                return {
                    icon: Wind,
                    color: 'text-cyan-500',
                    bg: 'from-cyan-500/10 to-blue-500/10',
                    border: 'border-cyan-500/20',
                    glow: 'shadow-cyan-500/20'
                };
            case 'movement':
                return {
                    icon: Dumbbell,
                    color: 'text-emerald-500',
                    bg: 'from-emerald-500/10 to-teal-500/10',
                    border: 'border-emerald-500/20',
                    glow: 'shadow-emerald-500/20'
                };
            case 'journaling':
                return {
                    icon: PenTool,
                    color: 'text-violet-500',
                    bg: 'from-violet-500/10 to-purple-500/10',
                    border: 'border-violet-500/20',
                    glow: 'shadow-violet-500/20'
                };
            default:
                return {
                    icon: Activity,
                    color: 'text-orange-500',
                    bg: 'from-orange-500/10 to-rose-500/10',
                    border: 'border-orange-500/20',
                    glow: 'shadow-orange-500/20'
                };
        }
    };

    if (isLoading) return (
        <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
    );

    if (activities.length === 0) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                        <div className="p-2.5 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        {recentAssessment ? "Tailored Protocols" : "Recommended for You"}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 ml-14">Adaptive sessions based on your emotional blueprint.</p>
                </div>
                <Link href="/activities">
                    <Button variant="ghost" className="text-slate-500 hover:text-orange-600 font-bold hover:bg-orange-50 group">
                        See All <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>

            {/* Horizontal Carousel Container */}
            <div className="relative group/carousel">
                <div className="flex overflow-x-auto pb-8 gap-6 snap-x no-scrollbar -mx-4 px-4 lg:-mx-8 lg:px-8">
                    {tailoredActivities.map((activity, index) => {
                        const styles = getCategoryStyles(activity.category);
                        const Icon = styles.icon;

                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex-none w-[320px] md:w-[380px] snap-start"
                            >
                                <Link href={`/activities/${activity.id}`}>
                                    <div className={`h-full group relative overflow-hidden rounded-[2.5rem] border ${styles.border} bg-white transition-all hover:shadow-2xl ${styles.glow} hover:-translate-y-2 cursor-pointer p-8`}>
                                        {/* Background Gradient Mesh */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />

                                        {/* Activity Header */}
                                        <div className="relative z-10 flex justify-between items-start mb-8">
                                            <div className={`w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                                <Icon className={`h-7 w-7 ${styles.color}`} />
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-slate-600 font-bold border-0 px-3 py-1">
                                                    <Clock className="w-3 h-3 mr-1" /> {activity.duration}m
                                                </Badge>
                                                {index === 0 && (
                                                    <Badge className="bg-orange-500 text-white font-black border-0 px-3 py-1 shadow-md">
                                                        OPTIMAL
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10 space-y-3">
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-slate-800 transition-colors">
                                                {activity.name}
                                            </h3>
                                            <p className="text-slate-500 font-medium leading-relaxed line-clamp-2 group-hover:text-slate-600 transition-colors">
                                                {activity.description}
                                            </p>
                                        </div>

                                        {/* Action Footer */}
                                        <div className="relative z-10 mt-8 flex items-center justify-between">
                                            <div className={`text-xs font-black uppercase tracking-widest ${styles.color} flex items-center gap-2 group-hover:gap-3 transition-all`}>
                                                Start Session <ArrowRight className="w-4 h-4" />
                                            </div>
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        ✨
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Floating Glow Element */}
                                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white opacity-20 blur-3xl transition-all group-hover:scale-150`} />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Scroll Indicator Gradient */}
                <div className="absolute right-0 top-0 bottom-8 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}
