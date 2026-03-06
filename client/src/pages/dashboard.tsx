import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { FeedbackModal } from "@/components/FeedbackModal";
import { motion } from "framer-motion";
import { Mic, Activity, Heart, MessageSquare, Crown, Zap, ArrowRight, Compass, Calendar, Target } from "lucide-react";
import { WellnessHalo } from "@/components/voice/WellnessHalo";
import ProgressChart from "@/components/dashboard/progress-chart";

export default function FeedDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: voiceData } = useQuery<{ entries: any[] }>({ queryKey: ["/api/voice-entries"], retry: false });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"], retry: false });
  const { data: treatmentPlans = [] } = useQuery<any[]>({ queryKey: ["/api/treatment-plans"], retry: false });
  const { data: progressData = [] } = useQuery<any[]>({ queryKey: ["/api/progress/user"], retry: false });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"], enabled: isAuthenticated, retry: false });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Session Expired", description: "Redirecting...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const latestVoice = voiceData?.entries?.[0];
  const emotion = latestVoice?.emotionData?.[0]?.label || "Stable";
  const recentAssessment = assessments[0];
  const activePlan = treatmentPlans.find((p: any) => p.status === 'active');

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24" data-testid="dashboard-feed">
      {/* ── Fixed Header ── */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">My Feed</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Focus: {activePlan?.title || "Exploring"}</p>
            </div>
          </div>
          <button onClick={() => setFeedbackOpen(true)} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700">
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">

        {/* ── CARD 1: Quick Voice Journal (Instagram Story Style) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 rounded-[2.5rem] blur opacity-20" />
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/voice-journal')}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Mic className="w-32 h-32 text-white" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Record Audio Journal</h2>
                <p className="text-xs text-slate-400 mt-1">AI will analyze your vocal biomarkers & emotions.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── CARD 2: Daily Vibe Check (Insight Stream) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-6 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Current Vibe</span>
              </div>
              {latestVoice && <span className="text-[10px] text-slate-500 font-bold">{new Date(latestVoice.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="scale-75 mb-[-2rem]">
                <WellnessHalo stage="balance" energyLevel={3} />
              </div>
              <h3 className="text-3xl font-black text-white capitalize italic">"{emotion}"</h3>
              <p className="text-xs text-slate-400 mt-2 text-center">Based on your latest voice snapshot</p>
            </div>
          </div>
        </motion.div>

        {/* ── CARD 3: Recent Assessment Insight ── */}
        {recentAssessment && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{recentAssessment.type.replace('_', ' ')} Insight</p>
                  <p className="text-[10px] text-slate-600">{new Date(recentAssessment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4 py-1">
                "{recentAssessment.aiAnalysis?.substring(0, 200)}..."
              </p>
              <Link href="/assessment">
                <button className="mt-4 text-xs font-bold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
                  Take new assessment <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── CARD 4: Recommended Activity Actions ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
          <Link href="/activities">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] hover:bg-slate-800/50 transition-colors cursor-pointer group">
              <Activity className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-black text-white mb-1">Activities</h4>
              <p className="text-[10px] text-slate-500">Mindful exercises</p>
            </div>
          </Link>
          <Link href="/treatment-plan">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] hover:bg-slate-800/50 transition-colors cursor-pointer group">
              <Compass className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-black text-white mb-1">Journey Plan</h4>
              <p className="text-[10px] text-slate-500">Your custom path</p>
            </div>
          </Link>
        </motion.div>

        {/* ── CARD 5: Progress Mini-Chart ── */}
        {progressData && progressData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
               <div className="flex flex-col">
                 <span className="text-sm font-black text-white">Activity Pulse</span>
                 <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Last 7 Days</span>
               </div>
               <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div className="h-[120px] -mx-2">
              <ProgressChart data={progressData} />
            </div>
          </motion.div>
        )}

      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
