import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  plan?: {
    name: string;
    price: number;
    interval: string;
    type: string;
  };
}

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  description: string;
  createdAt: string;
  stripeInvoiceId?: string;
  metadata?: any;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle };
      case 'trialing':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock };
      case 'past_due':
        return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle };
      case 'canceled':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle };
      case 'succeeded':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle };
      case 'failed':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border-0 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
};

export default function Billing() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  // Fetch current user subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<UserSubscription>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch billing history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/billing-history'],
    enabled: isAuthenticated,
    retry: false,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cancel-subscription", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription? You'll continue to have access until your current billing period ends.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  if (authLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and view billing history
        </p>
      </div>

      {/* Current Subscription */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Your current plan details and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{subscription.plan?.name || 'Plan'}</h3>
                  <p className="text-muted-foreground">
                    ${subscription.plan?.price}/{subscription.plan?.interval}
                  </p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Current Period</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(subscription.currentPeriodStart), 'MMM d, yyyy')} - {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Next Billing Date</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.cancelAtPeriodEnd 
                        ? "Will not renew" 
                        : format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')
                      }
                    </p>
                  </div>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription is set to cancel on {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}. 
                    You'll continue to have access until then.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscriptionMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setLocation('/subscribe')}
                  data-testid="button-change-plan"
                >
                  Change Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have an active subscription</p>
              <Button onClick={() => setLocation('/subscribe')} data-testid="button-subscribe">
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View your past payments and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading payment history...</p>
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{payment.description}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.createdAt), 'MMM d, yyyy')} • {payment.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${payment.amount} {payment.currency.toUpperCase()}
                    </p>
                    {payment.stripeInvoiceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // In a real app, this would download the invoice
                          toast({
                            title: "Invoice Download",
                            description: "Invoice download would be implemented here",
                          });
                        }}
                        data-testid={`button-download-${payment.id}`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment history found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}