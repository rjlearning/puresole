import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Link } from "wouter";
import { ArrowRight, Sparkles, MessageCircle, Moon, Activity, Zap, Star, Heart, FileText, Brain, ShieldCheck, Lock, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Landing() {
  const [isCalm, setIsCalm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsCalm((prev) => !prev);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const bubbles = [
    { anxiousText: "Anxious", calmText: "Calm", anxiousColor: "bg-rose-500/80 border-rose-400 text-white", calmColor: "bg-indigo-500/80 border-indigo-400 text-white", ax: -120, ay: -80, cx: -180, cy: -20 },
    { anxiousText: "Angry", calmText: "Serene", anxiousColor: "bg-red-600/80 border-red-500 text-white", calmColor: "bg-emerald-500/80 border-emerald-400 text-white", ax: 120, ay: -60, cx: 180, cy: 30 },
    { anxiousText: "Worried", calmText: "Grounded", anxiousColor: "bg-orange-500/80 border-orange-400 text-white", calmColor: "bg-teal-500/80 border-teal-400 text-white", ax: -100, ay: 80, cx: -130, cy: 100 },
    { anxiousText: "Sad", calmText: "Happy", anxiousColor: "bg-slate-600/80 border-slate-500 text-white", calmColor: "bg-pink-500/80 border-pink-400 text-white", ax: 100, ay: 90, cx: 140, cy: -90 },
    { anxiousText: "Overwhelmed", calmText: "Clear", anxiousColor: "bg-zinc-700/80 border-zinc-500 text-white", calmColor: "bg-cyan-500/80 border-cyan-400 text-white", ax: 0, ay: -120, cx: 0, cy: -140 },
  ];

  return (
    <div className="min-h-screen aurora-bg text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navbar - Glass & Minimal */}
      <nav className="fixed top-6 left-6 right-6 z-50 px-8 py-4 flex justify-between items-center glass-panel max-w-7xl mx-auto shadow-sm">
        <Logo size="sm" showText={true} />
        <div className="flex gap-4">
          <Link href="/auth">
            <Button variant="ghost" className="rounded-full font-medium text-slate-600 hover:bg-white/50 hover:text-indigo-600">Login</Button>
          </Link>
          <Link href="/auth">
            <Button className="rounded-full bg-slate-900 text-white font-medium px-6 hover:bg-slate-800 shadow-lg shadow-slate-300/50 transition-all hover:-translate-y-0.5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-20 md:pb-32 px-6 flex flex-col items-center text-center relative overflow-hidden">

        {/* Ambient Glows tied to emotional state */}
        <div className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse-slow transition-colors duration-1000 ${isCalm ? 'bg-indigo-300/30' : 'bg-rose-300/20'}`}></div>
        <div className={`absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse-slow delay-1000 transition-colors duration-1000 ${isCalm ? 'bg-pink-200/30' : 'bg-orange-200/20'}`}></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl relative z-10 w-full"
        >
          {/* Animated Emotion Bubbles Ecosystem */}
          <div className="relative h-64 md:h-80 w-full max-w-2xl mx-auto mb-8 flex items-center justify-center">

            {/* Core Center Pulse (PureSoul Engine) */}
            <div className={`absolute z-20 w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex items-center justify-center border-4 backdrop-blur-md transition-all duration-1000 ${isCalm ? 'bg-white/90 border-indigo-100 shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 shadow-rose-500/30'}`}>
              <Logo size="lg" showText={false} />
              <div className="absolute inset-x-0 -bottom-8 text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">PureSoul AI</div>
              <motion.div
                animate={{ scale: isCalm ? [1, 1.1, 1] : [1, 1.3, 1] }}
                transition={{ duration: isCalm ? 4 : 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full blur-xl -z-10 transition-colors duration-1000 ${isCalm ? 'bg-indigo-400/50' : 'bg-rose-500/40'}`}
              ></motion.div>
            </div>

            {/* Orbiting Emotion Bubbles */}
            {bubbles.map((b, i) => (
              <motion.div
                key={i}
                className={`absolute z-10 px-4 md:px-6 py-2 md:py-3 rounded-full font-bold tracking-widest text-xs md:text-sm shadow-xl backdrop-blur-md border border-white/20 transition-colors duration-1000 ${isCalm ? b.calmColor : b.anxiousColor}`}
                animate={{
                  x: isCalm ? b.cx : b.ax,
                  y: isCalm ? b.cy : b.ay,
                  scale: isCalm ? 1 : 0.9,
                }}
                transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  {!isCalm && <Activity className="w-3 h-3 md:w-4 md:h-4 opacity-50" />}
                  {isCalm ? b.calmText : b.anxiousText}
                  {isCalm && <Sparkles className="w-3 h-3 md:w-4 md:h-4 opacity-70" />}
                </div>
              </motion.div>
            ))}

            {/* Flowing connection lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-40">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isCalm ? "#818cf8" : "#fb7185"} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              {bubbles.map((b, i) => (
                <motion.line
                  key={`line-${i}`}
                  x1="50%"
                  y1="50%"
                  animate={{
                    x2: `calc(50% + ${isCalm ? b.cx : b.ax}px)`,
                    y2: `calc(50% + ${isCalm ? b.cy : b.ay}px)`,
                  }}
                  transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
                  stroke="url(#lineGrad)"
                  strokeWidth="2"
                  strokeDasharray="4 6"
                />
              ))}
            </svg>
          </div>

          <h1 className="text-4xl md:text-7xl font-semibold tracking-tight mb-4 md:mb-6 leading-[1.1] text-slate-900 drop-shadow-sm transition-all duration-1000">
            {isCalm ? 'Transform your' : 'Identify your'} <br />
            <span className={`text-transparent bg-clip-text transition-all duration-1000 ${isCalm ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500' : 'bg-gradient-to-r from-rose-500 via-orange-500 to-red-500'}`}>
              internal weather.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
            PureSoul instantly turns overwhelming mental friction into actionable clinical calm.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth">
              <Button size="lg" className="h-14 md:h-16 px-8 md:px-10 rounded-full text-lg md:text-xl font-medium bg-slate-900 text-white shadow-xl shadow-indigo-200 scale-100 hover:scale-105 transition-all duration-300">
                Start Healing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* INNOVATIVE: Clinical Precision Section */}
      <section className="px-6 py-16 relative overflow-hidden bg-slate-50/50">
        {/* Medical Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 md:mb-6">
              <Zap className="w-3 h-3" />
              Clinical Intelligence
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 text-slate-900 leading-tight font-serif italic">
              Precision <br />
              <span className="text-indigo-600 not-italic">Postpartum.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 md:mb-10 leading-relaxed font-medium">
              Real-time telemetry and AI diagnostics for early motherhood.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Metabolic Status", value: "Optimal", color: "text-emerald-500" },
                { label: "Neural Load", value: "Moderate", color: "text-amber-500" },
                { label: "Hormonal Status", value: "Rebalancing", color: "text-white bg-indigo-600 px-2 py-0.5 rounded-md shadow-sm ring-1 ring-indigo-400/30" },
                { label: "Recovery Velocity", value: "+12%", color: "text-emerald-500" }
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 whitespace-nowrap">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative group"
          >
            {/* The Dashboard Core */}
            <div className="relative aspect-square max-w-[440px] mx-auto rounded-[3rem] bg-slate-900 shadow-2xl overflow-hidden border-[8px] border-slate-800 flex items-center justify-center p-8">

              {/* Scan Line Animation */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-20"
              />

              {/* Radial Visualization (SVG) */}
              <div className="relative w-full h-full flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 opacity-40">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="50%" cy="50%" r="35%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="50%" cy="50%" r="25%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center z-30"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase opacity-70">Diagnostic Live</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                      SCORE: 72
                    </h3>
                    <div className="h-[2px] w-12 bg-indigo-500 mx-auto rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <p className="text-[11px] font-bold text-indigo-200 mt-2 uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                      Phase: Rebalancing
                    </p>
                  </div>
                </motion.div>

                {/* Telemetry Chips - High Contrast HUD Style */}
                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/20 text-[10px] font-mono flex flex-col gap-1.5 shadow-2xl z-40">
                  <div className="flex justify-between gap-6 border-b border-white/10 pb-1">
                    <span className="text-slate-400">HRV</span>
                    <span className="text-cyan-400 font-black shadow-cyan-500/20 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">64ms</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">SPO2</span>
                    <span className="text-cyan-400 font-black shadow-cyan-500/20 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">98%</span>
                  </div>
                </div>

                <div className="absolute bottom-8 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-white/20 text-[10px] font-mono flex flex-col gap-1.5 shadow-2xl z-40">
                  <div className="flex justify-between gap-6 border-b border-white/10 pb-1">
                    <span className="text-slate-400">REM</span>
                    <span className="text-pink-400 font-black shadow-pink-500/20 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">2h 14m</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">CORT</span>
                    <span className="text-pink-400 font-black shadow-pink-500/20 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">LOW</span>
                  </div>
                </div>

                {/* Bottom Status Ticker */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-max z-50">
                  <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/50 flex underline decoration-indigo-300 decoration-2 underline-offset-4 decoration-dotted">
                    <Activity className="w-3 h-3 mr-2 text-indigo-200 animate-pulse" />
                    Clinical Integrity: Verified
                  </div>
                </div>
              </div>

              {/* Glass Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
            </div>

            {/* Ambient Background Glow for the Dashboard */}
            <div className="absolute -inset-10 bg-indigo-500/20 blur-[80px] rounded-full -z-10 group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
          </motion.div>
        </div>
      </section>

      {/* INNOVATIVE: Cause & Effect Explanation Section */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-4 md:mb-6">
            <Activity className="w-3 h-3" />
            How It Works
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Action. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">Reaction.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto px-4">
            See how simple daily inputs turn into clinical insights.
          </p>
        </div>

        <div className="space-y-8 md:space-y-12">

          {/* Feature 1: Vocal Journal */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-1 w-full bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-500 border-none font-bold tracking-widest uppercase text-[10px]">Your Action</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Speak your mind.</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium">Record a 30-second audio thought. No typing needed.</p>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white shrink-0 z-10 rotate-90 md:rotate-0">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>

            <div className="flex-1 w-full bg-indigo-50 border border-indigo-100 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge className="mb-4 bg-indigo-500 hover:bg-indigo-600 border-none font-bold tracking-widest uppercase text-[10px] shadow-md shadow-indigo-500/20">The Reaction</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-indigo-950 mb-2">AI extracts biomarkers.</h3>
              <p className="text-sm md:text-base text-indigo-800/70 font-medium">We instantly detect <strong className="text-indigo-900">stress and fatigue</strong> hidden in your tone.</p>
            </div>
          </motion.div>

          {/* Feature 2: Empathic AI Companion */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-1 w-full bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-500 border-none font-bold tracking-widest uppercase text-[10px]">Your Action</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Feel anxious or triggered.</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium">Open the AI Companion chat when overwhelmed.</p>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white shrink-0 z-10 rotate-90 md:rotate-0">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>

            <div className="flex-1 w-full bg-amber-50 border border-amber-100 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge className="mb-4 bg-amber-500 hover:bg-amber-600 text-white border-none font-bold tracking-widest uppercase text-[10px] shadow-md shadow-amber-500/20">The Reaction</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-amber-950 mb-2">24/7 grounded conversation.</h3>
              <p className="text-sm md:text-base text-amber-800/80 font-medium">Get instant, <strong className="text-amber-900">compassionate support</strong> tailored to help you down-regulate.</p>
            </div>
          </motion.div>

          {/* Feature 3: Clinical Reports */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-1 w-full bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-500 border-none font-bold tracking-widest uppercase text-[10px]">Your Action</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Log daily check-ins.</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium">Answer brief prompts about your sleep and mood.</p>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white shrink-0 z-10 rotate-90 md:rotate-0">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>

            <div className="flex-1 w-full bg-emerald-50 border border-emerald-100 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge className="mb-4 bg-emerald-500 hover:bg-emerald-600 border-none font-bold tracking-widest uppercase text-[10px] shadow-md shadow-emerald-500/20 text-white">The Reaction</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-emerald-950 mb-2">Generates a diagnostic report.</h3>
              <p className="text-sm md:text-base text-emerald-800/80 font-medium">We compile your data into <strong className="text-emerald-900">professional reports</strong> to share with a doctor.</p>
            </div>
          </motion.div>

          {/* Feature 4: Sleep */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-1 w-full bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge variant="secondary" className="mb-4 bg-slate-100 text-slate-500 border-none font-bold tracking-widest uppercase text-[10px]">Your Action</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Struggle to sleep at night.</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium">Toss and turn? Open the Sleep module.</p>
            </div>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white shrink-0 z-10 rotate-90 md:rotate-0">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </div>

            <div className="flex-1 w-full bg-purple-50 border border-purple-100 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
              <Badge className="mb-4 bg-purple-500 hover:bg-purple-600 border-none font-bold tracking-widest uppercase text-[10px] shadow-md shadow-purple-500/20 text-white">The Reaction</Badge>
              <h3 className="text-xl md:text-2xl font-bold text-purple-950 mb-2">Restorative audio.</h3>
              <p className="text-sm md:text-base text-purple-800/80 font-medium">We play <strong className="text-purple-900">custom frequencies</strong> to help you drift off naturally.</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* NEW: Technology & Trust Section */}
      <section className="px-6 py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Privacy is our <br /><span className="text-indigo-400">Biological Imperative.</span></h2>
              <p className="text-base md:text-xl text-slate-400 mb-6 md:mb-8 leading-relaxed">
                End-to-end encryption ensures your intimate thoughts stay yours.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: ShieldCheck, text: "End-to-End Encrypted Data Vaults" },
                  { icon: Lock, text: "Strict HIPAA-complaint Privacy Protocols" },
                  { icon: Scale, text: "Ethics-First AI Architecture" }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-lg font-medium">
                    <item.icon className="w-6 h-6 text-indigo-400" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {/* Evidence-based badges */}
              {[
                { label: "CBT", icon: Brain },
                { label: "Somatic", icon: Heart },
                { label: "DBT", icon: Activity }
              ].map((tag, idx) => (
                <div key={idx} className="px-8 py-10 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-4 hover:bg-white/10 transition-colors cursor-default">
                  <tag.icon className="w-10 h-10 text-indigo-300" />
                  <span className="text-xl font-bold tracking-widest">{tag.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-20 text-center px-6 border-t border-white/20 bg-white/30 backdrop-blur-sm">
        <p className="text-3xl font-semibold text-slate-800 mb-12 tracking-tight">Trusted by 10,000+ souls.</p>
        <div className="flex flex-wrap justify-center gap-6">
          {["Privacy First", "End-to-End Encrypted", "Free Forever"].map((tag) => (
            <span key={tag} className="px-6 py-3 rounded-full bg-white/50 border border-white/60 font-medium text-slate-600 shadow-sm cursor-default">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-20 text-sm text-slate-400 font-medium">
          © 2024 PureSoul. Crafted with clear intentions.
        </div>
      </section>
    </div>
  );
}
