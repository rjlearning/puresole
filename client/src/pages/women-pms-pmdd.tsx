import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Heart, Brain, Wind, Moon, Zap, ArrowRight, Info } from 'lucide-react';
import MeshBackground from '@/components/MeshBackground';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PMS_SYMPTOMS = [
  { id: 'mood_swings', label: 'Mood swings', category: 'emotional' },
  { id: 'irritability', label: 'Irritability or anger', category: 'emotional' },
  { id: 'anxiety', label: 'Anxiety or tension', category: 'emotional' },
  { id: 'sadness', label: 'Feeling sad or tearful', category: 'emotional' },
  { id: 'concentration', label: 'Difficulty concentrating', category: 'emotional' },
  { id: 'bloating', label: 'Bloating', category: 'physical' },
  { id: 'breast_tenderness', label: 'Breast tenderness', category: 'physical' },
  { id: 'headaches', label: 'Headaches', category: 'physical' },
  { id: 'fatigue', label: 'Fatigue or low energy', category: 'physical' },
  { id: 'sleep', label: 'Sleep problems', category: 'physical' },
  { id: 'appetite', label: 'Food cravings or appetite changes', category: 'physical' },
  { id: 'cramps', label: 'Cramps or joint pain', category: 'physical' },
];

const PMDD_SYMPTOMS = [
  { id: 'depression', label: 'Hopelessness or feeling depressed', category: 'emotional' },
  { id: 'overwhelm', label: 'Feeling overwhelmed or out of control', category: 'emotional' },
  { id: 'rage', label: 'Intense anger affecting relationships', category: 'emotional' },
  { id: 'social_withdrawal', label: 'Withdrawing from social situations', category: 'emotional' },
  { id: 'work_impact', label: 'Difficulty at work or school', category: 'functional' },
  { id: 'relationship_impact', label: 'Disruption of key relationships', category: 'functional' },
  { id: 'self_worth', label: 'Low self-worth or self-criticism', category: 'emotional' },
  { id: 'panic', label: 'Panic attacks or racing heart', category: 'physical' },
];

const COPING_TOOLS = [
  {
    icon: '🌬️',
    title: 'Box Breathing',
    subtitle: 'Calm the nervous system instantly',
    description: 'When irritability peaks, 4 counts in → 4 hold → 4 out → 4 hold. Repeat 4×. Activates the vagus nerve and reduces cortisol within minutes.',
    link: '/activities/breathing-2',
    color: 'bg-teal-50 border-teal-100',
    iconBg: 'bg-teal-100',
  },
  {
    icon: '🧘',
    title: 'Body Scan Meditation',
    subtitle: 'Release tension held in the body',
    description: 'PMDD heightens physical sensitivity. A guided scan helps distinguish emotional pain from physical sensation, reducing overall pain perception.',
    link: '/activities/meditation-2',
    color: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
  },
  {
    icon: '📓',
    title: 'Symptom Journaling',
    subtitle: 'Track patterns across your cycle',
    description: 'Log daily mood and symptoms for 2+ cycles. This data is essential for diagnosis and for identifying your personal trigger windows.',
    link: '/voice-journal',
    color: 'bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100',
  },
  {
    icon: '🌿',
    title: '5-4-3-2-1 Grounding',
    subtitle: 'Anchor yourself when overwhelmed',
    description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Interrupts the emotional flooding response rapidly.',
    link: '/activities/grounding-1',
    color: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
  },
];

const WHEN_TO_SEEK_HELP = [
  'Symptoms significantly disrupt work, school, or relationships for 2+ months',
  'You feel unable to cope or have thoughts of self-harm',
  'Symptoms occur in the 2 weeks before your period and resolve within a few days of it starting',
  'Antidepressants, hormonal therapy, or lifestyle changes may be treatment options worth discussing with your doctor',
];

const CYCLE_TIMING = [
  { phase: 'Follicular', days: '1–13', risk: 'low', description: 'Estrogen rising — mood typically stable or improved' },
  { phase: 'Ovulation', days: '14', risk: 'low', description: 'Estrogen peak — often highest energy and social ease' },
  { phase: 'Luteal (early)', days: '15–21', risk: 'mild', description: 'Progesterone rises — minor mood dips may begin' },
  { phase: 'Luteal (late)', days: '22–28', risk: 'high', description: 'Estrogen & progesterone fall sharply — peak PMS/PMDD window' },
  { phase: 'Menstrual', days: '1–5', risk: 'resolving', description: 'Hormones at baseline — relief typically begins here' },
];

const riskColor: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  mild: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  resolving: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PmsPmddPage() {
  const [checkedPms, setCheckedPms] = useState<Set<string>>(new Set());
  const [checkedPmdd, setCheckedPmdd] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [expandedTool, setExpandedTool] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'understand' | 'track' | 'cope'>('understand');

  const togglePms = (id: string) => {
    setCheckedPms(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setShowResult(false);
  };

  const togglePmdd = (id: string) => {
    setCheckedPmdd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setShowResult(false);
  };

  const pmddFunctionalCount = PMDD_SYMPTOMS.filter(s => s.category === 'functional' && checkedPmdd.has(s.id)).length;
  const pmddEmotionalCount = PMDD_SYMPTOMS.filter(s => s.category === 'emotional' && checkedPmdd.has(s.id)).length;
  const likelyPmdd = pmddFunctionalCount >= 1 && pmddEmotionalCount >= 3;
  const likelyPms = checkedPms.size >= 3 && !likelyPmdd;
  const noSignificant = checkedPms.size < 3 && checkedPmdd.size < 3;

  return (
    <div className="min-h-screen pb-32 text-slate-900 relative max-w-full overflow-x-hidden">
      <MeshBackground variant="rose" />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/50 backdrop-blur-xl border-b border-rose-100/60 h-16 flex items-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-4">
          <Link href="/women">
            <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">Women's Health</p>
            <h1 className="text-base font-black text-slate-900 tracking-tight">PMS & PMDD Support</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 mb-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                <Heart className="w-3 h-3" /> Cycle-Linked Wellbeing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
                You're not imagining it.<br />Your cycle affects your mind.
              </h2>
              <p className="text-rose-100 text-sm leading-relaxed max-w-xl">
                Premenstrual Syndrome (PMS) and Premenstrual Dysphoric Disorder (PMDD) are real, hormonally-driven conditions affecting mood, relationships, and daily function. Understanding and tracking them is the first step to reclaiming your wellbeing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl">
          {[
            { key: 'understand', label: 'Understand', icon: Brain },
            { key: 'track', label: 'Track Symptoms', icon: CheckCircle2 },
            { key: 'cope', label: 'Cope & Heal', icon: Wind },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Tab 1: Understand ── */}
          {activeTab === 'understand' && (
            <motion.div key="understand" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* PMS vs PMDD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">PMS</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    <span className="font-bold">Premenstrual Syndrome</span> affects up to 75% of menstruating people. Symptoms are real but typically manageable and do not significantly impair daily function.
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {['Mood swings, irritability', 'Bloating & breast tenderness', 'Fatigue & headaches', 'Food cravings'].map(s => (
                      <li key={s} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-300 shrink-0" />{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">PMDD</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    <span className="font-bold">Premenstrual Dysphoric Disorder</span> affects 3–8% of people. It is severe, clinically recognised, and significantly disrupts social interactions, work, and relationships.
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {['Intense depression or hopelessness', 'Rage affecting relationships', 'Feeling out of control', 'Social withdrawal'].map(s => (
                      <li key={s} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-300 shrink-0" />{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cycle Timing */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-slate-900 mb-1">When symptoms are most likely</h3>
                <p className="text-xs text-slate-500 mb-4">Symptoms tied to PMS/PMDD occur in the luteal phase (after ovulation) and resolve within days of menstruation starting.</p>
                <div className="space-y-2">
                  {CYCLE_TIMING.map(c => (
                    <div key={c.phase} className="flex items-center gap-4">
                      <div className="w-24 shrink-0">
                        <p className="text-xs font-black text-slate-700">{c.phase}</p>
                        <p className="text-[10px] text-slate-400">Day {c.days}</p>
                      </div>
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${riskColor[c.risk]}`}>{c.risk}</span>
                        <p className="text-xs text-slate-500 mt-1">{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* When to seek help */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <h3 className="font-black text-slate-900">When to speak with a doctor</h3>
                </div>
                <ul className="space-y-2">
                  {WHEN_TO_SEEK_HELP.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* ── Tab 2: Track ── */}
          {activeTab === 'track' && (
            <motion.div key="track" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                <Moon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600">
                  <span className="font-bold">For an accurate picture:</span> Track these symptoms for at least 2 menstrual cycles and note whether they appear in the 1–2 weeks before your period and resolve within a few days of it starting.
                </p>
              </div>

              {/* PMS Symptoms */}
              <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-slate-900 mb-1">Common PMS Symptoms</h3>
                <p className="text-xs text-slate-500 mb-4">Select what you experience in the 2 weeks before your period</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PMS_SYMPTOMS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => togglePms(s.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm ${
                        checkedPms.has(s.id)
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${checkedPms.has(s.id) ? 'bg-rose-500 border-rose-500' : 'border-slate-300'}`}>
                        {checkedPms.has(s.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PMDD Symptoms */}
              <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-slate-900 mb-1">PMDD Severity Indicators</h3>
                <p className="text-xs text-slate-500 mb-4">These symptoms suggest significant functional impairment — possible PMDD</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PMDD_SYMPTOMS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => togglePmdd(s.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm ${
                        checkedPmdd.has(s.id)
                          ? 'bg-purple-50 border-purple-300 text-purple-900'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${checkedPmdd.has(s.id) ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}>
                        {checkedPmdd.has(s.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* See result */}
              {(checkedPms.size > 0 || checkedPmdd.size > 0) && (
                <button
                  onClick={() => setShowResult(true)}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black tracking-wide hover:bg-slate-800 transition-all"
                >
                  See My Pattern Summary
                </button>
              )}

              {/* Result */}
              <AnimatePresence>
                {showResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {noSignificant && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                        <p className="font-black text-emerald-800 mb-2">✅ Low symptom load</p>
                        <p className="text-sm text-emerald-700">Your selected symptoms suggest a low-impact pattern. Continue tracking across cycles to build a clearer picture. Lifestyle support (sleep, nutrition, movement) is beneficial regardless.</p>
                      </div>
                    )}
                    {likelyPms && !likelyPmdd && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                        <p className="font-black text-rose-800 mb-2">🌸 Pattern consistent with PMS</p>
                        <p className="text-sm text-rose-700 mb-3">Your symptom pattern is consistent with PMS. Lifestyle interventions — including regular exercise, reducing caffeine and sugar, improving sleep, and stress management — are proven to significantly reduce PMS severity.</p>
                        <p className="text-xs text-rose-600">Track across 2 cycles and share with your healthcare provider if symptoms disrupt daily life.</p>
                      </div>
                    )}
                    {likelyPmdd && (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                        <p className="font-black text-purple-800 mb-2">⚠️ Pattern consistent with PMDD — please speak with a doctor</p>
                        <p className="text-sm text-purple-700 mb-3">Your responses indicate significant emotional and functional disruption. This pattern is consistent with PMDD, a clinically recognized condition that responds well to treatment — including SSRIs, hormonal therapy, and targeted CBT.</p>
                        <p className="text-xs text-purple-600 font-bold">This tool is not a diagnosis. Please share this pattern with your GP or OB/GYN. You deserve proper support and you are not alone.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* ── Tab 3: Cope ── */}
          {activeTab === 'cope' && (
            <motion.div key="cope" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-slate-500 text-sm">Science-backed techniques that directly address the symptoms of PMS and PMDD. Start with whichever resonates today.</p>
              {COPING_TOOLS.map((tool, i) => (
                <div key={i} className={`rounded-2xl border p-5 shadow-sm ${tool.color}`}>
                  <button
                    className="w-full flex items-center gap-4 text-left"
                    onClick={() => setExpandedTool(expandedTool === i ? null : i)}
                  >
                    <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center text-2xl shrink-0`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-base leading-tight">{tool.title}</p>
                      <p className="text-xs text-slate-500 font-semibold">{tool.subtitle}</p>
                    </div>
                    {expandedTool === i ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {expandedTool === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-sm text-slate-600 leading-relaxed mt-4 mb-4">{tool.description}</p>
                        <Link href={tool.link}>
                          <button className="flex items-center gap-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-slate-800 transition-all">
                            Begin now <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Daily habits */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-slate-900 mb-4">Evidence-based lifestyle habits</h3>
                <div className="space-y-3">
                  {[
                    { icon: '💊', label: 'Calcium (1200mg/day)', sub: 'Shown to reduce PMS severity by up to 48% in clinical trials' },
                    { icon: '🏃', label: 'Aerobic exercise 30 min/day', sub: 'Raises serotonin and endorphins — most effective natural mood regulator' },
                    { icon: '🚫', label: 'Limit caffeine & alcohol', sub: 'Both amplify anxiety, irritability, and breast tenderness during the luteal phase' },
                    { icon: '😴', label: 'Consistent sleep schedule', sub: 'Hormonal fluctuations disrupt sleep architecture — a fixed schedule minimises impact' },
                    { icon: '🥗', label: 'Reduce salt & refined sugar', sub: 'Reduces bloating; stabilises blood glucose and energy levels during PMS window' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{h.icon}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{h.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{h.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

        {/* Bottom disclaimer */}
        <div className="mt-12 text-center pb-8">
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            This tool provides educational information and self-reflection support. It is not a substitute for medical diagnosis or treatment. If symptoms are severely impacting your life, please consult a qualified healthcare provider.
          </p>
        </div>

      </main>
    </div>
  );
}
