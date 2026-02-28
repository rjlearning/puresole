# ✅ Phase 6 Week 1: Crisis Resources - READY TO TEST

## 🎉 What's Been Implemented

### Database Layer ✅
- **Created** `crisis_resources` table with 17 international hotlines
- **Created** `safety_plans` table for user crisis prevention plans
- **Seeded** crisis hotlines for 6 countries (US, CA, GB, AU, IN, NZ)

### Backend API ✅
- **GET** `/api/crisis/resources?country=XX` - Get crisis hotlines by country
- **GET** `/api/crisis/resources/all-countries` - List available countries
- **GET** `/api/crisis/safety-plan` - Get user's safety plan (auth required)
- **POST** `/api/crisis/safety-plan` - Create/update safety plan (auth required)
- **DELETE** `/api/crisis/safety-plan` - Delete safety plan (auth required)

### Integration ✅
- Crisis routes registered in server
- Middleware configured properly
- Ready to handle requests

---

## 🚀 How to Get Started

### Step 1: Run the Database Migration

Your database needs the new tables. Run:

```bash
cd /path/to/PURESOUL
node run-phase6-migration.js
```

**OR** if you have psql in your PATH:

```bash
psql $DATABASE_URL -f server/db/migrations/006_crisis_resources.sql
```

✅ **Expected Output**: "Crisis resources seeded: 17"

---

### Step 2: Start Your Server

```bash
npm run dev
```

Server should start on http://localhost:3000

---

### Step 3: Test the Crisis Resources API

Open browser console on http://localhost:3000 and paste:

```javascript
// Test 1: Get US crisis resources
fetch('/api/crisis/resources?country=US')
  .then(r => r.json())
  .then(data => {
    console.log('✅ US Resources:', data.resources.length);
    console.log('📞 988 Lifeline:', data.resources.find(r => r.name.includes('988')));
  });

// Test 2: Get all available countries
fetch('/api/crisis/resources/all-countries')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Countries:', data.countries);
  });

// Test 3: Try different countries
['CA', 'GB', 'AU'].forEach(country => {
  fetch(`/api/crisis/resources?country=${country}`)
    .then(r => r.json())
    .then(data => console.log(`✅ ${country}:`, data.resources.map(r => r.name)));
});
```

**Expected Results:**
```
✅ US Resources: 9
📞 988 Lifeline: {name: "988 Suicide & Crisis Lifeline", phone: "988", ...}
✅ Countries: [{country_code: "US", resource_count: 9}, ...]
✅ CA: ["Canada Suicide Prevention Service", "Crisis Text Line Canada"]
✅ GB: ["Samaritans", "999"]
✅ AU: ["Lifeline Australia", "Beyond Blue"]
```

---

### Step 4: Test Safety Plans (Requires Login)

First, make sure you're logged in. Then:

```javascript
// Create a safety plan
fetch('/api/crisis/safety-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    warning_signs: [
      "Feeling overwhelmed and can't think clearly",
      "Withdrawing from friends and family",
      "Changes in sleep or appetite"
    ],
    coping_strategies: [
      "Practice deep breathing for 5 minutes",
      "Listen to calming music",
      "Write in my journal"
    ],
    distraction_activities: [
      "Watch my favorite show",
      "Take a walk outside",
      "Call a friend"
    ],
    support_contacts: [
      { name: "Mom", phone: "555-1234", relationship: "Family" },
      { name: "Sarah", phone: "555-5678", relationship: "Best Friend" }
    ],
    professional_contacts: [
      { name: "Dr. Johnson", phone: "555-9999", type: "Therapist" }
    ],
    safe_environment_steps: [
      "Put away anything I could use to harm myself",
      "Stay in public spaces or with someone I trust"
    ],
    reasons_to_live: [
      "My family loves and needs me",
      "I have goals I want to achieve",
      "This feeling is temporary - it will pass"
    ]
  })
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('❌ Error:', data.error);
    console.log('💡 Make sure you are logged in!');
  } else {
    console.log('✅ Safety Plan Created!', data.safetyPlan.id);
  }
});

// Get your safety plan
fetch('/api/crisis/safety-plan')
  .then(r => r.json())
  .then(data => {
    console.log('✅ My Safety Plan:', data.safetyPlan);
  });
```

---

## 📊 Crisis Resources Included

### 🇺🇸 United States (9 resources)
- 988 Suicide & Crisis Lifeline ⭐
- Crisis Text Line (741741)
- SAMHSA National Helpline
- Veterans Crisis Line
- Trevor Project (LGBTQ+ Youth)
- IMAlive Crisis Chat
- NAMI Helpline
- Domestic Violence Hotline
- 911 Emergency

### 🇨🇦 Canada (2 resources)
- Canada Suicide Prevention Service
- Crisis Text Line Canada

### 🇬🇧 United Kingdom (2 resources)
- Samaritans
- 999 Emergency

### 🇦🇺 Australia (2 resources)
- Lifeline Australia
- Beyond Blue

### 🇮🇳 India (1 resource)
- AASRA

### 🇳🇿 New Zealand (1 resource)
- Lifeline Aotearoa

---

## 🎯 What's Next

### ✅ Complete (Week 1)
- Crisis resources database
- Crisis resources API
- Safety plan API
- Server integration

### 🔜 Next Steps (Week 1 cont.)
- [ ] Create `/crisis-support` React page
- [ ] Display crisis hotlines with beautiful UI
- [ ] Add safety plan creation form
- [ ] Add crisis button to main navigation
- [ ] Implement quick coping techniques modals

### 📅 Week 2: Wellness Reports
- Generate PDF reports from user data
- Share reports with therapists
- Report preview UI

### 📅 Week 3: Report Sharing
- Share codes and access control
- Public report viewing
- Access logging

### 📅 Week 4: Therapist Directory
- Search and filter therapists
- Consultation requests
- Therapist-user connections

---

## 📖 Files Created

| File | Purpose |
|------|---------|
| `server/db/migrations/006_crisis_resources.sql` | Database schema & seed data |
| `server/routes/crisis.ts` | API endpoints for crisis resources |
| `run-phase6-migration.js` | Migration runner script |
| `PHASE6-SETUP.md` | Complete setup and testing guide |
| `PHASE6-CRISIS-UI-SPEC.md` | UI specification for crisis page |
| `PHASE6-WEEK1-COMPLETE.md` | This file - status update |

---

## 🐛 Troubleshooting

**"psql: command not found"**
→ Use: `node run-phase6-migration.js`

**"connect ECONNREFUSED"**
→ Make sure your PostgreSQL database is running
→ Check that `DATABASE_URL` environment variable is set

**"relation 'crisis_resources' does not exist"**
→ Migration hasn't been run yet
→ Run: `node run-phase6-migration.js`

**"Not authenticated" when testing safety plans**
→ You need to log in first
→ Go to http://localhost:3000 and sign in

**500 Internal Server Error**
→ Check server logs in terminal
→ Make sure all Phase 6 tables exist
→ Verify server restarted after adding crisis routes

---

## 💡 Quick Reference

### API Endpoints

```bash
# Public (no auth required)
GET  /api/crisis/resources?country=US
GET  /api/crisis/resources/all-countries

# Authenticated (login required)
GET    /api/crisis/safety-plan
POST   /api/crisis/safety-plan
DELETE /api/crisis/safety-plan
```

### Database Tables

```sql
-- Check if tables exist
SELECT COUNT(*) FROM crisis_resources;  -- Should be 17
SELECT COUNT(*) FROM safety_plans;      -- Should be 0 (initially)
```

---

## 🎊 Success Criteria

You'll know it's working when:

- ✅ Migration runs without errors
- ✅ API returns 17 crisis resources for US
- ✅ API returns resources for all 6 countries
- ✅ Safety plan creation returns success (when logged in)
- ✅ GET safety plan returns your created plan
- ✅ Server logs show no errors

---

## 🚨 This Feature Could Save Lives

The crisis resources you've just implemented provide:
- Immediate access to professional help
- 24/7 support in multiple languages
- Resources across 6 countries
- Private safety planning tools

Build the UI with care and attention. Users in crisis need:
- Clear, prominent crisis information
- No barriers to access (works without login)
- Easy-to-tap phone numbers on mobile
- Calm, supportive design

---

**Ready to build the crisis support UI?** 🏥💙

See `PHASE6-CRISIS-UI-SPEC.md` for detailed UI specifications.
