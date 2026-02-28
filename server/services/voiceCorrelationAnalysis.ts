import { pool } from '../db';

/**
 * Voice Correlation Analysis Service
 *
 * Discovers relationships between voice wellness and other health metrics
 * Follows the correlation pattern from analyticsCalculation.ts
 */

interface CorrelationResult {
  correlationType: 'mood' | 'sleep' | 'medication' | 'activity' | 'custom';
  correlationStrength: number; // Pearson coefficient [-1, 1]
  confidenceScore: number; // [0, 1]
  sampleSize: number;
  timeDeltaHours: number;
  interpretation: string;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function calculatePearsonCorrelation(
  xValues: number[],
  yValues: number[]
): number {
  if (xValues.length < 2 || xValues.length !== yValues.length) {
    return 0;
  }

  const n = xValues.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate correlation between voice wellness and mood entries
 */
export async function calculateVoiceMoodCorrelation(
  userId: string,
  days: number = 30,
  timeDeltaHours: number = 24
): Promise<CorrelationResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query voice analyses and mood entries for the same dates
  const { rows: correlationData } = await pool.query(
    `
    SELECT
      COALESCE(va.wellness_score::numeric, ml.mood_score::numeric) as voice_wellness,
      COALESCE(ml.mood_score::numeric, va.wellness_score::numeric) as mood_score,
      DATE(va.created_at) as voice_date,
      DATE(ml.recorded_at) as mood_date
    FROM voice_analyses va
    FULL OUTER JOIN mood_logs ml ON
      DATE(va.created_at) = DATE(ml.recorded_at)
      AND va.user_id = ml.user_id
    WHERE va.user_id = $1
      AND va.processing_status = 'completed'
      AND va.created_at >= $2::timestamp
      AND (ml.user_id = $1 OR ml.user_id IS NULL)
      AND (ml.recorded_at >= $2::timestamp OR ml.recorded_at IS NULL)
    ORDER BY COALESCE(DATE(va.created_at), DATE(ml.recorded_at)) ASC
    `,
    [userId, startDate.toISOString()]
  );

  // Extract valid pairs
  const validPairs = correlationData
    .filter(row => row.voice_wellness != null && row.mood_score != null)
    .map(row => ({
      wellness: parseFloat(row.voice_wellness),
      mood: parseFloat(row.mood_score),
    }));

  if (validPairs.length < 3) {
    return {
      correlationType: 'mood',
      correlationStrength: 0,
      confidenceScore: 0,
      sampleSize: validPairs.length,
      timeDeltaHours,
      interpretation: 'Insufficient data for correlation analysis',
    };
  }

  const wellnessValues = validPairs.map(p => p.wellness);
  const moodValues = validPairs.map(p => p.mood);

  const correlation = calculatePearsonCorrelation(wellnessValues, moodValues);

  // Calculate confidence based on sample size
  const confidence = Math.min(0.95, 0.4 + (validPairs.length / 60) * 0.5);

  const interpretation = interpretCorrelation(correlation, 'mood');

  // Save to database
  await saveCorrelationToDB(userId, {
    correlationType: 'mood',
    correlationStrength: correlation,
    confidenceScore: confidence,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  });

  return {
    correlationType: 'mood',
    correlationStrength: Math.round(correlation * 10000) / 10000,
    confidenceScore: Math.round(confidence * 10000) / 10000,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  };
}

/**
 * Calculate correlation between voice wellness and sleep quality
 */
export async function calculateVoiceSleepCorrelation(
  userId: string,
  days: number = 30,
  timeDeltaHours: number = -12 // Previous night
): Promise<CorrelationResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query voice analyses and sleep logs
  const { rows: correlationData } = await pool.query(
    `
    SELECT
      va.wellness_score,
      sl.quality_score,
      DATE(va.created_at) as voice_date,
      DATE(sl.recorded_at) as sleep_date
    FROM voice_analyses va
    LEFT JOIN sleep_logs sl ON
      DATE(va.created_at) = DATE(sl.recorded_at + INTERVAL '12 hours')
      AND va.user_id = sl.user_id
    WHERE va.user_id = $1
      AND va.processing_status = 'completed'
      AND va.created_at >= $2::timestamp
    ORDER BY DATE(va.created_at) ASC
    `,
    [userId, startDate.toISOString()]
  );

  // Extract valid pairs
  const validPairs = correlationData
    .filter(row => row.wellness_score != null && row.quality_score != null)
    .map(row => ({
      wellness: parseFloat(row.wellness_score),
      sleep: parseFloat(row.quality_score),
    }));

  if (validPairs.length < 3) {
    return {
      correlationType: 'sleep',
      correlationStrength: 0,
      confidenceScore: 0,
      sampleSize: validPairs.length,
      timeDeltaHours,
      interpretation: 'Insufficient sleep data for correlation analysis',
    };
  }

  const wellnessValues = validPairs.map(p => p.wellness);
  const sleepValues = validPairs.map(p => p.sleep);

  const correlation = calculatePearsonCorrelation(wellnessValues, sleepValues);
  const confidence = Math.min(0.95, 0.4 + (validPairs.length / 60) * 0.5);

  const interpretation = interpretCorrelation(correlation, 'sleep');

  await saveCorrelationToDB(userId, {
    correlationType: 'sleep',
    correlationStrength: correlation,
    confidenceScore: confidence,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  });

  return {
    correlationType: 'sleep',
    correlationStrength: Math.round(correlation * 10000) / 10000,
    confidenceScore: Math.round(confidence * 10000) / 10000,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  };
}

/**
 * Calculate correlation between voice wellness and medication adherence
 */
export async function calculateVoiceMedicationCorrelation(
  userId: string,
  days: number = 30,
  timeDeltaHours: number = 24
): Promise<CorrelationResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query voice analyses and medication logs
  const { rows: correlationData } = await pool.query(
    `
    SELECT
      va.wellness_score,
      CASE WHEN ml.recorded_at IS NOT NULL THEN 1 ELSE 0 END as took_medication,
      DATE(va.created_at) as voice_date,
      DATE(ml.recorded_at) as med_date
    FROM voice_analyses va
    LEFT JOIN medication_logs ml ON
      DATE(va.created_at) = DATE(ml.recorded_at)
      AND va.user_id = ml.user_id
    WHERE va.user_id = $1
      AND va.processing_status = 'completed'
      AND va.created_at >= $2::timestamp
    ORDER BY DATE(va.created_at) ASC
    `,
    [userId, startDate.toISOString()]
  );

  // Extract valid pairs
  const validPairs = correlationData
    .filter(row => row.wellness_score != null)
    .map(row => ({
      wellness: parseFloat(row.wellness_score),
      medication: row.took_medication,
    }));

  if (validPairs.length < 3) {
    return {
      correlationType: 'medication',
      correlationStrength: 0,
      confidenceScore: 0,
      sampleSize: validPairs.length,
      timeDeltaHours,
      interpretation: 'Insufficient medication data for correlation analysis',
    };
  }

  // Calculate average wellness with and without medication
  const withMed = validPairs.filter(p => p.medication === 1).map(p => p.wellness);
  const withoutMed = validPairs.filter(p => p.medication === 0).map(p => p.wellness);

  const avgWithMed = withMed.length > 0 ? withMed.reduce((a, b) => a + b) / withMed.length : 0;
  const avgWithoutMed = withoutMed.length > 0 ? withoutMed.reduce((a, b) => a + b) / withoutMed.length : 0;

  // Calculate point-biserial correlation
  const overallMean = validPairs.reduce((sum, p) => sum + p.wellness, 0) / validPairs.length;
  const n = validPairs.length;
  const n1 = withMed.length;
  const n0 = withoutMed.length;

  let correlation = 0;
  if (n1 > 0 && n0 > 0) {
    const numerator = (avgWithMed - avgWithoutMed) * Math.sqrt(n1 * n0);
    const denominator = Math.sqrt(
      validPairs.reduce((sum, p) => sum + Math.pow(p.wellness - overallMean, 2), 0)
    );
    correlation = denominator > 0 ? numerator / denominator / Math.sqrt(n) : 0;
  }

  const confidence = Math.min(0.95, 0.4 + (validPairs.length / 60) * 0.5);
  const interpretation = interpretCorrelation(correlation, 'medication');

  await saveCorrelationToDB(userId, {
    correlationType: 'medication',
    correlationStrength: correlation,
    confidenceScore: confidence,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  });

  return {
    correlationType: 'medication',
    correlationStrength: Math.round(correlation * 10000) / 10000,
    confidenceScore: Math.round(confidence * 10000) / 10000,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  };
}

/**
 * Calculate correlation between voice wellness and activity completion
 */
export async function calculateVoiceActivityCorrelation(
  userId: string,
  days: number = 30,
  timeDeltaHours: number = 24
): Promise<CorrelationResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query voice analyses and activity completions
  const { rows: correlationData } = await pool.query(
    `
    SELECT
      va.wellness_score,
      COUNT(uac.id) as activity_count,
      DATE(va.created_at) as voice_date
    FROM voice_analyses va
    LEFT JOIN user_activity_completions uac ON
      DATE(va.created_at) = DATE(uac.completed_at)
      AND va.user_id = uac.user_id
    WHERE va.user_id = $1
      AND va.processing_status = 'completed'
      AND va.created_at >= $2::timestamp
    GROUP BY DATE(va.created_at), va.wellness_score
    ORDER BY DATE(va.created_at) ASC
    `,
    [userId, startDate.toISOString()]
  );

  // Extract valid pairs
  const validPairs = correlationData
    .filter(row => row.wellness_score != null)
    .map(row => ({
      wellness: parseFloat(row.wellness_score),
      activities: parseInt(row.activity_count) || 0,
    }));

  if (validPairs.length < 3) {
    return {
      correlationType: 'activity',
      correlationStrength: 0,
      confidenceScore: 0,
      sampleSize: validPairs.length,
      timeDeltaHours,
      interpretation: 'Insufficient activity data for correlation analysis',
    };
  }

  const wellnessValues = validPairs.map(p => p.wellness);
  const activityValues = validPairs.map(p => p.activities);

  const correlation = calculatePearsonCorrelation(wellnessValues, activityValues);
  const confidence = Math.min(0.95, 0.4 + (validPairs.length / 60) * 0.5);
  const interpretation = interpretCorrelation(correlation, 'activity');

  await saveCorrelationToDB(userId, {
    correlationType: 'activity',
    correlationStrength: correlation,
    confidenceScore: confidence,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  });

  return {
    correlationType: 'activity',
    correlationStrength: Math.round(correlation * 10000) / 10000,
    confidenceScore: Math.round(confidence * 10000) / 10000,
    sampleSize: validPairs.length,
    timeDeltaHours,
    interpretation,
  };
}

/**
 * Calculate all available correlations for a user
 */
export async function calculateAllCorrelations(userId: string, days: number = 30) {
  console.log(`🔗 Calculating all voice correlations for user ${userId}`);

  try {
    const results = await Promise.all([
      calculateVoiceMoodCorrelation(userId, days),
      calculateVoiceSleepCorrelation(userId, days),
      calculateVoiceMedicationCorrelation(userId, days),
      calculateVoiceActivityCorrelation(userId, days),
    ]);

    // Filter out results with insufficient data
    const validResults = results.filter(r => r.sampleSize >= 3);

    console.log(`✅ Calculated ${validResults.length} correlations for user ${userId}`);
    return {
      correlations: validResults,
      timestamp: new Date().toISOString(),
      period_days: days,
    };
  } catch (error) {
    console.error('❌ Error calculating correlations:', error);
    throw error;
  }
}

/**
 * Get top correlations for user (sorted by strength)
 */
export async function getTopCorrelations(userId: string, limit: number = 5) {
  const { rows } = await pool.query(
    `
    SELECT DISTINCT ON (correlation_type)
      correlation_type,
      correlation_strength,
      confidence_score,
      time_delta_hours,
      notes
    FROM voice_correlations
    WHERE user_id = $1
    ORDER BY correlation_type, correlation_strength DESC NULLS LAST
    LIMIT $2
    `,
    [userId, limit]
  );

  return rows.map(row => ({
    correlationType: row.correlation_type,
    correlationStrength: parseFloat(row.correlation_strength),
    confidenceScore: parseFloat(row.confidence_score),
    timeDeltaHours: parseFloat(row.time_delta_hours),
    notes: row.notes,
  }));
}

/**
 * Save correlation result to database
 */
async function saveCorrelationToDB(
  userId: string,
  correlation: Omit<CorrelationResult, 'interpretation'> & { interpretation: string }
): Promise<void> {
  // Get a recent analysis ID for context
  const { rows: analyses } = await pool.query(
    `
    SELECT id FROM voice_analyses
    WHERE user_id = $1
      AND processing_status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  const analysisId = analyses[0]?.id || null;

  if (analysisId) {
    await pool.query(
      `
      INSERT INTO voice_correlations (
        user_id,
        analysis_id,
        correlation_type,
        correlation_strength,
        confidence_score,
        time_delta_hours,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        userId,
        analysisId,
        correlation.correlationType,
        correlation.correlationStrength,
        correlation.confidenceScore,
        correlation.timeDeltaHours,
        correlation.interpretation,
      ]
    );
  }
}

/**
 * Interpret correlation coefficient
 */
function interpretCorrelation(coefficient: number, type: string): string {
  const absCoeff = Math.abs(coefficient);

  if (absCoeff < 0.1) return `No meaningful correlation with ${type}`;
  if (absCoeff < 0.3) return `Weak correlation with ${type}`;
  if (absCoeff < 0.5) return `Moderate correlation with ${type}`;
  if (absCoeff < 0.7) return `Strong correlation with ${type}`;
  return `Very strong correlation with ${type}`;
}
