# Phase 5: Testing Guide

## 🧪 Complete Testing Workflow

### Prerequisites

1. **Database is set up** (schema pushed)
2. **Server is running** (`npm run dev`)
3. **You're logged in** (have a session cookie)

## 🔑 Get Your Session Cookie

### Option A: From Browser DevTools
1. Open http://localhost:3000
2. Log in to your account
3. Press F12 (open DevTools)
4. Go to Application tab → Cookies → http://localhost:3000
5. Copy the value of `connect.sid`

### Option B: From Login Response
```bash
# Log in and capture cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"youruser","password":"yourpass"}' \
  -c cookies.txt -v

# Your cookie is now saved in cookies.txt
```

For all tests below, replace `YOUR_SESSION_COOKIE` with your actual session cookie.

---

## 🎯 Test 1: Generate Your First Daily Plan

### Using Browser
1. Open http://localhost:3000
2. Log in
3. Open browser console (F12)
4. Paste this:

```javascript
fetch('/api/plans/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    date: new Date().toISOString().split('T')[0]
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Plan Generated!', data);
    console.log('Plan ID:', data.plan.id);
    console.log('Title:', data.plan.title);
    console.log('Items:', data.plan.items.length);
  })
  .catch(err => console.error('❌ Error:', err));
```

### Using curl
```bash
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"date":"2026-02-04"}' | jq
```

**Expected Result:**
```json
{
  "message": "Plan generated successfully",
  "plan": {
    "id": "uuid-here",
    "title": "Stress Relief Plan",
    "description": "A calming routine...",
    "items": [
      {
        "id": "item-uuid",
        "title": "Box Breathing",
        "scheduled_time": "08:00",
        "estimated_duration": 5,
        "status": "pending"
      }
    ]
  }
}
```

---

## 🎯 Test 2: Get Today's Plan

```bash
curl http://localhost:3000/api/plans/today \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" | jq
```

**Or in browser console:**
```javascript
fetch('/api/plans/today', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Today\'s Plan:', data));
```

---

## 🎯 Test 3: Complete a Plan Item

First, get your plan ID and an item ID from Test 2, then:

```bash
curl -X PUT "http://localhost:3000/api/plans/PLAN_ID/items/ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "status": "completed",
    "effectiveness_rating": 5,
    "notes": "This really helped me feel calm!"
  }' | jq
```

**In browser:**
```javascript
// Replace with your actual IDs
const planId = 'your-plan-id';
const itemId = 'your-item-id';

fetch(`/api/plans/${planId}/items/${itemId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'completed',
    effectiveness_rating: 5,
    notes: 'This really helped!'
  })
})
  .then(r => r.json())
  .then(data => console.log('✅ Marked complete:', data));
```

---

## 🎯 Test 4: Create Your First Goal

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "title": "Complete 20 wellness activities this month",
    "description": "Build a consistent self-care practice",
    "goal_type": "metric",
    "category": "mental_health",
    "target_metric": "activities_completed",
    "target_value": 20,
    "unit": "count",
    "target_date": "2026-02-28",
    "why_important": "I want to prioritize my mental health and build healthy habits"
  }' | jq
```

**In browser:**
```javascript
fetch('/api/goals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: "Complete 20 wellness activities this month",
    description: "Build a consistent self-care practice",
    goal_type: "metric",
    category: "mental_health",
    target_metric: "activities_completed",
    target_value: 20,
    unit: "count",
    target_date: "2026-02-28",
    why_important: "I want to prioritize my mental health"
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Goal Created!', data);
    console.log('Goal ID:', data.goal.id);
  });
```

**Expected Result:**
```json
{
  "message": "Goal created successfully",
  "goal": {
    "id": "goal-uuid",
    "title": "Complete 20 wellness activities this month",
    "completion_percentage": "0.00",
    "status": "active"
  }
}
```

---

## 🎯 Test 5: Get All Your Goals

```bash
curl "http://localhost:3000/api/goals?status=active" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" | jq
```

**In browser:**
```javascript
fetch('/api/goals?status=active', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('My Goals:', data.goals));
```

---

## 🎯 Test 6: Record Goal Progress

```bash
# Replace GOAL_ID with your actual goal ID
curl -X POST "http://localhost:3000/api/goals/GOAL_ID/progress" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "value": 5,
    "note": "Completed 5 activities today!",
    "mood_at_recording": 7
  }' | jq
```

**In browser:**
```javascript
const goalId = 'your-goal-id';

fetch(`/api/goals/${goalId}/progress`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    value: 5,
    note: "Completed 5 activities today!",
    mood_at_recording: 7
  })
})
  .then(r => r.json())
  .then(data => console.log('✅ Progress recorded:', data));
```

This will automatically update the goal's `current_value` and `completion_percentage`!

---

## 🎯 Test 7: Get Goal with Progress History

```bash
curl "http://localhost:3000/api/goals/GOAL_ID" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" | jq
```

You should see:
- Updated `current_value`
- Updated `completion_percentage` (25% if target was 20)
- Progress history array

---

## 🎯 Test 8: Get Plan Stats

```bash
curl "http://localhost:3000/api/plans/PLAN_ID/stats" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" | jq
```

**Expected Result:**
```json
{
  "stats": {
    "total_items": "6",
    "completed_items": "2",
    "skipped_items": "0",
    "pending_items": "4",
    "avg_effectiveness": "4.50",
    "total_estimated_minutes": "45",
    "completed_minutes": "15"
  }
}
```

---

## 🎯 Test 9: Get Goals Summary Stats

```bash
curl "http://localhost:3000/api/goals/stats/summary" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" | jq
```

**Expected Result:**
```json
{
  "stats": {
    "total_goals": "3",
    "active_goals": "2",
    "completed_goals": "1",
    "abandoned_goals": "0",
    "avg_completion": "45.50",
    "overdue_goals": "0"
  }
}
```

---

## 🎯 Test 10: Update Goal Status

```bash
# Mark goal as completed
curl -X PUT "http://localhost:3000/api/goals/GOAL_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"status":"completed"}' | jq
```

---

## 🧪 Complete Test Sequence

Run this entire sequence to test the full workflow:

```bash
# Save your session cookie
SESSION="YOUR_SESSION_COOKIE"

echo "🎯 Test 1: Generate Plan"
curl -s -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION" \
  -d '{"date":"2026-02-04"}' | jq -r '.plan.id' > /tmp/plan_id.txt

PLAN_ID=$(cat /tmp/plan_id.txt)
echo "✅ Plan ID: $PLAN_ID"

echo ""
echo "🎯 Test 2: Get Today's Plan"
curl -s http://localhost:3000/api/plans/today \
  -H "Cookie: connect.sid=$SESSION" | jq '.plan.items[0].id' -r > /tmp/item_id.txt

ITEM_ID=$(cat /tmp/item_id.txt)
echo "✅ First Item ID: $ITEM_ID"

echo ""
echo "🎯 Test 3: Complete Item"
curl -s -X PUT "http://localhost:3000/api/plans/$PLAN_ID/items/$ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION" \
  -d '{"status":"completed","effectiveness_rating":5}' | jq '.message'

echo ""
echo "🎯 Test 4: Create Goal"
curl -s -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION" \
  -d '{
    "title":"Test Goal: 10 Activities",
    "goal_type":"metric",
    "target_metric":"activities_completed",
    "target_value":10,
    "unit":"count",
    "target_date":"2026-02-28"
  }' | jq -r '.goal.id' > /tmp/goal_id.txt

GOAL_ID=$(cat /tmp/goal_id.txt)
echo "✅ Goal ID: $GOAL_ID"

echo ""
echo "🎯 Test 5: Record Progress"
curl -s -X POST "http://localhost:3000/api/goals/$GOAL_ID/progress" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION" \
  -d '{"value":3,"note":"Made good progress!"}' | jq '.message'

echo ""
echo "🎯 Test 6: Get Goal Status"
curl -s "http://localhost:3000/api/goals/$GOAL_ID" \
  -H "Cookie: connect.sid=$SESSION" | jq '{
    title: .goal.title,
    current: .goal.current_value,
    target: .goal.target_value,
    percentage: .goal.completion_percentage
  }'

echo ""
echo "✅ All tests complete!"
```

---

## 🔍 Verify in Database

If you have direct database access:

```sql
-- Check your plans
SELECT id, title, plan_type, status, target_date
FROM wellness_plans
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Check plan items
SELECT pi.title, pi.status, pi.scheduled_time, pi.estimated_duration
FROM plan_items pi
JOIN wellness_plans p ON pi.plan_id = p.id
WHERE p.user_id = 'YOUR_USER_ID'
ORDER BY pi.display_order;

-- Check your goals
SELECT id, title, current_value, target_value, completion_percentage, status
FROM user_goals
WHERE user_id = 'YOUR_USER_ID';

-- Check goal progress
SELECT gp.recorded_at, gp.value, gp.percentage, gp.note
FROM goal_progress gp
JOIN user_goals g ON gp.goal_id = g.id
WHERE g.user_id = 'YOUR_USER_ID'
ORDER BY gp.recorded_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: "Plan already exists for this date"

This is actually good! It means the API is working. To test again:

```bash
# Archive the existing plan first
curl -X DELETE "http://localhost:3000/api/plans/PLAN_ID" \
  -H "Cookie: connect.sid=$SESSION"

# Then generate a new one
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Cookie: connect.sid=$SESSION" \
  -d '{"date":"2026-02-04"}'
```

### Issue: 401 Unauthorized

Your session cookie expired. Log in again and get a fresh cookie.

### Issue: 500 Internal Server Error

Check server logs:
```bash
# Look for error messages in your terminal running npm run dev
```

Common causes:
- Database tables not created (run `npx drizzle-kit push`)
- Routes not registered in `server/index.ts`
- Missing imports in route files

---

## ✅ Success Checklist

After running all tests, you should have:

- [ ] Generated at least one daily plan
- [ ] Plan has 5-6 items with times and durations
- [ ] Completed at least one plan item
- [ ] Created at least one goal
- [ ] Recorded progress on that goal
- [ ] Goal's `completion_percentage` updated automatically
- [ ] Can see plan stats showing completion rate
- [ ] No errors in server logs

---

## 🎨 Next: Build the UI

Once APIs are working, create the UI components:

1. **Daily Plan View** - Show today's plan with checkboxes
2. **Goals Dashboard** - List goals with progress bars
3. **Stats Page** - Show completion trends

See example code in `PHASE5-QUICKSTART.md`!

---

## 📊 What to Test for Quality

### Plan Generation Quality

Generate several plans and check:
- [ ] Plans adapt to your stress/mood levels
- [ ] Activities are relevant to focus area
- [ ] Times are realistic (morning, afternoon, evening)
- [ ] Duration totals reasonable (30-60 min/day)
- [ ] Mix of activity types (breathing, meditation, movement)

### Goal Tracking Accuracy

- [ ] Completion percentage calculates correctly
- [ ] Goal auto-completes when reaching target
- [ ] Progress history shows over time
- [ ] Updates happen in real-time

### Integration Testing

- [ ] Completing plan item updates activity stats
- [ ] Activity completion counts toward goals
- [ ] User stats update correctly
- [ ] No duplicate plans for same date

---

Happy testing! 🚀 If any test fails, check the error message and server logs for clues.
