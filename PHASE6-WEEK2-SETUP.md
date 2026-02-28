# Phase 6 Week 2: Wellness Reports - Setup Guide 📊

## Overview

Week 2 adds comprehensive wellness report generation with:
- **Data Aggregation** - Pull emotional trends, activities, goals, voice insights
- **Report Templates** - Pre-configured report types (weekly, monthly, therapist)
- **Report Management** - Create, view, share, delete reports
- **Share Codes** - Secure sharing with therapists via unique codes

---

## ✅ Step 1: Run Database Migration

```bash
node run-phase6week2-migration.js
```

**What This Creates:**
- ✅ `wellness_reports` table - Store generated reports
- ✅ `report_access_logs` table - Track who views reports
- ✅ `report_templates` table - 3 pre-configured templates
  - Weekly Wellness Summary
  - Monthly Progress Report
  - Therapist Report

**Expected Output:**
```
✅ Migration completed successfully!
📊 Wellness reports table created
📋 Report templates seeded: 3
🔐 Report access logs table created
```

---

## ✅ Step 2: Test Report Generation

### Test in Browser Console

```javascript
// 1. Get available report templates
fetch('/api/reports/templates')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Templates:', data.templates);
  });

// 2. Generate a weekly report (last 7 days)
const today = new Date();
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Weekly Wellness Report',
    reportType: 'weekly',
    startDate: weekAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Report Generated:', data.reportId);
  console.log('📊 Emotional Trends:', data.data.emotionalTrends);
  console.log('🎯 Activities:', data.data.activitiesCompleted);
  console.log('🏆 Goals:', data.data.goalsProgress);
  console.log('💡 Insights:', data.data.keyInsights);

  // Save report ID for next tests
  window.lastReportId = data.reportId;
});

// 3. View all your reports
fetch('/api/reports')
  .then(r => r.json())
  .then(data => {
    console.log('✅ My Reports:', data.reports);
    console.log('Total:', data.total);
  });

// 4. View specific report with full data
fetch(`/api/reports/${window.lastReportId}`)
  .then(r => r.json())
  .then(data => {
    console.log('✅ Full Report:', data.report);
  });

// 5. Generate share code
fetch(`/api/reports/${window.lastReportId}/share`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ expiresInDays: 30 })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Share Code:', data.shareCode);
  console.log('🔗 Share URL:', data.shareUrl);
  console.log('⏰ Expires:', data.expiresAt);

  window.shareCode = data.shareCode;
});

// 6. View shared report (no auth required)
fetch(`/api/reports/shared/${window.shareCode}`)
  .then(r => r.json())
  .then(data => {
    console.log('✅ Shared Report:', data.report);
  });
```

---

## 📊 What Gets Included in Reports

### Emotional Trends
- Daily mood tracking over time
- Average emotional states
- Positive vs negative emotion ratios
- Emotional patterns and trends

### Voice Insights
- Recent voice journal entries
- Key themes detected
- Mood progression
- Transcript snippets

### Activities Completed
- Total activities completed
- Breakdown by category (breathing, meditation, etc.)
- Top 5 most-completed activities
- Completion frequency

### Goals Progress
- Total goals (active, completed, in progress)
- Completion rate percentage
- Individual goal progress bars
- Achievement tracking

### Wellness Score
- **Overall Score** (0-100) - Combined health metric
- **Consistency Score** - How regularly you engage
- **Improvement Score** - Trend direction

### Crisis Indicators
- High stress/anxiety periods
- Severity levels
- Dates and descriptions
- Safety recommendations

### Key Insights
- Auto-generated observations
- Positive achievements
- Areas for improvement
- Alerts and recommendations

---

## 🎯 API Endpoints

### Report Generation
```bash
POST /api/reports/generate
{
  "title": "My Report",
  "reportType": "weekly|monthly|custom|therapist",
  "startDate": "2026-01-01",
  "endDate": "2026-01-07"
}
```

### List Reports
```bash
GET /api/reports
GET /api/reports?status=ready
GET /api/reports?reportType=weekly
GET /api/reports?limit=10&offset=0
```

### Get Single Report
```bash
GET /api/reports/:id
```

### Delete Report
```bash
DELETE /api/reports/:id
```

### Share Report
```bash
POST /api/reports/:id/share
{
  "expiresInDays": 30
}
```

### View Shared Report (Public)
```bash
GET /api/reports/shared/:shareCode
```

### Get Templates
```bash
GET /api/reports/templates
```

---

## 📋 Report Templates

### 1. Weekly Wellness Summary
- **Duration**: 7 days
- **Sections**: Emotional trends, voice insights, activities, goals, crisis indicators
- **Best For**: Regular check-ins, tracking weekly progress

### 2. Monthly Progress Report
- **Duration**: 30 days
- **Sections**: Monthly overview, patterns, trends, achievements, wellness score
- **Best For**: Comprehensive monthly reviews, identifying long-term patterns

### 3. Therapist Report
- **Duration**: 30 days
- **Sections**: Patient summary, timeline, crisis events, transcripts, safety plan
- **Best For**: Sharing with mental health professionals
- **Privacy**: Includes detailed information, use with trusted providers only

---

## 🔐 Sharing & Privacy

### Share Codes
- **Unique 12-character codes** (e.g., `XJKL83ND9PAQ`)
- **Expiration**: 30 days default (customizable)
- **Access**: Anyone with the code can view
- **Tracking**: All views are logged with IP and timestamp

### Access Logs
Every report view is tracked:
- Access type (view, download, share)
- Accessor type (user, therapist, anonymous)
- IP address
- User agent
- Timestamp

### Best Practices
1. ✅ Only share reports with trusted individuals
2. ✅ Set appropriate expiration dates
3. ✅ Revoke access by deleting the report
4. ✅ Review access logs regularly
5. ❌ Never share codes publicly

---

## 🧪 Testing Checklist

### Backend API Tests
- [ ] Templates endpoint returns 3 templates
- [ ] Report generation succeeds with valid date range
- [ ] Report generation fails with invalid dates
- [ ] Generated report contains all sections
- [ ] List reports returns user's reports only
- [ ] Get report by ID requires authentication
- [ ] Delete report removes from database
- [ ] Share code generation is unique
- [ ] Shared reports accessible without auth
- [ ] Expired share codes return 404
- [ ] Access logs record all views

### Data Validation
- [ ] Emotional trends show correct date range
- [ ] Activities stats match database records
- [ ] Goals progress calculates correctly
- [ ] Wellness score is 0-100
- [ ] Crisis indicators detect high stress

---

## 🚀 Next Steps (Week 2 Continued)

### PDF Generation (Next)
- [ ] Install PDF generation library (pdfkit or puppeteer)
- [ ] Create PDF templates with styling
- [ ] Generate PDF on report creation
- [ ] Store PDF URL in database
- [ ] Add download endpoint

### Report UI (Next)
- [ ] Create reports list page
- [ ] Create report preview page
- [ ] Add charts and visualizations
- [ ] Implement share modal
- [ ] Add download button

---

## 🐛 Troubleshooting

**"Report generated but data is empty"**
→ Make sure you have voice entries, activities, and goals in the date range
→ Create some test data first

**"Report generation takes too long"**
→ Database queries might be slow on large datasets
→ Consider adding more indexes or pagination

**"Share code already exists"**
→ Very rare collision - code generation will retry automatically
→ If persists, check uniqueness constraint on share_code

**"Cannot read property 'map' of undefined"**
→ Some data might not exist for the user
→ Report generation handles this gracefully with empty arrays

---

## 📊 Sample Report Data Structure

```json
{
  "emotionalTrends": {
    "dates": ["2026-01-01", "2026-01-02", "2026-01-03"],
    "emotions": {
      "happy": [2, 3, 1],
      "anxious": [1, 0, 2]
    },
    "averages": {
      "happy": 2.0,
      "anxious": 1.0
    }
  },
  "voiceInsights": [
    {
      "date": "2026-01-03",
      "mood": "calm",
      "keyThemes": ["work", "sleep"],
      "transcriptSnippet": "Today was a good day..."
    }
  ],
  "activitiesCompleted": {
    "total": 15,
    "byCategory": {
      "breathing": 5,
      "meditation": 3,
      "journaling": 7
    },
    "topActivities": [
      { "name": "Box Breathing", "count": 5 }
    ]
  },
  "goalsProgress": {
    "totalGoals": 3,
    "completed": 1,
    "inProgress": 2,
    "completionRate": 33.33,
    "goals": [
      {
        "title": "Meditate daily",
        "status": "in_progress",
        "progress": 60
      }
    ]
  },
  "wellnessScore": {
    "overall": 75,
    "consistency": 80,
    "improvement": 65
  },
  "crisisIndicators": [],
  "keyInsights": [
    {
      "type": "positive",
      "title": "High Activity Engagement",
      "description": "You completed 15 wellness activities this week!",
      "severity": "low"
    }
  ]
}
```

---

**Phase 6 Week 2 Backend is READY!** 📊💚

Next: PDF generation and report UI
