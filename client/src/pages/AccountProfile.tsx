import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { 
    User, Mail, Shield, Bell, Settings, LogOut, 
    CreditCard, Smartphone, Moon, Sun, Monitor, ChevronRight,
    Camera, CheckCircle2, AlertTriangle, ChevronLeft
} from 'lucide-react';
import MeshBackground from '@/components/MeshBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabId = 'general' | 'plan' | 'preferences' | 'danger';

export default function AccountProfile() {
    const { user, logout } = useAuth();
    const [, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState<TabId>('general');
    
    // Simulated form state for demo interactions
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 1000);
    };

    const tabs: { id: TabId, label: string, icon: any, danger?: boolean }[] = [
        { id: 'general', label: 'General Info', icon: User },
        { id: 'plan', label: 'My Plan', icon: CreditCard },
        { id: 'preferences', label: 'Preferences', icon: Settings },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
    ];

    // Framer motion variants
    const contentVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
            <MeshBackground variant="indigo" />

            {/* Top Navigation */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-4 sm:px-8">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.history.back()}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-black text-white tracking-tight">Account Settings</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-28 pb-24 lg:flex lg:gap-12 relative z-10">
                {/* Left Sidebar Navigation */}
                <div className="lg:w-72 lg:shrink-0 mb-10 lg:mb-0">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 sticky top-28 shadow-xl">
                        <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/5">
                            <div className="relative group cursor-pointer mb-4">
                                <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 overflow-hidden">
                                    <User className="w-10 h-10 text-indigo-400" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-white">{user?.firstName || 'User'} {user?.lastName || ''}</h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">{user?.email || 'user@example.com'}</p>
                            <div className="mt-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full inline-flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-300">Premium Active</span>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabId)}
                                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left ${
                                            isActive 
                                                ? tab.danger 
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive && tab.danger ? 'text-rose-400' : ''}`} />
                                        <span className="font-bold text-sm uppercase tracking-wide">{tab.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
                
                {/* Right/Bottom Content Area */}
                <div className="lg:flex-1 h-full min-h-[60vh]">
                     <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div key="general" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-10 shadow-xl">
                                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">Personal Details</h2>
                                    <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">First Name</label>
                                                <Input defaultValue={user?.firstName || ''} className="h-14 bg-slate-950/50 border-white/10 text-white focus:border-indigo-500" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                                                <Input defaultValue={user?.lastName || ''} className="h-14 bg-slate-950/50 border-white/10 text-white focus:border-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <Input defaultValue={user?.email || ''} type="email" readOnly className="h-14 pl-12 bg-slate-950/50 border-white/10 text-slate-400 cursor-not-allowed" />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Shield className="w-3 h-3"/> Contact support to change email.</p>
                                        </div>
                                        
                                        <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                                            {saveSuccess && <span className="text-sm font-black text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Saved successfully</span>}
                                            <Button type="submit" disabled={isSaving} className="ml-auto h-12 px-8 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl">
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Plan & Subscription Tab */}
                        {activeTab === 'plan' && (
                            <motion.div key="plan" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-10 shadow-xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-3xl font-black text-white tracking-tighter">My Plan</h2>
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-widest rounded-full">
                                            Active
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden mb-8">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] -mr-10 -mt-10 rounded-full" />
                                        <h3 className="text-2xl font-black text-white mb-2 relative z-10">PureSoul Premium</h3>
                                        <p className="text-sm text-indigo-200/80 font-medium mb-6 max-w-md relative z-10">
                                            Unlimited access to biometric optimization, real-time voice analysis, and personalized metabolic protocols.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button className="h-12 px-8 bg-white hover:bg-indigo-50 text-indigo-900 font-black rounded-xl">
                                                Manage Billing
                                            </Button>
                                            <Button variant="outline" className="h-12 px-8 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 font-black rounded-xl bg-transparent">
                                                Cancel Plan
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Billing Cycle</p>
                                            <p className="text-lg font-bold text-white">Yearly</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Next Payment</p>
                                            <p className="text-lg font-bold text-white">Nov 12, 2026</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <motion.div key="preferences" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-10 shadow-xl">
                                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">App Preferences</h2>

                                    <div className="space-y-6">
                                        {/* Toggles simulated visually */}
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                    <Bell className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">Push Notifications</p>
                                                    <p className="text-xs text-slate-400 mt-1">Daily protocol reminders and check-in prompts.</p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-6 rounded-full bg-indigo-500 flex items-center p-1 justify-end cursor-pointer">
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                    <Smartphone className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">SMS Updates</p>
                                                    <p className="text-xs text-slate-400 mt-1">Receive urgent biometric alerts directly to your phone.</p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-6 rounded-full bg-slate-800 flex items-center p-1 justify-start border border-white/10 cursor-pointer">
                                                <div className="w-4 h-4 rounded-full bg-slate-400" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/50 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                    <Monitor className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">Theme</p>
                                                    <p className="text-xs text-slate-400 mt-1">Match system settings automatically.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-white/10">
                                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><Moon className="w-4 h-4" /></div>
                                                <div className="p-2 rounded-lg text-slate-500 hover:text-slate-300"><Sun className="w-4 h-4" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Danger Zone Tab */}
                        {activeTab === 'danger' && (
                            <motion.div key="danger" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-6 sm:p-10 shadow-xl">
                                    <div className="flex items-center gap-3 mb-8">
                                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                                        <h2 className="text-3xl font-black text-rose-400 tracking-tighter">Danger Zone</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-slate-950/50 border border-rose-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                            <div>
                                                <p className="font-bold text-white">Log out of all devices</p>
                                                <p className="text-sm text-slate-400 mt-1 max-w-sm">Securely log out of your current session and any other active instances.</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => logout()} 
                                                className="shrink-0 h-12 px-6 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" /> Log out
                                            </Button>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                            <div>
                                                <p className="font-bold text-rose-400">Permanently delete account</p>
                                                <p className="text-sm text-rose-400/70 mt-1 max-w-md">Once you delete your account, there is no going back. All your biometric history and journals will be erased.</p>
                                            </div>
                                            <Button className="shrink-0 h-12 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black">
                                                Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
