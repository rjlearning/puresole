import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CleanCard } from '@/components/ui/CleanCard';
import { Badge } from '@/components/ui/badge';
import { ActivityAnimation } from '@/components/ui/ActivityAnimations';
import {
  Clock,
  Heart,
  ArrowRight
} from 'lucide-react';

import { Activity, sampleActivities } from '@/lib/activity-data';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory]);

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
  const displayActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'intermediate':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'advanced':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-muted-foreground bg-secondary border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-12">
        {/* Header */}
        <div className="mb-5 sm:mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-2 rounded-full bg-secondary/50 border-0 text-secondary-foreground font-medium tracking-wide">
            <Heart className="w-3 h-3 mr-2 text-primary" />
            Wellness Library
          </Badge>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-2 sm:mb-4 tracking-tight">
            Explore <span className="text-primary">Activities</span>
          </h1>
          <p className="text-sm sm:text-xl text-muted-foreground font-medium max-w-2xl">
            Discover guided sessions to help you breathe, focus, and find your center today.
          </p>
        </div>


        {/* Category Filter */}
        <div className="flex gap-2 mb-5 sm:mb-12 overflow-x-auto pb-2 sm:pb-4 no-scrollbar filter-strip">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full whitespace-nowrap transition-all border font-bold text-sm sm:text-md ${selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/10'
                : 'bg-card text-muted-foreground hover:bg-secondary/50 border-border hover:border-secondary'
                }`}
            >
              <span className="mr-2">{cat.emoji}</span>
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'}`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground font-medium">Curating your activities...</p>
          </div>
        )}

        {/* Activities Grid */}
        {!loading && displayActivities.length === 0 && (
          <div className="p-16 text-center border-dashed border-2 border-border bg-card rounded-3xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No activities found</h3>
            <p className="text-muted-foreground">Try selecting a different category to explore more options.</p>
          </div>
        )}

        {!loading && displayActivities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Hardcoded Voice Journal Activity */}
            {(selectedCategory === 'all' || selectedCategory === 'journaling') && (
              <CleanCard
                variant="featured"
                className="p-4 sm:p-6 flex flex-col h-full"
                onClick={() => setLocation('/voice-journal')}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-indigo-100 transition-colors duration-300">
                    🎙️
                  </div>
                  <Badge className="text-indigo-600 bg-indigo-50 border-indigo-200 border-0 px-3 py-1 rounded-full uppercase text-xs tracking-wider font-bold">
                    Featured
                  </Badge>
                </div>

                <div className="mb-auto">
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                    Voice Journal
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-base leading-relaxed mb-3 sm:mb-6 line-clamp-2">
                    Record your thoughts and let our AI analyze your emotions in real-time.
                  </p>
                </div>

                <div className="mb-3 sm:mb-6 rounded-2xl overflow-hidden bg-indigo-50/50 h-24 sm:h-48 flex items-center justify-center border border-border group-hover:border-indigo-200 transition-colors activity-preview">
                  <ActivityAnimation type="journaling" className="scale-75" />
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Any dur.</span>
                  </div>

                  <button className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </CleanCard>
            )}

            {displayActivities.map(activity => (
              <CleanCard
                key={activity.id}
                variant="interactive"
                className="p-4 sm:p-6 flex flex-col h-full group"
                onClick={() => setLocation(`/activities/${activity.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary/30 flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-secondary/60 transition-colors duration-300`}>
                    {activity.icon_emoji}
                  </div>
                  <Badge className={`${getDifficultyColor(activity.difficulty)} border-0 px-3 py-1 rounded-full uppercase text-xs tracking-wider font-bold`}>
                    {activity.difficulty}
                  </Badge>
                </div>

                {/* Content */}
                <div className="mb-auto">
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-3 group-hover:text-primary transition-colors leading-tight">
                    {activity.name}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-base leading-relaxed mb-3 sm:mb-6 line-clamp-2">
                    {activity.description}
                  </p>
                </div>

                {/* Animation Preview */}
                <div className="mb-3 sm:mb-6 rounded-2xl overflow-hidden bg-secondary/10 h-24 sm:h-48 flex items-center justify-center border border-border group-hover:border-primary/20 transition-colors activity-preview">
                  <ActivityAnimation type={activity.animation_type || 'default'} className="scale-75" />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{activity.duration} min</span>
                  </div>

                  <button className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </CleanCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
