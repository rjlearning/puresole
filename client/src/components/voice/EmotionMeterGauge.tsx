import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface EmotionMeterGaugeProps {
  primaryEmotion: string;
  emotionScores: Record<string, number>;
  confidence: number;
  valence: number;
  arousal: number;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',      // green
  sad: '#3b82f6',        // blue
  anxious: '#f59e0b',    // orange
  stressed: '#dc2626',   // red
  calm: '#6366f1',       // indigo
  angry: '#ef4444',      // dark red
  fearful: '#a855f7',    // purple
  surprised: '#f97316',  // orange
  neutral: '#6b7280',    // gray
  excited: '#ec4899',    // pink
  tired: '#8b5cf6'       // violet
};

export function EmotionMeterGauge({
  primaryEmotion,
  emotionScores,
  confidence,
  valence,
  arousal
}: EmotionMeterGaugeProps) {
  const [angle, setAngle] = useState(0);

  // Calculate gauge needle angle based on valence and arousal
  useEffect(() => {
    // Map valence (-1 to 1) and arousal (0 to 1) to gauge angle (0 to 360)
    // Valence controls horizontal position, arousal controls intensity
    const valenceDegrees = ((valence + 1) / 2) * 180; // -1 to 1 → 0 to 180
    const arousalOffset = arousal * 90; // 0 to 1 → 0 to 90

    const targetAngle = valenceDegrees + arousalOffset;
    setAngle(targetAngle);
  }, [valence, arousal]);

  const emotionColor = EMOTION_COLORS[primaryEmotion] || EMOTION_COLORS.neutral;

  // Get top 3 emotions for display
  const topEmotions = Object.entries(emotionScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="flex flex-col items-center">
      {/* Circular Gauge */}
      <div className="relative w-64 h-64">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Outer ring - emotional spectrum */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />

          {/* Colored arc based on current emotion */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={emotionColor}
            strokeWidth="8"
            strokeDasharray={`${confidence * 251.2} 251.2`}
            initial={{ strokeDasharray: '0 251.2' }}
            animate={{ strokeDasharray: `${confidence * 251.2} 251.2` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />

          {/* Center circle */}
          <circle cx="50" cy="50" r="30" fill="#f9fafb" />

          {/* Needle */}
          <motion.line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke={emotionColor}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: angle }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ transformOrigin: '50% 50%' }}
          />

          {/* Needle dot */}
          <circle cx="50" cy="50" r="3" fill={emotionColor} />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={primaryEmotion}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-2xl font-bold capitalize" style={{ color: emotionColor }}>
              {primaryEmotion}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(confidence * 100).toFixed(0)}% confident
            </p>
          </motion.div>
        </div>
      </div>

      {/* Valence & Arousal indicators */}
      <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Valence</p>
          <div className="flex items-center mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: valence >= 0 ? '#10b981' : '#ef4444',
                  width: `${Math.abs(valence) * 100}%`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.abs(valence) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="ml-2 text-sm font-semibold" style={{ color: valence >= 0 ? '#10b981' : '#ef4444' }}>
              {valence >= 0 ? '+' : ''}{valence.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Arousal</p>
          <div className="flex items-center mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${arousal * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${arousal * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="ml-2 text-sm font-semibold text-purple-600">
              {arousal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Top emotions list */}
      <div className="mt-4 w-full max-w-xs">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Detected Emotions</p>
        <div className="space-y-2">
          {topEmotions.map(([emotion, score]) => (
            <div key={emotion} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                />
                <span className="text-sm capitalize">{emotion}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {(score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
