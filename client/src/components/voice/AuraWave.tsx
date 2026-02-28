import React, { useEffect, useRef } from 'react';

interface AuraWaveProps {
    isRecording: boolean;
    volume: number;
    spectralCentroid?: number;
    spectralFlatness?: number;
    primaryEmotion?: string;
    emotionConfidence?: number;
}

const EMOTION_COLORS: Record<string, string[]> = {
    joy: ['#FCD34D', '#A5F3FC', '#818CF8'], // Yellow, Cyan, Indigo - Soft
    happy: ['#FCD34D', '#A5F3FC', '#818CF8'],
    sadness: ['#94A3B8', '#CBD5E1', '#E2E8F0'], // Soft Slates
    sad: ['#94A3B8', '#CBD5E1', '#E2E8F0'],
    anger: ['#FCA5A5', '#C084FC', '#818CF8'], // Soft Red, Purple, Indigo
    angry: ['#FCA5A5', '#C084FC', '#818CF8'],
    fear: ['#C084FC', '#818CF8', '#A5B4FC'], // Soft Purples
    anxious: ['#C084FC', '#818CF8', '#A5B4FC'],
    surprise: ['#F9A8D4', '#F472B6', '#C084FC'], // Soft Pinks
    calm: ['#99F6E4', '#5EEAD4', '#2DD4BF'], // Soft Teals
    neutral: ['#99F6E4', '#5EEAD4', '#2DD4BF'],
    default: ['#818CF8', '#C084FC', '#F9A8D4'], // Indigo, Purple, Pink (Core Bloom Gradient)
};

export const AuraWave: React.FC<AuraWaveProps> = ({
    isRecording,
    volume,
    spectralCentroid = 0.5,
    spectralFlatness = 0.5,
    primaryEmotion = 'default',
    emotionConfidence = 1
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number>();

    class Particle {
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
        color: string;
        opacity: number;

        constructor(canvasWidth: number, canvasHeight: number, colors: string[]) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.size = Math.random() * 4 + 1; // Slightly smaller for light theme
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.speedY = (Math.random() - 0.5) * 1.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.4 + 0.2; // Higher base opacity for light background
        }

        update(v: number, centroid: number, flatness: number, canvasWidth: number, canvasHeight: number) {
            const force = v * 12;
            this.speedX += (Math.random() - 0.5) * force * (1 + centroid);
            this.speedY += (Math.random() - 0.5) * force * (1 - flatness);

            this.speedX *= 0.96;
            this.speedY *= 0.96;

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0) this.x = canvasWidth;
            if (this.x > canvasWidth) this.x = 0;
            if (this.y < 0) this.y = canvasHeight;
            if (this.y > canvasHeight) this.y = 0;
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initParticles();
        };

        const initParticles = () => {
            const colors = EMOTION_COLORS[primaryEmotion.toLowerCase()] || EMOTION_COLORS.default;
            const particleCount = 80; // Reduced density for "airy" feel
            particlesRef.current = Array.from({ length: particleCount }, () => new Particle(canvas.width, canvas.height, colors));
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach(p => {
                p.update(volume, spectralCentroid, spectralFlatness, canvas.width, canvas.height);
                p.draw(ctx);
            });

            if (isRecording) {
                const colors = EMOTION_COLORS[primaryEmotion.toLowerCase()] || EMOTION_COLORS.default;
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = colors[0];
                ctx.lineWidth = 1.5;

                for (let j = 0; j < 3; j++) {
                    ctx.beginPath();
                    const waveOffset = Date.now() * 0.004 + j * 2.5;
                    for (let i = 0; i <= canvas.width; i += 10) {
                        const waveY = (canvas.height / 2) +
                            Math.sin(i * 0.015 + waveOffset) * (volume * 80) * (1 - spectralFlatness) +
                            Math.cos(i * 0.008 - waveOffset) * (volume * 40) * spectralCentroid;
                        if (i === 0) ctx.moveTo(i, waveY);
                        else ctx.lineTo(i, waveY);
                    }
                    ctx.stroke();
                }
            } else {
                const colors = EMOTION_COLORS.default;
                ctx.globalAlpha = 0.15;
                ctx.strokeStyle = colors[0];
                ctx.beginPath();
                const idleOffset = Date.now() * 0.0008;
                for (let i = 0; i <= canvas.width; i += 10) {
                    const waveY = (canvas.height / 2) + Math.sin(i * 0.008 + idleOffset) * 8;
                    if (i === 0) ctx.moveTo(i, waveY);
                    else ctx.lineTo(i, waveY);
                }
                ctx.stroke();
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isRecording, volume, spectralCentroid, spectralFlatness, primaryEmotion]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-indigo-50/30 rounded-2xl">
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Premium Ethereal Glare */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/20 via-transparent to-indigo-100/10" />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl" />
        </div>
    );
};
