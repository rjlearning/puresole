import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, SlidersHorizontal, Send, AlertTriangle } from 'lucide-react';

type Stage = 'trimester4' | 'early' | 'middle' | 'late' | 'weaning' | 'general';

const STAGE_INTROS: Record<Stage, string> = {
    trimester4: "You're in the fourth trimester — your body is still in active physiological recovery, even as the world expects you to be 'fine.' What's coming up for you right now?",
    early: "You're somewhere in those early months — hormonally turbulent, sleep-deprived, and being asked to function as if nothing has fundamentally changed. It has. What's on your mind?",
    middle: "This stretch of the first year is often the hardest to name. It looks settled from the outside, but the identity shift is still fully in motion. What are you carrying today?",
    late: "Past the point where the world expects you to be 'back to normal.' Your nervous system knows it wasn't that simple. What's present for you right now?",
    weaning: "Weaning brings its own hormonal withdrawal that rarely gets talked about — it can feel like grief, irritability, or a strange flatness. You're not imagining it. What's coming up?",
    general: "This is a space to talk through whatever you're carrying — no script, no agenda. What's feeling most present for you right now?",
};

interface Message { role: 'user' | 'assistant'; content: string; isHighRisk?: boolean; }

function TypingIndicator() {
    return (
        <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f9a8d4, #c084fc)' }} />
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white border border-rose-100 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-rose-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Bubble({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} items-end`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                    style={{ background: 'linear-gradient(135deg, #f9a8d4, #c084fc)' }}>♡</div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${isUser ? 'rounded-br-sm bg-rose-500 text-white' : 'rounded-bl-sm bg-white border border-rose-100 text-rose-900'
                }`}>
                {msg.content.split('\n\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''} dangerouslySetInnerHTML={{
                        __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }} />
                ))}
                {msg.isHighRisk && (
                    <div className="mt-3 pt-3 border-t border-rose-200 flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-600 font-medium">Support is available 24/7 — PSI: 1-833-943-5746</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WomenCompanionPage() {
    const [stage, setStage] = useState<Stage>('general');
    const [biometrics, setBio] = useState({});
    const [scores, setScores] = useState({});
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const s = localStorage.getItem('women_stage') as Stage;
        const b = localStorage.getItem('women_biometrics');
        const savedScores = localStorage.getItem('women_scores');
        if (s) setStage(s);
        if (b) { try { setBio(JSON.parse(b)); } catch { } }
        if (savedScores) { try { setScores(JSON.parse(savedScores)); } catch { } }
    }, []);

    // Set initial greeting after stage loads
    useEffect(() => {
        setMessages([{ role: 'assistant', content: STAGE_INTROS[stage] }]);
    }, [stage]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await fetch('/api/women/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: text, stage, biometrics, scores, history: messages.slice(-10) }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply, isHighRisk: data.isHighRisk }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. What you're feeling is valid — please try again in a moment."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(160deg, #fff0f5, #fdf2ff)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-rose-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
                <Link href="/women">
                    <button className="w-9 h-9 rounded-xl border border-rose-100 flex items-center justify-center hover:bg-rose-50">
                        <ArrowLeft className="w-4 h-4 text-rose-400" />
                    </button>
                </Link>
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f9a8d4, #c084fc)' }}>♡</div>
                    <div>
                        <p className="text-sm font-bold text-rose-900">Emotional Support</p>
                        <p className="text-xs text-rose-400">Women's wellness companion</p>
                    </div>
                </div>
                <Link href="/women">
                    <button className="w-9 h-9 rounded-xl border border-rose-100 flex items-center justify-center hover:bg-rose-50">
                        <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                    </button>
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div id="chat-bottom" />
            </div>

            {/* Crisis ribbon */}
            <div className="mx-4 mb-2 py-2 px-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <p className="text-xs text-rose-400">Need immediate support?</p>
                <a href="tel:18339435746" className="text-xs font-bold text-rose-600">PSI: 1-833-943-5746</a>
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
                <div className="flex gap-2 items-end bg-white rounded-2xl border-2 border-rose-100 focus-within:border-rose-300 shadow-sm px-4 py-3 transition-all">
                    <textarea
                        value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Share what's on your mind…" rows={1}
                        className="flex-1 resize-none outline-none text-sm text-rose-900 placeholder:text-rose-300 bg-transparent"
                        style={{ maxHeight: 100 }}
                    />
                    <button onClick={send} disabled={!input.trim() || loading}
                        className="w-9 h-9 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-200 text-white flex items-center justify-center transition-all flex-shrink-0">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-xs text-rose-300 mt-2">Support tool only — not a therapist or medical service.</p>
            </div>
        </div>
    );
}
