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
        '/onboarding',
        '/ai-companion'
    ];

    useEffect(() => {
        // Check if the current exact path is in the hidden paths list
        // or if we're on a root level path that acts as a dashboard
        const shouldHide = hiddenPaths.includes(location) ||
            location.startsWith('/auth') ||
            (location.startsWith('/women/') && location !== '/women');
        setIsVisible(!shouldHide);
    }, [location]);

    const handleBack = () => {
        // Check if the history API has somewhere to go back to within the app
        if (window.history.length > 2) {
            window.history.back();
        } else {
            // Fallback: routing directly to dashboard
            setLocation('/dashboard');
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={handleBack}
                    className={cn(
                        "fixed top-4 left-4 z-[60]", // Mobile positioning
                        "flex items-center gap-2 px-3 py-2 rounded-full",
                        "bg-white/90 backdrop-blur-md border border-slate-200 shadow-md",
                        "text-slate-700 font-semibold text-sm transition-all duration-300",
                        "hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-lg hover:border-indigo-200",
                        "group lg:top-8 lg:left-[20rem]" // Desktop sidebar spacing
                    )}
                >
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Back</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
