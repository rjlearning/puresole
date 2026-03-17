import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function SmartBackButton() {
    const [location, setLocation] = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    // Define paths where the back button should NOT appear
    const hiddenPaths = [
        '/',
        '/dashboard',
        '/login',
        '/register',
        '/auth',
    ];

    useEffect(() => {
        const shouldHide = hiddenPaths.includes(location);
        setIsVisible(!shouldHide);
    }, [location]);

    const handleBack = () => {
        if (window.history.length > 2) {
            window.history.back();
        } else {
            setLocation('/dashboard');
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleBack}
                    className={cn(
                        "fixed top-5 left-5 z-[60]",
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl",
                        "text-white transition-all duration-300",
                        "hover:bg-slate-800 hover:scale-110 active:scale-95",
                        "group"
                    )}
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
