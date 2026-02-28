import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { UnifiedVoiceRecorder } from "@/components/voice/UnifiedVoiceRecorder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, ArrowLeft, Clock } from "lucide-react";
import EntryCard from "@/components/flexible/EntryCard";
import { motion } from "framer-motion";

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
}

export default function VoiceJournal() {
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<VoiceEntry[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const res = await fetch('/api/voice-entries?limit=5', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const mappedEntries = (data.entries || []).map((e: any) => ({
          ...e,
          entryType: 'voice',
          title: 'Voice Note'
        }));
        setRecentEntries(mappedEntries);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("audio", data.audioBlob, "voice-entry.webm");
      formData.append("duration", data.duration.toString());

      if (data.moodBefore) formData.append("moodBefore", data.moodBefore.toString());
      if (data.moodAfter) formData.append("moodAfter", data.moodAfter.toString());
      if (data.tags && data.tags.length > 0) formData.append("tags", JSON.stringify(data.tags));
      if (data.notes) formData.append("notes", data.notes);
      if (data.emotions && data.emotions.length > 0) {
        formData.append("emotions", JSON.stringify(data.emotions));
      }

      const response = await fetch("/api/voice-entries", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to save voice entry");

      const result = await response.json();

      if (result.entry?.id) {
        fetch(`/api/analysis/process/${result.entry.id}`, {
          method: "POST",
          credentials: "include",
        }).catch(err => console.error("Analysis trigger failed:", err));
      }

      toast({
        title: "Voice entry saved!",
        description: "Your thoughts have been recorded securely. AI analysis started!",
      });

      fetchRecentEntries();
      setResetKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving voice entry:", error);
      toast({
        title: "Error saving entry",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayPause = (entry: VoiceEntry) => {
    const audioUrl = entry.audioUrl;
    if (!audioUrl) {
      toast({
        title: "Audio not available",
        description: "This entry doesn't have an audio recording",
        variant: "destructive",
      });
      return;
    }

    if (playingId === entry.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingId(entry.id);

    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      toast({
        title: "Playback error",
        description: "Could not play the audio file",
        variant: "destructive",
      });
      setPlayingId(null);
    });

    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/voice-entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setRecentEntries(prev => prev.filter(e => e.id !== id));
      if (playingId === id && audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      toast({ title: 'Entry deleted', description: 'Voice note removed successfully.' });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Could not delete', description: 'Please try again.', variant: 'destructive' });
    }
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
          <h3 className="text-xl font-bold text-slate-800 mb-2">Saving your entry...</h3>
          <p className="text-slate-600">AI analysis will begin shortly to uncover insights from your voice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg pb-24 pt-24">
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-center bg-white/30 backdrop-blur-md border-b border-white/20">
        <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Mic className="h-5 w-5 text-indigo-600" />
          Voice Journal
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto px-6 pt-32 space-y-12">
        {/* Header Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Speak your mind.<br />
            <span className="text-gradient-soft">Heal your soul.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
            Record your thoughts and let our real-time AI visualize your emotional journey as you speak.
          </p>
        </motion.div>

        {/* Unified Recorder Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel p-8 md:p-10 shadow-2xl shadow-indigo-100/40 relative overflow-hidden"
        >
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>

          <UnifiedVoiceRecorder key={resetKey} onSave={handleSave} />
        </motion.div>

        {/* Recent Entries Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Clock className="h-6 w-6 text-indigo-400" />
              Recent Entries
            </h3>
            {recentEntries.length > 0 && (
              <Button variant="link" className="text-indigo-600 font-bold text-base hover:text-indigo-700">View All</Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={{
                    id: entry.id,
                    entryType: 'voice',
                    title: entry.title || 'Voice Note',
                    recordedAt: entry.recordedAt || entry.createdAt || new Date(),
                    tags: entry.tags,
                    moodScore: entry.moodBefore,
                  }}
                  onClick={() => handlePlayPause(entry)}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-16 glass-card border-none shadow-sm">
                <Mic className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-lg">No voice entries yet.</p>
                <p className="text-slate-400 text-sm mt-2">Start a recording above to capture your first thought.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
