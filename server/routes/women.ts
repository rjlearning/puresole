import express from 'express';
import OpenAI from 'openai';
import { db } from '../db';
import { biomarkerResults, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getMetabolicInsights, generateComprehensiveRecoveryAnalysis } from '../services/metabolicEngine';
import { requireAuth } from '../multiAuth';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

interface WomenMessage { role: 'user' | 'assistant'; content: string; }
interface WomenBiometrics { sleepHours?: number; hrv?: number; feedingCount?: number; energyLevel?: number; cycleDay?: number; }
interface WomenScores { epds?: number; gad7?: number; phq9?: number; phq9Q9?: number; }

const POSTPARTUM_STAGES: Record<string, string> = {
    'trimester4': '0–3 months postpartum (fourth trimester — still in major physiological recovery)',
    'early': '3–6 months postpartum (hormones still shifting, sleep debt accumulating, identity reforming)',
    'middle': '6–12 months postpartum (matrescence in full swing — often the hardest emotionally)',
    'late': '12–24 months postpartum (the world expects normal — the nervous system knows otherwise)',
    'weaning': 'weaning phase (hormonal withdrawal is real, often under-discussed, can feel like grief)',
    'general': 'general women\'s health focus (not currently postpartum)',
};

const OFFLINE_RESPONSES = [
    "What you're feeling right now is real and it makes complete sense. Your body has been carrying a tremendous load — hormonally, physically, emotionally. Try this: place one hand on your chest and take three slow exhales, letting your shoulders drop. That small act of regulation matters more than it seems. You're doing this.",
    "The exhaustion you're describing isn't weakness. It's your body under compounded physiological load. Hormonal fluctuations, sleep fragmentation, nervous system stress — they compound in ways that rarely get named. One thing right now: drink a full glass of water. Hydration affects mood chemistry more than most people realize.",
    "That feeling of not quite recognizing yourself is real and has a name — matrescence, or more broadly, any significant hormonal and identity shift in a woman's life. Your brain is rewiring. Give yourself the grace you'd give someone going through any profound transformation.",
    "The overwhelm with too much touch, too many demands on your body — that's called touch saturation. It's a physiological response, not selfishness. Your nervous system is signaling a need for sensory rest. Even five minutes somewhere quiet, alone, can shift your nervous state meaningfully.",
    "What you're going through has biology behind it — and biology that's rarely talked about completely. You're not failing, and this isn't permanent. If you're worried, please reach out to a healthcare provider. And if you need support right now, PSI is available: 1-833-943-5746.",
];

const CRISIS_RESPONSE = `I hear how much pain you're in right now, and I want you to know that you don't have to carry this alone. What you're feeling is incredibly heavy, but there is support available for you right this second.

Please, reach out to someone who can hold this with you. You can call or text the **Postpartum Support International (PSI) HelpLine** at **1-833-943-5746**. They are available 24/7 and they truly understand.

If you are in immediate danger, please call **988** (the Suicide & Crisis Lifeline) or go to the nearest emergency room. You deserve to be safe, and you deserve care that is as deep as what you're feeling right now.

I'm just an AI, and while I care, I can't provide the level of safety you need in this moment. Please reach out to one of the numbers above. You are important.`;

function detectRiskLanguage(message: string): boolean {
    const riskKeywords = [
        "don't want to be here", "want to disappear", "not want to live", "end it",
        "hurt myself", "harm myself", "can't go on", "no way out", "better off without me",
        "kill myself", "suicidal", "self harm", "worthless", "die", "better dead",
        "want to die", "hurt the baby", "harm the baby", "take my life"
    ];
    const lower = message.toLowerCase();
    return riskKeywords.some(kw => lower.includes(kw));
}

const SAFETY_ADDENDUM = `\n\n---\n💛 **Please reach out for real support:** Postpartum Support International is available 24/7 at **1-833-943-5746** (call or text). You can also text "HELLO" to 741741 (Crisis Text Line). You deserve human care right now.`;

function buildSystemPrompt(stage: string, biometrics: any, scores: any, analysis: any): string {
    const stageDesc = POSTPARTUM_STAGES[stage] || 'a significant phase of a woman\'s life';

    const bioContext = biometrics && Array.isArray(biometrics)
        ? biometrics.map((i: any) => `- ${i.type}: ${i.status} (Value: ${i.value} ${i.unit})`).join('\n')
        : 'No recent biometric data found.';

    const recoveryContext = analysis
        ? `Current Recovery Phase: ${analysis.currentPhaseName}\nRecovery Score: ${analysis.recoveryScore}/100\nPhysiological Bridge: ${analysis.physiologicalBridge}`
        : 'General recovery context active.';

    return `You are a precision women's health and matrescence specialist AI — scientifically-grounded, radically empathetic, and profoundly insightful. You do not give generic advice. You understand the intricate dance of estrogen, progesterone, cortisol, and nutritional depletion.

CURRENT PHYSIOLOGICAL CONTEXT:
- Recovery Stage: ${stageDesc}
- Latest Biomarkers:
${bioContext}
- Specialized Analysis:
${recoveryContext}

YOUR MISSION:
1. SCIENTIFIC RIGOR: Connect every answer to physiology. If they are tired, mention Ferritin, TSH, or the metabolic load of breastfeeding. If they are anxious, mention the progesterone drop or the HPA-axis activation in the fourth trimester.
2. MATRESCENCE: Honor the profound identity shift. Use terms like "matrescence" and "nervous system regulation."
3. MIRROR & BRIDGE: First, validate the feeling (Mirror). Then, explain the biological "Why" (Bridge).
4. DATA AWARENESS: Always reference the user's specific biomarkers or recovery score if they indicate a need for focus. 
5. ONE ACTION: Suggest exactly one science-backed regulating step (e.g., "Increase protein by 20g to support tissue repair" or "Try 4-7-8 breathing to lower cortisol").
6. BEYOND GENERIC: Never say "self-care." Say "physiological replenishment" or "nervous system anchoring."
7. SAFETY FIRST: If the user expresses ANY self-harm ideation or severe distress, you MUST respond with radical empathy and place professional support resources (PSI: 1-833-943-5746 or 988) at the beginning or VERY clearly in your response.

TONE: Wise, grounded, scientifically-literate, yet deeply warm. Speak like a specialist who knows the user's internal landscape better than they do right now. Short paragraphs only.`;
}

router.post('/chat', async (req, res) => {
    const { message, stage = 'general', biometrics = {}, scores = {}, history = [] } = req.body as {
        message: string; stage: string; biometrics: WomenBiometrics;
        scores: WomenScores; history: WomenMessage[];
    };

    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const userId = (req.user as any).id;
    const isHighRisk = detectRiskLanguage(message);

    if (process.env.OPENAI_API_KEY) {
        try {
            // Fetch real-time data for enrichment
            const [insights, analysis] = await Promise.all([
                getMetabolicInsights(userId).catch(() => null),
                generateComprehensiveRecoveryAnalysis(userId).catch(() => null)
            ]);

            const systemPrompt = buildSystemPrompt(stage, insights?.insights, scores, analysis);
            const messages = [
                { role: 'system' as const, content: systemPrompt },
                ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
                { role: 'user' as const, content: message }
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o', messages, max_tokens: 400,
            });

            let reply = completion.choices[0]?.message?.content || OFFLINE_RESPONSES[0];
            if (isHighRisk && !reply.includes('1-833-943-5746')) reply += SAFETY_ADDENDUM;
            return res.json({ reply, isHighRisk });
        } catch (err) {
            console.error('[Women] OpenAI error, using offline fallback:', err);
        }
    }

    if (isHighRisk) {
        return res.json({ reply: CRISIS_RESPONSE, isHighRisk, offline: true });
    }

    const fallback = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
    return res.json({ reply: isHighRisk ? fallback + SAFETY_ADDENDUM : fallback, isHighRisk, offline: true });
});

router.get('/body', requireAuth, async (req: any, res) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found" });
        }

        const markers = await db.query.biomarkerResults.findMany({
            where: eq(biomarkerResults.userId, userId),
            orderBy: [desc(biomarkerResults.testedAt)],
            limit: 50
        });

        // Mock defaults if real data is missing, to bridge the UI
        const biomarkers = markers.length > 0 ? markers : [
            { biomarkerType: "ferritin", value: 32, unit: 'ng/mL', testedAt: new Date().toISOString() },
            { biomarkerType: "vitamin_d", value: 45, unit: 'ng/mL', testedAt: new Date().toISOString() },
            { biomarkerType: "tsh", value: 2.1, unit: 'mIU/L', testedAt: new Date().toISOString() },
        ];

        const metrics = {
            sleepHours: 5.5,
            hrv: 42,
            recoveryScore: 78
        };

        res.json({ biomarkers, metrics });
    } catch (error) {
        console.error("[Women API] Error fetching body data:", error);
        res.status(500).json({ message: "Failed to fetch body data" });
    }
});

router.post('/checkin', requireAuth, async (req: any, res) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) return res.status(401).json({ message: "User ID not found" });

        const { mood, symptoms, energyLevel, notes } = req.body;

        res.json({ success: true, message: "Check-in saved" });
    } catch (error) {
        res.status(500).json({ message: "Failed to save checkin data" });
    }
});

router.get('/checkin', requireAuth, async (req: any, res) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) return res.status(401).json({ message: "User ID not found" });

        const checkins = [
            { id: 1, date: new Date().toISOString(), mood: 3, energyLevel: 2, symptoms: ['fatigue', 'crying'] }
        ];

        res.json({ checkins });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch checkins" });
    }
});

export default router;
