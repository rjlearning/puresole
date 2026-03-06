import { motion } from 'framer-motion';
import { Play, Pause, Clock, Calendar, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VoiceEntry {
    id: string;
    duration: number;
    recordedAt?: string;
    createdAt?: string;
    audioUrl?: string;
    emotionData?: any;
    moodBefore?: number;
    moodAfter?: number;
    tags?: string[];
    ai_analysis?: any;
    entryType?: string;
    title?: string;
    emotions?: any[];
}

interface VoiceHistoryListProps {
    entries: VoiceEntry[];
    playingId: string | null;
    onPlayPause: (entry: VoiceEntry) => void;
    onDelete?: (id: string) => void;
}

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export function VoiceHistoryList({ entries, playingId, onPlayPause, onDelete }: VoiceHistoryListProps) {
    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-900/40 rounded-[2rem] border border-slate-800">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No saved recordings found</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {entries.map((entry, idx) => (
                <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all border ${playingId === entry.id
                        ? 'bg-indigo-950/40 border-indigo-500/30 ring-1 ring-indigo-500/20'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                >
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Play Button */}
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onPlayPause(entry)}
                            className={`w-12 h-12 rounded-full shrink-0 transition-all ${playingId === entry.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'
                                }`}
                        >
                            {playingId === entry.id ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                            )}
                        </Button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className={`font-black text-sm tracking-tight ${playingId === entry.id ? 'text-white' : 'text-slate-200'}`}>
                                    Voice Reflection
                                </h4>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Saved</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(entry.recordedAt || entry.createdAt)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(entry.recordedAt || entry.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Duration Meter */}
                        <div className="text-right hidden sm:block">
                            <p className={`text-xl font-black italic tracking-tighter leading-none mb-1 ${playingId === entry.id ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {formatDuration(entry.duration)}
                            </p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Length</p>
                        </div>

                        {/* Mobile Duration */}
                        <div className="sm:hidden text-right">
                            <span className="text-xs font-mono font-bold text-slate-400">{formatDuration(entry.duration)}</span>
                        </div>

                        {/* Delete Button */}
                        {onDelete && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this voice recording?')) {
                                        onDelete(entry.id);
                                    }
                                }}
                                className="w-10 h-10 rounded-full shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ml-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Progress Bar (Visible when playing) */}
                    {playingId === entry.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: entry.duration, ease: "linear" }}
                                className="h-full bg-indigo-500"
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
