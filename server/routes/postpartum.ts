import express from 'express';
import { db } from '../db';
import { users, biomarkerResults, mealPlans } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getMetabolicInsights, generateComprehensiveRecoveryAnalysis } from '../services/metabolicEngine';
import { generateAdaptiveMealPlan } from '../services/mealGenerator';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

const router = express.Router();

router.get('/comprehensive-analysis', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const analysis = await generateComprehensiveRecoveryAnalysis(userId);
        res.json(analysis);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch comprehensive analysis' });
    }
});

router.post('/onboarding', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { deliveryDate, deliveryType, breastfeeding, biomarkers } = req.body;

    try {
        // 1. Update user profile
        await db.update(users)
            .set({
                postpartumDeliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                postpartumDeliveryType: deliveryType,
                isBreastfeeding: breastfeeding === 'yes',
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));

        // 2. Save biomarkers if provided
        if (biomarkers) {
            const biomarkerEntries = Object.entries(biomarkers)
                .filter(([_, value]) => value !== "" && value !== undefined)
                .map(([type, value]) => ({
                    userId,
                    biomarkerType: type,
                    value: String(value),
                    unit: getUnitForType(type),
                    testedAt: new Date(),
                    source: 'manual'
                }));

            if (biomarkerEntries.length > 0) {
                await db.insert(biomarkerResults).values(biomarkerEntries);
            }
        }

        // 3. Trigger initial meal plan generation (async)
        generateAdaptiveMealPlan(userId).catch(err => console.error("Initial meal plan generation failed:", err));

        res.json({ success: true, message: 'Onboarding data saved successfully' });
    } catch (error: any) {
        console.error('Error saving onboarding data:', error);
        res.status(500).json({ error: 'Failed to save onboarding data', details: error.message });
    }
});

router.get('/biomarkers', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const results = await db.select()
            .from(biomarkerResults)
            .where(eq(biomarkerResults.userId, userId))
            .orderBy(biomarkerResults.testedAt);

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch biomarkers' });
    }
});

router.get('/context', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const user = await db.select({
            deliveryDate: users.postpartumDeliveryDate,
            deliveryType: users.postpartumDeliveryType,
            isBreastfeeding: users.isBreastfeeding
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        res.json(user[0] || {});
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch context' });
    }
});

router.get('/meal-plan', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const plans = await db.select()
            .from(mealPlans)
            .where(eq(mealPlans.userId, userId))
            .orderBy(desc(mealPlans.date))
            .limit(1);

        if (plans.length === 0) {
            // If no plan exists, try to generate one
            const newPlan = await generateAdaptiveMealPlan(userId);
            return res.json(newPlan);
        }

        res.json(plans[0]);
    } catch (error: any) {
        console.error("Error fetching meal plan:", error);
        res.status(500).json({ error: 'Failed to fetch meal plan' });
    }
});

router.post('/meal-plan/generate', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const newPlan = await generateAdaptiveMealPlan(userId);
        res.json(newPlan);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate meal plan' });
    }
});

router.post('/meal-plan/grocery-list', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { breakfast, lunch, dinner, snacks } = req.body;

    try {
        const prompt = `Convert the following meal plan into a categorized grocery list (Produce, Protein, Dairy, Grains, Other).
Breakfast: ${breakfast}
Lunch: ${lunch}
Dinner: ${dinner}
Snacks: ${snacks}

Response must be JSON format:
{
  "categories": [
    { "name": "Produce", "items": ["Item 1", "Item 2"] },
    ...
  ]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        res.json(JSON.parse(response.choices[0].message.content || '{}'));
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to generate grocery list' });
    }
});

router.get('/insights', async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    try {
        const profile = await getMetabolicInsights(userId);
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch metabolic insights' });
    }
});

function getUnitForType(type: string): string {
    switch (type) {
        case 'ferritin': return 'ng/mL';
        case 'vitaminD': return 'ng/mL';
        case 'tsh': return 'mIU/L';
        case 'glucose': return 'mg/dL';
        default: return '';
    }
}

export default router;
