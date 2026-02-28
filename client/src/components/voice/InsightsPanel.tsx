import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Trophy,
  AlertTriangle
} from 'lucide-react';

interface VoiceInsight {
  id: string;
  type: 'positive' | 'alert' | 'suggestion' | 'achievement' | 'warning';
  title: string;
  description: string;
  priority: number;
  confidence: number;
  recommendations?: string[];
}

interface InsightsPanelProps {
  insights: VoiceInsight[];
  isDark?: boolean;
}

const getInsightColorClass = (type: string, isDark?: boolean): string => {
  if (isDark) {
    switch (type) {
      case 'positive': return 'bg-emerald-500/10 border border-emerald-500/20';
      case 'alert': return 'bg-rose-500/10 border border-rose-500/20';
      case 'suggestion': return 'bg-blue-500/10 border border-blue-500/20';
      case 'achievement': return 'bg-violet-500/10 border border-violet-500/20';
      case 'warning': return 'bg-orange-500/10 border border-orange-500/20';
      default: return 'bg-slate-500/10 border border-slate-500/20';
    }
  }
  switch (type) {
    case 'positive':
      return 'bg-green-50 border border-green-200';
    case 'alert':
      return 'bg-red-50 border border-red-200';
    case 'suggestion':
      return 'bg-blue-50 border border-blue-200';
    case 'achievement':
      return 'bg-purple-50 border border-purple-200';
    case 'warning':
      return 'bg-orange-50 border border-orange-200';
    default:
      return 'bg-gray-50 border border-gray-200';
  }
};

const getInsightIcon = (type: string, isDark?: boolean) => {
  const iconProps = { className: 'w-5 h-5' };
  const colorClass = isDark ? '' : ''; // logic handled by icon variant or inline color

  switch (type) {
    case 'positive':
      return <TrendingUp {...iconProps} className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-green-600'}`} />;
    case 'alert':
      return <AlertCircle {...iconProps} className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-red-600'}`} />;
    case 'suggestion':
      return <Lightbulb {...iconProps} className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />;
    case 'achievement':
      return <Trophy {...iconProps} className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-purple-600'}`} />;
    case 'warning':
      return <AlertTriangle {...iconProps} className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />;
    default:
      return <Lightbulb {...iconProps} className={isDark ? 'text-slate-400' : 'text-gray-400'} />;
  }
};

export default function InsightsPanel({ insights, isDark }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        No insights available yet. Continue recording voice entries to get personalized insights.
      </div>
    );
  }

  // Sort by priority (higher priority first)
  const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-4">
      {sortedInsights.map((insight, idx) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`p-5 rounded-3xl ${getInsightColorClass(insight.type, isDark)} backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Icon and Content */}
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 mt-1 p-2 bg-white/5 rounded-xl border border-white/10">
                {getInsightIcon(insight.type, isDark)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-sm md:text-base tracking-tight`}>
                  {insight.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-700'} mt-1.5 leading-relaxed font-medium`}>
                  {insight.description}
                </p>

                {/* Recommendations */}
                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className={`text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-gray-600'} uppercase tracking-[0.2em] mb-3`}>
                      Clinical Recommendations
                    </p>
                    <ul className="space-y-2">
                      {insight.recommendations.map((rec, i) => (
                        <li key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-700'} flex items-start gap-3 group`}>
                          <span className={`${isDark ? 'text-indigo-400' : 'text-blue-500'} flex-shrink-0 mt-0.5 font-black transition-transform group-hover:translate-x-1`}>→</span>
                          <span className="font-medium tracking-tight">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Confidence Badge */}
            <div className="flex-shrink-0">
              <Badge
                variant="outline"
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white'}`}
              >
                {(insight.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
