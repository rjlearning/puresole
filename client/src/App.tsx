import { lazy, Suspense, useEffect } from "react";
const VoiceJournal = lazy(() => import("@/pages/voice-journal"));
const VoiceAnalysisDashboard = lazy(() => import("@/pages/VoiceAnalysisDashboard"));
const EmotionalDashboard = lazy(() => import('./components/EmotionalDashboard'));

import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { PhaseProvider, usePhase } from "@/context/PhaseContext";

import MainNavigation from './components/MainNavigation';
import SoulCoreHub from './components/SoulCoreHub';
import SmartBackButton from './components/SmartBackButton';
import OnboardingManager from './components/OnboardingManager';
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const Assessment = lazy(() => import("@/pages/assessment"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const TreatmentPlan = lazy(() => import("@/pages/treatment-plan"));
const Admin = lazy(() => import("@/pages/admin"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const Billing = lazy(() => import("@/pages/billing"));
const AuthPage = lazy(() => import("@/pages/auth"));
const Support = lazy(() => import("@/pages/support"));
const ActivitiesPage = lazy(() => import('./pages/activities'));
const ActivityDetail = lazy(() => import('./pages/activity-detail'));
const SleepPage = lazy(() => import('./pages/sleep'));
const CrisisSupport = lazy(() => import('./pages/CrisisSupport'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AICompanion = lazy(() => import('./pages/AICompanion'));
const Medications = lazy(() => import('./pages/Medications'));
const IntegrationHub = lazy(() => import('./pages/IntegrationHub'));
const Community = lazy(() => import('./pages/Community'));
const SafetyPlan = lazy(() => import('./pages/SafetyPlan'));
const FeaturesHome = lazy(() => import('./pages/FeaturesHome'));
const Settings = lazy(() => import('./pages/Settings'));
const Goals = lazy(() => import('./pages/Goals'));
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const Timeline = lazy(() => import('./pages/timeline'));
const SOSPage = lazy(() => import('./pages/sos'));
const WomenPage = lazy(() => import('./pages/women'));
const WomenCompanionPage = lazy(() => import('./pages/women-companion'));
const WomenCheckinPage = lazy(() => import('./pages/women-checkin'));
const WomenCyclePage = lazy(() => import('./pages/women-cycle'));
const WomenBodyPage = lazy(() => import('./pages/women-body'));
const WomenRelationshipsPage = lazy(() => import('./pages/women-relationships'));
const MentalWellnessPage = lazy(() => import('./pages/mental-wellness'));
const PostpartumOnboarding = lazy(() => import('./pages/PostpartumOnboarding'));
const MetabolicPanel = lazy(() => import('./pages/MetabolicPanel'));
const NutritionProtocol = lazy(() => import('./pages/NutritionProtocol'));
// ── Life Phase pages ──
const PhaseSelect = lazy(() => import('./pages/PhaseSelect'));
const FloweringDashboard = lazy(() => import('./pages/FloweringDashboard'));
const MenPage = lazy(() => import('./pages/men'));
const MenMetabolicPage = lazy(() => import('./pages/men-metabolic'));
const MenProtocolPage = lazy(() => import('./pages/men-protocol'));
const MenBioscanPage = lazy(() => import('./pages/men-bioscan'));
const MenLongevityPage = lazy(() => import('./pages/men-longevity'));
const MenIdentityPage = lazy(() => import('./pages/men-identity'));

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

// Phase-aware dashboard: redirects to /phase-select if no gender/phase chosen
function PhaseDashboard() {
  const { gender, phase, hasChosen } = usePhase();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!hasChosen) setLocation('/phase-select');
  }, [hasChosen, setLocation]);

  if (!hasChosen) return null;
  if (gender === 'male') return <UnifiedDashboard />;
  if (phase === 'flowering') return <FloweringDashboard />;
  return <UnifiedDashboard />;
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
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500 font-medium animate-pulse">Loading journey...</p>
            </div>
          </div>
        }>
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
            <Route path="/treatment-plan">
              <ProtectedRoute><TreatmentPlan /></ProtectedRoute>
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
              <ProtectedRoute><PhaseDashboard /></ProtectedRoute>
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
            {/* Men's Section */}
            <Route path="/men">
              <ProtectedRoute><MenPage /></ProtectedRoute>
            </Route>
            <Route path="/men/metabolic">
              <ProtectedRoute><MenMetabolicPage /></ProtectedRoute>
            </Route>
            <Route path="/men/protocol">
              <ProtectedRoute><MenProtocolPage /></ProtectedRoute>
            </Route>
            <Route path="/men/bioscan">
              <ProtectedRoute><MenBioscanPage /></ProtectedRoute>
            </Route>
            <Route path="/men/longevity">
              <ProtectedRoute><MenLongevityPage /></ProtectedRoute>
            </Route>
            <Route path="/men/identity">
              <ProtectedRoute><MenIdentityPage /></ProtectedRoute>
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
            <Route path="/voice-insights">
              <ProtectedRoute><VoiceAnalysisDashboard /></ProtectedRoute>
            </Route>
            {/* ── Life Phase routes ── */}
            <Route path="/phase-select">
              <ProtectedRoute><PhaseSelect /></ProtectedRoute>
            </Route>
            <Route path="/flowering">
              <ProtectedRoute><FloweringDashboard /></ProtectedRoute>
            </Route>
            <Route path="/">
              {isAuthenticated ? <PhaseDashboard /> : <Landing />}
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
        </Suspense>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PhaseProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </PhaseProvider>
    </QueryClientProvider>
  );
}

export default App;
