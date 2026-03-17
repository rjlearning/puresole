import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { usePhase, PHASES, PhaseInfo, LifePhase, Gender } from "@/context/PhaseContext";
import { ChevronRight, Lock, Sparkles, Check, UserIcon, Zap } from "lucide-react";
import Logo from "@/components/Logo";

// ── Quiz questions ────────────────────────────────────────────────────────────
// Note: Gender is step 0, but it branches.
const GENDER_QUESTION = {
    id: "gender",
    question: "Who are you?",
    subtitle: "We use this to customize your wellness workspace.",
    options: [
        { label: "👩 Woman", value: "female" as Gender },
        { label: "👨 Man", value: "male" as Gender },
        { label: "🧑 Non-binary / Prefer not to say", value: "other" as Gender },
    ],
};

const QUESTIONS = [
    {
        id: "age",
        question: "How old are you?",
        subtitle: "We use this to suggest the right phase for you.",
        options: [
            { label: "Under 22", value: "teen", suggests: "flowering" as LifePhase },
            { label: "22 – 35", value: "young_adult", suggests: "blooming" as LifePhase },
            { label: "Pregnant or recently had a baby", value: "postpartum", suggests: "blossoming" as LifePhase },
            { label: "36 – 50+", value: "midlife", suggests: "becoming" as LifePhase },
        ],
    },
    {
        id: "focus",
        question: "What's most important to you right now?",
        subtitle: "Pick the one that feels most relevant.",
        options: [
            { label: "🌙 Understanding my cycle & body", value: "cycle", suggests: "flowering" as LifePhase },
            { label: "🤰 Fertility or conception", value: "fertility", suggests: "blooming" as LifePhase },
            { label: "👶 Postpartum recovery & motherhood", value: "postpartum", suggests: "blossoming" as LifePhase },
            { label: "🌿 Navigating hormonal changes", value: "menopause", suggests: "becoming" as LifePhase },
        ],
    },
];

const MEN_BIOMARKER_QUESTIONS = [
    {
        id: "activity",
        question: "What is your primary training focus?",
        subtitle: "This helps us calibrate your metabolic protocol.",
        options: [
            { label: "⚡ Hypertrophy & Strength", value: "strength" },
            { label: "🏃 Endurance & VO2 Max", value: "endurance" },
            { label: "🧘 Mobility & Recovery", value: "mobility" },
            { label: "🧠 Cognitive Performance", value: "cognitive" },
        ],
    },
    {
        id: "sleep_consistency",
        question: "How consistent is your sleep schedule?",
        subtitle: "Sleep is the foundation of androgenic health.",
        options: [
            { label: "📈 Very consistent (7-9h)", value: "high" },
            { label: "📉 Irregular (Varies by >2h)", value: "low" },
            { label: "🔋 I prioritize recovery", value: "priority" },
        ],
    }
];

const WOMEN_BIOMARKER_QUESTIONS = [
    {
        id: "cycle_regularity",
        question: "How regular is your cycle?",
        subtitle: "We use this to sync your nutrition and movement.",
        options: [
            { label: "📅 Like clockwork (28-32 days)", value: "regular" },
            { label: "🌪️ Irregular or unpredictable", value: "irregular" },
            { label: "💊 Using hormonal birth control", value: "birth_control" },
            { label: "🤱 Postpartum / Nursing", value: "postpartum" },
        ],
    },
    {
        id: "energy_ebbs",
        question: "When do you feel your energy peaks?",
        subtitle: "Syncing with your biological rhythm.",
        options: [
            { label: "🌅 Morning surge", value: "morning" },
            { label: "🌇 Evening clarity", value: "evening" },
            { label: "📉 Mid-day crashes frequent", value: "crashes" },
        ],
    }
];

function suggestPhase(answers: (LifePhase | null)[]): LifePhase {
    const counts: Partial<Record<string, number>> = {};
    answers.forEach(a => { if (a) counts[a] = (counts[a] || 0) + 1; });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
    return (sorted[0]?.[0] as LifePhase) ?? "flowering";
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PhaseSelect() {
    const { setPhase, setGender } = usePhase();
    const [, setLocation] = useLocation();
    const [step, setStep] = useState<"gender" | "quiz" | "biomarkers" | "confirm">("gender");
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState<(LifePhase | null)[]>([null, null]);
    const [biomarkerAnswers, setBiomarkerAnswers] = useState<Record<string, string>>({});
    const [suggested, setSuggested] = useState<LifePhase>(null);
    const [chosen, setChosen] = useState<LifePhase>(null);
    const { gender } = usePhase();

    const handleGender = (g: Gender) => {
        setGender(g);
        if (g === "male") {
            // Men proceed to biomarker questions immediately
            setPhase(null);
            setTimeout(() => {
                setStep("biomarkers");
                setQIndex(0);
            }, 250);
        } else {
            // Women and Non-binary proceed to phase quiz
            setTimeout(() => setStep("quiz"), 250);
        }
    };

    const handleAnswer = (suggests: LifePhase) => {
        const newAnswers = [...answers];
        newAnswers[qIndex] = suggests;
        setAnswers(newAnswers);

        if (qIndex < QUESTIONS.length - 1) {
            setTimeout(() => setQIndex(i => i + 1), 250);
        } else {
            const best = suggestPhase(newAnswers);
            setSuggested(best);
            setChosen(best);
            // After phase quiz, go to women's biomarkers
            setTimeout(() => {
                setStep("biomarkers");
                setQIndex(0);
            }, 300);
        }
    };

    const handleBiomarker = (qId: string, value: string) => {
        setBiomarkerAnswers(prev => ({ ...prev, [qId]: value }));

        const currentQuestions = gender === "male" ? MEN_BIOMARKER_QUESTIONS : WOMEN_BIOMARKER_QUESTIONS;

        if (qIndex < currentQuestions.length - 1) {
            setTimeout(() => setQIndex(i => i + 1), 250);
        } else {
            setTimeout(() => setStep("confirm"), 300);
        }
    };

    const handleConfirm = () => {
        // In a real app, we'd persist biomarkerAnswers to the DB here
        console.log("Saving biomarkers:", biomarkerAnswers);
        if (gender !== "male" && chosen) {
            setPhase(chosen);
        }
        setLocation("/dashboard");
    };

    const q = step === "quiz" ? QUESTIONS[qIndex] : null;
    const bq = step === "biomarkers" ? (gender === "male" ? MEN_BIOMARKER_QUESTIONS[qIndex] : WOMEN_BIOMARKER_QUESTIONS[qIndex]) : null;
    const chosenPhase = PHASES.find(p => p.id === chosen);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center px-4 py-12">

            {/* Logo */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                <Logo size="sm" />
            </div>

            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">

                    {/* ── GENDER ── */}
                    {step === "gender" && (
                        <motion.div key="gender" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                            <div className="text-center mb-8">
                                <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{GENDER_QUESTION.question}</h2>
                                <p className="text-slate-500 font-medium">{GENDER_QUESTION.subtitle}</p>
                            </div>

                            <div className="space-y-3">
                                {GENDER_QUESTION.options.map((opt, i) => (
                                    <motion.button key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => handleGender(opt.value)}
                                        className="w-full text-left px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-md transition-all group font-bold text-slate-700 flex items-center justify-between">
                                        {opt.label}
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── QUIZ ── */}
                    {step === "quiz" && q && (
                        <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>

                            {/* Progress */}
                            <div className="flex gap-1.5 mb-8">
                                {QUESTIONS.map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= qIndex ? "bg-rose-400" : "bg-slate-200"}`} />
                                ))}
                            </div>

                            <div className="text-center mb-8">
                                <div className="text-xs font-black uppercase tracking-widest text-rose-400 mb-2">{qIndex + 1} of {QUESTIONS.length}</div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{q.question}</h2>
                                <p className="text-slate-500 font-medium">{q.subtitle}</p>
                            </div>

                            <div className="space-y-3">
                                {q.options.map((opt, i) => (
                                    <motion.button key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => handleAnswer(opt.suggests)}
                                        className="w-full text-left px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50 hover:shadow-md transition-all group font-bold text-slate-700 flex items-center justify-between">
                                        {opt.label}
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-400 transition-colors" />
                                    </motion.button>
                                ))}
                            </div>

                        </motion.div>
                    )}

                    {/* ── BIOMARKERS ── */}
                    {step === "biomarkers" && bq && (
                        <motion.div key={`bq-${qIndex}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>

                            {/* Progress */}
                            <div className="flex gap-1.5 mb-8">
                                {(gender === "male" ? MEN_BIOMARKER_QUESTIONS : WOMEN_BIOMARKER_QUESTIONS).map((_, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= qIndex ? "bg-indigo-400" : "bg-slate-200"}`} />
                                ))}
                            </div>

                            <div className="text-center mb-8">
                                <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Biomarker Calibration</div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{bq.question}</h2>
                                <p className="text-slate-500 font-medium">{bq.subtitle}</p>
                            </div>

                            <div className="space-y-3">
                                {bq.options.map((opt, i) => (
                                    <motion.button key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => handleBiomarker(bq.id, opt.value)}
                                        className="w-full text-left px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-md transition-all group font-bold text-slate-700 flex items-center justify-between">
                                        {opt.label}
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── CONFIRM ── */}
                    {step === "confirm" && (
                        <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>

                            <div className="text-center mb-8">
                                <Sparkles className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Your phase looks like...</h2>
                                <p className="text-slate-500 font-medium">You can always change this later in settings.</p>
                            </div>

                            {/* Suggested phase card */}
                            {chosenPhase ? (
                                <div className={`rounded-3xl p-6 mb-6 border-2 ${chosen === suggested ? "border-rose-300 shadow-lg shadow-rose-100" : "border-slate-200"} transition-all bg-white`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${chosenPhase.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                                            {chosenPhase.emoji}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-xl">{chosenPhase.name}</div>
                                            <div className="text-slate-500 text-sm font-medium">{chosenPhase.nickname}</div>
                                        </div>
                                        {chosenPhase.free ? (
                                            <span className="ml-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">Limited Time</span>
                                        ) : (
                                            <span className="ml-auto px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center gap-1"><Lock className="w-3 h-3" /> Premium</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{chosenPhase.description}</p>
                                </div>
                            ) : (
                                <div className="rounded-3xl p-8 mb-6 border-2 border-indigo-200 shadow-xl shadow-indigo-50 bg-white text-center">
                                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-950 flex items-center justify-center shadow-xl mx-auto mb-6">
                                        <Zap className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Evolutionary Core</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        Your workspace is being calibrated for male metabolic performance, recovery optimization, and clinical-grade longevity insights.
                                    </p>
                                </div>
                            )}

                            {/* All phases — let user switch (only for non-male) */}
                            {!chosenPhase && chosen === null && (
                                <div className="hidden" />
                            )}
                            {chosenPhase && (
                                <>
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Or choose a different phase</div>
                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        {PHASES.map(p => (
                                            <button key={p.id} onClick={() => setChosen(p.id)}
                                                className={`rounded-2xl p-3 border-2 flex items-center gap-2 transition-all text-left ${chosen === p.id ? `border-rose-400 ${p.color}` : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                                <span className="text-xl">{p.emoji}</span>
                                                <div>
                                                    <div className={`font-black text-sm ${chosen === p.id ? p.accent : "text-slate-700"}`}>{p.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                                        {p.free ? "Free" : <><Lock className="w-2.5 h-2.5" /> Premium</>}
                                                    </div>
                                                </div>
                                                {chosen === p.id && <Check className="w-4 h-4 text-rose-400 ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <button onClick={handleConfirm}
                                className={`w-full py-4 rounded-2xl font-black text-white text-lg bg-gradient-to-r ${chosenPhase?.gradient ?? "from-rose-400 to-violet-400"} shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-100`}>
                                Enter {chosenPhase?.name} ✨
                            </button>

                            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                                Premium phases include a 14-day free trial · No credit card required
                            </p>

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
