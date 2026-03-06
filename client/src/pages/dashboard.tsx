import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Brain, Wind, ArrowRight,
  MessageSquare, Zap, Mic, BarChart2, LogOut, Heart
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
  return "Night owl";
}

function getOrbGradient(v: number) {
  if (v > 70) return "from-amber-400 to-rose-500";
  if (v < 30) return "from-blue-500 to-indigo-600";
  return "from-emerald-400 to-teal-500";
}

function getAIInsight(v: number): string {
  if (v > 80) return "Peak energy detected. Channel this into meaningful action — your window for deep work is now.";
  if (v > 60) return "Good momentum. A focused breathing cycle will sharpen your edge even further.";
  if (v > 40) return "Balanced state. Perfect for a reflective session — clarity tends to arise in the quiet middle.";
  if (v > 20) return "Low reserves. Your body is sending a signal. A somatic release will reset your nervous system.";
  return "Running on empty. Let the AI guide you through a 3-minute nervous system reset.";
}

// ── Sign Out ───────────────────────────────────────────────────────────────────
async function signOut() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } finally {
    window.location.href = "/auth";
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function AIInsightCard() {
  const { data: insightRaw, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/insights"],
    retry: false,
    staleTime: 6 * 60 * 60 * 1000,
  });
  const text = insightRaw?.description || "Every check-in is a small act of profound self-respect. You showed up. That's everything.";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative rounded-[2rem] overflow-hidden border border-white/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-rose-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.18),_transparent_60%)]" />
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Today's Insight</span>
        </div>
        {isLoading
          ? <div className="h-4 bg-slate-800/80 rounded-full animate-pulse w-3/4" />
          : <p className="text-sm font-light text-slate-200 leading-relaxed italic">"{text}"</p>
        }
      </div>
    </motion.div>
  );
}

function PlanProgressTicker() {
  const [, setLocation] = useLocation();
  const { data: plansRaw } = useQuery<any[]>({ queryKey: ["/api/treatment-plans"], retry: false });
  const plan = plansRaw?.[0];
  if (!plan) return null;
  const pct = plan.completionPercentage ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      onClick={() => setLocation('/treatment-plan')}
      className="bg-slate-900/50 border border-slate-800/60 rounded-[2rem] p-5 cursor-pointer hover:border-slate-700 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">Active Protocol</p>
          <p className="text-sm font-bold text-white truncate max-w-[200px]">{plan.title || "Wellness Journey"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400">Week {plan.currentWeek ?? 1} / {plan.totalWeeks ?? 8}</span>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 3)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
        />
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5 font-medium">{pct}% complete</p>
    </motion.div>
  );
}

function PatternCard() {
  const PATTERNS = [
    "Check-ins correlate with your best days. You're building a real habit here.",
    "Morning sessions show the strongest mood lift in your data. Try before 9am.",
    "Tension patterns often spike Thursday–Friday. A somatic routine could break the cycle.",
    "Your resilience score has been climbing. Keep showing up consistently.",
  ];
  const text = PATTERNS[Math.floor(Date.now() / 86_400_000) % PATTERNS.length];
  return (
    <div className="bg-slate-900/60 border border-indigo-500/10 rounded-[2rem] p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400 mb-1">AI Noticed</p>
          <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AIOrchestratedDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [interactionState, setInteractionState] = useState<'prompt' | 'processing' | 'reward'>('prompt');
  const [insightText, setInsightText] = useState("");
  const [streak, setStreak] = useState(0);

  const { data: assessments = [], isLoading: assessLoading } = useQuery<any[]>({
    queryKey: ["/api/assessments"], retry: false
  });
  const recentAssessment = (assessments as any[])[0];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    } else if (isAuthenticated && !assessLoading && (assessments as any[]).length === 0) {
      setLocation('/onboarding');
    }
  }, [isAuthenticated, isLoading, assessLoading, (assessments as any[]).length]);

  const handleOrbRelease = useCallback(() => {
    if (interactionState !== 'prompt') return;
    setInteractionState('processing');
    setTimeout(() => {
      setInsightText(getAIInsight(sliderValue));
      setInteractionState('reward');
      const n = recordCheckIn();
      setStreak(n);
    }, 1500);
  }, [interactionState, sliderValue]);

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  const orbGradient = getOrbGradient(sliderValue);
  const glowPx = 20 + Math.abs(sliderValue - 50);
  const firstName = (user as any)?.firstName || "there";

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28 relative overflow-x-hidden" data-testid="ai-dashboard">

      {/* ── Sticky Header ── */}
      <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">

          {/* Logo + greeting */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 p-[2px] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="font-black text-white text-sm">P</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-0.5">{getGreeting()}</p>
              <h1 className="text-base font-black text-white leading-none capitalize">{firstName}</h1>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <DailyStreakBanner onStreakCheck={setStreak} />

            {/* Menu toggle */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-700"
              >
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    className="absolute right-0 top-11 w-44 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl z-50"
                  >
                    <button
                      onClick={() => { setShowMenu(false); setFeedbackOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      Feedback
                    </button>
                    <div className="h-px bg-slate-800" />
                    <button
                      onClick={() => { setShowMenu(false); signOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-xl mx-auto px-4 pt-5 space-y-5">

        {/* 1. Stories — Today's Protocol */}
        <TodaysProtocol onAllComplete={() => { const n = recordCheckIn(); setStreak(n); }} />

        {/* 2. Daily Pulse Orb */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[360px] px-6 py-8">
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
                  <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-full bg-slate-800 rounded-full top-0" />
                  <input
                    type="range" min="0" max="100" value={sliderValue}
                    onChange={e => setSliderValue(parseInt(e.target.value))}
                    onMouseUp={handleOrbRelease}
                    onTouchEnd={handleOrbRelease}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                    style={{ writingMode: 'vertical-rl' } as any}
                  />
                  <motion.div
                    animate={{ y: -((sliderValue - 50) * 1.4), scale: 1 + (Math.abs(sliderValue - 50) / 100) * 0.2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr ${orbGradient} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 ${glowPx}px ${glowPx / 2}px rgba(99,102,241,0.4)` }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center"
                    >
                      <Zap className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>
                </div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-5">Drag to respond</p>
              </motion.div>
            )}

            {/* PROCESSING */}
            {interactionState === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr ${orbGradient} blur-xl opacity-60 absolute`}
                />
                <Brain className="w-10 h-10 text-white relative z-10 animate-pulse" />
                <p className="mt-6 text-sm font-medium text-slate-300 tracking-wide uppercase">Analyzing patterns...</p>
              </motion.div>
            )}

            {/* REWARD */}
            {interactionState === 'reward' && (
              <motion.div key="reward" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center w-full px-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${orbGradient} flex items-center justify-center mb-4 shadow-xl`}>
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="mb-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-2"
                  >
                    <span>🔥</span>
                    <span className="text-xs font-black text-amber-400">{streak} day streak!</span>
                  </motion.div>
                )}

                <p className="text-base font-light text-white leading-relaxed mb-6 italic">"{insightText}"</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setLocation('/activities?recommended=true')}
                    className="py-3 px-6 rounded-full bg-white text-slate-950 font-black text-sm tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                  >
                    <Wind className="w-4 h-4" /> Start Exercise
                  </button>
                  <button
                    onClick={() => { setInteractionState('prompt'); setSliderValue(50); }}
                    className="py-3 px-4 rounded-full bg-slate-800/80 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-all border border-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. AI Insight */}
        <AIInsightCard />

        {/* 4. Plan Progress */}
        <PlanProgressTicker />

        {/* 5. Pattern Analysis */}
        {recentAssessment && <PatternCard />}

        {/* 6. Quick Links Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="grid grid-cols-3 gap-3">
          {[
            { label: "Assessment", emoji: "❤️", route: "/assessment", sub: recentAssessment ? (recentAssessment.severity || 'check').replace('_', ' ') : "Take one" },
            { label: "Vocal Scan", emoji: "🎙️", route: "/voice-analyzer", sub: "Bonus tool" },
            { label: "Community", emoji: "🌐", route: "/community", sub: "Connect" },
          ].map(item => (
            <div
              key={item.route}
              onClick={() => setLocation(item.route)}
              className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-[1.5rem] flex flex-col gap-1.5 cursor-pointer hover:border-slate-700 hover:bg-slate-900/60 transition-all active:scale-95"
            >
              <div className="text-xl">{item.emoji}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.sub}</p>
              <p className="text-xs font-bold text-white capitalize">{item.label}</p>
            </div>
          ))}
        </motion.div>

      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
