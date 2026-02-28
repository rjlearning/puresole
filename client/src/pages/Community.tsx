import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Users,
  Wind,
  Brain,
  Moon,
  BookHeart,
  HeartHandshake,
  Sparkles,
  Send
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

export default function Community() {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [sendingSpark, setSendingSpark] = useState(false);
  const [sparkSentStatus, setSparkSentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const clickCount = useRef(0);
  const lastClick = useRef(0);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds to feel "live"
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [debugMode]);

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

  const sendSpark = async (message: string) => {
    setSendingSpark(true);
    setSparkSentStatus('idle');
    try {
      const res = await fetch('/api/community/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (res.ok) {
        setSparkSentStatus('success');
        setTimeout(() => setSparkSentStatus('idle'), 5000);
      } else {
        setSparkSentStatus('error');
      }
    } catch (error) {
      console.error("Failed to send spark:", error);
      setSparkSentStatus('error');
    } finally {
      setSendingSpark(false);
    }
  };

  return (
    <div className="flex h-screen bg-rose-50/30 overflow-hidden">
      <MainNavigation />

      <main className="flex-1 overflow-y-auto w-full md:pb-0 pb-20 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Header */}
          <div className="max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Shared Journeys
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">
              You are not alone.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
              Mental health can feel isolating, but right now, thousands of people are taking a moment to breathe, reflect, and heal alongside you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Live Stats Section (Spans 2 columns on large screens) */}
            <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
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
                    Live Network
                  </span>
                </h2>
                {stats && (
                  <div className="flex items-center gap-2">
                    {debugMode && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                        Clinical Debug Active
                      </Badge>
                    )}
                    <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                      <span className="text-slate-900 font-bold">{stats.totalOnline.toLocaleString()}</span> active now
                    </div>
                  </div>
                )}
              </div>

              {debugMode && stats?.debug && (
                <Card className="border-amber-200 bg-amber-50/50 mb-6 animate-in slide-in-from-top-2 duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Presence Engine Transparency
                      </h3>
                      <span className="text-[10px] text-amber-600 font-mono">Last Sync: {new Date(stats.debug.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(stats.debug.real).map(([key, val]: [string, any]) => (
                        <div key={key} className="bg-white/80 rounded p-2 border border-amber-100">
                          <div className="text-[10px] text-slate-500 uppercase">{key}</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-800">{((stats[key] || 0)).toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-600 font-medium">({val} verified)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (val / (stats[key] || 1)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 mt-3 italic">
                      Note: "Verified" counts represent actual user sessions in the last 15 minutes. Simulated data provides the emotional "Social Presence" base.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Breathing Stat */}
                <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/30 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                        <Wind className="w-6 h-6" />
                      </div>
                      <div>
                        {loadingStats ? (
                          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1"></div>
                        ) : (
                          <div className="text-3xl font-black text-slate-800">{stats?.breathing}</div>
                        )}
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Breathing Together</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meditating Stat */}
                <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div>
                        {loadingStats ? (
                          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1"></div>
                        ) : (
                          <div className="text-3xl font-black text-slate-800">{stats?.meditating}</div>
                        )}
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Finding Stillness</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Journaling Stat */}
                <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <BookHeart className="w-6 h-6" />
                      </div>
                      <div>
                        {loadingStats ? (
                          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1"></div>
                        ) : (
                          <div className="text-3xl font-black text-slate-800">{stats?.journaling}</div>
                        )}
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Processing Thoughts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sleeping Stat */}
                <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Moon className="w-6 h-6" />
                      </div>
                      <div>
                        {loadingStats ? (
                          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1"></div>
                        ) : (
                          <div className="text-3xl font-black text-slate-800">{stats?.sleeping}</div>
                        )}
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Resting Safely</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SOS Notice */}
              {!loadingStats && stats?.sos > 0 && (
                <Alert className="bg-rose-50 border-rose-100 text-rose-800">
                  <HeartHandshake className="h-4 w-4" />
                  <AlertTitle>Community Support</AlertTitle>
                  <AlertDescription>
                    <strong>{stats.sos}</strong> people are currently using the Emergency SOS Grounding feature. We are all sending them strength.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Send a Spark Section */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
              <Card className="border-rose-100 shadow-lg h-full bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800">Send a Spark</CardTitle>
                  <CardDescription className="text-base">
                    Anonymously send a pulse of positive energy to someone else's dashboard. You might just make their day.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {VALID_SPARKS.map((sparkMsg, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => sendSpark(sparkMsg)}
                        disabled={sendingSpark}
                        className="w-full justify-start text-left h-auto py-3 px-4 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 font-medium text-slate-700 whitespace-normal transition-all group"
                      >
                        <Send className="w-4 h-4 mr-3 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
                        {sparkMsg}
                      </Button>
                    ))}
                  </div>

                  {sparkSentStatus === 'success' && (
                    <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                      Your spark has been released into the community network!
                    </div>
                  )}
                  {sparkSentStatus === 'error' && (
                    <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium">
                      Failed to send spark. Please try again.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Call */}
          <div className="text-center mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Ready to join them?</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/activities">
                <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-8 py-6 h-auto text-base">
                  Start an Activity
                </Button>
              </Link>
              <Link href="/journal">
                <Button variant="outline" className="rounded-full px-8 py-6 h-auto text-base">
                  Write in Journal
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
