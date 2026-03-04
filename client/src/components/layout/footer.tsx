import { Link } from 'wouter';
import { Heart } from 'lucide-react';

const HELP_LINKS = [
    { label: 'Support Center', href: '/support' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Accessibility', href: '/legal/accessibility' },
    { label: 'Crisis Resources', href: '/crisis-support' },
];

const LEGAL_LINKS = [
    { label: 'Privacy Notice', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Informed Consent', href: '/legal/informed-consent' },
    { label: 'Cookie Preferences', href: '/legal/cookies' },
    { label: 'Nondiscrimination Policy', href: '/legal/nondiscrimination' },
    { label: 'Notice of Privacy Practices', href: '/legal/notice-of-privacy-practices' },
    { label: 'Your Privacy Choices', href: '/legal/cookies' },
];

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/60 mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Top grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                                <Heart className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="font-black text-white text-sm">PureSoul</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500">
                            AI-driven mental wellness for men and women. Not a substitute for licensed clinical care.
                        </p>
                        <p className="text-xs text-slate-600 mt-3">
                            © {new Date().getFullYear()} PureSoul Inc. All rights reserved.
                        </p>
                    </div>

                    {/* Help & Support */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Help &amp; Support</h3>
                        <ul className="space-y-2.5">
                            {HELP_LINKS.map(l => (
                                <li key={l.href}>
                                    <Link href={l.href}>
                                        <span className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">{l.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Legal</h3>
                        <ul className="space-y-2.5">
                            {LEGAL_LINKS.map(l => (
                                <li key={l.href + l.label}>
                                    <Link href={l.href}>
                                        <span className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">{l.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800 pt-6">
                    <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                        PureSoul is intended for wellness purposes only and does not provide medical diagnosis or treatment.
                        If you are experiencing a mental health emergency, call{' '}
                        <a href="tel:988" className="text-indigo-400 hover:text-indigo-300 font-semibold">988</a>{' '}
                        or{' '}
                        <a href="tel:911" className="text-rose-400 hover:text-rose-300 font-semibold">911</a>.
                    </p>
                </div>
            </div>
        </footer>
    );
}
