# PureSoul: Complete Startup & Validation Guide

## 🚀 Step-by-Step Service Startup & Testing

**Date:** February 10, 2026
**Purpose:** Complete guide to start all services and validate Phase IV functionality

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] PostgreSQL installed and running
- [ ] Node.js v18+ installed
- [ ] npm dependencies installed
- [ ] Database created (`puresoul_dev`)
- [ ] Environment variables configured

---

## Step 1: Stop All Running Services

```bash
# Stop any existing services
pkill -f "npm run dev" || true
pkill -f "tsx server" || true
pkill -f "node.*PureSoul" || true

# Verify nothing is running
ps aux | grep -E "npm|tsx|node" | grep -v grep
```

**Expected:** No PureSoul processes running

---

## Step 2: Verify PostgreSQL Database

### 2.1 Check PostgreSQL Status

```bash
# Check if PostgreSQL is running
pg_isready

# Expected output:
# /tmp:5432 - accepting connections
```

### 2.2 Connect to Database

```bash
# Connect to the database
psql -d puresoul_dev

# Or if you need to specify user
psql -U postgres -d puresoul_dev
```

### 2.3 Verify Database Tables

```sql
-- Check all tables exist
\dt

-- Should see these tables (among others):
-- - voice_recordings
-- - voice_analyses
-- - voice_user_baselines (Phase IV)
-- - voice_predictions (Phase IV)
-- - user_insights (Phase IV enhanced)
-- - analytics_exports (Phase IV)

-- Exit psql
\q
```

**Expected:** All core tables and Phase IV tables present

---

## Step 3: Run Database Migrations

### 3.1 Check Current Migration Status

```bash
cd /sessions/exciting-wizardly-goldberg/mnt/PureSoul

# List migration files
ls -la server/db/migrations/

# Should see:
# - 016_voice_realtime_sessions.sql (Phase III)
# - phase4-analytics.sql (Phase IV)
```

### 3.2 Run Phase III Migration (if not done)

```bash
# Check if Phase III table exists
psql -d puresoul_dev -c "\d voice_realtime_sessions"

# If table doesn't exist, run migration
node scripts/fixPhase3Migration.cjs
```

**Expected Output:**
```
✓ Database connection successful
✓ Phase 3 migration completed successfully
✓ Table voice_realtime_sessions created
```

### 3.3 Run Phase IV Migration (if not done)

```bash
# Check if Phase IV tables exist
psql -d puresoul_dev -c "\d voice_user_baselines"

# If tables don't exist, run migration
node scripts/runPhase4Migration.cjs
```

**Expected Output:**
```
✓ Phase 4 migration completed successfully
✓ Created 4 tables
✓ Created 13 indexes
```

### 3.4 Verify All Tables

```bash
# Verify Phase IV tables
psql -d puresoul_dev << EOF
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'voice_user_baselines',
  'voice_predictions',
  'analytics_exports',
  'user_insights'
)
ORDER BY table_name;
EOF
```

**Expected:** All 4 tables listed

---

## Step 4: Install/Verify Dependencies

### 4.1 Check Node Modules

```bash
cd /sessions/exciting-wizardly-goldberg/mnt/PureSoul

# Check if node_modules exists
ls -la node_modules/ | head -10

# If missing or corrupted, reinstall
# npm install
```

### 4.2 Verify Critical Packages

```bash
# Check Phase IV dependencies
npm list recharts framer-motion lucide-react pdfkit

# Expected: All packages listed with versions
```

### 4.3 Verify TypeScript Compilation

```bash
# Check for TypeScript errors (optional)
npm run check

# Note: Some errors are expected in development
# The build process will handle them correctly
```

---

## Step 5: Start the Development Server

### 5.1 Start Server on Port 4000

```bash
cd /sessions/exciting-wizardly-goldberg/mnt/PureSoul

# Start in foreground (recommended for testing)
PORT=4000 npm run dev

# Alternative: Start in background
# PORT=4000 npm run dev > logs/dev.log 2>&1 &
```

### 5.2 Watch Startup Logs

**Expected Startup Sequence:**

```
> puresoul@1.0.0 dev
> NODE_ENV=development tsx server/index.ts

[Server] Starting PureSoul server...
[Database] Connecting to PostgreSQL...
[Database] ✓ Connected successfully
[Routes] Registering API routes...
[Routes] ✓ Auth routes registered
[Routes] ✓ Voice routes registered
[Routes] ✓ Analytics routes registered
[Routes] ✓ Advanced analytics routes registered (Phase IV)
[Server] ✓ Server listening on port 4000
[Server] → http://localhost:4000
```

### 5.3 Verify Server is Running

```bash
# In a new terminal
curl http://localhost:4000/health

# Expected: {"status":"ok","timestamp":"..."}
```

**✅ Checkpoint:** Server is running successfully

---

## Step 6: Validate Backend Services

### 6.1 Test Authentication (Required First)

```bash
# Register a test user (if needed)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "fullName": "Test User"
  }'

# Login to get session cookie
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' \
  -c cookies.txt

# cookies.txt now contains your session cookie
```

**Expected:** Login successful, cookie saved

### 6.2 Test Phase IV: Baselines API

```bash
# Get baselines (may be empty initially)
curl -X GET http://localhost:4000/api/advanced-analytics/baselines \
  -b cookies.txt

# Expected response:
# {"success":true,"baselines":[],"message":"..."}

# Calculate baselines (requires ≥14 voice recordings)
curl -X POST http://localhost:4000/api/advanced-analytics/baselines/calculate \
  -b cookies.txt

# Expected response:
# {"success":true,"baselines":[...],"message":"Baselines calculated"}
# OR
# {"success":false,"message":"Insufficient data (need 14+ recordings)"}

# Get deviation alerts
curl -X GET "http://localhost:4000/api/advanced-analytics/baselines/deviations?days=7" \
  -b cookies.txt

# Expected response:
# {"success":true,"deviations":[...],"count":...}
```

**✅ Test Result:**
- [ ] Baselines API responds without errors
- [ ] Returns empty or populated baselines
- [ ] Handles insufficient data gracefully

### 6.3 Test Phase IV: Predictions API

```bash
# Get predictions
curl -X GET http://localhost:4000/api/advanced-analytics/predictions \
  -b cookies.txt

# Expected response:
# {"success":true,"predictions":[...],"cached":false}

# Generate new predictions
curl -X POST http://localhost:4000/api/advanced-analytics/predictions/generate \
  -b cookies.txt

# Expected response:
# {"success":true,"predictions":[...],"message":"Predictions generated"}
# OR
# {"success":false,"message":"Insufficient data..."}
```

**✅ Test Result:**
- [ ] Predictions API responds without errors
- [ ] Generates predictions with sufficient data
- [ ] Handles insufficient data gracefully

### 6.4 Test Phase IV: Insights API

```bash
# Get insights
curl -X GET "http://localhost:4000/api/advanced-analytics/insights?limit=10" \
  -b cookies.txt

# Expected response:
# {"success":true,"insights":[...],"total":...}

# Generate new insights
curl -X POST http://localhost:4000/api/advanced-analytics/insights/generate \
  -b cookies.txt

# Expected response:
# {"success":true,"insights":[...],"message":"Insights generated"}
```

**✅ Test Result:**
- [ ] Insights API responds without errors
- [ ] Returns insights array (empty or populated)
- [ ] Generates new insights successfully

### 6.5 Test Phase IV: Correlations API

```bash
# Get correlations
curl -X GET http://localhost:4000/api/advanced-analytics/correlations \
  -b cookies.txt

# Expected response:
# {"success":true,"correlations":[...],"significantCount":...}

# Get optimal lag analysis
curl -X GET http://localhost:4000/api/advanced-analytics/correlations/optimal-lag \
  -b cookies.txt

# Expected response:
# {"success":true,"lagAnalysis":[...],...}
```

**✅ Test Result:**
- [ ] Correlations API responds without errors
- [ ] Returns correlation data
- [ ] Lag analysis works correctly

### 6.6 Test Phase IV: Export API

```bash
# Generate PDF export
curl -X POST http://localhost:4000/api/advanced-analytics/reports/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "format": "pdf",
    "reportType": "comprehensive",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-02-10T00:00:00Z"
  }'

# Expected response:
# {"success":true,"export":{"id":"...","downloadUrl":"...","fileSizeKB":...}}

# Save the export ID from response, then download
# Replace EXPORT_ID with actual ID from response
curl -X GET "http://localhost:4000/api/advanced-analytics/reports/EXPORT_ID/download" \
  -b cookies.txt \
  --output test-report.pdf

# Verify file was downloaded
ls -lh test-report.pdf
```

**✅ Test Result:**
- [ ] Export generation succeeds
- [ ] Download URL is provided
- [ ] File downloads successfully
- [ ] PDF opens without errors

---

## Step 7: Validate Frontend Integration

### 7.1 Open Application in Browser

```bash
# Open in default browser
open http://localhost:4000

# Or manually navigate to:
# http://localhost:4000
```

### 7.2 Test Login Flow

1. Navigate to login page
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `testpass123`
3. Click "Sign In"

**Expected:** Redirects to dashboard

### 7.3 Navigate to Analytics

1. Look at left sidebar
2. Find "Analytics" menu item
3. **Verify:** "NEW" badge is visible
4. Click "Analytics"

**Expected:** Analytics page loads

### 7.4 Test Tab Switcher

1. Verify "Overview" tab is active (blue)
2. Verify "Advanced Analytics" tab is visible (purple)
3. Click "Advanced Analytics" tab
4. **Verify:** Smooth transition
5. Click "Overview" tab
6. Click back to "Advanced Analytics"

**Expected:** Seamless tab switching

### 7.5 Test Overview Tab Components

**While in Overview tab:**

- [ ] Mood Trends section displays
- [ ] Week/Month/Quarter toggles work
- [ ] Line chart renders
- [ ] Calendar heatmap displays
- [ ] Activity correlations show
- [ ] Mood predictions display
- [ ] Insights section works
- [ ] Recommendations appear

**Expected:** All existing analytics work normally

### 7.6 Test Advanced Analytics Tab

**Switch to Advanced Analytics tab:**

#### A. Baseline Visualization Component

- [ ] "Personalized Baseline" section visible
- [ ] 30/60/90-day tabs present
- [ ] Click each tab - data updates
- [ ] If no data: Empty state with message
- [ ] If data exists: 4 metric cards display
- [ ] Deviation alerts show (if applicable)
- [ ] Confidence badge displays

**Expected Scenarios:**

**Scenario 1: Insufficient Data (<14 recordings)**
```
Message: "No Baseline Data Yet"
Description: "Continue recording voice entries to establish your
             personalized baseline. We need at least 14 recordings..."
```

**Scenario 2: Sufficient Data (≥14 recordings)**
```
Display:
- Wellness Score: 72.3 ± 8.5
- Valence: 0.65 ± 0.12
- Arousal: 0.58 ± 0.15
- Dominance: 0.71 ± 0.11

Confidence: "Good Confidence" badge

Recent Deviations:
- [Deviation cards with z-scores if applicable]
```

#### B. Predictive Forecasts Component

- [ ] "Wellness Forecast" section visible
- [ ] 7/14/30-day tabs present
- [ ] Click each tab - chart updates
- [ ] Chart renders with Recharts
- [ ] Hover over points - tooltip appears
- [ ] Confidence interval bands visible
- [ ] "Update" button present
- [ ] Click "Update" - generates new predictions
- [ ] Model quality badge displays

**Expected Scenarios:**

**Scenario 1: No Predictions**
```
Message: "No Predictions Available"
Button: "Generate Predictions"
Click: Generates first predictions
```

**Scenario 2: Predictions Exist**
```
Display:
- Interactive line chart
- Blue line (predicted wellness)
- Shaded area (95% confidence interval)
- Hover tooltips with details
- Model quality badge (R²)
```

#### C. Advanced Insights Panel Component

- [ ] "Advanced Insights" section visible
- [ ] Insight cards display (or empty state)
- [ ] Priority sorting works
- [ ] Click "Filters" dropdown
- [ ] Toggle insight types - filters work
- [ ] Click "Pinned Only" - filters work
- [ ] Expand an insight - action items show
- [ ] Check off actions - completion tracks
- [ ] Related metrics display

**Expected Scenarios:**

**Scenario 1: No Insights**
```
Message: "No Advanced Insights Yet"
Description: "Continue recording voice entries and tracking
             wellness metrics to receive personalized insights."
```

**Scenario 2: Insights Exist**
```
Display:
- Insight cards with icons
- Urgency badges (High/Medium/Low)
- Confidence percentages
- Expandable action items
- Checkboxes for actions
- Filter controls working
```

#### D. Export Modal Component

- [ ] Click "Export Data" button in header
- [ ] Modal opens smoothly
- [ ] Three format options visible (PDF/CSV/JSON)
- [ ] Four report types visible
- [ ] Date pickers work
- [ ] Click quick date shortcuts (7/30/90 days)
- [ ] Click "Generate Export"
- [ ] Progress indicator appears
- [ ] Success message displays
- [ ] File size shown
- [ ] Click "Download File"
- [ ] File downloads
- [ ] Open downloaded file - verifies format

**Expected Flow:**

```
1. Click "Export Data"
   → Modal opens

2. Select "PDF Report"
   → Radio button selected

3. Choose "Comprehensive Report"
   → Report type selected

4. Click "Last 30 Days"
   → Dates auto-filled

5. Click "Generate Export"
   → Progress: "Generating your report..."
   → Success: "Report generated successfully!"
   → Shows: "File size: 245 KB"

6. Click "Download File"
   → File downloads as puresoul-report-[timestamp].pdf

7. Open PDF
   → Displays formatted report with data
```

---

## Step 8: Browser Console Validation

### 8.1 Open Developer Tools

**Chrome/Edge:** Press `F12` or `Ctrl+Shift+I`
**Firefox:** Press `F12`
**Safari:** Enable Developer Menu, then press `Cmd+Opt+I`

### 8.2 Check Console for Errors

**Navigate through each section and check:**

- [ ] No red errors in console
- [ ] API calls succeed (Network tab)
- [ ] React warnings acceptable (not errors)
- [ ] No failed resource loads

**Expected:** Clean console or only minor warnings

### 8.3 Check Network Tab

**While on Advanced Analytics tab:**

1. Open Network tab
2. Refresh page
3. Filter by `XHR/Fetch`

**Expected API Calls:**
```
GET /api/advanced-analytics/baselines → 200 OK
GET /api/advanced-analytics/predictions → 200 OK
GET /api/advanced-analytics/insights?limit=20 → 200 OK
```

**Verify Response Times:**
- Baselines: <300ms
- Predictions: <300ms
- Insights: <500ms

---

## Step 9: Responsive Design Testing

### 9.1 Test Desktop View (1920x1080)

**Verify:**
- [ ] All components visible
- [ ] Charts render full-width
- [ ] No horizontal scrolling
- [ ] Proper spacing between sections

### 9.2 Test Tablet View (768x1024)

**Open DevTools → Toggle Device Toolbar → Select iPad**

**Verify:**
- [ ] Components stack appropriately
- [ ] 2-column grids work
- [ ] Charts resize correctly
- [ ] Modal fits screen

### 9.3 Test Mobile View (375x667)

**Select iPhone SE or similar**

**Verify:**
- [ ] Single-column layout
- [ ] Tab switcher works
- [ ] Charts readable
- [ ] Modal scrollable
- [ ] Export button accessible

---

## Step 10: Performance Testing

### 10.1 Measure Page Load Time

**Open DevTools → Performance tab:**

1. Click "Record"
2. Navigate to Analytics → Advanced Analytics
3. Stop recording

**Expected Metrics:**
- FCP (First Contentful Paint): <1.5s
- LCP (Largest Contentful Paint): <2.5s
- TTI (Time to Interactive): <3.0s

### 10.2 Test Chart Rendering

**Measure Recharts performance:**

1. Switch between 7/14/30-day tabs rapidly
2. Charts should update smoothly
3. No lag or freezing

**Expected:** Smooth transitions <300ms

### 10.3 Test API Response Caching

```bash
# First request (cold)
time curl -X GET http://localhost:4000/api/advanced-analytics/baselines \
  -b cookies.txt

# Second request (cached)
time curl -X GET http://localhost:4000/api/advanced-analytics/baselines \
  -b cookies.txt

# Expected: Second request faster (cache hit)
```

---

## Step 11: Error Handling Testing

### 11.1 Test Network Disconnection

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Click "Advanced Analytics" tab
4. Wait for components to load

**Expected:**
- Error messages display
- No crashes
- Helpful error text
- Retry options available

5. Set throttling back to "Online"
6. Refresh or retry

**Expected:** Data loads successfully

### 11.2 Test Insufficient Data Scenario

**If you don't have 14+ voice recordings:**

1. Navigate to Advanced Analytics
2. Observe empty states

**Expected Messages:**

**Baselines:**
```
"No Baseline Data Yet"
"We need at least 14 recordings to calculate reliable baselines."
```

**Predictions:**
```
"No Predictions Available"
Button: "Generate Predictions"
```

**Insights:**
```
"No Advanced Insights Yet"
```

### 11.3 Test API Error Handling

```bash
# Test with invalid date range
curl -X POST http://localhost:4000/api/advanced-analytics/reports/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "format": "pdf",
    "reportType": "comprehensive",
    "startDate": "invalid-date",
    "endDate": "2026-02-10"
  }'

# Expected: 400 Bad Request with error message
```

---

## Step 12: Database Validation

### 12.1 Check Data Persistence

```sql
-- Connect to database
psql -d puresoul_dev

-- Check if baselines are being saved
SELECT
  user_id,
  window_days,
  baseline_wellness_score,
  baseline_confidence,
  data_point_count,
  last_updated_at
FROM voice_user_baselines
ORDER BY last_updated_at DESC
LIMIT 5;

-- Check if predictions are being saved
SELECT
  user_id,
  prediction_window,
  predicted_wellness_score,
  confidence_score,
  r_squared,
  generated_at
FROM voice_predictions
ORDER BY generated_at DESC
LIMIT 5;

-- Check if insights are being saved
SELECT
  id,
  user_id,
  insight_type,
  title,
  urgency_level,
  priority_score,
  created_at
FROM user_insights
WHERE insight_type IN ('baseline_deviation', 'trend_alert', 'recommendation')
ORDER BY created_at DESC
LIMIT 5;

-- Check if exports are being saved
SELECT
  id,
  user_id,
  format,
  report_type,
  file_size_kb,
  status,
  generated_at
FROM analytics_exports
ORDER BY generated_at DESC
LIMIT 5;

-- Exit
\q
```

**Expected:** Data rows present for each table after API usage

### 12.2 Verify Indexes

```sql
psql -d puresoul_dev << EOF
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'voice_user_baselines',
  'voice_predictions',
  'user_insights',
  'analytics_exports'
)
ORDER BY tablename, indexname;
EOF
```

**Expected:** 13 indexes across Phase IV tables

---

## Step 13: Log Analysis

### 13.1 Check Server Logs

```bash
# If running in foreground, check terminal output

# If running in background:
tail -100 logs/dev.log

# Look for:
# - [INFO] messages (normal operations)
# - [WARN] messages (review but likely okay)
# - [ERROR] messages (investigate)
```

### 13.2 Check for Critical Errors

```bash
# Search for errors in logs
grep -i "error" logs/dev.log | tail -20

# Search for database errors
grep -i "database error" logs/dev.log

# Search for API errors
grep -i "api error" logs/dev.log
```

**Expected:** No critical errors, only minor warnings if any

---

## ✅ Final Validation Checklist

### Backend Services
- [ ] PostgreSQL running and accessible
- [ ] All migrations completed successfully
- [ ] Dev server starts without errors
- [ ] Health endpoint responds
- [ ] Authentication works
- [ ] Baselines API functional
- [ ] Predictions API functional
- [ ] Insights API functional
- [ ] Correlations API functional
- [ ] Export API functional

### Frontend Components
- [ ] Analytics page loads
- [ ] Tab switcher works
- [ ] "NEW" badge visible in navigation
- [ ] BaselineVisualization renders
- [ ] PredictiveForecasts renders
- [ ] AdvancedInsightsPanel renders
- [ ] ExportModal opens and works
- [ ] No console errors
- [ ] Network requests succeed

### Data & Persistence
- [ ] Database tables exist
- [ ] Indexes created
- [ ] Data persists after operations
- [ ] Caching works correctly

### Performance
- [ ] Page loads <2s
- [ ] API responses <500ms
- [ ] Charts render smoothly
- [ ] No memory leaks

### Responsive Design
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)

### Error Handling
- [ ] Offline mode handled
- [ ] Insufficient data handled
- [ ] API errors displayed gracefully
- [ ] Empty states show correctly

---

## 🎊 SUCCESS CRITERIA

Phase IV is fully operational when **ALL** of the following are true:

✅ Server starts without errors
✅ All 12 API endpoints respond correctly
✅ All 4 frontend components render
✅ Tab switching works smoothly
✅ Export generation succeeds
✅ Data persists in database
✅ No console errors in browser
✅ Responsive across all devices

---

## 🐛 Troubleshooting Quick Reference

### Issue: Server won't start
```bash
# Check port availability
lsof -i :4000

# Kill process if needed
kill -9 <PID>

# Try different port
PORT=4001 npm run dev
```

### Issue: Database connection fails
```bash
# Check PostgreSQL status
pg_isready

# Restart PostgreSQL
brew services restart postgresql
# OR
sudo systemctl restart postgresql
```

### Issue: Migrations fail
```bash
# Reset database (WARNING: deletes data)
psql -d puresoul_dev -c "DROP TABLE IF EXISTS voice_user_baselines CASCADE;"

# Re-run migrations
node scripts/runPhase4Migration.cjs
```

### Issue: Components not rendering
```bash
# Clear node modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: API returns 401 Unauthorized
```bash
# Login again and save cookie
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt
```

---

## 📞 Getting Help

If issues persist:

1. **Check Documentation:**
   - `/PHASE4_DEPLOYMENT_GUIDE.md`
   - `/PHASE4_INTEGRATION_COMPLETE.md`

2. **Review Logs:**
   - Server logs: `logs/dev.log`
   - Browser console
   - Network tab in DevTools

3. **Verify Prerequisites:**
   - PostgreSQL running
   - Correct Node version
   - All migrations completed

---

**Guide Created:** February 10, 2026
**Status:** Ready for Use
**Phase:** IV - Advanced Analytics Validation

🎯 **Follow this guide step-by-step to ensure complete Phase IV functionality!**
