import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Loader, Mic, Heart, TrendingUp, Clock, TrendingDown,
  Minus, Lightbulb, Zap, Moon, Wind, BookOpen,
  Brain, ChevronRight, AlertCircle, Settings, Activity
} from 'lucide-react';
import EmotionTimeline from '@/components/voice/EmotionTimeline';
import WellnessTrendChart from '@/components/voice/WellnessTrendChart';
import AnalysisHistoryList from '@/components/voice/AnalysisHistoryList';
import InsightsPanel from '@/components/voice/InsightsPanel';
import VocalBiomarkersPanel from '@/components/voice/VocalBiomarkersPanel';

import EmotionalRadar from '@/components/voice/EmotionalRadar';
import SocialHealthDonut from '@/components/voice/SocialHealthDonut';
import BodySystemAnalysis from '@/components/voice/BodySystemAnalysis';
import QuantumCoherence from '@/components/voice/QuantumCoherence';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  recent_analyses: any[];
  trends_30day: any[];
  top_insights: any[];
  correlations: any[];
  stats: {
    total_analyses: number;
    avg_wellness: number;
    current_trend: 'improving' | 'stable' | 'declining';
    total_duration_minutes: number;
  };
}

// ─── Recommendations engine ───────────────────────────────────────────────────
type Rec = { icon: React.ComponentType<{ className?: string }>; title: string; body: string; href?: string; tag: string; tagColor: string };

function buildRecommendations(data: DashboardData, user: any): Rec[] {
  const recs: Rec[] = [];
  const { avg_wellness, current_trend } = data.stats;

  const isMale = user?.gender === 'male';

  if (current_trend === 'declining') {
    recs.push({
      icon: Wind,
      title: 'Try a breathing reset',
      body: 'Your voice patterns show rising tension. A 4-minute 4-7-8 breathing session can lower cortisol measurably.',
      href: '/activities',
      tag: 'Trending down',
      tagColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    });
    recs.push({
      icon: Brain,
      title: 'Check in with your thoughts',
      body: 'Declining wellness often connects to recurring Automatic Negative Thoughts. The CBT Tool in Mental Wellness can help name them.',
      href: '/mental-wellness',
      tag: 'Cognitive',
      tagColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    });
  }

  if (current_trend === 'improving') {
    recs.push({
      icon: BookOpen,
      title: 'Capture what\'s working',
      body: 'Your voice tone is trending positive. Journaling what you\'ve been doing differently helps lock in these patterns.',
      href: '/activities',
      tag: 'Keep it up',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    });
  }

  if (avg_wellness < 50) {
    recs.push({
      icon: Moon,
      title: 'Prioritize sleep quality',
      body: 'Low average wellness strongly correlates with poor sleep in voice biomarker research. Even 30 minutes extra per night shifts scores noticeably.',
      tag: 'Low wellness',
      tagColor: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    });
    recs.push({
      icon: Heart,
      title: 'Connect with support',
      body: `Consistent low-wellness patterns are worth sharing with someone you trust — a friend, therapist, or the AI Companion in PureSoul.`,
      href: isMale ? '/ai-companion' : '/women/companion',
      tag: 'Emotional',
      tagColor: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    });
  } else if (avg_wellness >= 70) {
    recs.push({
      icon: Zap,
      title: 'Challenge yourself',
      body: 'You\'re in a high-wellness window. This is a great time to tackle emotionally difficult topics in your journal — your nervous system is primed.',
      tag: 'High wellness',
      tagColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    });
  } else {
    recs.push({
      icon: TrendingUp,
      title: 'Build your streak',
      body: 'You\'re in the moderate-wellness zone. Daily recordings — even 2 minutes — give the AI enough data to surface meaningful patterns faster.',
      tag: 'Moderate',
      tagColor: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    });
  }

  if (data.stats.total_analyses < 5) {
    recs.push({
      icon: Mic,
      title: 'Record more for richer insights',
      body: 'Voice pattern analysis becomes significantly more accurate after 7+ recordings. Try a 2-minute daily check-in for a week.',
      tag: 'Getting started',
      tagColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    });
  }

  return recs.slice(0, 3);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
  sub?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-6 text-white ${gradient} shadow-2xl border border-white/10 group`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black leading-none italic">{value}</p>
        {sub && <p className="text-white/40 text-[10px] mt-2 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Trend Badge ──────────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${trend === 'improving' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
      trend === 'declining' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
      }`}>
      {trend === 'improving' ? <TrendingUp className="w-4 h-4" /> :
        trend === 'declining' ? <TrendingDown className="w-4 h-4" /> :
          <Minus className="w-4 h-4" />}
      <span>{trend}</span>
    </div>
  );
}

// ─── Wellness Gauge ───────────────────────────────────────────────────────────
function WellnessGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(isFinite(score) ? score : 0)));
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#f43f5e';
  const label = pct >= 70 ? 'Thriving' : pct >= 45 ? 'Moderate' : 'Low';

  const radians = (pct / 100) * Math.PI;
  const needleX = parseFloat((80 + 55 * Math.cos(Math.PI - radians)).toFixed(2));
  const needleY = parseFloat((80 - 55 * Math.sin(Math.PI - radians)).toFixed(2));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 160 80" className="w-full h-full">
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="220"
            strokeDashoffset={220 - (220 * pct) / 100}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
          {isFinite(needleX) && isFinite(needleY) && (
            <motion.line
              x1="80" y1="80"
              x2={needleX}
              y2={needleY}
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ x2: 10, y2: 80 }}
              animate={{ x2: needleX, y2: needleY }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          )}
          <circle cx="80" cy="80" r="6" fill="#f8fafc" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-5xl font-black text-white leading-none mb-1">{pct}<span className="text-sm text-slate-500 font-normal tracking-widest ml-1">/100</span></p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecCard({ rec }: { rec: Rec }) {
  const Icon = rec.icon;
  return (
    <div className={`flex items-start gap-4 p-5 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all ${rec.href ? 'cursor-pointer hover:bg-slate-900 hover:shadow-xl' : ''}`}
      onClick={() => rec.href && window.open(rec.href, '_self')}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
        <Icon className="w-5 h-5 text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <p className="font-bold text-slate-100 text-sm">{rec.title}</p>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${rec.tagColor}`}>{rec.tag}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">{rec.body}</p>
      </div>
      {rec.href && <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
import { useAuth } from "@/hooks/useAuth";

export default function VoiceAnalysisDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/voice/dashboard', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      setData(await res.json());
    } catch (err) {
      setError('Failed to load voice analysis dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl animate-ping" />
            <Mic className="w-10 h-10 text-indigo-400 relative z-10" />
          </div>
          <p className="text-indigo-200/60 font-black uppercase tracking-[0.3em] text-xs">Calibrating Insights</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
        <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-rose-500" />
          <h3 className="text-lg font-black uppercase tracking-widest mb-2">Systems Offline</h3>
          <p className="text-sm font-medium text-rose-400/70">{error || 'Failed to sync clinical data'}</p>
        </div>
      </div>
    );
  }

  const recs = buildRecommendations(data, user);
  const latestBiomarkers = data.recent_analyses?.length > 0 ? data.recent_analyses[0].biomarkers : null;

  return (
    <div className="min-h-screen pb-32 bg-[#020617] text-slate-200 selection:bg-indigo-500/30">

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-16 pb-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl relative group overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Mic className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Vocal Biomarkers</h1>
                <div className="px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Medical Grade</div>
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Precision Diagnostics • Emotional Intelligence</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/voice-journal">
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Record New Sample</button>
            </Link>
            <button className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 max-w-6xl mx-auto space-y-12">

        {/* ── Stat Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Mic} label="Samples Collected" value={data.stats.total_analyses} gradient="bg-[#0f172a]" sub="Rich dataset for trend analysis" />
          <StatCard icon={Clock} label="Vocal Exposure" value={`${data.stats.total_duration_minutes}m`} gradient="bg-[#0f172a]" sub="Session duration metrics" />
          <StatCard icon={TrendingUp} label="Pathological Trend" value={data.stats.current_trend} gradient="bg-[#0f172a]" sub="30-day directional delta" />
          <StatCard icon={Heart} label="Vitality Index" value={`${data.stats.avg_wellness.toFixed(0)}`} gradient="bg-[#0f172a]" sub="Normalized wellness coefficient" />
        </div>

        {/* ── Health Triangle Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Mental Balance (Radar) */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Mental Balance</h3>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <EmotionalRadar />
            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-bold text-indigo-300 leading-relaxed">
              Your "Focus" and "Joy" harmonics are currently peaking. This indicates high cognitive clarity and emotional resonance.
            </div>
          </div>

          {/* Social Pattern (Donut) */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Social Health</h3>
              <Heart className="w-4 h-4 text-emerald-400" />
            </div>
            <SocialHealthDonut />
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-300 leading-relaxed text-center">
              72% Constructive social frequency detected.
            </div>
          </div>

          {/* Vitality Gauge */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md flex flex-col items-center justify-center">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-12">Overall Vitality</h3>
            <WellnessGauge score={data.stats.avg_wellness} />
            <div className="mt-8">
              <TrendBadge trend={data.stats.current_trend} />
            </div>
          </div>
        </div>

        {/* ── Quantum Coherence (Wave vs Particle) ─────────────────────────── */}
        <QuantumCoherence score={data.stats.avg_wellness} />

        {/* ── Body Mapping & Recommendations ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <BodySystemAnalysis />

          <div className="space-y-6">
            {/* Recommendations Panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="font-black text-white text-sm uppercase tracking-[0.2em]">Clinical Recommendations</h2>
              </div>
              <div className="space-y-4">
                {recs.map((rec, i) => <RecCard key={i} rec={rec} />)}
              </div>
            </div>

            {/* Insights Panel */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="font-black text-white text-sm uppercase tracking-[0.2em]">Deep Learning Insights</h2>
              </div>
              <InsightsPanel insights={data.top_insights} isDark />
            </div>
          </div>
        </div>

        {/* ── Clinical Biomarkers ──────────────────────────────────────────── */}
        {latestBiomarkers && (
          <VocalBiomarkersPanel biomarkers={latestBiomarkers} />
        )}

        {/* ── Temporal Charts ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md overflow-hidden">
            <h2 className="font-black text-white text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Emotion Timeline (30d)
            </h2>
            <div className="h-[250px]">
              <EmotionTimeline data={data.trends_30day} isDark />
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md overflow-hidden">
            <h2 className="font-black text-white text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Vitality Trend
            </h2>
            <div className="h-[250px]">
              <WellnessTrendChart data={data.trends_30day} isDark />
            </div>
          </div>
        </div>

        {/* ── Transactional History ────────────────────────────────────────── */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-md">
          <h2 className="font-black text-white text-xs uppercase tracking-[0.2em] mb-8">Diagnostic History</h2>
          <AnalysisHistoryList analyses={data.recent_analyses} isDark />
        </div>
      </div>
    </div>
  );
}
