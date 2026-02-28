import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import OnboardingTour from './OnboardingTour';

const ONBOARDING_STORAGE_KEY = 'puresoul_onboarding_completed';

export default function OnboardingManager() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [shouldCheckOnboarding, setShouldCheckOnboarding] = useState(false);

  useEffect(() => {
    // Only check onboarding status when user is authenticated and not loading
    if (!isLoading && isAuthenticated) {
      setShouldCheckOnboarding(true);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (shouldCheckOnboarding) {
      checkOnboardingStatus();
    }
  }, [shouldCheckOnboarding]);

  const checkOnboardingStatus = () => {
    try {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);

      // If onboarding hasn't been completed, show it after a short delay
      if (!completed) {
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000); // 1 second delay to let the dashboard load
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Only render the tour if we should show it
  if (!showOnboarding) return null;

  return (
    <OnboardingTour
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}

// Export a function to manually trigger onboarding (for settings/help)
export const restartOnboarding = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.location.reload();
  } catch (error) {
    console.error('Error restarting onboarding:', error);
  }
};
