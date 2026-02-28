import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import GroundingGuide from "@/components/GroundingGuide";
import { startBinauralDrone, stopBinauralDrone } from "@/lib/audio";

export default function SOSPage() {
    const [isActive, setIsActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Stop audio when unmounting
    useEffect(() => {
        stopBinauralDrone();
        return () => {
            stopBinauralDrone();
        };
    }, []);

    const handleStart = () => {
        setIsActive(true);
        startBinauralDrone();
    };

    const handlePause = () => {
        setIsActive(false);
        stopBinauralDrone();
    };

    const handleComplete = () => {
        setIsComplete(true);
        setIsActive(false);
        stopBinauralDrone();
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Immersive SOS Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-10" />

            {/* Navigation (Minimalist) */}
            <div className="absolute top-6 left-6">
                <Link href="/">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Exit
                    </Button>
                </Link>
            </div>

            <AnimatePresence mode="wait">
                {!isActive && !isComplete ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="text-center max-w-md w-full"
                    >
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                            <ShieldAlert className="h-10 w-10 text-rose-500" />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-4">Emergency Grounding</h1>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            You are safe. This is just a moment, and it will pass. Press the button below to begin a guided 5-4-3-2-1 sensory grounding exercise.
                        </p>

                        <Button
                            size="lg"
                            onClick={handleStart}
                            className="w-full h-16 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                        >
                            Begin Grounding
                        </Button>
                    </motion.div>
                ) : isComplete ? (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md w-full"
                    >
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">You did it.</h2>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    Take a deep breath. Notice how your body feels now compared to when you started. You are anchored in the present.
                                </p>
                                <div className="flex gap-4">
                                    <Link href="/" className="w-full">
                                        <Button variant="secondary" className="w-full rounded-xl">
                                            Return Home
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl"
                    >
                        <GroundingGuide
                            onStart={handleStart}
                            onPause={handlePause}
                            onComplete={handleComplete}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
