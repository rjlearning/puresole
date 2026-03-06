import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import BreathingGuide from '@/components/BreathingGuide';
import MeditationGuide from '@/components/MeditationGuide';
import GroundingGuide from '@/components/GroundingGuide';
import JournalingGuide from '@/components/JournalingGuide';
import SomaticGuide from '@/components/SomaticGuide';
import { PrepareScreen } from '@/components/PrepareScreen';
import { ActivityAnimation } from '@/components/ui/ActivityAnimations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  Star,
  Trophy,
  Volume2,
  VolumeX
} from 'lucide-react';

import { Activity, sampleActivities } from '@/lib/activity-data';
import { playChime } from '@/lib/audio';
import { AmbientMixer } from '@/components/audio/AmbientMixer';

export default function ActivityDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [effectivenessRating, setEffectivenessRating] = useState(7);
  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Prepare screen — shown before any interactive guide starts
  const [showGuide, setShowGuide] = useState(false);

  const handleGuideStart = useCallback(() => {
    // Activities can bring their own background audio through the mixer
  }, []);

  const handleGuidePause = useCallback(() => {
    // Mixer plays independently
  }, []);

  // Fetch activity details
  useEffect(() => {
    if (params.id) {
      fetchActivity(params.id);
    }
  }, [params.id]);

  const fetchActivity = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Activity not found in API');
      const data = await res.json();
      setActivity(data.activity);
      const durationSeconds = data.activity.duration * 60;
      setTimeRemaining(durationSeconds);
      setTotalTime(durationSeconds);
    } catch (error) {
      console.warn('Failed to fetch activity from API, trying local fallback:', error);

      // FALLBACK: Try to find in sample activities
      const fallbackActivity = sampleActivities.find(a => a.id === id);

      if (fallbackActivity) {
        setActivity(fallbackActivity);
        const durationSeconds = fallbackActivity.duration * 60;
        setTimeRemaining(durationSeconds);
        setTotalTime(durationSeconds);
      } else {
        console.error('Activity not found in local fallback either');
        toast({
          title: "Error",
          description: "Could not load activity details",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            setShowCompletionModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!timerActive) {
      setTimerActive(true);
      playChime();
    } else {
      setTimerActive(false);
    }
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(totalTime);
  };

  const finishEarly = () => {
    setTimerActive(false);
    playChime();
    setShowCompletionModal(true);
  };

  const handleComplete = async () => {
    if (!activity) return;

    setSubmitting(true);
    try {
      const actualDuration = Math.round((totalTime - timeRemaining) / 60);

      const res = await fetch(`/api/activities/${activity.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          duration_actual: actualDuration,
          effectiveness_rating: effectivenessRating,
          notes: completionNotes
        })
      });

      if (!res.ok) throw new Error('Failed to complete activity');

      const data = await res.json();
      setPointsEarned(data.points_earned || 10);

      toast({
        title: "Activity Completed!",
        description: `You earned ${data.points_earned || 10} points!`,
      });

      // Brief delay to show success, then redirect to dashboard to close the loop
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1200);

    } catch (error) {
      console.error('Failed to complete activity:', error);
      toast({
        title: "Error",
        description: "Could not save your progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center">
            <p className="text-white text-xl mb-4">Activity not found</p>
            <Button onClick={() => setLocation('/activities')} className="bg-purple-500 hover:bg-purple-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 relative">

      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/activities')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activities
          </Button>
        </div>

        {/* Activity Header */}
        <div className="mb-8 relative overflow-hidden rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl group">
          <div className={`absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${activity.category === 'breathing' ? 'from-teal-400 to-emerald-400' :
            activity.category === 'meditation' ? 'from-purple-400 to-fuchsia-400' :
              activity.category === 'grounding' ? 'from-amber-400 to-orange-400' :
                activity.category === 'journaling' ? 'from-indigo-400 to-purple-400' :
                  'from-slate-200 to-gray-200'
            }`}></div>

          <div className="relative p-8 md:p-10 bg-white/40 backdrop-blur-sm border border-white/50 rounded-3xl">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className={`text-7xl p-6 rounded-2xl shadow-lg border border-white/60 bg-gradient-to-br ${activity.category === 'breathing' ? 'from-teal-50 to-emerald-50 text-teal-600' :
                activity.category === 'meditation' ? 'from-purple-50 to-fuchsia-50 text-purple-600' :
                  activity.category === 'grounding' ? 'from-amber-50 to-orange-50 text-amber-600' :
                    activity.category === 'journaling' ? 'from-indigo-50 to-purple-50 text-indigo-600' :
                      activity.category === 'somatic' ? 'from-emerald-50 to-teal-50 text-emerald-600' :
                        'from-slate-50 to-gray-50 text-slate-600'
                }`}>
                {activity.icon_emoji}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 tracking-tight">
                    {activity.name}
                  </h1>
                  <p className="text-xl text-slate-600/90 leading-relaxed font-medium max-w-2xl">
                    {activity.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                    <Clock className="mr-2 h-4 w-4 text-slate-300" />
                    {activity.duration} min
                  </span>
                  <span className={`flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md border ${activity.difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200' :
                    activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    } capitalize`}>
                    <Zap className="mr-2 h-4 w-4" />
                    {activity.difficulty}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md border capitalize bg-white/80 text-foreground border-white/60`}>
                    {activity.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Breathing Guide */}
        {activity.category === 'breathing' && (
          showGuide ? (
            <BreathingGuide
              type={activity.name.includes('4-7-8') ? '4-7-8' : 'box'}
              onComplete={() => setShowCompletionModal(true)}
              onStart={handleGuideStart}
              onPause={handleGuidePause}
            />
          ) : (
            <PrepareScreen
              category="breathing"
              activityName={activity.name}
              duration={activity.duration}
              onReady={() => setShowGuide(true)}
            />
          )
        )}

        {/* Interactive Meditation Guide */}
        {activity.category === 'meditation' && (
          showGuide ? (
            <MeditationGuide
              type={activity.name.toLowerCase().includes('body') ? 'body-scan' : 'mindfulness'}
              duration={activity.duration}
              onComplete={() => setShowCompletionModal(true)}
              onStart={handleGuideStart}
              onPause={handleGuidePause}
            />
          ) : (
            <PrepareScreen
              category="meditation"
              activityName={activity.name}
              duration={activity.duration}
              onReady={() => setShowGuide(true)}
            />
          )
        )}

        {/* Interactive Grounding Guide */}
        {activity.category === 'grounding' && activity.name.includes('5-4-3-2-1') && (
          showGuide ? (
            <GroundingGuide
              onComplete={() => setShowCompletionModal(true)}
              onStart={handleGuideStart}
              onPause={handleGuidePause}
            />
          ) : (
            <PrepareScreen
              category="grounding"
              activityName={activity.name}
              duration={activity.duration}
              onReady={() => setShowGuide(true)}
            />
          )
        )}

        {/* Interactive Journaling Guide */}
        {activity.category === 'journaling' && (
          showGuide ? (
            <JournalingGuide
              type={
                activity.name.toLowerCase().includes('gratitude') ? 'gratitude' :
                  activity.name.toLowerCase().includes('stress') ? 'stress' :
                    'reflection'
              }
              onComplete={() => setShowCompletionModal(true)}
              onStart={handleGuideStart}
              onPause={handleGuidePause}
            />
          ) : (
            <PrepareScreen
              category="journaling"
              activityName={activity.name}
              duration={activity.duration}
              onReady={() => setShowGuide(true)}
            />
          )
        )}

        {/* Interactive Somatic Guide */}
        {activity.category === 'somatic' && (
          showGuide ? (
            <SomaticGuide
              type={activity.name.toLowerCase().includes('vagus') ? 'vagus-reset' : 'tension-release'}
              duration={activity.duration}
              onComplete={() => setShowCompletionModal(true)}
              onStart={handleGuideStart}
              onPause={handleGuidePause}
            />
          ) : (
            <PrepareScreen
              category="somatic"
              activityName={activity.name}
              duration={activity.duration}
              onReady={() => setShowGuide(true)}
            />
          )
        )}

        {/* Activity Animation */}
        <div className="mb-8 p-6 bg-card rounded-xl border border-border shadow-sm">
          <ActivityAnimation type={activity.animation_type || 'default'} />
        </div>

        {/* Regular Timer Section for non-interactive activities */}
        {activity.category !== 'breathing' &&
          activity.category !== 'meditation' &&
          !(activity.category === 'grounding' && activity.name.includes('5-4-3-2-1')) &&
          activity.category !== 'journaling' &&
          activity.category !== 'somatic' && (
            <Card className="bg-card border-border shadow-sm mb-6">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="text-8xl font-mono font-light text-foreground mb-6 tracking-tight">
                    {formatTime(timeRemaining)}
                  </div>
                  <Progress value={progress} className="h-3 mb-8 bg-secondary" indicatorClassName="bg-primary" />
                  <div className="flex justify-center gap-4 flex-wrap">
                    {!timerActive && timeRemaining === totalTime && (
                      <Button
                        size="lg"
                        onClick={toggleTimer}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-md hover:shadow-lg transition-all"
                      >
                        <Play className="mr-2 h-5 w-5" /> Start
                      </Button>
                    )}
                    {timerActive && (
                      <>
                        <Button
                          size="lg"
                          onClick={toggleTimer}
                          className="bg-accent hover:bg-accent/80 text-accent-foreground min-w-[120px]"
                        >
                          <Pause className="mr-2 h-5 w-5" /> Pause
                        </Button>
                        <Button
                          size="lg"
                          onClick={stopTimer}
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 min-w-[120px]"
                        >
                          <Square className="mr-2 h-5 w-5" /> Stop
                        </Button>
                      </>
                    )}
                    {!timerActive && timeRemaining < totalTime && timeRemaining > 0 && (
                      <>
                        <Button
                          size="lg"
                          onClick={toggleTimer}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
                        >
                          <Play className="mr-2 h-5 w-5" /> Resume
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={resetTimer}
                          className="border-border text-muted-foreground hover:bg-secondary min-w-[120px]"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" /> Reset
                        </Button>
                      </>
                    )}
                    <Button
                      size="lg"
                      onClick={finishEarly}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 min-w-[120px]"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Finish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Instructions Section */}
        <Card className="bg-card border-border shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">How to Do This Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(activity.instructions) && activity.instructions.length > 0 ? (
              <ol className="space-y-4">
                {activity.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4 text-foreground/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="pt-1 leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic">
                Follow the timer and focus on the activity. Take deep breaths and stay present.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Benefits Section */}
        {Array.isArray(activity.benefits) && activity.benefits.length > 0 && (
          <Card className="bg-card border-border shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-foreground fill-accent" /> Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activity.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-secondary/30 border border-secondary text-secondary-foreground rounded-lg text-sm font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Completion Modal */}
        <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
          <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2 text-foreground">
                <Trophy className="h-6 w-6 text-primary" />
                Activity Complete!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Great job! How was your experience?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Effectiveness Rating */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  How effective was this activity? <span className="text-primary font-bold">{effectivenessRating}/10</span>
                </label>
                <Slider
                  value={[effectivenessRating]}
                  onValueChange={(v) => setEffectivenessRating(v[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                  <span>Not helpful</span>
                  <span>Very helpful</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Any notes or reflections? (optional)
                </label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="How did you feel during and after this activity?"
                  className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCompletionModal(false)}
                className="text-muted-foreground border-border hover:bg-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                {submitting ? (
                  <>Saving...</>
                ) : (
                  <>✅ Save &amp; Return Home</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
