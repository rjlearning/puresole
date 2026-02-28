# Phase 7: Advanced Analytics Dashboard 📊

## Overview
Build an AI-powered analytics dashboard that provides deep insights into mental health patterns, predicts mood trends, identifies correlations, and delivers personalized recommendations.

---

## 🎯 Features

### 1. **Mood Trend Analysis**
- Historical mood tracking over weeks/months
- Trend lines and pattern recognition
- Peak and low periods identification
- Day-of-week patterns
- Time-of-day patterns

### 2. **Predictive Analytics**
- Mood prediction for upcoming days
- Risk detection (potential low mood periods)
- Wellness score forecasting
- Activity effectiveness predictions

### 3. **Correlation Discovery**
- Sleep quality vs mood
- Activity completion vs wellness score
- Voice journaling frequency vs emotional stability
- Goal progress vs overall wellness
- Custom correlation finder

### 4. **Personalized Recommendations**
- AI-suggested activities based on mood patterns
- Best time to journal (when most effective)
- Optimal activity schedule
- Warning signs and prevention strategies
- Personalized wellness tips

### 5. **Advanced Visualizations**
- Interactive mood heatmap (calendar view)
- Multi-metric trend charts
- Correlation scatter plots
- Wellness score over time
- Activity effectiveness bar charts

### 6. **Data Export & Insights**
- Export analytics to CSV
- Share insights with therapist
- Print-friendly analytics report
- Email weekly insights summary

---

## 📊 Database Schema

### Analytics Cache Table
```sql
CREATE TABLE analytics_cache (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  metric_type VARCHAR(50) NOT NULL, -- 'mood_trend', 'correlation', 'prediction'
  time_period VARCHAR(50) NOT NULL, -- 'week', 'month', 'quarter', 'year'

  data JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  UNIQUE(user_id, metric_type, time_period)
);
```

### User Insights Table
```sql
CREATE TABLE user_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  insight_type VARCHAR(50) NOT NULL, -- 'pattern', 'recommendation', 'warning', 'achievement'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  priority INTEGER DEFAULT 0, -- Higher = more important

  metadata JSONB, -- Additional data like charts, actions

  status VARCHAR(50) DEFAULT 'new', -- 'new', 'viewed', 'acted_on', 'dismissed'
  viewed_at TIMESTAMP,
  acted_on_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 API Endpoints

### Analytics Endpoints
```
GET  /api/analytics/mood-trends?period=30d
GET  /api/analytics/correlations
GET  /api/analytics/predictions?days=7
GET  /api/analytics/recommendations
GET  /api/analytics/heatmap?year=2026&month=2
GET  /api/analytics/summary
POST /api/analytics/export
```

### Insights Endpoints
```
GET  /api/insights              # Get all insights for user
GET  /api/insights/:id          # Get specific insight
POST /api/insights/:id/view     # Mark insight as viewed
POST /api/insights/:id/act      # Mark insight as acted on
DELETE /api/insights/:id        # Dismiss insight
```

---

## 🧮 Analytics Calculations

### 1. Mood Trend Score
```typescript
trendScore = (recentAvg - historicalAvg) / historicalStdDev
// Positive = improving, Negative = declining
```

### 2. Correlation Coefficient
```typescript
correlation(x, y) = covariance(x, y) / (stdDev(x) * stdDev(y))
// Range: -1 (negative correlation) to +1 (positive correlation)
```

### 3. Mood Prediction (Simple Moving Average)
```typescript
predictedMood = weightedAverage(last7Days, weights=[0.3, 0.2, 0.15, 0.15, 0.1, 0.05, 0.05])
```

### 4. Activity Effectiveness
```typescript
effectiveness = avgMoodAfterActivity - avgMoodBeforeActivity
```

---

## 🎨 UI Components

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  Advanced Analytics Dashboard                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Mood Trend  │  │ Prediction  │  │ Top Insight │    │
│  │    ↗️ +12%  │  │   Tomorrow  │  │  💡 Alert   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  📊 Mood Trend Chart (Last 30 Days)                     │
│  [Interactive line chart with mood over time]            │
├─────────────────────────────────────────────────────────┤
│  🔥 Mood Heatmap                                         │
│  [Calendar heatmap showing mood by day]                  │
├─────────────────────────────────────────────────────────┤
│  🔗 Correlations Discovered                             │
│  • Sleep Quality ↔️ Mood: 0.73 (Strong positive)        │
│  • Activities ↔️ Wellness: 0.68 (Strong positive)       │
├─────────────────────────────────────────────────────────┤
│  💡 Personalized Recommendations                        │
│  1. Your mood is 20% better on days you meditate       │
│  2. Evening journaling is most effective for you       │
│  3. Consider Box Breathing when stress > 7             │
└─────────────────────────────────────────────────────────┘
```

---

## 📅 Implementation Timeline

### Week 1: Analytics Engine (Backend)
- Day 1-2: Database schema & analytics service
- Day 3-4: Trend analysis & correlations
- Day 5-7: Predictions & recommendations

### Week 2: Dashboard UI (Frontend)
- Day 1-2: Dashboard layout & charts
- Day 3-4: Heatmap & visualizations
- Day 5-7: Insights panel & interactions

---

## 🧪 Sample Insights

### Pattern Detection
```json
{
  "type": "pattern",
  "title": "Evening Mood Dip Detected",
  "description": "Your mood tends to drop 15% between 6-8 PM. Consider scheduling a wellness activity during this time.",
  "confidence": 0.82,
  "actions": ["Schedule evening activity", "View evening activities"]
}
```

### Recommendation
```json
{
  "type": "recommendation",
  "title": "Box Breathing Works Best for You",
  "description": "Box Breathing increases your mood by an average of 18% - higher than other activities.",
  "confidence": 0.91,
  "actions": ["Start Box Breathing", "View activity stats"]
}
```

### Warning
```json
{
  "type": "warning",
  "title": "Low Activity Week",
  "description": "You've completed 60% fewer activities than usual this week. Your wellness score has dropped 12%.",
  "confidence": 0.95,
  "actions": ["View activities", "Generate plan"]
}
```

---

## 🔐 Privacy & Ethics

- All analytics computed locally (no external AI APIs for predictions)
- User controls what data is included in analytics
- Option to disable predictive features
- Transparent about how insights are generated
- Never share analytics data without explicit consent

---

## 📈 Success Metrics

- User engagement: Daily active users viewing analytics
- Actionability: % of insights acted upon
- Accuracy: Mood prediction accuracy (target: 70%+)
- User satisfaction: Analytics helpfulness rating
- Clinical value: Therapist feedback on insights quality

---

**Ready to build Phase 7!** 🚀📊✨
