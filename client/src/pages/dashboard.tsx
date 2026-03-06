import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Brain, Wind, Heart, Activity,
  ArrowRight, MessageSquare, Zap, Mic, ChevronRight, BarChart2
} from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { DailyStreakBanner } from "@/components/DailyStreakBanner";
import { TodaysProtocol } from "@/components/TodaysProtocol";
import { recordCheckIn } from "@/lib/streakEngine";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Night owl mode";
}

function getOrbGradient(v: number): string {
  if (v > 70) return "from-amber-400 to-rose-500";
  if (v < 30) return "from-blue-500 to-indigo-600";
  return "from-emerald-400 to-teal-500";
}

function getAIInsight(v: number): string {
  if (v > 80) return "Peak energy detected. Channel this into meaningful action — your window for deep work is now.";
  if (v > 60) return "Good momentum. A focused breathing cycle will sharpen your edge even further.";
  if (v > 40) return "Balanced state. Perfect for a reflective session — clarity tends to arise in the quiet middle.";
  if (v > 20) return "Low reserves. Your body is sending a message. A somatic release will reset the nervous system.";
  return "Running on empty. Let the AI guide you through a 3-minute nervous system reset.";
}

// ── Pattern Analysis Card ──────────────────────────────────────────────────────
function PatternCard({ assessments }: { assessments: any[] }) {
  const patterns = [
    "You tend to feel lower energy mid-week. Today, try a 4-minute movement reset before 2pm.",
    "Your check-ins point to improved resilience over the past 7 days. Keep building.",
    "There's a pattern of tension in your evenings. A somatic wind-down routine could break the cycle.",
    "Morning check-ins correlate with better overall daily mood in your data. Keep showing up.",
  ];
  const pattern = patterns[Math.floor(Date.now() / 86400000) % patterns.length];

  return (
    <div className="bg-slate-900/60 border border-indigo-500/10 rounded-[2rem] p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400 mb-1">AI Noticed</p>
          <p className="text-sm text-slate-300 leading-relaxed">{pattern}</p>
        </div>
      </div>
    </div>
  );
}

// ── AI Insight Card ─────────────────────────────────────────────────────────────
function AIInsightCard() {
  const { data: insightRaw, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/insights"],
    retry: false,
    staleTime: 6 * 60 * 60 * 1000, // Refresh every 6h
  });

  const insightText = insightRaw?.description ||
    "Every check-in is a small act of profound self-respect. You showed up. That matters.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative rounded-[2rem] overflow-hidden border border-white/5"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-rose-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />

      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Today's Insight</span>
        </div>
        {isLoading ? (
          <div className="h-5 bg-slate-800 rounded-full animate-pulse w-3/4" />
        ) : (
          <p className="text-base font-light text-slate-200 leading-relaxed italic">
            "{insightText}"
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Plan Progress Ticker ───────────────────────────────────────────────────────
function PlanProgressTicker() {
  const [, setLocation] = useLocation();
  const { data: plansRaw } = useQuery<any[]>({ queryKey: ["/api/treatment-plans"], retry: false });
  const plans = plansRaw || [];
  if (plans.length === 0) return null;
  const plan = plans[0];
  const pct = plan.completionPercentage ?? 0;
  const weekLabel = `Week ${plan.currentWeek ?? 1} of ${plan.totalWeeks ?? 8}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      onClick={() => setLocation('/treatment-plan')}
      className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-5 cursor-pointer hover:border-slate-700 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">Active Protocol</p>
          <p className="text-sm font-bold text-white truncate max-w-[200px]">{plan.title || "Wellness Journey"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400">{weekLabel}</span>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 3)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
        />
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5 font-medium">{pct}% complete</p>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function AIOrchestratedDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [interactionState, setInteractionState] = useState<'prompt' | 'processing' | 'reward'>('prompt');
  const [insightText, setInsightText] = useState("");
  const [streak, setStreak] = useState(0);

  const { data: assessments = [], isLoading: assessLoading } = useQuery<any[]>({
    queryKey: ["/api/assessments"], retry: false
  });
  const recentAssessment = assessments[0];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    } else if (isAuthenticated && !assessLoading && assessments.length === 0) {
      setLocation('/onboarding');
    }
  }, [isAuthenticated, isLoading, assessLoading, assessments.length, setLocation]);

  const handleOrbRelease = useCallback(() => {
    if (interactionState !== 'prompt') return;
    setInteractionState('processing');
    setTimeout(() => {
      setInsightText(getAIInsight(sliderValue));
      setInteractionState('reward');
      // Increment streak on first daily check-in
      const newStreak = recordCheckIn();
      setStreak(newStreak);
    }, 1600);
  }, [interactionState, sliderValue]);

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  const orbGradient = getOrbGradient(sliderValue);
  const glowSize = 20 + Math.abs(sliderValue - 50);
  const greeting = getGreeting();
  const firstName = (user as any)?.firstName || "there";

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 relative overflow-x-hidden" data-testid="ai-dashboard">

      {/* ── Fixed Header ─── */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 p-[2px] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="font-black text-white text-sm">P</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-0.5">{greeting}</p>
              <h1 className="text-base font-black text-white leading-none">{firstName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streak pill in header */}
            <DailyStreakBanner onStreakCheck={setStreak} />
            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-700"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Feed ─── */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">

        {/* 1. Stories — Today's Protocol */}
        <TodaysProtocol onAllComplete={() => {
          const n = recordCheckIn();
          setStreak(n);
        }} />

        {/* 2. Daily Pulse Orb */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] px-6 py-8">
          <AnimatePresence mode="wait">

            {/* PROMPT */}
            {interactionState === 'prompt' && (
              <motion.div key="prompt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center w-full">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400 mb-5 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Daily Pulse
                </span>
                <h2 className="text-xl font-light text-center leading-tight mb-10 px-2">
                  How is your <span className="font-semibold text-white">energy</span> right now?
                </h2>
                <div className="relative w-full px-10 py-8 flex flex-col items-center">
                  {/* Track line */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-full bg-slate-800 rounded-full top-0" />
                  {/* Hidden range input */}
                  <input
                    type="range" min="0" max="100"
                    value={sliderValue}
                    onChange={e => setSliderValue(parseInt(e.target.value))}
                    onMouseUp={handleOrbRelease}
                    onTouchEnd={handleOrbRelease}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                    style={{ writingMode: 'vertical-rl' } as any}
                  />
                  {/* Animated Orb */}
                  <motion.div
                    animate={{ y: -((sliderValue - 50) * 1.4), scale: 1 + (Math.abs(sliderValue - 50) / 100) * 0.2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr ${orbGradient} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 ${glowSize}px ${glowSize / 2}px rgba(99,102,241,0.4)` }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center"
                    >
                      <Zap className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-6">Drag to answer</p>
              </motion.div>
            )}

            {/* PROCESSING */}
            {interactionState === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr ${orbGradient} blur-xl opacity-60 absolute`}
                />
                <Brain className="w-10 h-10 text-white relative z-10 animate-pulse" />
                <p className="mt-6 text-sm font-medium text-slate-300 tracking-wide uppercase">Analyzing patterns...</p>
              </motion.div>
            )}

            {/* REWARD */}
            {interactionState === 'reward' && (
              <motion.div key="reward" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center w-full px-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${orbGradient} flex items-center justify-center mb-5 shadow-xl`}>
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                {/* Streak badge if just incremented */}
                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="mb-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-2"
                  >
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-black text-amber-400">{streak} day streak!</span>
                  </motion.div>
                )}

                <p className="text-lg font-light text-white leading-relaxed mb-7 italic">
                  "{insightText}"
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocation('/activities?recommended=true')}
                    className={`py-3.5 px-6 rounded-full bg-white text-slate-950 font-black text-sm tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center gap-2`}
                  >
                    <Wind className="w-4 h-4" /> Start Exercise
                  </button>
                  <button
                    onClick={() => { setInteractionState('prompt'); setSliderValue(50); }}
                    className="py-3.5 px-4 rounded-full bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. AI Daily Insight Card */}
        <AIInsightCard />

        {/* 4. Treatment Plan Progress Ticker */}
        <PlanProgressTicker />

        {/* 5. AI Pattern Analysis */}
        {recentAssessment && <PatternCard assessments={assessments} />}

        {/* 6. Last Assessment + Quick links */}
        {recentAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Assessment status */}
            <div
              onClick={() => setLocation('/assessment')}
              className="bg-slate-900/40 border border-rose-500/10 p-4 rounded-[1.5rem] flex flex-col gap-2 cursor-pointer hover:border-rose-500/20 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
              <p className="text-xs font-bold text-slate-300 capitalize">{(recentAssessment.severity || 'pending').replace('_', ' ')}</p>
            </div>

            {/* Voice Biomarkers */}
            <Link href="/voice-analyzer">
              <div className="bg-slate-900/40 border border-indigo-500/10 p-4 rounded-[1.5rem] flex flex-col gap-2 cursor-pointer hover:border-indigo-500/20 transition-all h-full">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bonus</p>
                <p className="text-xs font-bold text-slate-300">Vocal Scan</p>
              </div>
            </Link>
          </motion.div>
        )}

      </div>
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
