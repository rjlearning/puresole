import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  PenTool,
  Heart,
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Map treatment activity type + name → best matching library activity ID
function getActivityLibraryLink(type: string, name: string): string {
  const nameLower = name.toLowerCase();

  // Name-based exact matches for well-known exercises
  if (nameLower.includes('4-7-8') || nameLower.includes('478')) return '/activities/breathing-1';
  if (nameLower.includes('box breathing') || nameLower.includes('box breath')) return '/activities/breathing-2';
  if (nameLower.includes('gratitude')) return '/activities/journaling-1';
  if (nameLower.includes('thought dump') || nameLower.includes('free writ')) return '/activities/journaling-2';
  if (nameLower.includes('body scan')) return '/activities/meditation-2';
  if (nameLower.includes('mindful') || nameLower.includes('guided')) return '/activities/meditation-1';
  if (nameLower.includes('5-4-3-2-1') || nameLower.includes('grounding') || nameLower.includes('senses')) return '/activities/grounding-1';
  if (nameLower.includes('yoga')) return '/activities/movement-1';
  if (nameLower.includes('walk')) return '/activities/movement-2';

  // Type-based fallbacks
  const typeMap: Record<string, string> = {
    meditation: '/activities/meditation-1',
    reading: '/activities/meditation-1',
    journal: '/activities/journaling-1',
    exercise: '/activities/movement-1',
    breathing: '/activities/breathing-1',
  };
  return typeMap[type] || '/activities';
}

interface Activity {
  type: 'exercise' | 'lesson' | 'journal' | 'meditation' | 'reading';
  name: string;
  description: string;
  duration: number;
  instructions: string;
}

interface TreatmentModuleProps {
  module: {
    id: string;
    title: string;
    description: string;
    week: number;
    content: {
      activities: Activity[];
      learningObjectives: string[];
    };
  };
  progressEntries: any[];
  onActivityComplete: (activityName: string, activityType: string, moduleId?: string) => void;
  isLoading: boolean;
}

export default function TreatmentModule({
  module,
  progressEntries = [],
  onActivityComplete,
  isLoading
}: TreatmentModuleProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Guard: skip if no activities
  // Normalize: handle both `name` (new) and `title` (old AI output) for backward compat
  const rawActivities = module.content?.activities || [];
  const activities: Activity[] = rawActivities.map((a: any) => ({
    ...a,
    name: a.name || a.title || '',
    duration: a.duration || a.durationMinutes || 5,
    instructions: a.instructions || a.description || '',
  }));
  const objectives: string[] = module.content?.learningObjectives || [];

  if (activities.length === 0) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'exercise': return <Heart className="h-4 w-4 text-rose-500" />;
      case 'lesson': return <BookOpen className="h-4 w-4 text-indigo-500" />;
      case 'journal': return <PenTool className="h-4 w-4 text-amber-500" />;
      case 'meditation': return <Sparkles className="h-4 w-4 text-emerald-500" />;
      case 'reading': return <BookOpen className="h-4 w-4 text-sky-500" />;
      default: return <Zap className="h-4 w-4 text-slate-400" />;
    }
  };

  const isActivityCompleted = (activityName: string) =>
    progressEntries.some(entry => entry.activityName === activityName && entry.completed);

  const toggleActivityExpansion = (index: number) => {
    const next = new Set(expandedActivities);
    if (next.has(index)) next.delete(index); else next.add(index);
    setExpandedActivities(next);
  };

  const completedCount = activities.filter(a => isActivityCompleted(a.name)).length;
  const completionPct = activities.length > 0 ? (completedCount / activities.length) * 100 : 0;

  return (
    <Card
      className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white"
      data-testid={`treatment-module-${module.id}`}
    >
      {/* ── Module Header ── */}
      <button
        className="w-full px-5 py-5 text-left hover:bg-slate-50/50 transition-colors"
        onClick={() => setIsExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h4 className="font-black text-slate-900 tracking-tight text-base leading-tight" data-testid="module-title">
                  {module.title}
                </h4>
                {completionPct === 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[9px] uppercase tracking-widest">
                    Done ✓
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm leading-snug" data-testid="module-description">
                {module.description}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 min-w-[48px]">
            <div className="text-sm font-black text-slate-900">{completedCount}/{activities.length}</div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Done</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-4 ml-11">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </button>

      {/* ── Module Content — plain conditional, no forceMount/AnimatePresence ── */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-50">

          {/* Learning Objectives */}
          {objectives.length > 0 && (
            <div data-testid="learning-objectives" className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Objectives</span>
              </div>
              <ul className="space-y-2">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Activities */}
          <div data-testid="module-activities">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Activities</span>
            </div>

            <div className="space-y-3">
              {activities.map((activity, index) => {
                const isCompleted = isActivityCompleted(activity.name);
                const isOpen = expandedActivities.has(index);

                // Guard: skip empty activities
                if (!activity.name) return null;

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-colors ${isCompleted ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-slate-100'
                      }`}
                  >
                    <div className="p-4">
                      {/* Activity row */}
                      <div className="flex items-center gap-3">
                        {/* Completion toggle */}
                        <button
                          onClick={() => !isLoading && !isCompleted && onActivityComplete(activity.name, activity.type)}
                          disabled={isLoading || isCompleted}
                          className="flex-shrink-0 transition-transform active:scale-90"
                        >
                          {isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-100">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-indigo-400 transition-colors">
                              <Circle className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                        </button>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-black text-sm leading-tight mb-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                              }`}
                            data-testid={`activity-name-${index}`}
                          >
                            {activity.name}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {activity.type && (
                              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {getActivityIcon(activity.type)}
                                {activity.type}
                              </div>
                            )}
                            {activity.duration > 0 && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                <Clock className="w-3 h-3" />
                                {activity.duration}m
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        {(activity.instructions || activity.description) && (
                          <button
                            onClick={() => toggleActivityExpansion(index)}
                            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
                              }`}
                            data-testid={`button-expand-${index}`}
                          >
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      {activity.description && (
                        <p className="text-slate-500 text-sm leading-relaxed mt-2 ml-11">
                          {activity.description}
                        </p>
                      )}

                      {/* Instructions — plain conditional, no AnimatePresence */}
                      {isOpen && activity.instructions && (
                        <div
                          className="mt-3 ml-11 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed"
                          data-testid={`activity-instructions-${index}`}
                        >
                          <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                            <ArrowRight className="w-3 h-3" /> How to do it
                          </div>
                          {activity.instructions}
                        </div>
                      )}

                      {/* Mark Complete button + Library link */}
                      {!isCompleted && (
                        <div className="mt-3 ml-11 flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => onActivityComplete(activity.name, activity.type)}
                            disabled={isLoading}
                            className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-9 px-4 font-bold text-xs w-full sm:w-auto"
                            data-testid={`button-complete-${index}`}
                          >
                            {isLoading ? "Saving..." : "Mark Complete"}
                          </Button>
                          <Link href={getActivityLibraryLink(activity.type, activity.name)}>
                            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer">
                              <ExternalLink className="w-3 h-3" /> View in Library
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
