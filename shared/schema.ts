import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
  serial,
  numeric,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Authentication provider enum
export const authProviderEnum = pgEnum('auth_provider', [
  'email',
  'google',
  'twitter'
]);

// User storage table with multi-auth support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"), // For email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  postpartumDeliveryDate: timestamp("postpartum_delivery_date"),
  postpartumDeliveryType: varchar("postpartum_delivery_type", { length: 50 }),
  isBreastfeeding: boolean("is_breastfeeding").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User authentication providers table
export const userAuthProviders = pgTable("user_auth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: authProviderEnum("provider").notNull(),
  providerId: varchar("provider_id").notNull(), // ID from the OAuth provider
  providerEmail: varchar("provider_email"), // Email from the provider
  accessToken: text("access_token"), // OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"), // When tokens expire
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint: one provider per user
  index("unique_user_provider").on(table.userId, table.provider),
  // Unique constraint: one provider ID per provider
  index("unique_provider_id").on(table.provider, table.providerId),
]);

// Assessment types enum
export const assessmentTypeEnum = pgEnum('assessment_type', [
  'phq9',
  'gad7',
  'stress_burnout',
  'ptsd',
  'sleep_quality',
  'comprehensive',
  'conversation_ai'
]);

// Assessment severity enum
export const severityEnum = pgEnum('severity', [
  'minimal',
  'mild',
  'moderate',
  'moderately_severe',
  'severe'
]);

// Conversation assessment status enum
export const conversationStatusEnum = pgEnum('conversation_status', [
  'in_progress',
  'completed',
  'abandoned'
]);

// Conversational assessments table - stores AI-driven chat sessions
export const conversationAssessments = pgTable("conversation_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: conversationStatusEnum("status").default('in_progress'),
  conversationTranscript: jsonb("conversation_transcript").notNull(), // Array of {role, content, timestamp, metadata}
  aiCheckpoints: jsonb("ai_checkpoints"), // Interim AI insights per turn
  summaryInsights: jsonb("summary_insights"), // Final AI analysis
  assessmentId: varchar("assessment_id").references((): any => assessments.id), // Link to final assessment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessments table
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: assessmentTypeEnum("type").notNull(),
  responses: jsonb("responses").notNull(), // Store assessment responses
  score: integer("score").default(0), // Made optional for AI-derived scores
  severity: severityEnum("severity").notNull(),
  aiAnalysis: text("ai_analysis"), // AI-generated analysis
  recommendations: jsonb("recommendations"), // AI recommendations
  riskFactors: jsonb("risk_factors"), // Identified risk factors
  conversationAssessmentId: varchar("conversation_assessment_id").references((): any => conversationAssessments.id), // Link to conversation
  createdAt: timestamp("created_at").defaultNow(),
});

// Treatment plan status enum
export const planStatusEnum = pgEnum('plan_status', [
  'active',
  'completed',
  'paused',
  'discontinued'
]);

// Treatment plans table
export const treatmentPlans = pgTable("treatment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: planStatusEnum("status").default('active'),
  totalWeeks: integer("total_weeks").notNull(),
  currentWeek: integer("current_week").default(1),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default('0'),
  modules: jsonb("modules").notNull(), // Course-like modules structure
  goals: jsonb("goals"), // Treatment goals
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Treatment plan modules table
export const treatmentModules = pgTable("treatment_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => treatmentPlans.id),
  title: varchar("title").notNull(),
  description: text("description"),
  week: integer("week").notNull(),
  order: integer("order").notNull(),
  content: jsonb("content").notNull(), // Lessons, exercises, activities
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progress tracking table
export const progressEntries = pgTable("progress_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").references(() => treatmentPlans.id),
  moduleId: varchar("module_id").references(() => treatmentModules.id),
  date: timestamp("date").notNull(),
  activityType: varchar("activity_type").notNull(), // 'exercise', 'lesson', 'journal', etc.
  activityName: varchar("activity_name").notNull(),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  moodRating: integer("mood_rating"), // 1-10 scale
  anxietyLevel: integer("anxiety_level"), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
});

// Crisis alerts table
export const crisisAlerts = pgTable("crisis_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  alertType: varchar("alert_type").notNull(), // 'suicide_risk', 'self_harm', 'crisis'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  description: text("description").notNull(),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plan intervals enum
export const planIntervalEnum = pgEnum('plan_interval', [
  'monthly',
  'quarterly',
  'yearly'
]);

// Voice Analysis Background Jobs table
export const analysisJobs = pgTable("analysis_jobs", {
  id: serial("id").primaryKey(),
  entryId: varchar("entry_id").notNull().references(() => voiceEntries.id),
  status: varchar("status").notNull(), // 'processing', 'completed', 'failed'
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emotional Blueprints table for daily summaries
export const emotionalBlueprints = pgTable("emotional_blueprints", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date", { mode: "string" }).notNull(), // using timestamp mode string for dates
  stressScore: numeric("stress_score").default('50'),
  anxietyScore: numeric("anxiety_score").default('40'),
  moodScore: numeric("mood_score").default('60'),
  energyLevel: numeric("energy_level").default('50'),
  sleepQuality: numeric("sleep_quality").default('75'),
  detectedEmotions: jsonb("detected_emotions").default('[]'),
  insights: jsonb("insights").default('[]'),
  wellnessScore: numeric("wellness_score").default('60'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plan types enum
export const planTypeEnum = pgEnum('plan_type', [
  'basic',
  'premium',
  'professional',
  'enterprise'
]);

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: planTypeEnum("type").notNull(),
  interval: planIntervalEnum("interval").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  stripePriceId: varchar("stripe_price_id").unique().notNull(),
  stripeProductId: varchar("stripe_product_id").notNull(),
  features: jsonb("features").notNull(), // Array of features
  assessmentsPerMonth: integer("assessments_per_month").default(-1), // -1 for unlimited
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'past_due',
  'canceled',
  'unpaid',
  'trialing'
]);

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique().notNull(),
  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
  'partially_refunded'
]);

// Payment type enum
export const paymentTypeEnum = pgEnum('payment_type', [
  'subscription',
  'one_time',
  'refund'
]);

// Payments table for audit and tracking
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => userSubscriptions.id),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional payment data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial audit log for compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: varchar("entity_type").notNull(), // 'payment', 'subscription', 'user', etc.
  entityId: varchar("entity_id").notNull(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'cancel', etc.
  oldValues: jsonb("old_values"), // Previous state
  newValues: jsonb("new_values"), // New state
  metadata: jsonb("metadata"), // Additional context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for subscription limits
export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => userSubscriptions.id),
  metricType: varchar("metric_type").notNull(), // 'assessment', 'treatment_plan', 'ai_analysis'
  count: integer("count").default(1),
  period: varchar("period").notNull(), // 'daily', 'monthly', 'yearly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  assessments: many(assessments),
  treatmentPlans: many(treatmentPlans),
  progressEntries: many(progressEntries),
  crisisAlerts: many(crisisAlerts),
  subscriptions: many(userSubscriptions),
  payments: many(payments),
  usageMetrics: many(usageMetrics),
  auditLogs: many(auditLogs),
  biomarkerResults: many(biomarkerResults),
  wearableDataPoints: many(wearableDataPoints),
  mealPlans: many(mealPlans),
  supplementProtocols: many(supplementProtocols),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  treatmentPlans: many(treatmentPlans),
  crisisAlerts: many(crisisAlerts),
}));

export const treatmentPlansRelations = relations(treatmentPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [treatmentPlans.userId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [treatmentPlans.assessmentId],
    references: [assessments.id],
  }),
  modules: many(treatmentModules),
  progressEntries: many(progressEntries),
}));

export const treatmentModulesRelations = relations(treatmentModules, ({ one, many }) => ({
  plan: one(treatmentPlans, {
    fields: [treatmentModules.planId],
    references: [treatmentPlans.id],
  }),
  progressEntries: many(progressEntries),
}));

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, {
    fields: [progressEntries.userId],
    references: [users.id],
  }),
  plan: one(treatmentPlans, {
    fields: [progressEntries.planId],
    references: [treatmentPlans.id],
  }),
  module: one(treatmentModules, {
    fields: [progressEntries.moduleId],
    references: [treatmentModules.id],
  }),
}));

export const crisisAlertsRelations = relations(crisisAlerts, ({ one }) => ({
  user: one(users, {
    fields: [crisisAlerts.userId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [crisisAlerts.assessmentId],
    references: [assessments.id],
  }),
  resolvedByUser: one(users, {
    fields: [crisisAlerts.resolvedBy],
    references: [users.id],
  }),
}));

// Subscription relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  userSubscriptions: many(userSubscriptions),
  payments: many(payments),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments),
  usageMetrics: many(usageMetrics),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [payments.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  user: one(users, {
    fields: [usageMetrics.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [usageMetrics.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertTreatmentPlanSchema = createInsertSchema(treatmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTreatmentModuleSchema = createInsertSchema(treatmentModules).omit({
  id: true,
  createdAt: true,
});

export const insertProgressEntrySchema = createInsertSchema(progressEntries).omit({
  id: true,
  createdAt: true,
});

export const insertCrisisAlertSchema = createInsertSchema(crisisAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertConversationAssessmentSchema = createInsertSchema(conversationAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Subscription insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
});

// Auth provider insert schemas
export const insertUserAuthProviderSchema = createInsertSchema(userAuthProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull(),
  description: text("description").notNull(),
  status: varchar("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type InsertUserAuthProvider = z.infer<typeof insertUserAuthProviderSchema>;
export type UserAuthProvider = typeof userAuthProviders.$inferSelect;

export type InsertConversationAssessment = z.infer<typeof insertConversationAssessmentSchema>;
export type ConversationAssessment = typeof conversationAssessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertTreatmentPlan = z.infer<typeof insertTreatmentPlanSchema>;
export type TreatmentPlan = typeof treatmentPlans.$inferSelect;
export type InsertTreatmentModule = z.infer<typeof insertTreatmentModuleSchema>;
export type TreatmentModule = typeof treatmentModules.$inferSelect;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertCrisisAlert = z.infer<typeof insertCrisisAlertSchema>;
export type CrisisAlert = typeof crisisAlerts.$inferSelect;

// Subscription types
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;
export type UsageMetric = typeof usageMetrics.$inferSelect;

// Voice journal entries table
export const voiceEntries = pgTable("voice_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Audio file information
  audioUrl: varchar("audio_url"),
  duration: integer("duration"),
  fileSize: integer("file_size"),

  // Transcription (from Whisper API)
  transcript: text("transcript"),
  transcription: text("transcription"),

  // User's self-reported data
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
  notes: text("notes"),

  // Analysis results (will be populated later)
  aiAnalysis: jsonb("ai_analysis"),
  emotionData: jsonb("emotion_data"),
  prosodyData: jsonb("prosody_data"),
  crisisAssessment: jsonb("crisis_assessment"),
  stressLevel: integer("stress_level"),
  energyLevel: integer("energy_level"),

  // Metadata
  recordedAt: timestamp("recorded_at").defaultNow(),
  analyzedAt: timestamp("analyzed_at"),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detailed medical-grade voice analyses
export const voiceAnalyses = pgTable("voice_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  journalEntryId: varchar("journal_entry_id").references(() => voiceEntries.id, { onDelete: "cascade" }),
  primaryEmotion: varchar("primary_emotion"),
  stressIndicators: jsonb("stress_indicators").default(sql`'{}'::jsonb`),
  wellnessScore: integer("wellness_score"),
  valence: numeric("valence"),
  arousal: numeric("arousal"),
  dominance: numeric("dominance"),
  riskLevel: varchar("risk_level"), // 'low', 'medium', 'high'
  emotionScores: jsonb("emotion_scores").default(sql`'{}'::jsonb`),
  emotionConfidence: numeric("emotion_confidence"),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice entries relations
export const voiceEntriesRelations = relations(voiceEntries, ({ one }) => ({
  user: one(users, {
    fields: [voiceEntries.userId],
    references: [users.id],
  }),
}));

// Zod schema for inserting voice entries
export const insertVoiceEntrySchema = createInsertSchema(voiceEntries, {
  duration: z.number().min(1).max(600),
  moodBefore: z.number().min(1).max(10).optional(),
  moodAfter: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

export type VoiceEntry = typeof voiceEntries.$inferSelect;
export type InsertVoiceEntry = z.infer<typeof insertVoiceEntrySchema>;

export const wellnessPlans = pgTable("wellness_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  planType: varchar("plan_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  targetDate: timestamp("target_date").notNull(),
  generatedBy: varchar("generated_by", { length: 50 }).default('ai'),

  reasoning: text("reasoning"),
  priorityFocus: varchar("priority_focus", { length: 100 }),

  baselineMoodScore: integer("baseline_mood_score"),
  baselineStressLevel: integer("baseline_stress_level"),
  baselineEnergyLevel: integer("baseline_energy_level"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const planItems = pgTable("plan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => wellnessPlans.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  itemType: varchar("item_type", { length: 50 }).notNull(),

  activityId: varchar("activity_id"),

  scheduledTime: varchar("scheduled_time", { length: 5 }),
  estimatedDuration: integer("estimated_duration"),
  displayOrder: integer("display_order").default(0),

  status: varchar("status", { length: 50 }).notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  effectivenessRating: integer("effectiveness_rating"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goalType: varchar("goal_type", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }),

  targetMetric: varchar("target_metric", { length: 100 }),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).default('0'),
  unit: varchar("unit", { length: 50 }),

  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),

  status: varchar("status", { length: 50 }).notNull().default('active'),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default('0'),

  whyImportant: text("why_important"),
  reward: text("reward"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const goalProgress = pgTable("goal_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => userGoals.id, { onDelete: "cascade" }),

  recordedAt: timestamp("recorded_at").defaultNow(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),

  note: text("note"),
  moodAtRecording: integer("mood_at_recording"),
});

export const wellnessInsights = pgTable("wellness_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  insightType: varchar("insight_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  dataSource: varchar("data_source", { length: 50 }),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),

  isActionable: boolean("is_actionable").default(false),
  recommendedAction: text("recommended_action"),
  priority: varchar("priority", { length: 20 }).default('medium'),

  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),

  relevantFrom: timestamp("relevant_from").defaultNow(),
  relevantUntil: timestamp("relevant_until"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  activityId: varchar("activity_id"),

  reasoning: text("reasoning"),
  expectedBenefit: text("expected_benefit"),

  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  basedOn: jsonb("based_on").$type<string[]>(),

  status: varchar("status", { length: 50 }).default('pending'),
  userFeedback: text("user_feedback"),

  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
});

// Relations
export const wellnessPlansRelations = relations(wellnessPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [wellnessPlans.userId],
    references: [users.id],
  }),
  items: many(planItems),
}));

export const planItemsRelations = relations(planItems, ({ one }) => ({
  plan: one(wellnessPlans, {
    fields: [planItems.planId],
    references: [wellnessPlans.id],
  }),
}));

export const userGoalsRelations = relations(userGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
  progress: many(goalProgress),
}));

export const goalProgressRelations = relations(goalProgress, ({ one }) => ({
  goal: one(userGoals, {
    fields: [goalProgress.goalId],
    references: [userGoals.id],
  }),
}));

export const wellnessInsightsRelations = relations(wellnessInsights, ({ one }) => ({
  user: one(users, {
    fields: [wellnessInsights.userId],
    references: [users.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, {
    fields: [recommendations.userId],
    references: [users.id],
  }),
}));

// Types
export type WellnessPlan = typeof wellnessPlans.$inferSelect;
export type InsertWellnessPlan = typeof wellnessPlans.$inferInsert;
export type PlanItem = typeof planItems.$inferSelect;
export type InsertPlanItem = typeof planItems.$inferInsert;
export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;
export type GoalProgress = typeof goalProgress.$inferSelect;
export type InsertGoalProgress = typeof goalProgress.$inferInsert;
export type WellnessInsight = typeof wellnessInsights.$inferSelect;
export type InsertWellnessInsight = typeof wellnessInsights.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

// ============================================
// PHASE 3: Wellness Activities & Stats
// ============================================

export const wellnessActivities = pgTable("wellness_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).default('beginner'),
  duration: integer("duration").notNull(),
  instructions: text("instructions").notNull(),
  benefits: text("benefits"),
  iconEmoji: varchar("icon_emoji", { length: 10 }).default('🧘'),
  gradientClass: varchar("gradient_class", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivityCompletions = pgTable("user_activity_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityId: varchar("activity_id").notNull().references(() => wellnessActivities.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
  durationActual: integer("duration_actual"),
  effectivenessRating: integer("effectiveness_rating"),
  notes: text("notes"),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  badgeEmoji: varchar("badge_emoji", { length: 10 }).default('🏆'),
  points: integer("points").default(0),
  tier: varchar("tier", { length: 20 }).default('bronze'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
}, (table) => [
  index("idx_user_achievements_unique").on(table.userId, table.achievementId),
]);

export const userStats = pgTable("user_stats", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalActivities: integer("total_activities").default(0),
  totalVoiceEntries: integer("total_voice_entries").default(0),
  level: integer("level").default(1),
  experiencePoints: integer("experience_points").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// PHASE 6: THERAPIST BRIDGE & CRISIS SUPPORT
// ============================================

// Crisis Resources Table
export const crisisResources = pgTable("crisis_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  region: varchar("region", { length: 100 }),

  resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'hotline', 'text', 'chat', 'emergency'
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  phone: varchar("phone", { length: 50 }),
  smsNumber: varchar("sms_number", { length: 50 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  chatUrl: varchar("chat_url", { length: 500 }),

  available247: boolean("available_24_7").default(false),
  languages: jsonb("languages"),

  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_crisis_resources_country").on(table.countryCode, table.isActive),
  index("idx_crisis_resources_type").on(table.resourceType),
]);

// Safety Plans Table
export const safetyPlans = pgTable("safety_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  warningSigns: jsonb("warning_signs"), // List of personal warning signs
  copingStrategies: jsonb("coping_strategies"), // Internal coping methods
  distractionActivities: jsonb("distraction_activities"), // Things that help distract

  supportContacts: jsonb("support_contacts"), // [{name, phone, relationship}]
  professionalContacts: jsonb("professional_contacts"), // Therapist, doctor contacts

  safeEnvironmentSteps: jsonb("safe_environment_steps"), // How to make environment safe
  reasonsToLive: jsonb("reasons_to_live"), // Personal reasons for living

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_safety_plans_user").on(table.userId),
]);

// Relations
export const safetyPlansRelations = relations(safetyPlans, ({ one }) => ({
  user: one(users, {
    fields: [safetyPlans.userId],
    references: [users.id],
  }),
}));

// Types
export type CrisisResource = typeof crisisResources.$inferSelect;
export type InsertCrisisResource = typeof crisisResources.$inferInsert;
export type SafetyPlan = typeof safetyPlans.$inferSelect;
export type InsertSafetyPlan = typeof safetyPlans.$inferInsert;

// ============================================
// WELLNESS REPORTS (Phase 6 Week 2)
// ============================================

export const wellnessReports = pgTable("wellness_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Report Metadata
  title: varchar("title", { length: 255 }).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // 'weekly', 'monthly', 'custom', 'therapist'

  // Date Range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),

  // Report Data
  data: jsonb("data").notNull(), // Aggregated metrics
  summary: text("summary"),
  keyInsights: jsonb("key_insights"),

  // File & Sharing
  pdfUrl: varchar("pdf_url", { length: 500 }),
  pdfSize: integer("pdf_size"),
  shareCode: varchar("share_code", { length: 50 }),
  shareExpiresAt: timestamp("share_expires_at"),

  // Access Tracking
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  downloadedCount: integer("downloaded_count").default(0),
  lastDownloadedAt: timestamp("last_downloaded_at"),

  // Status
  status: varchar("status", { length: 50 }).default('draft'), // 'draft', 'generating', 'ready', 'shared', 'archived'
  generationError: text("generation_error"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wellness_reports_user").on(table.userId, table.createdAt),
  index("idx_wellness_reports_share_code").on(table.shareCode),
  index("idx_wellness_reports_status").on(table.status),
  index("idx_wellness_reports_date_range").on(table.userId, table.startDate, table.endDate),
]);

export const reportAccessLogs = pgTable("report_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => wellnessReports.id, { onDelete: "cascade" }),

  accessType: varchar("access_type", { length: 50 }).notNull(), // 'view', 'download', 'share'
  accessorType: varchar("accessor_type", { length: 50 }), // 'user', 'therapist', 'public', 'anonymous'
  accessorId: varchar("accessor_id"),

  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),

  accessedAt: timestamp("accessed_at").defaultNow(),
}, (table) => [
  index("idx_report_access_logs_report").on(table.reportId, table.accessedAt),
]);

export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  reportType: varchar("report_type", { length: 50 }).notNull(),

  sections: jsonb("sections").notNull(),
  defaultDateRange: integer("default_date_range"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const wellnessReportsRelations = relations(wellnessReports, ({ one, many }) => ({
  user: one(users, {
    fields: [wellnessReports.userId],
    references: [users.id],
  }),
  accessLogs: many(reportAccessLogs),
}));

export const reportAccessLogsRelations = relations(reportAccessLogs, ({ one }) => ({
  report: one(wellnessReports, {
    fields: [reportAccessLogs.reportId],
    references: [wellnessReports.id],
  }),
}));

// Types
export type WellnessReport = typeof wellnessReports.$inferSelect;
export type InsertWellnessReport = typeof wellnessReports.$inferInsert;
export type ReportAccessLog = typeof reportAccessLogs.$inferSelect;
export type InsertReportAccessLog = typeof reportAccessLogs.$inferInsert;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

// ============================================
// PHASE 7: FLEXIBLE ENTRY SYSTEM (Airtable-inspired)
// ============================================

// Main flexible entries table with JSONB data
export const entries = pgTable('entries', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryType: varchar('entry_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
  moodScore: integer('mood_score'),
  energyLevel: integer('energy_level'),
  stressLevel: integer('stress_level'),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_entries_user_id').on(table.userId),
  index('idx_entries_entry_type').on(table.entryType),
  index('idx_entries_recorded_at').on(table.recordedAt),
  index('idx_entries_user_type_date').on(table.userId, table.entryType, table.recordedAt),
  index('idx_entries_deleted_at').on(table.deletedAt),
]);

// Custom fields definition
export const customFields = pgTable('custom_fields', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  entryTypes: jsonb('entry_types').$type<string[]>().default(sql`'[]'::jsonb`),
  options: jsonb('options').default(sql`'[]'::jsonb`),
  validation: jsonb('validation').default(sql`'{}'::jsonb`),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_custom_fields_user_id').on(table.userId),
]);

// Insights and patterns (extends existing insights functionality)
export const flexibleInsights = pgTable('flexible_insights', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }).default('info'),
  data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
  relatedEntryIds: jsonb('related_entry_ids').$type<string[]>().default(sql`'[]'::jsonb`),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('idx_flexible_insights_user_id').on(table.userId),
  index('idx_flexible_insights_status').on(table.status),
  index('idx_flexible_insights_type').on(table.insightType),
  index('idx_flexible_insights_created_at').on(table.createdAt),
]);

// Entry relationships
export const entryRelationships = pgTable('entry_relationships', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fromEntryId: varchar('from_entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  toEntryId: varchar('to_entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  strength: decimal('strength', { precision: 3, scale: 2 }),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_relationships_user_id').on(table.userId),
  index('idx_relationships_from_entry').on(table.fromEntryId),
  index('idx_relationships_to_entry').on(table.toEntryId),
]);

// Entry templates
export const entryTemplates = pgTable('entry_templates', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  entryType: varchar('entry_type', { length: 50 }).notNull(),
  isGlobal: boolean('is_global').default(false),
  templateData: jsonb('template_data').notNull().default(sql`'{}'::jsonb`),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 50 }),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_templates_user_id').on(table.userId),
  index('idx_templates_entry_type').on(table.entryType),
  index('idx_templates_global').on(table.isGlobal),
]);

// Relations for flexible entries
export const entriesRelations = relations(entries, ({ one, many }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
  relationshipsFrom: many(entryRelationships, { relationName: 'from' }),
  relationshipsTo: many(entryRelationships, { relationName: 'to' }),
}));

export const customFieldsRelations = relations(customFields, ({ one }) => ({
  user: one(users, {
    fields: [customFields.userId],
    references: [users.id],
  }),
}));

export const flexibleInsightsRelations = relations(flexibleInsights, ({ one }) => ({
  user: one(users, {
    fields: [flexibleInsights.userId],
    references: [users.id],
  }),
}));

export const entryRelationshipsRelations = relations(entryRelationships, ({ one }) => ({
  user: one(users, {
    fields: [entryRelationships.userId],
    references: [users.id],
  }),
  fromEntry: one(entries, {
    fields: [entryRelationships.fromEntryId],
    references: [entries.id],
    relationName: 'from',
  }),
  toEntry: one(entries, {
    fields: [entryRelationships.toEntryId],
    references: [entries.id],
    relationName: 'to',
  }),
}));

export const entryTemplatesRelations = relations(entryTemplates, ({ one }) => ({
  user: one(users, {
    fields: [entryTemplates.userId],
    references: [users.id],
  }),
}));

// Types
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = typeof entries.$inferInsert;
export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = typeof customFields.$inferInsert;
export type FlexibleInsight = typeof flexibleInsights.$inferSelect;
export type InsertFlexibleInsight = typeof flexibleInsights.$inferInsert;
export type EntryRelationship = typeof entryRelationships.$inferSelect;
export type InsertEntryRelationship = typeof entryRelationships.$inferInsert;
export type EntryTemplate = typeof entryTemplates.$inferSelect;
export type InsertEntryTemplate = typeof entryTemplates.$inferInsert;

// ============================================
// PHASE 8: VIEWS SYSTEM (Airtable Multi-View)
// ============================================

// Views configuration
export const views = pgTable('views', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tableName: varchar('table_name', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  viewType: varchar('view_type', { length: 20 }).notNull(),
  config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
  filters: jsonb('filters').default(sql`'[]'::jsonb`),
  sorts: jsonb('sorts').default(sql`'[]'::jsonb`),
  visibleFields: jsonb('visible_fields').default(sql`'[]'::jsonb`),
  groupBy: varchar('group_by', { length: 100 }),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isFavorite: boolean('is_favorite').default(false),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_views_user_id').on(table.userId),
  index('idx_views_table_name').on(table.tableName),
  index('idx_views_user_table').on(table.userId, table.tableName),
]);

// View sharing
export const viewShares = pgTable('view_shares', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  viewId: varchar('view_id').notNull().references(() => views.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 32 }).notNull().unique(),
  permission: varchar('permission', { length: 10 }).default('view'),
  passwordHash: varchar('password_hash', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  viewCount: integer('view_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar('created_by').notNull().references(() => users.id),
}, (table) => [
  index('idx_view_shares_token').on(table.shareToken),
  index('idx_view_shares_view_id').on(table.viewId),
]);

// Field metadata
export const fieldMetadata = pgTable('field_metadata', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  fieldId: varchar('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }).unique(),
  width: integer('width').default(150),
  isFrozen: boolean('is_frozen').default(false),
  isHidden: boolean('is_hidden').default(false),
  description: text('description'),
  formula: text('formula'),
  formulaType: varchar('formula_type', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_field_metadata_field_id').on(table.fieldId),
]);

// View access log
export const viewAccessLog = pgTable('view_access_log', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  viewId: varchar('view_id').notNull().references(() => views.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'set null' }),
  shareToken: varchar('share_token', { length: 32 }),
  accessType: varchar('access_type', { length: 20 }).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_view_access_view_id').on(table.viewId, table.accessedAt),
  index('idx_view_access_user_id').on(table.userId, table.accessedAt),
]);

// Relations
export const viewsRelations = relations(views, ({ one, many }) => ({
  user: one(users, {
    fields: [views.userId],
    references: [users.id],
  }),
  shares: many(viewShares),
  accessLogs: many(viewAccessLog),
}));

export const viewSharesRelations = relations(viewShares, ({ one }) => ({
  view: one(views, {
    fields: [viewShares.viewId],
    references: [views.id],
  }),
  creator: one(users, {
    fields: [viewShares.createdBy],
    references: [users.id],
  }),
}));

export const fieldMetadataRelations = relations(fieldMetadata, ({ one }) => ({
  field: one(customFields, {
    fields: [fieldMetadata.fieldId],
    references: [customFields.id],
  }),
}));

export const viewAccessLogRelations = relations(viewAccessLog, ({ one }) => ({
  view: one(views, {
    fields: [viewAccessLog.viewId],
    references: [views.id],
  }),
  user: one(users, {
    fields: [viewAccessLog.userId],
    references: [users.id],
  }),
}));

// Types
export type View = typeof views.$inferSelect;
export type InsertView = typeof views.$inferInsert;
export type ViewShare = typeof viewShares.$inferSelect;
export type InsertViewShare = typeof viewShares.$inferInsert;
export type FieldMetadata = typeof fieldMetadata.$inferSelect;
export type InsertFieldMetadata = typeof fieldMetadata.$inferInsert;
export type ViewAccessLog = typeof viewAccessLog.$inferSelect;
export type InsertViewAccessLog = typeof viewAccessLog.$inferInsert;

// ============================================
// PHASE 9: REAL-TIME VOICE SESSIONS
// ============================================

export const realtimeSessionStatusEnum = pgEnum('realtime_session_status', [
  'active',
  'completed',
  'interrupted'
]);

export const voiceRealtimeSessions = pgTable("voice_realtime_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),

  status: realtimeSessionStatusEnum("status").default('active').notNull(),
  totalChunksProcessed: integer("total_chunks_processed").default(0),

  emotionsDetected: jsonb("emotions_detected").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceRealtimeSessionsRelations = relations(voiceRealtimeSessions, ({ one }) => ({
  user: one(users, {
    fields: [voiceRealtimeSessions.userId],
    references: [users.id],
  }),
}));

export type VoiceRealtimeSession = typeof voiceRealtimeSessions.$inferSelect;
export type InsertVoiceRealtimeSession = typeof voiceRealtimeSessions.$inferInsert;


// ============================================
// ============================================
// PHASE 10: PRECISION POSTPARTUM
// ============================================

export const biomarkerResults = pgTable("biomarker_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  biomarkerType: varchar("biomarker_type", { length: 100 }).notNull(), // e.g., 'ferritin', 'vitamin_d', 'tsh'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  referenceRange: varchar("reference_range", { length: 100 }),
  testedAt: timestamp("tested_at").notNull(),
  source: varchar("source", { length: 100 }), // e.g., 'manual', 'quest', 'labcorp'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wearableDataPoints = pgTable("wearable_data_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'hrv', 'sleep_hours', 'resting_heart_rate', 'activity_score'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").notNull(),
  provider: varchar("provider", { length: 50 }), // 'apple_health', 'oura', 'whoop'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  breakfast: text("breakfast"),
  lunch: text("lunch"),
  dinner: text("dinner"),
  snacks: text("snacks"),
  targetCalories: integer("target_calories"),
  targetProteinGrams: integer("target_protein_grams"),
  targetCarbGrams: integer("target_carb_grams"),
  targetFatGrams: integer("target_fat_grams"),
  breastfeedingAdjustment: boolean("breastfeeding_adjustment").default(false),
  adaptiveFactors: jsonb("adaptive_factors"), // insights from wearables that triggered this plan
  recoverySteps: jsonb("recovery_steps").$type<string[]>().default(sql`'[]'::jsonb`),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplementProtocols = pgTable("supplement_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supplementName: varchar("supplement_name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  notes: text("notes"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const biomarkerResultsRelations = relations(biomarkerResults, ({ one }) => ({
  user: one(users, { fields: [biomarkerResults.userId], references: [users.id] }),
}));

export const wearableDataPointsRelations = relations(wearableDataPoints, ({ one }) => ({
  user: one(users, { fields: [wearableDataPoints.userId], references: [users.id] }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, { fields: [mealPlans.userId], references: [users.id] }),
}));

export const supplementProtocolsRelations = relations(supplementProtocols, ({ one }) => ({
  user: one(users, { fields: [supplementProtocols.userId], references: [users.id] }),
}));

// Insert schemas
export const insertBiomarkerResultSchema = createInsertSchema(biomarkerResults).omit({ id: true, createdAt: true });
export const insertWearableDataPointSchema = createInsertSchema(wearableDataPoints).omit({ id: true, createdAt: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true, createdAt: true });
export const insertSupplementProtocolSchema = createInsertSchema(supplementProtocols).omit({ id: true, createdAt: true });

// Types
export type BiomarkerResult = typeof biomarkerResults.$inferSelect;
export type InsertBiomarkerResult = z.infer<typeof insertBiomarkerResultSchema>;
export type WearableDataPoint = typeof wearableDataPoints.$inferSelect;
export type InsertWearableDataPoint = z.infer<typeof insertWearableDataPointSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type SupplementProtocol = typeof supplementProtocols.$inferSelect;
export type InsertSupplementProtocol = z.infer<typeof insertSupplementProtocolSchema>;

// ============================================
// AI COMPANION TABLES
// ============================================

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default('New Conversation'),
  moodBefore: varchar("mood_before", { length: 50 }),
  moodAfter: varchar("mood_after", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  emotionDetected: varchar("emotion_detected", { length: 50 }),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationInsights = pgTable("conversation_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  insightType: varchar("insight_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiCompanionSettings = pgTable("ai_companion_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  personality: varchar("personality", { length: 50 }).default('empathetic'),
  responseLength: varchar("response_length", { length: 20 }).default('balanced'),
  crisisMonitoring: boolean("crisis_monitoring").default(true),
  proactiveCheckIns: boolean("proactive_check_ins").default(false),
  preferredTopics: text("preferred_topics").array(),
  avoidedTopics: text("avoided_topics").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, { fields: [chatConversations.userId], references: [users.id] }),
  messages: many(chatMessages),
  insights: many(conversationInsights),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, { fields: [chatMessages.conversationId], references: [chatConversations.id] }),
}));

export const conversationInsightsRelations = relations(conversationInsights, ({ one }) => ({
  conversation: one(chatConversations, { fields: [conversationInsights.conversationId], references: [chatConversations.id] }),
}));

export const aiCompanionSettingsRelations = relations(aiCompanionSettings, ({ one }) => ({
  user: one(users, { fields: [aiCompanionSettings.userId], references: [users.id] }),
}));
// End of AI COMPANION TABLES
// Add to existing users relations
// (Handled by making sure these are defined and standard relations pattern)


