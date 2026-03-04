import { Link } from 'wouter';
import { Heart, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function InformedConsent() {
    const points = [
        {
            title: 'Nature of the Service',
            body: 'PureSoul is an AI-driven mental wellness platform. It is not a licensed mental health practice, and the insights it generates are not a substitute for professional diagnosis or treatment by a qualified clinician.',
        },
        {
            title: 'Voluntary Participation',
            body: 'Your use of PureSoul and the sharing of personal health information is entirely voluntary. You may pause or stop using any feature at any time without consequence.',
        },
        {
            title: 'Types of Data Collected',
            body: 'By using PureSoul, you consent to the collection and analysis of health assessment responses, voice recordings and vocal biomarker data, biometric inputs, and behavioral usage patterns for the purpose of generating personalized wellness insights.',
        },
        {
            title: 'Risks of Disclosure',
            body: 'The disclosure of personal health information carries inherent risks, including the possibility of data breaches despite our security safeguards. We implement industry-standard protections, but no system is entirely risk-free. You should only share information you are comfortable sharing.',
        },
        {
            title: 'Benefits of Participation',
            body: 'Engaging with PureSoul may provide increased self-awareness, structured wellness protocols, AI-powered health insights, progress tracking over time, and access to evidence-based tools and exercises tailored to your needs.',
        },
        {
            title: 'Crisis Detection & Emergency Protocols',
            body: 'Our AI system monitors interactions for indicators of crisis, including suicidal ideation or intent to harm. If crisis signals are detected, you will be immediately presented with emergency resources (988 Suicide & Crisis Lifeline, Crisis Text Line: Text HOME to 741741, 911 for immediate danger). In extreme cases and where legally required, we may contact emergency services.',
        },
        {
            title: 'AI Limitations',
            body: 'AI-generated insights are probabilistic in nature and may not reflect your unique circumstances with complete accuracy. Always apply your own judgment and consult qualified professionals for significant health decisions.',
        },
        {
            title: 'Your Right to Withdraw',
            body: 'You may withdraw your consent and delete your account and health data at any time by visiting Settings → Account → Delete Account, or by contacting privacy@puresoul.app.',
        },
        {
            title: 'Contact for Questions',
            body: 'If you have questions about this Informed Consent before continuing, please contact us at support@puresoul.app or visit our Contact page.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-rose-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-rose-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Informed Consent</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30">
                            <Heart className="w-6 h-6 text-rose-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Informed Consent</h1>
                            <p className="text-rose-300 text-sm mt-1">Please read before using PureSoul</p>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        This document explains what you are agreeing to when you use PureSoul. We believe informed users make empowered decisions about their health.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    {points.map((point, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 mb-2">{point.title}</h2>
                                <p className="text-slate-600 text-sm leading-relaxed">{point.body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <p className="text-indigo-800 text-sm font-medium">
                        By creating an account and using PureSoul, you acknowledge that you have read, understood, and consent to the terms described above. This constitutes your electronic agreement with PureSoul.
                    </p>
                </div>
            </div>
        </div>
    );
}
