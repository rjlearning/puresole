import { Router } from 'express';
import { db } from '../db';
import {
  entries,
  customFields,
  entryTemplates,
  flexibleInsights,
  entryRelationships,
  type InsertEntry,
  type InsertCustomField,
  type InsertEntryTemplate
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql, inArray } from 'drizzle-orm';

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

const router = Router();

// ============================================
// ENTRIES CRUD
// ============================================

// Get all entries for current user
router.get('/entries', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      type,
      startDate,
      endDate,
      tags,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, userId),
          sql`${entries.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(entries.recordedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Apply filters
    const conditions = [eq(entries.userId, userId), sql`${entries.deletedAt} IS NULL`];

    if (type) {
      conditions.push(eq(entries.entryType, type as string));
    }

    if (startDate) {
      conditions.push(gte(entries.recordedAt, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(entries.recordedAt, new Date(endDate as string)));
    }

    const userEntries = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.recordedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Filter by tags if provided (JSONB array contains check)
    let filteredEntries = userEntries;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredEntries = userEntries.filter(entry => {
        const entryTags = Array.isArray(entry.tags) ? entry.tags : [];
        return tagArray.some(tag => entryTags.includes(tag as string));
      });
    }

    res.json({
      entries: filteredEntries,
      total: filteredEntries.length,
      hasMore: filteredEntries.length === Number(limit)
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Get single entry
router.get('/entries/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const [entry] = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.id, id),
          eq(entries.userId, userId),
          sql`${entries.deletedAt} IS NULL`
        )
      );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Create new entry
router.post('/entries', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      entryType,
      title,
      content,
      data,
      moodScore,
      energyLevel,
      stressLevel,
      tags,
      attachments,
      recordedAt
    } = req.body;

    const newEntry: InsertEntry = {
      userId,
      entryType,
      title,
      content,
      data: data || {},
      moodScore,
      energyLevel,
      stressLevel,
      tags: tags || [],
      attachments: attachments || [],
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    };

    const [created] = await db
      .insert(entries)
      .values(newEntry)
      .returning();

    res.status(201).json({ entry: created });
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Update entry
router.patch('/entries/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    const [updated] = await db
      .update(entries)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(entries.id, id),
          eq(entries.userId, userId),
          sql`${entries.deletedAt} IS NULL`
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ entry: updated });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Soft delete entry
router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const [deleted] = await db
      .update(entries)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(entries.id, id),
          eq(entries.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ============================================
// ENTRY TEMPLATES
// ============================================

// Get available templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    // Get both global and user's custom templates
    const allTemplates = await db
      .select()
      .from(entryTemplates)
      .where(
        sql`${entryTemplates.isGlobal} = true OR ${entryTemplates.userId} = ${userId}`
      )
      .orderBy(desc(entryTemplates.usageCount));

    res.json({ templates: allTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create custom template
router.post('/templates', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { name, description, entryType, templateData, icon, color } = req.body;

    const newTemplate: InsertEntryTemplate = {
      userId,
      name,
      description,
      entryType,
      templateData,
      icon,
      color,
      isGlobal: false,
    };

    const [created] = await db
      .insert(entryTemplates)
      .values(newTemplate)
      .returning();

    res.status(201).json({ template: created });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Use template (increment usage count)
router.post('/templates/:id/use', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .update(entryTemplates)
      .set({
        usageCount: sql`${entryTemplates.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(entryTemplates.id, id));

    res.json({ message: 'Template usage recorded' });
  } catch (error) {
    console.error('Error updating template usage:', error);
    res.status(500).json({ error: 'Failed to update template usage' });
  }
});

// ============================================
// CUSTOM FIELDS
// ============================================

// Get custom fields for user
router.get('/custom-fields', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    const fields = await db
      .select()
      .from(customFields)
      .where(eq(customFields.userId, userId))
      .orderBy(customFields.displayOrder);

    res.json({ fields });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// Create custom field
router.post('/custom-fields', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { fieldName, fieldType, entryTypes, options, validation, displayOrder } = req.body;

    const newField: InsertCustomField = {
      userId,
      fieldName,
      fieldType,
      entryTypes: entryTypes || [],
      options: options || [],
      validation: validation || {},
      displayOrder: displayOrder || 0,
    };

    const [created] = await db
      .insert(customFields)
      .values(newField)
      .returning();

    res.status(201).json({ field: created });
  } catch (error) {
    console.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// ============================================
// INSIGHTS & PATTERNS
// ============================================

// Get insights for user
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { status = 'active', limit = 20 } = req.query;

    const userInsights = await db
      .select()
      .from(flexibleInsights)
      .where(
        and(
          eq(flexibleInsights.userId, userId),
          eq(flexibleInsights.status, status as string)
        )
      )
      .orderBy(desc(flexibleInsights.createdAt))
      .limit(Number(limit));

    res.json({ insights: userInsights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Dismiss insight
router.post('/insights/:id/dismiss', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    await db
      .update(flexibleInsights)
      .set({
        status: 'dismissed',
        dismissedAt: new Date()
      })
      .where(
        and(
          eq(flexibleInsights.id, id),
          eq(flexibleInsights.userId, userId)
        )
      );

    res.json({ message: 'Insight dismissed' });
  } catch (error) {
    console.error('Error dismissing insight:', error);
    res.status(500).json({ error: 'Failed to dismiss insight' });
  }
});

// ============================================
// ANALYTICS
// ============================================

// Get entry statistics
router.get('/entries/stats/summary', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const userEntries = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.userId, userId),
          gte(entries.recordedAt, startDate),
          sql`${entries.deletedAt} IS NULL`
        )
      );

    // Calculate statistics
    const stats = {
      totalEntries: userEntries.length,
      byType: {} as Record<string, number>,
      avgMood: 0,
      avgEnergy: 0,
      avgStress: 0,
      mostUsedTags: [] as string[],
    };

    let moodSum = 0, moodCount = 0;
    let energySum = 0, energyCount = 0;
    let stressSum = 0, stressCount = 0;
    const tagCounts: Record<string, number> = {};

    userEntries.forEach(entry => {
      // Count by type
      stats.byType[entry.entryType] = (stats.byType[entry.entryType] || 0) + 1;

      // Sum scores
      if (entry.moodScore) { moodSum += entry.moodScore; moodCount++; }
      if (entry.energyLevel) { energySum += entry.energyLevel; energyCount++; }
      if (entry.stressLevel) { stressSum += entry.stressLevel; stressCount++; }

      // Count tags
      if (Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    stats.avgMood = moodCount > 0 ? Math.round(moodSum / moodCount) : 0;
    stats.avgEnergy = energyCount > 0 ? Math.round(energySum / energyCount) : 0;
    stats.avgStress = stressCount > 0 ? Math.round(stressSum / stressCount) : 0;

    // Get top 10 tags
    stats.mostUsedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching entry stats:', error);
    res.status(500).json({ error: 'Failed to fetch entry statistics' });
  }
});

export default router;
