import { Link } from 'wouter';
import { Heart } from 'lucide-react';

const LEGAL_LINKS = [
    { label: 'Privacy Notice', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Informed Consent', href: '/legal/informed-consent' },
    { label: 'Cookie Preferences', href: '/legal/cookies' },
    { label: 'Nondiscrimination', href: '/legal/nondiscrimination' },
    { label: 'Notice of Privacy Practices', href: '/legal/notice-of-privacy-practices' },
    { label: 'Accessibility', href: '/legal/accessibility' },
    { label: 'Contact Us', href: '/contact' },
];

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/5">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Brand + tagline */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/20">
                        <Heart className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="font-black text-white text-sm tracking-tight">PureSoul</span>
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl mb-5">
                    PureSoul provides AI-assisted wellness insights for informational and personal support purposes only.
                    It is not a licensed healthcare provider and does not offer medical diagnosis, clinical treatment,
                    or professional mental health services. Always consult a qualified healthcare professional for
                    medical decisions. If you are experiencing a mental health emergency, call{' '}
                    <a href="tel:988" className="text-indigo-400 hover:text-indigo-300 transition-colors">988</a>{' '}
                    (Suicide &amp; Crisis Lifeline) or{' '}
                    <a href="tel:911" className="text-rose-400 hover:text-rose-300 transition-colors">911</a>.
                </p>

                {/* Divider */}
                <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Copyright */}
                    <p className="text-[11px] text-slate-600">
                        © {new Date().getFullYear()} PureSoul Inc. All rights reserved. &nbsp;Live well, live long.
                    </p>

                    {/* Legal links — pill row */}
                    <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal navigation">
                        {LEGAL_LINKS.map(l => (
                            <Link key={l.href + l.label} href={l.href}>
                                <span className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer whitespace-nowrap">
                                    {l.label}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </footer>
    );
}
