import { useState } from 'react';
import { Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import MeshBackground from "@/components/MeshBackground";

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOPICS = [
    {
        id: 'invisible-labor',
        emoji: '⚖️',
        title: 'Invisible Labor',
        subtitle: 'The mental load that never clocks out',
        color: 'bg-amber-50 border-amber-200',
        headerColor: 'text-amber-700',
        content: `The mental load is the cognitive work of remembering, planning, and coordinating household and family life — doctor appointments, feeding schedules, birthday gifts, developmental milestones, who needs new shoes. It is largely invisible because it happens inside someone's head, not on a to-do list anyone can see.

Research consistently shows that this labor falls disproportionately on mothers — even in households that consider themselves equal. It creates chronic background stress that looks, from the outside, like anxiety or perfectionism.

**Signs you may be carrying the invisible load:**
- You know the expiry date of everything in the fridge
- You feel responsible for reminding your partner of things they "should know"
- You plan in advance even while resting
- You worry that if you don't track it, nobody will

**Starting a conversation:**
Rather than tracking everything and exploding later, try naming it in real-time: *"I'm carrying a lot of mental planning right now and I need you to take complete ownership of one thing — not just do it when I ask, but track it and manage it yourself."* Ownership, not help.`,
    },
    {
        id: 'postpartum-relationship',
        emoji: '💔',
        title: 'Relationship After Baby',
        subtitle: 'When everything shifts between you',
        color: 'bg-rose-50 border-rose-200',
        headerColor: 'text-rose-700',
        content: `The transition to parenthood is one of the most significant stress events a relationship can face. Research by John Gottman found that 67% of couples report a significant decline in relationship satisfaction in the first three years after having a baby.

This isn't a sign the relationship is broken — it's a sign you are both under enormous pressure while simultaneously running on broken sleep, changed roles, changed bodies, and a fundamentally altered identity.

**What tends to go wrong:**
- Scorekeeping — who did more, who slept more, who has it harder
- Emotional disconnection — parallel living rather than relating
- Unvoiced resentment building into contempt over time
- Physical intimacy pressure before readiness

**What tends to help:**
- Turning toward each other in small, daily moments (not just fixing problems)
- Saying what you need directly rather than hinting and hoping
- Recognising that your partner is also adjusting — to a new role, a changed relationship, a different version of you
- Asking *"what does support look like for you today?"* rather than assuming`,
    },
    {
        id: 'identity',
        emoji: '🪞',
        title: 'Matrescence & Identity',
        subtitle: 'Who you are becoming',
        color: 'bg-purple-50 border-purple-200',
        headerColor: 'text-purple-700',
        content: `The term **matrescence** — coined by anthropologist Dana Raphael in 1973 — describes the physical, emotional, and psychological transformation a woman undergoes when she becomes a mother. It is as significant a developmental shift as adolescence.

And yet, unlike adolescence, it is rarely named, normalised, or given space to be processed.

You may find yourself:
- Grieving a self you're not sure how to be anymore
- Loving your child intensely while also missing your previous life
- Feeling both more powerful and more vulnerable than you've ever felt
- Not recognising yourself in old photos, old relationships, or old desires

These experiences are not symptoms of depression or ingratitude. They are the texture of transformation.

**What helps:**
- Naming what you're losing, not just what you're gaining
- Finding even one other person in this season of life to talk with honestly
- Letting yourself be in progress rather than demanding that you arrive somewhere
- Reading: *"The Fourth Trimester"* by Kimberly Ann Johnson, *"Like a Mother"* by Angela Garbes`,
    },
    {
        id: 'sex-intimacy',
        emoji: '💬',
        title: 'Intimacy After Baby',
        subtitle: 'Honest conversations about physical connection',
        color: 'bg-pink-50 border-pink-200',
        headerColor: 'text-pink-700',
        content: `Physical intimacy after birth — whether that's 6 weeks or 6 months — is rarely as straightforward as the "6-week clearance" framing suggests.

Your body has been through a major physiological event. Hormonal changes, especially in breastfeeding women (reduced estrogen → vaginal dryness, reduced libido) are biological, not relational. Pain during sex after birth is common and not something you are obligated to push through — please speak with your OB or midwife.

**Things worth knowing:**
- Low libido postpartum is hormonally driven, not a measure of how you feel about your partner
- If you're breastfeeding, vaginal dryness is typical — a good lubricant is not a luxury
- The "6-week rule" is a minimum healing checkpoint, not a start date
- Resuming intimacy under pressure rarely builds connection — it can actually create aversion

**Having the conversation:**
*"I love you and I want to feel close. I'm not there physically yet, and it's not about you. Can we talk about what connection looks like right now while I keep healing?"*

Non-sexual physical closeness — holding, massage, presence — matters more than most couples realise in this window.`,
    },
    {
        id: 'support-network',
        emoji: '🏠',
        title: 'Building Support',
        subtitle: 'It takes a village — let them help',
        color: 'bg-emerald-50 border-emerald-200',
        headerColor: 'text-emerald-700',
        content: `Women are often socialized to be self-sufficient and not ask for help. In the context of early motherhood, this can become dangerous.

The "village" that historically supported new mothers — extended family nearby, neighbors with genuine relationships, communal caregiving — has been largely dismantled by modern life. We often enter parenthood more isolated than any generation of mothers before us.

**The ask is hard but necessary:**
Most people genuinely want to help and don't know how. Being specific makes it easier for everyone. Not "let me know if you need anything" but "can you bring dinner on Thursday?" Not "I'm happy to help" but "I'm coming at 2pm to hold the baby while you sleep."

**Types of support worth organizing:**
- Practical — meals, cleaning, grocery runs, school pickups
- Emotional — one person you can be honest with without performing okay-ness
- Medical — someone who will take physical symptoms seriously and advocate for you
- Respite — someone who takes the baby so you can be off-duty, even for 90 minutes

**Script for asking:**
*"I've realized I need to ask for more support rather than wait until I'm drowning. Could you commit to [specific thing] once a week for the next month?"*`,
    },
];

const REFLECTIONS = [
    { prompt: 'What is one thing I am carrying right now that my partner doesn\'t fully see?', emoji: '👁️' },
    { prompt: 'What did I need this week that I didn\'t ask for? Why didn\'t I ask?', emoji: '🤲' },
    { prompt: 'Who in my life can I call at 2am if I need to? Who can my partner?', emoji: '📞' },
    { prompt: 'What is one way I\'ve changed since becoming a mother that I haven\'t fully named yet?', emoji: '🌱' },
    { prompt: 'What would "good enough support" look like this week — not perfect, just good enough?', emoji: '✅' },
];

export default function WomenRelationshipsPage() {
    const [openTopic, setOpenTopic] = useState<string | null>(null);
    const [reflIdx, setReflIdx] = useState(0);
    const [tab, setTab] = useState<'resources' | 'reflect'>('resources');

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden text-slate-900">
            <MeshBackground variant="rose" />
            <div className="px-5 pt-10 pb-4 max-w-2xl mx-auto relative z-10">
                <Link href="/women">
                    <span className="flex items-center gap-1.5 text-sm text-amber-500 font-bold hover:text-amber-600 mb-5 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" /> Women's Hub
                    </span>
                </Link>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>👩‍👧</div>
                    <div>
                        <h1 className="text-xl font-black text-amber-900">Partner & Family</h1>
                        <p className="text-xs text-amber-400">Invisible labor · communication · identity</p>
                    </div>
                </div>
                <div className="flex bg-white/40 backdrop-blur-xl rounded-[1.5rem] p-1 border border-amber-100/50 shadow-sm gap-1">
                    {([['resources', 'Identity & Labor'], ['reflect', 'Biometric Reflection']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => setTab(id as any)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === id ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-amber-50'}`}>{label}</button>
                    ))}
                </div>
            </div>

            <div className="px-5 max-w-2xl mx-auto space-y-3 relative z-10">
                {tab === 'resources' && (
                    <>
                        <p className="text-xs text-slate-500 leading-relaxed pb-1">
                            Resources and reflection prompts around the relational shifts that come with parenthood — grounded in the research, not in platitudes.
                        </p>
                        {TOPICS.map(topic => (
                            <div key={topic.id} className={`rounded-2xl border overflow-hidden transition-all ${topic.color}`}>
                                <button
                                    onClick={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
                                    className="w-full p-4 flex items-center gap-3 text-left">
                                    <span className="text-2xl flex-shrink-0">{topic.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm ${topic.headerColor}`}>{topic.title}</p>
                                        <p className="text-xs text-slate-500">{topic.subtitle}</p>
                                    </div>
                                    {openTopic === topic.id
                                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                </button>
                                {openTopic === topic.id && (
                                    <div className="px-5 pb-5 border-t border-white/60">
                                        <div className="pt-4 text-sm text-slate-700 leading-relaxed space-y-3">
                                            {topic.content.split('\n\n').map((para, i) => {
                                                if (para.startsWith('- ') || para.startsWith('• ')) {
                                                    const items = para.split('\n').filter(l => l.trim());
                                                    return (
                                                        <ul key={i} className="space-y-1">
                                                            {items.map((item, j) => <li key={j} className="flex gap-2"><span className="text-slate-400 flex-shrink-0 mt-0.5">•</span><span>{item.replace(/^[-•]\s*/, '')}</span></li>)}
                                                        </ul>
                                                    );
                                                }
                                                // Bold text rendering
                                                const parts = para.split(/(\*\*[^*]+\*\*)/g);
                                                return (
                                                    <p key={i}>
                                                        {parts.map((p, j) =>
                                                            p.startsWith('**') && p.endsWith('**')
                                                                ? <strong key={j}>{p.slice(2, -2)}</strong>
                                                                : p
                                                        )}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}

                {tab === 'reflect' && (
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            These prompts are designed to help you name what's happening beneath the surface — for yourself, or as a starting point for a conversation.
                        </p>

                        {/* Featured card */}
                        <div className="bg-white rounded-3xl border border-amber-100 shadow-lg p-6 text-center">
                            <span className="text-4xl block mb-4">{REFLECTIONS[reflIdx].emoji}</span>
                            <p className="text-lg font-semibold text-slate-800 leading-snug mb-6">
                                "{REFLECTIONS[reflIdx].prompt}"
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => setReflIdx(i => (i - 1 + REFLECTIONS.length) % REFLECTIONS.length)}
                                    className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition-all">
                                    <ChevronLeft className="w-5 h-5 text-amber-500" />
                                </button>
                                <p className="text-xs text-slate-400">{reflIdx + 1} / {REFLECTIONS.length}</p>
                                <button onClick={() => setReflIdx(i => (i + 1) % REFLECTIONS.length)}
                                    className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition-all">
                                    <ChevronRight className="w-5 h-5 text-amber-500" />
                                </button>
                            </div>
                        </div>

                        {/* All prompts list */}
                        <div className="space-y-2">
                            {REFLECTIONS.map((r, i) => (
                                <button key={i} onClick={() => setReflIdx(i)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-start ${i === reflIdx ? 'bg-amber-500 border-transparent text-white' : 'bg-white border-amber-100 text-slate-700 hover:border-amber-200'}`}>
                                    <span className="text-xl flex-shrink-0">{r.emoji}</span>
                                    <p className="text-sm leading-snug">{r.prompt}</p>
                                </button>
                            ))}
                        </div>

                        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                            <p className="text-xs text-amber-700 leading-relaxed">
                                💬 <strong>Tip:</strong> These prompts work well as conversation starters. Read one aloud to your partner and take turns answering without interruption or fixing — just listening.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
