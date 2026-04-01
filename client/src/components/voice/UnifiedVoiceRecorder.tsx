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

    const [samples, setSamples] = useState<{ id: string; duration: number; status: 'uploading' | 'saved' | 'error' }[]>([]);
    const [isDiagnosticMode, setIsDiagnosticMode] = useState(false);

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
            // If socket isn't connected, allow recording in offline mode (no live emotion analysis)
            const isOnline = socketRef.current?.connected;
            if (!isOnline) {
                toast({ title: "Recording in offline mode", description: "Live emotion analysis unavailable, but you can still record and save.", variant: "default" });
            }
            stoppedRef.current = false; setError(null); setEmotionHistory([]); setCurrentEmotion(null); setRecordingDuration(0); audioChunksRef.current = [];

            // If starting diagnostic mode, clear previous single samples
            if (!isDiagnosticMode && samples.length > 0) setSamples([]);

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
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    if (socketRef.current?.connected && !stoppedRef.current) {
                        const features = getAudioFeatures();
                        event.data.arrayBuffer().then(buffer => {
                            if (!stoppedRef.current && socketRef.current?.connected) {
                                socketRef.current.emit('audio-chunk', { chunk: buffer, timestamp: Date.now(), audioFeatures: features });
                            }
                        });
                    }
                }
            };
            mediaRecorder.onstop = () => stream.getTracks().forEach(track => track.stop());
            if (isOnline) {
                socketRef.current!.emit('start-session', { metadata: { userAgent: navigator.userAgent } });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            mediaRecorder.start(500);
            setIsRecording(true);
        } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow mic access in your browser settings.');
            } else {
                setError('Could not access microphone');
            }
        }
    };

    const stopRecording = () => {
        stoppedRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (audioContextRef.current) try { audioContextRef.current.close(); } catch (_) { }
        if (socketRef.current) socketRef.current.emit('end-session');
        setIsRecording(false);

        // Auto-save sample to internal queue if in diagnostic mode
        if (isDiagnosticMode && audioChunksRef.current.length > 0) {
            const tempId = `sample-${Date.now()}`;
            setSamples(prev => [...prev, { id: tempId, duration: recordingDuration, status: 'uploading' }]);

            // Background upload
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            // We use the onSave prop but with a 'silent' flag if possible, or we handle it locally
            // For now, we'll just keep track of them and the user can 'Submit' all at once
            setSamples(prev => prev.map(s => s.id === tempId ? { ...s, status: 'saved' } : s));
            toast({ title: `Sample ${samples.length + 1} captured`, description: "Stored for precision analysis." });
        }
    };

    const handleFinish = () => {
        if (isRecording) stopRecording();
        setIsProcessing(true);

        // Synthesize moodBefore (1-10) and moodAfter (1-10) from AI valence data (-1 to 1)
        let moodBefore: number | undefined;
        let moodAfter: number | undefined;

        if (emotionHistory.length > 0) {
            const valenceToScore = (val: number) => Math.max(1, Math.min(10, Math.round(((val + 1) / 2) * 9 + 1)));
            const firstChunks = emotionHistory.slice(0, Math.max(1, Math.min(5, Math.ceil(emotionHistory.length * 0.3))));
            const avgFirstValence = firstChunks.reduce((sum, e) => sum + e.valence, 0) / firstChunks.length;
            moodBefore = valenceToScore(avgFirstValence);

            const lastChunks = emotionHistory.slice(-Math.max(1, Math.min(5, Math.ceil(emotionHistory.length * 0.3))));
            const avgLastValence = lastChunks.reduce((sum, e) => sum + e.valence, 0) / lastChunks.length;
            moodAfter = valenceToScore(avgLastValence);
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        onSave({
            audioBlob,
            duration: recordingDuration,
            emotions: emotionHistory,
            notes: isDiagnosticMode ? `Precision Diagnostic (${samples.length + 1} samples)` : (activePrompt ? `Prompt: ${activePrompt}` : undefined),
            moodBefore,
            moodAfter
        });

        setIsProcessing(false);
        setSamples([]);
        setIsDiagnosticMode(false);
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
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-400 animate-pulse'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {isConnected ? 'Neural Audio Link Active' : 'Connecting to Core...'}
                        </span>
                    </div>
                    {/* Diagnostic Mode Toggle */}
                    <button
                        onClick={() => {
                            if (!isRecording && samples.length === 0) setIsDiagnosticMode(!isDiagnosticMode);
                            else if (samples.length > 0) toast({ title: "Clear samples first" });
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isDiagnosticMode ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 opacity-60 hover:opacity-100'}`}
                    >
                        <HeartPulse className={`w-3.5 h-3.5 ${isDiagnosticMode ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Precision Diagnostic Mode</span>
                    </button>
                </div>
                {error && (
                    <div className="bg-rose-500/20 text-rose-300 px-4 py-2 rounded-full text-[10px] font-bold border border-rose-500/30 backdrop-blur-md">
                        {error}
                    </div>
                )}
            </div>

            {/* Mobile-only tiny status dot & Diagnostic Indicator */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 sm:hidden">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{isConnected ? 'Live' : 'Connecting'}</span>
                </div>
                {isDiagnosticMode && (
                    <div className="bg-indigo-500/40 px-2 py-0.5 rounded-full border border-indigo-400/50">
                        <span className="text-[8px] font-black text-white uppercase italic tracking-tighter">Precision Mode</span>
                    </div>
                )}
            </div>

            {/* Float HUD Elements... */}
            {/* ... */}

            {/* Central Orb / Visualizer ... */}
            <div className={`relative z-10 w-full max-w-[200px] sm:max-w-[340px] h-[200px] sm:h-[340px] flex items-center justify-center transition-all duration-700 ${isRecording ? 'scale-105' : 'scale-100'}`}>
                <AuraWave
                    isRecording={isRecording}
                    volume={liveVolume}
                    spectralCentroid={audioFeatures.centroid || 0.5}
                    spectralFlatness={audioFeatures.flatness || 0.5}
                    primaryEmotion={currentEmotion?.primary_emotion || (isRecording ? 'default' : 'neutral')}
                />

                {/* Sample Markers for Diagnostic Mode */}
                {isDiagnosticMode && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full border transition-all duration-500 ${i < samples.length ? 'bg-indigo-400 border-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-white/5 border-white/10'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions & Timer */}
            <div className="relative z-30 flex flex-col items-center gap-2 sm:gap-6 mt-1 sm:mt-auto">

                {/* Timer / Progress */}
                <div className="h-8 sm:h-10 flex flex-col items-center">
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
                    {isDiagnosticMode && samples.length > 0 && (
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">
                            {samples.length} Samples Captured / 5 Required
                        </div>
                    )}
                </div>

                {/* Primary Action Button Tray */}
                <div className="flex items-center gap-2 sm:gap-6 bg-slate-900/60 backdrop-blur-2xl px-3 sm:px-6 py-2.5 sm:py-4 rounded-full border border-white/10">
                    <AnimatePresence>
                        {(samples.length > 0 || recordingDuration > 0) && !isRecording && (
                            <motion.button
                                initial={{ opacity: 0, x: 20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.5 }}
                                onClick={() => {
                                    setRecordingDuration(0);
                                    setEmotionHistory([]);
                                    audioChunksRef.current = [];
                                    setLiveVolume(0);
                                    if (isDiagnosticMode) setSamples([]);
                                }}
                                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        id="vocal-mirror-record-btn"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={false}
                        className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl border-4 ${isRecording
                            ? 'bg-rose-500 hover:bg-rose-600 border-rose-400/50 animate-pulse'
                            : isConnected
                                ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400/50'
                                : 'bg-slate-600 hover:bg-slate-500 border-slate-500/50'
                            }`}
                    >
                        {isRecording ? <MicOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
                        {isDiagnosticMode && !isRecording && samples.length < 5 && (
                            <div className="absolute -top-1 -right-1 bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                                {samples.length + 1}
                            </div>
                        )}
                    </button>

                    <AnimatePresence>
                        {(samples.length > 0 || (recordingDuration > 0 && !isRecording)) && (
                            <motion.button
                                initial={{ opacity: 0, x: -20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.5 }}
                                onClick={handleFinish}
                                disabled={isProcessing || (isDiagnosticMode && samples.length === 0)}
                                className={`h-10 sm:h-14 px-4 sm:px-8 rounded-full font-black tracking-[0.15em] uppercase text-[10px] sm:text-xs shadow-2xl transition-all flex items-center justify-center border relative overflow-hidden group ${isDiagnosticMode
                                        ? 'bg-indigo-600 border-indigo-400 hover:bg-indigo-500 text-white'
                                        : 'bg-emerald-500 border-emerald-400 hover:bg-emerald-600 text-white'
                                    }`}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isProcessing ? 'Processing' : (isDiagnosticMode ? `Finalize Diagnostic` : 'Analyze')}
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}
