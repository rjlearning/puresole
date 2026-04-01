import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ActivityAnimation } from '@/components/ui/ActivityAnimations';
import { Clock, Heart, ArrowRight, Sparkles } from 'lucide-react';

import { Activity, sampleActivities } from '@/lib/activity-data';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isRecommended = searchParams.get('recommended') === 'true';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory, isRecommended]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all'
        ? '/api/activities'
        : `/api/activities?category=${selectedCategory}`;

      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.activities || data.activities.length === 0) {
        setActivities(sampleActivities);
      } else {
        const mappedActivities = data.activities.map((a: any) => ({
          ...a,
          animation_type: a.animation_type || (a.category as any) || 'default'
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error('Failed to fetch activities, falling back to samples:', error);
      // Filter samples based on category even when using fallback
      const filteredSamples = selectedCategory === 'all'
        ? sampleActivities
        : sampleActivities.filter(a => a.category === selectedCategory);
      setActivities(filteredSamples);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Activities', emoji: '✨', count: activities.length },
    { id: 'breathing', name: 'Breathing', emoji: '🫁', count: activities.filter(a => a.category === 'breathing').length },
    { id: 'meditation', name: 'Meditation', emoji: '🧘', count: activities.filter(a => a.category === 'meditation').length },
    { id: 'journaling', name: 'Journaling', emoji: '📝', count: activities.filter(a => a.category === 'journaling').length },
    { id: 'movement', name: 'Movement', emoji: '🤸', count: activities.filter(a => a.category === 'movement').length },
    { id: 'grounding', name: 'Grounding', emoji: '🌍', count: activities.filter(a => a.category === 'grounding').length },
    { id: 'somatic', name: 'Somatic Healing', emoji: '〰️', count: activities.filter(a => a.category === 'somatic').length }
  ];

  // We don't filter again here since we filter in fetch/catch for fallback
  // But for the state where api returns ALL and we filter client side:
  // If AI recommended, force a curated subset (e.g., first 3 activities)
  let displayActivities = activities;

  if (isRecommended && activities.length > 0) {
    // Mock algorithm: Pick a breathing, a grounding, and one random
    const breathing = activities.find(a => a.category === 'breathing');
    const grounding = activities.find(a => a.category === 'grounding');
    const somatic = activities.find(a => a.category === 'somatic') || activities[0];
    displayActivities = [breathing, grounding, somatic].filter(Boolean) as Activity[];
  } else if (selectedCategory !== 'all') {
    displayActivities = activities.filter(a => a.category === selectedCategory);
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'intermediate': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'advanced': return 'text-rose-700 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground pb-20">
      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-12">
        {/* Header */}
        <div className="mb-5 sm:mb-10">
          {isRecommended ? (
            <span className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3 h-3" /> AI Curated Plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-widest">
              <Heart className="w-3 h-3" /> Wellness Library
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            {isRecommended ? 'Your Prescription' : 'Explore Activities'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl">
            {isRecommended
              ? 'Based on your recent assessment, these specific exercises will provide the highest impact.'
              : 'Guided sessions to help you breathe, focus, and find your centre today.'}
          </p>
        </div>

        {/* Category Filter */}
        {!isRecommended && (
          <div className="flex gap-2 mb-6 sm:mb-10 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-semibold border ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="mr-1.5">{cat.emoji}</span>
                <span>{cat.name}</span>
                {cat.count > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{cat.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-900 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading activities...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && displayActivities.length === 0 && (
          <div className="p-16 text-center border border-dashed border-slate-200 bg-white rounded-2xl">
            <Heart className="w-8 h-8 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No activities found</h3>
            <p className="text-slate-400 text-sm">Try selecting a different category.</p>
          </div>
        )}

        {!loading && displayActivities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Voice Journal Card */}
            {!isRecommended && (selectedCategory === 'all' || selectedCategory === 'journaling') && (
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col cursor-pointer group"
                onClick={() => setLocation('/voice-journal')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                    🎙️
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-1 rounded-full">Featured</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-700 transition-colors">Voice Journal</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">Record your thoughts and let our AI analyze your emotions in real-time.</p>
                <div className="rounded-xl overflow-hidden bg-slate-50 h-32 sm:h-40 flex items-center justify-center border border-slate-100 mb-4">
                  <ActivityAnimation type="journaling" className="scale-75" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm"><Clock className="w-4 h-4" /><span>Any duration</span></div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1">Start <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            )}

            {displayActivities.map(activity => (
              <div
                key={activity.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col cursor-pointer group"
                onClick={() => setLocation(`/activities/${activity.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                    {activity.icon_emoji}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${getDifficultyColor(activity.difficulty)}`}>
                    {activity.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-700 transition-colors leading-tight">{activity.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-2">{activity.description}</p>
                <div className="rounded-xl overflow-hidden bg-slate-50 h-32 sm:h-40 flex items-center justify-center border border-slate-100 mb-4">
                  <ActivityAnimation type={activity.animation_type || 'default'} className="scale-75" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm"><Clock className="w-4 h-4" /><span>{activity.duration} min</span></div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1">Start <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
