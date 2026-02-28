# Phase 6: Crisis Resources - Setup Guide 🆘

## Overview

Phase 6 adds critical safety features to PureSoul:
- **Crisis Resources** - 988 hotline, crisis text lines, international resources
- **Safety Plans** - User-created safety plans for crisis prevention
- **Emergency Support** - Immediate access to professional help

---

## ✅ Step 1: Run Database Migration

The migration creates 2 new tables:
1. `crisis_resources` - Crisis hotlines and resources
2. `safety_plans` - User safety plans

### Option A: Using Node.js Script (Recommended)

```bash
cd /path/to/PURESOUL
node run-phase6-migration.js
```

### Option B: Using psql Directly

```bash
psql $DATABASE_URL -f server/db/migrations/006_crisis_resources.sql
```

**Expected Output:**
```
✅ Phase 6 Week 1: Crisis resources tables created!
Crisis resources seeded: 17
```

---

## ✅ Step 2: Verify Database Setup

Run this query to check if tables were created:

```sql
SELECT COUNT(*) FROM crisis_resources;
SELECT COUNT(*) FROM safety_plans;
```

You should see:
- **17 crisis resources** (US, Canada, UK, Australia, India, New Zealand)
- **0 safety plans** (users haven't created any yet)

---

## ✅ Step 3: Test Crisis Resources API

### Start the server

```bash
npm run dev
```

### Test in Browser Console

Open http://localhost:3000 and open browser console:

```javascript
// 1. Get US crisis resources
fetch('/api/crisis/resources?country=US')
  .then(r => r.json())
  .then(data => {
    console.log('✅ US Crisis Resources:', data.resources.length);
    console.log('📞 988 Lifeline:', data.resources[0]);
  });

// 2. Get available countries
fetch('/api/crisis/resources/all-countries')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Countries Available:', data.countries.map(c => c.country_code));
  });

// 3. Get Canada resources
fetch('/api/crisis/resources?country=CA')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Canada Resources:', data.resources);
  });
```

**Expected Results:**
- ✅ US Crisis Resources: 9
- ✅ Countries Available: ['AU', 'CA', 'GB', 'IN', 'NZ', 'US']
- ✅ Canada Resources: 2

---

## ✅ Step 4: Test Safety Plan API

These endpoints require authentication, so you need to be logged in first.

```javascript
// 1. Create a safety plan
fetch('/api/crisis/safety-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    warning_signs: [
      "Feeling overwhelmed",
      "Isolating from friends",
      "Trouble sleeping"
    ],
    coping_strategies: [
      "Deep breathing exercises",
      "Listen to calming music",
      "Take a walk outside"
    ],
    distraction_activities: [
      "Watch a favorite show",
      "Play with my pet",
      "Call a friend"
    ],
    support_contacts: [
      { name: "Mom", phone: "555-1234", relationship: "Family" },
      { name: "Best Friend", phone: "555-5678", relationship: "Friend" }
    ],
    professional_contacts: [
      { name: "Dr. Smith", phone: "555-9999", type: "Therapist" }
    ],
    safe_environment_steps: [
      "Remove harmful items",
      "Tell someone I trust"
    ],
    reasons_to_live: [
      "My family needs me",
      "I want to see my goals come true",
      "Things can get better"
    ]
  })
})
.then(r => r.json())
.then(data => console.log('✅ Safety Plan Created:', data));

// 2. Get my safety plan
fetch('/api/crisis/safety-plan')
  .then(r => r.json())
  .then(data => {
    console.log('✅ My Safety Plan:', data.safetyPlan);
  });
```

---

## 📊 Crisis Resources Included

### United States (9 resources)
- **988 Suicide & Crisis Lifeline** - Call/Text 988
- **Crisis Text Line** - Text 741741
- **SAMHSA National Helpline** - 1-800-662-4357
- **Veterans Crisis Line** - 988 or Text 838255
- **Trevor Project (LGBTQ+ Youth)** - 1-866-488-7386
- **IMAlive Crisis Chat** - Online chat
- **NAMI Helpline** - 1-800-950-6264
- **Domestic Violence Hotline** - 1-800-799-7233
- **911** - Emergency services

### Canada (2 resources)
- **Canada Suicide Prevention Service** - 1-833-456-4566
- **Crisis Text Line Canada** - Text 45645

### United Kingdom (2 resources)
- **Samaritans** - 116 123
- **999** - Emergency services

### Australia (2 resources)
- **Lifeline Australia** - 13 11 14
- **Beyond Blue** - 1300 22 4636

### India (1 resource)
- **AASRA** - 91-9820466726

### New Zealand (1 resource)
- **Lifeline Aotearoa** - 0800 543 354

---

## 🎯 Next Steps for Phase 6

Week 1 (Crisis Resources) ✅ COMPLETE:
- [x] Create crisis_resources table
- [x] Seed crisis hotlines database
- [x] Create crisis API routes
- [x] Safety plan API

Week 2 (Wellness Reports):
- [ ] Create wellness_reports table
- [ ] Build report generation API
- [ ] Implement PDF generation
- [ ] Create report preview UI

Week 3 (Report Sharing):
- [ ] Implement share code generation
- [ ] Create public report view
- [ ] Add access logging

Week 4 (Therapist Features):
- [ ] Therapist search UI
- [ ] Consultation request flow
- [ ] User-therapist connections

---

## 🔐 Security Notes

### Crisis Resources
- Resources are public (no authentication required)
- Provides immediate access in emergencies
- Filtered by country for relevance

### Safety Plans
- Require authentication
- Private to each user
- Can be updated or deleted anytime
- Stored securely in database

---

## 🧪 Troubleshooting

### Migration Fails: "relation already exists"
The tables already exist. This is fine - the migration uses `CREATE TABLE IF NOT EXISTS`.

### API Returns 401 Unauthorized (Safety Plans)
You need to be logged in to create/view safety plans. Make sure you're authenticated first.

### API Returns 500 Internal Server Error
1. Check if tables were created: `SELECT COUNT(*) FROM crisis_resources;`
2. Check server logs for detailed error messages
3. Verify DATABASE_URL is set correctly

### "psql: command not found"
Use the Node.js migration script instead:
```bash
node run-phase6-migration.js
```

---

## 📖 API Documentation

### GET /api/crisis/resources
Get crisis resources by country

**Query Parameters:**
- `country` (optional) - Country code (US, CA, GB, AU, IN, NZ). Default: US

**Response:**
```json
{
  "message": "Crisis resources retrieved",
  "resources": [
    {
      "id": "...",
      "name": "988 Suicide & Crisis Lifeline",
      "phone": "988",
      "sms_number": "988",
      "available_24_7": true,
      "languages": ["en", "es"]
    }
  ]
}
```

### GET /api/crisis/resources/all-countries
Get list of countries with available resources

**Response:**
```json
{
  "message": "Available countries retrieved",
  "countries": [
    { "country_code": "US", "resource_count": 9 },
    { "country_code": "CA", "resource_count": 2 }
  ]
}
```

### POST /api/crisis/safety-plan
Create or update user's safety plan (requires auth)

**Request Body:**
```json
{
  "warning_signs": ["string"],
  "coping_strategies": ["string"],
  "distraction_activities": ["string"],
  "support_contacts": [{"name": "string", "phone": "string"}],
  "professional_contacts": [{"name": "string", "phone": "string"}],
  "safe_environment_steps": ["string"],
  "reasons_to_live": ["string"]
}
```

### GET /api/crisis/safety-plan
Get user's safety plan (requires auth)

### DELETE /api/crisis/safety-plan
Delete user's safety plan (requires auth)

---

**Ready for Week 2?** The crisis resources are live and ready to help users in need! 🏥💙
