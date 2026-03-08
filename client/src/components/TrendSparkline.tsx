import React from 'react';

interface TrendSparklineProps {
    data: { date: string; compositeScore: number | null }[];
    width?: number;
    height?: number;
    strokeWidth?: number;
}

export function TrendSparkline({
    data,
    width = 100,
    height = 30,
    strokeWidth = 2
}: TrendSparklineProps) {
    if (!data || data.length < 2) return null;

    // Filter out null scores and ensure we have numbers
    const scores = data
        .map(d => d.compositeScore)
        .filter((s): s is number => s !== null);

    if (scores.length < 2) return null;

    const min = 0; // Standardize to 0-100
    const max = 100;

    const range = max - min;
    const stepX = width / (scores.length - 1);

    // Calculate points for the SVG polyline
    const points = scores.map((score, i) => {
        const x = i * stepX;
        // SVG coordinates: 0 is top, height is bottom
        // We want 100 at top, 0 at bottom
        const y = height - ((score - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    // Determine trend color
    const first = scores[0];
    const last = scores[scores.length - 1];
    const trend = last - first;

    let color = '#94a3b8'; // slate-400 (neutral)
    if (trend > 2) color = '#34d399'; // emerald-400 (improving)
    if (trend < -2) color = '#fb7185'; // rose-400 (declining)

    return (
        <div className="flex flex-col items-center gap-1">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
            >
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    style={{ transition: 'all 0.5s ease' }}
                />
                {/* Shadow glow */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth * 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    className="opacity-20 blur-[2px]"
                />
            </svg>
        </div>
    );
}
