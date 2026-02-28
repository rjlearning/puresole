import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import TreatmentModule from "@/components/treatment/treatment-module";
import { ArrowLeft, Calendar, Target, TrendingUp, Clock, CheckCircle, Circle } from "lucide-react";

export default function TreatmentPlan() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const { data: treatmentPlan, isLoading: planLoading, error: planError } = useQuery({
    queryKey: ["/api/treatment-plans", id],
    retry: false,
  });

  const { data: progressEntries } = useQuery({
    queryKey: ["/api/progress/plan", id],
    retry: false,
  });

  const progressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      await apiRequest("POST", "/api/progress", progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/plan", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", id] });
      toast({
        title: "Progress Updated",
        description: "Your activity has been marked as complete.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
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

  // Handle API errors
  useEffect(() => {
    if (planError && isUnauthorizedError(planError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [planError, toast]);

  if (isLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!treatmentPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Treatment Plan Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The treatment plan you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleActivityComplete = (activityName: string, activityType: string, moduleId?: string) => {
    progressMutation.mutate({
      planId: id,
      moduleId,
      activityType,
      activityName,
      completed: true,
      date: new Date().toISOString(),
    });
  };

  const weekModules = treatmentPlan.modules?.filter((module: any) => module.week === selectedWeek) || [];
  const allWeeks = Array.from(
    new Set(treatmentPlan.modules?.map((module: any) => module.week) || [])
  ).sort((a, b) => a - b);

  const completedActivities = progressEntries?.filter((entry: any) => entry.completed) || [];
  const totalActivities = treatmentPlan.modules?.reduce(
    (total: number, module: any) => total + (module.content?.activities?.length || 0),
    0
  ) || 0;
  const completionPercentage = totalActivities > 0 ? (completedActivities.length / totalActivities) * 100 : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="treatment-plan-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          {/* Treatment Plan Header */}
          <Card className="bg-gradient-to-r from-primary to-accent text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2" data-testid="text-plan-title">
                    {treatmentPlan.title}
                  </h1>
                  <p className="text-white/90" data-testid="text-plan-description">
                    {treatmentPlan.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Progress</div>
                  <div className="text-2xl font-bold" data-testid="text-progress-percentage">
                    Week {treatmentPlan.currentWeek} of {treatmentPlan.totalWeeks}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="bg-white/20" />
              </div>

              <div className="flex items-center justify-between">
                <Badge className="bg-white text-primary" data-testid="badge-plan-status">
                  {treatmentPlan.status}
                </Badge>
                <div className="text-sm opacity-90">
                  Started {new Date(treatmentPlan.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Week Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card data-testid="card-week-navigation">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Treatment Weeks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allWeeks.map((week) => {
                  const weekModulesCount = treatmentPlan.modules?.filter(
                    (module: any) => module.week === week
                  ).length || 0;
                  const weekCompleted = treatmentPlan.currentWeek > week;
                  const isCurrentWeek = treatmentPlan.currentWeek === week;
                  
                  return (
                    <Button
                      key={week}
                      variant={selectedWeek === week ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedWeek(week)}
                      data-testid={`button-week-${week}`}
                    >
                      <div className="flex items-center space-x-3">
                        {weekCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isCurrentWeek ? (
                          <Circle className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">Week {week}</div>
                          <div className="text-xs text-muted-foreground">
                            {weekModulesCount} module{weekModulesCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Treatment Goals */}
            <Card className="mt-6" data-testid="card-treatment-goals">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {treatmentPlan.goals && treatmentPlan.goals.length > 0 ? (
                  <div className="space-y-3">
                    {treatmentPlan.goals.map((goal: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2" data-testid={`goal-${index}`}>
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm">{goal}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No goals defined for this plan.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="modules" className="space-y-6">
              <TabsList data-testid="tabs-treatment">
                <TabsTrigger value="modules" data-testid="tab-modules">This Week's Modules</TabsTrigger>
                <TabsTrigger value="progress" data-testid="tab-week-progress">Progress</TabsTrigger>
                <TabsTrigger value="overview" data-testid="tab-overview">Plan Overview</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2" data-testid="text-current-week">
                    Week {selectedWeek} Activities
                  </h2>
                  <p className="text-muted-foreground">
                    Complete the activities below to progress through your treatment plan.
                  </p>
                </div>

                {weekModules.length > 0 ? (
                  <div className="space-y-6">
                    {weekModules.map((module: any) => (
                      <TreatmentModule
                        key={module.id}
                        module={module}
                        progressEntries={progressEntries}
                        onActivityComplete={handleActivityComplete}
                        isLoading={progressMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <Card data-testid="card-no-modules">
                    <CardContent className="text-center py-12">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No modules for this week</h3>
                      <p className="text-muted-foreground">
                        There are no activities scheduled for week {selectedWeek}.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <Card data-testid="card-progress-summary">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Progress Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {completedActivities.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Activities Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-secondary mb-2">
                          {treatmentPlan.currentWeek}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-accent mb-2">
                          {Math.round(completionPercentage)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Overall Progress</div>
                      </div>
                    </div>

                    {progressEntries && progressEntries.length > 0 && (
                      <div className="mt-8">
                        <h4 className="font-semibold mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                          {progressEntries.slice(0, 10).map((entry: any, index: number) => (
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
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <Card data-testid="card-plan-overview">
                  <CardHeader>
                    <CardTitle>Treatment Plan Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground">{treatmentPlan.description}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Plan Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Duration:</span>
                              <span>{treatmentPlan.totalWeeks} weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Current Week:</span>
                              <span>{treatmentPlan.currentWeek}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <Badge className="capitalize">{treatmentPlan.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Started:</span>
                              <span>{new Date(treatmentPlan.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Module Breakdown</h4>
                          <div className="space-y-2">
                            {allWeeks.map((week) => {
                              const weekModulesCount = treatmentPlan.modules?.filter(
                                (module: any) => module.week === week
                              ).length || 0;
                              
                              return (
                                <div key={week} className="flex items-center justify-between text-sm">
                                  <span>Week {week}:</span>
                                  <span>{weekModulesCount} module{weekModulesCount !== 1 ? 's' : ''}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
