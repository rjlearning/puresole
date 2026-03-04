import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { useMutation as _useMutation } from '@tanstack/react-query';
import {
  CheckCircle2, Zap, Star, ArrowLeft, Clock, Shield,
  Brain, Mic, Heart, TrendingUp, ChevronRight, Loader2,
  BarChart3, Activity
} from 'lucide-react';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// ── Pricing data ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'core',
    name: 'Core',
    icon: Heart,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    description: 'Daily wellness tracking & AI insights to build consistent habits.',
    monthly: 9,
    annual: 89,
    highlight: false,
    badge: null,
    cta: 'Start Free Trial',
    features: [
      'Voice biomarker analysis (10/mo)',
      'AI Companion chat (5 hrs/mo)',
      'Daily check-ins & mood tracking',
      'Men\'s & Women\'s health protocols',
      'Sleep & activity tracking',
      'Goal setting & progress reports',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    description: 'Comprehensive AI analysis with advanced longevity & identity protocols.',
    monthly: 19,
    annual: 159,
    highlight: true,
    badge: 'Best Value',
    cta: 'Start Free Trial',
    features: [
      'Voice biomarker analysis (100/mo)',
      'AI Companion chat (50 hrs/mo)',
      'Advanced metabolic & longevity panels',
      'Full Men\'s & Women\'s protocol suite',
      'Postpartum & hormone tracking',
      'Priority support & early features',
    ],
  },
];

const COMPARISON = [
  { feature: 'Voice biomarker analysis', core: '10 sessions/month', pro: '100 sessions/month' },
  { feature: 'AI Companion chatting', core: '5 hours/month', pro: '50 hours/month' },
  { feature: 'Health assessments', core: '✓', pro: '✓' },
  { feature: 'Men\'s & Women\'s protocols', core: '✓', pro: '✓' },
  { feature: 'Metabolic & longevity panels', core: '—', pro: '✓' },
  { feature: 'Postpartum tracking', core: '—', pro: '✓' },
  { feature: 'Priority support', core: '—', pro: '✓' },
  { feature: 'Early access features', core: '—', pro: '✓' },
];

// ── Checkout form ─────────────────────────────────────────────────────────────
function CheckoutForm({ planName, onSuccess }: { planName: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/billing' },
    });
    if (error) {
      toast({ title: 'Payment failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 Welcome to PureSoul!', description: 'Your trial has started. Enjoy full access.' });
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Start 14-Day Free Trial — ${planName}`}
      </button>
      <p className="text-center text-xs text-slate-500">No charge for 14 days. Cancel anytime before trial ends.</p>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Subscribe() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: currentSubscription } = useQuery<any>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest('POST', '/api/create-subscription', { planId, billing });
      return res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Could not initiate trial', variant: 'destructive' });
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Create a free account first to start your trial.', variant: 'destructive' });
      setTimeout(() => { window.location.href = '/auth'; }, 1200);
      return;
    }
    setSelectedPlanId(planId);
    createSubscriptionMutation.mutate(planId);
  };

  // Show payment form
  if (clientSecret) {
    const plan = PLANS.find(p => p.id === selectedPlanId)!;
    if (!stripePromise) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-800 text-center">
            <p className="text-slate-400 mb-4">Payment isn't configured yet. Please contact support.</p>
            <button onClick={() => { setClientSecret(null); setSelectedPlanId(null); }} className="text-indigo-400 underline">← Back to plans</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <button onClick={() => { setClientSecret(null); setSelectedPlanId(null); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to plans
          </button>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
            <div className="mb-6 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                14-Day Free Trial
              </span>
              <h2 className="text-2xl font-black text-white mt-4">{plan.name} Plan</h2>
              <p className="text-slate-400 text-sm mt-1">
                ${billing === 'monthly' ? plan.monthly + '/month' : plan.annual + '/year'} — starts after trial
              </p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm planName={plan.name} onSuccess={() => setLocation('/billing')} />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  const annualSavings = (plan: typeof PLANS[0]) => Math.round(((plan.monthly * 12) - plan.annual) / (plan.monthly * 12) * 100);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 mb-6">
            <Clock className="w-3.5 h-3.5" /> 14-Day Free Trial — No Credit Card Required
          </span>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-5">
            Invest in your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">wellbeing</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Start free. No commitments. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10 px-6">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          {(['monthly', 'annual'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billing === b ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              {b === 'monthly' ? 'Monthly' : 'Annual'}{b === 'annual' && ' 🎉'}
            </button>
          ))}
        </div>
        {billing === 'annual' && (
          <span className="ml-4 self-center text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            Save up to 36%
          </span>
        )}
      </div>

      {/* Plan Cards */}
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const price = billing === 'monthly' ? plan.monthly : plan.annual;
            const perMonth = billing === 'annual' ? Math.round(plan.annual / 12) : plan.monthly;
            const savings = annualSavings(plan);
            const isActive = currentSubscription?.status === 'active' || currentSubscription?.status === 'trialing';

            return (
              <div
                key={plan.id}
                className={`relative rounded-[2rem] p-8 border transition-all ${plan.highlight
                  ? 'bg-gradient-to-br from-indigo-950/80 to-violet-950/80 border-indigo-500/40 shadow-2xl shadow-indigo-900/20'
                  : 'bg-slate-900/80 border-slate-800'
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl ${plan.iconBg} border flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                </div>

                <h2 className="text-2xl font-black text-white mb-1">{plan.name}</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white">${billing === 'annual' ? perMonth : price}</span>
                    <span className="text-slate-500 text-sm mb-2">/month</span>
                  </div>
                  {billing === 'annual' ? (
                    <p className="text-xs text-emerald-400 font-semibold mt-1">Billed ${plan.annual}/year · Save {savings}%</p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">or ${Math.round(plan.annual / 12)}/mo billed annually</p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={createSubscriptionMutation.isPending || isActive}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all mb-6 flex items-center justify-center gap-2 ${plan.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    } disabled:opacity-50`}
                >
                  {createSubscriptionMutation.isPending && selectedPlanId === plan.id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up trail...</>
                    : isActive
                      ? 'Current Plan'
                      : <>{plan.cta} <ChevronRight className="w-4 h-4" /></>
                  }
                </button>

                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison */}
      <div className="max-w-3xl mx-auto px-6 mb-20">
        <h2 className="text-center text-lg font-black text-slate-300 mb-6 uppercase tracking-widest text-sm">
          Full Comparison
        </h2>
        <div className="bg-slate-900/50 rounded-[2rem] border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-black uppercase tracking-widest bg-slate-800/50 border-b border-slate-800">
            <div className="p-4 text-slate-400">Feature</div>
            <div className="p-4 text-center text-slate-300">Core</div>
            <div className="p-4 text-center text-violet-300">Pro</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 text-sm ${i !== COMPARISON.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
              <div className="p-4 text-slate-400">{row.feature}</div>
              <div className="p-4 text-center text-slate-300">{row.core}</div>
              <div className="p-4 text-center text-slate-200 font-semibold">{row.pro}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust row */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, label: '14-Day Free Trial', sub: 'Full access, cancel before Day 14 and pay nothing' },
            { icon: Star, label: 'No Long Contracts', sub: 'Month-to-month. Pause or cancel anytime' },
            { icon: Brain, label: 'HIPAA-Compliant', sub: 'Your health data is encrypted and never sold' },
          ].map(t => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="bg-slate-900/50 rounded-3xl border border-slate-800 p-5 flex gap-4 items-start">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">{t.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{t.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}