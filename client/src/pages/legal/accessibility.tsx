import { Link } from 'wouter';
import { Eye, ChevronRight } from 'lucide-react';

export default function AccessibilityPage() {
    const features = [
        { title: 'Keyboard Navigation', desc: 'All interactive elements are reachable and operable via keyboard.' },
        { title: 'Screen Reader Support', desc: 'We use semantic HTML and ARIA attributes to ensure compatibility with screen readers including NVDA, JAWS, and VoiceOver.' },
        { title: 'Color Contrast', desc: 'Text and UI elements meet or exceed WCAG 2.1 AA color contrast ratios of 4.5:1 for normal text.' },
        { title: 'Scalable Text', desc: 'The interface respects browser font size settings and scales without loss of content or functionality up to 200%.' },
        { title: 'Focus Indicators', desc: 'Visible focus indicators are provided for all interactive elements.' },
        { title: 'Alternative Text', desc: 'Meaningful images include descriptive alt text. Decorative images are marked appropriately.' },
    ];

    const limitations = [
        'Some third-party embedded components (e.g., certain chart libraries) may not be fully accessible. We are actively working with providers to remediate these.',
        'Voice analysis features require microphone access and may not be fully usable with all assistive technologies. Text-based alternatives are available for all core wellness features.',
        'Some complex data visualizations may have limited screen-reader descriptions. We are building enhanced text summaries for these.',
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-sky-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-sky-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span>Legal</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Accessibility</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-500/30">
                            <Eye className="w-6 h-6 text-sky-300" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Accessibility Statement</h1>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        PureSoul is committed to making our platform accessible to everyone, including people with disabilities. We aim to conform to WCAG 2.1 Level AA guidelines.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Our Commitment</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        We believe that mental wellness tools should be available to everyone without barriers. PureSoul actively designs for accessibility, incorporates accessibility testing into our development process, and continuously works to improve the experience for users with disabilities.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">Accessibility Features</h2>
                    <div className="grid gap-4">
                        {features.map(f => (
                            <div key={f.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                                <p className="text-slate-600 text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Known Limitations</h2>
                    <p className="text-slate-600 text-sm mb-4">We are aware of the following limitations and are actively working to address them:</p>
                    <ul className="space-y-3">
                        {limitations.map((l, i) => (
                            <li key={i} className="flex gap-3 text-slate-600 text-sm">
                                <span className="text-amber-500 font-bold flex-shrink-0">⚠</span>
                                {l}
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Assistive Technology</h2>
                    <p className="text-slate-600 text-sm">
                        We test regularly with: NVDA + Chrome, JAWS + Chrome/Edge, VoiceOver + Safari (macOS and iOS), TalkBack + Chrome (Android).
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Feedback & Contact</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        If you encounter barriers while using PureSoul, please let us know. We treat accessibility feedback with high priority. Email us at{' '}
                        <a href="mailto:accessibility@puresoul.app" className="text-indigo-600 underline">accessibility@puresoul.app</a>{' '}
                        or use our <Link href="/contact"><span className="text-indigo-600 underline cursor-pointer">Contact page</span></Link>.
                        We aim to respond within 3 business days.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Standards & Conformance</h2>
                    <p className="text-slate-600 text-sm">
                        This statement was prepared on March 3, 2026. Our target conformance level is WCAG 2.1 Level AA. We conduct formal accessibility audits on a bi-annual basis and continuous automated scanning with every deployment.
                    </p>
                </section>
            </div>
        </div>
    );
}
