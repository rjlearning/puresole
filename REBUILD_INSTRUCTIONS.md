# Rebuild Instructions - Fix Dashboard Navigation

## Problem
Dashboard buttons are not responding to clicks due to a stale JavaScript bundle. Direct navigation works, but onClick handlers are not firing.

## Solution
Perform a clean rebuild with `--no-cache` to ensure all code changes are compiled into a fresh JavaScript bundle.

## Steps to Rebuild

### Option 1: Using the Rebuild Script (Recommended)
```bash
cd /path/to/PureSoul
./rebuild.sh
```

### Option 2: Manual Rebuild
```bash
# Stop containers
docker compose down

# Remove old images
docker compose rm -f
docker rmi puresoul-app

# Build fresh with no cache
docker compose build --no-cache app

# Start services
docker compose up -d

# Check logs
docker compose logs -f app
```

## Verification Steps

After rebuild, test the following:

1. **Login** - Navigate to http://localhost:4000 and login
2. **Dashboard Buttons** - Click each button to verify navigation:
   - ✅ Voice Journal → `/voice-journal`
   - ✅ Voice Insights → `/voice-insights`
   - ✅ Realtime Recording → `/voice-realtime`
   - ✅ Activities → `/activities`
   - ✅ Sleep & Calm → `/sleep`
   - ✅ Check-In → `/assessment`
   - ✅ Goals → `/goals`
   - ✅ Safety Plan → `/safety-plan`
   - ✅ Community → `/community`
   - ✅ Settings → `/settings`
   - ✅ Analytics → `/analytics`
   - ✅ Reports → `/reports`
   - ✅ AI Companion → `/ai-companion`
   - ✅ Therapist Portal → `/therapist-portal`
   - ✅ Medications → `/medications`
   - ✅ Integrations → `/integrations`

3. **Voice Journal Playback** - Record a voice entry and test Play/Pause buttons

## What Was Fixed

- ✅ Session cookies (secure flag for localhost)
- ✅ CORS configuration (added port 4000)
- ✅ Voice Features section in dashboard
- ✅ Play/Pause functionality for voice recordings
- ✅ Error handling for missing database tables
- ✅ All dashboard navigation buttons

## Next Steps

After verifying all routes work, we'll begin implementing the new Airtable-inspired vision:
- Phase 1: Flexible entry system with JSONB
- Timeline view with mood gradients
- QuickAdd floating button
- Pattern detection and insights engine
