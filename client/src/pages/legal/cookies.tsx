import { useState } from 'react';
import { Link } from 'wouter';
import { Cookie, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COOKIE_CATEGORIES = [
    {
        id: 'essential',
        name: 'Essential Cookies',
        description: 'Required for the platform to function. These include session authentication tokens and security cookies. They cannot be disabled.',
        examples: ['Session token', 'CSRF protection', 'Account authentication'],
        required: true,
    },
    {
        id: 'analytics',
        name: 'Analytics Cookies',
        description: 'Help us understand how users interact with PureSoul so we can improve the platform. Data is aggregated and anonymized.',
        examples: ['Page views', 'Feature usage frequency', 'Session duration'],
        required: false,
    },
    {
        id: 'personalization',
        name: 'Personalization Cookies',
        description: 'Remember your preferences and settings (such as your selected theme or language) to provide a more consistent experience.',
        examples: ['Theme preference', 'Layout settings', 'Language preference'],
        required: false,
    },
];

const STORAGE_KEY = 'puresoul_cookie_prefs';

function loadPreferences(): Record<string, boolean> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { essential: true, analytics: false, personalization: false };
}

export default function CookiePreferences() {
    const [prefs, setPrefs] = useState<Record<string, boolean>>(loadPreferences);
    const [saved, setSaved] = useState(false);
    const { toast } = useToast();

    const toggle = (id: string) => {
        setPrefs(p => ({ ...p, [id]: !p[id] }));
        setSaved(false);
    };

    const save = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        setSaved(true);
        toast({ title: 'Preferences Saved', description: 'Your cookie preferences have been updated.' });
    };

    const acceptAll = () => {
        const all = Object.fromEntries(COOKIE_CATEGORIES.map(c => [c.id, true]));
        setPrefs(all);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        setSaved(true);
        toast({ title: 'All Cookies Accepted' });
    };

    const rejectOptional = () => {
        const minimal = Object.fromEntries(COOKIE_CATEGORIES.map(c => [c.id, c.required]));
        setPrefs(minimal);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        setSaved(true);
        toast({ title: 'Optional Cookies Rejected', description: 'Only essential cookies are active.' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-amber-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-amber-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Cookie Preferences</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                            <Cookie className="w-6 h-6 text-amber-300" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Cookie Preferences</h1>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        We use cookies to keep you logged in and to improve your experience. Choose which categories you're comfortable with below.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Bulk actions */}
                <div className="flex gap-3 mb-8">
                    <button onClick={acceptAll} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-colors">
                        Accept All
                    </button>
                    <button onClick={rejectOptional} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm transition-colors">
                        Reject Optional
                    </button>
                </div>

                {/* Categories */}
                <div className="space-y-4 mb-8">
                    {COOKIE_CATEGORIES.map(cat => (
                        <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h2 className="font-bold text-slate-900">{cat.name}</h2>
                                    {cat.required && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Always On</span>
                                    )}
                                </div>
                                {/* Toggle */}
                                <button
                                    disabled={cat.required}
                                    onClick={() => toggle(cat.id)}
                                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${prefs[cat.id] ? 'bg-indigo-600' : 'bg-slate-200'} ${cat.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    aria-checked={prefs[cat.id]}
                                    role="switch"
                                    aria-label={`Toggle ${cat.name}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs[cat.id] ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">{cat.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {cat.examples.map(ex => (
                                    <span key={ex} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">{ex}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save */}
                <button
                    onClick={save}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {saved ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved!</> : 'Save My Preferences'}
                </button>

                <p className="text-center text-xs text-slate-400 mt-4">
                    For more information, see our <Link href="/legal/privacy"><span className="underline cursor-pointer text-indigo-500">Privacy Notice</span></Link>.
                </p>
            </div>
        </div>
    );
}
