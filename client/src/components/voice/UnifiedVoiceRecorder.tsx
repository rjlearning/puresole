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
    onSave: (data: { audioBlob: Blob; duration: number; emotions: EmotionUpdate[], notes?: string }) => void;
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSave({ audioBlob, duration: recordingDuration, emotions: emotionHistory, notes: activePrompt ? `Prompt: ${activePrompt}` : undefined });
        setIsProcessing(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-12">
            {/* Left Column: Recording Controls & Visuals */}
            <div className="lg:col-span-2 space-y-8">
                {/* Recording Status & Controls */}
                <Card className="glass-panel flex flex-col items-center justify-center space-y-8 p-12 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Main Record Button */}
                        <div className="relative mb-8">
                            {isRecording && (
                                <>
                                    <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-75"></div>
                                    <motion.div
                                        className="absolute inset-0 bg-rose-400 rounded-full -z-10"
                                        animate={{ scale: 1 + (liveVolume * 1.5), opacity: Math.max(0, 0.6 - liveVolume) }}
                                        transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                    />
                                </>
                            )}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={!isConnected}
                                className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl ${isRecording
                                    ? 'bg-rose-500 hover:bg-rose-600'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                            >
                                {isRecording ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                            </button>
                        </div>

                        {/* Timer & Connection */}
                        <div className="text-center space-y-2">
                            <div className="text-6xl font-black text-slate-800 tracking-tighter">
                                {formatDuration(recordingDuration)}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                {isConnected ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                                        <Wifi className="w-4 h-4" /> Real-time Node Active
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold border border-red-100">
                                        <WifiOff className="w-4 h-4" /> Reconnecting...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {recordingDuration > 0 && !isRecording && (
                        <div className="flex gap-4 pt-8 border-t border-slate-100 w-full justify-center relative z-10">
                            <Button variant="outline" onClick={() => { setRecordingDuration(0); setEmotionHistory([]); audioChunksRef.current = []; }} className="rounded-2xl px-8 h-12 font-bold">
                                <RefreshCw className="w-4 h-4 mr-2" /> Reset
                            </Button>
                            <Button onClick={handleFinish} className="rounded-2xl px-10 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl font-bold" disabled={isProcessing}>
                                <Save className="w-4 h-4 mr-2" /> {isProcessing ? 'Processing...' : 'Sync Session'}
                            </Button>
                        </div>
                    )}

                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </Card>

                {/* Spectral Acoustic Scanner */}
                <div className="space-y-6">
                    <Card className="glass-panel p-8 overflow-hidden relative min-h-[420px]">
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-[1.5rem] ${isRecording ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                                        <Activity className={`w-6 h-6 ${isRecording ? 'text-rose-500' : 'text-indigo-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Acoustic Signal & Analysis</h3>
                                        <p className="text-sm text-slate-500 font-medium">Precision micro-biomarker mapping</p>
                                    </div>
                                </div>
                                {isRecording && (
                                    <div className="flex items-center gap-3 bg-rose-50 px-5 py-2.5 rounded-2xl border border-rose-100">
                                        <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                                        <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Spectral Capture Active</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-slate-50/50 border border-slate-100 h-[300px]">
                                    {/* Real-time Emotion Overlay */}
                                    <AnimatePresence>
                                        {currentEmotion && isRecording && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-white/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm"
                                            >
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${currentEmotion.primary_emotion === 'happy' ? 'bg-emerald-400' :
                                                        currentEmotion.primary_emotion === 'sad' ? 'bg-blue-400' :
                                                            currentEmotion.primary_emotion === 'anxious' ? 'bg-amber-400' :
                                                                currentEmotion.primary_emotion === 'stressed' ? 'bg-rose-400' :
                                                                    'bg-indigo-400'
                                                    }`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                                                    Detecting: {currentEmotion.primary_emotion}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {(currentEmotion.emotion_confidence * 100).toFixed(0)}%
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AuraWave
                                        isRecording={isRecording}
                                        volume={liveVolume}
                                        spectralCentroid={audioFeatures.centroid}
                                        spectralFlatness={audioFeatures.flatness}
                                        primaryEmotion={currentEmotion?.primary_emotion || (isRecording ? 'default' : 'neutral')}
                                    />
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                                </div>

                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-sm flex-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Neural Resonance</h4>
                                        <div className="space-y-8">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
                                                    <span>Harmonicity</span>
                                                    <span className="text-indigo-600">{Math.round(audioFeatures.centroid * 100)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400" animate={{ width: `${audioFeatures.centroid * 100}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
                                                    <span>Spectral Stability</span>
                                                    <span className="text-emerald-600">{Math.round((1 - audioFeatures.flatness) * 100)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" animate={{ width: `${(1 - audioFeatures.flatness) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-300">Biomarker Note</h4>
                                            <p className="text-sm font-medium leading-relaxed italic opacity-90">
                                                {isRecording ? "Currently parsing micro-tremors and fundamental frequency variables..." : "Ready for observation. Start recording to map your vocal state."}
                                            </p>
                                        </div>
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Timeline */}
                    {(isRecording || emotionHistory.length > 0) && (
                        <Card className="glass-panel p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                                <Activity className="w-5 h-5 text-indigo-500" /> Emotional Flux Trajectory
                            </h3>
                            <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100">
                                <LiveEmotionTimeline emotionHistory={emotionHistory} />
                            </div>
                        </Card>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-6 rounded-3xl flex items-center gap-4 border border-red-100 shadow-sm animate-shake">
                        <AlertTriangle className="w-6 h-6" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}
            </div>

            {/* Right Column: Prompts & Guidance */}
            <div className="lg:col-span-1">
                <div className="sticky top-12 space-y-6">
                    <Card className="glass-panel p-8 space-y-8">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Guidance</h3>

                        {activePrompt && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-70 text-indigo-100">Active Inquiry</p>
                                <p className="text-lg font-bold leading-tight mb-4">"{activePrompt}"</p>
                                <button onClick={() => setActivePrompt(null)} className="text-[10px] font-black uppercase bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors">
                                    Release Subject <X className="w-3 h-3 ml-2 inline" />
                                </button>
                            </motion.div>
                        )}

                        <div className="space-y-8">
                            {SPEAKING_PROMPTS.map((cat, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{cat.category}</div>
                                    <div className="flex flex-col gap-3">
                                        {cat.prompts.map((p, j) => (
                                            <button
                                                key={j}
                                                onClick={() => setActivePrompt(p)}
                                                className={`text-left p-4 rounded-2xl text-sm font-bold transition-all border ${activePrompt === p
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl'
                                                    : 'bg-white border-slate-100 hover:border-indigo-300 text-slate-600 hover:shadow-lg'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-indigo-50 border-none p-6 rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-4">
                            <HeartPulse className="w-5 h-5 text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Science of Signal</span>
                        </div>
                        <p className="text-xs text-indigo-900/70 font-medium leading-relaxed">
                            Vocal biomarkers analysis tracks micro-fluctuations in pitch, timber, and cadence to reveal latent physiological and emotional states, providing objective insight into your nervous system's balance.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
