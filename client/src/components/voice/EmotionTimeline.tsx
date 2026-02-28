import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmotionTimelineData {
  date: string;
  happy?: number;
  calm?: number;
  neutral?: number;
  anxious?: number;
  sad?: number;
  stressed?: number;
}

interface EmotionTimelineProps {
  data: EmotionTimelineData[];
  isDark?: boolean;
}

const emotionColors = {
  happy: '#10b981',      // green
  calm: '#3b82f6',       // blue
  neutral: '#6b7280',    // gray
  anxious: '#f59e0b',    // orange
  sad: '#ef4444',        // red
  stressed: '#dc2626',   // dark red
};

const CustomTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{payload[0].payload.date}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value ? (entry.value * 100).toFixed(1) : 'N/A'}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EmotionTimeline({ data, isDark }: EmotionTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        No emotion data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
        <XAxis
          dataKey="date"
          stroke={isDark ? '#64748b' : '#6b7280'}
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          stroke={isDark ? '#64748b' : '#6b7280'}
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
          iconType="circle"
        />
        {Object.entries(emotionColors).map(([emotion, color]) => (
          <Line
            key={emotion}
            type="monotone"
            dataKey={emotion as keyof EmotionTimelineData}
            stroke={color}
            strokeWidth={3}
            dot={{ r: 0 }}
            activeDot={{ r: 6, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
