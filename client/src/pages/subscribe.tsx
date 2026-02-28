import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Zap, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  interval: string;
  features: string[];
  stripePriceId: string;
  isActive: boolean;
  currency: string;
  assessmentsPerMonth: number | null;
}

interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const PlanIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'basic':
      return <CheckCircle className="h-6 w-6 text-blue-500" />;
    case 'professional':
      return <Zap className="h-6 w-6 text-purple-500" />;
    case 'enterprise':
      return <Crown className="h-6 w-6 text-gold-500" />;
    default:
      return <Shield className="h-6 w-6 text-gray-500" />;
  }
};

const CheckoutForm = ({ planId, onSuccess }: { planId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your subscription is now active!",
      });
      onSuccess();
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    enabled: true,
  });

  // Fetch current user subscription
  const { data: currentSubscription } = useQuery<UserSubscription | null>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }

    setSelectedPlan(planId);
    createSubscriptionMutation.mutate(planId);
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    setLocation('/dashboard');
  };

  if (authLoading || plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Show payment form if client secret is available
  if (clientSecret) {
    const selectedPlanData = plans.find((plan: SubscriptionPlan) => plan.id === selectedPlan);
    
    // Check if Stripe is configured
    if (!stripePromise) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration Required</CardTitle>
              <CardDescription>
                Stripe payment processing is not configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The payment system requires configuration. Please contact support.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setClientSecret(null);
                  setSelectedPlan(null);
                }}
                data-testid="button-back-payment"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Back Button for Payment Form */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setClientSecret(null);
              setSelectedPlan(null);
            }}
            className="flex items-center gap-2"
            data-testid="button-back-payment"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complete Your Subscription</h1>
          {selectedPlanData && (
            <p className="text-lg text-muted-foreground mt-2">
              {selectedPlanData.name} Plan - ${selectedPlanData.price}/month
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Enter your payment details to complete your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm planId={selectedPlan!} onSuccess={handlePaymentSuccess} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your PureSoul Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best fits your mental health journey. All plans include AI-powered assessments and personalized treatment recommendations.
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              You currently have an active subscription
            </span>
          </div>
          <p className="text-green-700 dark:text-green-300 mt-1">
            Status: {currentSubscription.status} | 
            Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan: SubscriptionPlan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.type === 'professional' 
                ? 'border-purple-200 dark:border-purple-800 shadow-lg' 
                : ''
            }`}
          >
            {plan.type === 'professional' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <PlanIcon type={plan.type} />
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.assessmentsPerMonth && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>{plan.assessmentsPerMonth}</strong> assessments per month
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.type === 'professional' ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={
                  createSubscriptionMutation.isPending || 
                  (currentSubscription?.status === 'active')
                }
                data-testid={`button-select-${plan.type}`}
              >
                {createSubscriptionMutation.isPending && selectedPlan === plan.id
                  ? "Processing..."
                  : currentSubscription?.status === 'active'
                  ? "Current Plan"
                  : `Choose ${plan.name}`
                }
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Need help choosing? <a href="#" className="text-primary hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  );
}