import { useState, useEffect, useRef, MouseEvent } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Wind, Brain, BookHeart, HeartHandshake, Sparkles, Send,
  Navigation, Bot, Heart, Trophy, Target, MessageCircle, Smile,
  CheckCircle2, Clock, Zap, Star, TrendingUp, Shield, UserCircle2,
  RefreshCw, PlusCircle, ChevronRight, Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MainNavigation from "@/components/MainNavigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMsg { id: number; role: "user" | "ai" | "peer"; text: string; time: string; }
interface MoodPost { id: number; emoji: string; label: string; name: string; time: string; message: string; }
interface Challenge { id: number; title: string; desc: string; participants: number; daysLeft: number; icon: string; joined: boolean; category: string; }

// ── Static data ──────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: "😊", label: "Good" }, { emoji: "😌", label: "Calm" }, { emoji: "😔", label: "Low" },
  { emoji: "😰", label: "Anxious" }, { emoji: "💪", label: "Strong" }, { emoji: "😴", label: "Tired" },
  { emoji: "🤩", label: "Excited" }, { emoji: "😤", label: "Frustrated" },
];

const COMMUNITY_MOODS: MoodPost[] = [
  { id: 1, emoji: "😊", label: "Good", name: "Alex M.", time: "2m ago", message: "Starting day 3 of my gratitude practice. Small wins!" },
  { id: 2, emoji: "💪", label: "Strong", name: "Jamie L.", time: "5m ago", message: "Did my morning body scan. Feeling centered." },
  { id: 3, emoji: "😌", label: "Calm", name: "Jordan K.", time: "9m ago", message: "Breathing exercises really help before big meetings." },
  { id: 4, emoji: "😔", label: "Low", name: "River S.", time: "14m ago", message: "Rough morning. Taking it one step at a time today 💙" },
  { id: 5, emoji: "🤩", label: "Excited", name: "Casey T.", time: "20m ago", message: "Just finished Week 1 of my pathway! 3 more to go." },
];

const AI_RESPONSES: Record<string, string[]> = {
  default: [
    "I hear you. That sounds really challenging. How long have you been feeling this way?",
    "Thank you for sharing that with me. What does a good day look like for you right now?",
    "That's completely understandable. You're being very brave by reaching out. What would feel most supportive right now?",
    "Sometimes just naming what we're feeling is a huge first step. I'm here with you. What feels heaviest today?",
    "I appreciate you trusting me with this. Let's take a slow breath together first. 🌬️",
  ],
  anxious: [
    "Anxiety can feel so overwhelming. Let's try something together — can you name 5 things you can see right now?",
    "Your nervous system is working overtime. Box breathing (4-4-4-4) can help shift that. Want to try it together?",
    "That racing feeling is your body trying to protect you — but we can gently turn the volume down. What's the biggest worry right now?",
  ],
  sad: [
    "I'm so glad you're here. Sadness deserves to be felt, not rushed. What's been weighing on you?",
    "It's okay to not be okay. You don't have to perform wellness today. I'm here.",
    "Grief and sadness take so many forms. You're allowed to rest in this. Is there anyone around you today?",
  ],
  positive: [
    "That's wonderful to hear! What helped you get to this positive place? I'd love to celebrate that with you.",
    "Your energy is contagious! Moments like these are worth anchoring — what made today feel good?",
    "Amazing! Noticing and naming what's working is such a powerful skill. Well done. 🌟",
  ],
};

const CHALLENGES_DATA: Challenge[] = [
  { id: 1, title: "7-Day Gratitude Streak", desc: "Write 3 specific things you're grateful for every day this week.", participants: 847, daysLeft: 4, icon: "🙏", joined: false, category: "Journaling" },
  { id: 2, title: "Morning Body Scan", desc: "5-min body scan meditation every morning before reaching for your phone.", participants: 612, daysLeft: 2, icon: "🧘", joined: false, category: "Meditation" },
  { id: 3, title: "Digital Sunset", desc: "No screens 60 minutes before bed for 5 days straight.", participants: 1204, daysLeft: 6, icon: "🌙", joined: true, category: "Sleep" },
  { id: 4, title: "Feelings Vocabulary", desc: "Name your emotions with precision — use the feelings wheel daily.", participants: 389, daysLeft: 10, icon: "💬", joined: false, category: "CBT" },
  { id: 5, title: "Reach Out Challenge", desc: "Contact one person you've been meaning to check in with this week.", participants: 523, daysLeft: 5, icon: "🤝", joined: false, category: "Social" },
];

const BUDDY_PROFILES = [
  { name: "Kai", pronouns: "they/them", focus: "Anxiety", shared: ["CBT", "Journaling"], status: "online", bio: "On week 3 of my pathway. Looking for an accountability partner for morning check-ins.", avatar: "🦋" },
  { name: "Priya", pronouns: "she/her", focus: "Burnout", shared: ["Meditation", "Breathing"], status: "online", bio: "Healthcare worker working on sustainable self-care routines. Daily check-ins via voice note.", avatar: "🌸" },
  { name: "Marco", pronouns: "he/him", focus: "Depression", shared: ["Movement", "CBT"], status: "away", bio: "Using the platform to build consistency. Looking for non-judgmental accountability.", avatar: "🌊" },
];

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  let pool = AI_RESPONSES.default;
  if (lower.includes("anxi") || lower.includes("panic") || lower.includes("worry")) pool = AI_RESPONSES.anxious;
  else if (lower.includes("sad") || lower.includes("depress") || lower.includes("cry") || lower.includes("down")) pool = AI_RESPONSES.sad;
  else if (lower.includes("good") || lower.includes("great") || lower.includes("happy") || lower.includes("better")) pool = AI_RESPONSES.positive;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Ripple ─────────────────────────────────────────────────────────────────
interface Ripple { id: number; x: number; y: number; color: string; }

// ══════════════════════════════════════════════════════════════════════════════
export default function Community() {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ripple
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveringNetwork, setHoveringNetwork] = useState(false);

  // tabs
  const [activeTab, setActiveTab] = useState<"chat" | "mood" | "buddy" | "challenges">("chat");

  // Support Circle chat ────────────────────────────
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: 0, role: "ai", text: "Welcome to the PureSoul Support Circle. 💙 I'm your peer support companion. Whether you want to talk, vent, or just not be alone — I'm here. How are you feeling right now?", time: timeNow() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mood Board ─────────────────────────────────────
  const [moodPosts, setMoodPosts] = useState<MoodPost[]>(COMMUNITY_MOODS);
  const [selectedMood, setSelectedMood] = useState<{ emoji: string; label: string } | null>(null);
  const [moodMessage, setMoodMessage] = useState("");
  const [moodPosted, setMoodPosted] = useState(false);

  // Challenges ─────────────────────────────────────
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES_DATA);

  // Buddy ───────────────────────────────────────────
  const [buddyRequested, setBuddyRequested] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch stats locally to avoid backend 404
    setTimeout(() => {
      setStats({
        breathing: 142,
        meditating: 89,
        journaling: 215,
        totalOnline: 1204,
        sos: 2
      });
      setLoadingStats(false);
    }, 800);
    // Remove the periodic fetch since it's mocked
  }, []);

  useEffect(() => {
    if (!stats?.totalOnline) return;
    const t = setInterval(() => { if (Math.random() > 0.3) spawnRandomRipple(); }, 2000);
    return () => clearInterval(t);
  }, [stats]);

  // Fix: Only scroll to bottom of chat smoothly when new messages arrive, 
  // and prevent it from pulling the whole window down on initial page load.
  useEffect(() => {
    if (chatMsgs.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatMsgs]);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const spawnRandomRipple = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const colors = ['#818CF8', '#F472B6', '#2DD4BF', '#FBBF24'];
    setRipples(prev => [...prev, { id: Date.now() + Math.random(), x: Math.random() * width, y: Math.random() * height, color: colors[Math.floor(Math.random() * colors.length)] }].slice(-15));
  };

  const handleNetworkClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setRipples(prev => [...prev, { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top, color: '#FB7185' }].slice(-15));
  };

  // ── Chat send ──────────────────────────────────────────────────────────────
  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", text, time: timeNow() };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => {
      const aiMsg: ChatMsg = { id: Date.now() + 1, role: "ai", text: getAIResponse(text), time: timeNow() };
      setChatMsgs(prev => [...prev, aiMsg]);
      setChatLoading(false);
    }, 900 + Math.random() * 800);
  };

  // ── Post mood ──────────────────────────────────────────────────────────────
  const postMood = () => {
    if (!selectedMood) return;
    const post: MoodPost = {
      id: Date.now(), emoji: selectedMood.emoji, label: selectedMood.label,
      name: "You", time: "just now", message: moodMessage || `Feeling ${selectedMood.label.toLowerCase()} today.`
    };
    setMoodPosts(prev => [post, ...prev]);
    setMoodPosted(true);
    setSelectedMood(null);
    setMoodMessage("");
  };

  // ── Join challenge ─────────────────────────────────────────────────────────
  const toggleChallenge = (id: number) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, joined: !c.joined, participants: c.joined ? c.participants - 1 : c.participants + 1 } : c));
  };

  const TABS = [
    { id: "chat", label: "Support Circle", icon: <MessageCircle className="w-4 h-4" /> },
    { id: "mood", label: "Mood Board", icon: <Smile className="w-4 h-4" /> },
    { id: "buddy", label: "Buddy Match", icon: <Users className="w-4 h-4" /> },
    { id: "challenges", label: "Challenges", icon: <Trophy className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden text-slate-200">
      <MainNavigation />

      <main className="flex-1 overflow-y-auto w-full md:pb-0 pb-20 pt-16 lg:pt-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          {/* ── Ripple Hero ─────────────────────────────────────────────── */}
          <div
            ref={containerRef} onClick={handleNetworkClick}
            onMouseEnter={() => setHoveringNetwork(true)} onMouseLeave={() => setHoveringNetwork(false)}
            className="relative w-full h-[280px] rounded-3xl mb-10 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl shadow-indigo-500/10 cursor-pointer group"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-4 border border-indigo-500/30">
                <Users className="w-4 h-4" /> Live Connection Network
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-md">You are not alone.</h1>
              <p className="text-slate-400 leading-relaxed max-w-xl">Every ripple you see is someone taking a breath, logging a thought, or sending support right now.</p>
              <div className={`mt-5 px-5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-2 text-sm transition-all duration-500 ${hoveringNetwork ? 'opacity-100' : 'opacity-0'}`}>
                <Navigation className="w-4 h-4 animate-pulse" /> Tap anywhere to send a spark
              </div>
            </div>
            <AnimatePresence>
              {ripples.map(r => (
                <motion.div key={r.id} initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 4, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 3, ease: "easeOut" }}
                  className="absolute rounded-full pointer-events-none mix-blend-screen"
                  style={{ left: r.x - 30, top: r.y - 30, width: 60, height: 60, border: `2px solid ${r.color}`, backgroundColor: `${r.color}20`, boxShadow: `0 0 20px ${r.color}` }} />
              ))}
            </AnimatePresence>
            {stats && Array.from({ length: Math.min(Math.floor(stats.totalOnline / 10), 20) }).map((_, i) => (
              <motion.div key={i} animate={{ y: [0, -15, 0], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
            ))}
          </div>

          {/* ── Live Stats Strip ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: <Wind className="w-5 h-5" />, color: "text-teal-400 bg-teal-500/10 border-teal-500/20", val: stats?.breathing, label: "Breathing" },
              { icon: <Brain className="w-5 h-5" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20", val: stats?.meditating, label: "Meditating" },
              { icon: <BookHeart className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", val: stats?.journaling, label: "Journaling" },
              { icon: <Activity className="w-5 h-5" />, color: "text-rose-400 bg-rose-500/10 border-rose-500/20", val: stats?.totalOnline, label: "Active Now" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  {loadingStats ? <div className="h-6 w-10 bg-slate-800 rounded animate-pulse mb-1" /> : <div className="text-2xl font-black text-white">{s.val ?? '—'}</div>}
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── SOS Alert ─────────────────────────────────────────────────── */}
          {!loadingStats && stats?.sos > 0 && (
            <Alert className="bg-rose-500/10 border-rose-500/30 text-rose-300 mb-6">
              <HeartHandshake className="h-5 w-5" />
              <AlertTitle className="text-rose-200 font-bold">Urgent Care Network Active</AlertTitle>
              <AlertDescription className="text-rose-300/80">
                <strong>{stats.sos}</strong> people are using the SOS Grounding feature. The network is prioritizing supportive energy their way.
              </AlertDescription>
            </Alert>
          )}

          {/* ══ SECTION TABS ══════════════════════════════════════════════════ */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden mb-8">

            {/* Tab bar */}
            <div className="flex border-b border-slate-800 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                {/* ══ SUPPORT CIRCLE CHAT ══════════════════════════════════════ */}
                {activeTab === "chat" && (
                  <div className="flex flex-col h-[520px]">
                    {/* AI notice */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <Bot className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-300">PureSoul AI Peer Companion is here</span>
                      <span className="ml-auto text-[10px] text-slate-500 font-medium">Peer + AI powered · Private · Safe</span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                      {chatMsgs.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm ${msg.role === "user" ? "bg-indigo-600" : "bg-slate-700 border border-slate-600"}`}>
                            {msg.role === "user" ? "👤" : "💙"}
                          </div>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"}`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-slate-500"}`}>{msg.time}</div>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-2xl bg-slate-700 border border-slate-600 flex items-center justify-center">💙</div>
                          <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                            {[0, 0.15, 0.3].map((d, i) => <div key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Quick starters */}
                    {chatMsgs.length === 1 && (
                      <div className="px-4 pb-2 flex flex-wrap gap-2">
                        {["I'm feeling anxious today", "I just need to talk", "I'm having a hard week", "I'm actually doing okay"].map(s => (
                          <button key={s} onClick={() => { setChatInput(s); }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-xs text-slate-400 hover:text-indigo-300 font-medium transition-all">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-slate-800 flex gap-3">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                        placeholder="Share what's on your mind..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                      <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
                        className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0">
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ══ MOOD BOARD ════════════════════════════════════════════════ */}
                {activeTab === "mood" && (
                  <div className="p-5 space-y-6">

                    {/* Post your mood */}
                    {!moodPosted ? (
                      <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Heart className="w-4 h-4 text-rose-400" />
                          <span className="font-bold text-slate-200 text-sm">Share your mood with the community</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {MOODS.map(m => (
                            <button key={m.label} onClick={() => setSelectedMood(m)}
                              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all border ${selectedMood?.label === m.label ? 'bg-indigo-500/30 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                              {m.emoji} {m.label}
                            </button>
                          ))}
                        </div>
                        {selectedMood && (
                          <div className="space-y-3">
                            <textarea value={moodMessage} onChange={e => setMoodMessage(e.target.value)}
                              placeholder={`Say something about feeling ${selectedMood.label.toLowerCase()}... (optional)`}
                              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none outline-none focus:border-indigo-500 h-20 transition-colors" />
                            <button onClick={postMood}
                              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all">
                              <Send className="w-4 h-4" /> Share with community
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-300 text-sm font-bold">Your mood is posted! The community sees you. 💙</span>
                      </div>
                    )}

                    {/* Community mood feed */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                        <TrendingUp className="w-3.5 h-3.5" /> Live mood feed
                      </div>
                      {moodPosts.map((post, i) => (
                        <motion.div key={post.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all">
                          <div className="w-9 h-9 rounded-2xl bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">{post.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-200 text-sm">{post.name}</span>
                              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500 py-0 h-4">{post.label}</Badge>
                              <span className="text-[10px] text-slate-600 ml-auto flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{post.time}</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{post.message}</p>
                          </div>
                          <button className="w-7 h-7 rounded-xl bg-slate-700/50 hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all flex-shrink-0">
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══ BUDDY MATCH ═══════════════════════════════════════════════ */}
                {activeTab === "buddy" && (
                  <div className="p-5 space-y-5">
                    <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-indigo-300 text-sm mb-1">Anonymous & Safe</div>
                        <div className="text-slate-400 text-xs leading-relaxed">Buddy connections are voluntary and anonymous. Real names are never shared. You can disconnect at any time.</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {BUDDY_PROFILES.map((buddy, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 hover:border-slate-600 transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">{buddy.avatar}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-black text-white">{buddy.name}</span>
                                <span className="text-slate-500 text-xs">{buddy.pronouns}</span>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ml-auto ${buddy.status === "online" ? "text-emerald-400" : "text-amber-400"}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${buddy.status === "online" ? "bg-emerald-400" : "bg-amber-400"}`} />
                                  {buddy.status}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-400 py-0 h-4">Focus: {buddy.focus}</Badge>
                                {buddy.shared.map(s => (
                                  <Badge key={s} variant="outline" className="text-[9px] border-slate-700 text-slate-500 py-0 h-4">{s}</Badge>
                                ))}
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed mb-3">{buddy.bio}</p>
                              <div className="flex gap-2">
                                {buddyRequested === i ? (
                                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4" /> Request sent! They'll respond soon.
                                  </div>
                                ) : (
                                  <>
                                    <button onClick={() => setBuddyRequested(i)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                                      <HeartHandshake className="w-3.5 h-3.5" /> Connect as Buddy
                                    </button>
                                    <button onClick={() => setActiveTab("chat")} className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 text-xs font-bold flex items-center gap-1.5 transition-all">
                                      <MessageCircle className="w-3.5 h-3.5" /> Say Hi
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* AI buddy fallback */}
                    <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="font-black text-white text-sm">AI Accountability Partner</div>
                          <div className="text-xs text-slate-400">Available 24/7 · Never judges</div>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Always online
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        Can't find a matched peer right now? Your AI partner provides daily check-ins, tracks your pathway progress together, and celebrates your wins — just like a real buddy.
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {["Daily check-ins", "Progress tracking", "Celebration moments"].map(f => (
                          <div key={f} className="text-center p-2 rounded-xl bg-slate-700/50 text-[10px] font-bold text-slate-400">
                            <Star className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" /> {f}
                          </div>
                        ))}
                      </div>
                      <Button onClick={() => setActiveTab("chat")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold h-9 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Start with AI Partner <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ══ CHALLENGES ════════════════════════════════════════════════ */}
                {activeTab === "challenges" && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" /> Community challenges
                      </div>
                      <div className="text-xs text-slate-500">{challenges.filter(c => c.joined).length} joined by you</div>
                    </div>

                    {challenges.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`rounded-2xl border p-4 transition-all ${c.joined ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${c.joined ? 'bg-indigo-500/30' : 'bg-slate-700'}`}>{c.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <div className="font-black text-white text-sm">{c.title}</div>
                                <Badge variant="outline" className={`text-[9px] py-0 h-4 mt-0.5 ${c.joined ? 'border-indigo-500/40 text-indigo-400' : 'border-slate-700 text-slate-500'}`}>{c.category}</Badge>
                              </div>
                              {c.joined && <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-black flex-shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Joined</div>}
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed mb-3">{c.desc}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.participants.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.daysLeft}d left</span>
                              </div>
                              <button onClick={() => toggleChallenge(c.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${c.joined ? 'border border-slate-600 text-slate-400 hover:border-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                                {c.joined ? <><RefreshCw className="w-3 h-3" /> Leave</> : <><PlusCircle className="w-3 h-3" /> Join</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom CTA strip ───────────────────────────────────────────── */}
          <div className="text-center border-t border-slate-800 pt-10 space-y-4">
            <h3 className="text-xl font-bold text-white">Continue your journey</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/activities">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 py-5 h-auto text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  <Zap className="w-4 h-4 mr-2" /> Activities Library
                </Button>
              </Link>
              <Link href="/treatment-plan">
                <Button variant="outline" className="rounded-full px-6 py-5 h-auto text-sm font-bold bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white">
                  <Target className="w-4 h-4 mr-2" /> My Pathway
                </Button>
              </Link>
              <Link href="/voice-journal">
                <Button variant="outline" className="rounded-full px-6 py-5 h-auto text-sm font-bold bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white">
                  <Wind className="w-4 h-4 mr-2" /> Voice Journal
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
