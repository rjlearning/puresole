import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ArrowLeft, Brain, Waves, Sparkles, RefreshCw } from "lucide-react";
import { io, Socket } from 'socket.io-client';
import Logo from "@/components/Logo";

interface EmotionUpdate {
    timestamp: number;
    primary_emotion: string;
    emotion_scores: Record<string, number>;
    valence: number;
    arousal: number;
    status?: string;
}

export default function VoiceAnalyzer() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [, setLocation] = useLocation();
    const [isRecording, setIsRecording] = useState(false);
    const [analysisState, setAnalysisState] = useState<'idle' | 'recording' | 'processing' | 'results'>('idle');
    const [vocalVolume, setVocalVolume] = useState(0);
    const [insights, setInsights] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const emotionHistoryRef = useRef<EmotionUpdate[]>([]);
    const stoppedRef = useRef(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) setLocation('/auth');
        return () => stopRecordingCleanup();
    }, [isLoading, isAuthenticated, setLocation]);

    // Setup socket connection only when recording starts
    const setupSocket = () => {
        if (!user) return null;
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io('/realtime-voice', {
            query: { userId: user.id },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => { setIsConnected(true); setError(null); });
        socket.on('disconnect', () => { setIsConnected(false); });
        socket.on('error', (err: { message: string }) => { if (!err.message.includes('No active session')) setError(err.message); });
        
        socket.on('emotion-update', (update: EmotionUpdate) => {
            emotionHistoryRef.current.push(update);
        });

        socketRef.current = socket;
        return socket;
    };

    const stopRecordingCleanup = () => {
        stoppedRef.current = true;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close().catch(console.error);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (socketRef.current) {
            socketRef.current.emit('end-session');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsRecording(false);
        setIsConnected(false);
    };

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
        // Also update local visual volume
        setVocalVolume(Math.min(100, Math.max(0, volume * 100)));
        animationFrameRef.current = requestAnimationFrame(getAudioFeatures);
        
        return { volume, spectralCentroid, spectralFlatness, isSpeaking: volume > 0.04 };
    }, []);

    const startAnalyzer = async () => {
        try {
            const socket = setupSocket();
            if (!socket) throw new Error("Could not connect to analysis engine.");

            stoppedRef.current = false;
            setError(null);
            emotionHistoryRef.current = [];
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            streamRef.current = stream;

            // Setup audio context for local visualization and feature extraction
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048; // Higher res for ML matching
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            // Start animation loop for visualization and features
            getAudioFeatures();

            // Setup MediaRecorder for backend streaming
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

            socket.emit('start-session', { metadata: { source: 'voice-analyzer' } });
            await new Promise(resolve => setTimeout(resolve, 500)); // Give socket time to init
            mediaRecorder.start(500); // 500ms chunks

            setIsRecording(true);
            setAnalysisState('recording');

            // Automatically stop and process after 10 seconds
            setTimeout(() => {
                if (!stoppedRef.current) {
                    handleStopRecording();
                }
            }, 10000);

        } catch (err) {
            console.error("Microphone access denied or failed", err);
            setError("Microphone access is required for the Voice Analyzer.");
        }
    };

    const handleStopRecording = () => {
        stopRecordingCleanup();
        setAnalysisState('processing');

        // Allow some time for final chunks to process in the backend
        setTimeout(() => {
            const history = emotionHistoryRef.current;
            
            // Calculate final AI state
            let tone = "Neutral";
            let cadence = "Measured";
            let state = "Calm / Balanced";
            let recType = "Audio Visual";
            let recTitle = "Grounding Walk";
            let recDescription = "A brief exercise to center yourself.";

            if (history.length > 0) {
                // Calculate average arousal and valence
                const avgArousal = history.reduce((sum, e) => sum + e.arousal, 0) / history.length;
                const avgValence = history.reduce((sum, e) => sum + e.valence, 0) / history.length;
                
                // Find most common primary emotion
                const emotionCounts = history.reduce((acc, curr) => {
                    acc[curr.primary_emotion] = (acc[curr.primary_emotion] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];

                // Derive natural language tone
                if (avgArousal > 0.6) {
                    tone = avgValence < 0 ? "Elevated Tension" : "Excited / Activated";
                    cadence = "Rapid";
                } else if (avgArousal < 0.4) {
                    tone = avgValence < 0 ? "Subdued / Heavy" : "Relaxed / Soft";
                    cadence = "Slow / Paused";
                } else {
                    tone = "Conversational";
                    cadence = "Steady";
                }

                // Map dominant emotion to state and recommendation
                state = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
                
                if (dominantEmotion === 'anxious' || dominantEmotion === 'stressed' || avgArousal > 0.7 && avgValence < 0) {
                    state = "Anxious / Overstimulated";
                    recTitle = "Somatic Grounding Cascade";
                    recDescription = "A specialized sequence unlocked to release the specific tension patterns detected in your vocal chords.";
                } else if (dominantEmotion === 'sad' || dominantEmotion === 'tired' || avgArousal < 0.4 && avgValence < 0) {
                    state = "Depleted / Heavy";
                    recTitle = "Gentle Heart Opening";
                    recDescription = "A nourishing protocol designed to gently lift energy without overwhelming your nervous system.";
                } else if (avgArousal > 0.6 && avgValence > 0.3) {
                    state = "Activated / Joyful";
                    recTitle = "Peak Energy Anchor";
                    recDescription = "Capture and anchor this high vibration state into your nervous system memory.";
                } else {
                    state = "Calm / Balanced";
                    recTitle = "Maintenance Breaths";
                    recDescription = "A quick alignment to maintain your current baseline of calm.";
                }
            } else if (error) {
                 tone = "Analysis Failed";
                 cadence = "Unknown";
                 state = "Unable to process";
            }

            setInsights({
                tone,
                cadence,
                emotionalState: state,
                bonusUnlocked: {
                    title: recTitle,
                    duration: "3 Min",
                    type: recType,
                    description: recDescription
                }
            });
            setAnalysisState('results');
        }, 1500);
    };

    // Visual scaling based on volume
    const orbScale = 1 + (vocalVolume / 100) * 0.5;
    const orbBlur = 20 + vocalVolume;

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

            <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <Link href="/dashboard">
                    <button className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                </Link>
                <Logo size="sm" showText={true} />
                <div className="w-10 h-10" /> {/* Balancer */}
            </header>

            <div className="flex flex-col items-center justify-center min-h-screen px-6 relative z-10 pt-20 pb-12">
                <AnimatePresence mode="wait">

                    {/* STATE 1: IDLE */}
                    {analysisState === 'idle' && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-sm">
                            <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10">
                                <Waves className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-light mb-4 text-white tracking-tight">Vocal Analyzer</h1>
                            <p className="text-slate-400 leading-relaxed text-sm mb-12">
                                Speak freely for 10 seconds. The AI will analyze your vocal biomarkers—tone, cadence, and pitch—to unlock specific therapeutic content.
                            </p>
                            <button
                                onClick={startAnalyzer}
                                className="w-full py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-widest text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Mic className="w-4 h-4" /> START ANALYSIS
                            </button>
                        </motion.div>
                    )}

                    {/* STATE 2: RECORDING */}
                    {analysisState === 'recording' && (
                        <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center w-full flex flex-col items-center">
                            <h2 className="text-xl font-light text-slate-300 mb-20 animate-pulse">Listening...</h2>

                            {/* Dynamic Breathing Orb mapped to Microphone Volume */}
                            <div className="relative w-48 h-48 flex items-center justify-center mb-24">
                                <motion.div
                                    animate={{ scale: orbScale }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-indigo-500 rounded-full opacity-60 mix-blend-screen"
                                    style={{ filter: `blur(${orbBlur}px)` }}
                                />
                                <div className="absolute w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center z-10">
                                    <Mic className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <button
                                onClick={handleStopRecording}
                                className="px-8 py-4 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-black tracking-widest text-xs shadow-xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Square className="w-3 h-3 fill-white" /> STOP
                            </button>
                        </motion.div>
                    )}

                    {/* STATE 3: PROCESSING */}
                    {analysisState === 'processing' && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 mx-auto mb-8 relative flex items-center justify-center">
                                <div className="absolute inset-0 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" />
                                <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
                            </motion.div>
                            <h2 className="text-xl font-medium text-white mb-2">Extracting Biomarkers</h2>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">Analyzing tension, cadence, and energetic undertones...</p>
                        </motion.div>
                    )}

                    {/* STATE 4: RESULTS */}
                    {analysisState === 'results' && insights && (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black tracking-widest mb-6">
                                <Sparkles className="w-3 h-3" /> Biomarker Insights
                            </div>

                            <h2 className="text-3xl font-light mb-8 text-white">Diagnostics</h2>

                            <div className="space-y-3 mb-12">
                                {/* Insight Rows */}
                                {[
                                    { label: "Detected Tone", val: insights.tone },
                                    { label: "Speech Cadence", val: insights.cadence },
                                    { label: "AI Est. State", val: insights.emotionalState, alert: true }
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center ${item.alert ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                                        <span className="text-xs uppercase tracking-widest font-bold opacity-70">{item.label}</span>
                                        <span className="font-medium text-sm text-white">{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bonus Unlocked Card */}
                            <div className="relative p-6 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 border-none shadow-2xl shadow-indigo-900/50 mb-8">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="px-2 py-1 rounded bg-black/20 text-[9px] font-black uppercase tracking-widest text-indigo-200">Bonus Unlocked</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 mt-4">{insights.bonusUnlocked.title}</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed mb-6">{insights.bonusUnlocked.description}</p>

                                <button
                                    onClick={() => setLocation('/activities/somatic-1')}
                                    className="w-full py-3 bg-white text-indigo-900 font-black text-sm rounded-xl hover:scale-105 active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    <Brain className="w-4 h-4" /> Start Protocol ({insights.bonusUnlocked.duration})
                                </button>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setLocation('/voice-insights')}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" /> View Full Biomarker Dashboard
                                </button>

                                <button
                                    onClick={() => setAnalysisState('idle')}
                                    className="w-full py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Analyze Again
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

        </div>
    );
}
