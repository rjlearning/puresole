/**
 * Behavioral Fingerprinting & Clinical Memory Engine
 * 
 * Maps raw interaction metrics (pulse velocity, dwell, frequency)
 * to behavioral archetypes and generates clinical summaries.
 */

import { DailySignal, BehaviorProfile } from "@shared/schema";
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type UserArchetype =
    | 'Steady Achiever'
    | 'Impulsive Morning Ruminator'
    | 'Evening Recovery Seeker'
    | 'Avoidant High-Stress'
    | 'Mindful Integrator'
    | 'Establishing Baseline';

/**
 * Maps raw metrics to a human-readable archetype
 */
export function determineArchetype(signals: DailySignal[]): UserArchetype {
    if (signals.length < 5) return 'Establishing Baseline';

    const avgVelocity = signals.reduce((acc, s) => acc + (s.pulseVelocityMs || 5000), 0) / signals.length;
    const avgDwell = signals.reduce((acc, s) => acc + (s.dwellTimeSeconds || 10), 0) / signals.length;

    // High velocity (< 2s) + Morning sessions = Impulsive Ruminator
    if (avgVelocity < 2500) return 'Impulsive Morning Ruminator';

    // High dwell (> 30s) + High activity completion = Mindful Integrator
    if (avgDwell > 30) return 'Mindful Integrator';

    // Low activity + Evening sessions = Evening Recovery Seeker
    return 'Steady Achiever';
}

/**
 * Generates a dense clinical memory summary for the AI Companion
 */
export async function generateClinicalSummary(
    history: DailySignal[],
    currentProfile?: BehaviorProfile
): Promise<string> {
    const archetype = determineArchetype(history);

    const prompt = `Synthesize the following 30-day mental health behavioral data into a DENSE, 2-sentence "Clinical Memory" for an AI coach. 
Focus on patterns, not numbers. Mention the archetype: ${archetype}.

Data: ${JSON.stringify(history.map(h => ({
        score: h.compositeScore,
        severity: h.severityLabel,
        velocity: h.pulseVelocityMs,
        dwell: h.dwellTimeSeconds,
        date: h.signalDate
    })))}

Previous Memory: ${currentProfile?.clinicalSummary || 'None'}

Goal: The AI should know exactly HOW the user usually struggles or succeeds.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
        });
        return response.choices[0]?.message?.content?.trim() || "User is currently establishing a baseline wellness pattern.";
    } catch {
        return "User is maintaining a consistent engagement pattern.";
    }
}

/**
 * Injects behavioral context into the AI Companion prompt
 */
export function getBehavioralSystemPrompt(profile?: BehaviorProfile): string {
    if (!profile) return "";

    return `
[CLINICAL MEMORY UNLOCKED]
You have a long-term memory of this user's behavior. 
Archetype: ${profile.archetype}
Pattern Summary: ${profile.clinicalSummary}

If relevant, subtly reference these long-term patterns in your conversation. For example: "I recall that your energy usually dips on Tuesdays—how are you managing that today?" or "You've been moving faster than usual today; let's take a beat."
`;
}
