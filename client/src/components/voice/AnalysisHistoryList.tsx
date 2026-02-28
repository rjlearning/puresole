import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

interface EmotionScores {
  [emotion: string]: number;
}

interface VoiceAnalysis {
  id: string;
  created_at: string;
  primary_emotion: string;
  emotion_scores: EmotionScores;
  wellness_score: number;
  risk_level: string;
  valence: number;
  arousal: number;
  dominance: number;
  transcript?: string;
  duration_seconds?: number;
}

interface AnalysisHistoryListProps {
  analyses: VoiceAnalysis[];
  isDark?: boolean;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getWellnessColorClass = (score: number, isDark?: boolean): string => {
  if (isDark) {
    if (score >= 81) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (score >= 61) return 'bg-lime-500/10 text-lime-400 border border-lime-500/20';
    if (score >= 41) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (score >= 26) return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  }
  if (score >= 81) return 'bg-green-100 text-green-800';
  if (score >= 61) return 'bg-lime-100 text-lime-800';
  if (score >= 41) return 'bg-yellow-100 text-yellow-800';
  if (score >= 26) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getRiskVariant = (riskLevel: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (riskLevel.toLowerCase()) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'default';
  }
};

const Metric = ({ label, value, isDark }: { label: string; value: string; isDark?: boolean }) => (
  <div className="flex flex-col">
    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-500'} mb-1`}>{label}</span>
    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-tighter`}>{value}</span>
  </div>
);

export default function AnalysisHistoryList({ analyses, isDark }: AnalysisHistoryListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!analyses || analyses.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        No voice analyses yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis, idx) => (
        <motion.div
          key={analysis.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white shadow-sm hover:shadow-md'} rounded-3xl transition-all overflow-hidden`}
        >
          <button
            onClick={() => setExpanded(expanded === analysis.id ? null : analysis.id)}
            className="w-full text-left p-6 flex items-center justify-between"
          >
            {/* Collapsed View */}
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {formatDate(analysis.created_at)}
              </p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} capitalize mt-1.5 text-lg tracking-tight`}>
                {analysis.primary_emotion || 'Neutral'}
              </p>
            </div>

            <div className="flex items-center gap-4 ml-4">
              <Badge className={getWellnessColorClass(Number(analysis.wellness_score || 0), isDark)}>
                {Number(analysis.wellness_score || 0).toFixed(0)}/100
              </Badge>
              <div className="hidden sm:block">
                <Badge variant={getRiskVariant(analysis.risk_level || 'low')} className="uppercase text-[10px] tracking-widest px-3 py-1 font-black">
                  {analysis.risk_level || 'low'}
                </Badge>
              </div>
              <motion.div
                animate={{ rotate: expanded === analysis.id ? 180 : 0 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-gray-400'}`} />
              </motion.div>
            </div>
          </button>

          {/* Expanded Details */}
          {expanded === analysis.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25 }}
              className={`px-6 pb-6 ${isDark ? 'border-t border-white/5' : 'border-t border-gray-100'}`}
            >
              <div className="pt-6">
                {/* VAD Metrics */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <Metric
                    label="Valence"
                    value={Number(analysis.valence || 0).toFixed(2)}
                    isDark={isDark}
                  />
                  <Metric
                    label="Arousal"
                    value={Number(analysis.arousal || 0).toFixed(2)}
                    isDark={isDark}
                  />
                  <Metric
                    label="Dominance"
                    value={Number(analysis.dominance || 0).toFixed(2)}
                    isDark={isDark}
                  />
                </div>

                {/* Duration if available */}
                {analysis.duration_seconds && (
                  <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-500'} mb-1`}>Duration</p>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} font-medium`}>
                      {Math.round(Number(analysis.duration_seconds) / 60)} min {Number(analysis.duration_seconds) % 60} sec
                    </p>
                  </div>
                )}

                {/* Detected Emotions */}
                <div>
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Vocal Spectrum Analysis</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(
                      typeof analysis.emotion_scores === 'string'
                        ? JSON.parse(analysis.emotion_scores)
                        : (analysis.emotion_scores || {})
                    )
                      .sort(([, a], [, b]) => Number(b) - Number(a))
                      .slice(0, 6)
                      .map(([emotion, score]) => (
                        <span
                          key={emotion}
                          className={`px-4 py-2 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-purple-50 text-purple-700 border border-purple-100'} rounded-xl text-[11px] font-black uppercase tracking-widest`}
                        >
                          {emotion}: {(Number(score) * 100).toFixed(0)}%
                        </span>
                      ))}
                  </div>
                </div>

                {/* Transcript */}
                {analysis.transcript && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Voice-to-Text Transcript</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400 font-medium' : 'text-gray-600'} italic ${isDark ? 'bg-white/5' : 'bg-gray-50'} p-5 rounded-2xl leading-relaxed`}>
                      "{analysis.transcript}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
