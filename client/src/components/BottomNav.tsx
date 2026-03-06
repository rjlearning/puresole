import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Map, Zap, MoreHorizontal, X, Settings, Users, Mic, LogOut, ShieldAlert } from "lucide-react";

async function signOut() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } finally {
        window.location.href = "/auth";
    }
}

const TABS = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "plan", label: "Plan", icon: Map, href: "/treatment-plan" },
    { id: "activities", label: "Activities", icon: Zap, href: "/activities" },
    { id: "more", label: "More", icon: MoreHorizontal, href: null }, // opens sheet
];

const MORE_ITEMS = [
    { icon: Mic, label: "Vocal Scan", href: "/voice-analyzer", color: "text-indigo-400" },
    { icon: Users, label: "Community", href: "/community", color: "text-emerald-400" },
    { icon: ShieldAlert, label: "Crisis Help", href: "/crisis-support", color: "text-rose-400" },
    { icon: Settings, label: "Settings", href: "/settings", color: "text-slate-400" },
];

// Routes where the bottom nav should be hidden
const HIDDEN_ROUTES = ["/", "/auth", "/login", "/register", "/onboarding", "/landing"];

export function BottomNav() {
    const [location] = useLocation();
    const [showMore, setShowMore] = useState(false);

    // Hide on landing / auth / onboarding
    if (HIDDEN_ROUTES.some(r => location === r || location.startsWith(r + "?"))) return null;
    // Also hide on the dashboard — it has its own full header
    if (location === "/dashboard") return null;

    const activeTab = TABS.find(t => t.href && location.startsWith(t.href))?.id ?? null;

    return (
        <>
            {/* More sheet backdrop */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60]"
                        onClick={() => setShowMore(false)}
                    />
                )}
            </AnimatePresence>

            {/* More slide-up sheet */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] bg-slate-900 border-t border-slate-800 rounded-t-[2rem] pb-safe"
                    >
                        <div className="px-6 pt-5 pb-6">
                            {/* Drag handle */}
                            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {MORE_ITEMS.map(item => (
                                    <Link key={item.href} href={item.href}>
                                        <div
                                            onClick={() => setShowMore(false)}
                                            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all active:scale-95"
                                        >
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                            <span className="text-sm font-bold text-slate-200">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Sign out */}
                            <button
                                onClick={signOut}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/10 transition-all active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60 pb-safe">
                <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
                    {TABS.map(tab => {
                        const isActive = tab.href ? activeTab === tab.id : showMore;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.href === null) {
                                        setShowMore(m => !m);
                                    } else {
                                        setShowMore(false);
                                        window.location.href = tab.href;
                                    }
                                }}
                                className="flex flex-col items-center gap-1 px-4 py-2 relative"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-pill"
                                        className="absolute inset-0 rounded-2xl bg-indigo-500/15 border border-indigo-500/20"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest relative z-10 transition-colors ${isActive ? "text-indigo-400" : "text-slate-600"}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
