import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Wind,
  Dumbbell,
  Moon,
  Users,
  BookOpen,
  Clock
} from "lucide-react";

interface AnalysisResult {
  emotions: string[];
  dominant: string;
  intensity: number;
  stressLevel: number;
  anxietyLevel: number;
  moodScore: number;
  energyLevel: number;
  reasoning: string;
  insights: string[];
  activities?: ActivityRecommendation[];
  mentalStatus?: MentalStatus;
  transcript?: string;
}

interface ActivityRecommendation {
  type: 'breathwork' | 'exercise' | 'meditation' | 'journaling' | 'social' | 'rest';
  title: string;
  description: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface MentalStatus {
  overall: 'excellent' | 'good' | 'fair' | 'concerning';
  strengths: string[];
  challenges: string[];
  riskFactors: string[];
  improvements: string[];
}

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'breathwork': return <Wind className="w-5 h-5" />;
      case 'exercise': return <Dumbbell className="w-5 h-5" />;
      case 'meditation': return <Brain className="w-5 h-5" />;
      case 'journaling': return <BookOpen className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      case 'rest': return <Moon className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-yellow-500 to-orange-400';
      case 'low': return 'from-blue-500 to-cyan-400';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getStatusColor = (overall: string) => {
    switch (overall) {
      case 'excellent': return 'from-green-500 to-emerald-500';
      case 'good': return 'from-cyan-500 to-blue-500';
      case 'fair': return 'from-yellow-500 to-orange-400';
      case 'concerning': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Mental Status Overview */}
      {analysis.mentalStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-400" />
              Mental Status Assessment
            </h3>
            <Badge className={`bg-gradient-to-r ${getStatusColor(analysis.mentalStatus.overall)} text-white px-4 py-1`}>
              {analysis.mentalStatus.overall.toUpperCase()}
            </Badge>
          </div>

          {analysis.mentalStatus.riskFactors.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-200 font-medium mb-2">Important Notice:</p>
                  <ul className="space-y-1 text-sm text-red-300">
                    {analysis.mentalStatus.riskFactors.map((factor, i) => (
                      <li key={i}>• {factor}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-400 mt-3">
                    If you're experiencing a crisis, please contact a mental health professional or call 988 (Suicide & Crisis Lifeline).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.mentalStatus.strengths.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/10">
                <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-1 text-sm text-green-200">
                  {analysis.mentalStatus.strengths.map((strength, i) => (
                    <li key={i}>• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.mentalStatus.challenges.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-500/10">
                <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Challenges
                </h4>
                <ul className="space-y-1 text-sm text-orange-200">
                  {analysis.mentalStatus.challenges.map((challenge, i) => (
                    <li key={i}>• {challenge}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysis.mentalStatus.improvements.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-purple-500/10">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Suggested Improvements
              </h4>
              <ul className="space-y-1 text-sm text-purple-200">
                {analysis.mentalStatus.improvements.map((improvement, i) => (
                  <li key={i}>• {improvement}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Emotional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          Emotional Analysis
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className={`text-3xl font-bold ${getScoreColor(analysis.moodScore)}`}>
              {analysis.moodScore}
            </div>
            <div className="text-sm text-gray-400 mt-1">Mood</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className={`text-3xl font-bold ${getScoreColor(100 - analysis.stressLevel)}`}>
              {100 - analysis.stressLevel}
            </div>
            <div className="text-sm text-gray-400 mt-1">Calm</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className={`text-3xl font-bold ${getScoreColor(analysis.energyLevel)}`}>
              {analysis.energyLevel}
            </div>
            <div className="text-sm text-gray-400 mt-1">Energy</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className={`text-3xl font-bold ${getScoreColor(100 - analysis.anxietyLevel)}`}>
              {100 - analysis.anxietyLevel}
            </div>
            <div className="text-sm text-gray-400 mt-1">Peace</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Detected Emotions</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.emotions.map((emotion, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm text-gray-300">{analysis.reasoning}</p>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          AI Insights
        </h3>
        <ul className="space-y-3">
          {analysis.insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-300">
              <span className="text-yellow-400 mt-1">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Recommended Activities */}
      {analysis.activities && analysis.activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Recommended Activities
          </h3>
          <div className="space-y-4">
            {analysis.activities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getPriorityColor(activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{activity.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            activity.priority === 'high'
                              ? 'border-red-400 text-red-300'
                              : activity.priority === 'medium'
                              ? 'border-yellow-400 text-yellow-300'
                              : 'border-blue-400 text-blue-300'
                          }`}
                        >
                          {activity.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{activity.description}</p>
                      <p className="text-xs text-gray-400 italic">{activity.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{activity.duration}m</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transcript (if available) */}
      {analysis.transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Transcript</h3>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-gray-300 leading-relaxed">{analysis.transcript}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
