import { Link } from 'wouter';
import { FileText, ChevronRight } from 'lucide-react';

const EFFECTIVE_DATE = 'March 3, 2026';

const sections = [
    {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        content: `By creating an account or using the PureSoul platform ("Service"), you agree to be bound by these Terms of Service and our Privacy Notice. If you do not agree, do not access or use the Service.`,
    },
    {
        id: 'description',
        title: '2. Description of Service',
        content: `PureSoul provides an AI-assisted mental wellness platform that uses voice analysis, health assessments, and biometric data to generate personalized wellness insights, protocols, and recommendations. The Service is intended to support your personal wellness journey.`,
    },
    {
        id: 'not-medical-care',
        title: '3. Not a Substitute for Medical Care',
        content: `IMPORTANT: PureSoul is NOT a licensed healthcare provider, and the Service does NOT constitute medical advice, diagnosis, or treatment. The platform complements — but does not replace — care from licensed mental health professionals, physicians, or other qualified healthcare providers. If you are in a medical emergency, call 911 or your local emergency number immediately.`,
    },
    {
        id: 'eligibility',
        title: '4. Eligibility',
        content: `You must be at least 18 years of age to use PureSoul. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into this agreement. The Service is not intended for use by individuals under 18 years of age.`,
    },
    {
        id: 'account',
        title: '5. Account Responsibilities',
        content: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these Terms.`,
    },
    {
        id: 'acceptable-use',
        title: '6. Acceptable Use',
        content: `You agree not to: (a) use the Service for any unlawful purpose; (b) upload harmful, abusive, or fraudulent content; (c) attempt to reverse-engineer, scrape, or interfere with the platform's systems; (d) impersonate another person or entity; (e) use automated bots or scripts to access the Service; or (f) circumvent any security or access controls.`,
    },
    {
        id: 'subscriptions',
        title: '7. Subscriptions & Payments',
        content: `Certain features require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. All payments are processed through Stripe. Subscriptions automatically renew unless cancelled before the renewal date. Refunds are issued at our discretion for unused portions of annual plans. We reserve the right to change subscription pricing with 30 days' notice.`,
    },
    {
        id: 'ip',
        title: '8. Intellectual Property',
        content: `All content, software, AI models, and design elements of PureSoul are owned by or licensed to PureSoul Inc. and are protected by applicable intellectual property laws. You retain ownership of the health data and content you submit. By submitting content, you grant us a limited license to process and analyze it solely for the purpose of providing the Service.`,
    },
    {
        id: 'disclaimers',
        title: '9. Disclaimers',
        content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. AI-generated insights are for informational purposes only and may not be accurate for your specific situation.`,
    },
    {
        id: 'liability',
        title: '10. Limitation of Liability',
        content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, PURESOUL'S TOTAL LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.`,
    },
    {
        id: 'termination',
        title: '11. Termination',
        content: `We reserve the right to suspend or terminate your account and access to the Service at our discretion, with or without notice, for violation of these Terms or for any other reason. Upon termination, your right to use the Service ceases. You may delete your account at any time through the Settings page.`,
    },
    {
        id: 'changes',
        title: '12. Changes to Terms',
        content: `We may update these Terms periodically. We will notify you of material changes via email or an in-app notice at least 30 days before they take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.`,
    },
    {
        id: 'governing-law',
        title: '13. Governing Law',
        content: `These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any disputes shall be resolved through binding arbitration under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.`,
    },
    {
        id: 'contact',
        title: '14. Contact',
        content: `For questions about these Terms, email legal@puresoul.app or write to: PureSoul Inc., Legal Department, [Address on file].`,
    },
];

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-indigo-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Terms of Service</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                            <FileText className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
                            <p className="text-indigo-300 text-sm mt-1">Effective {EFFECTIVE_DATE}</p>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        Please read these Terms carefully before using PureSoul. They govern your use of our platform and outline the rights and responsibilities of both parties.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Important callout */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10">
                    <p className="text-amber-800 text-sm font-medium">
                        ⚠️ PureSoul is a wellness tool, not a licensed medical provider. It does not provide clinical diagnosis or replace professional mental health care.
                    </p>
                </div>

                {/* Contents */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-10">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contents</h2>
                    <ul className="grid grid-cols-2 gap-2">
                        {sections.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-sm text-indigo-600 hover:underline">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {sections.map(s => (
                    <section key={s.id} id={s.id} className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">{s.title}</h2>
                        <p className="text-slate-600 leading-relaxed text-sm">{s.content}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
