import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface WellnessTrendData {
  date: string;
  wellness_score: number;
  recording_count?: number;
}

interface WellnessTrendChartProps {
  data: WellnessTrendData[];
  isDark?: boolean;
}

const getRiskLevel = (score: number): string => {
  if (score >= 81) return 'None';
  if (score >= 61) return 'Low';
  if (score >= 41) return 'Medium';
  if (score >= 26) return 'High';
  return 'Critical';
};

const getWellnessColor = (score: number): string => {
  if (score >= 81) return '#10b981';  // green
  if (score >= 61) return '#84cc16';  // light green
  if (score >= 41) return '#fbbf24';  // yellow
  if (score >= 26) return '#f59e0b';  // orange
  return '#ef4444';                   // red
};

const CustomWellnessTooltip = ({ active, payload, isDark }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800'} p-4 rounded-2xl shadow-2xl border`}>
        <p className="font-bold mb-2 tracking-tight">{data.date}</p>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'} font-medium`}>
          Wellness Score: <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.wellness_score.toFixed(1)}/100</span>
        </p>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'} font-medium mt-1`}>
          Risk Level: <span className="font-black" style={{ color: getWellnessColor(data.wellness_score) }}>{getRiskLevel(data.wellness_score)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function WellnessTrendChart({ data, isDark }: WellnessTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        No wellness data available for this period
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} vertical={false} />
          <XAxis
            dataKey="date"
            stroke={isDark ? '#64748b' : '#6b7280'}
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke={isDark ? '#64748b' : '#6b7280'}
            style={{ fontSize: '10px', fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomWellnessTooltip isDark={isDark} />} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9', radius: 8 }} />
          <Bar
            dataKey="wellness_score"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            barSize={20}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getWellnessColor(entry.wellness_score)} fillOpacity={isDark ? 0.8 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Risk Level Legend */}
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 justify-center">
        {[
          { label: 'None', range: '81-100', color: '#10b981' },
          { label: 'Low', range: '61-80', color: '#84cc16' },
          { label: 'Medium', range: '41-60', color: '#fbbf24' },
          { label: 'High', range: '26-40', color: '#f59e0b' },
          { label: 'Critical', range: '0-25', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: isDark ? `0 0 8px ${item.color}40` : 'none' }}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
