import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UnifiedVoiceRecorder } from "@/components/voice/UnifiedVoiceRecorder";
import { VoiceHistoryList } from "@/components/voice/VoiceHistoryList";
import { useToast } from "@/hooks/use-toast";

import {
  Loader2, Mic, Clock, Zap, Activity, Play, Pause
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceEntry {
  id: string;
  duration: number;
  moodBefore?: number;
  moodAfter?: number;
  tags?: string[];
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

  // Fetch entries with limit 50
  const { data: entriesData, isLoading: isLoadingEntries } = useQuery<{ entries: any[] }>({
    queryKey: ["/api/voice-entries"],
    queryFn: async () => {
      const res = await fetch('/api/voice-entries?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json();
    }
  });

  const recentEntries: VoiceEntry[] = (entriesData?.entries || []).map((e: any) => ({
    ...e,
    entryType: 'voice',
    title: 'Voice Note'
  }));

  // Update current snapshot if entries change
  useEffect(() => {
    if (recentEntries.length > 0 && !sessionSnapshot && !isSaving) {
      handleSelectEntry(recentEntries[0]);
    }
  }, [entriesData, isSaving]);

  const handleSave = async (data: any) => {
    const emotionCounts: Record<string, number> = {};
    (data.emotions || []).forEach((em: any) => {
      const name = (typeof em === 'string' ? em : em.primary_emotion || em.emotion || em.label || '').toLowerCase().trim();
      if (name) emotionCounts[name] = (emotionCounts[name] || 0) + 1;
    });
    const sorted = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a);
    const topEmotion = sorted.length > 0 ? sorted[0][0] : 'neutral';

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
      toast({ title: "Error saving entry", variant: "destructive" });
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
    setTimeout(() => {
      snapshotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handlePlayPause = (entry: VoiceEntry) => {
    if (!entry.audioUrl) {
      toast({ title: "Audio not available", variant: "destructive" });
      return;
    }
    if (playingId === entry.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(entry.audioUrl);
    audioRef.current = audio;
    setPlayingId(entry.id);
    audio.play().catch(() => {
      toast({ title: "Playback error", variant: "destructive" });
      setPlayingId(null);
    });
    audio.onended = () => setPlayingId(null);
  };

  if (isSaving) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="glass-card w-full max-w-sm p-8 text-center animate-pulse-slow">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Syncing Neural Resonance...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg pb-32 flex flex-col relative overflow-x-hidden">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)' }} />

      <nav className="relative z-40 h-20 flex items-center justify-center mb-4">
        <div className="font-black tracking-widest uppercase text-slate-800 text-xs flex items-center gap-2 bg-white/40 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-white/50 shadow-sm">
          <Mic className="h-4 w-4 text-indigo-600" /> Neural Resonance
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 flex-1 flex flex-col relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <UnifiedVoiceRecorder key={resetKey} onSave={handleSave} />
        </motion.div>

        <AnimatePresence>
          {sessionSnapshot && !isSaving && (
            <div ref={snapshotRef}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mb-20"
              >
                <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-slate-800">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl w-14 h-14 flex items-center justify-center shadow-xl">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300/80 mb-1">Session Protocol</div>
                        <div className="text-white font-bold tracking-tight text-xl">
                          Dominant State: <span className="capitalize text-rose-200 italic">{sessionSnapshot.emotion}</span>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const action = VOICE_EXPERT_ACTIONS[sessionSnapshot.emotion] || VOICE_EXPERT_ACTIONS['default'];
                      return (
                        <>
                          <h3 className="text-4xl font-black mb-6 tracking-tight text-white leading-tight">
                            {action.title}
                          </h3>
                          <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium opacity-90">
                            {action.instructions}
                          </p>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/5 px-6 py-4 rounded-full text-slate-300 text-xs font-bold border border-white/5">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {action.durationMinutes} min Protocol
                            </div>
                            <Link href={`/activities/${action.activityId}`}>
                              <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                                <Activity className="w-4 h-4" /> Begin Now
                              </button>
                            </Link>
                          </div>
                        </>
                      );
                    })()}

                    {sessionSnapshot.savedEntry?.audioUrl && (
                      <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col gap-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Latest Recording Playback</div>
                        <div className="flex items-center gap-4 bg-slate-800/40 rounded-3xl p-5 border border-slate-700">
                          <button
                            onClick={() => handlePlayPause(sessionSnapshot.savedEntry!)}
                            className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg"
                          >
                            {playingId === sessionSnapshot.savedEntry.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                          </button>
                          <div className="flex-1 bg-slate-700 h-1 rounded-full overflow-hidden">
                            {playingId === sessionSnapshot.savedEntry.id && (
                              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: sessionSnapshot.savedEntry.duration }} className="h-full bg-indigo-400" />
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {Math.floor(sessionSnapshot.savedEntry.duration / 60)}:{(sessionSnapshot.savedEntry.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── RECORDING HISTORY SECTION ── */}
        <div className="mt-12 mb-24">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recording History</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review your past bio-acoustic reflections</p>
            </div>
            <div className="bg-indigo-500/10 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
              {recentEntries.length} Records
            </div>
          </div>

          {isLoadingEntries ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Repository...</p>
            </div>
          ) : (
            <VoiceHistoryList
              entries={recentEntries}
              playingId={playingId}
              onPlayPause={handlePlayPause}
            />
          )}
        </div>
      </div>
    </div>
  );
}
