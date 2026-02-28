import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Trash2, Send, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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
      console.log("🎤 Starting recording...");

      // Clear any previous recording
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      audioChunksRef.current = [];

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      console.log("✅ Microphone access granted");

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📦 Audio chunk received:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("⏹️ Recording stopped, processing...");

        if (audioChunksRef.current.length === 0) {
          console.error("❌ No audio chunks recorded!");
          toast({
            title: "Recording error",
            description: "No audio data was captured. Please try again.",
            variant: "destructive",
          });
          setIsRecording(false);
          setIsPaused(false);
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("✅ Blob created:", blob.size, "bytes", blob.type);

        const url = URL.createObjectURL(blob);
        console.log("✅ Audio URL created");

        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        setIsPaused(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        toast({
          title: "✨ Recording complete",
          description: `${duration}s recorded. You can play it back or save it.`,
        });
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("❌ MediaRecorder error:", event.error);
        toast({
          title: "Recording error",
          description: "An error occurred while recording.",
          variant: "destructive",
        });
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log("▶️ Recording started");

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "🎤 Recording started",
        description: "Speak freely about your thoughts and feelings",
      });
    } catch (error: any) {
      console.error("❌ Error starting recording:", error);
      toast({
        title: "Microphone access denied",
        description: error.message || "Please allow microphone access to record",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log("🛑 Stop button clicked");

    if (!mediaRecorderRef.current) {
      console.error("❌ No media recorder found!");
      return;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    if (recorder.state === "recording" || recorder.state === "paused") {
      console.log("⏹️ Stopping recorder, state:", recorder.state);
      recorder.stop();
    } else {
      console.warn("⚠️ Recorder not in recording state:", recorder.state);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;

    if (isPaused && recorder.state === "paused") {
      recorder.resume();
      console.log("▶️ Resumed recording");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    } else if (!isPaused && recorder.state === "recording") {
      recorder.pause();
      console.log("⏸️ Paused recording");
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
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
    audioChunksRef.current = [];
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
            className="p-8"
          >
            <div className="text-center mb-10">
              <motion.div
                key={moodBefore}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-7xl mb-4"
              >
                {getMoodEmoji(moodBefore)}
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900">How are you feeling?</h3>
              <p className="text-slate-500">Drag the slider to rate your mood</p>
            </div>

            <div className="space-y-8">
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
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
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

              <div className="flex justify-between text-sm text-slate-400 px-2 font-medium">
                <span>😢 Not good</span>
                <span>😊 Great!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Interface */}
      <div className={`p-8 relative overflow-hidden transition-all duration-300 ${!isRecording && !audioBlob ? '' : 'bg-slate-50 rounded-[2rem]'}`}>
        {/* Animated background gradient */}
        {isRecording && (
          <div className="absolute inset-0 bg-red-50/50" />
        )}

        <div className="relative z-10 space-y-8">
          {/* Waveform Visualizer */}
          <div className="flex items-center justify-center gap-2 h-32">
            {waveformBars.map((height, i) => (
              <motion.div
                key={i}
                className="w-2 rounded-full bg-slate-200"
                style={{ backgroundColor: isRecording ? '#f97316' : '#e2e8f0' }}
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
            <div className={`text-6xl font-black mb-2 tabular-nums ${isRecording ? 'text-slate-900' : 'text-slate-200'}`}>
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <motion.div
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="font-bold text-red-500">
                  {isPaused ? "Paused" : "Recording in progress..."}
                </span>
              </div>
            )}
            {!isRecording && !audioBlob && (
              <div className="text-slate-400 font-medium">Ready to record</div>
            )}
          </motion.div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-6">
            {!isRecording && !audioBlob && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="w-24 h-24 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20 transition-all"
              >
                <Mic className="w-10 h-10 text-white" />
              </motion.button>
            )}

            {isRecording && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                  className="w-16 h-16 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-lg text-slate-700 hover:bg-slate-50"
                >
                  {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center text-red-500 shadow-lg hover:bg-red-100"
                >
                  <Square className="w-6 h-6 fill-current" />
                </motion.button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={playAudio}
                  className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center shadow-lg text-white hover:bg-slate-800"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteRecording}
                  className="w-16 h-16 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-lg text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100"
                >
                  <Trash2 className="w-6 h-6" />
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
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8"
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
              <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                How do you feel now?
              </h3>
              <p className="text-sm text-slate-500">Notice any changes after recording?</p>
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
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
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
                  className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl py-4 font-bold"
                >
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>Your mood improved by {moodAfter - moodBefore} points! 🎉</span>
                </motion.div>
              )}

              {moodAfter < moodBefore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-xl py-4 font-bold"
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
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Describe this moment</h3>
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
                      px-6 py-3 rounded-full font-bold text-sm transition-all
                      ${isSelected
                        ? `bg-gradient-to-r ${tag.color} text-white shadow-md`
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
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
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Additional thoughts (optional)</h3>
            <Textarea
              placeholder="Any insights or reflections you'd like to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              className="bg-slate-50 border-slate-200 text-slate-900 text-base resize-none focus:ring-orange-500/20"
            />
            <p className="text-xs text-slate-400 mt-2 text-right font-medium">
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center gap-3 text-lg font-bold py-6 shadow-xl transition-all"
          >
            <Send className="w-5 h-5" />
            Save Voice Entry
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
