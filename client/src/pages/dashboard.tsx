import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, Brain, Heart, Wind, Waves } from "lucide-react";

export default function AmbientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [listeningState, setListeningState] = useState<'idle' | 'listening' | 'analyzing' | 'insight'>('idle');
  const [insightText, setInsightText] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [volume, setVolume] = useState(0);

  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"], retry: false });
  const recentAssessment = assessments[0];

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Auto-start ambient listening (requires user gesture technically in some browsers, but we try)
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        setListeningState('listening');

        const updateVolume = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArrayRef.current[i];
          }
          const avg = sum / bufferLength;
          setVolume(avg);
          requestAnimationFrame(updateVolume);
        };
        updateVolume();

      } catch (err) {
        console.error("Microphone access denied or not available", err);
      }
    };

    // We simulate the zero-click ambient listening starting after a short delay
    const timer = setTimeout(() => {
      initAudio();
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isAuthenticated]);

  // Simulate an AI workflow when user stops talking (volume drops after being high)
  const talkingRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (listeningState !== 'listening') return;

    if (volume > 40) {
      talkingRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } else if (volume < 10 && talkingRef.current) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          setListeningState('analyzing');
          setTimeout(() => {
            setInsightText("I hear a bit of tension in your voice today. Would you like a 2-minute ground exercise?");
            setListeningState('insight');
          }, 3000);
        }, 2000);
      }
    }
  }, [volume, listeningState]);

  if (isLoading || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  // Dynamic colors based on volume to make it "breathe"
  const scale = 1 + (volume / 255) * 0.5;
  const blur = 40 + (volume / 255) * 60;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative" data-testid="ambient-dashboard">
      
      {/* Background Ambient Mesh */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-60">
        <motion.div 
          animate={{
            scale: scale,
            filter: `blur(${blur}px)`,
          }}
          transition={{ duration: 0.1 }}
          className="w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-rose-500 absolute"
        />
        <motion.div 
          animate={{
            scale: listeningState === 'analyzing' ? [1, 1.2, 1] : 1,
            rotate: listeningState === 'analyzing' ? 360 : 0
          }}
          transition={{ duration: 3, repeat: listeningState === 'analyzing' ? Infinity : 0 }}
          className="w-[40vw] h-[40vw] max-w-[300px] max-h-[300px] rounded-full bg-gradient-to-bl from-cyan-400 to-blue-600 absolute mix-blend-screen blur-3xl opacity-50"
        />
      </div>

      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-between p-8 pb-32">
        
        {/* Header (Minimal) */}
        <div className="w-full flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">PureSoul Ambient</p>
            <h1 className="text-xl font-black text-white mix-blend-overlay">Hello, {user?.firstName || 'there'}</h1>
          </div>
          <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-center">
             <Mic className={`w-4 h-4 ${listeningState === 'listening' ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Center interaction space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {listeningState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-lg font-light text-slate-300">Waking up...</p>
              </motion.div>
            )}

            {listeningState === 'listening' && (
              <motion.div key="listening" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <p className="text-2xl font-light text-white leading-tight">I'm listening.<br/>How are you feeling right now?</p>
                <p className="text-xs text-slate-400 mt-4 tracking-widest uppercase">Just speak naturally</p>
              </motion.div>
            )}

            {listeningState === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Brain className="w-12 h-12 text-indigo-300 mx-auto mb-4 animate-pulse" />
                <p className="text-xl font-light text-indigo-100">Analyzing focal patterns...</p>
              </motion.div>
            )}

            {listeningState === 'insight' && (
              <motion.div 
                key="insight" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
              >
                <Sparkles className="w-8 h-8 text-amber-300 mb-6 mx-auto" />
                <p className="text-xl font-medium text-white leading-relaxed mb-8">
                  "{insightText}"
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setLocation('/activities')}
                    className="w-full py-4 rounded-2xl bg-white text-slate-950 font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform"
                  >
                    Start Breathing Exercise
                  </button>
                  <button 
                    onClick={() => setListeningState('listening')}
                    className="w-full py-4 rounded-2xl bg-slate-800/50 text-slate-300 font-bold text-sm tracking-wide hover:bg-slate-800 transition-colors"
                  >
                    Keep Talking
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Context Pill (replaces old clunky cards) */}
        {recentAssessment && listeningState !== 'insight' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-24 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 px-5 py-3 rounded-full flex items-center gap-3 cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => setLocation('/assessment')}>
            <Heart className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-slate-300">Last check-in: {recentAssessment.severity.replace('_', ' ')}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
