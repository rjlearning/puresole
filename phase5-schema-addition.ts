// ============================================
// ADD THIS TO THE END OF shared/schema.ts
// Phase 5: Personalized Wellness Plans
// ============================================

// Wellness plans table
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
