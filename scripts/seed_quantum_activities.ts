import "dotenv/config";
import { db } from "../server/db";
import { wellnessActivities } from "../shared/schema";
import crypto from "crypto";

async function run() {
    const activities = [
        {
            id: crypto.randomUUID(),
            name: 'Superposition Expansion',
            description: 'Expand your mind to hold multiple lateral possibilities without anxious particle-collapse.',
            category: 'meditation',
            difficulty: 'advanced',
            duration: 10,
            iconEmoji: '🌌',
            instructions: "Sit quietly and allow your mind to wander.\nInstead of focusing on a single outcome, visualize multiple acceptable paths unfolding at once.\nWhen you feel the urge to make a definitive rigid decision, gently remind yourself to remain in the fluid wave state.",
            benefits: "Reduces anxiety, increases subjective creativity, trains cognitive flexibility",
        },
        {
            id: crypto.randomUUID(),
            name: 'Quantum Coherence Breathing',
            description: 'Synchronize your breath with the conceptual wave-function of the universe.',
            category: 'breathing',
            difficulty: 'intermediate',
            duration: 5,
            iconEmoji: '🌀',
            instructions: "Inhale while imagining an expanding wave of potential.\nExhale while releasing the need for a definitive, collapsed point of certainty.\nRepeat until you feel a state of fluid coherence.",
            benefits: "Rapid stress reduction, promotes lateral thinking",
        }
    ];

    for (const act of activities) {
        await db.insert(wellnessActivities).values(act);
    }
    console.log("Seeded quantum activities.");
    process.exit(0);
}

run().catch(console.error);
