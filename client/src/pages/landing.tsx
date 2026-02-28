import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Link } from "wouter";
import { ArrowRight, Sparkles, MessageCircle, Moon, Activity, Zap, Star, Heart, FileText, Brain, ShieldCheck, Lock, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Landing() {
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
      <section className="pt-48 pb-32 px-6 flex flex-col items-center text-center relative overflow-hidden">

        {/* Ambient Glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-300/30 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-slate-600">Mindfulness Reimagined</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight mb-8 leading-[1.1] text-slate-900 drop-shadow-sm">
            Medical Intelligence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Find your inner calm.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            PureSoul blends clinical-grade metrics with an empathetic interface to empower your mental wellness journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth">
              <Button size="lg" className="h-16 px-10 rounded-full text-xl font-medium bg-slate-900 text-white shadow-xl shadow-indigo-200 scale-100 hover:scale-105 transition-all duration-300">
                Start Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                ))}
              </div>
              <span className="text-sm">Trusted by 10k+ users</span>
            </div>
          </div>
        </motion.div>

        {/* Floating Glass Elements */}
        <motion.div animate="float" className="absolute top-40 left-10 md:left-20 glass-card p-4 hidden md:block rotate-[-6deg]">
          <Moon className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <motion.div animate="float" className="absolute top-60 right-10 md:right-20 glass-card p-4 hidden md:block rotate-[12deg] delay-500">
          <Activity className="w-8 h-8 text-pink-400" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3" />
              Clinical Intelligence
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 leading-tight font-serif italic">
              Precision <br />
              <span className="text-indigo-600 not-italic">Postpartum.</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              We decode the biological complexity of early motherhood through real-time telemetry and AI-driven diagnostics.
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

      {/* Feature Grid: Tiered Intelligence */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Beyond Simple Tracking</h2>
          <p className="text-xl text-slate-500">Advanced diagnostic intelligence for everyday wellness.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[340px]">

          {/* Vocal Biomarkers */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 glass-card p-10 flex flex-col justify-between relative overflow-hidden group bg-gradient-to-br from-white/80 to-indigo-50/50"
          >
            <div className="absolute top-0 right-0 p-10">
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                <Activity className="w-10 h-10" />
              </div>
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest text-[10px] py-1 font-bold">Machine Learning</Badge>
              </div>
              <h3 className="text-3xl font-semibold mb-3 text-slate-800">Vocal Biomarkers</h3>
              <p className="text-xl text-slate-500 max-w-md italic">"It's not just what you say, but how you say it."</p>
              <p className="text-lg text-slate-600 mt-4 leading-relaxed">
                Advanced vocal analysis detects stress, fatigue, and emotional shifts before they become overwhelming.
              </p>
            </div>
          </motion.div>

          {/* AI Companion */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-card p-8 flex flex-col justify-between relative overflow-hidden bg-white/60"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-slate-800">Empathic AI</h3>
              <p className="text-slate-500">24/7 compassionate support for every mood and moment.</p>
            </div>
          </motion.div>

          {/* Wellness Reports */}
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-card p-8 flex flex-col justify-between relative overflow-hidden bg-white/60"
          >
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 mb-6">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-slate-800">Clinical Reports</h3>
              <p className="text-slate-500">Professional-grade reports to share with your healthcare providers.</p>
            </div>
          </motion.div>

          {/* Restful Sleep */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 glass-card p-10 flex flex-col justify-between relative overflow-hidden bg-white/60"
          >
            <div className="absolute top-0 right-0 p-10">
              <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-500">
                <Moon className="w-10 h-10" />
              </div>
            </div>
            <div className="mt-auto max-w-lg">
              <h3 className="text-3xl font-semibold mb-3 text-slate-800">Restorative Sleep</h3>
              <p className="text-xl text-slate-500">AI-generated sleep stories and pattern analysis to optimize your nocturnal recovery.</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* NEW: Technology & Trust Section */}
      <section className="px-6 py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-6">Privacy is our <br /><span className="text-indigo-400">Biological Imperative.</span></h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Your data is your biological property. We use end-to-end encryption and local processing to ensure your most intimate thoughts remain yours.
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
