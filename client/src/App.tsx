import EmotionalDashboard from './components/EmotionalDashboard';
import VoiceJournal from "@/pages/voice-journal";
import VoiceAnalysisDashboard from "@/pages/VoiceAnalysisDashboard";

import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
// User requested removal of AgeGate as app is for all ages
// import { AgeGate, useAgeVerification } from "@/components/age-gate";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import TreatmentPlan from "@/pages/treatment-plan";
import Admin from "@/pages/admin";
import Subscribe from "@/pages/subscribe";
import Billing from "@/pages/billing";
import AuthPage from "@/pages/auth";
import Support from "@/pages/support";
import ActivitiesPage from './pages/activities';
import ActivityDetail from './pages/activity-detail';
import SleepPage from './pages/sleep';
import CrisisSupport from './pages/CrisisSupport';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Analytics from './pages/Analytics';
import AICompanion from './pages/AICompanion';
// import TherapistPortal from './pages/TherapistPortal'; // Removed
import Medications from './pages/Medications';
import IntegrationHub from './pages/IntegrationHub';
import Community from './pages/Community';
import SafetyPlan from './pages/SafetyPlan';
import FeaturesHome from './pages/FeaturesHome';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import UnifiedDashboard from './pages/UnifiedDashboard';
import Timeline from './pages/timeline';
import MainNavigation from './components/MainNavigation';
import SoulCoreHub from './components/SoulCoreHub';
import SmartBackButton from './components/SmartBackButton';
import OnboardingManager from './components/OnboardingManager';
import SOSPage from './pages/sos';
import WomenPage from './pages/women';
import WomenCompanionPage from './pages/women-companion';
import WomenCheckinPage from './pages/women-checkin';
import WomenCyclePage from './pages/women-cycle';
import WomenBodyPage from './pages/women-body';
import WomenRelationshipsPage from './pages/women-relationships';
import MentalWellnessPage from './pages/mental-wellness';
import PostpartumOnboarding from './pages/PostpartumOnboarding';
import MetabolicPanel from './pages/MetabolicPanel';
import NutritionProtocol from './pages/NutritionProtocol';
import './styles/airtable.css';

// Component to scroll to top on route change
function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Better than smooth for immediate page transitions
    });
  }, [pathname]);

  return null;
}

// Protected route wrapper component - redirects to /auth if not logged in
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, isLoading, setLocation]);

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

  return <>{children}</>;
}

// Auth route wrapper - redirects to /dashboard if already logged in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      {isAuthenticated && <SmartBackButton />}
      {isAuthenticated && <MainNavigation />}
      {isAuthenticated && <SoulCoreHub />}
      {isAuthenticated && <OnboardingManager />}
      <div className={`min-h-screen mesh-bg ${isAuthenticated ? "lg:ml-80 lg:pl-8 pb-28 lg:pb-0" : ""}`}>
        <Switch>
          <Route path="/features">
            <ProtectedRoute><FeaturesHome /></ProtectedRoute>
          </Route>
          <Route path="/login">
            <AuthRoute><AuthPage /></AuthRoute>
          </Route>
          <Route path="/register">
            <AuthRoute><AuthPage /></AuthRoute>
          </Route>
          <Route path="/auth">
            <AuthRoute><AuthPage /></AuthRoute>
          </Route>
          <Route path="/voice-journal">
            <ProtectedRoute><VoiceJournal /></ProtectedRoute>
          </Route>
          <Route path="/assessment">
            <ProtectedRoute><Assessment /></ProtectedRoute>
          </Route>
          <Route path="/check-in">
            <ProtectedRoute><Assessment /></ProtectedRoute>
          </Route>
          <Route path="/treatment-plan/:id">
            <ProtectedRoute><TreatmentPlan /></ProtectedRoute>
          </Route>
          <Route path="/admin">
            <ProtectedRoute><Admin /></ProtectedRoute>
          </Route>
          <Route path="/billing">
            <ProtectedRoute><Billing /></ProtectedRoute>
          </Route>
          <Route path="/subscribe">
            <ProtectedRoute><Subscribe /></ProtectedRoute>
          </Route>
          <Route path="/support">
            <ProtectedRoute><Support /></ProtectedRoute>
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute><UnifiedDashboard /></ProtectedRoute>
          </Route>
          <Route path="/activities">
            <ProtectedRoute><ActivitiesPage /></ProtectedRoute>
          </Route>
          <Route path="/activities/:id">
            <ProtectedRoute><ActivityDetail /></ProtectedRoute>
          </Route>
          <Route path="/sleep">
            <ProtectedRoute><SleepPage /></ProtectedRoute>
          </Route>
          <Route path="/crisis-support">
            <CrisisSupport />
          </Route>
          <Route path="/sos">
            <ProtectedRoute><SOSPage /></ProtectedRoute>
          </Route>
          {/* Women's Section */}
          <Route path="/women">
            <ProtectedRoute><WomenPage /></ProtectedRoute>
          </Route>
          <Route path="/women/companion">
            <ProtectedRoute><WomenCompanionPage /></ProtectedRoute>
          </Route>
          <Route path="/women/onboarding">
            <ProtectedRoute><PostpartumOnboarding /></ProtectedRoute>
          </Route>
          <Route path="/women/metabolic">
            <ProtectedRoute><MetabolicPanel /></ProtectedRoute>
          </Route>
          <Route path="/women/protocol">
            <ProtectedRoute><NutritionProtocol /></ProtectedRoute>
          </Route>
          <Route path="/women/checkin">
            <ProtectedRoute><WomenCheckinPage /></ProtectedRoute>
          </Route>
          <Route path="/women/cycle">
            <ProtectedRoute><WomenCyclePage /></ProtectedRoute>
          </Route>
          <Route path="/women/body">
            <ProtectedRoute><WomenBodyPage /></ProtectedRoute>
          </Route>
          <Route path="/women/relationships">
            <ProtectedRoute><WomenRelationshipsPage /></ProtectedRoute>
          </Route>
          {/* Mental Wellness Activities */}
          <Route path="/mental-wellness">
            <ProtectedRoute><MentalWellnessPage /></ProtectedRoute>
          </Route>
          <Route path="/reports">
            <ProtectedRoute><Reports /></ProtectedRoute>
          </Route>
          <Route path="/reports/:id">
            <ProtectedRoute><ReportDetail /></ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute><Analytics /></ProtectedRoute>
          </Route>
          <Route path="/goals">
            <ProtectedRoute><Goals /></ProtectedRoute>
          </Route>
          <Route path="/ai-companion">
            <ProtectedRoute><AICompanion /></ProtectedRoute>
          </Route>
          {/* <Route path="/therapist-portal">
            <ProtectedRoute><TherapistPortal /></ProtectedRoute>
          </Route> */}
          <Route path="/medications">
            <ProtectedRoute><Medications /></ProtectedRoute>
          </Route>
          <Route path="/integrations">
            <ProtectedRoute><IntegrationHub /></ProtectedRoute>
          </Route>
          <Route path="/community">
            <ProtectedRoute><Community /></ProtectedRoute>
          </Route>
          <Route path="/safety-plan">
            <ProtectedRoute><SafetyPlan /></ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute><Settings /></ProtectedRoute>
          </Route>
          <Route path="/voice-insights">
            <ProtectedRoute><VoiceAnalysisDashboard /></ProtectedRoute>
          </Route>
          <Route path="/">
            {isAuthenticated ? <UnifiedDashboard /> : <Landing />}
          </Route>
          {/* Catch-all 404 */}
          <Route>
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-2 font-serif">Oops!</h1>
              <p className="text-slate-500 mb-8 max-w-md">We couldn't find the page you're looking for. It might have been moved or doesn't exist.</p>
              <Link href="/">
                <Button className="rounded-2xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700">Return to Dashboard</Button>
              </Link>
            </div>
          </Route>
        </Switch>
      </div>
    </>
  );
}

function App() {
  // Force App Reload v4
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
