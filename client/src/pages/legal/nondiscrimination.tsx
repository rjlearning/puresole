import { Link } from 'wouter';
import { Scale, ChevronRight } from 'lucide-react';

export default function NondiscriminationPolicy() {
    const protectedCategories = [
        'Race, color, or national origin', 'Sex, gender identity, or sexual orientation',
        'Age', 'Disability (physical or mental)', 'Religion or creed',
        'Pregnancy or parental status', 'Veteran or military status',
        'Genetic information',
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-emerald-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-emerald-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Nondiscrimination Policy</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Scale className="w-6 h-6 text-emerald-300" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Nondiscrimination Policy</h1>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        PureSoul is committed to providing equal access to all individuals, regardless of personal characteristics or background.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Equal Access Statement</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        PureSoul does not discriminate on the basis of any protected characteristic in providing access to, or the quality of, its services. Every individual has the right to access PureSoul's platform with dignity, respect, and equal commitment to their wellbeing.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Protected Characteristics</h2>
                    <p className="text-slate-600 text-sm mb-4">PureSoul does not discriminate based on:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {protectedCategories.map(cat => (
                            <div key={cat} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span className="text-slate-700 text-sm">{cat}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Accommodation Requests</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        If you require an accommodation to access or use PureSoul due to a disability, please contact us at <a href="mailto:accessibility@puresoul.app" className="text-indigo-600 underline">accessibility@puresoul.app</a>. We are committed to providing reasonable accommodations in a timely manner. Please describe your needs and we will work with you to identify an appropriate solution.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Filing a Complaint</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        If you believe you have been subjected to discrimination, you may file a complaint with us at <a href="mailto:compliance@puresoul.app" className="text-indigo-600 underline">compliance@puresoul.app</a>. We will investigate all complaints and respond within 10 business days. You also have the right to file a complaint with the U.S. Department of Health and Human Services (HHS) Office for Civil Rights at <a href="https://www.hhs.gov/ocr" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">www.hhs.gov/ocr</a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Applicable Laws</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        This policy is consistent with Section 1557 of the Affordable Care Act, Section 504 of the Rehabilitation Act, the Age Discrimination Act, Title VI of the Civil Rights Act of 1964, and all other applicable federal and state civil rights laws.
                    </p>
                </section>
            </div>
        </div>
    );
}
