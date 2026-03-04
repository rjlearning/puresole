import { Router } from 'express';
import { db } from '../db';
import { views, viewShares, viewAccessLog, type InsertView, type InsertViewShare } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ============================================
// VIEWS CRUD
// ============================================

// Get all views for a table
router.get('/views/:tableName', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { tableName } = req.params;

    const userViews = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.userId, userId),
          eq(views.tableName, tableName)
        )
      )
      .orderBy(views.displayOrder, views.name);

    res.json({ views: userViews });
  } catch (error) {
    console.error('Error fetching views:', error);
    res.status(500).json({ error: 'Failed to fetch views' });
  }
});

// Get single view
router.get('/views/:tableName/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { tableName, id } = req.params;

    const [view] = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId),
          eq(views.tableName, tableName)
        )
      );

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Log access
    await db.insert(viewAccessLog).values({
      viewId: id,
      userId,
      accessType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(() => {}); // Ignore logging errors

    res.json({ view });
  } catch (error) {
    console.error('Error fetching view:', error);
    res.status(500).json({ error: 'Failed to fetch view' });
  }
});

// Create new view
router.post('/views', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      tableName,
      name,
      viewType,
      config,
      filters,
      sorts,
      visibleFields,
      groupBy,
      description,
      isDefault,
      isFavorite,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(views)
        .set({ isDefault: false })
        .where(
          and(
            eq(views.userId, userId),
            eq(views.tableName, tableName),
            eq(views.isDefault, true)
          )
        );
    }

    const newView: InsertView = {
      userId,
      tableName,
      name,
      viewType,
      config: config || {},
      filters: filters || [],
      sorts: sorts || [],
      visibleFields: visibleFields || [],
      groupBy,
      description,
      isDefault: isDefault || false,
      isFavorite: isFavorite || false,
    };

    const [created] = await db
      .insert(views)
      .values(newView)
      .returning();

    res.status(201).json({ view: created });
  } catch (error) {
    console.error('Error creating view:', error);
    res.status(500).json({ error: 'Failed to create view' });
  }
});

// Update view
router.patch('/views/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      const [view] = await db
        .select()
        .from(views)
        .where(eq(views.id, id));

      if (view) {
        await db
          .update(views)
          .set({ isDefault: false })
          .where(
            and(
              eq(views.userId, userId),
              eq(views.tableName, view.tableName),
              eq(views.isDefault, true)
            )
          );
      }
    }

    const [updated] = await db
      .update(views)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'View not found' });
    }

    res.json({ view: updated });
  } catch (error) {
    console.error('Error updating view:', error);
    res.status(500).json({ error: 'Failed to update view' });
  }
});

// Delete view
router.delete('/views/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const [deleted] = await db
      .delete(views)
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'View not found' });
    }

    res.json({ message: 'View deleted successfully' });
  } catch (error) {
    console.error('Error deleting view:', error);
    res.status(500).json({ error: 'Failed to delete view' });
  }
});

// Duplicate view
router.post('/views/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const [original] = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId)
        )
      );

    if (!original) {
      return res.status(404).json({ error: 'View not found' });
    }

    const newView: InsertView = {
      ...original,
      id: undefined as any, // Let DB generate new ID
      name: `${original.name} (Copy)`,
      isDefault: false,
      createdAt: undefined as any,
      updatedAt: undefined as any,
    };

    const [created] = await db
      .insert(views)
      .values(newView)
      .returning();

    res.status(201).json({ view: created });
  } catch (error) {
    console.error('Error duplicating view:', error);
    res.status(500).json({ error: 'Failed to duplicate view' });
  }
});

// ============================================
// VIEW SHARING
// ============================================

// Create share link
router.post('/views/:id/share', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const { permission, password, expiresIn } = req.body;

    // Verify view ownership
    const [view] = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId)
        )
      );

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Generate share token
    const shareToken = crypto.randomBytes(16).toString('hex');

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Calculate expiration
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    const newShare: InsertViewShare = {
      viewId: id,
      shareToken,
      permission: permission || 'view',
      passwordHash,
      expiresAt,
      createdBy: userId,
    };

    const [created] = await db
      .insert(viewShares)
      .values(newShare)
      .returning();

    res.status(201).json({
      share: created,
      shareUrl: `${process.env.APP_URL || 'http://localhost:4000'}/shared/${shareToken}`,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Access shared view
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const [share] = await db
      .select()
      .from(viewShares)
      .where(eq(viewShares.shareToken, token));

    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check password
    if (share.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requiresPassword: true });
      }

      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(password as string, share.passwordHash);

      if (!valid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get view
    const [view] = await db
      .select()
      .from(views)
      .where(eq(views.id, share.viewId));

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // Update access stats
    await db
      .update(viewShares)
      .set({
        viewCount: sql`${viewShares.viewCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(eq(viewShares.id, share.id));

    // Log access
    await db.insert(viewAccessLog).values({
      viewId: view.id,
      shareToken: token,
      accessType: 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch(() => {});

    res.json({
      view,
      permission: share.permission,
    });
  } catch (error) {
    console.error('Error accessing shared view:', error);
    res.status(500).json({ error: 'Failed to access shared view' });
  }
});

// Revoke share link
router.delete('/shares/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify ownership
    const [share] = await db
      .select()
      .from(viewShares)
      .where(eq(viewShares.id, id));

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.createdBy !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db
      .delete(viewShares)
      .where(eq(viewShares.id, id));

    res.json({ message: 'Share link revoked successfully' });
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

// ============================================
// VIEW DATA (with filters/sorts applied)
// ============================================

// Get view data
router.get('/views/:id/data', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const [view] = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.id, id),
          eq(views.userId, userId)
        )
      );

    if (!view) {
      return res.status(404).json({ error: 'View not found' });
    }

    // TODO: Implement dynamic query building based on view.filters, view.sorts
    // For now, return placeholder
    res.json({
      data: [],
      view: view,
      total: 0,
      message: 'View data endpoint - implementation pending',
    });
  } catch (error) {
    console.error('Error fetching view data:', error);
    res.status(500).json({ error: 'Failed to fetch view data' });
  }
});

export default router;
