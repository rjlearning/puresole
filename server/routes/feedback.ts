import { Router } from 'express';
import { pool } from '../db';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

function requireAdmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// User submits feedback
router.post('/feedback', requireAuth, async (req, res) => {
    try {
        const userId = (req.user as any)?.id;
        const { category, content } = req.body;

        if (!category || !content) {
            return res.status(400).json({ error: 'Category and content are required' });
        }

        const validCategories = ['bug', 'feature_request', 'general'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const result = await pool.query(
            `INSERT INTO user_feedbacks (user_id, category, content, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, category, content, 'new']
        );

        res.status(201).json({ feedback: result.rows[0] });
    } catch (error) {
        console.error('[Feedback] Submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Admin views feedback
router.get('/admin/feedback', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.*, u.first_name, u.last_name, u.email
       FROM user_feedbacks f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC`
        );
        res.json({ feedback: result.rows });
    } catch (error) {
        console.error('[Feedback] Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// Admin updates feedback status
router.patch('/admin/feedback/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'reviewed', 'resolved'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            `UPDATE user_feedbacks 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        res.json({ feedback: result.rows[0] });
    } catch (error) {
        console.error('[Feedback] Update error:', error);
        res.status(500).json({ error: 'Failed to update feedback status' });
    }
});

export default router;
