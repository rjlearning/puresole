import { pool } from '../db';

/**
 * Voice Wellness Trend Calculation Service
 *
 * Aggregates voice analysis data into wellness trends over various time periods.
 * Follows the analytics aggregation pattern from analyticsCalculation.ts
 */

interface WellnessTrendData {
  periodStart: string;
  periodEnd: string;
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year';
  recordingCount: number;
  totalDurationSeconds: number;
  avgValence: number;
  avgArousal: number;
  avgWellnessScore: number;
  emotionDistribution: { [key: string]: number };
  trendDirection: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  trendConfidence: number;
  highRiskCount: number;
  crisisKeywordCount: number;
}

/**
 * Calculate and store voice wellness trends for a user over a specified period
 * Aggregates data by day, week, month, quarter, or year
 */
export async function calculateVoiceTrends(
  userId: string,
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day'
): Promise<WellnessTrendData[]> {
  console.log(`📊 Calculating voice trends for user ${userId} (${periodType})`);

  try {
    // Determine date truncation and grouping interval
    const dateFormat = periodType === 'day' ? 'day'
      : periodType === 'week' ? 'week'
      : periodType === 'month' ? 'month'
      : periodType === 'quarter' ? 'quarter'
      : 'year';

    // Query to aggregate voice analyses by period
    const { rows: trendData } = await pool.query(
      `
      SELECT
        DATE_TRUNC($1::text, va.created_at) as period_start,
        DATE_TRUNC($1::text, va.created_at) + CASE
          WHEN $1 = 'day' THEN INTERVAL '1 day'
          WHEN $1 = 'week' THEN INTERVAL '1 week'
          WHEN $1 = 'month' THEN INTERVAL '1 month'
          WHEN $1 = 'quarter' THEN INTERVAL '3 months'
          WHEN $1 = 'year' THEN INTERVAL '1 year'
        END as period_end,
        COUNT(*) as recording_count,
        SUM(va.duration_seconds) as total_duration_seconds,
        AVG(va.valence) as avg_valence,
        AVG(va.arousal) as avg_arousal,
        AVG(va.wellness_score) as avg_wellness_score,
        SUM(CASE WHEN va.risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) as high_risk_count,
        SUM(ARRAY_LENGTH(va.crisis_keywords, 1)) as crisis_keyword_count,
        jsonb_object_agg(
          COALESCE(va.primary_emotion, 'neutral'),
          COUNT(*) FILTER (WHERE va.primary_emotion IS NOT NULL)
        ) as emotion_distribution
      FROM voice_analyses va
      WHERE va.user_id = $2
        AND va.processing_status = 'completed'
      GROUP BY DATE_TRUNC($1::text, va.created_at)
      ORDER BY period_start ASC
      `,
      [dateFormat, userId]
    );

    if (trendData.length === 0) {
      console.log(`ℹ️  No voice analyses found for user ${userId}`);
      return [];
    }

    // Process and enrich trend data with trend direction calculation
    const enrichedTrends = trendData.map((row, index) => {
      // Calculate trend direction using 7-day rolling window
      let trendDirection: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
      let trendConfidence = 0;

      if (index >= 1) {
        const currentWellness = parseFloat(row.avg_wellness_score) || 0;
        const previousWellness = parseFloat(trendData[Math.max(0, index - 1)].avg_wellness_score) || 0;

        // Compare current to previous period
        const wellnessChange = currentWellness - previousWellness;

        if (Math.abs(wellnessChange) < 2) {
          trendDirection = 'stable';
          trendConfidence = 0.5;
        } else if (wellnessChange > 0) {
          trendDirection = 'improving';
          trendConfidence = Math.min(0.95, 0.6 + Math.abs(wellnessChange) / 100);
        } else {
          trendDirection = 'declining';
          trendConfidence = Math.min(0.95, 0.6 + Math.abs(wellnessChange) / 100);
        }
      } else {
        // First period - check against baseline
        const recordingCount = parseInt(row.recording_count) || 0;
        if (recordingCount >= 3) {
          trendDirection = 'stable';
          trendConfidence = 0.4;
        }
      }

      return {
        periodStart: row.period_start?.toISOString() || '',
        periodEnd: row.period_end?.toISOString() || '',
        periodType,
        recordingCount: parseInt(row.recording_count) || 0,
        totalDurationSeconds: parseFloat(row.total_duration_seconds) || 0,
        avgValence: parseFloat(row.avg_valence) || 0,
        avgArousal: parseFloat(row.avg_arousal) || 0,
        avgWellnessScore: parseFloat(row.avg_wellness_score) || 0,
        emotionDistribution: row.emotion_distribution || {},
        trendDirection,
        trendConfidence: Math.round(trendConfidence * 10000) / 10000,
        highRiskCount: parseInt(row.high_risk_count) || 0,
        crisisKeywordCount: parseInt(row.crisis_keyword_count) || 0,
      };
    });

    // Store trends in database
    for (const trend of enrichedTrends) {
      await saveVoiceTrendToDB(userId, trend);
    }

    console.log(`✅ Calculated ${enrichedTrends.length} voice trends for user ${userId}`);
    return enrichedTrends;

  } catch (error) {
    console.error('❌ Error calculating voice trends:', error);
    throw error;
  }
}

/**
 * Save voice trend to database with upsert logic
 */
async function saveVoiceTrendToDB(userId: string, trend: WellnessTrendData): Promise<void> {
  await pool.query(
    `
    INSERT INTO voice_wellness_trends (
      user_id,
      period_start,
      period_end,
      period_type,
      recording_count,
      total_duration_seconds,
      avg_valence,
      avg_arousal,
      avg_wellness_score,
      emotion_distribution,
      trend_direction,
      trend_confidence,
      high_risk_count,
      crisis_keyword_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (user_id, period_start, period_type)
    DO UPDATE SET
      recording_count = EXCLUDED.recording_count,
      total_duration_seconds = EXCLUDED.total_duration_seconds,
      avg_valence = EXCLUDED.avg_valence,
      avg_arousal = EXCLUDED.avg_arousal,
      avg_wellness_score = EXCLUDED.avg_wellness_score,
      emotion_distribution = EXCLUDED.emotion_distribution,
      trend_direction = EXCLUDED.trend_direction,
      trend_confidence = EXCLUDED.trend_confidence,
      high_risk_count = EXCLUDED.high_risk_count,
      crisis_keyword_count = EXCLUDED.crisis_keyword_count,
      updated_at = NOW()
    `,
    [
      userId,
      new Date(trend.periodStart),
      new Date(trend.periodEnd),
      trend.periodType,
      trend.recordingCount,
      trend.totalDurationSeconds,
      trend.avgValence,
      trend.avgArousal,
      trend.avgWellnessScore,
      JSON.stringify(trend.emotionDistribution),
      trend.trendDirection,
      trend.trendConfidence,
      trend.highRiskCount,
      trend.crisisKeywordCount,
    ]
  );
}

/**
 * Get voice wellness trends for user over a time period
 */
export async function getVoiceTrends(
  userId: string,
  days: number = 30
): Promise<WellnessTrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { rows } = await pool.query(
    `
    SELECT
      id,
      user_id,
      period_start,
      period_end,
      period_type,
      recording_count,
      total_duration_seconds,
      avg_valence,
      avg_arousal,
      avg_wellness_score,
      emotion_distribution,
      trend_direction,
      trend_confidence,
      high_risk_count,
      crisis_keyword_count
    FROM voice_wellness_trends
    WHERE user_id = $1
      AND period_start >= $2::timestamp
    ORDER BY period_start ASC
    `,
    [userId, startDate.toISOString()]
  );

  return rows.map(row => ({
    periodStart: row.period_start?.toISOString() || '',
    periodEnd: row.period_end?.toISOString() || '',
    periodType: row.period_type,
    recordingCount: row.recording_count,
    totalDurationSeconds: parseFloat(row.total_duration_seconds),
    avgValence: parseFloat(row.avg_valence),
    avgArousal: parseFloat(row.avg_arousal),
    avgWellnessScore: parseFloat(row.avg_wellness_score),
    emotionDistribution: row.emotion_distribution,
    trendDirection: row.trend_direction,
    trendConfidence: parseFloat(row.trend_confidence),
    highRiskCount: row.high_risk_count,
    crisisKeywordCount: row.crisis_keyword_count,
  }));
}

/**
 * Calculate overall wellness summary for user
 */
export async function getWellnessSummary(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) as total_analyses,
      AVG(wellness_score) as avg_wellness,
      MIN(wellness_score) as min_wellness,
      MAX(wellness_score) as max_wellness,
      AVG(valence) as avg_valence,
      AVG(arousal) as avg_arousal,
      SUM(CASE WHEN risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) as high_risk_count,
      SUM(ARRAY_LENGTH(crisis_keywords, 1)) as total_crisis_keywords,
      SUM(duration_seconds) as total_duration_seconds,
      json_object_agg(
        COALESCE(primary_emotion, 'neutral'),
        COUNT(*)
      ) as emotion_distribution
    FROM voice_analyses
    WHERE user_id = $1
      AND processing_status = 'completed'
      AND created_at >= $2::timestamp
    `,
    [userId, startDate.toISOString()]
  );

  const summary = rows[0] || {};

  return {
    totalAnalyses: parseInt(summary.total_analyses) || 0,
    averageWellness: parseFloat(summary.avg_wellness) || 0,
    minWellness: parseFloat(summary.min_wellness) || 0,
    maxWellness: parseFloat(summary.max_wellness) || 0,
    averageValence: parseFloat(summary.avg_valence) || 0,
    averageArousal: parseFloat(summary.avg_arousal) || 0,
    highRiskCount: parseInt(summary.high_risk_count) || 0,
    totalCrisisKeywords: parseInt(summary.total_crisis_keywords) || 0,
    totalDurationSeconds: parseFloat(summary.total_duration_seconds) || 0,
    emotionDistribution: summary.emotion_distribution || {},
  };
}

/**
 * Compare trends between two time periods to identify changes
 */
export async function compareTrendPeriods(
  userId: string,
  period1: { start: Date; end: Date },
  period2: { start: Date; end: Date }
) {
  const queryTrend = async (startDate: Date, endDate: Date) => {
    const { rows } = await pool.query(
      `
      SELECT
        AVG(wellness_score) as avg_wellness,
        AVG(valence) as avg_valence,
        AVG(arousal) as avg_arousal,
        COUNT(*) as count
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND created_at <= $3::timestamp
      `,
      [userId, startDate.toISOString(), endDate.toISOString()]
    );
    return rows[0] || {};
  };

  const trend1 = await queryTrend(period1.start, period1.end);
  const trend2 = await queryTrend(period2.start, period2.end);

  const wellnessChange = parseFloat(trend2.avg_wellness || 0) - parseFloat(trend1.avg_wellness || 0);
  const valenceChange = parseFloat(trend2.avg_valence || 0) - parseFloat(trend1.avg_valence || 0);

  return {
    period1: {
      avgWellness: parseFloat(trend1.avg_wellness) || 0,
      avgValence: parseFloat(trend1.avg_valence) || 0,
      avgArousal: parseFloat(trend1.avg_arousal) || 0,
      recordingCount: parseInt(trend1.count) || 0,
    },
    period2: {
      avgWellness: parseFloat(trend2.avg_wellness) || 0,
      avgValence: parseFloat(trend2.avg_valence) || 0,
      avgArousal: parseFloat(trend2.avg_arousal) || 0,
      recordingCount: parseInt(trend2.count) || 0,
    },
    change: {
      wellnessChange: Math.round(wellnessChange * 100) / 100,
      valenceChange: Math.round(valenceChange * 10000) / 10000,
      percentageChange: parseFloat(trend1.avg_wellness) > 0
        ? Math.round((wellnessChange / parseFloat(trend1.avg_wellness)) * 100)
        : 0,
    },
  };
}
