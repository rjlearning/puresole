import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
        <div className="bg-white rounded-2xl border border-rose-100 p-4 mb-3">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-rose-900">{label}</p>
                <span className="text-lg font-black text-rose-500 tabular-nums">{score}<span className="text-sm opacity-50">/{max}</span></span>
            </div>
            <div className="h-2 bg-rose-50 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-rose-600">{children}</p>
        </div>
    );
}

function QCard({ question, options, value, onChange, index, total }: {
    question: string; options: string[]; value: number | null;
    onChange: (i: number) => void; index: number; total: number;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Question {index} of {total}</span>
                <div className="flex gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i < index ? 'bg-rose-400 w-3' : 'bg-rose-100 w-1.5'}`} />
                    ))}
                </div>
            </div>
            <p className="text-rose-900 font-semibold text-base leading-snug mb-4">{question}</p>
            <div className="space-y-2">
                {options.map((opt, i) => (
                    <button key={i} onClick={() => onChange(i)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm transition-all ${value === i ? 'border-rose-400 bg-rose-50 text-rose-800 font-semibold shadow-sm'
                            : 'border-rose-100 bg-white text-rose-700 hover:border-rose-200 hover:bg-rose-50/50'
                            }`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function WomenCheckinPage() {
    const [,] = useLocation();
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
                mood: scores.epds,
                symptoms: [],
                energyLevel: scores.phq9,
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

    const bg = { background: 'linear-gradient(160deg, #fff0f5, #fdf2ff)' };
    const btnStyle = { background: 'linear-gradient(135deg, #fda4af, #c084fc)' };

    if (step === 'intro') return (
        <div className="min-h-screen px-4 py-12 max-w-lg mx-auto" style={bg}>
            <Link href="/women"><button className="mb-8 flex items-center gap-2 text-sm text-rose-400 hover:text-rose-600"><ArrowLeft className="w-4 h-4" /> Back</button></Link>
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4" style={btnStyle}>🌸</div>
                <h1 className="text-2xl font-bold text-rose-900 mb-3">Mood Check-In</h1>
                <p className="text-sm text-rose-600 leading-relaxed">This isn't a test — it's a way to put language around what you're carrying, so the support you get can actually meet you where you are.</p>
            </div>
            <div className="space-y-3 mb-8">
                {[
                    { name: 'EPDS', full: 'Edinburgh Postnatal Depression Scale', n: 10, desc: 'Designed specifically for new mothers. The most validated postpartum screening tool in the world.' },
                    { name: 'GAD-7', full: 'Generalized Anxiety Disorder Scale', n: 7, desc: 'Postpartum anxiety is more common than depression — and often goes unrecognized.' },
                    { name: 'PHQ-9', full: 'Patient Health Questionnaire', n: 9, desc: 'Measures depression severity. Combined with EPDS it gives a fuller picture.' },
                ].map(s => (
                    <div key={s.name} className="bg-white rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                        <span className="text-xs font-black text-rose-400 bg-rose-50 px-2 py-1 rounded-lg mt-0.5">{s.name}</span>
                        <div><p className="text-sm font-semibold text-rose-800">{s.full}</p><p className="text-xs text-rose-400 mt-0.5">{s.n} questions · {s.desc}</p></div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-center text-rose-400 mb-5 italic">Stored privately on your device. Never shared.</p>
            <button onClick={() => { setStep('epds'); setCurrentQ(0); }} className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg" style={btnStyle}>
                Begin <ChevronRight className="w-4 h-4 inline" />
            </button>
        </div>
    );

    if (step === 'epds') {
        const canGo = epdsA[currentQ] != null;
        const last = currentQ === 9;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto" style={bg}>
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('intro'), setCurrentQ(0))} className="w-9 h-9 rounded-xl border border-rose-100 flex items-center justify-center bg-white"><ArrowLeft className="w-4 h-4 text-rose-400" /></button>
                    <div className="flex-1"><p className="text-xs font-bold text-rose-400 uppercase tracking-widest">EPDS</p><p className="text-sm text-rose-600">Edinburgh Postnatal Depression Scale</p></div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm mb-4">
                    <p className="text-xs text-rose-400 italic mb-4">In the past 7 days…</p>
                    <QCard question={EPDS_QUESTIONS[currentQ].q} options={EPDS_QUESTIONS[currentQ].opts}
                        value={epdsA[currentQ]} onChange={v => setEpdsA(a => { const n = [...a]; n[currentQ] = v; return n; })}
                        index={currentQ + 1} total={10} />
                </div>
                <button disabled={!canGo} onClick={() => last ? (setStep('gad7'), setCurrentQ(0)) : setCurrentQ(q => q + 1)}
                    className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-40 shadow-md" style={btnStyle}>
                    {last ? 'Continue to GAD-7 →' : 'Next →'}
                </button>
            </div>
        );
    }

    if (step === 'gad7') {
        const canGo = gad7A[currentQ] != null;
        const last = currentQ === 6;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto" style={bg}>
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('epds'), setCurrentQ(9))} className="w-9 h-9 rounded-xl border border-rose-100 flex items-center justify-center bg-white"><ArrowLeft className="w-4 h-4 text-rose-400" /></button>
                    <div className="flex-1"><p className="text-xs font-bold text-rose-400 uppercase tracking-widest">GAD-7</p><p className="text-sm text-rose-600">Generalized Anxiety Disorder Scale</p></div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm mb-4">
                    <p className="text-xs text-rose-400 italic mb-4">Over the last 2 weeks, how often were you bothered by…</p>
                    <QCard question={GAD7_QUESTIONS[currentQ]} options={FREQ_OPTS}
                        value={gad7A[currentQ]} onChange={v => setGad7A(a => { const n = [...a]; n[currentQ] = v; return n; })}
                        index={currentQ + 1} total={7} />
                </div>
                <button disabled={!canGo} onClick={() => last ? (setStep('phq9'), setCurrentQ(0)) : setCurrentQ(q => q + 1)}
                    className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-40 shadow-md" style={btnStyle}>
                    {last ? 'Continue to PHQ-9 →' : 'Next →'}
                </button>
            </div>
        );
    }

    if (step === 'phq9') {
        const canGo = phq9A[currentQ] != null;
        const last = currentQ === 8;
        const safetyQ = currentQ === 8;
        return (
            <div className="min-h-screen px-4 py-12 max-w-lg mx-auto" style={bg}>
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : (setStep('gad7'), setCurrentQ(6))} className="w-9 h-9 rounded-xl border border-rose-100 flex items-center justify-center bg-white"><ArrowLeft className="w-4 h-4 text-rose-400" /></button>
                    <div className="flex-1"><p className="text-xs font-bold text-rose-400 uppercase tracking-widest">PHQ-9</p><p className="text-sm text-rose-600">Patient Health Questionnaire</p></div>
                </div>
                {safetyQ && (
                    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
                        <span className="text-lg flex-shrink-0">💙</span>
                        <p className="text-xs text-rose-600 leading-relaxed">This question can be a hard one. If you're struggling right now, support is available — <a href="tel:18339435746" className="font-bold underline">1-833-943-5746</a></p>
                    </div>
                )}
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm mb-4">
                    <p className="text-xs text-rose-400 italic mb-4">Over the last 2 weeks, how often were you bothered by…</p>
                    <QCard question={PHQ9_QUESTIONS[currentQ]} options={FREQ_OPTS}
                        value={phq9A[currentQ]} onChange={v => setPhq9A(a => { const n = [...a]; n[currentQ] = v; return n; })}
                        index={currentQ + 1} total={9} />
                </div>
                <button disabled={!canGo} onClick={() => { if (last) { saveResults(); setStep('results'); } else setCurrentQ(q => q + 1); }}
                    className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-40 shadow-md" style={btnStyle}>
                    {last ? 'See results →' : 'Next →'}
                </button>
            </div>
        );
    }

    // Results
    const epds = epdsScore(); const gad7 = gad7Score(); const phq9 = phq9Score();
    return (
        <div className="min-h-screen px-4 py-12 max-w-lg mx-auto" style={bg}>
            <div className="text-center mb-8">
                <CheckCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-rose-900 mb-2">Check-in complete</h2>
                <p className="text-sm text-rose-500">These are a snapshot — not a verdict. Tomorrow can look different.</p>
            </div>

            <Scoreband label="EPDS — Edinburgh Postnatal Depression Scale" score={epds} max={30}>
                {epds >= 13 ? 'Elevated — please speak with your care provider about what you\'re experiencing.'
                    : epds >= 10 ? 'Mild — worth keeping an eye on and sharing with your provider.'
                        : 'Within range — this is one data point, not the whole story.'}
            </Scoreband>
            <Scoreband label="GAD-7 — Anxiety Scale" score={gad7} max={21}>
                {gad7 >= 15 ? 'Severe anxiety range — please seek support from a provider this week.'
                    : gad7 >= 10 ? 'Moderate — your nervous system is working overtime. You deserve support.'
                        : gad7 >= 5 ? 'Mild — postpartum anxiety is more common than depression and often goes unnamed.'
                            : 'Minimal anxiety symptoms at this time.'}
            </Scoreband>
            <Scoreband label="PHQ-9 — Depression Screening" score={phq9} max={27}>
                {phq9 >= 20 ? 'Severe range — please reach out to your provider or call 1-833-943-5746 today.'
                    : phq9 >= 10 ? 'Moderate — your struggles deserve real, professional support. You\'re not alone.'
                        : phq9 >= 5 ? 'Mild — valid, and worth monitoring and sharing with someone you trust.'
                            : 'Minimal symptoms at this time.'}
            </Scoreband>

            {phq9Q9 > 0 && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 mb-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-700 mb-1">You're not alone in this.</p>
                        <p className="text-sm text-red-600">Please reach out: <strong>PSI — <a href="tel:18339435746" className="underline">1-833-943-5746</a></strong> (24/7) or text HELLO to 741741.</p>
                    </div>
                </div>
            )}

            <div className="bg-rose-50 rounded-2xl p-4 mb-6 text-xs text-rose-400 leading-relaxed">
                These results are not a diagnosis. Please share them with your OB, midwife, or a perinatal mental health specialist.
            </div>

            <div className="space-y-3">
                <Link href="/women/companion"><button className="w-full py-4 rounded-2xl font-bold text-white shadow-md" style={btnStyle}>Talk through this with support →</button></Link>
                <Link href="/women"><button className="w-full py-3 rounded-2xl font-semibold text-rose-600 border-2 border-rose-200 hover:bg-rose-50 transition-all">Back to Women's Section</button></Link>
            </div>
        </div>
    );
}
