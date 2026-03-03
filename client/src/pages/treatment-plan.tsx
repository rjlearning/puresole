import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TreatmentModule from "@/components/treatment/treatment-module";
import {
  CheckCircle2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Brain,
  Plus,
  BookOpen,
  Heart,
  Wind,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TreatmentPlan() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/auth";
    }
  }, [isAuthenticated, authLoading]);

  // If no ID is provided, fetch all plans
  const { data: allPlansRaw, isLoading: allPlansLoading } = useQuery({
    queryKey: ["/api/treatment-plans"],
    enabled: !id && isAuthenticated,
    refetchInterval: 4000, // Poll while waiting for plan generation
  });

  const allPlans = (allPlansRaw as any[]) || [];
  const activePlanId = id || (allPlans.length > 0 ? allPlans[0].id : null);

  const { data: treatmentPlanRaw, isLoading: planLoading, error: planError } = useQuery({
    queryKey: ["/api/treatment-plans", activePlanId],
    enabled: !!activePlanId,
    retry: false,
    refetchInterval: 4000, // Poll while plan is synthesizing
  });

  const treatmentPlan = treatmentPlanRaw as any;

  // Check if the plan has real content (modules with activities)
  const hasRealContent = treatmentPlan?.modules?.some(
    (m: any) => m.content?.activities && m.content.activities.length > 0
  );

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

  // Set default selected week once treatment plan loads
  useEffect(() => {
    if (treatmentPlan?.currentWeek) {
      setSelectedWeek(treatmentPlan.currentWeek);
    }
  }, [treatmentPlan?.currentWeek]);

  // ── LOADING STATE ──
  if (planLoading || allPlansLoading || authLoading) {
    return <SynthesizingState />;
  }

  // ── NO PLAN EXISTS: Show plan creator ──
  if (!treatmentPlan && !activePlanId && !allPlansLoading) {
    return <PlanCreator />;
  }

  // ── API ERROR ──
  if (planError) {
    return (
      <div className="flex-1 min-h-screen bg-[#fafafa] flex items-center justify-center p-4 relative">
        <NeuralGrid />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-sm w-full relative z-10 text-center p-8 rounded-3xl border border-slate-100 shadow-2xl bg-white">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 text-sm mb-6">Could not load your protocol. Try refreshing.</p>
          <Link href="/"><Button className="w-full rounded-2xl h-11 font-black bg-slate-900">Return to Dashboard</Button></Link>
        </motion.div>
      </div>
    );
  }

  // ── PLAN EXISTS BUT STILL SYNTHESIZING (no content yet) ──
  if (!hasRealContent) {
    return (
      <div className="flex-1 min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 relative gap-6">
        <NeuralGrid />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center w-full max-w-sm"
        >
          {/* Animated AI orb */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-indigo-400/30 rounded-full blur-xl"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-2 border-dashed border-indigo-300"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-10 h-10 text-indigo-500" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
            </span>
            Clinical AI Orchestrator
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            Synthesizing Your Protocol
          </h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            Your personalized clinical pathway is being composed. This usually takes 10–30 seconds.
          </p>

          {/* Animated steps */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left space-y-3">
            {[
              "Analyzing emotional baseline",
              "Applying evidence-based frameworks",
              "Structuring weekly modules",
              "Composing personalized exercises",
            ].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4 + 0.3 }}
                className="flex items-center gap-3 text-sm"
              >
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                >
                  <Activity className="w-4 h-4 text-indigo-400" />
                </motion.div>
                <span className="text-slate-600 font-medium">{step}</span>
              </motion.div>
            ))}
          </div>

          <Link href="/" className="block mt-6">
            <button className="w-full py-3 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── PLAN IS READY ──
  const allWeeks: number[] = Array.from<number>(
    new Set(treatmentPlan.modules
      .filter((m: any) => m.content?.activities?.length > 0)
      .map((m: any) => Number(m.week)))
  ).sort((a, b) => a - b);

  const completedActivities = progressEntries.filter((e: any) => e.completed);
  const totalActivities = treatmentPlan.modules.reduce(
    (acc: number, mod: any) => acc + (mod.content?.activities?.length || 0), 0
  );
  const completionPercentage = totalActivities > 0
    ? Math.round((completedActivities.length / totalActivities) * 100)
    : 0;

  const currentWeekModules = treatmentPlan.modules.filter(
    (m: any) => m.week === selectedWeek && m.content?.activities?.length > 0
  );

  return (
    <motion.div
      key="treatment-plan"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 min-h-screen bg-[#fafafa] font-sans text-slate-800 relative"
    >
      <NeuralGrid />

      {/* ── Scrollable content with mobile-friendly padding ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-32 relative z-10">

        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/">
                <button className="p-1.5 rounded-full bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                </button>
              </Link>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 leading-none">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-400">Pathway</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-white border border-slate-100 shadow-sm rounded-full px-3 py-2 flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500 hidden sm:block">Protocol Active</span>
          </div>
        </header>

        {/* ── Hero Card (mobile-first) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm mb-6 relative overflow-hidden"
        >
          {/* Plan badge + title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3">
                <ShieldCheck className="w-3 h-3" />
                Clinical Protocol
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 mb-1">
                {treatmentPlan.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">{treatmentPlan.description}</p>
            </div>
            {/* Progress Circle */}
            <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 shrink-0">
              <div className="text-2xl font-black text-slate-900 tracking-tighter">{completionPercentage}%</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Done</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
            />
          </div>

          {/* Stats — 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Week", val: `${treatmentPlan.currentWeek || 1}` },
              { label: "Duration", val: `${treatmentPlan.totalWeeks || '—'} wks` },
              { label: "Progress", val: `${completedActivities.length}/${totalActivities}` },
              { label: "Approach", val: "CBT" }
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</div>
                <div className="text-sm font-black text-slate-800">{s.val}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Week Nav — horizontal scroll on mobile ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {allWeeks.map((week) => {
              const isCurrent = week === selectedWeek;
              const isPast = (treatmentPlan?.currentWeek || 1) > week;
              return (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all duration-200 ${isCurrent
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                    : isPast
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                >
                  {isPast && !isCurrent && <CheckCircle2 className="w-3.5 h-3.5" />}
                  Week {week}
                  {isCurrent && <span className="text-[9px] font-black uppercase tracking-wider opacity-70">Active</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Module List ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Week {selectedWeek}</h3>
            </div>
            <Badge className="px-3 py-1 rounded-full bg-indigo-50 border-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-widest">
              {currentWeekModules.length} Modules
            </Badge>
          </div>

          {currentWeekModules.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedWeek}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {currentWeekModules.map((module: any, idx: number) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07, duration: 0.4 }}
                  >
                    <TreatmentModule
                      module={module}
                      progressEntries={progressEntries}
                      onActivityComplete={(name, type) => progressMutation.mutate({
                        planId: activePlanId,
                        moduleId: module.id,
                        activityName: name,
                        activityType: type,
                        date: new Date(),
                        completed: true
                      })}
                      isLoading={progressMutation.isPending}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
              <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No modules this week</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Shared Components ──
function NeuralGrid() {
  return (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
  );
}

function SynthesizingState() {
  return (
    <div className="flex-1 min-h-screen bg-[#fafafa] flex items-center justify-center relative">
      <NeuralGrid />
      <div className="flex flex-col items-center gap-3 relative z-10">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Activity className="w-10 h-10 text-indigo-500" />
        </motion.div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function PlanCreator() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = [
    { week: 1, title: "Baseline Awareness", color: "bg-indigo-50 border-indigo-100", dot: "bg-indigo-500", icon: "🧘" },
    { week: 2, title: "Thought Patterns & Reframing", color: "bg-amber-50 border-amber-100", dot: "bg-amber-500", icon: "🔍" },
    { week: 3, title: "Emotional Regulation Skills", color: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", icon: "⚡" },
    { week: 4, title: "Integration & Mastery", color: "bg-rose-50 border-rose-100", dot: "bg-rose-500", icon: "🌟" },
  ];

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/prescriptions/seed", {});
      const data = await res.json();
      if (data.planId) {
        queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans"] });
        window.location.href = `/treatment-plan/${data.planId}`;
      } else {
        setError("Failed to create plan. Please try again.");
      }
    } catch (e) {
      setError("Server error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#fafafa] relative">
      <NeuralGrid />
      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Brain className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Your Clinical Pathway</h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            A 4-week evidence-based program tailored to build emotional resilience, grounded in CBT, somatic practices, and mindfulness.
          </p>
        </motion.div>

        {/* Feature badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-8">
          {["Evidence-Based CBT", "Somatic Awareness", "DBT Skills", "Mindfulness", "12 Activities", "4 Weeks"].map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">{tag}</span>
          ))}
        </motion.div>

        {/* Week preview cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {weeks.map((w, i) => (
            <motion.div key={w.week} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className={`rounded-2xl border p-4 ${w.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{w.icon}</span>
                <div className={`w-2 h-2 rounded-full ${w.dot}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Week {w.week}</span>
              </div>
              <div className="font-black text-slate-900 text-sm leading-tight">{w.title}</div>
              <div className="text-xs text-slate-500 mt-1">3 activities</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {error && (
            <div className="text-center text-sm text-rose-600 font-medium mb-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
              {error}
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all disabled:opacity-60 shadow-lg shadow-slate-900/20"
          >
            {creating ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Activity className="w-5 h-5" /></motion.div> Creating your pathway...</>
            ) : (
              <><Plus className="w-5 h-5" /> Start My 4-Week Program</>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            You can also generate a personalized plan from your <Link href="/dashboard" className="text-indigo-500 font-bold">dashboard</Link> by selecting your emotional state.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
