# Phase 5: Quick Start Guide

## 🚀 Get Phase 5 Running in 10 Minutes

### Step 1: Run Database Migration

```bash
cd ~/Downloads/PURESOUL

# Run the Phase 5 migration
psql $DATABASE_URL -f server/db/migrations/005_wellness_plans.sql
```

**Verify it worked:**
```bash
psql $DATABASE_URL -c "\dt" | grep -E "wellness_plans|plan_items|user_goals|goal_progress|wellness_insights|recommendations"
```

You should see 6 new tables.

### Step 2: Register New Routes

Open `server/index.ts` and add the new routes:

```typescript
// Add these imports at the top
import plansRouter from './routes/plans';
import goalsRouter from './routes/goals';

// Register routes (add after existing routes)
app.use('/api', plansRouter);
app.use('/api', goalsRouter);
```

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C if running)
npm run dev
```

### Step 4: Test the APIs

#### Test 1: Generate Today's Plan

```bash
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"date": "2026-02-04"}'
```

#### Test 2: Get Today's Plan

```bash
curl http://localhost:3000/api/plans/today \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

#### Test 3: Create a Goal

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "title": "Complete 20 activities this month",
    "description": "Build a consistent wellness practice",
    "goal_type": "metric",
    "category": "mental_health",
    "target_metric": "activities_completed",
    "target_value": 20,
    "unit": "count",
    "target_date": "2026-02-28",
    "why_important": "I want to prioritize my mental health"
  }'
```

#### Test 4: Get Your Goals

```bash
curl http://localhost:3000/api/goals?status=active \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## ✅ Quick Verification Checklist

Run these queries to make sure everything works:

```sql
-- Check tables exist
\dt wellness_plans plan_items user_goals goal_progress

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('wellness_plans', 'plan_items', 'user_goals');

-- Check you can insert a plan
SELECT COUNT(*) FROM wellness_plans;
SELECT COUNT(*) FROM user_goals;
```

## 🎨 Next Steps: UI Development

### Priority 1: Daily Plan View (`/plan` or `/today`)

Create `client/src/pages/daily-plan.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export default function DailyPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaysPlan();
  }, []);

  const fetchTodaysPlan = async () => {
    try {
      const res = await fetch('/api/plans/today', { credentials: 'include' });
      const data = await res.json();
      setPlan(data.plan);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: new Date().toISOString() })
      });

      const data = await res.json();
      setPlan(data.plan);

      toast({
        title: "✨ Plan Generated!",
        description: "Your personalized plan for today is ready"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!plan) {
    return (
      <div className="container max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Your Daily Plan</h1>
        <p className="text-gray-400 mb-6">
          No plan for today yet. Let's create one!
        </p>
        <button
          onClick={generatePlan}
          className="btn-primary"
        >
          Generate Today's Plan
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
      <p className="text-gray-400 mb-6">{plan.description}</p>

      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-2">Why this plan?</h3>
        <p className="text-sm text-gray-300">{plan.reasoning}</p>
      </div>

      <div className="space-y-4">
        {plan.items.map((item) => (
          <PlanItem key={item.id} item={item} onComplete={fetchTodaysPlan} />
        ))}
      </div>
    </div>
  );
}

function PlanItem({ item, onComplete }) {
  const [completing, setCompleting] = useState(false);

  const markComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/plans/${item.plan_id}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });
      onComplete();
    } catch (error) {
      console.error('Failed to mark complete:', error);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className={`glass-card p-4 ${item.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={item.status === 'completed'}
          onChange={markComplete}
          disabled={completing}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{item.title}</h4>
            {item.scheduled_time && (
              <span className="text-sm text-gray-400">
                {item.scheduled_time}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 mt-1">{item.description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span>{item.estimated_duration} min</span>
            <span>•</span>
            <span>{item.item_type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Priority 2: Goals Dashboard (`/goals`)

Create `client/src/pages/goals-dashboard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export default function GoalsDashboard() {
  const [goals, setGoals] = useState([]);
  const [showNewGoal, setShowNewGoal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals?status=active', { credentials: 'include' });
      const data = await res.json();
      setGoals(data.goals);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <button
          onClick={() => setShowNewGoal(true)}
          className="btn-primary"
        >
          + New Goal
        </button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
        ))}
      </div>

      {showNewGoal && (
        <NewGoalModal
          onClose={() => setShowNewGoal(false)}
          onSuccess={fetchGoals}
        />
      )}
    </div>
  );
}

function GoalCard({ goal, onUpdate }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
      <p className="text-gray-400 text-sm mb-4">{goal.description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm font-semibold">
            {goal.current_value}/{goal.target_value} {goal.unit}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
            style={{ width: `${goal.completion_percentage}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
        <span>•</span>
        <span>{Math.round(goal.completion_percentage)}% complete</span>
      </div>
    </div>
  );
}

function NewGoalModal({ onClose, onSuccess }) {
  // Goal creation form...
  return <div>Goal creation modal...</div>;
}
```

## 📊 What You Get Out of the Box

### 1. AI Plan Generation

- Analyzes last 7 days of emotional data
- Considers user's current stress, mood, energy levels
- Recommends 5-6 personalized activities
- Suggests timing throughout the day
- Adapts based on what's worked before

### 2. Goal System

- Create SMART goals with deadlines
- Track progress automatically
- Get AI suggestions to achieve goals
- View completion percentage
- Record motivation ("why important")

### 3. Smart Features

- **Auto-completion**: Goals auto-complete when target reached
- **Plan auto-complete**: Plans complete when all items done
- **Activity tracking**: Completing plan items updates activity stats
- **Progress snapshots**: Track goal progress over time
- **Trend analysis**: See if mood/stress is improving/declining

## 🧪 Manual Testing Scenarios

### Scenario 1: New User Journey

1. Register new account
2. Complete voice journal entry
3. Wait for AI analysis (creates emotional blueprint)
4. Generate daily plan → Should get balanced wellness plan
5. Complete 2-3 activities from plan
6. Create goal: "Complete 10 activities this week"
7. Check goal updates automatically as you complete activities

### Scenario 2: High Stress User

1. Log in as existing user with high stress
2. Generate plan → Should prioritize breathwork and meditation
3. Complete breathing exercise
4. Rate effectiveness as 5/5
5. Generate tomorrow's plan → Should include more breathing based on rating

### Scenario 3: Goal Achievement

1. Create goal: "Reach 20 activities" with target_value=20
2. Set current_value=18
3. Update to current_value=20
4. Goal should auto-complete and set status='completed'

## 🔍 Debugging Tips

### Check Plan Generation Logs

```bash
# In your terminal running npm run dev:
# Look for logs like:
[Plan Generation] Generating plan for user...
[Plan Generation] AI plan generated successfully
[Plan Generation] Plan saved successfully: <uuid>
```

### Inspect Database Directly

```sql
-- See your latest plan
SELECT * FROM wellness_plans WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;

-- See plan items
SELECT pi.* FROM plan_items pi
JOIN wellness_plans p ON pi.plan_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'
ORDER BY p.created_at DESC, pi.display_order;

-- Check triggers are working
-- Update a goal's current_value and verify completion_percentage updates
UPDATE user_goals SET current_value = 15 WHERE id = 'YOUR_GOAL_ID';
SELECT completion_percentage FROM user_goals WHERE id = 'YOUR_GOAL_ID';
-- Should show 75% if target was 20
```

### Test Without OpenAI API

The system works perfectly without an OpenAI API key! It uses intelligent rule-based generation:

- High stress → Breathing + meditation activities
- Low energy → Movement activities
- Low mood → Journaling + social activities
- Balanced state → Mix of all types

## 📈 Phase 5 Metrics to Track

Once users start using Phase 5:

1. **Plan Engagement**
   - % of days with generated plan
   - Plan completion rate
   - Most skipped activity types

2. **Goal Success**
   - Goal completion rate
   - Average time to complete goal
   - Most popular goal categories

3. **Effectiveness**
   - Correlation: Plan completion → mood improvement
   - User retention after setting first goal
   - Activities with highest completion rate

## 🚀 You're Ready!

Phase 5 is now set up! You have:

- ✅ 6 new database tables
- ✅ AI plan generation service
- ✅ Complete REST API for plans and goals
- ✅ Auto-completion triggers
- ✅ Progress tracking
- ✅ Smart activity recommendations

**Next:** Build the UI components and watch your users engage with their personalized wellness journey! 🎯

Need help? Check the full implementation plan in `PHASE5-IMPLEMENTATION-PLAN.md`
