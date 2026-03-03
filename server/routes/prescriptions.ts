import { Router } from "express";
import { db } from "../db";
import { assessments, treatmentPlans, treatmentModules } from "../../shared/schema";
import OpenAI from "openai";
import { eq } from "drizzle-orm";

const prescriptionsRouter = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

prescriptionsRouter.post("/generate", async (req, res) => {
    try {
        const { emotion } = req.body;
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!emotion) {
            return res.status(400).json({ error: "Emotion is required" });
        }

        const prompt = `
You are an expert AI clinical orchestrator for PureSoul wellness platform.
User's current emotional state: "${emotion}".

Generate a comprehensive, evidence-based 4-week clinical pathway. Return ONLY valid JSON:
{
  "protocolName": "string (concise clinical name, e.g. 'Anxiety Relief Protocol')",
  "description": "2-sentence clinical rationale for this protocol",
  "immediateAction": {
    "title": "string (short exercise name)",
    "durationMinutes": number,
    "instructions": "3-4 sentence step-by-step instructions"
  },
  "modules": [
    {
      "week": 1,
      "title": "string (week theme, e.g. 'Foundation & Awareness')",
      "description": "string (what this week builds)",
      "activities": [
        {
          "name": "string (activity name)",
          "type": "exercise|lesson|journal|meditation|reading",
          "description": "1-2 sentences describing this activity",
          "duration": number (minutes, between 5 and 30),
          "instructions": "Step-by-step instructions in 3-5 sentences"
        }
      ]
    }
  ]
}

Rules:
- Each week MUST have exactly 3 activities
- Activities must be specific, actionable, and evidence-based (CBT, DBT, somatic, mindfulness)
- Tailor ALL content to the emotion: ${emotion}
- Week 1 = Foundation, Week 2 = Deepening, Week 3 = Integration, Week 4 = Mastery
`;


        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a rigid clinical AI outputting exclusively JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const data = JSON.parse(response.choices[0].message.content || "{}");

        // 1. Create Assessment
        const [assessment] = await db.insert(assessments).values({
            userId: user.id,
            type: "conversation_ai",
            responses: { reported_emotion: emotion },
            severity: "mild",
            aiAnalysis: data.description,
        }).returning();

        // 2. Create Treatment Plan
        const [plan] = await db.insert(treatmentPlans).values({
            userId: user.id,
            assessmentId: assessment.id,
            title: data.protocolName,
            description: data.description,
            status: "active",
            totalWeeks: 4,
            modules: data.modules, // Storing modules as JSONB in treatmentPlans for simplicity as per existing schema usage in treatment-plan.tsx
        }).returning();

        // 3. Create individual modules (maps activity fields correctly)
        for (let i = 0; i < data.modules.length; i++) {
            const mod = data.modules[i];
            // Normalize activities: map `title` -> `name` for backward compat with AI output
            const activities = (mod.activities || []).map((a: any) => ({
                name: a.name || a.title || `Activity ${i + 1}`,
                type: a.type || 'exercise',
                description: a.description || '',
                duration: a.duration || a.durationMinutes || 10,
                instructions: a.instructions || a.description || 'Follow the activity as described.',
            }));

            await db.insert(treatmentModules).values({
                planId: plan.id,
                title: mod.title,
                description: mod.description || '',
                week: mod.week,
                order: i,
                content: {
                    activities,
                    learningObjectives: mod.learningObjectives || [
                        `Build foundational skills for Week ${mod.week}`,
                        `Practice ${mod.title?.toLowerCase() || 'core techniques'} daily`,
                        `Track progress and reflect on changes`,
                    ]
                },
            });
        }

        res.json({
            success: true,
            protocol: data,
            planId: plan.id
        });
    } catch (error) {
        console.error("Error generating prescription:", error);
        res.status(500).json({ error: "Failed to generate protocol" });
    }
});

// ── SEED: Creates a hardcoded high-quality 4-week plan (no OpenAI needed) ──
prescriptionsRouter.post("/seed", async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const SEED_MODULES = [
            {
                week: 1, title: "Baseline Awareness",
                description: "Identify your emotional patterns and build the foundation for lasting change.",
                learningObjectives: ["Recognize personal emotional triggers", "Establish a daily check-in ritual", "Build body-based awareness"],
                activities: [
                    { name: "Morning Body Scan", type: "meditation", duration: 5, description: "Start each day with a 5-minute head-to-toe awareness check.", instructions: "Lie or sit comfortably. Close your eyes. Starting at your feet, slowly move attention upward — calves, knees, hips, abdomen, chest, shoulders, neck, face. Notice any tightness without judgment. Breathe into tense areas. End with three deep breaths." },
                    { name: "Emotional Weather Journal", type: "journal", duration: 10, description: "Track your emotional state three times daily using a 1–10 scale and one descriptive word.", instructions: "Set reminders for morning, afternoon, and evening. Rate energy (1–10) and mood (1–10). Choose one word that describes your state (e.g. 'heavy', 'scattered'). Note what influenced it. Over the week, look for patterns." },
                    { name: "4-7-8 Breathing Reset", type: "exercise", duration: 5, description: "Activate your parasympathetic nervous system whenever you feel tension rising.", instructions: "Sit straight. Exhale completely. Inhale through nose for 4 counts. Hold for 7. Exhale through mouth for 8. Repeat 4 cycles. Practice twice daily — morning and when stressed." }
                ]
            },
            {
                week: 2, title: "Thought Patterns & Reframing",
                description: "Identify cognitive distortions and replace them with balanced perspectives.",
                learningObjectives: ["Identify your three most common cognitive distortions", "Practice the CBT thought record daily", "Develop an evidence-gathering habit"],
                activities: [
                    { name: "CBT Thought Record", type: "journal", duration: 15, description: "When a negative emotion spikes, write the triggering situation, automatic thought, and a balanced alternative.", instructions: "Step 1: Describe the situation objectively. Step 2: Write the automatic thought. Step 3: Rate belief 0–100%. Step 4: List evidence for and against. Step 5: Write a balanced alternative. Step 6: Re-rate your belief and notice how your emotion shifts." },
                    { name: "Cognitive Distortions Lesson", type: "lesson", duration: 20, description: "Study the 10 most common cognitive distortions including catastrophizing, mind reading, and all-or-nothing thinking.", instructions: "Read each distortion: (1) All-or-nothing thinking (2) Overgeneralization (3) Mental filter (4) Disqualifying positives (5) Mind reading (6) Fortune telling (7) Catastrophizing (8) Emotional reasoning (9) Should statements (10) Labeling. For each, write one personal example and one balanced reframe." },
                    { name: "Progressive Muscle Relaxation", type: "exercise", duration: 15, description: "Release stored physical tension through systematic contraction and release.", instructions: "Lie down. Starting with feet — tense all muscles for 5 seconds, release for 15. Move upward: calves, thighs, abdomen, hands, arms, shoulders, face. After all groups, lie still for 2 minutes breathing naturally. Do this each evening before sleep." }
                ]
            },
            {
                week: 3, title: "Emotional Regulation Skills",
                description: "Build your personal toolkit for managing intense emotions in real time.",
                learningObjectives: ["Master two emotion regulation techniques", "Apply TIPP skill during high-distress moments", "Build your personal values compass"],
                activities: [
                    { name: "TIPP Skill Practice", type: "exercise", duration: 10, description: "DBT's TIPP skill for acute emotional intensity spikes.", instructions: "T — Temperature: Hold ice or splash cold water on face. I — Intense exercise: 60 seconds jumping jacks. P — Paced breathing: Inhale 4 counts, exhale 6 for 2 minutes. P — Paired muscle relaxation: inhale while tensing, exhale while releasing. Use this sequence whenever emotions feel overwhelming." },
                    { name: "Values Clarification Worksheet", type: "lesson", duration: 25, description: "Identify your core personal values — the compass for sustained wellbeing.", instructions: "Free-write 20 things that matter to you. Circle the top 10. From those, pick the top 5. For each: (a) What does this value mean to me? (b) How am I honoring it? (c) How am I violating it? (d) One action I can take this week to live more aligned with it." },
                    { name: "Gratitude & Accomplishment Review", type: "journal", duration: 10, description: "End each day naming three specific gratitudes and one genuine accomplishment.", instructions: "Each evening, write three specific gratitudes (not 'health' but 'I walked without pain today'). Write one accomplishment no matter how small. Rate your overall mood 1–10. Over time you are training your brain to notice positive data — building neurochemical resilience." }
                ]
            },
            {
                week: 4, title: "Integration & Long-Term Mastery",
                description: "Consolidate your skills into sustainable daily rituals and build a relapse prevention plan.",
                learningObjectives: ["Design your personal daily wellness ritual", "Create a personal relapse prevention plan", "Celebrate progress and plan next steps"],
                activities: [
                    { name: "Mindful Self-Compassion Practice", type: "meditation", duration: 15, description: "Use Kristin Neff's 3-component MSC technique — mindfulness, common humanity, self-kindness.", instructions: "Bring to mind a current difficulty. Step 1 — Mindfulness: Acknowledge 'This is a moment of suffering.' Step 2 — Common humanity: 'Suffering is part of the human experience. I am not alone.' Step 3 — Self-kindness: Place a hand on your heart and ask 'What do I need right now?' Offer yourself compassionate words. Sit with this for 5 minutes. Journal any insights." },
                    { name: "Personal Wellness Architecture", type: "lesson", duration: 30, description: "Design your sustainable daily, weekly, and monthly wellness system using insights from the past four weeks.", instructions: "Create a Wellness Architecture document. Section A — Morning Ritual (10–15 min): choose 2–3 practices. Section B — Midday Reset (5 min): one brief stress technique. Section C — Evening Wind-down (10 min): a journaling practice. Section D — Weekly Anchor: one longer practice. Section E — Warning Signs: early signals of overwhelm. Section F — Support contacts. Review monthly." },
                    { name: "Letter to Future Self", type: "journal", duration: 20, description: "Write a letter to your future self documenting your growth and intentions for the months ahead.", instructions: "Date the letter 6 months from today. Write: (1) Where you were emotionally when you started. (2) The most significant shift you experienced. (3) The skill or insight that changed something. (4) What you want to remember when things get hard. (5) Your commitments to yourself going forward. Save it somewhere you won't easily access — read only on that future date." }
                ]
            }
        ];

        const [assessment] = await db.insert(assessments).values({
            userId: user.id,
            type: "conversation_ai",
            responses: { reported_emotion: "general" },
            severity: "mild",
            aiAnalysis: "4-week evidence-based emotional resilience program.",
        }).returning();

        const [plan] = await db.insert(treatmentPlans).values({
            userId: user.id,
            assessmentId: assessment.id,
            title: "Emotional Resilience Foundation",
            description: "A 4-week evidence-based program combining CBT, somatic awareness, and mindfulness to build lasting emotional regulation skills.",
            status: "active",
            totalWeeks: 4,
            currentWeek: 1,
            modules: SEED_MODULES,
        }).returning();

        for (let i = 0; i < SEED_MODULES.length; i++) {
            const mod = SEED_MODULES[i];
            await db.insert(treatmentModules).values({
                planId: plan.id,
                title: mod.title,
                description: mod.description,
                week: mod.week,
                order: i,
                content: { activities: mod.activities, learningObjectives: mod.learningObjectives },
            });
        }

        res.json({ success: true, planId: plan.id });
    } catch (error) {
        console.error("Error seeding plan:", error);
        res.status(500).json({ error: "Failed to seed plan" });
    }
});

export default prescriptionsRouter;
