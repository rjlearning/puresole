import { Router } from 'express';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

function requireAdmin(req: any, res: any, next: any) {
    const user = req.user as any;
    if (!req.isAuthenticated || !req.isAuthenticated() || !user?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// User submits feedback
router.post('/feedback', requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const userId = user?.id || user?.claims?.sub;

        if (!userId) {
            return res.status(401).json({ error: 'User ID not found' });
        }

        const { category, content } = req.body;

        if (!category || !content) {
            return res.status(400).json({ error: 'Category and content are required' });
        }

        const validCategories = ['bug', 'feature_request', 'general'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
        }

        if (content.trim().length < 5) {
            return res.status(400).json({ error: 'Feedback must be at least 5 characters' });
        }

        const [feedback] = await db
            .insert(schema.userFeedbacks)
            .values({
                userId,
                category: category as any,
                content: content.trim(),
                status: 'new',
            })
            .returning();

        res.status(201).json({ feedback, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('[Feedback] Submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback', detail: String(error) });
    }
});

// Admin views all feedback
router.get('/admin/feedback', requireAdmin, async (req, res) => {
    try {
        const feedbacks = await db
            .select({
                id: schema.userFeedbacks.id,
                category: schema.userFeedbacks.category,
                content: schema.userFeedbacks.content,
                status: schema.userFeedbacks.status,
                createdAt: schema.userFeedbacks.createdAt,
                updatedAt: schema.userFeedbacks.updatedAt,
                userId: schema.userFeedbacks.userId,
            })
            .from(schema.userFeedbacks)
            .orderBy(desc(schema.userFeedbacks.createdAt));

        res.json({ feedback: feedbacks });
    } catch (error) {
        console.error('[Feedback] Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback', detail: String(error) });
    }
});

// Admin updates feedback status
router.patch('/admin/feedback/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'reviewed', 'resolved'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: new, reviewed, resolved' });
        }

        const [updated] = await db
            .update(schema.userFeedbacks)
            .set({ status: status as any, updatedAt: new Date() })
            .where(eq(schema.userFeedbacks.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        res.json({ feedback: updated });
    } catch (error) {
        console.error('[Feedback] Update error:', error);
        res.status(500).json({ error: 'Failed to update feedback status', detail: String(error) });
    }
});

export default router;
