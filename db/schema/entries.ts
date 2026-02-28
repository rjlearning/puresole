import { pgTable, uuid, integer, varchar, text, jsonb, timestamp, boolean, decimal, date, index, unique } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { sql } from 'drizzle-orm';

// Main flexible entries table
export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryType: varchar('entry_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  data: jsonb('data').notNull().default({}),
  moodScore: integer('mood_score'),
  energyLevel: integer('energy_level'),
  stressLevel: integer('stress_level'),
  tags: text('tags').array().default(sql`'{}'`),
  attachments: jsonb('attachments').default(sql`'[]'`),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('idx_entries_user_id').on(table.userId),
  entryTypeIdx: index('idx_entries_entry_type').on(table.entryType),
  recordedAtIdx: index('idx_entries_recorded_at').on(table.recordedAt),
  userTypeDateIdx: index('idx_entries_user_type_date').on(table.userId, table.entryType, table.recordedAt),
  deletedAtIdx: index('idx_entries_deleted_at').on(table.deletedAt),
}));

// Custom fields definition
export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  entryTypes: text('entry_types').array().default(sql`'{}'`),
  options: jsonb('options').default(sql`'[]'`),
  validation: jsonb('validation').default(sql`'{}'`),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_custom_fields_user_id').on(table.userId),
  uniqueUserField: unique('custom_fields_user_id_field_name_unique').on(table.userId, table.fieldName),
}));

// Insights and patterns
export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }).default('info'),
  data: jsonb('data').notNull().default({}),
  relatedEntryIds: uuid('related_entry_ids').array().default(sql`'{}'`),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('idx_insights_user_id').on(table.userId),
  statusIdx: index('idx_insights_status').on(table.status),
  typeIdx: index('idx_insights_type').on(table.insightType),
  createdAtIdx: index('idx_insights_created_at').on(table.createdAt),
}));

// Entry relationships
export const entryRelationships = pgTable('entry_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fromEntryId: uuid('from_entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  toEntryId: uuid('to_entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  strength: decimal('strength', { precision: 3, scale: 2 }),
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_relationships_user_id').on(table.userId),
  fromEntryIdx: index('idx_relationships_from_entry').on(table.fromEntryId),
  toEntryIdx: index('idx_relationships_to_entry').on(table.toEntryId),
  uniqueRelationship: unique('entry_relationships_from_to_type_unique').on(
    table.fromEntryId,
    table.toEntryId,
    table.relationshipType
  ),
}));

// Entry templates
export const entryTemplates = pgTable('entry_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  entryType: varchar('entry_type', { length: 50 }).notNull(),
  isGlobal: boolean('is_global').default(false),
  templateData: jsonb('template_data').notNull().default({}),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 50 }),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_templates_user_id').on(table.userId),
  entryTypeIdx: index('idx_templates_entry_type').on(table.entryType),
  globalIdx: index('idx_templates_global').on(table.isGlobal),
}));

// User goals
export const userGoals = pgTable('user_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  goalType: varchar('goal_type', { length: 50 }),
  targetMetric: varchar('target_metric', { length: 100 }),
  targetValue: decimal('target_value'),
  currentValue: decimal('current_value'),
  unit: varchar('unit', { length: 50 }),
  frequency: varchar('frequency', { length: 50 }),
  startDate: date('start_date').notNull(),
  targetDate: date('target_date'),
  status: varchar('status', { length: 20 }).default('active'),
  progressPercentage: integer('progress_percentage').default(0),
  relatedEntryTypes: text('related_entry_types').array().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('idx_goals_user_id').on(table.userId),
  statusIdx: index('idx_goals_status').on(table.status),
}));

// Type exports for use in API routes
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type CustomField = typeof customFields.$inferSelect;
export type NewCustomField = typeof customFields.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
export type EntryRelationship = typeof entryRelationships.$inferSelect;
export type NewEntryRelationship = typeof entryRelationships.$inferInsert;
export type EntryTemplate = typeof entryTemplates.$inferSelect;
export type NewEntryTemplate = typeof entryTemplates.$inferInsert;
export type UserGoal = typeof userGoals.$inferSelect;
export type NewUserGoal = typeof userGoals.$inferInsert;
