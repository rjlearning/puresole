import { db } from "../db";
import { voiceEntries, wellnessInsights } from "@shared/schema";
import { lte, lt, and, eq, gte } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function runVoiceCleanupJob() {
    try {
        const now = new Date();

        // 1. Delete entries older than 29 days
        const deleteThreshold = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        const toDelete = await db.query.voiceEntries.findMany({
            where: lte(voiceEntries.recordedAt, deleteThreshold)
        });

        for (const entry of toDelete) {
            if (entry.audioUrl && typeof entry.audioUrl === 'string') {
                const filePath = path.join(process.cwd(), entry.audioUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await db.delete(voiceEntries).where(eq(voiceEntries.id, entry.id));
        }
        if (toDelete.length > 0) {
            console.log(`[Voice Cleanup] Deleted ${toDelete.length} entries older than 29 days.`);
        }

        // 2. Generate warnings for entries that are 22 (7 days), 24 (5 days), and 28 (1 day) days old
        const warnings = [
            { daysOld: 22, warningDaysLeft: 7 },
            { daysOld: 24, warningDaysLeft: 5 },
            { daysOld: 28, warningDaysLeft: 1 }
        ];

        for (const { daysOld, warningDaysLeft } of warnings) {
            const startOfDay = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            const entriesToWarn = await db.query.voiceEntries.findMany({
                where: and(
                    gte(voiceEntries.recordedAt, startOfDay),
                    lte(voiceEntries.recordedAt, endOfDay)
                )
            });

            for (const entry of entriesToWarn) {
                // Create an insight/notification for the user
                await db.insert(wellnessInsights).values({
                    userId: entry.userId,
                    insightType: 'system_notification',
                    title: `Voice Memo Expiring Soon`,
                    description: `A voice memo recorded on ${entry.recordedAt?.toLocaleDateString()} will be automatically deleted in ${warningDaysLeft} day(s) according to our 29-day retention policy.`,
                    priority: 'high',
                    isActionable: false,
                });
            }
        }

    } catch (error) {
        console.error("[Voice Cleanup Error]", error);
    }
}
