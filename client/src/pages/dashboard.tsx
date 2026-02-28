import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import ProgressChart from "@/components/dashboard/progress-chart";
import { ArrowLeft, Activity, Crown, CheckCircle, Heart, Compass, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: assessments = [] } = useQuery<any[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: treatmentPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/treatment-plans"],
    retry: false,
  });

  const { data: progressData = [] } = useQuery<any[]>({
    queryKey: ["/api/progress/user"],
    retry: false,
  });

  const { data: subscription } = useQuery<any>({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Phase 1: Shared Journeys - Fetch anonymous Sparks
  const { data: sparksData } = useQuery<{ sparks: string[] }>({
    queryKey: ["/api/community/sparks"],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check for new sparks every minute
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (treatmentPlans && treatmentPlans.length > 0 && !selectedPlan) {
      const activePlan = treatmentPlans.find((plan: any) => plan.status === 'active');
      setSelectedPlan(activePlan?.id || treatmentPlans[0].id);
    }
  }, [treatmentPlans, selectedPlan]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activePlan = treatmentPlans?.find((plan: any) => plan.status === 'active');
  const recentAssessments = assessments?.slice(0, 3) || [];
  const currentPlan = treatmentPlans?.find((plan: any) => plan.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
            Progress Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your mental health journey with detailed analytics and insights.
          </p>
        </div>

        {/* Subscription Status */}
        {subscription && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-semibold">{subscription.plan?.name || 'Active Subscription'}</p>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {subscription.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Next billing: {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-lg font-bold">${subscription.plan?.price || '0'}/month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compassionate Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-assessments">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Moments of Reflection</p>
                  <p className="text-2xl font-bold">{assessments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-plans">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Compass className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Journeys</p>
                  <p className="text-2xl font-bold">
                    {treatmentPlans?.filter((plan: any) => plan.status === 'active').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-current-week">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <HeartHandshake className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Days Guided</p>
                  <p className="text-2xl font-bold">
                    {progressData?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-overall-progress">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Focus</p>
                  <p className="text-xl font-bold truncate max-w-[120px]" title={activePlan ? activePlan.title : 'Taking space'}>
                    {activePlan ? activePlan.title : 'Taking space'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="tabs-dashboard">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">Progress Tracking</TabsTrigger>
            <TabsTrigger value="assessments" data-testid="tab-assessments">Assessment History</TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">Goals & Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Phase 1: Shared Journeys - Received Sparks */}
            {sparksData && sparksData.sparks.length > 0 && (
              <Card className="border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-rose-900">A spark from the community</h3>
                      {sparksData.sparks.map((spark, idx) => (
                        <p key={idx} className="text-rose-800 font-medium italic">
                          "{spark}"
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Treatment Plan */}
            {activePlan ? (
              <Card data-testid="card-current-plan">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Compass className="h-5 w-5 text-indigo-500" />
                    <span>Current Journey</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{activePlan.title}</h3>
                      <p className="text-muted-foreground">{activePlan.description}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Week Progress</p>
                        <p className="text-xl font-bold">{activePlan.currentWeek} / {activePlan.totalWeeks}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Completion</p>
                        <p className="text-xl font-bold">{activePlan.progressPercentage}%</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge className="capitalize">{activePlan.status}</Badge>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3 transition-all duration-300"
                        style={{ width: `${activePlan.progressPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(activePlan.createdAt).toLocaleDateString()}
                      </p>
                      <Link href={`/treatment-plan/${activePlan.id}`}>
                        <Button data-testid="button-view-plan">
                          View Full Plan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="card-no-plan">
                <CardContent className="text-center py-12">
                  <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Start a Journey?</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete a reflection check-in to generate a personalized path forward.
                  </p>
                  <Link href="/assessment">
                    <Button data-testid="button-start-assessment">
                      Begin Reflection
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressData && progressData.length > 0 ? (
                  <div className="space-y-4">
                    {progressData.slice(0, 5).map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${entry.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <p className="font-medium">{entry.activityName}</p>
                            <p className="text-sm text-muted-foreground capitalize">{entry.activityType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          <Badge variant={entry.completed ? "default" : "secondary"}>
                            {entry.completed ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity to display</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card data-testid="card-progress-chart">
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {progressData && progressData.length > 0 ? (
                  <ProgressChart data={progressData} />
                ) : (
                  <div className="text-center py-12">
                    <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No progress data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <Card data-testid="card-assessment-history">
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAssessments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAssessments.map((assessment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Heart className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold capitalize">
                              {assessment.type.replace('_', ' ')} Assessment
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Score: {assessment.score} | {new Date(assessment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            assessment.severity === 'severe' || assessment.severity === 'moderately_severe'
                              ? 'destructive'
                              : assessment.severity === 'moderate'
                                ? 'secondary'
                                : 'default'
                          }
                          className="capitalize"
                        >
                          {assessment.severity.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}

                    {assessments && assessments.length > 3 && (
                      <div className="text-center pt-4">
                        <Link href="/assessment">
                          <Button variant="outline" data-testid="button-view-all-assessments">
                            View All Assessments
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No reflections completed yet</p>
                    <Link href="/assessment">
                      <Button data-testid="button-first-assessment">
                        Take Your First Assessment
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card data-testid="card-treatment-goals">
              <CardHeader>
                <CardTitle>Treatment Goals & Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPlan && currentPlan.goals ? (
                  <div className="space-y-4">
                    {currentPlan.goals.map((goal: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{goal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No treatment goals set yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
