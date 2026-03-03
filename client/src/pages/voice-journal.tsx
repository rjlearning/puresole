import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UnifiedVoiceRecorder } from "@/components/voice/UnifiedVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Mic, Clock, Zap, Activity, Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceEntry {
  id: string;
  duration: number;
  moodBefore?: number;
  moodAfter?: number;
  tags: string[];
  recordedAt?: string;
  createdAt?: string;
  audioUrl?: string;
  ai_analysis?: any;
  entryType?: string;
  title?: string;
  emotions?: any[];
  emotionData?: any;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getMoodLabel(score: number) {
  if (score >= 8) return { label: "Flourishing", emoji: "🌟", color: "text-emerald-600" };
  if (score >= 6) return { label: "Stable", emoji: "😊", color: "text-sky-600" };
  if (score >= 4) return { label: "Neutral", emoji: "😐", color: "text-amber-600" };
  if (score >= 2) return { label: "Low", emoji: "😔", color: "text-orange-600" };
  return { label: "Struggling", emoji: "😰", color: "text-rose-600" };
}

const VOICE_EXPERT_ACTIONS: Record<string, { title: string; activityId: string; durationMinutes: number; instructions: string }> = {
  'fear': { title: '5-4-3-2-1 Grounding', activityId: 'grounding-1', durationMinutes: 3, instructions: 'Your voice indicates high arousal & tension. Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.' },
  'anger': { title: 'Box Breathing', activityId: 'breathing-2', durationMinutes: 4, instructions: 'Vocal energy is peaking. Inhale 4s → Hold 4s → Exhale 4s → Hold 4s to stimulate the vagus nerve and slow heart rate.' },
  'sadness': { title: 'Vagus Nerve Reset', activityId: 'somatic-1', durationMinutes: 4, instructions: 'Voice tone shows low energy. Use this eye-movement exercise to signal safety to your nervous system and lift your state.' },
  'sad': { title: 'Vagus Nerve Reset', activityId: 'somatic-1', durationMinutes: 4, instructions: 'Voice tone shows low energy. Use this eye-movement exercise to signal safety to your nervous system and lift your state.' },
  'joy': { title: 'Gratitude Journal', activityId: 'journaling-1', durationMinutes: 3, instructions: 'High positive resonance detected! Write down three things currently supporting you to lock in this baseline.' },
  'happy': { title: 'Gratitude Journal', activityId: 'journaling-1', durationMinutes: 3, instructions: 'High positive resonance detected! Write down three things currently supporting you to lock in this baseline.' },
  'neutral': { title: 'Mindful Breathing', activityId: 'meditation-1', durationMinutes: 2, instructions: 'Stable baseline detected. A short guided mindfulness session will reinforce this calm state.' },
  'anxious': { title: '4-7-8 Breathing', activityId: 'breathing-1', durationMinutes: 3, instructions: 'Anxiety pattern in voice detected. Inhale through your nose for 4 counts, hold for 7, exhale through your mouth for 8.' },
  'anxiety': { title: '4-7-8 Breathing', activityId: 'breathing-1', durationMinutes: 3, instructions: 'Anxiety pattern in voice detected. Inhale through your nose for 4 counts, hold for 7, exhale through your mouth for 8.' },
  'stressed': { title: 'Body Scan Meditation', activityId: 'meditation-2', durationMinutes: 5, instructions: 'Vocal stress markers detected. A full body scan will systematically release the tension held in your body.' },
  'stress': { title: 'Body Scan Meditation', activityId: 'meditation-2', durationMinutes: 5, instructions: 'Vocal stress markers detected. A full body scan will systematically release the tension held in your body.' },
  'surprised': { title: '5-4-3-2-1 Grounding', activityId: 'grounding-1', durationMinutes: 3, instructions: 'Heightened arousal detected. Grounding with your five senses will bring you back to a stable baseline.' },
  'disgusted': { title: 'Walking Meditation', activityId: 'movement-2', durationMinutes: 5, instructions: 'Voice indicates suppressed tension. A mindful walk with full sensory awareness can gently process this emotional state.' },
  'default': { title: 'Guided Mindfulness', activityId: 'meditation-1', durationMinutes: 5, instructions: 'Take a moment to center yourself with this guided mindfulness session.' }
};

function getTopEmotionFromEntry(entry: VoiceEntry): string {
  if (typeof entry.emotionData === 'string') return entry.emotionData.toLowerCase();

  const emotionSource = entry.emotionData || entry.emotions || [];
  if (!Array.isArray(emotionSource)) return 'neutral';
  if (emotionSource.length === 0) return 'neutral';

  const emotionCounts: Record<string, number> = {};
  emotionSource.forEach((em: any) => {
    const name = (typeof em === 'string' ? em : em.primary_emotion || em.emotion || em.label || '').toLowerCase().trim();
    if (name) emotionCounts[name] = (emotionCounts[name] || 0) + 1;
  });

  const sorted = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a);
  return sorted.length > 0 ? sorted[0][0] : 'neutral';
}


// ── main page ─────────────────────────────────────────────────────────────────

export default function VoiceJournal() {
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sessionSnapshot, setSessionSnapshot] = useState<{
    emotion: string;
    savedEntry: VoiceEntry | null;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const snapshotRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch entries with React Query for built-in caching and refetching
  const { data: entriesData, isLoading: isLoadingEntries } = useQuery<{ entries: any[] }>({
    queryKey: ["/api/voice-entries"],
    queryFn: async () => {
      const res = await fetch('/api/voice-entries?limit=10', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json();
    }
  });

  const recentEntries: VoiceEntry[] = (entriesData?.entries || []).map((e: any) => ({
    ...e,
    entryType: 'voice',
    title: 'Voice Note'
  }));

  // Auto-scroll to the snapshot card whenever it appears
  useEffect(() => {
    if (recentEntries.length > 0 && !sessionSnapshot && !isSaving) {
      handleSelectEntry(recentEntries[0]);
    }
  }, [entriesData, isSaving]); // Only run when entries data arrives or saving finishes

  const handleSave = async (data: any) => {
    // Extract dominant emotion from live session data immediately, before any API call
    const emotionCounts: Record<string, number> = {};
    (data.emotions || []).forEach((em: any) => {
      const name = (typeof em === 'string' ? em : em.primary_emotion || em.emotion || em.label || '').toLowerCase().trim();
      if (name) emotionCounts[name] = (emotionCounts[name] || 0) + 1;
    });
    const sorted = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a);
    const topEmotion = sorted.length > 0 ? sorted[0][0] : 'neutral';

    // Set snapshot IMMEDIATELY - don't wait for API
    setSessionSnapshot({ emotion: topEmotion, savedEntry: null });

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("audio", data.audioBlob, "voice-entry.webm");
      formData.append("duration", data.duration.toString());
      if (data.moodBefore) formData.append("moodBefore", data.moodBefore.toString());
      if (data.moodAfter) formData.append("moodAfter", data.moodAfter.toString());
      if (data.tags?.length) formData.append("tags", JSON.stringify(data.tags));
      if (data.notes) formData.append("notes", data.notes);
      if (data.emotions?.length) formData.append("emotions", JSON.stringify(data.emotions));

      const response = await fetch("/api/voice-entries", { method: "POST", body: formData, credentials: "include" });
      if (!response.ok) throw new Error("Failed to save voice entry");
      const result = await response.json();

      // Update snapshot with the actual saved entry (for audio playback URL)
      const savedEntry: VoiceEntry = {
        id: result.entry?.id || `temp-${Date.now()}`,
        duration: data.duration,
        moodBefore: data.moodBefore,
        moodAfter: data.moodAfter,
        audioUrl: result.entry?.audioUrl,
        recordedAt: new Date().toISOString(),
        tags: [],
      };
      setSessionSnapshot({ emotion: topEmotion, savedEntry });

      toast({ title: "Vocal Snapshot saved!", description: `Dominant state detected: ${topEmotion}` });
      queryClient.invalidateQueries({ queryKey: ["/api/voice-entries"] });
      setResetKey(prev => prev + 1);
    } catch (err) {
      console.error("Error saving voice entry:", err);
      toast({ title: "Error saving entry", description: "Your analysis still shows above.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEntry = (entry: VoiceEntry) => {
    const topEmotion = getTopEmotionFromEntry(entry);
    setSessionSnapshot({
      emotion: topEmotion,
      savedEntry: entry
    });

    // Reset recorder key to stop any active live session if desired
    // (Optional, keeps UI clean)
    // setResetKey(prev => prev + 1);

    // Scroll to snapshot
    setTimeout(() => {
      snapshotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handlePlayPause = (entry: VoiceEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Don't trigger handleSelectEntry if clicking play
    if (!entry.audioUrl) {
      toast({ title: "Audio not available", description: "This entry doesn't have an audio recording", variant: "destructive" });
      return;
    }
    if (playingId === entry.id && audioRef.current) { audioRef.current.pause(); setPlayingId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(entry.audioUrl);
    audioRef.current = audio;
    setPlayingId(entry.id);
    audio.play().catch(() => { toast({ title: "Playback error", variant: "destructive" }); setPlayingId(null); });
    audio.onended = () => setPlayingId(null);
  };

  if (isSaving) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="glass-card w-full max-w-sm p-8 text-center animate-pulse-slow">
          <div className="inline-block relative mb-6">
            <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-white/50 p-4 rounded-full backdrop-blur-md">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Building Vocal Snapshot...</h3>
          <p className="text-slate-600">Analyzing your vocal biomarkers and emotional intonation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg pb-24 flex flex-col relative">
      {/* Subtle animated background mesh */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)' }} />

      {/* Top Nav */}
      <nav className="relative z-40 h-12 sm:h-20 flex items-center justify-center bg-transparent mb-1 sm:mb-4">
        <div className="font-black tracking-widest uppercase text-slate-800 text-[9px] sm:text-xs flex items-center gap-1.5 sm:gap-2 bg-white/40 backdrop-blur-3xl px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full border border-white/50 shadow-sm">
          <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" /> Vocal Mirror
        </div>
      </nav>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 flex-1 flex flex-col relative z-10 self-center w-full">

        {/* ── Immersive Recorder ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col justify-center"
        >
          <UnifiedVoiceRecorder key={resetKey} onSave={handleSave} />
        </motion.div>

        {/* ── Post-Recording Snapshot (Vocal Snapshot / Expert AI Output) ── */}
        <AnimatePresence>
          {sessionSnapshot && !isSaving && (
            <div ref={snapshotRef}>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                className="mt-3 sm:mt-8 mb-24 sm:mb-32 max-w-2xl mx-auto w-full"
              >
                <div className="bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-10 relative overflow-hidden shadow-2xl border border-slate-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <div className="relative z-10">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-rose-500/30">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300/80 mb-1">Vocal Snapshot</div>
                        <div className="text-white font-bold tracking-tight text-lg">
                          Dominant State: <span className="capitalize text-rose-200 font-serif italic">{sessionSnapshot.emotion}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Action */}
                    {(() => {
                      const action = VOICE_EXPERT_ACTIONS[sessionSnapshot.emotion] || VOICE_EXPERT_ACTIONS['default'];
                      return (
                        <>
                          <h3 className="text-3xl font-black mb-4 tracking-tight text-white leading-tight">
                            {action.title}
                          </h3>
                          <p className="text-slate-300 text-base leading-relaxed mb-8 font-medium max-w-lg opacity-90">
                            {action.instructions}
                          </p>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-5 py-3 rounded-full text-slate-300 text-xs font-bold border border-white/5">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {action.durationMinutes} min Protocol
                            </div>
                            <Link href={`/activities/${action.activityId}`}>
                              <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95">
                                <Activity className="w-4 h-4" /> Begin Now
                              </button>
                            </Link>
                          </div>
                        </>
                      );
                    })()}

                    {/* Inline Audio Player */}
                    {(() => {
                      const playEntry = sessionSnapshot.savedEntry;
                      if (!playEntry?.audioUrl) return null;
                      return (
                        <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                            <span>Latest Recording</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Saved securely
                            </span>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                            <button
                              onClick={(e) => handlePlayPause(playEntry, e)}
                              className="w-10 h-10 shrink-0 rounded-full bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/50 flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/20"
                            >
                              {playingId === playEntry.id
                                ? <div className="w-3 h-3 bg-white rounded-sm animate-pulse" />
                                : <Play className="w-4 h-4 ml-0.5" />
                              }
                            </button>
                            <div className="flex-1">
                              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden relative">
                                {playingId === playEntry.id ? (
                                  <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: playEntry.duration || 60, ease: "linear" }}
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-400 rounded-full"
                                  />
                                ) : (
                                  <div className="absolute left-0 top-0 bottom-0 w-0 bg-indigo-400 rounded-full" />
                                )}
                              </div>
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-400 shrink-0">
                              {playEntry.duration
                                ? `${Math.floor(playEntry.duration / 60)}:${(playEntry.duration % 60).toString().padStart(2, '0')}`
                                : '0:00'
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Record Another button */}
                    <button
                      onClick={() => { setSessionSnapshot(null); queryClient.invalidateQueries({ queryKey: ["/api/voice-entries"] }); }}
                      className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                    >
                      Record Another
                    </button>

                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sleek Post-Recording History Strip ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-30 pointer-events-none">
        <div className="container max-w-5xl mx-auto flex items-end justify-center sm:justify-end pointer-events-none">
          <div className="flex gap-3 overflow-x-auto pb-2 pt-4 pointer-events-auto snap-x hide-scrollbar max-w-full px-4 sm:px-0">
            {recentEntries.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleSelectEntry(entry)}
                className={`snap-start flex-shrink-0 cursor-pointer group backdrop-blur-xl border shadow-lg shadow-slate-200/50 rounded-full px-5 py-3 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 ${sessionSnapshot?.savedEntry?.id === entry.id
                  ? 'bg-indigo-950/90 border-indigo-500/50 ring-2 ring-indigo-500/20'
                  : 'bg-white/70 hover:bg-white border-white/60'
                  }`}
              >
                <div
                  onClick={(e) => handlePlayPause(entry, e)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${playingId === entry.id ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}
                >
                  {playingId === entry.id
                    ? <div className="w-2.5 h-2.5 bg-white rounded-sm animate-pulse" />
                    : <Play className="w-3.5 h-3.5 ml-0.5" />
                  }
                </div>
                <div className="flex flex-col pr-2">
                  <span className={`text-sm font-black leading-none mb-1 ${sessionSnapshot?.savedEntry?.id === entry.id ? 'text-white' : 'text-slate-800'}`}>
                    {entry.recordedAt ? new Date(entry.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 leading-none flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Saved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
