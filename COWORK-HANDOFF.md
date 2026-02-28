# PureSoul - Cowork Handoff Document
**Date:** February 2, 2026
**Project Location:** ~/Downloads/PURESOUL

---

## 🎯 Project Overview

**PureSoul** (formerly PURESOUL) - AI-powered mental wellness platform with voice emotion detection, gamified therapy activities, and personalized wellness journeys.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Express.js + Node.js
- Database: PostgreSQL with Drizzle ORM
- Auth: Passport.js (Local + Google OAuth)
- AI: OpenAI (Whisper + GPT-4)

---

## ✅ What's Working

### Phase 1: Voice Recording Infrastructure (COMPLETE)
- Voice recorder component with real-time waveform
- Mood tracking (before/after 1-10 scale)
- Emotion tags with custom emojis
- Audio storage and playback
- Database table: `voice_entries`

### Phase 2: AI Emotion Detection (COMPLETE)
- OpenAI Whisper integration for transcription
- GPT-4 emotion analysis
- Emotional blueprint generation
- Crisis risk assessment
- Database tables: `emotional_blueprints`, `analysis_jobs`
- Routes: `/api/analysis/*`, `/api/blueprint/*`

### Phase 3: Activities & Gamification (DATABASE COMPLETE)
- Database tables created:
  - `wellness_activities` (15 activities seeded)
  - `user_activity_completions`
  - `achievements` (10 achievements seeded)
  - `user_achievements`
  - `user_stats`
- Activities API routes working: `/api/activities`
- Categories: breathing, meditation, journaling, movement, grounding

### Landing Page (COMPLETE)
- SuperSoulLanding.jsx (production-ready)
- Inspired by Superpower.com design
- Full conversion funnel with pricing

---

## 🔧 Current Issues

### CRITICAL: Auth System Causing Blank Pages
**Problem:** When not logged in, /dashboard and /activities show blank pages instead of redirecting to login.

**Root Cause:**
```typescript
// In App.tsx - this code needs fixing:
if (!isAuthenticated && !['/auth', '/login', '/register', '/'].includes(location)) {
  setLocation('/auth');
  return null;
}
```

**Error Message:**
```
GET http://localhost:3000/api/auth/me 401 (Unauthorized)
GET http://localhost:3000/api/auth/user 401 (Unauthorized)
```

**Temporary Fix:**
1. Go directly to http://localhost:3000/auth
2. Create an account
3. Then /dashboard and /activities will work

---

## 🗄️ Database Schema

### Connection
```bash
DATABASE_URL=postgresql://localhost/puresoul
```

### Key Tables
```sql
-- Users (existing)
users (id, username, password, email, created_at)

-- Phase 1: Voice Entries
voice_entries (id, user_id, audio_file_path, duration, mood_before, mood_after, 
               notes, tags, transcript, ai_analysis, prosody_data, created_at)

-- Phase 2: Emotional Blueprints
emotional_blueprints (id, user_id, date, stress_score, anxiety_score, mood_score,
                     sleep_quality, energy_level, detected_emotions, insights,
                     wellness_score, created_at)

analysis_jobs (id, entry_id, status, error_message, started_at, completed_at)

-- Phase 3: Activities & Gamification
wellness_activities (id, name, description, category, difficulty, duration,
                    instructions, benefits, icon_emoji, gradient_class)

user_activity_completions (id, user_id, activity_id, completed_at, 
                           duration_actual, effectiveness_rating, notes)

achievements (id, code, name, description, badge_emoji, points, tier)

user_achievements (id, user_id, achievement_id, unlocked_at)

user_stats (user_id, total_points, current_streak, longest_streak,
           total_activities, total_voice_entries, level, experience_points)
```

### Verify Data
```bash
psql postgresql://localhost/puresoul -c "SELECT COUNT(*) FROM wellness_activities;" # Should be 15
psql postgresql://localhost/puresoul -c "SELECT COUNT(*) FROM achievements;" # Should be 10
psql postgresql://localhost/puresoul -c "\dt" # List all tables
```

---

## ⚙️ Environment Setup

### Environment Variables (.env)
```bash
DATABASE_URL=postgresql://localhost/puresoul
SESSION_SECRET=<REDACTED>
NODE_ENV=development
PORT=3000
APP_DOMAINS=localhost
OPENAI_API_KEY=<REDACTED>
STRIPE_SECRET_KEY=<REDACTED>
GOOGLE_CLIENT_ID=not-configured
GOOGLE_CLIENT_SECRET=not-configured
```

### Quick Start
```bash
cd ~/Downloads/PURESOUL
npm install
npm run dev
```

Server runs on: http://localhost:3000

---

## 📁 Key Files & Locations

### Server Files
```
server/
├── index.ts                        # Main server entry (dotenv import ORDER matters!)
├── db.ts                           # Database connection (exports 'pool' not 'db')
├── routes/
│   ├── analysis.ts                 # AI emotion detection routes (use 'pool')
│   ├── activities.ts               # Activities & gamification routes (use 'pool')
│   └── voiceEntries.ts            # Voice recording routes
├── services/
│   └── emotionDetection.ts        # OpenAI integration
└── db/migrations/
    ├── 001_initial.sql            # (existing)
    ├── 002_emotional_blueprints.sql
    └── 003_activities_gamification.sql
```

### Client Files
```
client/src/
├── App.tsx                         # Main router (AUTH ISSUE HERE)
├── pages/
│   ├── activities.tsx              # Activities list page
│   ├── voice-journal.tsx           # Voice recording page
│   ├── auth.tsx                    # Login/signup page (has register bug on line 286)
│   └── dashboard.tsx              # (old, replaced by EmotionalDashboard)
├── components/
│   ├── EmotionalDashboard.tsx     # Phase 2 dashboard
│   ├── voice-recorder.tsx         # Phase 1 recorder
│   └── layout/header.tsx          # Navigation
└── index.html                      # (replit script removed)
```

### Output Files (From Claude)
```
/mnt/user-data/outputs/
├── PureSoul-Implementation-Roadmap.md    # MASTER PLAN (all 10 phases)
├── SuperSoulLanding.jsx                  # Marketing landing page
├── phase2-emotionDetection.ts            # AI service (reference implementation)
├── phase2-migration.sql                  # Phase 2 database schema
├── phase2-routes-analysis.ts             # API routes (reference)
├── phase2-EmotionalDashboard.tsx         # Dashboard component (reference)
├── phase3-migration.sql                  # Phase 3 database schema ✅ APPLIED
└── COWORK-HANDOFF.md                     # This file
```

---

## 🚀 Immediate Next Steps

### 1. Fix Authentication (HIGH PRIORITY)
**Issue:** Blank pages when not authenticated

**Solution Options:**

**Option A - Add Proper Redirect:**
```typescript
// In App.tsx Router function
function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !['/auth', '/login', '/register', '/'].includes(location)) {
      setLocation('/auth');
    }
  }, [isAuthenticated, isLoading, location, setLocation]);
  
  if (isLoading) return <LoadingSpinner />;
  
  return <Switch>...</Switch>;
}
```

**Option B - Fix useAuth Hook:**
Check `client/src/hooks/useAuth.ts` - the 401 errors suggest the endpoint might be wrong:
```typescript
// Should be one of:
GET /api/auth/me
GET /api/auth/user
GET /api/user
```

### 2. Complete Activities Feature
**What's Done:**
- ✅ Database (15 activities)
- ✅ API routes
- ✅ List page (simplified version exists)

**What's Needed:**
- Activity detail page with instructions
- Timer component for timed activities
- Completion modal with rating
- Stats dashboard showing progress

**Implementation:**
```bash
# Create activity detail page
cat > client/src/pages/activity-detail.tsx << 'EOF'
# (See implementation in roadmap)
EOF

# Add route in App.tsx
<Route path="/activities/:id" element={<ActivityDetail />} />
```

### 3. Test Full User Flow
```bash
# 1. Start server
npm run dev

# 2. Create account
open http://localhost:3000/auth
# Register with username/password

# 3. Test voice journal
open http://localhost:3000/voice-journal
# Record 30 seconds of voice

# 4. Check AI analysis
# Wait ~30 seconds, then check:
open http://localhost:3000/dashboard
# Should show emotional blueprint

# 5. Try an activity
open http://localhost:3000/activities
# Click "Box Breathing" or any activity
```

---

## 📋 Phases 4-10 Roadmap

### Phase 4: Sleep & Calm Features
- Sleep stories library
- Soundscapes (rain, ocean, white noise)
- Sleep tracking
- Bedtime reminders

### Phase 5: Personalized Wellness Plans
- AI-generated daily plans
- Goal setting
- Progress tracking
- Adaptive recommendations

### Phase 6: Therapist Bridge
- Therapist matching
- Data sharing (PDF reports)
- Crisis resources
- Professional referrals

### Phase 7: Enhanced Privacy & Security
- End-to-end encryption
- Privacy controls
- GDPR compliance
- Data export/deletion

### Phase 8: Progressive Web App (PWA)
- Offline support
- Push notifications
- Install prompt
- Background sync

### Phase 9: Landing Page & Marketing
- ✅ Already created (SuperSoulLanding.jsx)
- Needs integration into main app
- SEO optimization
- Analytics setup

### Phase 10: Analytics & Insights
- User analytics dashboard
- Trend analysis
- Predictive insights
- Weekly email summaries

**Full details in:** `/mnt/user-data/outputs/PureSoul-Implementation-Roadmap.md`

---

## 🐛 Known Issues & Bugs

### 1. Auth Page Register Form (Line 286)
**Error:** `Uncaught ReferenceError: register is not defined`
**Location:** `client/src/pages/auth.tsx:286`
**Fix:** Remove duplicate `{...register("email")}` - already has `{...field}`

### 2. Database Import Error
**Error:** When using `import { db } from '../db'` - db doesn't have `.query()` method
**Fix:** Use `import { pool } from '../db'` and `pool.query()` instead
**Affected Files:**
- ✅ server/routes/activities.ts (FIXED)
- ✅ server/routes/analysis.ts (FIXED)

### 3. Replit Banner Script
**Error:** CSP violation loading replit script
**Fix:** ✅ Removed from `client/index.html`

### 4. Route Ordering
**Issue:** Catch-all `<Route component={NotFound} />` was before specific routes
**Fix:** ✅ Moved specific routes before catch-all

---

## 💡 Tips for Cowork

### Common Commands
```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# See all users
psql $DATABASE_URL -c "SELECT id, username, email FROM users;"

# Test API endpoint
curl http://localhost:3000/api/activities | jq

# Check what's running on port 3000
lsof -i :3000

# View server logs
npm run dev | grep -i error

# Restart with clean cache
rm -rf node_modules/.vite && npm run dev
```

### Important Notes
1. **Order matters:** `import 'dotenv/config'` must be FIRST line in `server/index.ts`
2. **Use pool not db:** Drizzle ORM `db` doesn't have `.query()`, use `pool.query()`
3. **Auth check:** Always verify `isAuthenticated` before rendering protected routes
4. **Console is your friend:** Check browser console (F12) for React errors

---

## 🎯 Success Criteria

You'll know everything is working when:

1. ✅ Can register/login at `/auth`
2. ✅ Dashboard shows emotional blueprint after recording voice
3. ✅ Activities page displays 15 wellness activities
4. ✅ Can click an activity and see instructions
5. ✅ AI analysis runs automatically after voice recording
6. ✅ No 401 or 500 errors in console
7. ✅ Navigation works between all pages

---

## 📞 Quick Reference

**Start Development:**
```bash
cd ~/Downloads/PURESOUL && npm run dev
```

**Database Access:**
```bash
psql postgresql://localhost/puresoul
```

**View Implementation Roadmap:**
```bash
cat /mnt/user-data/outputs/PureSoul-Implementation-Roadmap.md
```

**Test API:**
```bash
# Activities
curl http://localhost:3000/api/activities

# Current user
curl http://localhost:3000/api/user

# Today's blueprint
curl -H "Cookie: session=..." http://localhost:3000/api/blueprint/current
```

---

## 🤝 How to Ask Cowork for Help

**Good Prompts:**

1. "Fix the authentication redirect issue in PureSoul - users should be sent to /auth when not logged in"

2. "Create the activity detail page with timer component for PureSoul wellness activities"

3. "Help me implement Phase 4 (Sleep & Calm features) following the roadmap"

4. "Debug why the dashboard shows blank - check the auth flow"

5. "Set up the landing page (SuperSoulLanding.jsx) as the main home page"

**Include Context:**
- Mention this is the "PureSoul mental wellness app"
- Reference phase numbers (we're on Phase 3)
- Point to the roadmap: `/mnt/user-data/outputs/PureSoul-Implementation-Roadmap.md`

---

## ✨ Project Vision

PureSoul aims to be a premium mental wellness platform that combines:
- 🎤 Voice journaling with AI emotion detection
- 🎮 Gamified therapeutic activities
- 📊 Data-driven emotional insights
- 🌙 Sleep and relaxation features
- 👥 Bridge to professional therapy

**Market Positioning:** Premium mental health AI ($8/month) inspired by Superpower.com's biomarker testing model.

**Target Users:** Young adults (18-35) seeking preventive mental wellness and emotional intelligence.

---

## 📚 Additional Resources

- **Full Roadmap:** `/mnt/user-data/outputs/PureSoul-Implementation-Roadmap.md`
- **Landing Page:** `/mnt/user-data/outputs/SuperSoulLanding.jsx`
- **Phase 2 Files:** All `phase2-*.ts` files in outputs
- **Phase 3 Migration:** `/mnt/user-data/outputs/phase3-migration.sql`

---

**Last Updated:** February 2, 2026
**Status:** Phase 3 In Progress
**Next Milestone:** Complete Activities UI + Fix Auth System

Good luck! 🚀
