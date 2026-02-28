import { pool } from '../db';

/**
 * Cross-Metric Analysis Service
 *
 * Discovers correlations between voice wellness and other health metrics.
 * Supports lagged correlation analysis to identify time-delayed relationships.
 * Uses Pearson correlation with statistical significance testing.
 * Follows the pattern from voiceCorrelationAnalysis.ts
 */

interface CorrelationResult {
  metricType: 'mood' | 'sleep' | 'medication' | 'activity' | 'custom';
  metricName: string;
  correlationStrength: number; // -1 to 1 (Pearson coefficient)
  confidenceScore: number; // 0 to 1
  sampleSize: number;
  lagDays: number; // Time offset (0 = same day, -1 = previous day, +1 = next day)
  significance: 'strong' | 'moderate' | 'weak' | 'none';
  interpretation: string;
  pValue?: number; // Statistical significance
}

interface CrossMetricAnalysis {
  userId: string;
  analysisDate: Date;
  correlations: CorrelationResult[];
  topCorrelations: CorrelationResult[];
  insights: string[];
}

/**
 * Calculate Pearson correlation coefficient
 * Returns correlation strength (-1 to 1)
 */
function calculatePearsonCorrelation(
  xValues: number[],
  yValues: number[]
): { correlation: number; pValue: number } {
  const n = xValues.length;

  if (n < 3 || xValues.length !== yValues.length) {
    return { correlation: 0, pValue: 1 };
  }

  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  // Calculate correlation
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xDenominator * yDenominator);
  const correlation = denominator !== 0 ? numerator / denominator : 0;

  // Calculate approximate p-value using t-distribution
  const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
  const pValue = 2 * (1 - approximateTCDF(Math.abs(t), n - 2));

  return {
    correlation: Math.max(-1, Math.min(1, correlation)),
    pValue: Math.max(0, Math.min(1, pValue))
  };
}

/**
 * Approximate cumulative distribution function for t-distribution
 * Used for p-value calculation
 */
function approximateTCDF(t: number, df: number): number {
  // Simple approximation for p-value calculation
  // For production, consider using a proper statistics library
  const x = df / (df + t * t);
  return 1 - 0.5 * Math.pow(x, df / 2);
}

/**
 * Analyze correlation between voice wellness and mood logs
 * Supports lagged correlation (e.g., does today's mood predict tomorrow's voice wellness?)
 */
export async function analyzeVoiceMoodCorrelation(
  userId: string,
  days: number = 30,
  lagDays: number = 0
): Promise<CorrelationResult> {
  console.log(`🔗 Analyzing voice-mood correlation for user ${userId} (lag: ${lagDays} days)`);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get voice analyses and mood logs with lag offset
    const { rows } = await pool.query(
      `
      SELECT
        DATE(va.created_at) as voice_date,
        AVG(va.wellness_score) as voice_wellness,
        AVG(ml.mood_score) as mood_score
      FROM voice_analyses va
      LEFT JOIN mood_logs ml ON
        DATE(va.created_at) = DATE(ml.recorded_at + INTERVAL '${lagDays} days')
        AND va.user_id = ml.user_id
      WHERE va.user_id = $1
        AND va.processing_status = 'completed'
        AND va.created_at >= $2::timestamp
      GROUP BY DATE(va.created_at)
      HAVING AVG(ml.mood_score) IS NOT NULL
      ORDER BY voice_date ASC
      `,
      [userId, startDate.toISOString()]
    );

    const validPairs = rows.map(row => ({
      voice: parseFloat(row.voice_wellness),
      mood: parseFloat(row.mood_score)
    }));

    if (validPairs.length < 5) {
      return {
        metricType: 'mood',
        metricName: 'Daily Mood Score',
        correlationStrength: 0,
        confidenceScore: 0,
        sampleSize: validPairs.length,
        lagDays,
        significance: 'none',
        interpretation: 'Insufficient data for correlation analysis',
        pValue: 1
      };
    }

    const voiceValues = validPairs.map(p => p.voice);
    const moodValues = validPairs.map(p => p.mood);

    const { correlation, pValue } = calculatePearsonCorrelation(voiceValues, moodValues);

    // Calculate confidence based on sample size and p-value
    const sampleConfidence = Math.min(1, validPairs.length / 30);
    const statisticalConfidence = 1 - pValue;
    const confidenceScore = (sampleConfidence + statisticalConfidence) / 2;

    // Determine significance
    const absCorr = Math.abs(correlation);
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (absCorr >= 0.7) significance = 'strong';
    else if (absCorr >= 0.4) significance = 'moderate';
    else if (absCorr >= 0.2) significance = 'weak';
    else significance = 'none';

    const interpretation = generateInterpretation(correlation, 'mood', lagDays);

    return {
      metricType: 'mood',
      metricName: 'Daily Mood Score',
      correlationStrength: Math.round(correlation * 10000) / 10000,
      confidenceScore: Math.round(confidenceScore * 10000) / 10000,
      sampleSize: validPairs.length,
      lagDays,
      significance,
      interpretation,
      pValue: Math.round(pValue * 10000) / 10000
    };

  } catch (error) {
    console.error('Error analyzing voice-mood correlation:', error);
    throw error;
  }
}

/**
 * Analyze correlation between voice wellness and sleep quality
 * Typically use lag=-1 (previous night's sleep affects today's voice)
 */
export async function analyzeVoiceSleepCorrelation(
  userId: string,
  days: number = 30,
  lagDays: number = -1
): Promise<CorrelationResult> {
  console.log(`🔗 Analyzing voice-sleep correlation for user ${userId} (lag: ${lagDays} days)`);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { rows } = await pool.query(
      `
      SELECT
        DATE(va.created_at) as voice_date,
        AVG(va.wellness_score) as voice_wellness,
        AVG(sl.quality_score) as sleep_quality
      FROM voice_analyses va
      LEFT JOIN sleep_logs sl ON
        DATE(va.created_at) = DATE(sl.recorded_at + INTERVAL '${lagDays} days')
        AND va.user_id = sl.user_id
      WHERE va.user_id = $1
        AND va.processing_status = 'completed'
        AND va.created_at >= $2::timestamp
      GROUP BY DATE(va.created_at)
      HAVING AVG(sl.quality_score) IS NOT NULL
      ORDER BY voice_date ASC
      `,
      [userId, startDate.toISOString()]
    );

    const validPairs = rows.map(row => ({
      voice: parseFloat(row.voice_wellness),
      sleep: parseFloat(row.sleep_quality)
    }));

    if (validPairs.length < 5) {
      return {
        metricType: 'sleep',
        metricName: 'Sleep Quality',
        correlationStrength: 0,
        confidenceScore: 0,
        sampleSize: validPairs.length,
        lagDays,
        significance: 'none',
        interpretation: 'Insufficient sleep data for correlation analysis',
        pValue: 1
      };
    }

    const voiceValues = validPairs.map(p => p.voice);
    const sleepValues = validPairs.map(p => p.sleep);

    const { correlation, pValue } = calculatePearsonCorrelation(voiceValues, sleepValues);
    const sampleConfidence = Math.min(1, validPairs.length / 30);
    const statisticalConfidence = 1 - pValue;
    const confidenceScore = (sampleConfidence + statisticalConfidence) / 2;

    const absCorr = Math.abs(correlation);
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (absCorr >= 0.7) significance = 'strong';
    else if (absCorr >= 0.4) significance = 'moderate';
    else if (absCorr >= 0.2) significance = 'weak';
    else significance = 'none';

    const interpretation = generateInterpretation(correlation, 'sleep', lagDays);

    return {
      metricType: 'sleep',
      metricName: 'Sleep Quality',
      correlationStrength: Math.round(correlation * 10000) / 10000,
      confidenceScore: Math.round(confidenceScore * 10000) / 10000,
      sampleSize: validPairs.length,
      lagDays,
      significance,
      interpretation,
      pValue: Math.round(pValue * 10000) / 10000
    };

  } catch (error) {
    console.error('Error analyzing voice-sleep correlation:', error);
    throw error;
  }
}

/**
 * Analyze correlation between voice wellness and medication adherence
 */
export async function analyzeVoiceMedicationCorrelation(
  userId: string,
  days: number = 30,
  lagDays: number = 0
): Promise<CorrelationResult> {
  console.log(`🔗 Analyzing voice-medication correlation for user ${userId}`);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { rows } = await pool.query(
      `
      SELECT
        DATE(va.created_at) as voice_date,
        AVG(va.wellness_score) as voice_wellness,
        COUNT(ml.id) as medication_taken
      FROM voice_analyses va
      LEFT JOIN medication_logs ml ON
        DATE(va.created_at) = DATE(ml.recorded_at + INTERVAL '${lagDays} days')
        AND va.user_id = ml.user_id
      WHERE va.user_id = $1
        AND va.processing_status = 'completed'
        AND va.created_at >= $2::timestamp
      GROUP BY DATE(va.created_at)
      ORDER BY voice_date ASC
      `,
      [userId, startDate.toISOString()]
    );

    const validPairs = rows.map(row => ({
      voice: parseFloat(row.voice_wellness),
      medication: parseInt(row.medication_taken) > 0 ? 1 : 0
    }));

    if (validPairs.length < 5) {
      return {
        metricType: 'medication',
        metricName: 'Medication Adherence',
        correlationStrength: 0,
        confidenceScore: 0,
        sampleSize: validPairs.length,
        lagDays,
        significance: 'none',
        interpretation: 'Insufficient medication data for correlation analysis',
        pValue: 1
      };
    }

    // Point-biserial correlation (binary medication variable)
    const voiceValues = validPairs.map(p => p.voice);
    const medicationValues = validPairs.map(p => p.medication);

    const { correlation, pValue } = calculatePearsonCorrelation(voiceValues, medicationValues);
    const confidenceScore = Math.min(1, 0.5 + (validPairs.length / 60) * 0.5);

    const absCorr = Math.abs(correlation);
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (absCorr >= 0.7) significance = 'strong';
    else if (absCorr >= 0.4) significance = 'moderate';
    else if (absCorr >= 0.2) significance = 'weak';
    else significance = 'none';

    const interpretation = generateInterpretation(correlation, 'medication', lagDays);

    return {
      metricType: 'medication',
      metricName: 'Medication Adherence',
      correlationStrength: Math.round(correlation * 10000) / 10000,
      confidenceScore: Math.round(confidenceScore * 10000) / 10000,
      sampleSize: validPairs.length,
      lagDays,
      significance,
      interpretation,
      pValue: Math.round(pValue * 10000) / 10000
    };

  } catch (error) {
    console.error('Error analyzing voice-medication correlation:', error);
    throw error;
  }
}

/**
 * Analyze correlation between voice wellness and activity completion
 */
export async function analyzeVoiceActivityCorrelation(
  userId: string,
  days: number = 30,
  lagDays: number = 0
): Promise<CorrelationResult> {
  console.log(`🔗 Analyzing voice-activity correlation for user ${userId}`);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { rows } = await pool.query(
      `
      SELECT
        DATE(va.created_at) as voice_date,
        AVG(va.wellness_score) as voice_wellness,
        COUNT(uac.id) as activity_count
      FROM voice_analyses va
      LEFT JOIN user_activity_completions uac ON
        DATE(va.created_at) = DATE(uac.completed_at + INTERVAL '${lagDays} days')
        AND va.user_id = uac.user_id
      WHERE va.user_id = $1
        AND va.processing_status = 'completed'
        AND va.created_at >= $2::timestamp
      GROUP BY DATE(va.created_at)
      ORDER BY voice_date ASC
      `,
      [userId, startDate.toISOString()]
    );

    const validPairs = rows.map(row => ({
      voice: parseFloat(row.voice_wellness),
      activities: parseInt(row.activity_count)
    }));

    if (validPairs.length < 5) {
      return {
        metricType: 'activity',
        metricName: 'Wellness Activities',
        correlationStrength: 0,
        confidenceScore: 0,
        sampleSize: validPairs.length,
        lagDays,
        significance: 'none',
        interpretation: 'Insufficient activity data for correlation analysis',
        pValue: 1
      };
    }

    const voiceValues = validPairs.map(p => p.voice);
    const activityValues = validPairs.map(p => p.activities);

    const { correlation, pValue } = calculatePearsonCorrelation(voiceValues, activityValues);
    const confidenceScore = Math.min(1, 0.5 + (validPairs.length / 60) * 0.5);

    const absCorr = Math.abs(correlation);
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (absCorr >= 0.7) significance = 'strong';
    else if (absCorr >= 0.4) significance = 'moderate';
    else if (absCorr >= 0.2) significance = 'weak';
    else significance = 'none';

    const interpretation = generateInterpretation(correlation, 'activity', lagDays);

    return {
      metricType: 'activity',
      metricName: 'Wellness Activities',
      correlationStrength: Math.round(correlation * 10000) / 10000,
      confidenceScore: Math.round(confidenceScore * 10000) / 10000,
      sampleSize: validPairs.length,
      lagDays,
      significance,
      interpretation,
      pValue: Math.round(pValue * 10000) / 10000
    };

  } catch (error) {
    console.error('Error analyzing voice-activity correlation:', error);
    throw error;
  }
}

/**
 * Perform comprehensive cross-metric analysis with lag testing
 * Tests multiple lag values to find optimal correlation windows
 */
export async function performComprehensiveCrossMetricAnalysis(
  userId: string,
  days: number = 30
): Promise<CrossMetricAnalysis> {
  console.log(`📊 Performing comprehensive cross-metric analysis for user ${userId}`);

  try {
    const allCorrelations: CorrelationResult[] = [];

    // Test different lag values for each metric
    const lagValues = [-2, -1, 0, 1, 2]; // Previous 2 days, previous day, same day, next day, next 2 days

    // Mood correlations
    for (const lag of lagValues) {
      const result = await analyzeVoiceMoodCorrelation(userId, days, lag);
      if (result.sampleSize >= 5) {
        allCorrelations.push(result);
      }
    }

    // Sleep correlations (typically previous night matters most)
    for (const lag of [-2, -1, 0]) {
      const result = await analyzeVoiceSleepCorrelation(userId, days, lag);
      if (result.sampleSize >= 5) {
        allCorrelations.push(result);
      }
    }

    // Medication correlations
    for (const lag of [0, 1]) {
      const result = await analyzeVoiceMedicationCorrelation(userId, days, lag);
      if (result.sampleSize >= 5) {
        allCorrelations.push(result);
      }
    }

    // Activity correlations
    for (const lag of [-1, 0]) {
      const result = await analyzeVoiceActivityCorrelation(userId, days, lag);
      if (result.sampleSize >= 5) {
        allCorrelations.push(result);
      }
    }

    // Get top correlations (highest absolute correlation strength)
    const topCorrelations = [...allCorrelations]
      .sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength))
      .slice(0, 5);

    // Generate insights
    const insights = generateCrossMetricInsights(topCorrelations);

    return {
      userId,
      analysisDate: new Date(),
      correlations: allCorrelations,
      topCorrelations,
      insights
    };

  } catch (error) {
    console.error('Error performing cross-metric analysis:', error);
    throw error;
  }
}

/**
 * Generate human-readable interpretation of correlation
 */
function generateInterpretation(correlation: number, metricType: string, lagDays: number): string {
  const absCorr = Math.abs(correlation);
  const direction = correlation > 0 ? 'positively' : 'negatively';
  const strength = absCorr >= 0.7 ? 'strongly' : absCorr >= 0.4 ? 'moderately' : 'weakly';

  let lagText = '';
  if (lagDays < 0) {
    lagText = ` ${Math.abs(lagDays)} day(s) before`;
  } else if (lagDays > 0) {
    lagText = ` ${lagDays} day(s) after`;
  } else {
    lagText = ' on the same day';
  }

  if (absCorr < 0.1) {
    return `No meaningful correlation found between voice wellness and ${metricType}${lagText}.`;
  }

  return `Voice wellness is ${strength} ${direction} correlated with ${metricType}${lagText}.`;
}

/**
 * Generate actionable insights from correlation results
 */
function generateCrossMetricInsights(topCorrelations: CorrelationResult[]): string[] {
  const insights: string[] = [];

  for (const corr of topCorrelations) {
    if (corr.significance === 'none') continue;

    const absCorr = Math.abs(corr.correlationStrength);
    const isPositive = corr.correlationStrength > 0;

    if (corr.metricType === 'sleep' && absCorr >= 0.4) {
      if (isPositive && corr.lagDays < 0) {
        insights.push(`Better sleep quality ${Math.abs(corr.lagDays)} day(s) before is linked to improved voice wellness. Prioritize consistent sleep schedules.`);
      }
    }

    if (corr.metricType === 'activity' && absCorr >= 0.4) {
      if (isPositive) {
        insights.push(`Completing wellness activities is associated with better emotional health in voice recordings. Aim for 2-3 activities daily.`);
      }
    }

    if (corr.metricType === 'medication' && absCorr >= 0.3) {
      if (isPositive) {
        insights.push(`Medication adherence shows a positive relationship with voice wellness. Continue consistent medication routines.`);
      }
    }

    if (corr.metricType === 'mood' && absCorr >= 0.5) {
      insights.push(`Strong ${isPositive ? 'positive' : 'negative'} relationship between mood logs and voice wellness. Both metrics are validating each other.`);
    }
  }

  if (insights.length === 0) {
    insights.push('Continue tracking multiple health metrics to discover personalized wellness patterns over time.');
  }

  return insights;
}

/**
 * Get best lag value for a specific metric type
 * Returns the lag that produces the highest correlation
 */
export async function findOptimalLag(
  userId: string,
  metricType: 'mood' | 'sleep' | 'medication' | 'activity',
  days: number = 30
): Promise<{ optimalLag: number; correlation: number; confidence: number }> {
  const lagValues = [-3, -2, -1, 0, 1, 2, 3];
  let bestLag = 0;
  let bestCorrelation = 0;
  let bestConfidence = 0;

  for (const lag of lagValues) {
    let result: CorrelationResult;

    switch (metricType) {
      case 'mood':
        result = await analyzeVoiceMoodCorrelation(userId, days, lag);
        break;
      case 'sleep':
        result = await analyzeVoiceSleepCorrelation(userId, days, lag);
        break;
      case 'medication':
        result = await analyzeVoiceMedicationCorrelation(userId, days, lag);
        break;
      case 'activity':
        result = await analyzeVoiceActivityCorrelation(userId, days, lag);
        break;
    }

    if (Math.abs(result.correlationStrength) > Math.abs(bestCorrelation)) {
      bestLag = lag;
      bestCorrelation = result.correlationStrength;
      bestConfidence = result.confidenceScore;
    }
  }

  return {
    optimalLag: bestLag,
    correlation: bestCorrelation,
    confidence: bestConfidence
  };
}
