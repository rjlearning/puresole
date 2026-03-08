import { db } from "../db";
import { dailySignals } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface Nudge {
    id: string;
    type: 'threshold_low' | 'threshold_high' | 'evening_reminder' | 'streak_celebration';
    title: string;
    message: string;
    ctaText: string;
    ctaLink: string;
    severity: 'info' | 'warning' | 'success';
}

export async function getLatestNudge(userId: string): Promise<Nudge | null> {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch today's latest signals
    const [todaySignals] = await db.select()
        .from(dailySignals)
        .where(and(eq(dailySignals.userId, userId), eq(dailySignals.signalDate, todayStr)))
        .limit(1);

    if (!todaySignals) return null;

    const score = todaySignals.compositeScore ?? 50;

    // 2. Logic for Low Score Nudge
    if (score < 40) {
        return {
            id: `nudge-low-${todayStr}`,
            type: 'threshold_low',
            title: 'Gentle Check-in',
            message: "I've noticed your wellness indicators are a bit lower than usual. Would a quick 5-minute breathing exercise help anchor you?",
            ctaText: 'Start Breathing',
            ctaLink: '/activities?recommended=true&category=breathing',
            severity: 'warning'
        };
    }

    // 3. Logic for High Score Nudge
    if (score > 85) {
        return {
            id: `nudge-high-${todayStr}`,
            type: 'threshold_high',
            title: 'Radiant Momentum',
            message: "You are in a state of high flow today! Let's channel this energy into a mindful reflection to lock in these gains.",
            ctaText: 'Reflect Now',
            ctaLink: '/voice-journal',
            severity: 'success'
        };
    }

    // 4. Evening Reminder (if it's late and ritual isn't fully done)
    const currentHour = new Date().getHours();
    if (currentHour >= 20) {
        // Check if evening reflection is done (we can't easily check activity logs here without more queries, 
        // but we can look at the signal presence)
        if (todaySignals.journalSentimentScore === null) {
            return {
                id: `nudge-evening-${todayStr}`,
                type: 'evening_reminder',
                title: 'Evening Wind-down',
                message: "The day is closing soon. Don't forget your evening reflection to clear your mind for deep rest.",
                ctaText: 'Open Journal',
                ctaLink: '/voice-journal',
                severity: 'info'
            };
        }
    }

    return null;
}
