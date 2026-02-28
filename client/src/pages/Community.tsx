import { useState, useEffect, useRef, MouseEvent } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wind,
  Brain,
  Moon,
  BookHeart,
  HeartHandshake,
  Sparkles,
  Send,
  Navigation
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MainNavigation from "@/components/MainNavigation";

const VALID_SPARKS = [
  "Someone is rooting for you today.",
  "Take a deep breath. You're doing great.",
  "You are not alone in this journey.",
  "Sending you peaceful energy.",
  "Be kind to yourself today."
];

// Interactive Ripple Interface
interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function Community() {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Interactive Network State
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveringNetwork, setHoveringNetwork] = useState(false);

  const clickCount = useRef(0);
  const lastClick = useRef(0);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds to feel "live"
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [debugMode]);

  // Randomly generate background network ripples based on active users
  useEffect(() => {
    if (!stats?.totalOnline) return;
    const interval = setInterval(() => {
      // Spawn a random ripple to simulate network activity
      if (Math.random() > 0.3) {
        spawnRandomRipple();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [stats]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/community/stats${debugMode ? '?test_mode=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch community stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const spawnRandomRipple = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const colors = ['#818CF8', '#F472B6', '#2DD4BF', '#FBBF24'];

    setRipples(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: Math.random() * width,
      y: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)]
    }].slice(-15)); // Keep max 15 on screen
  };

  const handleNetworkClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add user ripple (always gold/rose to stand out)
    setRipples(prev => [...prev, {
      id: Date.now(),
      x,
      y,
      color: '#FB7185' // Rose glow for the user's explicit interaction
    }].slice(-15));

    // Send a random spark payload to the backend
    const randomMsg = VALID_SPARKS[Math.floor(Math.random() * VALID_SPARKS.length)];
    sendSpark(randomMsg);
  };

  const sendSpark = async (message: string) => {
    try {
      await fetch('/api/community/sparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    } catch (error) {
      console.error("Failed to send spark:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden text-slate-200">
      <MainNavigation />

      <main className="flex-1 overflow-y-auto w-full md:pb-0 pb-20 pt-16 lg:pt-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          {/* INTERACTIVE NETWORK CANVAS */}
          <div
            ref={containerRef}
            onClick={handleNetworkClick}
            onMouseEnter={() => setHoveringNetwork(true)}
            onMouseLeave={() => setHoveringNetwork(false)}
            className="relative w-full h-[400px] rounded-3xl mb-12 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl shadow-indigo-500/10 cursor-pointer group"
          >
            {/* Background grid texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Dynamic Hover Glow */}
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out" />

            {/* Content Layer */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md border border-indigo-500/30">
                <Users className="w-4 h-4" />
                Live Connection Network
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                You are not alone.
              </h1>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl font-light">
                Every ripple you see is someone taking a breath, logging a thought, or sending support right now.
              </p>

              <div className={`mt-8 px-6 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-2 text-sm font-medium transition-all duration-500 ${hoveringNetwork ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Navigation className="w-4 h-4 mr-1 animate-pulse" />
                Tap anywhere to release a spark
              </div>
            </div>

            {/* Ripple Render Layer */}
            <AnimatePresence>
              {ripples.map(ripple => (
                <motion.div
                  key={ripple.id}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3, ease: "easeOut" }}
                  className="absolute rounded-full pointer-events-none mix-blend-screen"
                  style={{
                    left: ripple.x - 30, // Center the 60px circle
                    top: ripple.y - 30,
                    width: 60,
                    height: 60,
                    border: `2px solid ${ripple.color}`,
                    backgroundColor: `${ripple.color}20`,
                    boxShadow: `0 0 20px ${ripple.color}`
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Simulated Live User Dots */}
            {stats && Array.from({ length: Math.min(stats.totalOnline / 10, 30) }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, Math.random() * -20, 0],
                  opacity: [0.1, 0.5, 0.1],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Activity Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

            {/* Live Stats Header (Spans full width) */}
            <div className="lg:col-span-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${loadingStats ? 'opacity-20' : ''}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ${loadingStats ? 'bg-slate-400' : ''}`}></span>
                </span>
                <span
                  onClick={() => {
                    const now = Date.now();
                    if (now - lastClick.current < 500) {
                      clickCount.current += 1;
                      if (clickCount.current >= 3) {
                        setDebugMode(!debugMode);
                        clickCount.current = 0;
                      }
                    } else {
                      clickCount.current = 1;
                    }
                    lastClick.current = now;
                  }}
                  className="cursor-default select-none"
                >
                  Global Pulse
                </span>
              </h2>
              {stats && (
                <div className="flex items-center gap-3">
                  {debugMode && (
                    <Badge variant="outline" className="bg-amber-950 text-amber-400 border-amber-800 animate-pulse">
                      Clinical Debug Active
                    </Badge>
                  )}
                  <div className="text-sm font-medium text-slate-300 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
                    <span className="text-white font-bold">{stats.totalOnline.toLocaleString()}</span> active now
                  </div>
                </div>
              )}
            </div>

            {/* The 4 Core Activity Metrics rewritten for dark mode */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl hover:bg-slate-800/80 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                    <Wind className="w-6 h-6" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-slate-800 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-3xl font-black text-white">{stats?.breathing}</div>
                    )}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Breathing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl hover:bg-slate-800/80 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-slate-800 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-3xl font-black text-white">{stats?.meditating}</div>
                    )}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Meditating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl hover:bg-slate-800/80 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <BookHeart className="w-6 h-6" />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="h-8 w-16 bg-slate-800 rounded animate-pulse mb-1"></div>
                    ) : (
                      <div className="text-3xl font-black text-white">{stats?.journaling}</div>
                    )}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Journaling</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* SOS Notice */}
          {!loadingStats && stats?.sos > 0 && (
            <Alert className="bg-rose-500/10 border-rose-500/30 text-rose-300 mb-12 shadow-lg shadow-rose-500/5 backdrop-blur-md">
              <HeartHandshake className="h-5 w-5" />
              <AlertTitle className="text-rose-200 font-bold tracking-wide">Urgent Care Network</AlertTitle>
              <AlertDescription className="mt-2 text-rose-300/80 leading-relaxed">
                <strong>{stats.sos}</strong> people are currently using the Emergency SOS Grounding feature. The network is automatically prioritizing supportive energy their way.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Call */}
          <div className="text-center mt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 border-t border-slate-800 pt-16">
            <h3 className="text-2xl font-bold text-white mb-6">Contribute to the network</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/activities">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 py-6 h-auto text-base border border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105">
                  Start an Activity
                </Button>
              </Link>
              <Link href="/voice-journal">
                <Button variant="outline" className="rounded-full px-8 py-6 h-auto text-base bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white transition-all">
                  Voice Journal
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
