import { db } from '../db';
import { biomarkerResults, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

export interface BiomarkerInsight {
    type: string;
    status: 'optimal' | 'low' | 'high' | 'critical';
    value: number;
    unit: string;
    interpretation: string;
    intervention: string;
}

export interface RecoveryProfile {
    recoveryWeek: number;
    deliveryType: string;
    isBreastfeeding: boolean;
    insights: BiomarkerInsight[];
}

const INTERPRETATION_LOGIC: Record<string, any> = {
    ferritin: {
        low: { threshold: 30, text: "Iron stores are depleted, common in the 'depleted' postpartum state.", intervention: "Prioritize heme-iron (grass-fed beef, liver) + Vitamin C (citrus, peppers). Consider iron bisglycinate if <20." },
        optimal: { threshold: 50, text: "Iron stores are healthy and supporting energy/mood.", intervention: "Maintain with maintenance iron-rich foods." }
    },
    vitaminD: {
        low: { threshold: 30, text: "Low Vitamin D is linked to postpartum mood shifts and immune function.", intervention: "Supplementary D3 + K2 (5000 IU) + 15 mins morning sun." },
        optimal: { threshold: 50, text: "Optimal level for bone health and postpartum immune recovery.", intervention: "Continue maintenance dose." }
    },
    tsh: {
        high: { threshold: 4.0, text: "Elevated TSH may indicate postpartum thyroiditis or hypothyroidism.", intervention: "Focus on Selenium-rich foods (Brazil nuts) and Iodine (seaweed). Clinical follow-up recommended." },
        optimal: { threshold: 2.5, text: "Thyroid function is supporting metabolic rate and energy.", intervention: "Maintain iodine-rich nutrient profile." }
    },
    glucose: {
        high: { threshold: 100, text: "Blood sugar instability can drive postpartum anxiety and fatigue.", intervention: "Prioritize protein-forward snacks and fiber-rich meals to stabilize insulin response." },
        optimal: { threshold: 90, text: "Stable blood sugar supporting hormonal balance.", intervention: "Continue low-glycemic eating patterns." }
    }
};

export async function getMetabolicInsights(userId: string): Promise<RecoveryProfile> {
    // 1. Fetch user context
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) throw new Error("User not found");

    const deliveryDate = user.postpartumDeliveryDate ? new Date(user.postpartumDeliveryDate) : new Date();
    const recoveryWeek = Math.max(1, Math.ceil((new Date().getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));

    // 2. Fetch latest unique biomarkers
    const allResults = await db.select()
        .from(biomarkerResults)
        .where(eq(biomarkerResults.userId, userId))
        .orderBy(desc(biomarkerResults.testedAt));

    const latestBiomarkers: Record<string, any> = {};
    allResults.forEach(r => {
        if (!latestBiomarkers[r.biomarkerType]) {
            latestBiomarkers[r.biomarkerType] = r;
        }
    });

    // 3. Process insights
    const insights: BiomarkerInsight[] = [];

    for (const [type, data] of Object.entries(latestBiomarkers)) {
        const val = Number(data.value);
        const logic = INTERPRETATION_LOGIC[type];

        if (!logic) continue;

        let status: 'optimal' | 'low' | 'high' | 'critical' = 'optimal';
        let interpretation = "";
        let intervention = "";

        if (logic.high) {
            if (val > logic.high.threshold) {
                status = 'high';
                interpretation = logic.high.text;
                intervention = logic.high.intervention;
            } else {
                interpretation = logic.optimal.text;
                intervention = logic.optimal.intervention;
            }
        } else if (logic.low) {
            if (val < logic.low.threshold) {
                status = 'low';
                interpretation = logic.low.text;
                intervention = logic.low.intervention;
            } else {
                interpretation = logic.optimal.text;
                intervention = logic.optimal.intervention;
            }
        }

        insights.push({
            type,
            status,
            value: val,
            unit: data.unit,
            interpretation,
            intervention
        });
    }

    return {
        recoveryWeek,
        deliveryType: user.postpartumDeliveryType || 'vaginal',
        isBreastfeeding: user.isBreastfeeding || false,
        insights
    };
}

export async function generateComprehensiveRecoveryAnalysis(userId: string) {
    const profile = await getMetabolicInsights(userId);

    const prompt = `You are a precision postpartum recovery specialist AI. Analyze the following user profile and provide a comprehensive recovery roadmap and physiological analysis.

Profile:
- Recovery Week: ${profile.recoveryWeek}
- Delivery Type: ${profile.deliveryType}
- Breastfeeding: ${profile.isBreastfeeding ? 'Yes' : 'No'}
- Key Biomarkers:
${profile.insights.map(i => `- ${i.type}: ${i.status} (Value: ${i.value} ${i.unit})`).join('\n')}

Rules:
1. Provide a "Recovery Score" (0-100) based on biomarker optimization and recovery week.
2. Define 3-4 "Milestones" for the next 4 weeks (e.g., "Expected Tissue Repair Peak", "Hormonal Stabilization Phase").
3. Explain the "Physiological Connection" (The Bridge) between their biomarker status and physical recovery.
4. Response must be JSON.

Expected JSON format:
{
  "recoveryScore": 75,
  "currentPhaseName": "Hormonal Rebalancing",
  "physiologicalBridge": "Your low Ferritin levels are currently limiting the efficiency of tissue repair following your ${profile.deliveryType} delivery, making energy stabilization the primary focus.",
  "milestones": [
    { "week": ${profile.recoveryWeek}, "label": "Inflammation Subsiding", "description": "Transitioning from acute healing to metabolic stabilization." },
    { "week": ${profile.recoveryWeek + 1}, "label": "Expected Peak Repair", "description": "Increased cellular turnover based on current nutrient protocol." }
  ],
  "bioScoreBreakdown": {
    "nutritional": 80,
    "hormonal": 65,
    "physical": 70
  }
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
        console.error('[Metabolic Engine] AI Analysis failed:', error);
        // Fallback analysis
        return {
            recoveryScore: 70,
            currentPhaseName: "General Postpartum Recovery",
            physiologicalBridge: "Your body is focusing on foundational healing and nutrient replenishment.",
            milestones: [
                { "week": profile.recoveryWeek, "label": "Stable Healing", "description": "Maintaining base inflammatory response control." }
            ],
            bioScoreBreakdown: {
                "nutritional": 70,
                "hormonal": 70,
                "physical": 70
            }
        };
    }
}
