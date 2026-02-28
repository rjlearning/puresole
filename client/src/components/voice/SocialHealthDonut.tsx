import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

const data = [
    { name: 'Constructive', value: 72, color: '#10b981' },
    { name: 'Restrictive', value: 28, color: '#f43f5e' },
];

export default function SocialHealthDonut() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
