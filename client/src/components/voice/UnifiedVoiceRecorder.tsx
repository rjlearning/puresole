import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { Mic, MicOff, Activity, Wifi, WifiOff, AlertTriangle, ChevronRight, Save, X, RefreshCw, HeartPulse, Sparkles } from 'lucide-react';
import { LiveEmotionTimeline } from '@/components/voice/LiveEmotionTimeline';
import { AuraWave } from '@/components/voice/AuraWave';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Speaking prompts to guide users
const SPEAKING_PROMPTS = [
    {
        category: 'Check-in',
        prompts: [
            'How are you feeling right now?',
            'What has been on your mind lately?',
            'Describe your energy level today.'
        ]
    },
    {
        category: 'Reflection',
        prompts: [
            'What went well today?',
            'What triggered a strong emotion recently?',
            'What are you grateful for?'
        ]
    }
];

interface EmotionUpdate {
    timestamp: number;
    primary_emotion: string;
    emotion_scores: Record<string, number>;
    emotion_confidence: number;
    valence: number;
    arousal: number;
    dominance: number;
    processingTime: number;
    status?: string;
    error?: string;
}

interface UnifiedVoiceRecorderProps {
    onSave: (data: { audioBlob: Blob; duration: number; emotions: EmotionUpdate[], notes?: string, moodBefore?: number, moodAfter?: number }) => void;
    onCancel?: () => void;
}

export function UnifiedVoiceRecorder({ onSave, onCancel }: UnifiedVoiceRecorderProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [emotionHistory, setEmotionHistory] = useState<EmotionUpdate[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<EmotionUpdate | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activePrompt, setActivePrompt] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [liveVolume, setLiveVolume] = useState(0);
    const [audioFeatures, setAudioFeatures] = useState({ centroid: 0.5, flatness: 0.5 });
    const vizFrameRef = useRef<number>();

    const socketRef = useRef<Socket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const stoppedRef = useRef(false);

    useEffect(() => {
        if (!user) return;
        const socket = io('/realtime-voice', {
            query: { userId: user.id },
            transports: ['websocket', 'polling']
        });
        socket.on('connect', () => { setIsConnected(true); setError(null); });
        socket.on('disconnect', () => { setIsConnected(false); if (isRecording) stopRecording(); });
        socket.on('session-started', (data: { sessionId: string }) => setSessionId(data.sessionId));
        socket.on('emotion-update', (update: EmotionUpdate) => {
            setCurrentEmotion(update);
            setEmotionHistory(prev => [...prev, update]);
        });
        socket.on('error', (err: { message: string }) => { if (!err.message.includes('No active session')) setError(err.message); });
        socketRef.current = socket;
        return () => {
            socket.disconnect();
            if (audioContextRef.current) try { audioContextRef.current.close(); } catch (_) { }
        };
    }, [user, isRecording]);

    useEffect(() => {
        if (isRecording) {
            recordingIntervalRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } else {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
        return () => { if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); };
    }, [isRecording]);

    const updateVisualization = useCallback(() => {
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0, weightedSum = 0, freqSum = 0, maxVal = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const valNorm = dataArray[i] / 255;
                sum += valNorm * valNorm;
                weightedSum += i * valNorm;
                freqSum += valNorm;
                if (dataArray[i] > maxVal) maxVal = dataArray[i];
            }
            const volume = Math.sqrt(sum / dataArray.length);
            const centroid = freqSum > 0 ? (weightedSum / freqSum) / dataArray.length : 0.5;
            const flatness = maxVal > 0 ? (sum / dataArray.length) / (maxVal / 255) : 0.5;
            setLiveVolume(volume);
            setAudioFeatures({ centroid, flatness });
        }
        if (isRecording) vizFrameRef.current = requestAnimationFrame(updateVisualization);
    }, [isRecording]);

    useEffect(() => {
        if (isRecording) vizFrameRef.current = requestAnimationFrame(updateVisualization);
        else { if (vizFrameRef.current) cancelAnimationFrame(vizFrameRef.current); setLiveVolume(0); }
        return () => { if (vizFrameRef.current) cancelAnimationFrame(vizFrameRef.current); };
    }, [isRecording, updateVisualization]);

    const getAudioFeatures = useCallback(() => {
        const analyserNode = analyserRef.current;
        if (!analyserNode) return null;
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        let sum = 0, weightedSum = 0, freqSum = 0, maxVal = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const valNorm = dataArray[i] / 255;
            sum += valNorm * valNorm;
            weightedSum += i * valNorm;
            freqSum += valNorm;
            if (dataArray[i] > maxVal) maxVal = dataArray[i];
        }
        const volume = Math.sqrt(sum / dataArray.length);
        const spectralCentroid = freqSum > 0 ? (weightedSum / freqSum) / dataArray.length : 0;
        const spectralFlatness = maxVal > 0 ? (sum / dataArray.length) / (maxVal / 255) : 0;
        return { volume, spectralCentroid, spectralFlatness, isSpeaking: volume > 0.04 };
    }, []);

    const startRecording = async () => {
        try {
            if (!socketRef.current?.connected) { toast({ title: "Connecting to server...", variant: "default" }); return; }
            stoppedRef.current = false; setError(null); setEmotionHistory([]); setCurrentEmotion(null); setRecordingDuration(0); audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            audioContextRef.current = audioContext; analyserRef.current = analyser;
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socketRef.current && !stoppedRef.current) {
                    const features = getAudioFeatures();
                    event.data.arrayBuffer().then(buffer => {
                        if (!stoppedRef.current && socketRef.current) {
                            socketRef.current.emit('audio-chunk', { chunk: buffer, timestamp: Date.now(), audioFeatures: features });
                        }
                    });
                    audioChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => stream.getTracks().forEach(track => track.stop());
            socketRef.current.emit('start-session', { metadata: { userAgent: navigator.userAgent } });
            await new Promise(resolve => setTimeout(resolve, 500));
            mediaRecorder.start(500);
            setIsRecording(true);
        } catch (err: any) { setError('Could not access microphone'); }
    };

    const stopRecording = () => {
        stoppedRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (audioContextRef.current) try { audioContextRef.current.close(); } catch (_) { }
        if (socketRef.current) socketRef.current.emit('end-session');
        setIsRecording(false);
    };

    const handleFinish = () => {
        stopRecording();
        setIsProcessing(true);

        // Synthesize moodBefore (1-10) and moodAfter (1-10) from AI valence data (-1 to 1)
        // This is required to populate the Voice Journal "Mood Analysis" overview cards
        let moodBefore: number | undefined;
        let moodAfter: number | undefined;

        if (emotionHistory.length > 0) {
            // Helper to convert -1 to 1 valence into a 1-10 mood score
            const valenceToScore = (val: number) => Math.max(1, Math.min(10, Math.round(((val + 1) / 2) * 9 + 1)));

            // Take the average valence of the first 30% of the session (up to 5 chunks)
            const firstChunks = emotionHistory.slice(0, Math.max(1, Math.min(5, Math.ceil(emotionHistory.length * 0.3))));
            const avgFirstValence = firstChunks.reduce((sum, e) => sum + e.valence, 0) / firstChunks.length;
            moodBefore = valenceToScore(avgFirstValence);

            // Take the average valence of the last 30% of the session (up to 5 chunks)
            const lastChunks = emotionHistory.slice(-Math.max(1, Math.min(5, Math.ceil(emotionHistory.length * 0.3))));
            const avgLastValence = lastChunks.reduce((sum, e) => sum + e.valence, 0) / lastChunks.length;
            moodAfter = valenceToScore(avgLastValence);
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave({
            audioBlob,
            duration: recordingDuration,
            emotions: emotionHistory,
            notes: activePrompt ? `Prompt: ${activePrompt}` : undefined,
            moodBefore,
            moodAfter
        });
        setIsProcessing(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[3rem] bg-slate-950 min-h-[340px] sm:min-h-[520px] flex flex-col items-center justify-center px-3 py-4 sm:p-8 shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] opacity-70" />
                {isRecording && (
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[80px]"
                        animate={{ scale: 1 + (liveVolume * 0.5), opacity: Math.max(0.2, 0.6 + liveVolume) }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                    />
                )}
                {/* Neural grid background */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            {/* Top HUD: Status & Connection — hidden on phones */}
            <div className="absolute top-3 sm:top-8 left-3 sm:left-8 right-3 sm:right-8 flex items-center justify-between z-20 hidden sm:flex">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-400 animate-pulse'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {isConnected ? 'Neural Audio Link Active' : 'Connecting to Core...'}
                    </span>
                </div>
                {error && (
                    <div className="bg-rose-500/20 text-rose-300 px-4 py-2 rounded-full text-[10px] font-bold border border-rose-500/30 backdrop-blur-md">
                        {error}
                    </div>
                )}
            </div>

            {/* Mobile-only tiny status dot */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 sm:hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{isConnected ? 'Live' : 'Connecting'}</span>
            </div>

            {/* Float HUD Elements (Left & Right) */}
            <AnimatePresence>
                {isRecording && (
                    <>
                        {/* Left HUD: Vocal Energy & Clarity */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="absolute left-4 sm:left-10 lg:left-20 top-1/2 -translate-y-1/2 z-20 space-y-4 sm:space-y-10 hidden sm:block"
                        >
                            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Tone Brightness</div>
                                <div className="text-4xl font-black text-indigo-300 font-mono tracking-tighter">
                                    {Math.round(audioFeatures.centroid * 100)}<span className="text-xl text-indigo-500/50">%</span>
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Signal Clarity</div>
                                <div className="text-4xl font-black text-emerald-300 font-mono tracking-tighter">
                                    {Math.round((1 - audioFeatures.flatness) * 100)}<span className="text-xl text-emerald-500/50">%</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right HUD: Emotion Detection */}
                        {currentEmotion && (
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                className="absolute right-4 sm:right-10 lg:right-20 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end text-right space-y-4 sm:space-y-10 hidden sm:flex"
                            >
                                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-end">
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Dominant State</div>
                                    <div className="text-3xl font-black text-white capitalize tracking-tight flex items-center justify-end gap-3 font-serif italic">
                                        <div className={`w-3 h-3 rounded-full animate-pulse shadow-xl ${currentEmotion.primary_emotion === 'happy' ? 'bg-emerald-400 shadow-emerald-400/50' :
                                            currentEmotion.primary_emotion === 'sad' ? 'bg-blue-400 shadow-blue-400/50' :
                                                currentEmotion.primary_emotion === 'anxious' ? 'bg-amber-400 shadow-amber-400/50' :
                                                    currentEmotion.primary_emotion === 'stressed' ? 'bg-rose-400 shadow-rose-400/50' :
                                                        'bg-indigo-400 shadow-indigo-400/50'
                                            }`} />
                                        {currentEmotion.primary_emotion}
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-end">
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">AI Confidence</div>
                                    <div className="text-4xl font-black text-slate-300 font-mono tracking-tighter">
                                        {(currentEmotion.emotion_confidence * 100).toFixed(0)}<span className="text-xl text-slate-600">%</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Central Orb / Visualizer */}
            <div className={`relative z-10 w-full max-w-[200px] sm:max-w-[340px] h-[200px] sm:h-[340px] flex items-center justify-center transition-all duration-700 ${isRecording ? 'scale-105' : 'scale-100'}`}>
                <AuraWave
                    isRecording={isRecording}
                    volume={liveVolume}
                    spectralCentroid={audioFeatures.centroid}
                    spectralFlatness={audioFeatures.flatness}
                    primaryEmotion={currentEmotion?.primary_emotion || (isRecording ? 'default' : 'neutral')}
                />
            </div>

            {/* Bottom Actions & Timer */}
            <div className="relative z-30 flex flex-col items-center gap-2 sm:gap-6 mt-1 sm:mt-auto">

                {/* Timer */}
                <div className="h-8 sm:h-10">
                    <AnimatePresence>
                        {(isRecording || recordingDuration > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                                className="text-3xl sm:text-5xl font-black text-white tracking-tighter font-mono"
                            >
                                {formatDuration(recordingDuration)}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Primary Action Button Tray */}
                <div className="flex items-center gap-2 sm:gap-6 bg-slate-900/60 backdrop-blur-2xl px-3 sm:px-6 py-2.5 sm:py-4 rounded-full border border-white/10">
                    <AnimatePresence>
                        {recordingDuration > 0 && !isRecording && (
                            <motion.button
                                initial={{ opacity: 0, x: 20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.5 }}
                                onClick={() => { setRecordingDuration(0); setEmotionHistory([]); audioChunksRef.current = []; setLiveVolume(0); }}
                                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        id="vocal-mirror-record-btn"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!isConnected}
                        className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl border-4 ${isRecording
                            ? 'bg-rose-500 hover:bg-rose-600 border-rose-400/50 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400/50'
                            }`}
                    >
                        {isRecording ? <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
                    </button>

                    <AnimatePresence>
                        {recordingDuration > 0 && !isRecording && (
                            <motion.button
                                initial={{ opacity: 0, x: -20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.5 }}
                                onClick={handleFinish}
                                disabled={isProcessing}
                                className="h-10 sm:h-14 px-4 sm:px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-[0.15em] uppercase text-[10px] sm:text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center border border-emerald-400 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isProcessing ? 'Syncing' : 'Analyze'}
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}
