import { Link } from 'wouter';
import { Mail, Phone, AlertTriangle, MessageSquare, ExternalLink, ChevronRight } from 'lucide-react';

export default function ContactUs() {
    const contacts = [
        {
            icon: Mail,
            label: 'General Support',
            value: 'support@puresoul.app',
            note: 'Account, technical issues, subscription questions',
            href: 'mailto:support@puresoul.app',
            color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        },
        {
            icon: Mail,
            label: 'Privacy Inquiries',
            value: 'privacy@puresoul.app',
            note: 'Data access, deletion, HIPAA requests, privacy concerns',
            href: 'mailto:privacy@puresoul.app',
            color: 'bg-violet-50 text-violet-600 border-violet-100',
        },
        {
            icon: Mail,
            label: 'Accessibility',
            value: 'accessibility@puresoul.app',
            note: 'Accommodation requests, reporting accessibility barriers',
            href: 'mailto:accessibility@puresoul.app',
            color: 'bg-sky-50 text-sky-600 border-sky-100',
        },
        {
            icon: Mail,
            label: 'Legal & Compliance',
            value: 'legal@puresoul.app',
            note: 'Legal inquiries, compliance questions, subpoenas',
            href: 'mailto:legal@puresoul.app',
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        },
    ];

    const crisis = [
        { label: '988 Suicide & Crisis Lifeline', value: 'Call or text 988', href: 'tel:988' },
        { label: 'Crisis Text Line', value: 'Text HOME to 741741', href: 'sms:741741' },
        { label: 'Emergency Services', value: 'Call 911', href: 'tel:911' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-indigo-300 text-sm">
                        <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Contact Us</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-3">Contact Us</h1>
                    <p className="text-slate-300 leading-relaxed max-w-2xl">
                        We're here to help. Choose the right contact below for the fastest response.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Crisis — always first */}
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <h2 className="font-black text-rose-800 uppercase tracking-widest text-sm">Mental Health Crisis</h2>
                    </div>
                    <p className="text-rose-700 text-sm mb-4">If you or someone else is in immediate danger, please reach out to one of these resources right away:</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {crisis.map(c => (
                            <a key={c.label} href={c.href} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-100 hover:border-rose-300 transition-colors group">
                                <Phone className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{c.label}</p>
                                    <p className="text-[11px] text-rose-600 font-semibold">{c.value}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Contact emails */}
                <h2 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h2>
                <div className="grid gap-4 sm:grid-cols-2 mb-10">
                    {contacts.map(c => {
                        const Icon = c.icon;
                        return (
                            <a key={c.label} href={c.href} className={`flex gap-4 p-5 bg-white rounded-2xl border hover:shadow-md transition-all ${c.color.includes('border') ? '' : 'border-slate-100'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm">{c.label}</p>
                                    <p className="text-indigo-600 text-sm font-semibold truncate">{c.value}</p>
                                    <p className="text-slate-500 text-xs mt-1">{c.note}</p>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Support ticket */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Submit a Support Ticket</h3>
                        <p className="text-slate-500 text-sm">For detailed issues requiring follow-up, submit a support ticket through our help center. We typically respond within 1–2 business days.</p>
                    </div>
                    <Link href="/support">
                        <button className="flex-shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            Open Ticket <ExternalLink className="w-4 h-4" />
                        </button>
                    </Link>
                </div>

                {/* Response times */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'General Support', time: '1–2 business days' },
                        { label: 'Privacy Requests', time: '≤ 30 days (legal)' },
                        { label: 'Accessibility', time: '3 business days' },
                        { label: 'Crisis / Safety', time: 'Immediate (911 / 988)' },
                    ].map(r => (
                        <div key={r.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{r.label}</p>
                            <p className="text-sm font-bold text-slate-800">{r.time}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
