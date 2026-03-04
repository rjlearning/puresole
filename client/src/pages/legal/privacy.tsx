import { Link } from 'wouter';
import { Shield, ChevronRight } from 'lucide-react';

const EFFECTIVE_DATE = 'March 3, 2026';

const sections = [
    {
        id: 'information-we-collect',
        title: '1. Information We Collect',
        content: [
            '**Account Information:** When you register, we collect your name, email address, and a hashed password. We do not store your password in plain text.',
            '**Health & Assessment Data:** Mental health assessment responses (PHQ-9, GAD-7, etc.), voice journal entries, vocal biomarker measurements, biometric inputs (weight, height, age, activity level), and wearable-device data you choose to connect.',
            '**Usage Information:** Pages visited, features used, session duration, and device/browser metadata for analytics and service improvement.',
            '**Payment Information:** Billing details are processed by Stripe. PureSoul does not store full credit card numbers.',
        ],
    },
    {
        id: 'how-we-use',
        title: '2. How We Use Your Information',
        content: [
            '**Personalization:** To generate AI-driven health insights, protocol recommendations, and treatment plans tailored to you.',
            '**Safety Monitoring:** Our AI continuously monitors for crisis signals (e.g., suicidal ideation). When detected, you receive immediate resources and, if necessary, we may contact emergency services.',
            '**Service Improvement:** Aggregated, de-identified data helps us train AI models and improve platform quality. Individual identifiable data is never used for model training without explicit consent.',
            '**Communications:** We send service-related emails (password resets, billing receipts). Marketing communications require your opt-in and can be withdrawn at any time.',
        ],
    },
    {
        id: 'data-sharing',
        title: '3. How We Share Your Information',
        content: [
            '**We do not sell your personal or health information — ever.**',
            '**Service Providers:** Trusted sub-processors (e.g., Stripe for payments, our cloud hosting provider) may access data only as needed to deliver the service under strict confidentiality agreements.',
            '**Legal Requirements:** We may disclose information if required by valid legal process (subpoena, court order) or to protect the safety of any individual.',
            '**Emergency Situations:** In a life-threatening crisis, we may contact emergency services with the minimum information required to protect your safety or the safety of others.',
        ],
    },
    {
        id: 'data-retention',
        title: '4. Data Retention',
        content: [
            'Account data is retained for as long as your account is active.',
            'Health assessment and voice data are retained for 3 years from the date of collection to enable longitudinal tracking, after which they are automatically deleted.',
            'Payment records are retained for 7 years as required by financial regulations.',
            'You may request early deletion of your data at any time (see Your Rights below).',
        ],
    },
    {
        id: 'your-rights',
        title: '5. Your Privacy Rights',
        content: [
            '**Access:** Request a copy of the personal data we hold about you.',
            '**Correction:** Request that inaccurate data be corrected.',
            '**Deletion:** Request deletion of your account and associated health data.',
            '**Portability:** Export your data in a machine-readable format.',
            '**Restriction:** Object to certain processing activities, including AI profiling.',
            '**Withdraw Consent:** Withdraw consent for optional processing at any time without penalty.',
            'To exercise any of these rights, email **privacy@puresoul.app** or submit a request through our Contact page. We will respond within 30 days.',
        ],
    },
    {
        id: 'hipaa',
        title: '6. HIPAA Compliance',
        content: [
            'PureSoul is designed to meet the requirements of the Health Insurance Portability and Accountability Act (HIPAA). We implement administrative, physical, and technical safeguards to protect Protected Health Information (PHI).',
            'All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Access to PHI is restricted to authorized personnel on a need-to-know basis, and all access is logged.',
            'For detailed information about how we handle PHI, see our Notice of Privacy Practices.',
        ],
    },
    {
        id: 'cookies',
        title: '7. Cookies & Tracking',
        content: [
            'We use essential cookies to maintain your session and authentication state. Analytics cookies (only with your consent) help us understand how the platform is used.',
            'You can manage your cookie preferences at any time via our Cookie Preferences page.',
        ],
    },
    {
        id: 'contact',
        title: '8. Contact & Updates',
        content: [
            'If you have questions about this Privacy Notice, contact us at **privacy@puresoul.app**.',
            'We may update this notice periodically. Material changes will be notified via email or a prominent in-app banner at least 30 days before they take effect.',
            `**Effective Date:** ${EFFECTIVE_DATE}`,
        ],
    },
];

function Section({ id, title, content }: { id: string; title: string; content: string[] }) {
    return (
        <section id={id} className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
            <ul className="space-y-3">
                {content.map((item, i) => {
                    const parts = item.split(/\*\*(.*?)\*\*/g);
                    return (
                        <li key={i} className="text-slate-600 leading-relaxed text-sm">
                            {parts.map((part, j) =>
                                j % 2 === 1 ? <strong key={j} className="text-slate-800 font-semibold">{part}</strong> : part
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

export default function PrivacyNotice() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-indigo-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Privacy Notice</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                            <Shield className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Privacy Notice</h1>
                            <p className="text-indigo-300 text-sm mt-1">Effective {EFFECTIVE_DATE}</p>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        PureSoul ("we", "us", or "our") is committed to protecting your personal and health information. This Privacy Notice explains what data we collect, how we use it, and your rights regarding your information.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Quick nav */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-10">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contents</h2>
                    <ul className="space-y-2">
                        {sections.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {sections.map(s => <Section key={s.id} {...s} />)}

                <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-sm text-indigo-800 font-medium">
                        Questions about your privacy? Email us at{' '}
                        <a href="mailto:privacy@puresoul.app" className="underline font-bold">privacy@puresoul.app</a>{' '}
                        or visit our <Link href="/contact"><span className="underline cursor-pointer">Contact page</span></Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
