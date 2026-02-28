import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    text: string;
    href: string;
  };
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PureSoul! 🎉',
    description: 'Let\'s take a quick tour to help you get started with your mental wellness journey. This will only take 2 minutes.',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'This is your central hub. Track daily progress, view medications, and access quick actions all in one place.',
  },
  {
    id: 'navigation',
    title: 'Easy Navigation',
    description: 'Use the sidebar (or menu button on mobile) to access all features. Everything is just one click away!',
  },
  {
    id: 'voice-journal',
    title: 'Voice Journal',
    description: 'Express your thoughts through voice or text. Track your mood, energy, and stress levels daily.',
    action: {
      text: 'Try Voice Journal',
      href: '/voice-journal'
    }
  },
  {
    id: 'ai-companion',
    title: 'AI Companion 🤖',
    description: 'Chat with your personal AI mental health companion. Get support, coping strategies, and guided exercises anytime.',
    action: {
      text: 'Meet Your AI Companion',
      href: '/ai-companion'
    }
  },
  {
    id: 'activities',
    title: 'Wellness Activities',
    description: 'Log activities like exercise, meditation, or socializing. See how they impact your mood over time.',
    action: {
      text: 'Browse Activities',
      href: '/activities'
    }
  },
  {
    id: 'medications',
    title: 'Medication Tracker 💊',
    description: 'Track medications, set reminders, monitor side effects, and maintain adherence. Never miss a dose!',
    action: {
      text: 'Add Medications',
      href: '/medications'
    }
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Visualize your mental wellness trends. Discover patterns and correlations in your mood, activities, and health.',
    action: {
      text: 'View Analytics',
      href: '/analytics'
    }
  },
  {
    id: 'community',
    title: 'Community Support 👥',
    description: 'Join support groups, attend events, and connect with others on similar journeys. You\'re not alone!',
    action: {
      text: 'Explore Community',
      href: '/community'
    }
  },
  {
    id: 'safety-plan',
    title: 'Safety Plan 🛡️',
    description: 'Create your personalized crisis response plan. Add warning signs, coping strategies, and emergency contacts.',
    action: {
      text: 'Build Safety Plan',
      href: '/safety-plan'
    }
  },
  {
    id: 'crisis-support',
    title: 'Crisis Support ☎️',
    description: 'If you ever need immediate help, crisis support is always available. Access hotlines and resources 24/7.',
    action: {
      text: 'View Resources',
      href: '/crisis-support'
    }
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'You now know the basics! Explore at your own pace and remember: your mental health matters. We\'re here to support you every step of the way.',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Tour Card */}
        <Card className="max-w-2xl w-full bg-white shadow-2xl">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">
                    Step {currentStep + 1} of {tourSteps.length}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h2>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Description */}
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {step.description}
            </p>

            {/* Action Button (if applicable) */}
            {step.action && !isLastStep && (
              <div className="mb-6">
                <a
                  href={step.action.href}
                  onClick={handleSkip}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  {step.action.text}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Or continue the tour to learn more
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Skip Tour
                </button>
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg flex items-center gap-2"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-purple-600'
                      : index < currentStep
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
