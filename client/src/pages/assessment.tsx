import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Home,
  Sparkles,
  Heart,
  Brain,
  Moon,
  Zap,
  CheckCircle2,
  ChevronRight,
  RotateCcw
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
}

const questions: Question[] = [
  { id: 'mood1', text: "How's your mood right now?", emoji: '😊', category: 'mood' },
  { id: 'anxiety1', text: "How calm do you feel?", emoji: '🧘', category: 'anxiety' },
  { id: 'energy1', text: "What's your energy level?", emoji: '⚡', category: 'energy' },
  { id: 'sleep1', text: "How well did you sleep?", emoji: '😴', category: 'sleep' },
  { id: 'stress1', text: "How stressed are you feeling?", emoji: '🌊', category: 'stress' },
  { id: 'mood2', text: "How hopeful do you feel about today?", emoji: '🌟', category: 'mood' },
  { id: 'anxiety2', text: "How much are racing thoughts bothering you?", emoji: '🌀', category: 'anxiety' },
  { id: 'energy2', text: "How motivated do you feel?", emoji: '🚀', category: 'energy' },
];

const answers: Answer[] = [
  { value: 1, label: "Really bad", emoji: "😢", color: "from-red-500 to-red-600" },
  { value: 2, label: "Not great", emoji: "😕", color: "from-orange-500 to-orange-600" },
  { value: 3, label: "Okay", emoji: "😐", color: "from-yellow-500 to-yellow-600" },
  { value: 4, label: "Good", emoji: "🙂", color: "from-green-400 to-green-500" },
  { value: 5, label: "Amazing!", emoji: "😄", color: "from-emerald-400 to-teal-500" },
];

export default function Assessment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / questions.length) * 100;
  const allAnswered = answeredCount === questions.length;

  const handleAnswer = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResults = () => {
    const categories = {
      mood: { total: 0, count: 0 },
      anxiety: { total: 0, count: 0 },
      energy: { total: 0, count: 0 },
      sleep: { total: 0, count: 0 },
      stress: { total: 0, count: 0 },
    };

    questions.forEach(q => {
      const response = responses[q.id];
      if (response) {
        categories[q.category].total += response;
        categories[q.category].count++;
      }
    });

    const scores: Record<string, number> = {};
    Object.entries(categories).forEach(([key, val]) => {
      scores[key] = val.count > 0 ? Math.round((val.total / val.count) * 20) : 50;
    });

    // For stress and anxiety, invert the score (higher answer = lower stress/anxiety)
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

    if (insights.length === 0) {
      insights.push("You're doing okay! Regular check-ins help track your progress. 📊");
    }

    return insights;
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast({
        title: "Almost there!",
        description: `Please answer ${questions.length - answeredCount} more question(s)`,
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const calculatedResults = calculateResults();

      // Save to backend
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'comprehensive',
          responses,
          score: calculatedResults.overallWellness,
          severity: calculatedResults.overallWellness >= 70 ? 'minimal' :
                   calculatedResults.overallWellness >= 50 ? 'mild' :
                   calculatedResults.overallWellness >= 30 ? 'moderate' : 'severe',
        }),
      });

      if (!response.ok) {
        console.error('Failed to save assessment');
      }

      setResults(calculatedResults);
      setShowResults(true);

      toast({
        title: "Check-in complete! ✨",
        description: "Your wellness snapshot is ready",
      });
    } catch (error) {
      console.error('Error:', error);
      // Still show results even if save failed
      setResults(calculateResults());
      setShowResults(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResponses({});
    setShowResults(false);
    setResults(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/20';
    if (score >= 50) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  // Results View
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Navigation */}
        <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> New Check-in
              </Button>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Wellness Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex flex-col items-center">
              <div className={`w-40 h-40 rounded-full ${getScoreBg(results.overallWellness)} flex items-center justify-center mb-4`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(results.overallWellness)}`}>
                    {results.overallWellness}
                  </div>
                  <div className="text-gray-400 text-sm">Wellness</div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {results.overallWellness >= 70 ? "You're doing great! 🌟" :
                 results.overallWellness >= 50 ? "Room for improvement 💪" :
                 "Let's work on this together 💜"}
              </h2>
            </div>
          </motion.div>

          {/* Category Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {[
              { key: 'mood', label: 'Mood', icon: Heart, color: 'text-pink-400' },
              { key: 'energy', label: 'Energy', icon: Zap, color: 'text-yellow-400' },
              { key: 'sleep', label: 'Sleep', icon: Moon, color: 'text-blue-400' },
              { key: 'stress', label: 'Calm', icon: Brain, color: 'text-purple-400' },
              { key: 'anxiety', label: 'Peace', icon: Sparkles, color: 'text-teal-400' },
            ].map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="glass-card p-4 text-center">
                <Icon className={`h-6 w-6 ${color} mx-auto mb-2`} />
                <div className={`text-2xl font-bold ${getScoreColor(results.scores[key])}`}>
                  {results.scores[key]}%
                </div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> Insights
            </h3>
            <ul className="space-y-3">
              {results.insights.map((insight: string, i: number) => (
                <li key={i} className="flex gap-3 text-gray-300">
                  <span className="text-purple-400">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={() => setLocation('/activities')}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-6"
            >
              Try an Activity <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => setLocation('/voice-journal')}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 py-6"
            >
              Voice Journal <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Assessment Form View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Home
                className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white"
                onClick={() => setLocation('/')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold gradient-text"
          >
            Quick Check-In ✨
          </motion.h1>
          <p className="text-gray-400">Tap how you're feeling for each question</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{answeredCount} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Questions Grid */}
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: qIndex * 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{question.emoji}</span>
                <span className="text-white font-medium text-lg">{question.text}</span>
                {responses[question.id] && (
                  <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {answers.map((answer) => {
                  const isSelected = responses[question.id] === answer.value;
                  return (
                    <motion.button
                      key={answer.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(question.id, answer.value)}
                      className={`
                        flex-1 min-w-[80px] py-3 px-4 rounded-xl font-medium transition-all
                        ${isSelected
                          ? `bg-gradient-to-r ${answer.color} text-white shadow-lg`
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }
                      `}
                    >
                      <span className="text-xl mb-1 block">{answer.emoji}</span>
                      <span className="text-xs">{answer.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`
              w-full py-6 text-lg font-semibold transition-all
              ${allAnswered
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 glow-primary'
                : 'bg-gray-700 text-gray-400'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
              </span>
            ) : allAnswered ? (
              <span className="flex items-center gap-2">
                See My Results <Sparkles className="h-5 w-5" />
              </span>
            ) : (
              `Answer ${questions.length - answeredCount} more`
            )}
          </Button>
        </motion.div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-gray-500">
          🔒 Your responses are private and encrypted
        </p>
      </div>
    </div>
  );
}
