import { Router } from 'express';
import { requireAuth } from '../multiAuth';
import { storage } from '../storage';
import { db } from '../db';
import { resilienceTrends, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

/**
 * Level 4: Coaching & Resilience Routes
 */

// Get resilience trends for the authenticated user
router.get('/resilience-trends', requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const trends = await storage.getResilienceTrendsByUser(userId);
        res.json(trends);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch resilience trends" });
    }
});

// Generate a new resilience trend report (Level 4 only)
router.post('/resilience-trends/generate', requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (!user || (user.growthLevel ?? 0) < 4) {
            return res.status(403).json({ message: "Resilience reports are only available for Level 4 Professional Tier." });
        }

        // Capture trend data (mocked for now, would aggregate from assessment scores over last month)
        const trendData = {
            anxietyTrend: [40, 35, 28, 22], // Weekly PHQ/GAD scores
            insomniaTrend: [15, 12, 10, 8],
            energyLevels: [3, 4, 6, 8], // 1-10
            milestonesReached: ['Vagus Nerve Awareness', 'Somatic Release Mastery', 'Neuro-Nutrition Stability']
        };

        const summary = `You have shown remarkable resilience in your Season of Transition. Your anxiety baseline has dropped by 45% since starting our bio-sync protocol. Your energy levels are now stabilized through our gut-anxiety meal planning.`;

        const nextMilestones = ['Deep Breathwork Integration', 'Advanced Somatic Grounding'];

        const newTrend = await storage.createResilienceTrend({
            userId,
            coachId: user.assignedCoachId,
            trendData,
            summary,
            nextMilestones
        });

        res.json(newTrend);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to generate resilience report" });
    }
});

// Get coach info
router.get('/coach', requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (!user || !user.assignedCoachId) {
            return res.json({ coach: null });
        }

        const coach = await storage.getUser(user.assignedCoachId);
        if (!coach) return res.json({ coach: null });

        res.json({
            id: coach.id,
            firstName: coach.firstName,
            lastName: coach.lastName,
            profileImageUrl: coach.profileImageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', // Sarah 
            bio: "Mental Health Expert specializing in PULSE Bio-sync and Somatic interventions."
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch coach info" });
    }
});

export default router;
