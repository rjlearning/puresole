import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Trash2, Send, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
  onSave?: (data: VoiceEntryData) => void;
}

interface VoiceEntryData {
  audioBlob: Blob;
  duration: number;
  moodBefore?: number;
  moodAfter?: number;
  tags: string[];
  notes?: string;
}

export function VoiceRecorder({ onSave }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [moodBefore, setMoodBefore] = useState<number>(5);
  const [moodAfter, setMoodAfter] = useState<number>(5);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformBars, setWaveformBars] = useState([20, 40, 30, 50, 35, 45, 25, 55, 30, 40]);
  
  const recorderRef = useRef<RecordRTC | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const availableTags = [
    { label: "stressed", emoji: "😰", color: "from-red-500 to-orange-500" },
    { label: "anxious", emoji: "😟", color: "from-yellow-500 to-orange-500" },
    { label: "happy", emoji: "😊", color: "from-green-400 to-cyan-400" },
    { label: "sad", emoji: "😢", color: "from-blue-500 to-indigo-500" },
    { label: "calm", emoji: "😌", color: "from-teal-400 to-blue-400" },
    { label: "tired", emoji: "😴", color: "from-purple-400 to-pink-400" },
    { label: "energized", emoji: "⚡", color: "from-yellow-400 to-pink-400" },
    { label: "frustrated", emoji: "😤", color: "from-red-400 to-purple-500" },
    { label: "grateful", emoji: "🙏", color: "from-green-300 to-emerald-400" },
    { label: "worried", emoji: "😰", color: "from-orange-400 to-red-400" }
  ];
const triggerAnalysis = async (entryId: string) => {
  try {
    const response = await fetch(`/api/analysis/process/${entryId}`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('Analysis started for entry:', entryId);
    }
  } catch (error) {
    console.error('Failed to trigger analysis:', error);
  }
};

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Animated waveform effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      waveformRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.random() * 60 + 20));
      }, 100);
    } else {
      if (waveformRef.current) clearInterval(waveformRef.current);
      setWaveformBars([20, 40, 30, 50, 35, 45, 25, 55, 30, 40]);
    }
    return () => {
      if (waveformRef.current) clearInterval(waveformRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      // Clear any previous recording
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      recorderRef.current = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      recorderRef.current.startRecording();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "🎤 Recording started",
        description: "Speak freely about your thoughts and feelings",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) {
      console.error("No recorder reference found");
      return;
    }

    const recorder = recorderRef.current;

    // If paused, resume first before stopping
    if (isPaused) {
      recorder.resumeRecording();
    }

    // Clear timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      recorder.stopRecording(() => {
        try {
          const blob = recorder.getBlob();
          console.log("Blob created:", blob?.size || 0, "bytes", blob?.type || "unknown");

          if (!blob || blob.size === 0) {
            console.error("Empty or null blob created");
            toast({
              title: "Recording error",
              description: "No audio data captured. Please try again.",
              variant: "destructive",
            });
            setIsRecording(false);
            setIsPaused(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          console.log("Audio URL created:", url);

          // Stop all tracks
          const stream = recorder.stream;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          // Set state updates together
          setAudioBlob(blob);
          setAudioUrl(url);
          setIsRecording(false);
          setIsPaused(false);

          toast({
            title: "✨ Recording complete",
            description: `${duration}s recorded. You can play it back or save it.`,
          });
        } catch (err) {
          console.error("Error getting blob:", err);
          toast({
            title: "Recording error",
            description: "Failed to process recording. Please try again.",
            variant: "destructive",
          });
          setIsRecording(false);
          setIsPaused(false);
        }
      });
    } catch (err) {
      console.error("Error stopping recording:", err);
      toast({
        title: "Recording error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!recorderRef.current) return;
    
    if (isPaused) {
      recorderRef.current.resumeRecording();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      recorderRef.current.pauseRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  const playAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    toast({
      title: "🗑️ Recording deleted",
      description: "You can record a new entry",
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!audioBlob) {
      toast({
        title: "No recording",
        description: "Please record something first",
        variant: "destructive",
      });
      return;
    }

    const data: VoiceEntryData = {
      audioBlob,
      duration,
      moodBefore,
      moodAfter,
      tags: selectedTags,
      notes: notes.trim() || undefined,
    };

    onSave?.(data);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 3) return "😢";
    if (mood <= 5) return "😐";
    if (mood <= 7) return "🙂";
    return "😊";
  };

  const getMoodColor = (mood: number) => {
    if (mood <= 3) return "from-red-500 to-orange-500";
    if (mood <= 5) return "from-yellow-400 to-orange-400";
    if (mood <= 7) return "from-cyan-400 to-blue-400";
    return "from-green-400 to-emerald-400";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Mood Before Recording */}
      <AnimatePresence>
        {!audioBlob && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <motion.div
                key={moodBefore}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-6xl mb-3"
              >
                {getMoodEmoji(moodBefore)}
              </motion.div>
              <h3 className="text-xl font-semibold text-white">How are you feeling?</h3>
              <p className="text-sm text-gray-400">Drag the slider to rate your mood</p>
            </div>

            <div className="space-y-6">
              {/* Mood Number Buttons */}
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMoodBefore(num)}
                    className={`
                      w-9 h-9 rounded-full font-semibold text-sm transition-all
                      ${moodBefore === num
                        ? `bg-gradient-to-r ${getMoodColor(num)} text-white shadow-lg`
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                      }
                    `}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>

              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[moodBefore]}
                  onValueChange={(v) => setMoodBefore(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-400 px-2">
                <span>😢 Not good</span>
                <span>😊 Great!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Interface */}
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Animated background gradient */}
        {isRecording && (
          <div className="absolute inset-0 bg-gradient-animated opacity-10" />
        )}
        
        <div className="relative z-10 space-y-8">
          {/* Waveform Visualizer */}
          <div className="flex items-center justify-center gap-2 h-32">
            {waveformBars.map((height, i) => (
              <motion.div
                key={i}
                className="w-2 rounded-full bg-gradient-to-t from-primary to-accent"
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>

          {/* Timer Display */}
          <motion.div
            className="text-center"
            animate={{ scale: isRecording ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            <div className="text-6xl font-black gradient-text mb-2">
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <motion.div
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="font-medium">Recording in progress...</span>
              </div>
            )}
          </motion.div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {!isRecording && !audioBlob && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center glow-primary shadow-premium-lg transition-smooth"
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.button>
            )}

            {isRecording && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                  className="w-16 h-16 rounded-full glass flex items-center justify-center"
                >
                  {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30"
                >
                  <Square className="w-6 h-6 text-red-400" />
                </motion.button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playAudio}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-secondary to-blue-500 flex items-center justify-center glow-secondary shadow-premium"
                >
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteRecording}
                  className="w-16 h-16 rounded-full glass flex items-center justify-center"
                >
                  <Trash2 className="w-6 h-6 text-red-400" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>

      {/* Mood After Recording */}
      <AnimatePresence>
        {audioBlob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <motion.div
                key={moodAfter}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-6xl mb-3"
              >
                {getMoodEmoji(moodAfter)}
              </motion.div>
              <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                How do you feel now?
              </h3>
              <p className="text-sm text-gray-400">Notice any changes after recording?</p>
            </div>

            <div className="space-y-6">
              {/* Mood Number Buttons */}
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMoodAfter(num)}
                    className={`
                      w-9 h-9 rounded-full font-semibold text-sm transition-all
                      ${moodAfter === num
                        ? `bg-gradient-to-r ${getMoodColor(num)} text-white shadow-lg`
                        : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                      }
                    `}
                  >
                    {num}
                  </motion.button>
                ))}
              </div>

              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[moodAfter]}
                  onValueChange={(v) => setMoodAfter(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              {moodAfter > moodBefore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-xl py-3"
                >
                  <Zap className="w-4 h-4" />
                  <span>Your mood improved by {moodAfter - moodBefore} points! 🎉</span>
                </motion.div>
              )}

              {moodAfter < moodBefore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-purple-300 bg-purple-500/10 rounded-xl py-3"
                >
                  <span>That's okay. Expressing yourself helps. 💜</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags */}
      <AnimatePresence>
        {audioBlob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <h3 className="text-lg font-semibold mb-4">Describe this moment</h3>
            <div className="flex flex-wrap gap-3">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.label);
                return (
                  <motion.button
                    key={tag.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag.label)}
                    className={`
                      px-6 py-3 rounded-full font-medium transition-all
                      ${isSelected 
                        ? `bg-gradient-to-r ${tag.color} text-white shadow-lg` 
                        : 'glass hover:border-primary/30'
                      }
                    `}
                  >
                    <span className="mr-2">{tag.emoji}</span>
                    {tag.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <AnimatePresence>
        {audioBlob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8"
          >
            <h3 className="text-lg font-semibold mb-4">Additional thoughts (optional)</h3>
            <Textarea
              placeholder="Any insights or reflections you'd like to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              className="glass text-base resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {notes.length}/1000 characters
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <AnimatePresence>
        {audioBlob && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full btn-primary flex items-center justify-center gap-3 text-lg py-6"
          >
            <Send className="w-5 h-5" />
            Save Voice Entry
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
