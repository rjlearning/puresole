import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Heart, Compass, Zap, MessageSquare,
  ArrowRight, ShieldCheck, Activity, Star, Mic
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WellnessHalo } from "@/components/voice/WellnessHalo";
import type { Assessment, TreatmentPlan } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [pulseIndex, setPulseIndex] = useState(0);

  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: treatmentPlans = [] } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans"],
    retry: false,
  });

  const { data: voiceEntriesData } = useQuery<{ entries: any[] }>({
    queryKey: ["/api/voice-entries"],
    retry: false,
  });
  const latestVoiceEntry = voiceEntriesData?.entries?.[0];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Session Expired", description: "Redirecting...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-indigo-50 rounded-full" />
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  const recentAssessment = assessments[0];
  const activePlan = treatmentPlans.find((p) => p.status === 'active');

  // ── Orbit Actions ────────────────────────────────────────────────────────────
  const orbs = [
    { label: "Reflect", path: "/assessment", icon: Heart, delay: 0.1, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Sync", path: "/dashboard", icon: Zap, delay: 0.2, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Hub", path: "/women", icon: Star, delay: 0.3, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Journal", path: "/voice-journal", icon: MessageSquare, delay: 0.4, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-white mesh-bg flex flex-col pt-20 sm:pt-0" data-testid="home-page">

      {/* ── Top Bar ── */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-800">PureSoul</span>
        </div>
        <Link href="/settings">
          <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-white flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" />
          </button>
        </Link>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">

        {/* ── Cinematic Entrance ── */}
        <div className="text-center mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative mb-8 sm:mb-12"
          >
            <div className="scale-75 sm:scale-100">
              <WellnessHalo stage="general" energyLevel={3} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tight leading-none"
          >
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500">{user?.firstName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-slate-400 mt-4"
          >
            Your conscious evolution is in flow
          </motion.p>
        </div>

        {/* ── Feature Orbs (Floating Grid) ── */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-6 gap-4 mb-20 sm:mb-32">
          {orbs.map((orb, i) => (
            <Link key={orb.label} href={orb.path}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: orb.delay, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="flex flex-col items-center gap-3 group px-4 py-2"
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] ${orb.bg} border border-white shadow-xl shadow-indigo-100/20 flex items-center justify-center transition-all group-hover:shadow-indigo-200 group-hover:bg-white`}>
                  <orb.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${orb.color}`} />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">
                  {orb.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* ── Pulse Feed (Recent Insights) ── */}
        <AnimatePresence mode="wait">
          <div className="w-full max-w-lg space-y-4">
            {recentAssessment && (
              <motion.div
                key="pulse"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1 }}
              >
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 sm:p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-24 h-24 text-indigo-900" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Latest Pulse</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300">
                        {new Date(recentAssessment.createdAt || "").toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-lg sm:text-xl font-bold text-slate-800 leading-[1.4] line-clamp-3 italic">
                      "{recentAssessment.aiAnalysis?.substring(0, 120)}..."
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-2">
                      <div className="flex gap-2">
                        <div className="px-3 py-1 bg-rose-50 rounded-full text-[9px] font-black text-rose-500 uppercase tracking-widest">
                          {recentAssessment.severity.replace('_', ' ')}
                        </div>
                      </div>
                      <Link href="/dashboard">
                        <button className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                          Full Journey <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {latestVoiceEntry && (
              <motion.div
                key="voice-pulse"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 1 }}
              >
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-10 rounded-[3rem] shadow-2xl group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <MessageSquare className="w-24 h-24 text-white" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Vocal Pulse</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {new Date(latestVoiceEntry.recordedAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Emotion Detected</p>
                        <p className="text-xl font-bold text-white capitalize font-serif italic">
                          {latestVoiceEntry.emotionData?.[0]?.label || 'Stable'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-2">
                      <div className="flex gap-2">
                        <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                          {latestVoiceEntry.duration}s Recording
                        </div>
                      </div>
                      <Link href="/voice-journal">
                        <button className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                          View Journal <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>

      </main>

      {/* ── Bottom Safety Bar ── */}
      <div className="p-8 flex justify-center opacity-40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">End-to-End Encrypted Growth</span>
        </div>
      </div>

    </div>
  );
}
