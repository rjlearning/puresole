# Fix Database Setup for Phase 5

## The Problem

You're using **Drizzle ORM** which defines tables in `shared/schema.ts`, but the Phase 5 migration expects raw SQL. We need to create the base tables first, then add Phase 5 tables.

## Solution: 2-Step Process

### Step 1: Create Base Tables with Drizzle

Run this command to sync your schema.ts with the database:

```bash
cd ~/Downloads/PURESOUL

# Push Drizzle schema to database
npx drizzle-kit push
```

This will create all the tables defined in `shared/schema.ts` including:
- users
- sessions
- assessments
- voiceEntries
- etc.

### Step 2: Add Phase 5 Tables to Schema

Instead of using the SQL migration, let's add the Phase 5 tables to your Drizzle schema. Add this to the **end** of `shared/schema.ts`:

```typescript
// ============================================
// Phase 5: Personalized Wellness Plans
// ============================================

// Wellness plans table
export const wellnessPlans = pgTable("wellness_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  planType: varchar("plan_type", { length: 50 }).notNull(), // 'daily', 'weekly', 'custom'
  status: varchar("status", { length: 50 }).notNull().default('active'), // 'active', 'completed', 'skipped', 'archived'
  targetDate: timestamp("target_date").notNull(),
  generatedBy: varchar("generated_by", { length: 50 }).default('ai'), // 'ai', 'user', 'therapist'

  // AI reasoning
  reasoning: text("reasoning"),
  priorityFocus: varchar("priority_focus", { length: 100 }),

  // Baseline metrics
  baselineMoodScore: integer("baseline_mood_score"),
  baselineStressLevel: integer("baseline_stress_level"),
  baselineEnergyLevel: integer("baseline_energy_level"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Plan items table
export const planItems = pgTable("plan_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => wellnessPlans.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'activity', 'reminder', 'reflection', 'custom'

  activityId: varchar("activity_id"), // Optional reference to wellness_activities

  scheduledTime: varchar("scheduled_time", { length: 5 }), // HH:MM format
  estimatedDuration: integer("estimated_duration"), // minutes
  displayOrder: integer("display_order").default(0),

  status: varchar("status", { length: 50 }).notNull().default('pending'), // 'pending', 'completed', 'skipped'
  completedAt: timestamp("completed_at"),
  effectivenessRating: integer("effectiveness_rating"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User goals table
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goalType: varchar("goal_type", { length: 50 }).notNull(), // 'habit', 'milestone', 'metric', 'challenge'
  category: varchar("category", { length: 50 }), // 'mental_health', 'sleep', 'exercise', 'mindfulness', 'social', 'other'

  targetMetric: varchar("target_metric", { length: 100 }),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).default('0'),
  unit: varchar("unit", { length: 50 }),

  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),

  status: varchar("status", { length: 50 }).notNull().default('active'), // 'active', 'completed', 'abandoned', 'paused'
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default('0'),

  whyImportant: text("why_important"),
  reward: text("reward"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Goal progress table
export const goalProgress = pgTable("goal_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => userGoals.id, { onDelete: "cascade" }),

  recordedAt: timestamp("recorded_at").defaultNow(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),

  note: text("note"),
  moodAtRecording: integer("mood_at_recording"),
});

// Wellness insights table
export const wellnessInsights = pgTable("wellness_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  insightType: varchar("insight_type", { length: 50 }).notNull(), // 'pattern', 'achievement', 'warning', 'suggestion'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  dataSource: varchar("data_source", { length: 50 }), // 'voice_entries', 'activities', 'mood_tracking', 'goals', 'combined'
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),

  isActionable: boolean("is_actionable").default(false),
  recommendedAction: text("recommended_action"),
  priority: varchar("priority", { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'urgent'

  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),

  relevantFrom: timestamp("relevant_from").defaultNow(),
  relevantUntil: timestamp("relevant_until"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Recommendations table
export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // 'activity', 'habit', 'resource', 'goal'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),

  activityId: varchar("activity_id"), // Optional reference

  reasoning: text("reasoning"),
  expectedBenefit: text("expected_benefit"),

  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  basedOn: jsonb("based_on").$type<string[]>(),

  status: varchar("status", { length: 50 }).default('pending'), // 'pending', 'accepted', 'declined', 'completed'
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
```

### Step 3: Push Updated Schema

```bash
# Push the updated schema to database
npx drizzle-kit push
```

This will create the 6 new Phase 5 tables.

### Step 4: Add Routes to Server

Now add the routes. Open `server/index.ts` and add these imports **near the top** with other imports:

```typescript
import plansRouter from './routes/plans';
import goalsRouter from './routes/goals';
```

Then register the routes **after** your existing routes:

```typescript
// Add after existing app.use() calls
app.use('/api', plansRouter);
app.use('/api', goalsRouter);
```

### Step 5: Restart Server

```bash
npm run dev
```

## Verify It Worked

Open a new terminal and run:

```bash
# Check if tables exist (if psql is installed locally)
psql $DATABASE_URL -c "\dt" | grep -E "wellness_plans|plan_items|user_goals"

# Or test the API
curl http://localhost:3000/api/plans/today -H "Cookie: YOUR_SESSION"
```

## Alternative: If Drizzle Push Doesn't Work

If `drizzle-kit push` doesn't work, you can create the tables manually using the Node.js console:

```bash
cd ~/Downloads/PURESOUL
node
```

Then paste this:

```javascript
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv/config');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Then run migrations or create tables
console.log('Connected! Check your DATABASE_URL:', process.env.DATABASE_URL);
```

## Issue 2: Terminal Commands

The second error happened because you tried to run TypeScript code in your terminal. That code should be **added to a file**, not run in terminal:

**DON'T DO THIS:**
```bash
import plansRouter from './routes/plans';  # ❌ Wrong - this is TypeScript
```

**DO THIS:**
Open the file `server/index.ts` in your editor and add those lines inside the file.

---

## Next Steps After Database is Set Up

1. ✅ Push schema to database (`npx drizzle-kit push`)
2. ✅ Add routes to `server/index.ts` (edit the file)
3. ✅ Restart server (`npm run dev`)
4. ✅ Test API endpoints (see PHASE5-QUICKSTART.md)

Need help? Let me know which step is failing!
