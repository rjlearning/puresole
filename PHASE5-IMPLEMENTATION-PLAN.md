# Phase 5: Personalized Wellness Plans - Implementation Guide

## 🎯 Overview

Phase 5 transforms PureSoul from a reactive wellness tool into a **proactive wellness coach** that creates personalized daily plans, helps users set meaningful goals, tracks progress, and adapts recommendations based on patterns.

## 📊 Database Schema

### New Tables

```sql
-- Wellness plans (AI-generated daily/weekly plans)
CREATE TABLE wellness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'custom'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'skipped', 'archived'
  target_date DATE NOT NULL,
  generated_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'user', 'therapist'

  -- AI reasoning
  reasoning TEXT, -- Why this plan was created
  priority_focus VARCHAR(100), -- e.g., 'stress_reduction', 'mood_boost', 'energy_building'

  -- Metrics at time of plan creation
  baseline_mood_score INTEGER,
  baseline_stress_level INTEGER,
  baseline_energy_level INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  INDEX idx_user_target_date (user_id, target_date),
  INDEX idx_status (status)
);

-- Plan items (individual tasks/activities in a plan)
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES wellness_plans(id) ON DELETE CASCADE,

  -- Item details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL, -- 'activity', 'reminder', 'reflection', 'custom'

  -- Reference to activity (if applicable)
  activity_id UUID REFERENCES wellness_activities(id) ON DELETE SET NULL,

  -- Timing
  scheduled_time TIME, -- Suggested time (e.g., '08:00', '14:00')
  estimated_duration INTEGER, -- in minutes
  display_order INTEGER DEFAULT 0,

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
  completed_at TIMESTAMP,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_plan_order (plan_id, display_order),
  INDEX idx_status (status)
);

-- User goals (short-term and long-term objectives)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Goal details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL, -- 'habit', 'milestone', 'metric', 'challenge'
  category VARCHAR(50), -- 'mental_health', 'sleep', 'exercise', 'mindfulness', 'social'

  -- Target metrics
  target_metric VARCHAR(100), -- e.g., 'activities_completed', 'mood_score', 'stress_level'
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50), -- e.g., 'count', 'score', 'percentage'

  -- Timeframe
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'paused'
  completion_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Motivation
  why_important TEXT, -- User's reason for this goal
  reward TEXT, -- What they'll reward themselves with

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  INDEX idx_user_status (user_id, status),
  INDEX idx_target_date (target_date)
);

-- Goal progress tracking (snapshots of progress over time)
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,

  recorded_at TIMESTAMP DEFAULT NOW(),
  value DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2),

  -- Context
  note TEXT,
  mood_at_recording INTEGER CHECK (mood_at_recording BETWEEN 1 AND 10),

  INDEX idx_goal_recorded (goal_id, recorded_at)
);

-- Wellness insights (AI-generated insights about user patterns)
CREATE TABLE wellness_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Insight details
  insight_type VARCHAR(50) NOT NULL, -- 'pattern', 'achievement', 'warning', 'suggestion'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Supporting data
  data_source VARCHAR(50), -- 'voice_entries', 'activities', 'mood_tracking', 'combined'
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Actionability
  is_actionable BOOLEAN DEFAULT false,
  recommended_action TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Visibility
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  -- Time relevance
  relevant_from DATE DEFAULT CURRENT_DATE,
  relevant_until DATE,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_priority (user_id, priority, is_read),
  INDEX idx_user_created (user_id, created_at)
);

-- Recommendations (personalized activity/action recommendations)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Recommendation details
  recommendation_type VARCHAR(50) NOT NULL, -- 'activity', 'habit', 'resource', 'goal'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Reference (if applicable)
  activity_id UUID REFERENCES wellness_activities(id) ON DELETE CASCADE,

  -- AI reasoning
  reasoning TEXT, -- Why this is recommended
  expected_benefit TEXT, -- What they'll gain from this

  -- Personalization
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  based_on TEXT[], -- Array of data points used (e.g., ['recent_stress', 'low_sleep'])

  -- User response
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
  user_feedback TEXT,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP,

  INDEX idx_user_status (user_id, status),
  INDEX idx_created (created_at)
);
```

## 🔌 API Routes

### Wellness Plans

```typescript
// GET /api/plans
// Get all plans for current user
// Query params: ?status=active&type=daily&date=2026-02-03

// GET /api/plans/:id
// Get specific plan with all items

// POST /api/plans/generate
// Generate AI plan for today/tomorrow
// Body: { date, focus?, mood?, preferences? }

// PUT /api/plans/:id/items/:itemId
// Update plan item status/notes
// Body: { status, effectiveness_rating, notes }

// DELETE /api/plans/:id
// Archive/delete a plan
```

### Goals

```typescript
// GET /api/goals
// Get all user goals
// Query params: ?status=active&category=mental_health

// GET /api/goals/:id
// Get specific goal with progress history

// POST /api/goals
// Create new goal
// Body: { title, description, goal_type, target_metric, target_value, target_date, why_important }

// PUT /api/goals/:id
// Update goal
// Body: { status?, current_value?, completion_percentage? }

// POST /api/goals/:id/progress
// Record progress snapshot
// Body: { value, note?, mood_at_recording? }

// GET /api/goals/:id/suggestions
// Get AI suggestions for achieving this goal
```

### Insights

```typescript
// GET /api/insights
// Get personalized insights
// Query params: ?priority=high&unread=true

// PUT /api/insights/:id/read
// Mark insight as read

// PUT /api/insights/:id/dismiss
// Dismiss an insight

// POST /api/insights/generate
// Trigger AI insight generation
```

### Recommendations

```typescript
// GET /api/recommendations
// Get active recommendations
// Query params: ?type=activity&limit=5

// PUT /api/recommendations/:id/accept
// Accept a recommendation

// PUT /api/recommendations/:id/decline
// Decline with optional feedback
// Body: { feedback? }

// POST /api/recommendations/:id/complete
// Mark recommendation as completed
// Body: { effectiveness_rating?, notes? }
```

## 🤖 AI Integration

### Plan Generation Service

```typescript
// server/services/planGeneration.ts

interface PlanGenerationInput {
  userId: string;
  targetDate: Date;
  focusArea?: string;
  currentMood?: number;
  recentPatterns: {
    avgStress: number;
    avgMood: number;
    avgEnergy: number;
    commonEmotions: string[];
  };
  completedActivities: string[]; // recent activity IDs
  activeGoals: Goal[];
}

interface GeneratedPlan {
  title: string;
  description: string;
  priorityFocus: string;
  reasoning: string;
  items: PlanItem[];
}

async function generateDailyPlan(input: PlanGenerationInput): Promise<GeneratedPlan> {
  // 1. Analyze recent patterns (last 7 days)
  // 2. Check current goals and progress
  // 3. Consider time of day and user preferences
  // 4. Use GPT-4 to generate personalized plan
  // 5. Select appropriate activities from database
  // 6. Return structured plan
}
```

### Insight Generation Service

```typescript
// server/services/insightGeneration.ts

interface UserPatternData {
  voiceEntries: VoiceEntry[];
  activityCompletions: ActivityCompletion[];
  moodHistory: { date: Date; mood: number }[];
  stressHistory: { date: Date; stress: number }[];
}

async function generateInsights(userId: string): Promise<Insight[]> {
  // 1. Gather last 30 days of data
  // 2. Detect patterns:
  //    - Mood trends (improving, declining, cyclical)
  //    - Activity effectiveness
  //    - Time-of-day patterns
  //    - Trigger identification
  // 3. Use GPT-4 to generate natural language insights
  // 4. Assign priority and actionability
  // 5. Return insights array
}
```

### Adaptive Recommendations

```typescript
// server/services/recommendations.ts

async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  // 1. Get current emotional state
  // 2. Check goals and progress
  // 3. Analyze what's worked before (high-rated activities)
  // 4. Consider time since last activity
  // 5. Use ML to predict effectiveness
  // 6. Generate 3-5 personalized recommendations
}
```

## 🎨 UI Components

### 1. Daily Plan View (`/plan` or `/today`)

```
┌──────────────────────────────────────────────┐
│  ☀️ Your Plan for Today                      │
│  Feb 3, 2026                                  │
├──────────────────────────────────────────────┤
│  Focus: Stress Reduction                     │
│  "Based on recent patterns, we're           │
│   focusing on calming your elevated stress" │
├──────────────────────────────────────────────┤
│  Morning (3 items)                           │
│  ☐ 8:00 AM - Morning Meditation (10 min)    │
│  ☐ 8:15 AM - Gratitude Journaling (5 min)   │
│  ☐ 9:00 AM - Energizing Walk (15 min)       │
│                                              │
│  Afternoon (2 items)                         │
│  ☐ 2:00 PM - Box Breathing (5 min)          │
│  ☐ 3:00 PM - Voice Check-in                 │
│                                              │
│  Evening (1 item)                            │
│  ☐ 8:00 PM - Evening Reflection             │
├──────────────────────────────────────────────┤
│  [Generate Tomorrow's Plan] [Customize]     │
└──────────────────────────────────────────────┘
```

### 2. Goals Dashboard (`/goals`)

```
┌──────────────────────────────────────────────┐
│  🎯 My Wellness Goals                        │
├──────────────────────────────────────────────┤
│  Active Goals (3)                            │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Complete 20 activities this month      │ │
│  │ Progress: ████████░░ 16/20 (80%)      │ │
│  │ Due: Feb 28 • 25 days left            │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Reduce stress to <40                   │ │
│  │ Current: 62 → Target: 40              │ │
│  │ Progress: ███░░░░░░░ 38%              │ │
│  │ Trend: ↓ Improving                     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [+ New Goal]  [View Completed]             │
└──────────────────────────────────────────────┘
```

### 3. Insights Feed (`/insights`)

```
┌──────────────────────────────────────────────┐
│  💡 Your Wellness Insights                   │
├──────────────────────────────────────────────┤
│  🔥 HIGH PRIORITY                            │
│  ┌────────────────────────────────────────┐ │
│  │ 📈 Your stress peaks on Mondays        │ │
│  │ We noticed your stress is 40% higher  │ │
│  │ on Mondays. Consider scheduling       │ │
│  │ morning meditation to start the week. │ │
│  │                                        │ │
│  │ [Try Monday Meditation] [Dismiss]     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  📊 PATTERN DETECTED                         │
│  ┌────────────────────────────────────────┐ │
│  │ 🌙 Evening voice journaling helps      │ │
│  │ Your mood improves by 2.3 points when │ │
│  │ you journal in the evening (8-10 PM). │ │
│  │                                        │ │
│  │ [Set Evening Reminder] [Learn More]   │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4. Recommendations Card (in Dashboard)

```
┌──────────────────────────────────────────────┐
│  ✨ Recommended for You                      │
├──────────────────────────────────────────────┤
│  Based on your recent stress levels          │
│                                              │
│  🫁 Box Breathing Exercise                   │
│  "This worked great for you last week"      │
│  5 min • High confidence (95%)              │
│  [Start Now] [Maybe Later]                  │
│                                              │
│  🚶 Nature Walk                              │
│  "You haven't done outdoor activity lately" │
│  15 min • Try something new                 │
│  [Start Now] [Not Interested]               │
└──────────────────────────────────────────────┘
```

## 📱 User Flows

### Flow 1: Morning Routine

1. User opens app
2. Sees "Good morning! Here's your plan for today"
3. Reviews AI-generated plan with 6 activities
4. Taps first activity → Opens activity detail
5. Completes activity → Marks as done
6. Sees progress: "1/6 complete 🎉"
7. Gets micro-celebration and encouragement

### Flow 2: Setting a Goal

1. User taps "Goals" in navigation
2. Taps "+ New Goal"
3. Fills out form:
   - What do you want to achieve?
   - Why is this important to you?
   - When do you want to achieve it by?
4. AI suggests:
   - Realistic target based on current data
   - Recommended activities to help
   - Milestones to track
5. User confirms → Goal created
6. Goal appears in dashboard with progress bar

### Flow 3: Receiving an Insight

1. AI detects pattern (e.g., "Stress spikes on work days")
2. Generates insight with recommendation
3. User sees notification badge on Insights tab
4. Opens insights → Sees new insight card
5. Reads insight and reasoning
6. Either:
   - Accepts recommendation → Added to today's plan
   - Dismisses → Noted for future AI learning

## 🧪 Testing Plan

### Unit Tests

```typescript
// Plan generation logic
describe('Plan Generation', () => {
  it('generates plan based on high stress', async () => {
    const plan = await generateDailyPlan({
      userId: 'test',
      targetDate: new Date(),
      recentPatterns: { avgStress: 75, avgMood: 45, avgEnergy: 40 }
    });

    expect(plan.priorityFocus).toBe('stress_reduction');
    expect(plan.items).toHaveLength(6);
    expect(plan.items[0].item_type).toBe('breathwork');
  });
});

// Goal progress calculation
describe('Goal Progress', () => {
  it('calculates completion percentage', async () => {
    const goal = await createGoal({
      target_value: 20,
      current_value: 16
    });

    expect(goal.completion_percentage).toBe(80);
  });
});
```

### Integration Tests

```bash
# Test plan generation API
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-04", "focus": "stress_reduction"}'

# Test goal creation
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete 20 activities",
    "goal_type": "metric",
    "target_metric": "activities_completed",
    "target_value": 20,
    "target_date": "2026-02-28"
  }'
```

## 📊 Success Metrics

### User Engagement

- Daily plan view rate (target: >70% of active users)
- Plan completion rate (target: >50%)
- Goal creation rate (target: >40% of users set at least one goal)

### AI Performance

- Plan acceptance rate (target: >80%)
- Recommendation acceptance rate (target: >60%)
- Insight engagement rate (target: >50% read, >30% action taken)

### Wellness Impact

- Correlation between plan completion and mood improvement
- Goal achievement rate (target: >40% of goals achieved)
- User retention after setting first goal (target: +25%)

## 🚀 Implementation Phases

### Week 1: Database & API Foundation

- [x] Phase 4 complete (Sleep & Calm)
- [ ] Create Phase 5 database migration
- [ ] Implement basic CRUD APIs for plans, goals, insights
- [ ] Test with Postman/curl

### Week 2: AI Services

- [ ] Build plan generation service
- [ ] Build insight detection service
- [ ] Build recommendation engine
- [ ] Test AI quality with real user data

### Week 3: Core UI

- [ ] Daily plan view component
- [ ] Goals dashboard
- [ ] Plan item completion flow
- [ ] Progress visualization

### Week 4: Advanced Features

- [ ] Insights feed
- [ ] Recommendations integration
- [ ] Goal progress tracking
- [ ] Adaptive learning loop

### Week 5: Polish & Testing

- [ ] E2E testing
- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Documentation

## 🎯 Next Steps

1. **Review this plan** - Make sure it aligns with your vision
2. **Run migration** - Create database tables
3. **Implement APIs** - Start with basic CRUD
4. **Build UI** - Create daily plan view first
5. **Test with real data** - Use your own voice entries and activities

## 💡 Pro Tips

### AI Prompt Design

For plan generation:
```
You are a compassionate wellness coach. Based on this user's data:
- Recent stress: 72/100 (elevated)
- Mood trend: Declining (-15% over 7 days)
- Energy: Low (42/100)
- Most effective activities: Box Breathing, Nature Walks

Create a daily wellness plan with 5-6 activities to help them:
1. Reduce stress
2. Improve mood
3. Build energy sustainably

Prioritize evidence-based activities they've enjoyed before.
Include timing suggestions and brief reasoning.
```

### Adaptive Learning

Track these metrics to improve recommendations:
- Activity completion rate by type
- Mood change before/after each activity
- Time-of-day preferences
- Goal achievement patterns

Use this data to:
- Adjust activity recommendations
- Optimize plan timing
- Personalize goal suggestions
- Detect early warning signs

## 🔒 Privacy Considerations

- All AI processing should explain its reasoning
- Users can opt out of AI recommendations
- Plans and goals are private by default
- Insights are generated locally, no external sharing
- Users can delete any AI-generated content

---

**Ready to implement?** Start with the database migration and let's build this! 🚀
