import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlowControlBarProps {
    onBack?: () => void;
    onNext?: () => void;
    backLabel?: string;
    nextLabel?: string;
    isNextDisabled?: boolean;
    isBackDisabled?: boolean;
    showNext?: boolean;
    showBack?: boolean;
    isLastStep?: boolean;
    progress?: number; // 0 to 100
}

export function FlowControlBar({
    onBack,
    onNext,
    backLabel = "Back",
    nextLabel = "Continue",
    isNextDisabled = false,
    isBackDisabled = false,
    showNext = true,
    showBack = true,
    isLastStep = false,
    progress,
}: FlowControlBarProps) {
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 z-40 px-6 py-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 pb-safe"
        >
            <div className="max-w-md mx-auto relative">
                {/* Progress line */}
                {progress !== undefined && (
                    <div className="absolute -top-6 left-0 right-0 h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-500"
                        />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {showBack && (
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            disabled={isBackDisabled}
                            className="flex-1 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {backLabel}
                        </Button>
                    )}

                    {showNext && (
                        <Button
                            onClick={onNext}
                            disabled={isNextDisabled}
                            className={`flex-[2] h-14 rounded-2xl font-black text-slate-950 tracking-wide transition-all active:scale-95 disabled:opacity-30 ${isLastStep
                                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600"
                                    : "bg-white hover:bg-slate-100"
                                }`}
                        >
                            {isLastStep ? (
                                <>
                                    Complete <Check className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    {nextLabel} <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
