import { Link } from 'wouter';
import { FileCheck, ChevronRight } from 'lucide-react';

export default function NoticeOfPrivacyPractices() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-violet-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-violet-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Notice of Privacy Practices</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
                            <FileCheck className="w-6 h-6 text-violet-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Notice of Privacy Practices</h1>
                            <p className="text-violet-300 text-sm mt-1">HIPAA Notice — Effective March 3, 2026</p>
                        </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        This notice describes how health information about you may be used and disclosed. Please review it carefully.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                    <p className="text-violet-800 text-sm font-semibold">
                        THIS NOTICE DESCRIBES HOW WE MAY USE AND DISCLOSE YOUR PROTECTED HEALTH INFORMATION (PHI) AND YOUR RIGHTS REGARDING THAT INFORMATION.
                    </p>
                </div>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">How We Use Your PHI</h2>
                    <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                        <p><strong className="text-slate-800">Treatment:</strong> We use your health information to provide personalized wellness insights and protocols.</p>
                        <p><strong className="text-slate-800">Operations:</strong> We may use de-identified PHI to evaluate service quality and improve our AI systems.</p>
                        <p><strong className="text-slate-800">Emergency Safety:</strong> We may disclose PHI to prevent serious and imminent threats to health or safety.</p>
                        <p><strong className="text-slate-800">Required by Law:</strong> We disclose PHI where required by applicable federal, state, or local law.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">What We Will NOT Do</h2>
                    <ul className="space-y-2 text-sm text-slate-600">
                        {[
                            'We will not sell your PHI for marketing or commercial purposes.',
                            'We will not disclose your PHI to employers without your written authorization.',
                            'We will not use PHI for any purpose not described in this notice without authorization.',
                        ].map((item, i) => (
                            <li key={i} className="flex gap-2"><span className="text-emerald-500 font-bold">✓</span> {item}</li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Your Rights</h2>
                    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                        <p><strong className="text-slate-800">Access:</strong> Request a copy of your PHI. We will respond within 30 days.</p>
                        <p><strong className="text-slate-800">Amendment:</strong> Request correction of inaccurate or incomplete PHI.</p>
                        <p><strong className="text-slate-800">Accounting of Disclosures:</strong> Request a list of PHI disclosures made outside of treatment/operations.</p>
                        <p><strong className="text-slate-800">Restriction:</strong> Request limits on uses or disclosures of your PHI.</p>
                        <p><strong className="text-slate-800">Confidential Communications:</strong> Request that we communicate with you in a specific way or location.</p>
                        <p><strong className="text-slate-800">Paper Copy:</strong> You may request a paper copy of this notice at any time.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Complaints</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        File a complaint with PureSoul at <a href="mailto:privacy@puresoul.app" className="text-indigo-600 underline">privacy@puresoul.app</a> or with the U.S. Department of Health and Human Services at <a href="https://www.hhs.gov/hipaa/filing-a-complaint" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">hhs.gov/hipaa</a>. We will not retaliate against you for filing a complaint.
                    </p>
                </section>
            </div>
        </div>
    );
}
