import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePhase } from "@/context/PhaseContext";
import {
    Moon, Sun, Droplets, Wind, Heart, BookOpen,
    Smile, Meh, Frown, Flame, Zap, Flower2, ChevronRight, Check, Calendar
} from "lucide-react";

// ── Cycle phase data ───────────────────────────────────────────────────────────
const CYCLE_PHASES = [
    { name: "Menstrual", days: "Days 1–5", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: "🩸", body: "Your uterine lining sheds. Energy is naturally lower — this is a time to rest and be gentle with yourself.", tip: "Warmth helps: a hot water bottle, warming foods like soups and ginger tea." },
    { name: "Follicular", days: "Days 6–13", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", icon: "🌱", body: "Estrogen rises. You'll notice more energy, motivation, and mental clarity. Great time to start new things.", tip: "Channel this rising energy: go for a walk, journal about goals, try something new." },
    { name: "Ovulatory", days: "Days 14–17", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "✨", body: "Peak estrogen. You may feel most confident and social. Your body is at its most fertile window.", tip: "Connect with people you love. Express yourself — your communication is naturally strongest now." },
    { name: "Luteal", days: "Days 18–28", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", icon: "🌙", body: "Progesterone rises then drops. You may feel more inward and sensitive — this is normal and worthy of care.", tip: "Reduce stimulants, prioritize sleep, and journal any feelings without judgment." },
];

const MOOD_OPTIONS = [
    { emoji: "😊", label: "Good", color: "bg-emerald-100 border-emerald-200 text-emerald-700" },
    { emoji: "😌", label: "Calm", color: "bg-sky-100 border-sky-200 text-sky-700" },
    { emoji: "😐", label: "Meh", color: "bg-amber-100 border-amber-200 text-amber-700" },
    { emoji: "😔", label: "Low", color: "bg-slate-100 border-slate-200 text-slate-700" },
    { emoji: "😰", label: "Anxious", color: "bg-orange-100 border-orange-200 text-orange-700" },
];

const MINDFULNESS = [
    { title: "Body Scan", duration: "5 min", desc: "Check in with every part of your body — no judgment, just awareness.", icon: "🧘" },
    { title: "Cycle Breathing", duration: "3 min", desc: "Breathe in for 4 counts, hold 4, out for 6. Connects you to your body's rhythm.", icon: "🌬️" },
    { title: "Moon Journal", duration: "7 min", desc: "Write about what feels heavy and what feels light today.", icon: "📔" },
];

function getCyclePhase(day: number) {
    if (day <= 5) return CYCLE_PHASES[0];
    if (day <= 13) return CYCLE_PHASES[1];
    if (day <= 17) return CYCLE_PHASES[2];
    return CYCLE_PHASES[3];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloweringDashboard() {
    const { phaseInfo } = usePhase();
    const [cycleDay, setCycleDay] = useState(8);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [moodSaved, setMoodSaved] = useState(false);
    const [showCycleInput, setShowCycleInput] = useState(false);
    const [todayActivity, setTodayActivity] = useState<string | null>(null);

    const cyclePhase = getCyclePhase(cycleDay);

    const saveMood = (label: string) => {
        setSelectedMood(label);
        setTimeout(() => setMoodSaved(true), 400);
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-slate-50/30 pb-24">

            {/* ── Phase header strip ─────────────────────────────────────────────── */}
            <div className={`w-full bg-gradient-to-r ${phaseInfo.gradient} bg-opacity-10 px-4 py-3 flex items-center gap-3`}>
                <span className="text-lg">{phaseInfo.emoji}</span>
                <span className="text-white/90 font-black text-sm tracking-wide">{phaseInfo.name} Phase</span>
                <span className="ml-auto text-white/70 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">Free</span>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

                {/* ── Greeting ──────────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-black text-slate-900">{greeting} 🌱</h1>
                    <p className="text-slate-500 font-medium text-sm mt-0.5">Let's check in with your body today.</p>
                </motion.div>

                {/* ── Cycle Tracker Hero ────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className={`rounded-3xl border-2 ${cyclePhase.border} ${cyclePhase.bg} p-5 relative overflow-hidden`}>
                    {/* Background texture */}
                    <div className="absolute top-0 right-0 text-[80px] opacity-10 leading-none select-none pointer-events-none">{cyclePhase.icon}</div>

                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cycle Tracker</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900">Day {cycleDay}</span>
                                <span className="text-slate-400 font-bold text-sm">of ~28</span>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-xs font-black ${cyclePhase.bg} ${cyclePhase.color} border ${cyclePhase.border}`}>
                                <span>{cyclePhase.icon}</span> {cyclePhase.name} · {cyclePhase.days}
                            </div>
                        </div>

                        {/* Circular day ring */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="5"
                                    strokeDasharray={`${(cycleDay / 28) * 150.8} 150.8`} strokeLinecap="round"
                                    className={cyclePhase.color} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-base">{cyclePhase.icon}</span>
                            </div>
                        </div>
                    </div>

                    {/* Body info */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-3 font-medium">{cyclePhase.body}</p>

                    {/* Tip */}
                    <div className="bg-white/70 rounded-2xl p-3 border border-white">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">✨ Today's tip</div>
                        <p className="text-slate-700 text-xs font-medium leading-relaxed">{cyclePhase.tip}</p>
                    </div>

                    {/* Day adjuster */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/60">
                        <button onClick={() => setCycleDay(d => Math.max(1, d - 1))}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-black hover:bg-slate-50 transition-all">−</button>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500 font-bold">Adjust day ({cycleDay})</span>
                        </div>
                        <button onClick={() => setCycleDay(d => Math.min(28, d + 1))}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-black hover:bg-slate-50 transition-all">+</button>
                    </div>
                </motion.div>

                {/* ── Mood Check-in ─────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart className="w-5 h-5 text-rose-400" />
                        <span className="font-black text-slate-900">How are you feeling?</span>
                    </div>

                    {moodSaved ? (
                        <div className="flex items-center gap-2 py-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <div className="font-black text-slate-900 text-sm">Logged: {selectedMood}</div>
                                <div className="text-xs text-slate-400 font-medium">Thank you for checking in 💙</div>
                            </div>
                            <button onClick={() => { setMoodSaved(false); setSelectedMood(null); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600 font-bold">Change</button>
                        </div>
                    ) : (
                        <div className="flex gap-2 flex-wrap">
                            {MOOD_OPTIONS.map(m => (
                                <button key={m.label} onClick={() => saveMood(m.label)}
                                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all ${selectedMood === m.label ? `${m.color} scale-105` : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                                    <span className="text-xl">{m.emoji}</span>
                                    <span className="text-[10px] font-black text-slate-600">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* ── Quick Actions Row ─────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                    className="grid grid-cols-4 gap-3">
                    {[
                        { icon: "📅", label: "Period Log", href: "/women-cycle" },
                        { icon: "📔", label: "Journal", href: "/voice-journal" },
                        { icon: "🧘", label: "Mindfulness", href: "/activities" },
                        { icon: "👥", label: "Community", href: "/community" },
                    ].map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 transition-all cursor-pointer">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-[10px] font-black text-slate-600 text-center leading-tight">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </motion.div>

                {/* ── Today's Mindfulness ───────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Flower2 className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Today's practice</span>
                    </div>
                    <div className="grid gap-3">
                        {MINDFULNESS.map((m, i) => (
                            <button key={i} onClick={() => setTodayActivity(m.title)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${todayActivity === m.title ? "border-rose-300 bg-rose-50" : "border-slate-100 bg-white hover:border-rose-200"}`}>
                                <span className="text-2xl flex-shrink-0">{m.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-slate-900 text-sm">{m.title}</div>
                                    <div className="text-slate-500 text-xs font-medium leading-snug mt-0.5">{m.desc}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{m.duration}</span>
                                    {todayActivity === m.title && <Check className="w-4 h-4 text-rose-400" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Body Literacy Education ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Know your cycle</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {CYCLE_PHASES.map((p, i) => (
                            <div key={i} className={`rounded-2xl border p-3.5 ${cyclePhase.name === p.name ? `${p.border} ${p.bg}` : "border-slate-100 bg-white"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{p.icon}</span>
                                    <div>
                                        <div className={`font-black text-sm ${cyclePhase.name === p.name ? p.color : "text-slate-700"}`}>{p.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{p.days}</div>
                                    </div>
                                </div>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{p.body.split(".")[0]}.</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Upgrade teaser (non-intrusive) ───────────────────────────────── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
                    className="rounded-3xl border border-dashed border-rose-200 bg-rose-50/50 p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-xl flex-shrink-0">🌸</div>
                    <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-900 text-sm">Ready to Bloom?</div>
                        <div className="text-slate-500 text-xs font-medium leading-snug">When you're ready for fertility support, pregnancy prep, or postpartum care — upgrade to unlock your next phase.</div>
                    </div>
                    <Link href="/phase-select">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-all cursor-pointer">
                            <ChevronRight className="w-4 h-4 text-rose-400" />
                        </div>
                    </Link>
                </motion.div>

            </div>
        </div>
    );
}
