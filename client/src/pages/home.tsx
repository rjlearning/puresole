import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CleanCard } from "@/components/ui/CleanCard";
import { ScrollReveal } from "@/components/interactions/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, TrendingUp, Calendar, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import type { Assessment, TreatmentPlan } from "@shared/schema";
import { RecommendedActivities } from "@/components/dashboard/RecommendedActivities";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    retry: false,
  });

  const { data: treatmentPlans = [], isLoading: plansLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ["/api/treatment-plans"],
    retry: false,
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
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const recentAssessment = assessments[0];
  const activePlan = treatmentPlans.find((plan) => plan.status === 'active');

  return (
    <div className="min-h-screen relative overflow-hidden text-foreground" data-testid="home-page">
      <Header />

      <main className="container mx-auto px-4 py-12 space-y-24">
        {/* Hero Section */}
        <ScrollReveal direction="up" className="text-center space-y-6 pt-10">
          <Badge variant="secondary" className="px-4 py-1.5 bg-orange-50 text-orange-600 font-medium border-none hover:bg-orange-100 transition-colors">
            <Sparkles className="w-3 h-3 mr-2 text-orange-500" />
            Your Wellness Journey
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight" data-testid="text-welcome">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">{user?.firstName}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Track your progress, reflect on your day, and manage your growth plan all in one place.
          </p>
        </ScrollReveal>

        {/* Quick Actions Grid */}
        <ScrollReveal threshold={0.2} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CleanCard variant="interactive" className="group" data-testid="card-new-assessment">
            <Link href="/assessment">
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Plus className="h-7 w-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">New Reflection</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Explore your current state of mind</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-orange-600 text-sm font-bold">
                  Start Now <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </CleanCard>

          <CleanCard variant="interactive" className="group" data-testid="card-view-dashboard">
            <Link href="/dashboard">
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <TrendingUp className="h-7 w-7 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">My Journey</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Visualize your personal growth</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-blue-600 text-sm font-bold">
                  View Dashboard <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </CleanCard>

          <CleanCard variant="interactive" className="group" data-testid="card-treatment-plan">
            <Link href={activePlan ? `/treatment-plan/${activePlan.id}` : "#"}>
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Calendar className="h-7 w-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Growth Plan</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {activePlan ? "Continue your daily path" : "No active plan currently"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-purple-600 text-sm font-bold">
                  {activePlan ? "Continue" : "Start Plan"} <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </CleanCard>

        </ScrollReveal>


        {/* Insights & Progress Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <ScrollReveal direction="left" delay={200}>
            <CleanCard className="h-full p-10 relative overflow-hidden bg-gradient-to-br from-orange-50/50 to-white">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain className="w-32 h-32 text-orange-900" />
              </div>
              <h2 className="text-2xl font-bold mb-8 flex items-center text-slate-900">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                Recent Reflection
              </h2>

              {assessmentsLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-24 bg-slate-50 rounded"></div>
                </div>
              ) : recentAssessment ? (
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize bg-orange-100 text-orange-700 hover:bg-orange-200">
                      {recentAssessment.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="capitalize border-slate-200 text-slate-600">
                      {recentAssessment.severity.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-slate-400 ml-auto font-medium">
                      {recentAssessment.createdAt ? new Date(recentAssessment.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm leading-relaxed text-slate-600 font-medium">
                    <p>
                      {recentAssessment.aiAnalysis
                        ? recentAssessment.aiAnalysis.substring(0, 150) + "..."
                        : "No analysis available."}
                    </p>
                  </div>

                  <Link href="/assessment">
                    <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold pl-0">
                      View Full Analysis <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-6 font-medium">Start your journey with a self-reflection.</p>
                  <Link href="/assessment">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8">Begin Reflection</Button>
                  </Link>
                </div>
              )}
            </CleanCard>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={400}>
            <CleanCard className="h-full p-10 relative overflow-hidden bg-slate-900 text-white border-none shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Calendar className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-bold mb-8 flex items-center">
                <div className="p-2 bg-white/10 rounded-lg mr-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                Active Journey
              </h2>

              {plansLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-24 bg-white/5 rounded"></div>
                </div>
              ) : activePlan ? (
                <div className="space-y-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white">{activePlan.title}</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{activePlan.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-300">Progress</span>
                      <span className="text-white">{activePlan.progressPercentage}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-1000 ease-out"
                        style={{ width: `${activePlan.progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-right mt-1">
                      Week {activePlan.currentWeek} of {activePlan.totalWeeks}
                    </p>
                  </div>

                  <Link href={`/treatment-plan/${activePlan.id}`}>
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full h-12">
                      Continue Session
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-6 font-medium">No active growth journey found.</p>
                  <Link href={recentAssessment ? "/treatment-plan/create" : "/assessment"}>
                    <Button className="bg-white/10 hover:bg-white/20 text-white border-none rounded-full px-8">
                      {recentAssessment ? "Create Plan" : "Reflect First"}
                    </Button>
                  </Link>
                </div>
              )}
            </CleanCard>
          </ScrollReveal>
        </div>

        {/* Recommended Activities Section */}
        <ScrollReveal direction="up" delay={600}>
          <RecommendedActivities recentAssessment={recentAssessment} activePlan={activePlan} />
        </ScrollReveal>

      </main>
    </div>
  );
}
