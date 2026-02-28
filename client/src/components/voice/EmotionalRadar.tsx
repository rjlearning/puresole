import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface EmotionalRadarProps {
    data?: any[];
}

const defaultData = [
    { subject: 'Calm', A: 120, fullMark: 150 },
    { subject: 'Joy', A: 98, fullMark: 150 },
    { subject: 'Tension', A: 86, fullMark: 150 },
    { subject: 'Fatigue', A: 99, fullMark: 150 },
    { subject: 'Focus', A: 85, fullMark: 150 },
    { subject: 'Resilience', A: 65, fullMark: 150 },
];

export default function EmotionalRadar({ data = defaultData }: EmotionalRadarProps) {
    return (
        <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 150]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Emotional Balance"
                        dataKey="A"
                        stroke="#818cf8"
                        fill="#818cf8"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
