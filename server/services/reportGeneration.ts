import { pool } from '../db';

export interface ReportData {
  emotionalTrends: {
    dates: string[];
    emotions: {
      [emotion: string]: number[];
    };
    averages: {
      [emotion: string]: number;
    };
  };
  voiceInsights: Array<{
    date: string;
    mood: string;
    keyThemes: string[];
    transcriptSnippet?: string;
  }>;
  activitiesCompleted: {
    total: number;
    byCategory: { [category: string]: number };
    topActivities: Array<{ name: string; count: number }>;
  };
  goalsProgress: {
    totalGoals: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    goals: Array<{
      title: string;
      status: string;
      progress: number;
    }>;
  };
  wellnessScore: {
    overall: number;
    consistency: number;
    improvement: number;
  };
  crisisIndicators: Array<{
    date: string;
    severity: string;
    type: string;
    description: string;
  }>;
  keyInsights: Array<{
    type: string;
    title: string;
    description: string;
    severity?: string;
  }>;
}

/**
 * Generate a wellness report for a user over a date range
 */
export async function generateReport(
  userId: string,
  startDate: Date,
  endDate: Date,
  reportType: string = 'custom'
): Promise<ReportData> {
  const [
    emotionalTrends,
    voiceInsights,
    activitiesCompleted,
    goalsProgress,
    crisisIndicators
  ] = await Promise.all([
    getEmotionalTrends(userId, startDate, endDate),
    getVoiceInsights(userId, startDate, endDate),
    getActivitiesCompleted(userId, startDate, endDate),
    getGoalsProgress(userId, startDate, endDate),
    getCrisisIndicators(userId, startDate, endDate)
  ]);

  const wellnessScore = calculateWellnessScore(
    emotionalTrends,
    activitiesCompleted,
    goalsProgress
  );

  const keyInsights = generateKeyInsights(
    emotionalTrends,
    voiceInsights,
    activitiesCompleted,
    goalsProgress,
    crisisIndicators
  );

  return {
    emotionalTrends,
    voiceInsights,
    activitiesCompleted,
    goalsProgress,
    wellnessScore,
    crisisIndicators,
    keyInsights
  };
}

/**
 * Get emotional trends over time
 */
async function getEmotionalTrends(userId: string, startDate: Date, endDate: Date) {
  const result = await pool.query(
    `SELECT
       DATE(recorded_at) as date,
       mood_after,
       energy_level,
       stress_level,
       emotion_data,
       COUNT(*) as entry_count
     FROM voice_entries
     WHERE user_id = $1
       AND recorded_at >= $2::timestamp
       AND recorded_at <= $3::timestamp
     GROUP BY DATE(recorded_at), mood_after, energy_level, stress_level, emotion_data
     ORDER BY date ASC`,
    [userId, startDate.toISOString(), endDate.toISOString()]
  );

  // Aggregate by date
  const dateMap = new Map<string, any>();
  const emotions = ['happy', 'sad', 'anxious', 'calm', 'stressed', 'energetic'];

  result.rows.forEach(row => {
    const date = new Date(row.date).toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        moods: [],
        energy: [],
        stress: []
      });
    }
    const entry = dateMap.get(date);
    if (row.mood_after) entry.moods.push(row.mood_after);
    if (row.energy_level) entry.energy.push(row.energy_level);
    if (row.stress_level) entry.stress.push(row.stress_level);
  });

  const dates = Array.from(dateMap.keys()).sort();
  const emotionData: { [key: string]: number[] } = {};
  const averages: { [key: string]: number } = {};

  // Calculate averages for each emotion
  emotions.forEach(emotion => {
    emotionData[emotion] = [];
    let sum = 0;
    let count = 0;

    dates.forEach(date => {
      const entry = dateMap.get(date);
      const moodCount = entry.moods.filter((m: string) => m === emotion).length;
      emotionData[emotion].push(moodCount);
      sum += moodCount;
      count++;
    });

    averages[emotion] = count > 0 ? sum / count : 0;
  });

  return {
    dates,
    emotions: emotionData,
    averages
  };
}

/**
 * Get voice journal insights
 */
async function getVoiceInsights(userId: string, startDate: Date, endDate: Date) {
  const result = await pool.query(
    `SELECT
       recorded_at,
       mood_after,
       transcript,
       ai_analysis
     FROM voice_entries
     WHERE user_id = $1
       AND recorded_at >= $2::timestamp
       AND recorded_at <= $3::timestamp
     ORDER BY recorded_at DESC
     LIMIT 10`,
    [userId, startDate.toISOString(), endDate.toISOString()]
  );

  return result.rows.map(row => ({
    date: new Date(row.recorded_at).toISOString().split('T')[0],
    mood: row.mood_after ? String(row.mood_after) : 'neutral',
    keyThemes: extractKeyThemes(row.transcript, row.ai_analysis),
    transcriptSnippet: row.transcript ? row.transcript.substring(0, 200) + '...' : undefined
  }));
}

/**
 * Get activities completed stats
 */
async function getActivitiesCompleted(userId: string, startDate: Date, endDate: Date) {
  const result = await pool.query(
    `SELECT
       wa.name,
       wa.category,
       COUNT(*) as completion_count
     FROM plan_items pi
     JOIN wellness_plans wp ON pi.plan_id = wp.id
     JOIN wellness_activities wa ON pi.activity_id = wa.id
     WHERE wp.user_id = $1
       AND pi.completed_at >= $2::timestamp
       AND pi.completed_at <= $3::timestamp
       AND pi.status = 'completed'
     GROUP BY wa.id, wa.name, wa.category
     ORDER BY completion_count DESC`,
    [userId, startDate.toISOString(), endDate.toISOString()]
  );

  const total = result.rows.reduce((sum, row) => sum + parseInt(row.completion_count), 0);
  const byCategory: { [key: string]: number } = {};
  const topActivities = result.rows.slice(0, 5).map(row => ({
    name: row.name,
    count: parseInt(row.completion_count)
  }));

  result.rows.forEach(row => {
    const category = row.category || 'other';
    byCategory[category] = (byCategory[category] || 0) + parseInt(row.completion_count);
  });

  return {
    total,
    byCategory,
    topActivities
  };
}

/**
 * Get goals progress
 */
async function getGoalsProgress(userId: string, startDate: Date, endDate: Date) {
  const goalsResult = await pool.query(
    `SELECT
       id,
       title,
       status,
       target_value,
       current_value
     FROM user_goals
     WHERE user_id = $1
       AND created_at <= $2::timestamp
     ORDER BY created_at DESC`,
    [userId, endDate.toISOString()]
  );

  const totalGoals = goalsResult.rows.length;
  const completed = goalsResult.rows.filter(g => g.status === 'completed').length;
  const inProgress = goalsResult.rows.filter(g => g.status === 'in_progress').length;
  const completionRate = totalGoals > 0 ? (completed / totalGoals) * 100 : 0;

  const goals = goalsResult.rows.map(row => ({
    title: row.title,
    status: row.status,
    progress: row.target_value > 0
      ? Math.min(100, (row.current_value / row.target_value) * 100)
      : 0
  }));

  return {
    totalGoals,
    completed,
    inProgress,
    completionRate,
    goals
  };
}

/**
 * Get crisis indicators
 */
async function getCrisisIndicators(userId: string, startDate: Date, endDate: Date) {
  const result = await pool.query(
    `SELECT
       recorded_at,
       mood_after,
       stress_level,
       crisis_assessment
     FROM voice_entries
     WHERE user_id = $1
       AND recorded_at >= $2::timestamp
       AND recorded_at <= $3::timestamp
       AND (
         stress_level > 7
         OR crisis_assessment IS NOT NULL
       )
     ORDER BY recorded_at DESC`,
    [userId, startDate.toISOString(), endDate.toISOString()]
  );

  return result.rows.map(row => ({
    date: new Date(row.recorded_at).toISOString().split('T')[0],
    severity: determineSeverity(row.stress_level, 0),
    type: row.crisis_assessment ? 'crisis_detected' : 'high_stress',
    description: `High stress levels detected (${row.stress_level}/10)`
  }));
}

/**
 * Calculate overall wellness score
 */
function calculateWellnessScore(
  emotionalTrends: any,
  activitiesCompleted: any,
  goalsProgress: any
): { overall: number; consistency: number; improvement: number } {
  // Simple scoring algorithm (can be enhanced)
  const emotionalScore = calculateEmotionalScore(emotionalTrends);
  const activityScore = Math.min(100, (activitiesCompleted.total / 20) * 100);
  const goalsScore = goalsProgress.completionRate;

  const overall = (emotionalScore + activityScore + goalsScore) / 3;

  // Consistency: how regularly user engages
  const consistency = activitiesCompleted.total > 0 ?
    Math.min(100, (activitiesCompleted.total / 10) * 100) : 0;

  // Improvement: positive trend in emotional state
  const improvement = calculateImprovement(emotionalTrends);

  return {
    overall: Math.round(overall),
    consistency: Math.round(consistency),
    improvement: Math.round(improvement)
  };
}

/**
 * Generate key insights from data
 */
function generateKeyInsights(
  emotionalTrends: any,
  voiceInsights: any,
  activitiesCompleted: any,
  goalsProgress: any,
  crisisIndicators: any
): Array<{ type: string; title: string; description: string; severity?: string }> {
  const insights = [];

  // Activity insight
  if (activitiesCompleted.total > 20) {
    insights.push({
      type: 'positive',
      title: 'High Activity Engagement',
      description: `You completed ${activitiesCompleted.total} wellness activities this period. Great job!`,
      severity: 'low'
    });
  } else if (activitiesCompleted.total < 5) {
    insights.push({
      type: 'suggestion',
      title: 'Low Activity Engagement',
      description: 'Consider incorporating more wellness activities into your routine.',
      severity: 'medium'
    });
  }

  // Goals insight
  if (goalsProgress.completionRate > 70) {
    insights.push({
      type: 'positive',
      title: 'Strong Goal Progress',
      description: `You've completed ${goalsProgress.completionRate.toFixed(0)}% of your goals.`,
      severity: 'low'
    });
  }

  // Crisis indicators
  if (crisisIndicators.length > 0) {
    insights.push({
      type: 'alert',
      title: 'High Stress Periods Detected',
      description: `${crisisIndicators.length} periods of elevated stress or anxiety were recorded. Consider reaching out for support.`,
      severity: 'high'
    });
  }

  return insights;
}

// Helper functions
function extractKeyThemes(transcript: string | null, aiAnalysis: any): string[] {
  if (!transcript) return [];

  // Simple keyword extraction (can be enhanced with NLP)
  const keywords = ['work', 'family', 'anxiety', 'stress', 'sleep', 'health'];
  return keywords.filter(keyword =>
    transcript.toLowerCase().includes(keyword)
  );
}

function determineSeverity(stressLevel: number, anxietyLevel: number): string {
  const maxLevel = Math.max(stressLevel || 0, anxietyLevel || 0);
  if (maxLevel >= 9) return 'critical';
  if (maxLevel >= 7) return 'high';
  if (maxLevel >= 5) return 'medium';
  return 'low';
}

function calculateEmotionalScore(emotionalTrends: any): number {
  const positiveEmotions = ['happy', 'calm', 'energetic'];
  const negativeEmotions = ['sad', 'anxious', 'stressed'];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveEmotions.forEach(emotion => {
    positiveScore += emotionalTrends.averages[emotion] || 0;
  });

  negativeEmotions.forEach(emotion => {
    negativeScore += emotionalTrends.averages[emotion] || 0;
  });

  const total = positiveScore + negativeScore;
  if (total === 0) return 50; // neutral

  return (positiveScore / total) * 100;
}

function calculateImprovement(emotionalTrends: any): number {
  // Compare first half vs second half of date range
  const dates = emotionalTrends.dates;
  if (dates.length < 2) return 50;

  const midpoint = Math.floor(dates.length / 2);
  const firstHalf = dates.slice(0, midpoint);
  const secondHalf = dates.slice(midpoint);

  // Simple comparison of positive emotions
  const firstScore = calculatePeriodScore(emotionalTrends, firstHalf);
  const secondScore = calculatePeriodScore(emotionalTrends, secondHalf);

  if (secondScore > firstScore) return 75; // improved
  if (secondScore < firstScore) return 25; // declined
  return 50; // stable
}

function calculatePeriodScore(emotionalTrends: any, dateRange: string[]): number {
  const positiveEmotions = ['happy', 'calm', 'energetic'];
  let total = 0;

  dateRange.forEach((_, index) => {
    positiveEmotions.forEach(emotion => {
      total += emotionalTrends.emotions[emotion]?.[index] || 0;
    });
  });

  return total;
}

/**
 * Save generated report to database
 */
export async function saveReport(
  userId: string,
  title: string,
  reportType: string,
  startDate: Date,
  endDate: Date,
  data: ReportData
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO wellness_reports (
      user_id, title, report_type, start_date, end_date, data,
      key_insights, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ready')
    RETURNING id`,
    [
      userId,
      title,
      reportType,
      startDate.toISOString().split('T')[0], // Convert to date string
      endDate.toISOString().split('T')[0],   // Convert to date string
      JSON.stringify(data),
      JSON.stringify(data.keyInsights)
    ]
  );

  return result.rows[0].id;
}
