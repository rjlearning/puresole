import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProgressChart from "@/components/dashboard/progress-chart";
import {
  Activity, Crown, CheckCircle, Heart, Compass, HeartHandshake, Leaf,
  Sparkles, MessageSquare, TrendingUp, ChevronRight, ArrowUpRight,
  BarChart2, Target, Calendar, Star
} from "lucide-react";
import { Link } from "wouter";
import { FeedbackModal } from "@/components/FeedbackModal";
import { motion } from "framer-motion";

const TAB_IDS = ["overview", "progress", "history", "goals"] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  progress: "Progress",
  history: "History",
  goals: "Goals",
};

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"], retry: false });
  const { data: treatmentPlans = [] } = useQuery<any[]>({ queryKey: ["/api/treatment-plans"], retry: false });
  const { data: progressData = [] } = useQuery<any[]>({ queryKey: ["/api/progress/user"], retry: false });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"], enabled: isAuthenticated, retry: false });
  const { data: sparksData } = useQuery<{ sparks: string[] }>({
    queryKey: ["/api/community/sparks"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Unauthorized", description: "Redirecting to login...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
    </div>
  );

  if (!isAuthenticated) return null;

  const activePlan = treatmentPlans?.find((p: any) => p.status === "active");
  const recentAssessments = assessments?.slice(0, 5) || [];

  // ── Metric Tiles ─────────────────────────────────────────────────────────────
  const metrics = [
    { label: "Reflections", value: assessments?.length || 0, icon: Heart, color: "from-rose-500 to-pink-600", light: "bg-rose-500/10 text-rose-400", delta: "+2 this week" },
    { label: "Active Journey", value: treatmentPlans?.filter((p: any) => p.status === "active").length || 0, icon: Compass, color: "from-indigo-500 to-blue-600", light: "bg-indigo-500/10 text-indigo-400", delta: "In progress" },
    { label: "Days Guided", value: progressData?.length || 0, icon: Calendar, color: "from-violet-500 to-purple-600", light: "bg-violet-500/10 text-violet-400", delta: "All time" },
    { label: "Current Focus", value: activePlan?.title || "None", icon: Target, color: "from-amber-500 to-orange-500", light: "bg-amber-500/10 text-amber-400", delta: activePlan ? "Active" : "Start one" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24" data-testid="dashboard-page">

      {/* ── Header ── */}
      <div className="bg-slate-950 border-b border-slate-800/60 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">PureSoul</p>
            <h1 className="text-lg font-black text-white leading-tight">My Journey</h1>
          </div>
          <div className="flex items-center gap-2">
            {subscription && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide">
                  {subscription.plan?.name || "Pro"}
                </span>
              </div>
            )}
            <button onClick={() => setFeedbackOpen(true)}
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700">
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-5">

        {/* ── Community Spark ── */}
        {sparksData && sparksData.sparks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-gradient-to-r from-rose-950/80 to-orange-950/80 border border-rose-800/40 rounded-2xl px-4 py-3 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500 mb-0.5">Community Spark</p>
              <p className="text-sm text-rose-200 italic leading-snug">"{sparksData.sparks[0]}"</p>
            </div>
          </motion.div>
        )}

        {/* ── Metric Grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {metrics.map((m, i) => (
            <motion.div key={m.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${m.color}`} />
              <div className={`w-8 h-8 rounded-xl ${m.light} flex items-center justify-center mb-3`}>
                <m.icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{m.label}</p>
              <p className={`font-black text-white ${typeof m.value === 'string' ? 'text-base leading-tight' : 'text-2xl'} truncate`}>
                {m.value}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">{m.delta}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div className="flex bg-slate-900 rounded-2xl p-1 border border-slate-800 mb-5 gap-1">
          {TAB_IDS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${tab === t
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300'}`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Active Plan Card */}
            {activePlan ? (
              <div className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-700/30 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-400 font-black mb-1">Current Journey</p>
                    <h2 className="text-base font-black text-white leading-tight">{activePlan.title}</h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activePlan.description}</p>
                  </div>
                  <Link href={`/treatment-plan/${activePlan.id}`}>
                    <button className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 hover:bg-indigo-500 transition-all">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </button>
                  </Link>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Week {activePlan.currentWeek} of {activePlan.totalWeeks}</span>
                  <span className="font-bold text-white">{activePlan.progressPercentage}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${activePlan.progressPercentage}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: "Week", value: `${activePlan.currentWeek}/${activePlan.totalWeeks}` },
                    { label: "Progress", value: `${activePlan.progressPercentage}%` },
                    { label: "Status", value: activePlan.status },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{stat.label}</p>
                      <p className="text-sm font-black text-white capitalize mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center" data-testid="card-no-plan">
                <Compass className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-black text-white mb-1">Ready to Start a Journey?</h3>
                <p className="text-sm text-slate-500 mb-4">Complete a reflection check-in to generate your path.</p>
                <Link href="/assessment">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold w-full" data-testid="button-start-assessment">
                    Begin Reflection
                  </Button>
                </Link>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" data-testid="card-recent-activity">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-black text-white">Recent Activity</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Last 5</span>
              </div>
              {progressData && progressData.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {progressData.slice(0, 5).map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${entry.completed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{entry.activityName}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{entry.activityType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-600">{new Date(entry.date).toLocaleDateString()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${entry.completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {entry.completed ? "Done" : "In progress"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No activity yet — start a session!</p>
                </div>
              )}
            </div>

            {/* Feedback CTA */}
            <button onClick={() => setFeedbackOpen(true)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-700/50 rounded-2xl p-4 flex items-center gap-3 transition-all group text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-all">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">Have feedback or found a bug?</p>
                <p className="text-xs text-slate-500">Help us improve PureSoul</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </button>
          </motion.div>
        )}

        {/* ── Tab: Progress ── */}
        {tab === "progress" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" data-testid="card-progress-chart">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-800">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-black text-white">Progress Over Time</span>
            </div>
            {progressData && progressData.length > 0 ? (
              <div className="p-4">
                <ProgressChart data={progressData} />
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <TrendingUp className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No progress data yet</p>
                <Link href="/activities">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">
                    Browse Activities
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: History ── */}
        {tab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3" data-testid="card-assessment-history">
            {recentAssessments.length > 0 ? recentAssessments.map((a: any, i: number) => {
              const sevColor = a.severity === 'severe' || a.severity === 'moderately_severe'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                : a.severity === 'moderate'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white capitalize leading-tight">
                      {a.type.replace('_', ' ')} Assessment
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Score {a.score} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${sevColor}`}>
                    {a.severity.replace('_', ' ')}
                  </span>
                </motion.div>
              );
            }) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl text-center py-12 px-4">
                <Heart className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No reflections yet</p>
                <Link href="/assessment">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm" data-testid="button-first-assessment">
                    Take Your First Assessment
                  </Button>
                </Link>
              </div>
            )}
            {assessments.length > 3 && (
              <Link href="/assessment">
                <button className="w-full py-3 text-sm font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1" data-testid="button-view-all-assessments">
                  View All Assessments <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </motion.div>
        )}

        {/* ── Tab: Goals ── */}
        {tab === "goals" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="card-treatment-goals">
            {activePlan?.goals ? (
              <div className="space-y-3">
                {activePlan.goals.map((goal: string, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 p-4">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black text-indigo-400">{i + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">{goal}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl text-center py-12 px-4">
                <Target className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No goals set yet</p>
                <Link href="/assessment">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">
                    Create a Plan
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}

      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
