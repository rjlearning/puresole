import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MeshBackground from "@/components/MeshBackground";

const EPDS_QUESTIONS = [
    { q: "I have been able to laugh and see the funny side of things", opts: ["As much as I always could", "Not quite so much now", "Definitely not so much now", "Not at all"] },
    { q: "I have looked forward with enjoyment to things", opts: ["As much as I ever did", "Rather less than I used to", "Definitely less than I used to", "Hardly at all"] },
    { q: "I have blamed myself unnecessarily when things went wrong", opts: ["No, never", "Not very often", "Yes, some of the time", "Yes, most of the time"] },
    { q: "I have been anxious or worried for no good reason", opts: ["No, not at all", "Hardly ever", "Yes, sometimes", "Yes, very often"] },
    { q: "I have felt scared or panicky for no very good reason", opts: ["No, not at all", "No, not much", "Yes, sometimes", "Yes, quite a lot"] },
    { q: "Things have been getting on top of me", opts: ["No, I have been coping as well as ever", "No, most of the time I have coped quite well", "Yes, sometimes I haven't been coping as well as usual", "Yes, most of the time I haven't been able to cope at all"] },
    { q: "I have been so unhappy that I have had difficulty sleeping", opts: ["No, not at all", "Not very often", "Yes, sometimes", "Yes, most of the time"] },
    { q: "I have felt sad or miserable", opts: ["No, not at all", "Not very often", "Yes, quite often", "Yes, most of the time"] },
    { q: "I have been so unhappy that I have been crying", opts: ["No, never", "Only occasionally", "Yes, quite often", "Yes, most of the time"] },
    { q: "The thought of harming myself has occurred to me", opts: ["Never", "Hardly ever", "Sometimes", "Yes, quite often"] },
];

const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it's hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen",
];

const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading or watching television",
    "Moving or speaking so slowly that other people could notice — or the opposite",
    "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const FREQ_OPTS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
type Step = 'intro' | 'epds' | 'gad7' | 'phq9' | 'results';

function Scoreband({ label, score, max, children }: { label: string; score: number; max: number; children: React.ReactNode }) {
    const pct = Math.round((score / max) * 100);
    const color = pct > 65 ? 'bg-red-400' : pct > 35 ? 'bg-amber-400' : 'bg-emerald-400';
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-rose-100 p-5 mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-2 text-rose-900">
                <p className="text-sm font-black uppercase tracking-tight">{label}</p>
                <span className="text-xl font-black tabular-nums">{score}<span className="text-sm opacity-40 ml-0.5">/{max}</span></span>
            </div>
            <div className="h-2.5 bg-rose-100/30 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{children}</p>
        </div>
    );
}

function QCard({ question, options, value, onChange, index, total }: {
    question: string; options: string[]; value: number | null;
    onChange: (i: number) => void; index: number; total: number;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">CORE DISCOVERY {index}/{total}</span>
                <div className="flex gap-1.5">
                    {Array.from({ length: total }).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < index ? 'bg-rose-400 w-4' : 'bg-rose-100 w-1.5'}`} />
                    ))}
                </div>
            </div>
            <p className="text-slate-900 font-black text-xl leading-tight mb-8">{question}</p>
            <div className="space-y-2.5">
                {options.map((opt, i) => (
                    <button key={i} onClick={() => onChange(i)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${value === i
                            ? 'border-rose-400 bg-rose-500 text-white font-black shadow-lg translate-x-1'
                            : 'border-rose-100/50 bg-white/50 text-slate-700 hover:border-rose-200 hover:bg-white font-bold'
                            }`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function WomenCheckinPage() {
    const [, setLocation] = useLocation();
    const [step, setStep] = useState<Step>('intro');
    const [epdsA, setEpdsA] = useState<(number | null)[]>(Array(10).fill(null));
    const [gad7A, setGad7A] = useState<(number | null)[]>(Array(7).fill(null));
    const [phq9A, setPhq9A] = useState<(number | null)[]>(Array(9).fill(null));
    const [currentQ, setCurrentQ] = useState(0);

    const epdsScore = () => epdsA.reduce((s: number, v) => s + (v ?? 0), 0);
    const gad7Score = () => gad7A.reduce((s: number, v) => s + (v ?? 0), 0);
    const phq9Score = () => phq9A.reduce((s: number, v) => s + (v ?? 0), 0);
    const phq9Q9 = phq9A[8] ?? 0;

    const saveMutation = useMutation({
        mutationFn: async (scores: any) => {
            await apiRequest("POST", "/api/women/checkin", {
                mood: scores.epds.toString(),
                symptoms: [],
                energyLevel: scores.phq9.toString(),
                notes: `GAD7 Score: ${scores.gad7}`
            });
        }
    });

    const saveResults = () => {
        const scores = { epds: epdsScore(), gad7: gad7Score(), phq9: phq9Score() };
        localStorage.setItem('women_scores', JSON.stringify(scores));
        localStorage.setItem('women_phq9q9', String(phq9Q9));
        saveMutation.mutate(scores);
    };

    const btnStyle = { background: 'linear-gradient(135deg, #fda4af, #c084fc)' };

    if (step === 'intro') return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden text-slate-900">
            <MeshBackground variant="rose" />
            <div className="max-w-lg mx-auto relative z-10">
                <Link href="/women">
                    <button className="mb-8 flex items-center gap-2 text-sm text-rose-500 font-bold hover:text-rose-600">
                        <ArrowLeft className="w-4 h-4" /> Back to Women's Hub
                    </button>
                </Link>
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-rose-100 shadow-sm mb-8">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl" style={btnStyle}>🌸</div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Mood Discovery</h1>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium px-4">This isn't a test — it's a way to put language around what you're carrying, so the support you get can actually meet you where you are.</p>
                    </div>
                    <div className="space-y-4 mb-2">
                        {[
                            { name: 'EPDS', full: 'Maternal Wellness Scale', n: 10, desc: 'The gold standard for perinatal emotional health screening.' },
                            { name: 'GAD-7', full: 'Nervous System Load', n: 7, desc: 'Identifying the invisible weight of postpartum anxiety.' },
                            { name: 'PHQ-9', full: 'Energy & Outlook', n: 9, desc: 'A holistic view of your current emotional baseline.' },
                        ].map(s => (
                            <div key={s.name} className="bg-white/50 rounded-2xl p-4 border border-rose-100 flex items-start gap-4">
                                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg mt-0.5 shadow-sm">{s.name}</span>
                                <div><p className="text-sm font-black text-slate-800 tracking-tight">{s.full}</p><p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.desc}</p></div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-center text-rose-400 mt-8 mb-5 italic font-medium">Stored privately on your device. Never shared.</p>
                    <button onClick={() => { setStep('epds'); setCurrentQ(0); }} className="w-full py-5 rounded-[2rem] font-black text-white text-base shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl hover:-translate-y-0.5" style={btnStyle}>
                        Begin Recovery Discovery <ChevronRight className="w-5 h-5 inline ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (step === 'epds') {
        const canGo = epdsA[currentQ] != null;
        const last = currentQ === 9;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto relative overflow-hidden text-slate-900">
                <MeshBackground variant="rose" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('intro'), setCurrentQ(0))} className="w-11 h-11 rounded-2xl border border-rose-100 flex items-center justify-center bg-white/50 backdrop-blur-sm"><ArrowLeft className="w-5 h-5 text-rose-500" /></button>
                        <div className="flex-1"><p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">EPDS</p><p className="text-sm font-black text-slate-700">Perinatal Wellness Discovery</p></div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-rose-100 shadow-xl mb-6">
                        <QCard question={EPDS_QUESTIONS[currentQ].q} options={EPDS_QUESTIONS[currentQ].opts}
                            value={epdsA[currentQ]} onChange={v => setEpdsA(a => { const n = [...a]; n[currentQ] = v; return n; })}
                            index={currentQ + 1} total={10} />
                    </div>
                    <button disabled={!canGo} onClick={() => last ? (setStep('gad7'), setCurrentQ(0)) : setCurrentQ(q => q + 1)}
                        className="w-full py-5 rounded-[2rem] font-black text-white disabled:opacity-30 shadow-xl transition-all active:scale-[0.98]" style={btnStyle}>
                        {last ? 'Continue to Next Stage →' : 'Save & Next →'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'gad7') {
        const canGo = gad7A[currentQ] != null;
        const last = currentQ === 6;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto relative overflow-hidden text-slate-900">
                <MeshBackground variant="rose" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('epds'), setCurrentQ(9))} className="w-11 h-11 rounded-2xl border border-rose-100 flex items-center justify-center bg-white/50 backdrop-blur-sm"><ArrowLeft className="w-5 h-5 text-rose-500" /></button>
                        <div className="flex-1"><p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">GAD-7</p><p className="text-sm font-black text-slate-700">Anxiety Load Assessment</p></div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-rose-100 shadow-xl mb-6">
                        <QCard question={GAD7_QUESTIONS[currentQ]} options={FREQ_OPTS}
                            value={gad7A[currentQ]} onChange={v => setGad7A(a => { const n = [...a]; n[currentQ] = v; return n; })}
                            index={currentQ + 1} total={7} />
                    </div>
                    <button disabled={!canGo} onClick={() => last ? (setStep('phq9'), setCurrentQ(0)) : setCurrentQ(q => q + 1)}
                        className="w-full py-5 rounded-[2rem] font-black text-white disabled:opacity-30 shadow-xl transition-all active:scale-[0.98]" style={btnStyle}>
                        {last ? 'Continue to Final Stage →' : 'Save & Next →'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'phq9') {
        const canGo = phq9A[currentQ] != null;
        const last = currentQ === 8;
        const safetyQ = currentQ === 8;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto relative overflow-hidden text-slate-900">
                <MeshBackground variant="rose" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('gad7'), setCurrentQ(6))} className="w-11 h-11 rounded-2xl border border-rose-100 flex items-center justify-center bg-white/50 backdrop-blur-sm"><ArrowLeft className="w-5 h-5 text-rose-500" /></button>
                        <div className="flex-1"><p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">PHQ-9</p><p className="text-sm font-black text-slate-700">Baseline Depression Check</p></div>
                    </div>
                    {safetyQ && (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-500/10 backdrop-blur-md p-5 flex gap-4 border-l-4">
                            <span className="text-2xl flex-shrink-0 animate-pulse">💙</span>
                            <p className="text-xs text-rose-700 font-bold leading-relaxed italic">This question can be heavy. If you're struggling right now, please know support is ready for you — <a href="tel:18339435746" className="underline font-black decoration-rose-500 decoration-2">1-833-943-5746</a></p>
                        </div>
                    )}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-rose-100 shadow-xl mb-6">
                        <QCard question={PHQ9_QUESTIONS[currentQ]} options={FREQ_OPTS}
                            value={phq9A[currentQ]} onChange={v => setPhq9A(a => { const n = [...a]; n[currentQ] = v; return n; })}
                            index={currentQ + 1} total={9} />
                    </div>
                    <button disabled={!canGo} onClick={() => { if (last) { saveResults(); setStep('results'); } else setCurrentQ(q => q + 1); }}
                        className="w-full py-5 rounded-[2rem] font-black text-white disabled:opacity-30 shadow-xl transition-all active:scale-[0.98]" style={btnStyle}>
                        {last ? 'View My Perspective →' : 'Save & Next →'}
                    </button>
                </div>
            </div>
        );
    }

    // Results
    const epds = epdsScore(); const gad7 = gad7Score(); const phq9 = phq9Score();
    return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden text-slate-900">
            <MeshBackground variant="rose" />
            <div className="max-w-lg mx-auto relative z-10">
                <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 border border-rose-100 shadow-2xl text-center mb-10">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Discovery Complete</h2>
                    <p className="text-sm text-slate-500 font-medium px-4">These scores are a snapshot — not a verdict. Tomorrow can look different.</p>
                </div>

                <div className="space-y-2">
                    <Scoreband label="Maternal Wellness Index (EPDS)" score={epds} max={30}>
                        {epds >= 13 ? 'Elevated baseline — your body is signaling a need for significant professional support. Please speak with your care provider today.'
                            : epds >= 10 ? 'Mild elevation — your nervous system is working overtime. It is worth sharing these findings with your OB or midwife.'
                                : 'Within normative range for this stage. Remember that emotional shifts are fluid — track this again in two weeks.'}
                    </Scoreband>

                    <Scoreband label="Anxiety Load Quotient (GAD-7)" score={gad7} max={21}>
                        {gad7 >= 15 ? 'Severe anxiety signal — please prioritize a conversation with a perinatal specialist this week.'
                            : gad7 >= 10 ? 'Moderate load — symptoms of hypervigilance are high. You deserve language and strategies to manage this intensity.'
                                : gad7 >= 5 ? 'Mild elevation — common in early matrescence, but worth naming so it doesn\'t build into burnout.'
                                    : 'Minimal anxiety symptoms detected. Your adaptive mechanisms are functioning strongly.'}
                    </Scoreband>

                    <Scoreband label="Depression Severity Matrix (PHQ-9)" score={phq9} max={27}>
                        {phq9 >= 20 ? 'Severe depression signal — please reach out to your provider or call 1-833-943-5746 immediately. Help is available.'
                            : phq9 >= 10 ? 'Moderate signal — professional support can provide the relief your body is asking for. You are not alone.'
                                : phq9 >= 5 ? 'Mild elevation — valid symptoms of low mood. Monitor these trends and prioritize rest.'
                                    : 'Minimal depressive indicators. Your emotional resilience is high at this time.'}
                    </Scoreband>
                </div>

                {phq9Q9 > 0 && (
                    <div className="rounded-[2rem] border-2 border-red-200 bg-red-50/80 backdrop-blur-sm p-6 mb-8 mt-6 flex gap-4 shadow-lg border-l-8">
                        <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-base font-black text-red-800 mb-1">Safety First Priority</p>
                            <p className="text-sm text-red-700 leading-relaxed font-bold italic">You don't have to carry this alone. 24/7 Support: <strong>PSI — <a href="tel:18339435746" className="underline decoration-2">1-833-943-5746</a></strong> or text HELLO to 741741.</p>
                        </div>
                    </div>
                )}

                <div className="bg-rose-50/50 backdrop-blur-sm rounded-2xl p-5 mb-10 text-[11px] text-rose-500 font-bold leading-relaxed border border-rose-100 text-center uppercase tracking-widest">
                    These results are a tool for conversation, not a clinical diagnosis. Share them with your health team.
                </div>

                <div className="space-y-4">
                    <Link href="/women/companion">
                        <button className="w-full py-5 rounded-[2rem] font-black text-white shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl hover:-translate-y-1" style={btnStyle}>
                            Integrate with Companion Support →
                        </button>
                    </Link>
                    <Link href="/women">
                        <button className="w-full py-4 rounded-[2rem] font-bold text-rose-500 border-2 border-rose-200 hover:bg-white/50 transition-all text-sm outline-none">
                            Return to Wellness Hub
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
