import { Router } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../multiAuth";
import { generateMensProtocol } from "../services/mensMetabolicEngine";

const router = Router();

// POST /api/men/biometrics - Save male physiological data
router.post("/biometrics", requireAuth, async (req: any, res) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found" });
        }
        const { weight, height, age, activityLevel, fitnessGoal } = req.body;

        // Perform basic validation
        if (!weight || !height || !age) {
            return res.status(400).json({ message: "Weight, height, and age are required to calculate the Evolution Stack." });
        }

        const updatedUser = await db.update(users)
            .set({
                weight: weight.toString(),
                height: height.toString(),
                age: parseInt(age),
                activityLevel: activityLevel || 'moderate',
                fitnessGoal: fitnessGoal || 'maintain',
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))
            .returning();

        res.json({ success: true, user: updatedUser[0] });
    } catch (error) {
        console.error("[Men API] Error saving biometrics:", error);
        res.status(500).json({ message: "Failed to save biometrics" });
    }
});

// GET /api/men/protocol - Generate or fetch the personalized Evolution Stack
router.get("/protocol", requireAuth, async (req: any, res) => {
    try {
        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found" });
        }

        // Let the engine calculate the TDEE Macros and query OpenAI for the reasoning/meals
        const protocol = await generateMensProtocol(userId);

        res.json(protocol);
    } catch (error) {
        console.error("[Men API] Error generating protocol:", error);
        res.status(500).json({ message: "Failed to generate Evolution Stack protocol" });
    }
});

export default router;
