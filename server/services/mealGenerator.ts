import OpenAI from 'openai';
import { db } from '../db';
import { mealPlans, wearableDataPoints } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getMetabolicInsights } from './metabolicEngine';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

export interface MealPlanParams {
    userId: string;
    date: Date;
}

export async function generateAdaptiveMealPlan(userId: string, date: Date = new Date()) {
    try {
        // 1. Get Metabolic Insights
        const metabolicProfile = await getMetabolicInsights(userId);

        // 2. Get recent Wearable data (Last 24-48 hours)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const wearableData = await db.select()
            .from(wearableDataPoints)
            .where(and(
                eq(wearableDataPoints.userId, userId),
                gte(wearableDataPoints.recordedAt, fortyEightHoursAgo)
            ))
            .orderBy(desc(wearableDataPoints.recordedAt));

        const latestSleep = wearableData.find(d => d.metricType === 'sleep_hours')?.value;
        const latestHRV = wearableData.find(d => d.metricType === 'hrv')?.value;

        // 3. Construct Prompt for AI
        const prompt = `You are a precision nutrition AI specializing in postpartum recovery. 
Generate a daily meal plan for a user with the following profile:

- Recovery Stage: Week ${metabolicProfile.recoveryWeek} (${metabolicProfile.deliveryType} delivery)
- Breastfeeding: ${metabolicProfile.isBreastfeeding ? 'Yes (Higher caloric/protein demand)' : 'No'}
- Recent Sleep: ${latestSleep || 7} hours ${!latestSleep ? '(Default baseline used)' : ''}
- Recent HRV (Stress Load): ${latestHRV || 50} ms ${!latestHRV ? '(Default baseline used)' : ''}
- Critical Biomarker Needs:
${metabolicProfile.insights.map(i => `- ${i.type}: ${i.status} (Value: ${i.value} ${i.unit}). Goal: ${i.intervention}`).join('\n')}

Rules:
1. If breastfeeding, target ~2300-2500 calories with 80-100g protein.
2. If ferritin is low, prioritize iron-rich foods (red meat, spinach, legumes).
3. If sleep is <6 hours, prioritize complex carbs and magnesium-rich foods to support cortisol regulation.
4. Response must be JSON.

Expected JSON format:
{
  "breakfast": "Meal description",
  "lunch": "Meal description",
  "dinner": "Meal description",
  "snacks": "Snack description",
  "recoverySteps": ["Physical step", "Supplement step", "Nervous system step"],
  "targetCalories": 2400,
  "targetProteinGrams": 95,
  "targetCarbGrams": 250,
  "targetFatGrams": 80,
  "reasoning": "Brief explanation of adjustments based on biometrics"
}`;

        let planData;
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            });
            planData = JSON.parse(response.choices[0].message.content || '{}');
        } catch (err: any) {
            console.error('[Meal Generator] OpenAI call failed, using fallback:', err.message);
            planData = {
                breakfast: "Oatmeal with chia seeds and berries",
                lunch: "Quinoa bowl with spinach, lentils, and lemon dressing",
                dinner: "Baked salmon with steamed broccoli and sweet potato",
                snacks: "Greek yogurt with walnuts",
                recoverySteps: [
                    "Perform 5 minutes of focused diaphragmatic breathing",
                    "Take your Vitamin D and Magnesium supplements after dinner",
                    "Gentle pelvic floor engagement (3 sessions of 10)"
                ],
                targetCalories: 2200,
                targetProteinGrams: 85,
                targetCarbGrams: 220,
                targetFatGrams: 75,
                reasoning: "Fall-back plan focusing on anti-inflammatory nutrients and core recovery."
            };
        }

        // 4. Save and Return
        const [savedPlan] = await db.insert(mealPlans).values({
            userId,
            date,
            breakfast: planData.breakfast,
            lunch: planData.lunch,
            dinner: planData.dinner,
            snacks: planData.snacks,
            recoverySteps: planData.recoverySteps || [],
            targetCalories: planData.targetCalories,
            targetProteinGrams: planData.targetProteinGrams,
            targetCarbGrams: planData.targetCarbGrams,
            targetFatGrams: planData.targetFatGrams,
            breastfeedingAdjustment: metabolicProfile.isBreastfeeding,
            adaptiveFactors: {
                sleep: latestSleep,
                hrv: latestHRV,
                biomarkerInsights: metabolicProfile.insights.filter(i => i.status !== 'optimal'),
                reasoning: planData.reasoning
            }
        }).returning();

        return savedPlan;
    } catch (error) {
        console.error('[Meal Generator] Error:', error);
        throw error;
    }
}
