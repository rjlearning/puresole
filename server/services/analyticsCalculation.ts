import { pool } from '../db';

// ============================================
// MOOD TREND ANALYSIS
// ============================================

export async function calculateMoodTrends(
  userId: string,
  timePeriod: 'week' | 'month' | 'quarter' | 'year' = 'month'
) {
  const days = timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : timePeriod === 'quarter' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await pool.query(
    `SELECT
      DATE(recorded_at) as date,
      AVG(mood_after) as avg_mood,
      AVG(energy_level) as avg_energy,
      AVG(stress_level) as avg_stress,
      COUNT(*) as entry_count
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY DATE(recorded_at)
    ORDER BY date ASC`,
    [userId, startDate.toISOString()]
  );

  const trends = result.rows.map(row => ({
    date: row.date,
    mood: parseFloat(row.avg_mood),
    energy: parseFloat(row.avg_energy),
    stress: parseFloat(row.avg_stress),
    entries: parseInt(row.entry_count)
  }));

  // Calculate trend direction
  const recentMood = trends.slice(-7).reduce((sum, d) => sum + d.mood, 0) / Math.min(7, trends.length);
  const olderMood = trends.slice(0, 7).reduce((sum, d) => sum + d.mood, 0) / Math.min(7, trends.length);
  const trendDirection = recentMood > olderMood ? 'improving' : recentMood < olderMood ? 'declining' : 'stable';

  return {
    trends,
    summary: {
      averageMood: trends.reduce((sum, d) => sum + d.mood, 0) / trends.length,
      averageEnergy: trends.reduce((sum, d) => sum + d.energy, 0) / trends.length,
      averageStress: trends.reduce((sum, d) => sum + d.stress, 0) / trends.length,
      trendDirection,
      totalEntries: trends.reduce((sum, d) => sum + d.entries, 0)
    }
  };
}

// ============================================
// CORRELATION DISCOVERY
// ============================================

export async function findCorrelations(userId: string, timePeriod: 'month' | 'quarter' = 'month') {
  const days = timePeriod === 'month' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get activities and mood data
  const activitiesResult = await pool.query(
    `SELECT
      DATE(uac.completed_at) as date,
      wa.category,
      COUNT(*) as activity_count
    FROM user_activity_completions uac
    JOIN wellness_activities wa ON uac.activity_id = wa.id
    WHERE uac.user_id = $1 AND uac.completed_at >= $2::timestamp
    GROUP BY DATE(uac.completed_at), wa.category`,
    [userId, startDate.toISOString()]
  );

  const moodResult = await pool.query(
    `SELECT
      DATE(recorded_at) as date,
      AVG(mood_after) as avg_mood
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY DATE(recorded_at)`,
    [userId, startDate.toISOString()]
  );

  // Build correlation map
  const moodByDate = new Map(
    moodResult.rows.map(row => [row.date.toISOString().split('T')[0], parseFloat(row.avg_mood)])
  );

  const categoryMoods: { [key: string]: number[] } = {};

  activitiesResult.rows.forEach(row => {
    const date = row.date.toISOString().split('T')[0];
    const mood = moodByDate.get(date);
    if (mood) {
      if (!categoryMoods[row.category]) {
        categoryMoods[row.category] = [];
      }
      categoryMoods[row.category].push(mood);
    }
  });

  // Calculate correlation strength
  const correlations = Object.entries(categoryMoods).map(([category, moods]) => {
    const avgMood = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    const overallAvg = Array.from(moodByDate.values()).reduce((sum, m) => sum + m, 0) / moodByDate.size;
    const impact = avgMood - overallAvg;

    return {
      category,
      averageMood: avgMood,
      impact,
      strength: Math.abs(impact) > 0.5 ? 'strong' : Math.abs(impact) > 0.2 ? 'moderate' : 'weak',
      sampleSize: moods.length
    };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    correlations,
    insights: generateCorrelationInsights(correlations)
  };
}

function generateCorrelationInsights(correlations: any[]) {
  const insights = [];

  const strongPositive = correlations.filter(c => c.impact > 0.5);
  const strongNegative = correlations.filter(c => c.impact < -0.5);

  if (strongPositive.length > 0) {
    insights.push({
      type: 'positive',
      title: 'Activities That Boost Your Mood',
      description: `${strongPositive.map(c => c.category).join(', ')} activities are strongly associated with improved mood.`,
      data: strongPositive
    });
  }

  if (strongNegative.length > 0) {
    insights.push({
      type: 'alert',
      title: 'Activities to Watch',
      description: `${strongNegative.map(c => c.category).join(', ')} activities may be correlated with lower mood scores.`,
      data: strongNegative
    });
  }

  return insights;
}

// ============================================
// MOOD PREDICTION
// ============================================

export async function predictMood(userId: string, daysAhead: number = 7) {
  // Get historical data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Use last 30 days for prediction

  const result = await pool.query(
    `SELECT
      DATE(recorded_at) as date,
      AVG(mood_after) as avg_mood,
      AVG(energy_level) as avg_energy,
      AVG(stress_level) as avg_stress
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY DATE(recorded_at)
    ORDER BY date ASC`,
    [userId, startDate.toISOString()]
  );

  if (result.rows.length < 7) {
    return {
      predictions: [],
      confidence: 'low',
      message: 'Not enough data for reliable predictions. Keep tracking your mood!'
    };
  }

  const historicalData = result.rows.map(row => ({
    date: row.date,
    mood: parseFloat(row.avg_mood),
    energy: parseFloat(row.avg_energy),
    stress: parseFloat(row.avg_stress)
  }));

  // Simple linear regression for trend
  const n = historicalData.length;
  const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
  const sumY = historicalData.reduce((sum, d) => sum + d.mood, 0);
  const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.mood, 0);
  const sumX2 = historicalData.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate predictions
  const predictions = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const predictedMood = Math.max(1, Math.min(5, slope * (n + i) + intercept));
    const predictionDate = new Date(today);
    predictionDate.setDate(today.getDate() + i);

    predictions.push({
      date: predictionDate.toISOString().split('T')[0],
      predictedMood: Math.round(predictedMood * 10) / 10,
      confidence: calculatePredictionConfidence(i, n)
    });
  }

  // Calculate overall trend
  const recentAvg = historicalData.slice(-7).reduce((sum, d) => sum + d.mood, 0) / 7;
  const trend = slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable';

  return {
    predictions,
    trend,
    currentAverage: recentAvg,
    confidence: n >= 20 ? 'high' : n >= 10 ? 'medium' : 'low'
  };
}

function calculatePredictionConfidence(daysAhead: number, dataPoints: number): number {
  // Confidence decreases with distance and increases with more data
  const distanceFactor = Math.max(0, 1 - (daysAhead * 0.1));
  const dataSizeFactor = Math.min(1, dataPoints / 30);
  return Math.round(distanceFactor * dataSizeFactor * 100);
}

// ============================================
// INSIGHT GENERATION
// ============================================

export async function generateInsights(userId: string) {
  const insights = [];

  // Get mood trends
  const moodTrends = await calculateMoodTrends(userId, 'month');

  // Trend insight
  if (moodTrends.summary.trendDirection === 'improving') {
    insights.push({
      type: 'positive',
      title: '📈 Your mood is improving!',
      description: `Your average mood has increased over the past month. Keep up the great work!`,
      confidence_score: 0.85,
      priority: 10,
      metadata: { trend: moodTrends.summary }
    });
  } else if (moodTrends.summary.trendDirection === 'declining') {
    insights.push({
      type: 'alert',
      title: '📉 Mood declining',
      description: `Your mood has been decreasing recently. Consider reaching out to support or trying mood-boosting activities.`,
      confidence_score: 0.80,
      priority: 20,
      metadata: { trend: moodTrends.summary }
    });
  }

  // Energy insight
  if (moodTrends.summary.averageEnergy < 3) {
    insights.push({
      type: 'suggestion',
      title: '⚡ Low energy detected',
      description: `Your energy levels have been below average. Consider activities like short walks, better sleep, or energizing exercises.`,
      confidence_score: 0.75,
      priority: 15,
      metadata: { averageEnergy: moodTrends.summary.averageEnergy }
    });
  }

  // Stress insight
  if (moodTrends.summary.averageStress > 7) {
    insights.push({
      type: 'alert',
      title: '😰 High stress levels',
      description: `Your stress levels are elevated. Try relaxation techniques like meditation, deep breathing, or yoga.`,
      confidence_score: 0.90,
      priority: 25,
      metadata: { averageStress: moodTrends.summary.averageStress }
    });
  }

  // Consistency insight
  const recentDays = moodTrends.trends.slice(-7);
  const consistencyScore = recentDays.length / 7;

  if (consistencyScore >= 0.8) {
    insights.push({
      type: 'achievement',
      title: '🎯 Great tracking consistency!',
      description: `You've been consistently tracking your mood. This helps identify patterns and improve self-awareness.`,
      confidence_score: 1.0,
      priority: 5,
      metadata: { consistencyScore }
    });
  } else if (consistencyScore < 0.4) {
    insights.push({
      type: 'suggestion',
      title: '📝 Track more regularly',
      description: `Regular mood tracking helps identify patterns. Try setting a daily reminder to check in with yourself.`,
      confidence_score: 0.70,
      priority: 8,
      metadata: { consistencyScore }
    });
  }

  // Get correlations
  const correlations = await findCorrelations(userId, 'month');
  if (correlations.insights.length > 0) {
    correlations.insights.forEach(insight => {
      insights.push({
        type: insight.type === 'positive' ? 'recommendation' : 'alert',
        title: insight.title,
        description: insight.description,
        confidence_score: 0.80,
        priority: insight.type === 'positive' ? 12 : 18,
        metadata: { correlations: insight.data }
      });
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

// ============================================
// PERSONALIZED RECOMMENDATIONS
// ============================================

export async function generateRecommendations(userId: string) {
  const recommendations = [];

  // Get user's mood and activity data
  const moodTrends = await calculateMoodTrends(userId, 'month');
  const correlations = await findCorrelations(userId, 'month');

  // Recommend top mood-boosting activities
  const topActivities = correlations.correlations
    .filter(c => c.impact > 0.3)
    .slice(0, 3);

  if (topActivities.length > 0) {
    recommendations.push({
      type: 'activity',
      title: 'Try These Mood-Boosting Activities',
      description: `Based on your data, ${topActivities.map(a => a.category).join(', ')} activities have the strongest positive impact on your mood.`,
      actions: topActivities.map(a => ({
        label: `Do a ${a.category} activity`,
        category: a.category
      })),
      priority: 10
    });
  }

  // Time-based recommendations
  const currentHour = new Date().getHours();
  if (currentHour < 12 && moodTrends.summary.averageEnergy < 4) {
    recommendations.push({
      type: 'wellness',
      title: 'Morning Energy Boost',
      description: 'Start your day with a energizing activity like a short walk, stretching, or upbeat music.',
      actions: [
        { label: 'Set a morning routine', type: 'goal' },
        { label: 'Try a morning meditation', type: 'activity' }
      ],
      priority: 15
    });
  }

  // Stress management
  if (moodTrends.summary.averageStress > 7) {
    recommendations.push({
      type: 'wellness',
      title: 'Stress Management Techniques',
      description: 'Your stress levels are elevated. Try these evidence-based relaxation techniques.',
      actions: [
        { label: 'Practice deep breathing (5 min)', type: 'activity' },
        { label: 'Try progressive muscle relaxation', type: 'activity' },
        { label: 'Journal about your stressors', type: 'activity' }
      ],
      priority: 20
    });
  }

  // Goal suggestions based on patterns
  const hasLowConsistency = moodTrends.trends.slice(-7).length < 5;
  if (hasLowConsistency) {
    recommendations.push({
      type: 'goal',
      title: 'Build a Tracking Habit',
      description: 'Regular mood tracking helps you understand patterns and make positive changes.',
      actions: [
        { label: 'Set daily check-in reminder', type: 'reminder' },
        { label: 'Create a 7-day tracking goal', type: 'goal' }
      ],
      priority: 8
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

// ============================================
// CACHE MANAGEMENT
// ============================================

export async function getCachedAnalytics(
  userId: string,
  metricType: string,
  timePeriod: string
) {
  const result = await pool.query(
    `SELECT data, calculated_at
     FROM analytics_cache
     WHERE user_id = $1
       AND metric_type = $2
       AND time_period = $3
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId, metricType, timePeriod]
  );

  if (result.rows.length > 0) {
    return result.rows[0].data;
  }

  return null;
}

export async function setCachedAnalytics(
  userId: string,
  metricType: string,
  timePeriod: string,
  data: any,
  expiresInHours: number = 24
) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await pool.query(
    `INSERT INTO analytics_cache (user_id, metric_type, time_period, data, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, metric_type, time_period)
     DO UPDATE SET data = $4, calculated_at = NOW(), expires_at = $5`,
    [userId, metricType, timePeriod, JSON.stringify(data), expiresAt.toISOString()]
  );
}

export async function saveInsight(userId: string, insight: any) {
  const result = await pool.query(
    `INSERT INTO user_insights
      (user_id, insight_type, title, description, confidence_score, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId,
      insight.type,
      insight.title,
      insight.description,
      insight.confidence_score,
      insight.priority,
      JSON.stringify(insight.metadata || {})
    ]
  );

  return result.rows[0].id;
}
