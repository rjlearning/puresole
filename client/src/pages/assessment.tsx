import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Home, Sparkles, Heart, Brain, Moon, Zap,
  ChevronRight, RotateCcw, ShieldCheck, Activity
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  emoji: string;
  category: 'mood' | 'anxiety' | 'energy' | 'sleep' | 'stress';
}

interface Answer {
  value: number;
  label: string;
  emoji: string;
  color: string;
  ringColor: string;
}

const questions: Question[] = [
  { id: 'mood1', text: "How's your mood right now?", emoji: '✨', category: 'mood' },
  { id: 'anxiety1', text: "How calm do you feel?", emoji: '🧘', category: 'anxiety' },
  { id: 'energy1', text: "What's your energy level?", emoji: '⚡', category: 'energy' },
  { id: 'sleep1', text: "How well did you sleep?", emoji: '🌙', category: 'sleep' },
  { id: 'stress1', text: "How stressed are you feeling?", emoji: '🌊', category: 'stress' },
  { id: 'mood2', text: "How hopeful do you feel about today?", emoji: '🌟', category: 'mood' },
  { id: 'anxiety2', text: "How much are racing thoughts bothering you?", emoji: '🌀', category: 'anxiety' },
  { id: 'energy2', text: "How motivated do you feel?", emoji: '🚀', category: 'energy' },
];

const answers: Answer[] = [
  { value: 1, label: "Really bad", emoji: "🌪️", color: "from-rose-500/20 to-rose-600/20", ringColor: "ring-rose-500" },
  { value: 2, label: "Not great", emoji: "🌧️", color: "from-orange-500/20 to-orange-600/20", ringColor: "ring-orange-500" },
  { value: 3, label: "Okay", emoji: "🌤️", color: "from-slate-500/20 to-slate-600/20", ringColor: "ring-slate-500" },
  { value: 4, label: "Good", emoji: "☀️", color: "from-emerald-400/20 to-emerald-500/20", ringColor: "ring-emerald-400" },
  { value: 5, label: "Amazing!", emoji: "🌈", color: "from-indigo-400/20 to-indigo-500/20", ringColor: "ring-indigo-400" },
];

export default function Assessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Background animation state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const progress = (currentIndex / questions.length) * 100;

  const handleAnswer = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));

    // Auto advance after short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        handleSubmit({ ...responses, [questionId]: value });
      }
    }, 400);
  };

  const calculateResults = (finalResponses: Record<string, number>) => {
    const categories = {
      mood: { total: 0, count: 0 },
      anxiety: { total: 0, count: 0 },
      energy: { total: 0, count: 0 },
      sleep: { total: 0, count: 0 },
      stress: { total: 0, count: 0 },
    };

    questions.forEach(q => {
      const response = finalResponses[q.id];
      if (response) {
        categories[q.category].total += response;
        categories[q.category].count++;
      }
    });

    const scores: Record<string, number> = {};
    Object.entries(categories).forEach(([key, val]) => {
      scores[key] = val.count > 0 ? Math.round((val.total / val.count) * 20) : 50;
    });

    scores.stress = 100 - scores.stress;
    scores.anxiety = 100 - scores.anxiety;

    const overallWellness = Math.round(
      (scores.mood * 0.25) +
      ((100 - scores.anxiety) * 0.2) +
      (scores.energy * 0.2) +
      (scores.sleep * 0.2) +
      ((100 - scores.stress) * 0.15)
    );

    return {
      scores,
      overallWellness,
      insights: generateInsights(scores),
    };
  };

  const generateInsights = (scores: Record<string, number>) => {
    const insights: string[] = [];
    if (scores.mood >= 70) insights.push("Your mood is looking positive! Keep up whatever you're doing. 🌟");
    else if (scores.mood < 50) insights.push("Your mood could use a boost. Try a quick activity or reach out to someone. 💜");
    if (scores.energy >= 70) insights.push("Great energy levels! Channel it into something meaningful. ⚡");
    else if (scores.energy < 50) insights.push("Energy feeling low? A short walk or some fresh air might help. 🌿");
    if (scores.sleep >= 70) insights.push("Good sleep foundation! This helps everything else. 😴");
    else if (scores.sleep < 50) insights.push("Sleep quality needs attention. Try a calming routine tonight. 🌙");
    if (scores.stress > 60) insights.push("Stress levels are elevated. Consider a breathing exercise. 🧘");
    if (scores.anxiety > 60) insights.push("Some anxiety present. Grounding exercises can help. 🌊");
    if (insights.length === 0) insights.push("You're doing okay! Regular check-ins help track your progress. 📊");
    return insights;
  };

  const handleSubmit = async (finalResponses: Record<string, number>) => {
    setIsSubmitting(true);
    try {
      const calculatedResults = calculateResults(finalResponses);
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'comprehensive',
          responses: finalResponses,
          score: calculatedResults.overallWellness,
          severity: calculatedResults.overallWellness >= 70 ? 'minimal' :
            calculatedResults.overallWellness >= 50 ? 'mild' :
              calculatedResults.overallWellness >= 30 ? 'moderate' : 'severe',
        }),
      });

      if (!response.ok) console.error('Failed to save assessment');

      setResults(calculatedResults);
      setTimeout(() => setShowResults(true), 800); // Artificial delay for processing effect

      toast({ title: "Analysis Complete ✨", description: "Your wellness matrix has been generated." });
    } catch (error) {
      setResults(calculateResults(finalResponses));
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResponses({});
    setCurrentIndex(0);
    setShowResults(false);
    setResults(null);
  };

  const currentQuestion = questions[currentIndex];

  // ─── Results View ─────────────────────────────────────────────────────────
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Header */}
        <div className="relative z-10 px-6 py-4 flex justify-between items-center">
          <div className="absolute top-8 left-8">
            {/* Nav button removed to prevent duplicate with SmartBackButton */}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Analysis Complete</span>
          </div>
          <button onClick={handleReset} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md">
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <div className="relative z-10 container max-w-5xl mx-auto px-6 py-12">

          {/* Main Vitality Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <div className="relative inline-flex items-center justify-center mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-[-20%] rounded-full border border-indigo-500/30 border-dashed" />
              <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl shadow-indigo-500/20">
                <span className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">{results.overallWellness}</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300 mt-2">Vitality Index</span>
              </div>
            </div>
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">
              {results.overallWellness >= 70 ? "Your system is in high coherence." :
                results.overallWellness >= 50 ? "Your system is maintaining balance." :
                  "Your system is under significant load."}
            </h2>
          </motion.div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {[
              { key: 'mood', label: 'Mood', icon: Heart, val: results.scores.mood },
              { key: 'energy', label: 'Energy', icon: Zap, val: results.scores.energy },
              { key: 'sleep', label: 'Sleep', icon: Moon, val: results.scores.sleep },
              { key: 'stress', label: 'Calm', icon: Brain, val: results.scores.stress },
              { key: 'anxiety', label: 'Peace', icon: ShieldCheck, val: results.scores.anxiety },
            ].map((metric, i) => (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md text-center group hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <metric.icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-white mb-1">{metric.val}<span className="text-xs text-white/30 tracking-widest">/100</span></div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2rem] p-8 border border-indigo-500/30 relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/activities')}>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Neural Reset</h3>
              <p className="text-indigo-200 text-sm leading-relaxed mb-6 relative z-10 max-w-xs">Based on your matrix, a 4-minute somatic reset will optimize your current state.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest relative z-10">Start Sequence <ChevronRight className="w-3 h-3" /></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-slate-900/60 rounded-[2rem] p-8 border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-slate-700" onClick={() => setLocation('/voice-journal')}>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Voice Journal</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10 max-w-xs">Unload your thoughts. Our AI will analyze your vocal biomarkers for deeper insights.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest relative z-10">Record Audio <ChevronRight className="w-3 h-3" /></div>
            </motion.div>
          </div>

        </div>
      </div>
    );
  }

  // ─── Assessment Flow View ─────────────────────────────────────────────────
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] bg-indigo-500/20 blur-[100px] rounded-full animate-pulse" />
        </div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-8 relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500" />
            <div className="absolute inset-2 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-2">Analyzing Biomarkers</h2>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Computing your vitality matrix...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative flex flex-col">

      {/* Interactive Background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <motion.div
          animate={{ x: mousePos.x * 0.05, y: mousePos.y * 0.05 }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/30 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{ x: mousePos.x * -0.05, y: mousePos.y * -0.05 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/20 blur-[130px] rounded-full"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        {/* Nav button removed to prevent duplicate with SmartBackButton */}

        {/* Progress Pill */}
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
            {currentIndex + 1} <span className="text-slate-600">/</span> {questions.length}
          </div>
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <button onClick={() => setLocation('/')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md">
          <Home className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      {/* Question Container */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-xl"
          >
            <div className="text-center mb-12">
              <div className="text-6xl mb-6 transform hover:scale-110 transition-transform cursor-default">{currentQuestion.emoji}</div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-white mix-blend-screen">
                {currentQuestion.text}
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {answers.map((answer) => {
                const isSelected = responses[currentQuestion.id] === answer.value;
                return (
                  <motion.button
                    key={answer.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(currentQuestion.id, answer.value)}
                    className={`
                      relative overflow-hidden w-full p-5 rounded-2xl flex items-center gap-4 text-left transition-all duration-300
                      ${isSelected
                        ? `bg-white/10 border-white/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] ring-1 ${answer.ringColor}`
                        : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20'}
                    `}
                  >
                    {/* Subtle gradient background on select */}
                    {isSelected && (
                      <motion.div layoutId="selectedHighlight" className={`absolute inset-0 bg-gradient-to-r ${answer.color} opacity-50`} />
                    )}

                    <span className="text-3xl relative z-10">{answer.emoji}</span>
                    <span className={`text-lg font-medium relative z-10 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {answer.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
