import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SoulLoader — full-screen cinematic loading experience
 * Brand palette: purple #9333EA → pink #D946EF → rose #EC4899 → violet #7C3AED → cyan #0891B2
 */

const phrases = [
  "Awakening your journey…",
  "Tuning into your signal…",
  "Calibrating your soul…",
  "Reading your frequency…",
];

function AnimatedWave() {
  // Mirror of Logo soundwave bars, animated
  const bars = [
    { gradient: ["#C084FC", "#9333EA"], height: [30, 70, 30], x: 12, delay: 0 },
    { gradient: ["#F472B6", "#D946EF"], height: [60, 100, 60], x: 28, delay: 0.15 },
    { gradient: ["#FB7185", "#EC4899"], height: [80, 110, 80], x: 44, delay: 0.3 },
    { gradient: ["#A78BFA", "#7C3AED"], height: [60, 100, 60], x: 60, delay: 0.15 },
    { gradient: ["#22D3EE", "#0891B2"], height: [30, 70, 30], x: 76, delay: 0 },
  ];

  return (
    <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {bars.map((b, i) => (
          <linearGradient key={i} id={`wg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={b.gradient[0]} />
            <stop offset="100%" stopColor={b.gradient[1]} />
          </linearGradient>
        ))}
      </defs>
      {bars.map((bar, i) => (
        <motion.rect
          key={i}
          x={bar.x}
          width="10"
          rx="5"
          fill={`url(#wg${i})`}
          animate={{
            height: bar.height,
            y: bar.height.map(h => (120 - h) / 2),
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: bar.delay,
          }}
        />
      ))}

      {/* floating bubbles matching logo */}
      <motion.circle
        cx="96"
        cy="18"
        r="5"
        fill="#F472B6"
        animate={{ y: [-4, 4, -4], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="106"
        cy="28"
        r="3"
        fill="#22D3EE"
        animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
    </svg>
  );
}

export function SoulLoader() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIdx(p => (p + 1) % phrases.length);
    }, 1400);
    return () => clearInterval(phraseTimer);
  }, []);

  useEffect(() => {
    const target = 85;
    const step = () => {
      setProgress(p => {
        if (p >= target) return p;
        return p + Math.random() * 6;
      });
    };
    const t = setInterval(step, 300);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 40%, #0d1a2e 100%)",
      }}
    >
      {/* ── Ambient glow orbs ── */}
      <motion.div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #9333EA, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #0891B2, transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* ── Particle field ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ["#C084FC", "#F472B6", "#22D3EE", "#A78BFA", "#FB7185"][i % 5],
            }}
            animate={{
              y: [0, -Math.random() * 80 - 40, 0],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ── Rotating ring ── */}
      <div className="absolute">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: "1px solid transparent",
            backgroundImage:
              "linear-gradient(135deg, #9333EA22, #EC489944, #0891B222, #9333EA22)",
            backgroundOrigin: "border-box",
            boxShadow: "inset 0 0 20px rgba(147, 51, 234, 0.15)",
          }}
        />
      </div>
      <div className="absolute">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "1px dashed rgba(147,51,234,0.2)",
          }}
        />
      </div>

      {/* ── Core content ── */}
      <div className="relative flex flex-col items-center gap-10">
        {/* Logo waveform animated */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <AnimatedWave />
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="flex flex-col items-center gap-1"
        >
          <span
            className="font-black tracking-tighter text-5xl select-none leading-none"
            style={{
              background: "linear-gradient(90deg, #C084FC, #F472B6, #FB7185, #A78BFA, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            PureSoul
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.45em] text-white/30">
            AI · wellness · evolution
          </span>
        </motion.div>

        {/* Animated phrase */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-medium text-white/50 tracking-widest uppercase text-center"
          >
            {phrases[phraseIdx]}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #9333EA, #EC4899, #0891B2)",
            }}
            animate={{ width: `${Math.min(progress, 85)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
