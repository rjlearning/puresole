import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Activity, Check, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Logo from "@/components/Logo";
import { Link } from "wouter";

type Step =
  | "welcome"
  | "feeling"
  | "context"
  | "intensity"
  | "activity_select"
  | "tool"
  | "feedback"
  | "conversion"
  | "exit";

type EmotionId = "stressed" | "anxious" | "overwhelmed" | "tired";

// ─── Emotion definitions ────────────────────────────────────────────────────
const EMOTIONS: {
  id: EmotionId;
  label: string;
  emoji: string;
  accent: string;       // vibrant color for borders / highlights
  bgCard: string;       // card background (semi-transparent dark)
  textColor: string;    // label text color
}[] = [
  { id: "stressed",    label: "Stressed",    emoji: "🌪️", accent: "#F87171", bgCard: "rgba(248,113,113,0.10)", textColor: "#FCA5A5" },
  { id: "anxious",     label: "Anxious",     emoji: "🫧", accent: "#FBBF24", bgCard: "rgba(251,191,36,0.10)",  textColor: "#FDE68A" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "🌊", accent: "#818CF8", bgCard: "rgba(129,140,248,0.10)", textColor: "#C7D2FE" },
  { id: "tired",       label: "Tired",       emoji: "🔋", accent: "#94A3B8", bgCard: "rgba(148,163,184,0.10)", textColor: "#CBD5E1" },
];

const CONTEXTS = [
  { id: "work",         label: "Work",         emoji: "💼" },
  { id: "home",         label: "Home",         emoji: "🏠" },
  { id: "just_because", label: "Just because", emoji: "❤️" },
];

// ─── Tool configs per emotion ────────────────────────────────────────────────
type ToolConfig = {
  name: string;
  subtitle: string;
  description: string;
  durationSec: number;
  accent: string;
  glow: string;
  icon?: React.ReactNode;
  type: "box" | "478" | "grounding" | "energize";
  phases: { label: string; sec: number }[];
};

const EMOTION_TOOLS: Record<EmotionId, ToolConfig> = {
  stressed: {
    name: "Box Breathing",    subtitle: "4 · 4 · 4 · 4",
    description: "Used by Navy SEALs to neutralise fight-or-flight. Equal counts reset your nervous system.",
    durationSec: 64, accent: "#F87171", glow: "rgba(248,113,113,0.22)",
    type: "box",
    phases: [
      { label: "Inhale", sec: 4 }, { label: "Hold", sec: 4 },
      { label: "Exhale", sec: 4 }, { label: "Hold", sec: 4 },
    ],
  },
  anxious: {
    name: "4-7-8 Breath", subtitle: "4 · 7 · 8",
    description: "A long exhale activates the parasympathetic brake — your body's built-in anti-anxiety switch.",
    durationSec: 57, accent: "#FBBF24", glow: "rgba(251,191,36,0.20)",
    type: "478",
    phases: [
      { label: "Inhale", sec: 4 }, { label: "Hold", sec: 7 }, { label: "Exhale slowly", sec: 8 },
    ],
  },
  overwhelmed: {
    name: "5-4-3-2-1 Grounding", subtitle: "Sensory anchor",
    description: "Engage each sense to interrupt the spiral and pull you back into the present moment.",
    durationSec: 75, accent: "#818CF8", glow: "rgba(129,140,248,0.22)",
    type: "grounding",
    phases: [
      { label: "👀 Name 5 things you can SEE", sec: 15 },
      { label: "✋ Feel 4 things you can TOUCH", sec: 15 },
      { label: "👂 Hear 3 things around you", sec: 15 },
      { label: "👃 Smell 2 things near you", sec: 15 },
      { label: "👅 Taste 1 thing now", sec: 15 },
    ],
  },
  tired: {
    name: "Energizing Breath", subtitle: "Bellows technique",
    description: "Rapid diaphragm pumps increase oxygen and stimulate your nervous system to clear brain fog.",
    durationSec: 60, accent: "#94A3B8", glow: "rgba(148,163,184,0.18)",
    type: "energize",
    phases: [
      { label: "Pump quickly — in & out", sec: 20 }, { label: "Deep slow inhale", sec: 5 },
      { label: "Hold at the top", sec: 5 }, { label: "Slow full exhale", sec: 10 },
      { label: "Rest & repeat", sec: 20 },
    ],
  },
};

// ─── Shared card style ───────────────────────────────────────────────────────
const cardBase = "w-full rounded-3xl border transition-all duration-300 cursor-pointer";
const darkCard = {
  background: "rgba(255,255,255,0.04)",
  borderColor: "rgba(255,255,255,0.10)",
};

// ─── Breathing Tool ──────────────────────────────────────────────────────────
function BreathingTool({ tool, onDone }: { tool: ToolConfig; onDone: () => void }) {
  const [phaseIdx, setPhaseIdx]   = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(tool.phases[0].sec);
  const [overall, setOverall]     = useState(tool.durationSec);
  const phaseRef = useRef(0);

  useEffect(() => {
    phaseRef.current = 0;
    setPhaseIdx(0);
    setPhaseTimer(tool.phases[0].sec);
    setOverall(tool.durationSec);
  }, [tool]);

  useEffect(() => {
    const tick = setInterval(() => {
      setOverall(o => {
        if (o <= 1) { clearInterval(tick); onDone(); return 0; }
        return o - 1;
      });
      setPhaseTimer(t => {
        if (t <= 1) {
          const nxt = (phaseRef.current + 1) % tool.phases.length;
          phaseRef.current = nxt;
          setPhaseIdx(nxt);
          return tool.phases[nxt].sec;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [tool, onDone]);

  const phase = tool.phases[phaseIdx];
  const isHold = phase.label.toLowerCase().includes("hold") || phase.label.toLowerCase().includes("rest");
  const isExhale = phase.label.toLowerCase().includes("exhale") || phase.label.toLowerCase().includes("out");
  const orbScale = isHold ? 1.4 : isExhale ? 0.82 : 1.3;
  const mm = Math.floor(overall / 60);
  const ss = String(overall % 60).padStart(2, "0");

  return (
    <motion.div
      key="tool"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${tool.glow} 0%, #020617 65%)` }}
    >
      {/* Header */}
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">{tool.name}</h2>
        <p className="text-slate-300 text-xs tracking-widest">{tool.subtitle}</p>
      </div>

      {/* Orb / card */}
      {tool.type === "grounding" ? (
        <div className="flex flex-col items-center gap-5 mb-8">
          <motion.div
            className="w-64 h-64 rounded-[2.5rem] flex items-center justify-center p-8 border"
            style={{ background: tool.accent + "15", borderColor: tool.accent + "44" }}
            key={phaseIdx}
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-lg font-bold text-white leading-relaxed">{phase.label}</p>
          </motion.div>
          <span className="text-4xl font-black tabular-nums" style={{ color: tool.accent }}>{phaseTimer}s</span>
        </div>
      ) : tool.type === "energize" ? (
        <div className="flex flex-col items-center gap-5 mb-8">
          <motion.div
            className="w-52 h-52 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: tool.accent + "55" }}
            animate={{ scale: phase.label.includes("quickly") ? [1, 1.06, 0.96, 1.06, 1] : [1, 1.18, 1] }}
            transition={ phase.label.includes("quickly") ? { duration: 0.5, repeat: Infinity } : { duration: 5, repeat: Infinity, ease: "easeInOut" } }
          >
            <motion.div className="w-36 h-36 rounded-full blur-3xl" style={{ background: tool.accent + "33" }}
              animate={{ scale: [0.9, 1.2, 0.9] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </motion.div>
          <motion.p key={phaseIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-white font-bold text-base max-w-xs">{phase.label}</motion.p>
          <span className="text-3xl font-black tabular-nums" style={{ color: tool.accent }}>{phaseTimer}s</span>
        </div>
      ) : (
        /* box / 4-7-8 */
        <div className="relative w-56 h-56 flex items-center justify-center mb-10 mx-auto">
          <motion.div className="absolute inset-0 rounded-full border"
            style={{ borderColor: tool.accent + "44" }}
            animate={{ scale: orbScale }} transition={{ duration: phase.sec, ease: "easeInOut" }}
          />
          <motion.div className="absolute inset-6 rounded-full blur-3xl"
            style={{ background: tool.accent + "2A" }}
            animate={{ scale: orbScale }} transition={{ duration: phase.sec, ease: "easeInOut" }}
          />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <motion.span key={phaseIdx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }} className="text-xl font-black uppercase tracking-wider text-white">
              {phase.label}
            </motion.span>
            <span className="text-6xl font-black tabular-nums" style={{ color: tool.accent }}>{phaseTimer}</span>
          </div>
        </div>
      )}

      <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">{tool.description}</p>

      {/* Progress */}
      <div className="w-44 h-[2px] bg-white/10 rounded-full overflow-hidden mb-6">
        <motion.div className="h-full rounded-full" style={{ background: tool.accent }}
          animate={{ width: `${((tool.durationSec - overall) / tool.durationSec) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>

      {/* Progress Footer */}
      <div className="absolute bottom-12 left-0 w-full px-8 flex justify-between items-center opacity-70">
        <span className="text-slate-300 text-xs font-black tabular-nums">{mm}:{ss}</span>
        <button onClick={onDone} className="text-slate-300 text-xs font-black uppercase tracking-[0.35em] hover:text-white transition-colors">Skip</button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InteractiveEntrance() {
  const [step, setStep]           = useState<Step>("welcome");
  const [emotion, setEmotion]     = useState<EmotionId | null>(null);
  const [context, setContext]     = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);

  const next = (s: Step) => setStep(s);
  const tool = emotion ? EMOTION_TOOLS[emotion] : null;
  const emo  = EMOTIONS.find(e => e.id === emotion);

  const renderStep = () => {
    switch (step) {

      // ── WELCOME ────────────────────────────────────────────────────────────
      case "welcome":
        return (
          <motion.div key="welcome" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            style={{ textAlign: "center", padding: "0 1rem" }}>

            {/* Logo — inline SVG so we fully control colors */}
            <div style={{ marginBottom: "2.5rem", position: "relative", display: "inline-flex", alignItems: "center", gap: "1rem", justifyContent: "center" }}>
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 4, repeat: Infinity }}
                style={{ position: "absolute", inset: "-2.5rem", borderRadius: "9999px", background: "radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)" }}
              />
              {/* Soundwave bars — brand logo */}
              <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 10 }}>
                <defs>
                  <linearGradient id="wl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C084FC"/><stop offset="100%" stopColor="#9333EA"/></linearGradient>
                  <linearGradient id="wl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F472B6"/><stop offset="100%" stopColor="#D946EF"/></linearGradient>
                  <linearGradient id="wl3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FB7185"/><stop offset="100%" stopColor="#EC4899"/></linearGradient>
                  <linearGradient id="wl4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A78BFA"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient>
                  <linearGradient id="wl5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22D3EE"/><stop offset="100%" stopColor="#0891B2"/></linearGradient>
                </defs>
                <rect x="12" y="35" width="10" height="30" rx="5" fill="url(#wl1)"/>
                <rect x="28" y="20" width="10" height="60" rx="5" fill="url(#wl2)"/>
                <rect x="44" y="10" width="10" height="80" rx="5" fill="url(#wl3)"/>
                <rect x="60" y="20" width="10" height="60" rx="5" fill="url(#wl4)"/>
                <rect x="76" y="35" width="10" height="30" rx="5" fill="url(#wl5)"/>
                <circle cx="86" cy="16" r="5" fill="#F472B6"/>
                <circle cx="96" cy="24" r="3" fill="#22D3EE"/>
              </svg>
              <span style={{ fontWeight: 900, letterSpacing: "-0.04em", fontSize: "3.75rem", lineHeight: 1, color: "#ffffff", position: "relative", zIndex: 10, userSelect: "none" }}>
                PureSoul
              </span>
            </div>

            {/* Heading — fully self-contained divs, no h1 to avoid global CSS fighting */}
            <div style={{ marginBottom: "1.5rem", lineHeight: 1.05 }}>
              <div style={{
                fontSize: "clamp(2.5rem, 10vw, 5rem)", fontWeight: 900, letterSpacing: "-0.04em",
                background: "linear-gradient(90deg,#818CF8,#F472B6,#FBBF24)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                FIND YOUR CALM.
              </div>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "1.125rem", fontWeight: 500, marginBottom: "2.5rem", maxWidth: "24rem", margin: "0 auto 2.5rem" }}>
              A 2-minute micro-intervention tailored to your exact emotional state.
            </p>
            <button
              onClick={() => next("feeling")}
              style={{
                height: "3.5rem", padding: "0 2.5rem", borderRadius: "9999px",
                background: "linear-gradient(135deg,#818CF8,#F472B6)",
                color: "#ffffff", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.05em",
                border: "none", cursor: "pointer",
                boxShadow: "0 0 32px rgba(129,140,248,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              Start Check-in
            </button>
          </motion.div>
        );

      // ── FEELING ────────────────────────────────────────────────────────────
      case "feeling":
        return (
          <motion.div key="feeling" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="w-full max-w-sm">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto w-full">
              <h2 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter">Your Tools</h2>
              <p className="text-slate-200 text-center text-sm mb-8">Each state gets its own tailored tool.</p>
              <div className="grid grid-cols-2 gap-3">
                {EMOTIONS.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { setEmotion(e.id); next("context"); }}
                    className={`${cardBase} p-5 flex flex-col items-center gap-2 hover:scale-[1.03]`}
                    style={{ background: e.bgCard, borderColor: "rgba(255,255,255,0.10)" }}
                    onMouseEnter={ev => (ev.currentTarget.style.borderColor = e.accent + "88")}
                    onMouseLeave={ev => (ev.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  >
                    <span className="text-4xl">{e.emoji}</span>
                    <div className="p-4 flex flex-col items-center justify-center h-full text-center group-hover:scale-105 transition-transform">
                      <span className="text-3xl mb-2">{EMOTION_TOOLS[e.id].icon}</span>
                      <span className="text-[9px] text-slate-200 font-bold uppercase tracking-widest">{EMOTION_TOOLS[e.id].name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      // ── CONTEXT ────────────────────────────────────────────────────────────
      case "context":
        return (
          <motion.div key="context" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="w-full max-w-sm text-center">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto w-full">
              <h2 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter">Intensity</h2>
              <p className="text-slate-200 text-sm mb-8">Context helps personalise your session.</p>
              <div className="flex flex-col gap-3">
                {CONTEXTS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setContext(c.id); next("intensity"); }}
                    className={`${cardBase} p-5 flex items-center justify-between px-7`}
                    style={{ ...darkCard }}
                    onMouseEnter={ev => (ev.currentTarget.style.borderColor = (emo?.accent ?? "rgba(255,255,255,0.3)") + "88")}
                    onMouseLeave={ev => (ev.currentTarget.style.borderColor = darkCard.borderColor)}
                  >
                    <span className="font-black text-white text-base">{c.label}</span>
                    <span className="text-3xl">{c.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      // ── INTENSITY ──────────────────────────────────────────────────────────
      case "intensity":
        return (
          <motion.div key="intensity" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="w-full max-w-sm text-center">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto w-full">
              <h2 className="text-5xl font-black mb-2 text-white tabular-nums">{intensity}</h2>
              <p className="text-slate-200 text-sm mb-12">1 = light breeze · 10 = high pressure</p>
              <div className="px-4">
                <Slider value={[intensity]} onValueChange={(v) => setIntensity(v[0])} max={10} min={1} step={1} className="my-8" />
                <div className="flex justify-between mt-5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  <span>Manageable</span>
                  <span>Overwhelming</span>
                </div>
              </div>
              <button
                onClick={() => next("activity_select")}
                className="w-full h-14 rounded-full font-black text-white tracking-wide transition-all hover:opacity-90"
                style={{ background: emo?.accent ?? "#818CF8" }}
              >
                Continue
              </button>
            </div>
          </motion.div>
        );

      // ── ACTIVITY SELECT ────────────────────────────────────────────────────
      case "activity_select":
        return (
          <motion.div key="activity_select" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
            {/* Emotion badge */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-sm mx-auto">
              <div className="mb-12">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 mb-2">You're feeling</p>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">
                  {emotion === 'anxious' ? 'Overwhelmed' : emotion === 'tired' ? 'Exhausted' : emo?.label}
                </h2>
                <p className="text-slate-200 text-sm">
                  Intensity Level {intensity}/10 at {context === "work" ? "work" : context === "home" ? "home" : "the moment"}. We've matched you with the best tool.
                </p>
              </div>

              {/* Tool card */}
              {tool && (
                <button
                  onClick={() => next("tool")}
                  className={`${cardBase} p-6 flex items-center gap-5 hover:scale-[1.02] text-left`}
                  style={{ ...darkCard }}
                  onMouseEnter={ev => (ev.currentTarget.style.borderColor = tool.accent + "77")}
                  onMouseLeave={ev => (ev.currentTarget.style.borderColor = darkCard.borderColor)}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tool.accent + "22" }}>
                    {tool.icon}
                  </div>
                  <div className="flex-1 text-left px-2">
                    <p className="font-bold text-white uppercase tracking-wide text-lg leading-tight mb-1">{tool.name}</p>
                    <p className="text-slate-200 text-sm">{tool.subtitle}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="text-slate-300 shrink-0" />
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        );

      // ── TOOL ───────────────────────────────────────────────────────────────
      case "tool":
        return tool ? <BreathingTool tool={tool} onDone={() => next("feedback")} /> : null;

      // ── FEEDBACK ───────────────────────────────────────────────────────────
      case "feedback":
        return (
          <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm text-center">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-sm mx-auto">
              <h2 className="text-5xl font-black mb-6 text-white uppercase tracking-tighter leading-none">Check-in</h2>
              <p className="text-slate-200 text-lg mb-10">Did the <span className="text-white font-bold">{tool?.name}</span> give you any relief?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => next("conversion")}
                  className="h-14 rounded-full font-black text-white text-base tracking-wide hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>
                  Yes, I feel better
                </button>
                <Button
                  variant="outline"
                  onClick={() => next("exit")}
                  className="h-14 rounded-full font-black text-slate-300 text-base hover:text-white transition-colors border-white/10 bg-black/40 hover:bg-white/10"
                >
                  No, not really
                </Button>
              </div>
            </div>
          </motion.div>
        );

      // ── CONVERSION ─────────────────────────────────────────────────────────
      case "conversion":
        return (
          <motion.div key="conversion" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-4xl font-black mb-6 text-white uppercase tracking-tighter leading-none">{tool?.name}</h2>
              <p className="text-slate-200 text-sm max-w-xs mx-auto mb-6 leading-relaxed">{tool?.description}</p>
              <p className="text-slate-200 text-base mb-10 leading-relaxed">
                You took a great step. To keep the momentum going, we're offering a{" "}
                <span className="text-white font-bold">7-day free trial</span> of the PureSoul ecosystem.
              </p>
              <div className="flex flex-col gap-4">
                <Link href="/auth">
                  <button className="w-full h-14 rounded-full font-black text-white text-base tracking-wide hover:scale-[1.02] transition-all"
                    style={{ background: "linear-gradient(135deg,#818CF8,#F472B6)" }}>
                    Claim 7 Days Free
                  </button>
                </Link>
                <div className="mt-8">
                  <button onClick={() => next("exit")} className="text-slate-300 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      // ── EXIT ───────────────────────────────────────────────────────────────
      case "exit":
        return (
          <motion.div key="exit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm px-4">
            <h2 className="text-3xl font-black text-white mb-4 leading-tight">Thanks for trying PureSoul.</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              We're here whenever you're ready to go deeper into your biological and mental clarity.
            </p>
            <button
              onClick={() => { setStep("welcome"); setEmotion(null); setContext(null); setIntensity(5); }}
              className="text-indigo-400 font-black underline decoration-2 underline-offset-4 hover:text-indigo-300 transition-colors"
            >
              Return Home
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center p-6 overflow-hidden">
      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </div>
  );
}
