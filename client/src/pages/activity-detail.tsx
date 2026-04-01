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
import { useQueryClient } from '@tanstack/react-query';

export default function ActivityDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      const durationSeconds = data.activity.duration * 60;
      setActivity(data.activity);
      setTotalTime(durationSeconds);
      restoreSessionState(id, durationSeconds);

    } catch (error) {
      console.warn('Failed to fetch activity from API, trying local fallback:', error);

      // FALLBACK: Try to find in sample activities
      const fallbackActivity = sampleActivities.find(a => a.id === id);

      if (fallbackActivity) {
        setActivity(fallbackActivity);
        const durationSeconds = fallbackActivity.duration * 60;
        setTotalTime(durationSeconds);
        restoreSessionState(id, durationSeconds);
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

  const restoreSessionState = (id: string, defaultTime: number) => {
    const savedSession = localStorage.getItem(`activity_session_${id}`);
    if (savedSession) {
      try {
        const { timeRemaining: savedTime, showGuide: savedGuide, timestamp } = JSON.parse(savedSession);
        // Only restore if less than 2 hours old (2 * 60 * 60 * 1000)
        if (Date.now() - timestamp < 7200000) {
          setTimeRemaining(savedTime);
          setShowGuide(savedGuide);
          toast({
            title: "Session Resumed",
            description: "Picked up right where you left off.",
          });
          return;
        } else {
          localStorage.removeItem(`activity_session_${id}`);
        }
      } catch (e) {
        console.error("Failed to parse saved session");
      }
    }
    setTimeRemaining(defaultTime);
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

  // Save session state to localStorage
  useEffect(() => {
    if (activity && timeRemaining > 0 && timeRemaining !== totalTime) {
      localStorage.setItem(`activity_session_${activity.id}`, JSON.stringify({
        timeRemaining,
        showGuide,
        timestamp: Date.now()
      }));
    } else if (timeRemaining === 0 && showCompletionModal && activity) {
      // Clear session when completed
      localStorage.removeItem(`activity_session_${activity.id}`);
    }
  }, [timeRemaining, showGuide, activity, totalTime, showCompletionModal]);

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

      // Invalidate the dashboard's completions cache so it unlocks the next ritual
      queryClient.invalidateQueries({ queryKey: ["/api/activities/completions/today"] });

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

  const getGradientClass = () => {
    if (!activity) return 'bg-gradient-to-br from-slate-50 to-slate-100';
    switch (activity.category) {
      case 'breathing': return 'bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50';
      case 'meditation': return 'bg-gradient-to-br from-fuchsia-50 via-purple-50 to-pink-50';
      case 'grounding': return 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50';
      case 'journaling': return 'bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50';
      case 'somatic': return 'bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50';
      default: return 'bg-gradient-to-br from-slate-50 to-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="bg-white border-slate-200 shadow-xl">
          <CardContent className="p-8 text-center max-w-sm">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-slate-800 font-bold text-xl mb-6">Activity not found</p>
            <Button onClick={() => setLocation('/activities')} className="bg-primary hover:bg-primary/90 w-full rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getGradientClass()} p-6 md:p-8 relative transition-colors duration-1000`}>

      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button and Force Complete */}
        <div className="flex justify-between items-center mb-6">
          <div /> {/* Removed manual back button to use SmartBackButton */}

          <Button
            variant="outline"
            className="border-primary/20 text-primary hover:bg-primary/10 tracking-tight font-semibold rounded-full px-5 shadow-sm"
            onClick={() => setShowCompletionModal(true)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Now
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

        {!showGuide && (
          <div className="mb-8 p-6 bg-card rounded-xl border border-border shadow-sm">
            <ActivityAnimation type={activity.animation_type || 'default'} />
          </div>
        )}

        {/* Regular Timer Section for non-interactive activities */}
        {!showGuide && (
          <div>
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
          </div>
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
                className="flex-1 h-14 rounded-2xl bg-white text-slate-950 font-black text-lg tracking-tight hover:bg-slate-100 shadow-xl active:scale-95 transition-all"
              >
                {submitting ? (
                  <>Saving neural data...</>
                ) : (
                  <>Complete & Save ✨</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
