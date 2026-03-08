import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Brain,
  Plus,
  Lock,
  Compass,
  Zap,
  Star,
  Play,
  Trophy
} from "lucide-react";
import TreatmentModule from "@/components/treatment/treatment-module";

export default function TreatmentPlan() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: allPlansRaw, isLoading: allPlansLoading } = useQuery({
    queryKey: ["/api/treatment-plans"],
    enabled: !id && isAuthenticated,
    refetchInterval: 5000,
  });
  const allPlans = (allPlansRaw as any[]) || [];
  const activePlanId = id || (allPlans.length > 0 ? allPlans[0].id : null);

  const { data: treatmentPlanRaw, isLoading: planLoading, error: planError } = useQuery({
    queryKey: ["/api/treatment-plans", activePlanId],
    enabled: !!activePlanId,
    retry: false,
    refetchInterval: 5000,
  });

  const treatmentPlan = treatmentPlanRaw as any;
  const hasRealContent = treatmentPlan?.modules?.length > 0;

  const { data: progressEntriesRaw } = useQuery({
    queryKey: ["/api/progress/plan", activePlanId],
    enabled: !!activePlanId && !!hasRealContent,
    retry: false,
  });

  const progressEntries = (progressEntriesRaw as any[]) || [];
  const progressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      await apiRequest("POST", "/api/progress", progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/plan", activePlanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", activePlanId] });
    },
  });

  const advancePhaseMutation = useMutation({
    mutationFn: async (nextWeek: number) => {
      await apiRequest("PATCH", `/api/treatment-plans/${activePlanId}`, { currentWeek: nextWeek });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", activePlanId] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  if (planLoading || allPlansLoading || authLoading) return <SynthesizingState />;
  if (!treatmentPlan && !activePlanId && !allPlansLoading) return <ModularPlanCreator />;
  if (planError) return <ErrorState />;
  if (!hasRealContent) return <SynthesizingState />;

  const allWeeks = Array.from<number>(
    new Set(treatmentPlan.modules
      .filter((m: any) => m.content?.activities?.length > 0)
      .map((m: any) => Number(m.week)))
  ).sort((a, b) => a - b);

  const currentWeekNum = treatmentPlan.currentWeek || 1;
  const completedActivities = progressEntries.filter((e: any) => e.completed);
  const totalActivities = treatmentPlan.modules.reduce((acc: number, mod: any) => acc + (mod.content?.activities?.length || 0), 0);
  const completionPercentage = totalActivities > 0 ? Math.round((completedActivities.length / totalActivities) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-950 text-white pb-32 overflow-x-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-40 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-12 relative z-10">

        {/* Header */}
        <header className="flex items-center justify-end mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-300">Phase {currentWeekNum} / {allWeeks.length}</span>
          </div>
        </header>

        {/* Title Map */}
        <div className="mb-16">
          <h1 className="text-4xl font-light leading-tight mb-4">
            Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Progression Map</span>
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm max-w-md">
            {treatmentPlan.description} The AI has unlocked your current phase based on your baseline assessment.
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-16 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/60 backdrop-blur-sm flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              <span>Journey</span>
              <span className="text-indigo-400">{completionPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
              />
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Star className={`w-6 h-6 ${completionPercentage === 100 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Vertical Skill Tree Journey */}
        <div className="relative pl-8 sm:pl-12">
          {/* The Neural Path Line */}
          <div className="absolute top-0 bottom-0 left-[23px] sm:left-[39px] w-[2px] bg-gradient-to-b from-indigo-500 via-rose-500/50 to-slate-800" />

          <div className="space-y-16">
            {allWeeks.map((week, idx) => {
              const weekModules = treatmentPlan.modules.filter((m: any) => m.week === week);
              const isPast = week < currentWeekNum;
              const isCurrent = week === currentWeekNum;
              const isLocked = week > currentWeekNum;

              // Determine Node styling
              let nodeColor = "bg-slate-800 border-slate-700 text-slate-500";
              let shadow = "";
              if (isPast) nodeColor = "bg-indigo-500 border-indigo-400 text-white";
              if (isCurrent) {
                nodeColor = "bg-gradient-to-tr from-rose-500 to-indigo-500 border-rose-400 text-white";
                shadow = "0 0 40px rgba(244, 63, 94, 0.4)";
              }

              // Check if all activities for this current week are completed
              const allActivitiesInWeek = weekModules.flatMap((m: any) => m.content?.activities || []);
              const isWeekFullyCompleted = allActivitiesInWeek.length > 0 && allActivitiesInWeek.every((act: any) =>
                progressEntries.some((e: any) => e.activityName === act.name && e.completed)
              );

              return (
                <div key={week} className={`relative transition-opacity duration-500 ${isLocked ? 'opacity-40 grayscale' : 'opacity-100'}`}>

                  {/* Glowing Node */}
                  <div
                    className={`absolute -left-[38px] sm:-left-[38px] top-4 w-12 h-12 rounded-full border-4 border-slate-950 flex items-center justify-center z-10 transition-all duration-300 ${nodeColor}`}
                    style={{ boxShadow: shadow }}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-white" />}
                  </div>

                  {/* Content Card */}
                  <div className="pl-6 sm:pl-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Phase {week}</h3>
                    <h4 className="text-xl font-medium text-white mb-6 flex items-center gap-3">
                      {isLocked ? "Undiscovered Territory" : `Module ${idx + 1} Exploration`}
                      {isCurrent && <span className="px-2 py-0.5 rounded text-[8px] bg-rose-500/20 text-rose-300 uppercase tracking-widest font-bold">Active</span>}
                    </h4>

                    {isLocked ? (
                      <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl flex flex-col items-center justify-center py-12">
                        <Lock className="w-8 h-8 text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium text-sm">Complete Phase {currentWeekNum} to unlock.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weekModules.map((module: any) => (
                          <div key={module.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors">
                            <div className="p-6">
                              <h5 className="font-bold text-white mb-2">{module.title}</h5>
                              <p className="text-sm text-slate-400 mb-6">{module.description}</p>

                              <div className="space-y-2">
                                {module.content?.activities?.map((activity: any, aIdx: number) => {
                                  const isCompleted = progressEntries.some((e: any) => e.activityName === activity.name);
                                  return (
                                    <div key={aIdx} className={`flex items-center justify-between p-4 rounded-2xl border ${isCompleted ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-950 border-slate-800'}`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3 h-3 ml-1" />}
                                        </div>
                                        <div>
                                          <p className={`font-semibold text-sm ${isCompleted ? 'text-indigo-300' : 'text-slate-200'}`}>{activity.name}</p>
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{activity.type}</p>
                                        </div>
                                      </div>

                                      {!isCompleted && isCurrent && (
                                        <button
                                          onClick={() => setLocation(`/activities/${encodeURIComponent(activity.name)}`)}
                                          className="px-4 py-2 bg-white text-slate-950 rounded-full font-black text-xs hover:scale-105 active:scale-95 transition-all"
                                        >
                                          Start
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Phase Advancement Button */}
                        {isCurrent && isWeekFullyCompleted && week < allWeeks[allWeeks.length - 1] && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                            <button
                              onClick={() => advancePhaseMutation.mutate(week + 1)}
                              disabled={advancePhaseMutation.isPending}
                              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-rose-500 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                              {advancePhaseMutation.isPending ? "Unlocking Neural Pathways..." : `Phase Complete — Unlock Phase ${week + 1}`}
                            </button>
                          </motion.div>
                        )}

                        {isCurrent && isWeekFullyCompleted && week === allWeeks[allWeeks.length - 1] && (
                          <div className="pt-4 text-center p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <Trophy className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                            <h4 className="text-lg font-bold text-white">Journey Complete</h4>
                            <p className="text-sm text-indigo-200 mt-1">You have mastered this protocol.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ── Shared Minimal States ──

function SynthesizingState() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" />
        <div className="absolute inset-2 border-2 border-rose-500/30 border-b-rose-500 rounded-full" style={{ animationDirection: 'reverse' }} />
        <Brain className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
      </motion.div>
      <h2 className="text-xl font-light text-white mb-2">Architecting Pipeline</h2>
      <p className="text-slate-500 text-sm">The AI is generating your progressive skill tree...</p>
    </div>
  );
}

function ErrorState() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-rose-500 mb-6" />
      <h2 className="text-xl font-bold text-white mb-4">Neural Disconnect</h2>
      <p className="text-slate-400 mb-8 max-w-xs">Could not load your progression map. The network might be stabilizing.</p>
      <button onClick={() => setLocation('/dashboard')} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-full">Return Home</button>
    </div>
  );
}

function ModularPlanCreator() {
  const [creating, setCreating] = useState(false);
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/prescriptions/seed", {});
      const data = await res.json();
      if (data.planId) {
        queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans"] });
        window.location.href = `/treatment-plan/${data.planId}`;
      }
    } catch (e) {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-[2rem] mx-auto mb-8 flex items-center justify-center p-1 shadow-2xl shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[28px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-light mb-4">No Active Journey</h1>
        <p className="text-slate-400 leading-relaxed mb-12">
          You don't have an AI Progression map yet. We can generate one based on universal baseline data.
        </p>
        <button onClick={handleCreate} disabled={creating} className="w-full py-4 rounded-full bg-white text-slate-900 font-black tracking-wide flex justify-center items-center gap-2 hover:scale-105 transition-all">
          {creating ? "Generating Intelligence..." : "Synthesize Progression Map"}
        </button>
      </div>
    </div>
  );
}
