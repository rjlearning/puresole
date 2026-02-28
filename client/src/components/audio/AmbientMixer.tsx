import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cloud,
    CloudRain,
    Waves,
    Wind,
    TreePine,
    Flame,
    Music,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Timer,
    X,
    Sparkles,
    Brain
} from 'lucide-react';

export interface SoundOption {
    id: string;
    name: string;
    icon: any;
    color: string;
    audioSrc: string;
    description: string;
}

export const soundscapes: SoundOption[] = [
    {
        id: 'rain',
        name: 'Gentle Rain',
        icon: CloudRain,
        color: 'from-blue-500 to-cyan-500',
        audioSrc: '/sounds/rain.wav',
        description: 'Soft rain on leaves'
    },
    {
        id: 'ocean',
        name: 'Ocean Waves',
        icon: Waves,
        color: 'from-teal-500 to-blue-500',
        audioSrc: '/sounds/ocean.wav',
        description: 'Calming beach waves'
    },
    {
        id: 'forest',
        name: 'Forest Night',
        icon: TreePine,
        color: 'from-green-500 to-emerald-500',
        audioSrc: '/sounds/forest.wav',
        description: 'Crickets & nature'
    },
    {
        id: 'wind',
        name: 'Soft Wind',
        icon: Wind,
        color: 'from-gray-400 to-blue-400',
        audioSrc: '/sounds/wind.wav',
        description: 'Gentle breeze'
    },
    {
        id: 'fire',
        name: 'Crackling Fire',
        icon: Flame,
        color: 'from-orange-500 to-red-500',
        audioSrc: '/sounds/fire.wav',
        description: 'Cozy fireplace'
    },
    {
        id: 'whitenoise',
        name: 'White Noise',
        icon: Cloud,
        color: 'from-purple-400 to-pink-400',
        audioSrc: '/sounds/whitenoise.wav',
        description: 'Peaceful static'
    },
];

export const melodies: SoundOption[] = [
    {
        id: 'piano',
        name: 'Deep Sleep Piano',
        icon: Music,
        color: 'from-indigo-500 to-purple-500',
        audioSrc: '/sounds/piano.wav',
        description: 'Slow, resonant keys'
    },
    {
        id: 'synth',
        name: 'Ethereal Synth',
        icon: Sparkles,
        color: 'from-fuchsia-500 to-pink-500',
        audioSrc: '/sounds/synth.wav',
        description: 'Floating dreamscapes'
    },
    {
        id: 'binaural',
        name: 'Binaural Delta',
        icon: Brain,
        color: 'from-blue-600 to-indigo-600',
        audioSrc: '/sounds/binaural.wav',
        description: 'Deep brainwave sync'
    },
    {
        id: 'soothe',
        name: 'Soothe',
        icon: Brain,
        color: 'from-pink-500 to-rose-500',
        audioSrc: '/sounds/binaural.wav',
        description: 'Deeply relaxing hum'
    },
    {
        id: 'chimes',
        name: 'Wind Chimes',
        icon: Wind,
        color: 'from-amber-400 to-orange-400',
        audioSrc: '/sounds/chimes.wav',
        description: 'Soft metallic echoes'
    },
    {
        id: 'bowl',
        name: 'Singing Bowl',
        icon: Cloud,
        color: 'from-emerald-500 to-teal-500',
        audioSrc: '/sounds/bowl.wav',
        description: 'Resonant meditation'
    }
];

export const allSounds = [...soundscapes, ...melodies];

const timerOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: 'Off', value: 0 },
];

export interface MixItem {
    id: string;
    volume: number;
}

export function AmbientMixer({ autoPlayTrack }: { autoPlayTrack?: string }) {
    const [activeMix, setActiveMix] = useState<MixItem[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [masterVolume, setMasterVolume] = useState(70);
    const [isMuted, setIsMuted] = useState(false);
    const [sleepTimer, setSleepTimer] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showTimerPicker, setShowTimerPicker] = useState(false);
    const [activeTab, setActiveTab] = useState<'sounds' | 'melodies'>('sounds');

    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Global Audio Play/Pause
    useEffect(() => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                if (!isPlaying) {
                    audio.pause();
                } else {
                    audio.play().catch(e => console.error("Playback prevented:", e));
                }
            }
        });
    }, [isPlaying]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.src = '';
                }
            });
            audioRefs.current = {};
        };
    }, []);

    // Auto-play initial track if provided
    useEffect(() => {
        if (autoPlayTrack && activeMix.length === 0) {
            handleSoundSelect(autoPlayTrack);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlayTrack]);

    // Volume Updates
    useEffect(() => {
        activeMix.forEach(item => {
            const audio = audioRefs.current[item.id];
            if (audio) {
                const itemVol = item.volume / 100;
                const masterVol = masterVolume / 100;
                audio.volume = isMuted ? 0 : (itemVol * masterVol);
            }
        });
    }, [activeMix, masterVolume, isMuted]);

    // Timer Integration
    useEffect(() => {
        if (sleepTimer > 0 && isPlaying) {
            if (timeRemaining === 0) setTimeRemaining(sleepTimer * 60);

            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsPlaying(false);
                        setSleepTimer(0);
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!sleepTimer) {
            setTimeRemaining(0);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sleepTimer, isPlaying]);

    const handleSoundSelect = async (soundId: string) => {
        const existingIndex = activeMix.findIndex(m => m.id === soundId);

        if (existingIndex >= 0) {
            const newMix = [...activeMix];
            newMix.splice(existingIndex, 1);
            setActiveMix(newMix);

            const audio = audioRefs.current[soundId];
            if (audio) {
                audio.pause();
                delete audioRefs.current[soundId];
            }

            if (newMix.length === 0) setIsPlaying(false);
        } else {
            const newMix = [...activeMix, { id: soundId, volume: 80 }];
            setActiveMix(newMix);
            setIsPlaying(true);

            setTimeout(() => {
                const audio = audioRefs.current[soundId];
                if (audio) audio.play().catch(e => console.error("Playback prevented", e));
            }, 50);
        }
    };

    const handleVolumeChange = (soundId: string, newVolume: number) => {
        setActiveMix(prev => prev.map(item =>
            item.id === soundId ? { ...item, volume: newVolume } : item
        ));
    };

    const handleStop = () => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) audio.pause();
        });
        setIsPlaying(false);
        setActiveMix([]);
        setSleepTimer(0);
        setTimeRemaining(0);
    };

    const formatTimeRemaining = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full">
            {/* Hidden Audio Elements */}
            {activeMix.map(item => {
                const soundInfo = allSounds.find(s => s.id === item.id);
                if (!soundInfo) return null;
                return (
                    <audio
                        key={item.id}
                        ref={el => {
                            if (el) {
                                audioRefs.current[item.id] = el;
                            } else {
                                delete audioRefs.current[item.id];
                            }
                        }}
                        src={soundInfo.audioSrc}
                        preload="auto"
                        loop
                    />
                );
            })}

            {/* Tabs */}
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
                <Button
                    variant="outline"
                    onClick={() => setActiveTab('sounds')}
                    className={`px-6 py-6 rounded-full text-base transition-all shadow-sm ${activeTab === 'sounds'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 border-transparent'
                        : 'bg-white text-muted-foreground hover:bg-gray-50 border-slate-200'
                        }`}
                >
                    <Wind className="mr-2 h-5 w-5" /> Environments
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setActiveTab('melodies')}
                    className={`px-6 py-6 rounded-full text-base transition-all shadow-sm ${activeTab === 'melodies'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 border-transparent'
                        : 'bg-white text-muted-foreground hover:bg-gray-50 border-slate-200'
                        }`}
                >
                    <Music className="mr-2 h-5 w-5" /> Melodies
                </Button>
            </div>

            {/* Control Panel (Current Mix) */}
            <AnimatePresence>
                {activeMix.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="glass-panel p-6 mb-8 border-indigo-100 relative overflow-hidden bg-white/60 backdrop-blur-xl"
                    >
                        {/* Header & Master Controls */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Music className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                                        Current Mix
                                        {isPlaying && (
                                            <span className="flex h-2 w-2 relative ml-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {timeRemaining > 0 ? `Stopping in ${formatTimeRemaining(timeRemaining)}` : 'Continuous Play'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-700">
                                <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)} className={`h-10 w-10 p-0 rounded-full ${isPlaying ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-1" />}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setShowTimerPicker(!showTimerPicker)} className={`h-10 rounded-full border-slate-200 ${showTimerPicker ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-slate-600 bg-white/50'}`}>
                                    <Timer className="h-4 w-4 mr-2" />
                                    {sleepTimer > 0 ? `${sleepTimer}m` : 'Timer'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleStop} className="h-10 w-10 p-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Master Volume */}
                        <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100 mb-6">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <div className="flex flex-col flex-1 pl-2">
                                <span className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Master Volume</span>
                                <Slider min={0} max={100} value={[masterVolume]} onValueChange={(v) => setMasterVolume(v[0])} className="flex-1" />
                            </div>
                        </div>

                        {/* Active Tracks List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeMix.map(item => {
                                const soundInfo = allSounds.find(s => s.id === item.id);
                                if (!soundInfo) return null;
                                const Icon = soundInfo.icon;

                                return (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${soundInfo.color}`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-sm text-slate-700 truncate">{soundInfo.name}</span>
                                                <button onClick={() => handleSoundSelect(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <Slider min={0} max={100} value={[item.volume]} onValueChange={(v) => handleVolumeChange(item.id, v[0])} className="h-2" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Timer Picker Extension */}
                        <AnimatePresence>
                            {showTimerPicker && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-indigo-50/50">
                                    <p className="text-sm font-medium text-slate-500 mb-3">Set Sleep Timer</p>
                                    <div className="flex flex-wrap gap-2">
                                        {timerOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSleepTimer(option.value);
                                                    setShowTimerPicker(false);
                                                }}
                                                className={`px-5 py-2.5 rounded-xl transition-all font-medium ${sleepTimer === option.value
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid of Options */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(activeTab === 'sounds' ? soundscapes : melodies).map((sound, index) => {
                    const Icon = sound.icon;
                    const isActive = activeMix.some(m => m.id === sound.id);

                    return (
                        <motion.button
                            key={sound.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSoundSelect(sound.id)}
                            className={`
                relative p-6 rounded-3xl transition-all text-left group overflow-hidden border
                ${isActive
                                    ? `bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-100/50 scale-[1.02]`
                                    : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-1'
                                }
              `}
                        >
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-2xl mb-4 shadow-sm flex items-center justify-center transition-all duration-500 ${isActive ? `bg-gradient-to-br ${sound.color} shadow-md shadow-indigo-200/50` : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
                                    <Icon className={`h-8 w-8 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                </div>
                                <h3 className={`font-bold text-lg mb-1 leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {sound.name}
                                </h3>
                                <p className={`text-xs ${isActive ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                                    {sound.description}
                                </p>

                                {isActive && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                                        <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}
