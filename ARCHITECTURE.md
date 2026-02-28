# PureSoul Architecture
## Technical Implementation Guide

---

## 🏗️ **System Architecture**

### **Frontend Stack**
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter (lightweight)
- **State**: TanStack Query + Zustand
- **UI**: Tailwind CSS + Radix UI primitives
- **Charts**: Recharts / D3.js for advanced visualizations
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion for smooth transitions

### **Backend Stack**
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis for real-time features
- **Auth**: Passport.js multi-strategy
- **Files**: MinIO / S3 for voice recordings
- **AI**: OpenAI GPT-4 for insights
- **Queue**: Bull for async processing

---

## 📊 **Database Schema Evolution**

### **New Core Tables**

#### **`entries` - Flexible Entry System**
```sql
CREATE TABLE entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  entry_type VARCHAR(50), -- 'journal', 'mood', 'activity', 'symptom', 'medication'
  timestamp TIMESTAMPTZ NOT NULL,

  -- Flexible JSON data
  data JSONB NOT NULL, -- Stores custom fields

  -- Quick access fields (indexed)
  mood_score INTEGER, -- 1-10
  wellness_score INTEGER, -- 0-100
  tags TEXT[],

  -- Relationships
  linked_entries UUID[], -- Related entry IDs

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_entries_user_timestamp ON entries(user_id, timestamp DESC);
CREATE INDEX idx_entries_type ON entries(user_id, entry_type);
CREATE INDEX idx_entries_data ON entries USING GIN(data);
```

#### **`custom_fields` - User-defined tracking**
```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  field_name VARCHAR(100),
  field_type VARCHAR(50), -- 'text', 'number', 'rating', 'emotion', 'select', 'date'
  options JSONB, -- For select/multi-select types
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER
);
```

#### **`insights` - AI-generated insights**
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  insight_type VARCHAR(50), -- 'pattern', 'correlation', 'prediction', 'recommendation'
  title VARCHAR(200),
  description TEXT,
  confidence DECIMAL(3,2), -- 0.00-1.00
  evidence JSONB, -- Supporting data points
  related_entries UUID[],
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'acknowledged', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`relationships` - Data connections**
```sql
CREATE TABLE entry_relationships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  from_entry UUID REFERENCES entries(id),
  to_entry UUID REFERENCES entries(id),
  relationship_type VARCHAR(50), -- 'causes', 'triggered_by', 'helped_with', 'worsened'
  strength DECIMAL(3,2), -- Correlation strength
  auto_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`templates` - Pre-built tracking templates**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  category VARCHAR(50), -- 'anxiety', 'depression', 'bipolar', etc.
  fields JSONB, -- Field definitions
  views_config JSONB, -- Default view settings
  is_official BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  usage_count INTEGER DEFAULT 0
);
```

---

## 🎨 **Component Architecture**

### **New Component Structure**
```
src/
├── components/
│   ├── flexible/
│   │   ├── EntryCard.tsx          # Universal entry display
│   │   ├── QuickAddFab.tsx        # Floating action button
│   │   ├── FieldRenderer.tsx      # Renders any custom field type
│   │   └── RelationshipPicker.tsx # Link entries together
│   │
│   ├── views/
│   │   ├── TimelineView.tsx       # Chronological stream
│   │   ├── CalendarView.tsx       # Month/week/day layouts
│   │   ├── AnalyticsView.tsx      # Charts and graphs
│   │   ├── JourneyMapView.tsx     # Visual story
│   │   ├── GoalsView.tsx          # Habits and goals
│   │   └── InsightsView.tsx       # AI-generated cards
│   │
│   ├── insights/
│   │   ├── InsightCard.tsx        # Smart insight display
│   │   ├── PatternDetector.tsx    # Visual pattern display
│   │   ├── CorrelationGraph.tsx   # Relationship visualization
│   │   └── PredictiveChart.tsx    # Future trend predictions
│   │
│   ├── shared/
│   │   ├── MoodGradient.tsx       # Smooth mood visualization
│   │   ├── WellnessRing.tsx       # Circular progress indicators
│   │   ├── SmartSuggestion.tsx    # Contextual suggestions
│   │   └── EmptyState.tsx         # Beautiful empty states
│   │
│   └── collaboration/
│       ├── ShareDialog.tsx        # Sharing controls
│       ├── TherapistView.tsx      # Therapist dashboard
│       └── CommentThread.tsx      # Collaborative comments
│
├── hooks/
│   ├── useFlexibleEntries.ts      # Entry CRUD operations
│   ├── useInsights.ts             # Fetch AI insights
│   ├── useRelationships.ts        # Manage connections
│   ├── useCustomFields.ts         # Field configuration
│   └── useWellnessScore.ts        # Calculate wellness
│
└── services/
    ├── insightsEngine.ts          # AI pattern detection
    ├── correlationAnalyzer.ts     # Find relationships
    ├── wellnessCalculator.ts      # Score algorithm
    └── templateManager.ts         # Template operations
```

---

## 🔄 **Data Flow**

### **Entry Creation Flow**
```
User taps FAB
    ↓
QuickAddDialog opens
    ↓
Select entry type (mood, activity, etc.)
    ↓
Render custom fields for that type
    ↓
Fill data (with smart suggestions)
    ↓
POST /api/entries with flexible data
    ↓
Background: Queue insight analysis
    ↓
Update timeline view
    ↓
Show success toast with wellness score change
```

### **Insight Generation Flow**
```
New entry created
    ↓
Queue job: analyzePatterns(user_id)
    ↓
Fetch last 30 days of entries
    ↓
Run correlation analysis
    ↓
Detect anomalies and patterns
    ↓
Generate insight with GPT-4
    ↓
Store in insights table
    ↓
Push notification if high priority
    ↓
Display in insights view
```

---

## 🎯 **API Endpoints**

### **Flexible Entries**
```
GET    /api/entries                 # List with filters
POST   /api/entries                 # Create new entry
GET    /api/entries/:id             # Get single entry
PATCH  /api/entries/:id             # Update entry
DELETE /api/entries/:id             # Soft delete

# Advanced
GET    /api/entries/timeline        # Timeline view data
GET    /api/entries/calendar/:month # Calendar view data
GET    /api/entries/search          # Full-text search
POST   /api/entries/bulk            # Bulk import
```

### **Insights & Intelligence**
```
GET    /api/insights                # List insights
GET    /api/insights/patterns       # Pattern detection
GET    /api/insights/correlations   # Correlation matrix
GET    /api/insights/predictions    # Predictive insights
POST   /api/insights/:id/acknowledge # Mark as seen
DELETE /api/insights/:id            # Dismiss insight
```

### **Custom Fields**
```
GET    /api/fields                  # User's custom fields
POST   /api/fields                  # Create new field
PATCH  /api/fields/:id              # Update field
DELETE /api/fields/:id              # Delete field
POST   /api/fields/reorder          # Change order
```

### **Templates**
```
GET    /api/templates               # Browse templates
GET    /api/templates/:id           # Get template details
POST   /api/templates/:id/apply     # Apply template to user
POST   /api/templates               # Create custom template
```

### **Relationships**
```
GET    /api/entries/:id/relationships  # Get connections
POST   /api/relationships              # Create link
DELETE /api/relationships/:id          # Remove link
GET    /api/relationships/graph        # Full relationship graph
```

---

## 🧠 **AI/ML Features**

### **Pattern Detection Algorithm**
```typescript
interface Pattern {
  type: 'temporal' | 'causal' | 'seasonal' | 'cyclical';
  description: string;
  confidence: number;
  evidence: Entry[];
  recommendation?: string;
}

async function detectPatterns(userId: string): Promise<Pattern[]> {
  const entries = await getRecentEntries(userId, 30); // days

  const patterns: Pattern[] = [];

  // 1. Time-of-day patterns
  const morningMood = averageMood(entries, 'morning');
  const eveningMood = averageMood(entries, 'evening');
  if (Math.abs(morningMood - eveningMood) > 2) {
    patterns.push({
      type: 'temporal',
      description: `You tend to feel ${morningMood > eveningMood ? 'better' : 'worse'} in the mornings`,
      confidence: 0.85,
      evidence: entries.filter(e => e.timeOfDay === 'morning'),
      recommendation: 'Consider scheduling important tasks during your peak mood times'
    });
  }

  // 2. Activity correlations
  const exerciseDays = entries.filter(e => e.data.exercise === true);
  const avgMoodAfterExercise = averageMoodNextDay(exerciseDays);
  const avgMoodWithoutExercise = averageMoodWithout(entries, exerciseDays);

  if (avgMoodAfterExercise > avgMoodWithoutExercise + 1.5) {
    patterns.push({
      type: 'causal',
      description: 'Exercise significantly improves your mood the next day',
      confidence: 0.92,
      evidence: exerciseDays,
      recommendation: 'Try exercising 3-4 times per week for optimal mental health'
    });
  }

  // 3. Seasonal patterns
  // 4. Social connection impact
  // 5. Sleep quality correlation
  // ... more patterns

  return patterns;
}
```

### **Wellness Score Calculation**
```typescript
function calculateWellnessScore(entry: Entry): number {
  const factors = {
    mood: entry.mood_score * 0.30,
    sleep: entry.data.sleep_quality * 0.20,
    activities: (entry.data.completed_activities / entry.data.planned_activities) * 0.15,
    social: entry.data.social_interactions > 0 ? 10 : 0 * 0.15,
    selfCare: entry.data.self_care_activities?.length * 5 * 0.10,
    symptoms: Math.max(0, 10 - entry.data.symptom_severity) * 0.10
  };

  return Math.min(100, Object.values(factors).reduce((a, b) => a + b, 0));
}
```

---

## 🎨 **UI Component Examples**

### **Quick Add FAB**
```tsx
<motion.button
  className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  onClick={openQuickAdd}
>
  <Plus className="w-6 h-6 text-white" />
</motion.button>
```

### **Mood Gradient Timeline**
```tsx
<div className="relative h-24">
  {entries.map((entry, i) => (
    <div
      key={entry.id}
      className="absolute"
      style={{
        left: `${(i / entries.length) * 100}%`,
        height: `${entry.mood_score * 10}%`,
        background: `hsl(${entry.mood_score * 12}, 70%, 60%)`
      }}
    />
  ))}
</div>
```

### **Insight Card**
```tsx
<Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
  <div className="flex items-start gap-4">
    <Sparkles className="w-6 h-6 text-purple-500" />
    <div>
      <h3 className="font-semibold text-lg mb-2">New Pattern Detected!</h3>
      <p className="text-gray-700 mb-4">
        You tend to feel better after morning walks. This has happened 8 times in the last 2 weeks.
      </p>
      <div className="flex gap-2">
        <Button size="sm">Set Morning Walk Reminder</Button>
        <Button size="sm" variant="ghost">Learn More</Button>
      </div>
    </div>
  </div>
</Card>
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Flexibility (Week 1-2)**
1. ✅ Flexible entry system with JSONB
2. ✅ Custom fields management
3. ✅ Timeline view with mood gradient
4. ✅ Quick-add FAB with voice support

### **Phase 2: Intelligence (Week 3-4)**
1. ✅ Pattern detection engine
2. ✅ Wellness score calculator
3. ✅ Insights board with AI cards
4. ✅ Smart suggestions

### **Phase 3: Views (Week 5-6)**
1. ✅ Calendar view with heatmap
2. ✅ Analytics dashboard
3. ✅ Journey map visualization
4. ✅ Goals & habits tracker

### **Phase 4: Collaboration (Week 7-8)**
1. ✅ Sharing system
2. ✅ Therapist portal
3. ✅ Comments & feedback
4. ✅ Care team coordination

---

## 📈 **Performance Considerations**

- **Lazy loading**: Timeline infinite scroll
- **Caching**: Redis for recent entries
- **Indexing**: Proper PostgreSQL indexes on JSONB
- **Compression**: Gzip API responses
- **CDN**: Static assets on CDN
- **Worker threads**: Heavy analytics in background
- **WebSocket**: Real-time updates for shared views

---

## 🔐 **Security & Privacy**

- **Encryption**: AES-256 for sensitive data
- **HIPAA compliance**: Audit logs, access controls
- **2FA**: Optional two-factor authentication
- **Session management**: Secure, httpOnly cookies
- **Data export**: Full GDPR compliance
- **Right to delete**: Complete data removal

---

**Ready to build the future! 🚀**
