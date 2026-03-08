/**
 * Multi-Signal Mental Health Fusion Engine
 *
 * Takes raw daily signals from 5+ sources and computes:
 *  - A 0-100 composite wellness score
 *  - A severity label (minimal/mild/moderate/severe)
 *  - A personalized AI-generated insight sentence (via GPT-4o-mini)
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Signal input types ─────────────────────────────────────────────────────────

export interface DailySignalInput {
    /** 0–100 from the orb drag (energy level) */
    energyLevel?: number;
    /** 0–100 from emoji mood tap */
    moodScore?: number;
    /** 0–100 from sleep slider */
    sleepQuality?: number;
    /** 0–100 from voice analysis wellnessScore */
    voiceWellnessScore?: number;
    /** 0–1 (ratio of protocol cards completed today) */
    activityCompletionRate?: number;
    /** -1 to 1 from journalNLP.sentimentScore */
    journalSentimentScore?: number;
}

export interface FusionResult {
    compositeScore: number;           // 0-100
    severityLabel: SeverityLabel;
    aiInsightText: string;
    signalWeights: SignalWeights;     // for transparency/debug
    confidence: number;               // 0-1 (how many signals contributed)
}

export type SeverityLabel = 'minimal' | 'mild' | 'moderate' | 'severe';

interface SignalWeights {
    energyLevel: number;
    moodScore: number;
    voiceWellnessScore: number;
    sleepQuality: number;
    activityRate: number;
    journalSentiment: number;
}

// ── Weights (must sum to 1.0) ──────────────────────────────────────────────────

const WEIGHTS: SignalWeights = {
    moodScore: 0.25,
    voiceWellnessScore: 0.22,
    energyLevel: 0.18,
    sleepQuality: 0.15,
    activityRate: 0.12,
    journalSentiment: 0.08,
};

const NEUTRAL = {
    energyLevel: 50,
    moodScore: 55,
    sleepQuality: 60,
    voiceWellnessScore: 55,
    activityCompletionRate: 0.5,
    journalSentimentScore: 0,
};

function scoreToSeverity(score: number): SeverityLabel {
    if (score >= 72) return 'minimal';
    if (score >= 55) return 'mild';
    if (score >= 38) return 'moderate';
    return 'severe';
}

// ── Core fusion function ───────────────────────────────────────────────────────

export function fuseSignals(signals: DailySignalInput): { compositeScore: number; severityLabel: SeverityLabel; confidence: number } {
    const e = signals.energyLevel ?? NEUTRAL.energyLevel;
    const m = signals.moodScore ?? NEUTRAL.moodScore;
    const s = signals.sleepQuality ?? NEUTRAL.sleepQuality;
    const v = signals.voiceWellnessScore ?? NEUTRAL.voiceWellnessScore;
    const a = (signals.activityCompletionRate ?? NEUTRAL.activityCompletionRate) * 100;
    // Convert -1..1 sentiment to 0..100
    const j = ((signals.journalSentimentScore ?? NEUTRAL.journalSentimentScore) + 1) / 2 * 100;

    const compositeScore = Math.round(
        e * WEIGHTS.energyLevel +
        m * WEIGHTS.moodScore +
        s * WEIGHTS.sleepQuality +
        v * WEIGHTS.voiceWellnessScore +
        a * WEIGHTS.activityRate +
        j * WEIGHTS.journalSentiment
    );

    // Confidence: how many of the 6 signals were provided (not defaulted)?
    const provided = [
        signals.energyLevel, signals.moodScore, signals.sleepQuality,
        signals.voiceWellnessScore, signals.activityCompletionRate, signals.journalSentimentScore
    ].filter(v => v !== undefined).length;
    const confidence = provided / 6;

    return {
        compositeScore: Math.max(0, Math.min(100, compositeScore)),
        severityLabel: scoreToSeverity(compositeScore),
        confidence,
    };
}

// ── AI insight generation ──────────────────────────────────────────────────────

export async function generateDailyInsight(
    todaySignals: DailySignalInput,
    sevenDayHistory: { date: string; compositeScore: number }[],
    userName?: string
): Promise<string> {
    const { compositeScore, severityLabel, confidence } = fuseSignals(todaySignals);

    // Build a concise context object
    const trendDirection = sevenDayHistory.length >= 2
        ? (sevenDayHistory[sevenDayHistory.length - 1].compositeScore > sevenDayHistory[0].compositeScore
            ? 'improving' : 'declining')
        : 'stable';

    const avgScore = sevenDayHistory.length > 0
        ? Math.round(sevenDayHistory.reduce((s, d) => s + d.compositeScore, 0) / sevenDayHistory.length)
        : compositeScore;

    const prompt = `You are a compassionate AI wellness coach. Provide a single, warm, specific, 1-2 sentence observation for ${userName || 'the user'} based on their mental wellness data.

Today's composite wellness score: ${compositeScore}/100 (${severityLabel})
7-day average: ${avgScore}/100
Trend: ${trendDirection}
Signal inputs: ${JSON.stringify({
        energy: todaySignals.energyLevel,
        mood: todaySignals.moodScore,
        sleep: todaySignals.sleepQuality,
        voice: todaySignals.voiceWellnessScore,
        activities: todaySignals.activityCompletionRate ? `${Math.round(todaySignals.activityCompletionRate * 100)}%` : undefined,
        journalSentiment: todaySignals.journalSentimentScore,
    })}

Rules:
- Do NOT mention scores or numbers to the user
- Be specific to what the data suggests, not generic
- Empathetic but grounded — not overly cheerful  
- End with a micro-action suggestion if score < 60
- Max 30 words total`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 80,
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content?.trim() ?? fallbackInsight(severityLabel, trendDirection);
    } catch {
        return fallbackInsight(severityLabel, trendDirection);
    }
}

function fallbackInsight(severity: SeverityLabel, trend: string): string {
    if (trend === 'improving') return 'Your trajectory is heading in a positive direction. Keep showing up.';
    if (severity === 'severe') return 'Today is heavy — one small act of self-care is enough. Try 3 deep breaths.';
    if (severity === 'moderate') return 'Your system is working hard right now. A 4-minute somatic reset could shift things.';
    if (severity === 'mild') return 'Balanced but with room to deepen. A brief reflection session would serve you well.';
    return 'You\'re in a good state. Channel this energy into something meaningful today.';
}

// ── Treatment plan adjustment logic ──────────────────────────────────────────

export function computePlanAdjustment(
    history: { compositeScore: number }[],
    currentWeek: number,
    totalWeeks: number
): { action: 'advance' | 'add_recovery' | 'none'; reason: string } {
    if (history.length < 5) return { action: 'none', reason: 'Insufficient data' };

    const recent = history.slice(-7);
    const oldest = recent[0].compositeScore;
    const newest = recent[recent.length - 1].compositeScore;
    const delta = newest - oldest;

    if (delta > 15 && currentWeek < totalWeeks) {
        return { action: 'advance', reason: `Wellness score improved ${delta} points over 7 days — ready to progress` };
    }
    if (delta < -15) {
        return { action: 'add_recovery', reason: `Wellness score declined ${Math.abs(delta)} points — adding a recovery focus` };
    }
    return { action: 'none', reason: 'Stable trajectory — maintaining current week' };
}
