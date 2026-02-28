# Phase 6: Therapist Bridge - Implementation Plan

## 🎯 Overview

Phase 6 transforms PureSoul from a solo wellness tool into a bridge to professional mental health care. Users can find therapists, share their wellness data securely, access crisis resources, and generate professional reports.

## 🎨 Key Features

### 1. Crisis Resources & Hotlines
**Priority: HIGHEST** - Immediate safety feature

- Prominent crisis button in UI
- List of crisis hotlines by country/region
- Chat bot for crisis assessment
- Immediate professional contact options
- Safety planning tools

### 2. Wellness Reports (PDF Export)
**Priority: HIGH** - Core sharing feature

- Generate comprehensive wellness report
- Include emotional trends, activities completed, mood patterns
- Professional formatting for therapist review
- Exportable as PDF
- Privacy controls (what to share)

### 3. Therapist Directory
**Priority: MEDIUM** - Professional connection

- Browse therapists by specialty
- Filter by: insurance, location, modality (online/in-person)
- Therapist profiles with credentials
- Book consultation requests
- Integration with external directories (Psychology Today, etc.)

### 4. Data Sharing Permissions
**Priority: MEDIUM** - Privacy & control

- Granular sharing controls
- Time-limited access codes
- Share specific date ranges
- Revoke access anytime
- Audit log of who accessed what

## 📊 Database Schema

```sql
-- Crisis Resources
CREATE TABLE crisis_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  country_code VARCHAR(2) NOT NULL,
  region VARCHAR(100),

  resource_type VARCHAR(50) NOT NULL, -- 'hotline', 'text', 'chat', 'emergency'
  name VARCHAR(255) NOT NULL,
  description TEXT,

  phone VARCHAR(50),
  sms_number VARCHAR(50),
  website_url VARCHAR(500),
  chat_url VARCHAR(500),

  available_24_7 BOOLEAN DEFAULT false,
  languages JSONB,

  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Therapist Profiles (optional - could integrate with external API)
CREATE TABLE therapist_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  credentials VARCHAR(100), -- 'PhD', 'PsyD', 'LCSW', 'LMFT', etc.

  specialties JSONB, -- ['anxiety', 'depression', 'trauma', 'relationships']
  modalities JSONB, -- ['CBT', 'DBT', 'EMDR', 'psychodynamic']

  accepts_insurance BOOLEAN DEFAULT false,
  insurance_providers JSONB,

  location_address TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  location_country VARCHAR(2),

  offers_online BOOLEAN DEFAULT false,
  offers_in_person BOOLEAN DEFAULT false,

  bio TEXT,
  profile_image_url VARCHAR(500),
  website_url VARCHAR(500),

  is_accepting_patients BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wellness Reports (generated PDFs)
CREATE TABLE wellness_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom', 'therapist_share'
  title VARCHAR(255) NOT NULL,

  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,

  -- Report contents
  included_sections JSONB, -- ['mood_trends', 'activities', 'voice_entries', 'goals']
  report_data JSONB, -- Snapshot of data at generation time

  -- PDF generation
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMP,
  pdf_expires_at TIMESTAMP,

  -- Sharing
  is_shareable BOOLEAN DEFAULT false,
  share_code VARCHAR(50) UNIQUE,
  share_expires_at TIMESTAMP,
  share_access_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Report Access Log (who viewed shared reports)
CREATE TABLE report_access_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  report_id VARCHAR NOT NULL REFERENCES wellness_reports(id) ON DELETE CASCADE,

  accessed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT,

  access_method VARCHAR(50), -- 'share_code', 'therapist_portal', 'direct_link'
  viewer_identifier VARCHAR(255) -- email or therapist ID if available
);

-- Therapist Connections (users connected to therapists)
CREATE TABLE user_therapist_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  therapist_name VARCHAR(255) NOT NULL,
  therapist_email VARCHAR(255),
  therapist_credentials VARCHAR(100),

  relationship_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'ended'

  -- Data sharing preferences
  auto_share_reports BOOLEAN DEFAULT false,
  shared_sections JSONB, -- What data they can see

  connected_at TIMESTAMP DEFAULT NOW(),
  last_shared_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Safety Plans (crisis prevention)
CREATE TABLE safety_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  warning_signs JSONB, -- List of personal warning signs
  coping_strategies JSONB, -- Internal coping methods
  distraction_activities JSONB, -- Things that help distract

  support_contacts JSONB, -- [{name, phone, relationship}]
  professional_contacts JSONB, -- Therapist, doctor contacts

  safe_environment_steps JSONB, -- How to make environment safe
  reasons_to_live JSONB, -- Personal reasons for living

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Routes

### Crisis Resources

```typescript
// GET /api/crisis/resources?country=US
// Get crisis resources for user's location

// GET /api/crisis/assess
// Get crisis assessment questionnaire

// POST /api/crisis/alert
// Send crisis alert to designated contacts
```

### Wellness Reports

```typescript
// POST /api/reports/generate
// Generate wellness report
// Body: { dateStart, dateEnd, sections, shareCode? }

// GET /api/reports
// List user's reports

// GET /api/reports/:id
// Get specific report

// GET /api/reports/:id/download
// Download PDF

// POST /api/reports/:id/share
// Generate share code for report
// Body: { expiresIn, allowedEmails? }

// DELETE /api/reports/:id/share
// Revoke share access
```

### Public Report Access

```typescript
// GET /api/public/report/:shareCode
// View shared report (no auth required)
// Logs access for security
```

### Therapist Directory

```typescript
// GET /api/therapists/search
// Search therapists
// Query: ?specialty=anxiety&location=90210&insurance=bcbs

// GET /api/therapists/:id
// Get therapist profile

// POST /api/therapists/request-consultation
// Request consultation with therapist
// Body: { therapistId, message, preferredTimes }
```

## 📱 UI Components

### 1. Crisis Support Page (`/crisis-support`)

```
┌──────────────────────────────────────────────┐
│  ⚠️ Crisis Support & Resources               │
├──────────────────────────────────────────────┤
│  If you're in immediate danger, call 911    │
│                                              │
│  🆘 EMERGENCY HOTLINES                       │
│  ┌────────────────────────────────────────┐ │
│  │ 988 - Suicide & Crisis Lifeline        │ │
│  │ Available 24/7 • Call or Text          │ │
│  │ [Call Now] [Text]                      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 741741 - Crisis Text Line              │ │
│  │ Text HELLO to get started              │ │
│  │ [Text Now]                             │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  🏥 PROFESSIONAL HELP                        │
│  • Find a Therapist Near You                │
│  • Online Therapy Options                   │
│  • Support Groups                           │
│                                              │
│  📋 SAFETY TOOLS                             │
│  • Create Safety Plan                       │
│  • Coping Strategies                        │
│  • Grounding Techniques                     │
└──────────────────────────────────────────────┘
```

### 2. Generate Report Modal

```
┌──────────────────────────────────────────────┐
│  📊 Generate Wellness Report                 │
├──────────────────────────────────────────────┤
│  Time Period:                                │
│  ○ Last 7 days                               │
│  ○ Last 30 days                              │
│  ● Custom range                              │
│     [Jan 1, 2026] to [Feb 4, 2026]          │
│                                              │
│  Include in Report:                          │
│  ☑ Mood trends & patterns                    │
│  ☑ Activities completed                      │
│  ☑ Voice journal summaries                   │
│  ☑ Goals progress                            │
│  ☐ Voice transcripts (full text)             │
│                                              │
│  Share with Therapist:                       │
│  ☐ Generate share code                       │
│     (Valid for 30 days)                      │
│                                              │
│  [Cancel] [Generate Report]                  │
└──────────────────────────────────────────────┘
```

### 3. Reports Dashboard (`/reports`)

```
┌──────────────────────────────────────────────┐
│  📊 My Wellness Reports                      │
│  [+ Generate New Report]                     │
├──────────────────────────────────────────────┤
│  Recent Reports                              │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📄 January 2026 Summary                │ │
│  │ Jan 1 - Jan 31 • Generated Feb 1       │ │
│  │ Includes: Mood, Activities, Goals      │ │
│  │ Shared: Yes (expires Feb 28)           │ │
│  │ [Download PDF] [View] [Share]          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📄 Therapist Consultation Report       │ │
│  │ Dec 15 - Jan 15 • Generated Jan 20     │ │
│  │ Includes: Full data                    │ │
│  │ Shared: No                             │ │
│  │ [Download PDF] [View] [Share]          │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4. Therapist Search (`/find-therapist`)

```
┌──────────────────────────────────────────────┐
│  🔍 Find a Therapist                         │
├──────────────────────────────────────────────┤
│  Specialty: [Anxiety ▼]                      │
│  Location: [90210      ]                     │
│  Insurance: [Blue Cross▼]                    │
│  Type: ☑ Online  ☑ In-person                │
│                                              │
│  [Search]                                    │
├──────────────────────────────────────────────┤
│  Results (24)                                │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 👤 Dr. Sarah Johnson, PhD              │ │
│  │ Licensed Clinical Psychologist         │ │
│  │ Specialties: Anxiety, Depression, CBT  │ │
│  │ 📍 Los Angeles, CA • Online available  │ │
│  │ ✓ Accepting patients                   │ │
│  │ [View Profile] [Request Consultation]  │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## 🔐 Security & Privacy

### Report Sharing Security

1. **Share Codes**
   - Cryptographically secure random codes
   - Time-limited (default 30 days, max 90)
   - Revocable at any time
   - Single-use or multi-use option

2. **Access Logging**
   - Log every report view
   - Track IP address and timestamp
   - Show user who accessed their data
   - Email notification on first access

3. **Data Minimization**
   - Users choose what to include
   - Option to anonymize voice transcripts
   - Exclude sensitive personal info

### HIPAA Considerations

**Note:** Full HIPAA compliance requires:
- Business Associate Agreements with hosting provider
- Encryption at rest and in transit
- Audit trails
- Data backup procedures
- Breach notification procedures

This implementation provides HIPAA-ready architecture but legal compliance requires additional business processes.

## 📄 PDF Report Generation

Use a library like `pdfkit` or `react-pdf`:

```typescript
import PDFDocument from 'pdfkit';

async function generateWellnessReport(
  userId: string,
  dateStart: Date,
  dateEnd: Date,
  sections: string[]
) {
  // Fetch data
  const moodData = await getMoodTrends(userId, dateStart, dateEnd);
  const activities = await getCompletedActivities(userId, dateStart, dateEnd);
  const goals = await getGoalsProgress(userId, dateStart, dateEnd);

  // Create PDF
  const doc = new PDFDocument();

  // Header
  doc.fontSize(20).text('Wellness Report', { align: 'center' });
  doc.fontSize(12).text(`${dateStart.toDateString()} - ${dateEnd.toDateString()}`, { align: 'center' });
  doc.moveDown();

  // Mood Trends Section
  if (sections.includes('mood_trends')) {
    doc.fontSize(16).text('Mood Trends');
    doc.fontSize(10).text(`Average Mood: ${moodData.average}/10`);
    // Add chart/graph here
  }

  // Activities Section
  if (sections.includes('activities')) {
    doc.fontSize(16).text('Activities Completed');
    activities.forEach(activity => {
      doc.fontSize(10).text(`• ${activity.name} - ${activity.completedCount}x`);
    });
  }

  // Save to file
  const filename = `wellness-report-${userId}-${Date.now()}.pdf`;
  doc.pipe(fs.createWriteStream(`/uploads/reports/${filename}`));
  doc.end();

  return filename;
}
```

## 🚀 Implementation Phases

### Week 1: Crisis Resources (HIGHEST PRIORITY)
- [ ] Create crisis_resources table
- [ ] Seed crisis hotlines database
- [ ] Build crisis support page UI
- [ ] Add crisis button to header/navbar
- [ ] Implement safety plan feature

### Week 2: Report Generation
- [ ] Create wellness_reports table
- [ ] Build report generation API
- [ ] Implement PDF generation
- [ ] Create report preview UI
- [ ] Add download functionality

### Week 3: Report Sharing
- [ ] Implement share code generation
- [ ] Create public report view
- [ ] Add access logging
- [ ] Build sharing UI
- [ ] Email notifications

### Week 4: Therapist Features
- [ ] Therapist search UI
- [ ] Integration with external APIs (optional)
- [ ] Consultation request flow
- [ ] User-therapist connections
- [ ] Therapist data sharing preferences

## 🧪 Testing Checklist

### Crisis Features
- [ ] Crisis hotlines display correctly by region
- [ ] All hotline numbers are accurate
- [ ] Crisis button is prominently visible
- [ ] Safety plan saves and retrieves correctly

### Reports
- [ ] Report generates with correct date range
- [ ] All selected sections are included
- [ ] PDF formats properly
- [ ] Download works on all browsers
- [ ] Share codes work without authentication

### Security
- [ ] Share codes expire correctly
- [ ] Access is logged properly
- [ ] Users can revoke access
- [ ] Expired codes don't work
- [ ] Reports without share codes are private

## 📊 Success Metrics

### Engagement
- % of users who create safety plan
- Report generation frequency
- Report sharing rate
- Therapist search usage

### Safety Impact
- Crisis resource page views
- Safety plan completion rate
- Professional connection rate

### Professional Adoption
- Reports shared with therapists
- Therapist consultation requests
- Report download counts

## 🎯 Next Steps

1. **Review this plan** - Ensure it aligns with your vision
2. **Prioritize features** - Start with crisis resources
3. **Create database tables** - Run Phase 6 migration
4. **Build crisis support page** - Immediate safety value
5. **Implement report generation** - Core therapist bridge feature

---

**Ready to implement Phase 6?** This phase adds critical safety features and professional connectivity to make PureSoul a comprehensive mental wellness platform! 🏥💙
