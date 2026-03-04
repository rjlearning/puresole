import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, X, HeartHandshake, ChevronRight } from 'lucide-react';

interface Props {
    subscriptionId: string;
    onKeptSubscription: () => void;
    onConfirmedCancel: () => void;
    onClose: () => void;
}

export default function RetentionModal({ subscriptionId, onKeptSubscription, onConfirmedCancel, onClose }: Props) {
    const { toast } = useToast();
    const [step, setStep] = useState<'offer' | 'confirming'>('offer');

    const applyDiscountMutation = useMutation({
        mutationFn: async (accept: boolean) => {
            const res = await apiRequest('POST', '/api/apply-retention-discount', { accept });
            return res.json();
        },
        onSuccess: (_data, accept) => {
            if (accept) {
                toast({
                    title: '🎉 Discount Applied!',
                    description: '30% off has been applied for your next 3 months. Thank you for staying!',
                });
                queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
                onKeptSubscription();
            } else {
                onConfirmedCancel();
            }
        },
        onError: () => {
            toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
        },
    });

    const handleAccept = () => applyDiscountMutation.mutate(true);
    const handleDecline = () => {
        setStep('confirming');
    };
    const handleConfirmCancel = () => applyDiscountMutation.mutate(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-slate-900 border border-slate-700 rounded-[2rem] max-w-md w-full shadow-2xl">

                {/* Close */}
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {step === 'offer' ? (
                    <div className="p-8">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-6">
                            <Gift className="w-8 h-8 text-indigo-400" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">Before you go…</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            We'd love for you to stay. As a thank-you for being a PureSoul member, we're offering you an exclusive discount:
                        </p>

                        {/* Offer highlight */}
                        <div className="bg-gradient-to-br from-indigo-950/80 to-violet-950/80 border border-indigo-500/30 rounded-2xl p-5 mb-6">
                            <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-1">Limited Offer</p>
                            <p className="text-4xl font-black text-white mb-1">30% off</p>
                            <p className="text-slate-300 text-sm">for the next <strong>3 months</strong> — automatically applied</p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {[
                                'No action needed — discount is applied instantly',
                                'Full access continues without interruption',
                                'Cancel again anytime after 3 months',
                            ].map((t, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-400 text-[10px] font-black">✓</span>
                                    </div>
                                    {t}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={handleAccept}
                                disabled={applyDiscountMutation.isPending}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {applyDiscountMutation.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying discount...</>
                                    : <><HeartHandshake className="w-4 h-4" /> Keep My Subscription at 30% Off</>}
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={applyDiscountMutation.isPending}
                                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                            >
                                No thanks, cancel anyway
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mb-6">
                            <X className="w-8 h-8 text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Confirm cancellation</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Your subscription will remain active until the end of your current billing period.
                            After that, you'll lose access to AI coaching, voice analysis, and your health protocols.
                        </p>

                        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-6">
                            <p className="text-slate-400 text-xs">You'll still be able to export your data. Your history is preserved for 90 days after cancellation.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmCancel}
                                disabled={applyDiscountMutation.isPending}
                                className="w-full py-4 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {applyDiscountMutation.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Canceling...</>
                                    : 'Yes, cancel my subscription'}
                            </button>
                            <button
                                onClick={() => setStep('offer')}
                                className="w-full py-3 text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-1"
                            >
                                ← See the 30% discount offer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
