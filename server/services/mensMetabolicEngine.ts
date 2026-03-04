import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

export interface MensEvolutionProtocol {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    reasoning: string;
    meals: Array<{
        id: number;
        title: string;
        icon: string;
        content: string;
    }>;
}

// Activity Multipliers for TDEE Calculation
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
};

// Goal adjustments (daily caloric surplus/deficit)
const GOAL_ADJUSTMENTS: Record<string, number> = {
    'cut': -500,
    'maintain': 0,
    'bulk': 500,
    'recomp': -200 // Slight deficit for body recomposition
};

export async function generateMensProtocol(userId: string): Promise<MensEvolutionProtocol> {
    // 1. Fetch user context
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) throw new Error("User not found");

    // Default to a 25-year-old active male, 80kg, 180cm, aiming for recomp if no data exists
    const weightKg = user.weight ? Number(user.weight) : 80;
    const heightCm = user.height ? Number(user.height) : 180;
    const age = user.age || 25;
    const activityLevel = user.activityLevel || 'active';
    const fitnessGoal = user.fitnessGoal || 'recomp';

    // 2. Base Metabolic Calculations (Mifflin-St Jeor for Men)
    // BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;

    // Total Daily Energy Expenditure (TDEE)
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
    const tdee = bmr * multiplier;

    // Adjusted Target Calories
    const targetCalories = Math.round(tdee + (GOAL_ADJUSTMENTS[fitnessGoal] || 0));

    // 3. Macro Optimization for Male Endocrine Function
    // Protein: ~2.2g per kg of bodyweight for muscle preservation/growth
    const targetProtein = Math.round(weightKg * 2.2);

    // Fats: ~30% of total calories to support natural testosterone production (1g fat = 9 kcal)
    const targetFats = Math.round((targetCalories * 0.3) / 9);

    // Carbs: The remainder of the calories (1g carb = 4 kcal, 1g protein = 4 kcal)
    const remainingCalories = targetCalories - ((targetProtein * 4) + (targetFats * 9));
    const targetCarbs = Math.max(0, Math.round(remainingCalories / 4)); // Prevent negative carbs

    // 4. OpenAI Prompt for Custom Biological Rationale and Meal Protocol
    const prompt = `You are a precision mens health and peak performance AI nutritionist. Generate a dynamic 4-meal eating protocol and a scientific rationale for a male user with the following profile.

Profile:
- Weight: ${weightKg}kg
- Height: ${heightCm}cm
- Age: ${age}
- Activity Level: ${activityLevel}
- Primary Goal: ${fitnessGoal}
- Target Macros: ${targetCalories} kcal (Protein: ${targetProtein}g, Carbs: ${targetCarbs}g, Fats: ${targetFats}g)

Rules:
1. Explain the "reasoning" (1-2 sentences) behind this specific macro split. Focus on endocrine optimization, testosterone support, neurotransmitter synthesis, and glycemic load.
2. Outline 4 exact meals ("Power Start", "Mid-Day Fuel", "Restoration", "Performance Stack") that perfectly build up to those target macros.
3. Include an appropriate emoji for the "icon", a catchy "title", and the "content" describing the precise food items and their biological effect.
4. Response MUST be valid JSON.

Expected JSON format:
{
  "reasoning": "Strategic caloric manipulation tailored for [Goal], focusing on zinc-rich saturated fats for endogenous testosterone signaling and cyclic carb loading for anaerobic performance.",
  "meals": [
    { "id": 1, "title": "Cognitive Anchor", "icon": "🥩", "content": "8oz grass-fed steak, 3 pasture-raised eggs. A zinc and cholesterol-dense morning load for immediate testosterone substrate and prolonged dopamine." }
  ]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const aiData = JSON.parse(response.choices[0].message.content || '{}');

        return {
            calories: targetCalories,
            protein: targetProtein,
            carbs: targetCarbs,
            fats: targetFats,
            reasoning: aiData.reasoning || "Optimizing endocrine function and metabolic drive through targeted macronutrient ratios.",
            meals: aiData.meals || []
        };
    } catch (error) {
        console.error('[Mens Metabolic Engine] AI Generation failed:', error);
        // Fallback robust data
        return {
            calories: targetCalories,
            protein: targetProtein,
            carbs: targetCarbs,
            fats: targetFats,
            reasoning: "Focusing on anaerobic recovery and cognitive endurance. Strategic cortisol management through micronutrient timing.",
            meals: [
                { id: 1, title: 'Power Start', icon: '🍳', content: '4 Eggs, avocado, smoked salmon, handful of walnuts. High fat-protein anchor for cognitive stability.' },
                { id: 2, title: 'Mid-Day Fuel', icon: '🥩', content: 'Grass-fed beef bowl, sweet potato, fermented greens. Glycemic load optimized for afternoon anabolic window.' },
                { id: 3, title: 'Restoration', icon: '🥗', content: 'Roasted chicken, olive oil, asparagus, heap of baby spinach. Micronutrient density for neurotransmitter synthesis.' },
                { id: 4, title: 'Performance Stack', icon: '🫐', content: 'Greek yogurt with berries & raw honey (Pre-sleep). Cortisol blunting for deep recovery.' }
            ]
        };
    }
}
