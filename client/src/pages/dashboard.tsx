import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Wind, Heart, Activity, Compass, ArrowRight, MessageSquare, Zap, Mic } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";

export default function OneTapDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [interactionState, setInteractionState] = useState<'prompt' | 'processing' | 'reward'>('prompt');
  const [insightText, setInsightText] = useState("");

  const { data: assessments = [], isLoading: assessLoading } = useQuery<any[]>({ queryKey: ["/api/assessments"], retry: false });
  const recentAssessment = assessments[0];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    } else if (isAuthenticated && !assessLoading && assessments.length === 0) {
      setLocation('/onboarding');
    }
  }, [isAuthenticated, isLoading, assessLoading, assessments.length, setLocation]);

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  const handleOrbRelease = () => {
    if (interactionState !== 'prompt') return;
    setInteractionState('processing');

    // Simulate AI processing the micro-interaction and generating a reward
    setTimeout(() => {
      if (sliderValue > 70) {
        setInsightText("High energy today! Let's channel that momentum into a focused productivity burst.");
      } else if (sliderValue < 30) {
        setInsightText("I sense your energy is low. Let's start with a gentle 60-second reset.");
      } else {
        setInsightText("You're feeling balanced. A quick mindfulness check-in will help maintain this state.");
      }
      setInteractionState('reward');
    }, 1500);
  };

  // Dynamic colors based on slider interaction
  const getOrbColor = () => {
    if (sliderValue > 70) return "from-amber-400 to-rose-500";
    if (sliderValue < 30) return "from-blue-500 to-indigo-600";
    return "from-emerald-400 to-teal-500";
  };

  const getBlurIntensity = () => {
    return 20 + Math.abs(sliderValue - 50);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 relative overflow-x-hidden" data-testid="onetap-dashboard">

      {/* ── Fixed Header ── */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 p-[2px]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="font-black text-white text-sm">P</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none tracking-tight">PureSoul</h1>
            </div>
          </div>
          <button onClick={() => setFeedbackOpen(true)} className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-700">
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        {/* ── BONUS TOOL: VOICE ANALYZER ── */}
        <div className="pt-2">
          <Link href="/voice-analyzer">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900/40 border border-slate-800/80 p-5 rounded-[2rem] hover:border-indigo-500/50 transition-colors cursor-pointer group flex items-center justify-between overflow-hidden relative">

              {/* Audio wave aesthetic */}
              <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-full h-full flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-1 bg-indigo-400 rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                  <Mic className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">Vocal Biomarkers</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Bonus Assessment</p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center relative z-10 group-hover:bg-white text-slate-500 group-hover:text-slate-900 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-8 space-y-8">

        {/* ── THE DAILY ORBIT (Micro-Interaction) ── */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">

          <AnimatePresence mode="wait">

            {/* STATE 1: Prompt */}
            {interactionState === 'prompt' && (
              <motion.div key="prompt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center w-full">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Daily Pulse
                </span>

                <h2 className="text-2xl font-light text-center leading-tight mb-12 px-4 shadow-sm">
                  How is your <span className="font-semibold text-white">energy level</span> feeling right now?
                </h2>

                {/* Interactive Slider Orb Area */}
                <div className="relative w-full px-8 py-10 flex flex-col items-center">
                  <div className="absolute w-[2px] h-full bg-slate-800 rounded-full top-0" />

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    onMouseUp={handleOrbRelease}
                    onTouchEnd={handleOrbRelease}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                    style={{ writingMode: 'vertical-rl' } as any} // Makes the range slider vertical natively in some browsers, but we map visual
                  />

                  {/* Visual Orb */}
                  <motion.div
                    animate={{
                      y: -((sliderValue - 50) * 1.5), // Maps 0-100 to vertical movement
                      scale: 1 + (Math.abs(sliderValue - 50) / 100) * 0.2,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`nav-orb relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr ${getOrbColor()} shadow-2xl flex items-center justify-center`}
                    style={{
                      boxShadow: `0 0 ${getBlurIntensity()}px ${getBlurIntensity() / 2}px rgba(99, 102, 241, 0.4)`
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                </div>

                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-8">Drag to answer</p>
              </motion.div>
            )}

            {/* STATE 2: Processing */}
            {interactionState === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr ${getOrbColor()} blur-xl opacity-60 absolute`}
                />
                <Brain className="w-10 h-10 text-white relative z-10 animate-pulse" />
                <p className="mt-6 text-sm font-medium text-slate-300 tracking-wide uppercase">Connecting patterns...</p>
              </motion.div>
            )}

            {/* STATE 3: Reward Output */}
            {interactionState === 'reward' && (
              <motion.div key="reward" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center w-full px-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${getOrbColor()} flex items-center justify-center mb-6 shadow-xl`}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-xl font-medium text-white leading-relaxed mb-8 italic">
                  "{insightText}"
                </p>
                <button onClick={() => setLocation('/activities?recommended=true')} className="w-full max-w-[200px] py-4 rounded-full bg-white text-slate-950 font-black text-sm tracking-wide hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2">
                  <Wind className="w-4 h-4" /> Start Exercise
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>


        {recentAssessment && (
          <div className="bg-slate-900/40 border border-rose-500/10 p-5 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors" onClick={() => setLocation('/assessment')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Assessment</p>
                <p className="text-sm font-medium text-slate-300 mt-0.5 capitalize">{recentAssessment.severity.replace('_', ' ')} Status</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </div>
        )}

      </div>
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
