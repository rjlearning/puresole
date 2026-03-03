import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface EmotionUpdate {
  timestamp: number;
  primary_emotion: string;
  emotion_scores: Record<string, number>;
  valence: number;
  arousal: number;
  dominance: number;
}

interface LiveEmotionTimelineProps {
  emotionHistory: EmotionUpdate[];
  maxDataPoints?: number;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',
  sad: '#3b82f6',
  anxious: '#f59e0b',
  stressed: '#dc2626',
  calm: '#6366f1',
  neutral: '#6b7280'
};

const TRACKED_EMOTIONS = ['happy', 'calm', 'neutral', 'anxious', 'stressed', 'sad'];

export function LiveEmotionTimeline({
  emotionHistory,
  maxDataPoints = 20
}: LiveEmotionTimelineProps) {
  // Transform emotion history into chart data
  const chartData = useMemo(() => {
    // Take last N data points
    const recentHistory = emotionHistory.slice(-maxDataPoints);

    return recentHistory.map((update, index) => {
      const dataPoint: any = {
        index,
        time: formatDistanceToNow(new Date(update.timestamp), { addSuffix: false }),
        timestamp: update.timestamp
      };

      // Add scores for tracked emotions
      TRACKED_EMOTIONS.forEach(emotion => {
        dataPoint[emotion] = update.emotion_scores[emotion] || 0;
      });

      return dataPoint;
    });
  }, [emotionHistory, maxDataPoints]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
        </p>
        <div className="space-y-1">
          {payload
            .filter((p: any) => p.value > 0.05) // Only show emotions with >5% score
            .sort((a: any, b: any) => b.value - a.value)
            .map((p: any) => (
              <div key={p.dataKey} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.stroke }}
                  />
                  <span className="text-xs capitalize">{p.dataKey}</span>
                </div>
                <span className="text-xs font-semibold">{(p.value * 100).toFixed(0)}%</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No emotion data yet</p>
          <p className="text-gray-400 text-xs mt-1">Start recording to see live emotions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Live Emotion Timeline</h3>
        <span className="text-xs text-gray-500">
          {emotionHistory.length} updates
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="index"
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value + 1}`}
          />

          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
            formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />

          {TRACKED_EMOTIONS.map(emotion => (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stroke={EMOTION_COLORS[emotion]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={300}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* VAD Summary */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {emotionHistory.length > 0 && (
          <>
            <div className="bg-gradient-to-br from-green-50 to-white p-3 rounded-lg border border-green-100">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Positivity</p>
              <p className="text-lg font-bold text-green-700 mt-1">
                {(emotionHistory.reduce((sum, e) => sum + e.valence, 0) / emotionHistory.length).toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Energy Level</p>
              <p className="text-lg font-bold text-purple-700 mt-1">
                {(emotionHistory.reduce((sum, e) => sum + e.arousal, 0) / emotionHistory.length).toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Emotional Control</p>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {(emotionHistory.reduce((sum, e) => sum + e.dominance, 0) / emotionHistory.length).toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
