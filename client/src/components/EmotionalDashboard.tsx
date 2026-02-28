import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Heart,
  Zap,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Mic,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
  BarChart3,
  FileText,
  MessageSquare,
  Users,
  Pill,
  Target,
  Shield,
  Share2,
  Settings,
  Music,
  Radio
} from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import type { Assessment, TreatmentPlan } from "@shared/schema";
import { RecommendedActivities } from "@/components/dashboard/RecommendedActivities";

interface EmotionalBlueprint {
  id: string;
  date: string;
  stress_score: number;
  anxiety_score: number;
  mood_score: number;
  energy_level: number;
  sleep_quality: number;
  detected_emotions: string[];
  insights: string[];
  wellness_score: number;
}

interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  total_voice_entries: number;
  level: number;
}

export default function EmotionalDashboard() {
  const [, setLocation] = useLocation();
  const [blueprint, setBlueprint] = useState<EmotionalBlueprint | null>(null);
  const [history, setHistory] = useState<EmotionalBlueprint[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: userSeason } = useQuery<{ title: string, description: string }>({
    queryKey: ["/api/dashboard/season"],
    staleTime: 1000 * 60 * 60,
  });

  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: treatmentPlans = [] } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans"],
  });

  const recentAssessment = assessments[0];
  const activePlan = treatmentPlans.find((plan) => plan.status === 'active');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [blueprintRes, historyRes, statsRes] = await Promise.all([
        fetch('/api/blueprint/current', { credentials: 'include' }),
        fetch('/api/blueprint/history?limit=7', { credentials: 'include' }),
        fetch('/api/stats/user', { credentials: 'include' })
      ]);

      if (blueprintRes.ok) {
        const data = await blueprintRes.json();
        setBlueprint(data.blueprint);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.blueprints || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, inverse = false) => {
    const effectiveScore = inverse ? 100 - score : score;
    if (effectiveScore >= 70) return 'text-emerald-600';
    if (effectiveScore >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getProgressColor = (score: number, inverse = false) => {
    const effectiveScore = inverse ? 100 - score : score;
    if (effectiveScore >= 70) return 'bg-emerald-500';
    if (effectiveScore >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your emotional blueprint...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Hello, Traveler.</h1>
            <p className="text-lg text-slate-500 font-medium">Here is your emotional landscape for today.</p>
          </div>
          <Button
            onClick={() => setLocation('/voice-journal')}
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-bold shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1"
          >
            <Mic className="mr-2 h-5 w-5" /> Check In
          </Button>
        </div>

        {/* Highlight Section: Blueprint */}
        {blueprint ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Score Card */}
            <Card className="col-span-1 lg:col-span-2 bg-slate-50 border-none shadow-sm rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="h-64 w-64 text-orange-500" />
              </div>
              <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="relative shrink-0">
                  {/* Ring Chart CSS would go here, effectively just a circle for now */}
                  <div className="w-48 h-48 rounded-full border-8 border-white bg-white shadow-xl flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="text-center z-10">
                      <div className={`text-6xl font-black ${getScoreColor(blueprint.wellness_score)}`}>
                        {blueprint.wellness_score}
                      </div>
                      <div className="text-slate-400 font-bold text-sm uppercase tracking-wider mt-1">Wellness</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Today's Emotional Blueprint</h2>
                    <p className="text-slate-500 font-medium">
                      {new Date(blueprint.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {blueprint.detected_emotions && blueprint.detected_emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {blueprint.detected_emotions.map((emotion, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-white text-slate-700 font-bold rounded-full text-sm shadow-sm border border-slate-100 capitalize"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}

                  {blueprint.insights && blueprint.insights.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                      <div className="flex items-center gap-2 mb-2 text-violet-600 font-bold text-sm uppercase tracking-wider">
                        <Sparkles className="h-4 w-4" /> AI Insight
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {blueprint.insights[0]}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Column */}
            <div className="space-y-4">
              <Card className="bg-white border-slate-100 shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 font-bold text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Mood</span>
                  <span className={`font-black ${getScoreColor(blueprint.mood_score)}`}>{blueprint.mood_score}%</span>
                </div>
                <Progress value={blueprint.mood_score} className="h-3 bg-slate-100" indicatorClassName={getProgressColor(blueprint.mood_score)} />
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 font-bold text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Energy</span>
                  <span className={`font-black ${getScoreColor(blueprint.energy_level)}`}>{blueprint.energy_level}%</span>
                </div>
                <Progress value={blueprint.energy_level} className="h-3 bg-slate-100" indicatorClassName={getProgressColor(blueprint.energy_level)} />
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 font-bold text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-slate-500" /> Stress</span>
                  <span className={`font-black ${getScoreColor(blueprint.stress_score, true)}`}>{blueprint.stress_score}%</span>
                </div>
                <Progress value={blueprint.stress_score} className="h-3 bg-slate-100" indicatorClassName={getProgressColor(blueprint.stress_score, true)} />
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 font-bold text-sm flex items-center gap-2"><Moon className="h-4 w-4 text-violet-500" /> Anxiety</span>
                  <span className={`font-black ${getScoreColor(blueprint.anxiety_score, true)}`}>{blueprint.anxiety_score}%</span>
                </div>
                <Progress value={blueprint.anxiety_score} className="h-3 bg-slate-100" indicatorClassName={getProgressColor(blueprint.anxiety_score, true)} />
              </Card>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="h-10 w-10 text-orange-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Start Your Journey</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">
              Your dashboard is waiting. Record your first voice journal entry to generate your personalized emotional blueprint.
            </p>
            <Button
              onClick={() => setLocation('/voice-journal')}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-10 py-6 text-lg font-bold"
            >
              Record Entry
            </Button>
          </div>
        )}


        {/* Personalized Recommendations */}
        <div className="bg-white border-slate-100 shadow-sm rounded-[2rem] p-8 overflow-hidden">
          <RecommendedActivities recentAssessment={recentAssessment} activePlan={activePlan} />
        </div>

        {/* AI Season Strip (Compassionate Tracking instead of Gamification) */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 shadow-sm rounded-[2rem] p-8 text-center md:text-left flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-sm uppercase tracking-wider justify-center md:justify-start">
              <Sparkles className="h-4 w-4" /> Current Journey
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">
              {userSeason?.title || "Season of Discovery"}
            </h3>
            <p className="text-slate-600 font-medium text-lg leading-relaxed max-w-2xl">
              {userSeason?.description || "Every step forward is worth acknowledging. You are doing beautifully."}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Heart className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: "Voice Journal", icon: Mic, path: '/voice-journal', color: 'text-violet-500', bg: 'bg-violet-50', hover: 'hover:border-violet-200' },
              { label: "Activities", icon: Activity, path: '/activities', color: 'text-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-200' },
              { label: "Sleep", icon: Moon, path: '/sleep', color: 'text-indigo-500', bg: 'bg-indigo-50', hover: 'hover:border-indigo-200' },
              { label: "Check-In", icon: Brain, path: '/assessment', color: 'text-emerald-500', bg: 'bg-emerald-50', hover: 'hover:border-emerald-200' },
              { label: "Goals", icon: Target, path: '/goals', color: 'text-rose-500', bg: 'bg-rose-50', hover: 'hover:border-rose-200' },
              { label: "Community", icon: Users, path: '/community', color: 'text-amber-500', bg: 'bg-amber-50', hover: 'hover:border-amber-200' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => setLocation(action.path)}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all ${action.hover} hover:-translate-y-1 hover:shadow-md group`}
              >
                <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <span className="font-bold text-slate-600 text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent History Graph */}
        {history.length > 1 && (
          <Card className="bg-white border-slate-100 shadow-sm rounded-[2rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-400" /> 7-Day Trend
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {history.slice(0, 7).reverse().map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                  <div className="relative w-full aspect-[2/3] bg-slate-50 rounded-2xl overflow-hidden flex items-end justify-center pb-2">
                    <div
                      className={`w-full mx-2 rounded-t-xl transition-all group-hover:opacity-80 ${day.wellness_score >= 70 ? 'bg-emerald-400' :
                        day.wellness_score >= 40 ? 'bg-amber-400' :
                          'bg-rose-400'
                        }`}
                      style={{ height: `${day.wellness_score}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-sm font-black text-slate-700">{day.wellness_score}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
