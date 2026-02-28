import { pool } from '../db';

/**
 * User Baseline Calculation Service
 *
 * Calculates personalized emotion baselines for users over different time windows.
 * Enables deviation detection and personalized wellness tracking.
 * Follows the time-series aggregation pattern from voiceTrendCalculation.ts
 */

interface UserBaseline {
  userId: string;
  windowDays: 30 | 60 | 90;
  baselineWellnessScore: number;
  baselineValence: number;
  baselineArousal: number;
  baselineDominance: number;
  wellnessStdDev: number;
  valenceStdDev: number;
  arousalStdDev: number;
  dominanceStdDev: number;
  dataPointCount: number;
  baselineConfidence: number;
  lastUpdatedAt: Date;
}

interface BaselineDeviation {
  metric: 'wellness' | 'valence' | 'arousal' | 'dominance';
  currentValue: number;
  baselineValue: number;
  zScore: number;
  isSignificant: boolean; // |z| > 2.0
  direction: 'elevated' | 'reduced' | 'normal';
  stdDev: number;
}

/**
 * Calculate personalized baseline for a user over specified window
 * Uses rolling window of 30, 60, or 90 days
 */
export async function calculateUserBaseline(
  userId: string,
  windowDays: 30 | 60 | 90 = 30
): Promise<UserBaseline | null> {
  console.log(`📊 Calculating ${windowDays}-day baseline for user ${userId}`);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    // Query to calculate baseline statistics from voice analyses
    const { rows } = await pool.query(
      `
      SELECT
        COUNT(*) as data_point_count,
        AVG(wellness_score) as avg_wellness,
        AVG(valence) as avg_valence,
        AVG(arousal) as avg_arousal,
        AVG(dominance) as avg_dominance,
        STDDEV_POP(wellness_score) as stddev_wellness,
        STDDEV_POP(valence) as stddev_valence,
        STDDEV_POP(arousal) as stddev_arousal,
        STDDEV_POP(dominance) as stddev_dominance
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND wellness_score IS NOT NULL
      `,
      [userId, startDate.toISOString()]
    );

    const data = rows[0];
    const dataPointCount = parseInt(data.data_point_count) || 0;

    // Require minimum 7 days of data for reliable baseline
    if (dataPointCount < 7) {
      console.log(`⚠️  Insufficient data for ${windowDays}-day baseline (${dataPointCount} points, need 7+)`);
      return null;
    }

    // Calculate confidence score based on data quantity and quality
    // Confidence increases with more data points, caps at 0.95
    const baselineConfidence = Math.min(0.95, 0.5 + (dataPointCount / (windowDays * 2)) * 0.45);

    const baseline: UserBaseline = {
      userId,
      windowDays,
      baselineWellnessScore: parseFloat(data.avg_wellness) || 0,
      baselineValence: parseFloat(data.avg_valence) || 0,
      baselineArousal: parseFloat(data.avg_arousal) || 0,
      baselineDominance: parseFloat(data.avg_dominance) || 0,
      wellnessStdDev: parseFloat(data.stddev_wellness) || 0,
      valenceStdDev: parseFloat(data.stddev_valence) || 0,
      arousalStdDev: parseFloat(data.stddev_arousal) || 0,
      dominanceStdDev: parseFloat(data.stddev_dominance) || 0,
      dataPointCount,
      baselineConfidence: Math.round(baselineConfidence * 10000) / 10000,
      lastUpdatedAt: new Date(),
    };

    // Save baseline to database
    await saveBaselineToDB(baseline);

    console.log(`✅ Calculated ${windowDays}-day baseline: wellness=${baseline.baselineWellnessScore.toFixed(1)}, confidence=${(baseline.baselineConfidence * 100).toFixed(0)}%`);
    return baseline;

  } catch (error) {
    console.error(`❌ Error calculating baseline for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Calculate all baseline windows (30, 60, 90 days) for a user
 * Called when user has new data or during backfill
 */
export async function updateBaselineMetrics(userId: string): Promise<UserBaseline[]> {
  console.log(`🔄 Updating all baseline metrics for user ${userId}`);

  const baselines: UserBaseline[] = [];

  // Calculate each time window
  for (const windowDays of [30, 60, 90] as const) {
    const baseline = await calculateUserBaseline(userId, windowDays);
    if (baseline) {
      baselines.push(baseline);
    }
  }

  console.log(`✅ Updated ${baselines.length} baseline windows for user ${userId}`);
  return baselines;
}

/**
 * Detect deviations from baseline for recent data
 * Returns z-scores and significance flags
 */
export async function detectBaselineDeviations(
  userId: string,
  recentDays: number = 7
): Promise<BaselineDeviation[]> {
  console.log(`🔍 Detecting baseline deviations for user ${userId} (last ${recentDays} days)`);

  try {
    // Get 30-day baseline (most recent and stable)
    const baseline = await getPersonalizedBaseline(userId, 30);
    if (!baseline) {
      console.log(`⚠️  No baseline found for user ${userId}`);
      return [];
    }

    // Get recent average values
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - recentDays);

    const { rows } = await pool.query(
      `
      SELECT
        AVG(wellness_score) as recent_wellness,
        AVG(valence) as recent_valence,
        AVG(arousal) as recent_arousal,
        AVG(dominance) as recent_dominance,
        COUNT(*) as recent_count
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND wellness_score IS NOT NULL
      `,
      [userId, startDate.toISOString()]
    );

    const recentData = rows[0];
    const recentCount = parseInt(recentData.recent_count) || 0;

    if (recentCount < 3) {
      console.log(`⚠️  Insufficient recent data for deviation detection (${recentCount} points)`);
      return [];
    }

    // Calculate z-scores for each metric
    const deviations: BaselineDeviation[] = [];

    // Wellness score deviation
    const wellnessZScore = calculateZScore(
      parseFloat(recentData.recent_wellness),
      baseline.baselineWellnessScore,
      baseline.wellnessStdDev
    );
    deviations.push({
      metric: 'wellness',
      currentValue: parseFloat(recentData.recent_wellness) || 0,
      baselineValue: baseline.baselineWellnessScore,
      zScore: wellnessZScore,
      isSignificant: Math.abs(wellnessZScore) > 2.0,
      direction: wellnessZScore > 2.0 ? 'elevated' : wellnessZScore < -2.0 ? 'reduced' : 'normal',
      stdDev: baseline.wellnessStdDev,
    });

    // Valence deviation
    const valenceZScore = calculateZScore(
      parseFloat(recentData.recent_valence),
      baseline.baselineValence,
      baseline.valenceStdDev
    );
    deviations.push({
      metric: 'valence',
      currentValue: parseFloat(recentData.recent_valence) || 0,
      baselineValue: baseline.baselineValence,
      zScore: valenceZScore,
      isSignificant: Math.abs(valenceZScore) > 2.0,
      direction: valenceZScore > 2.0 ? 'elevated' : valenceZScore < -2.0 ? 'reduced' : 'normal',
      stdDev: baseline.valenceStdDev,
    });

    // Arousal deviation
    const arousalZScore = calculateZScore(
      parseFloat(recentData.recent_arousal),
      baseline.baselineArousal,
      baseline.arousalStdDev
    );
    deviations.push({
      metric: 'arousal',
      currentValue: parseFloat(recentData.recent_arousal) || 0,
      baselineValue: baseline.baselineArousal,
      zScore: arousalZScore,
      isSignificant: Math.abs(arousalZScore) > 2.0,
      direction: arousalZScore > 2.0 ? 'elevated' : arousalZScore < -2.0 ? 'reduced' : 'normal',
      stdDev: baseline.arousalStdDev,
    });

    // Dominance deviation
    const dominanceZScore = calculateZScore(
      parseFloat(recentData.recent_dominance),
      baseline.baselineDominance,
      baseline.dominanceStdDev
    );
    deviations.push({
      metric: 'dominance',
      currentValue: parseFloat(recentData.recent_dominance) || 0,
      baselineValue: baseline.baselineDominance,
      zScore: dominanceZScore,
      isSignificant: Math.abs(dominanceZScore) > 2.0,
      direction: dominanceZScore > 2.0 ? 'elevated' : dominanceZScore < -2.0 ? 'reduced' : 'normal',
      stdDev: baseline.dominanceStdDev,
    });

    // Filter to only significant deviations
    const significantDeviations = deviations.filter(d => d.isSignificant);

    if (significantDeviations.length > 0) {
      console.log(`⚠️  Found ${significantDeviations.length} significant deviations for user ${userId}`);
    } else {
      console.log(`✅ No significant deviations detected for user ${userId}`);
    }

    return deviations;

  } catch (error) {
    console.error(`❌ Error detecting deviations for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get personalized baseline for user
 * Returns the most recent baseline for specified window
 */
export async function getPersonalizedBaseline(
  userId: string,
  windowDays: 30 | 60 | 90 = 30
): Promise<UserBaseline | null> {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        user_id,
        window_days,
        baseline_wellness_score,
        baseline_valence,
        baseline_arousal,
        baseline_dominance,
        wellness_std_dev,
        valence_std_dev,
        arousal_std_dev,
        dominance_std_dev,
        data_point_count,
        baseline_confidence,
        last_updated_at
      FROM voice_user_baselines
      WHERE user_id = $1 AND window_days = $2
      ORDER BY last_updated_at DESC
      LIMIT 1
      `,
      [userId, windowDays]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      userId: row.user_id,
      windowDays: row.window_days,
      baselineWellnessScore: parseFloat(row.baseline_wellness_score) || 0,
      baselineValence: parseFloat(row.baseline_valence) || 0,
      baselineArousal: parseFloat(row.baseline_arousal) || 0,
      baselineDominance: parseFloat(row.baseline_dominance) || 0,
      wellnessStdDev: parseFloat(row.wellness_std_dev) || 0,
      valenceStdDev: parseFloat(row.valence_std_dev) || 0,
      arousalStdDev: parseFloat(row.arousal_std_dev) || 0,
      dominanceStdDev: parseFloat(row.dominance_std_dev) || 0,
      dataPointCount: row.data_point_count,
      baselineConfidence: parseFloat(row.baseline_confidence) || 0,
      lastUpdatedAt: row.last_updated_at,
    };

  } catch (error) {
    console.error(`❌ Error retrieving baseline for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get all baselines for a user (30, 60, 90 day windows)
 */
export async function getAllBaselines(userId: string): Promise<UserBaseline[]> {
  try {
    const baselines = await Promise.all([
      getPersonalizedBaseline(userId, 30),
      getPersonalizedBaseline(userId, 60),
      getPersonalizedBaseline(userId, 90),
    ]);

    return baselines.filter(b => b !== null) as UserBaseline[];
  } catch (error) {
    console.error(`❌ Error retrieving all baselines for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Calculate z-score for deviation detection
 * z-score = (value - baseline) / stdDev
 */
function calculateZScore(
  value: number,
  baseline: number,
  stdDev: number
): number {
  if (stdDev === 0 || isNaN(stdDev)) {
    return 0;
  }
  const zScore = (value - baseline) / stdDev;
  return Math.round(zScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Save baseline to database with upsert logic
 */
async function saveBaselineToDB(baseline: UserBaseline): Promise<void> {
  await pool.query(
    `
    INSERT INTO voice_user_baselines (
      user_id,
      window_days,
      baseline_wellness_score,
      baseline_valence,
      baseline_arousal,
      baseline_dominance,
      wellness_std_dev,
      valence_std_dev,
      arousal_std_dev,
      dominance_std_dev,
      data_point_count,
      baseline_confidence,
      last_updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    ON CONFLICT (user_id, window_days)
    DO UPDATE SET
      baseline_wellness_score = EXCLUDED.baseline_wellness_score,
      baseline_valence = EXCLUDED.baseline_valence,
      baseline_arousal = EXCLUDED.baseline_arousal,
      baseline_dominance = EXCLUDED.baseline_dominance,
      wellness_std_dev = EXCLUDED.wellness_std_dev,
      valence_std_dev = EXCLUDED.valence_std_dev,
      arousal_std_dev = EXCLUDED.arousal_std_dev,
      dominance_std_dev = EXCLUDED.dominance_std_dev,
      data_point_count = EXCLUDED.data_point_count,
      baseline_confidence = EXCLUDED.baseline_confidence,
      last_updated_at = NOW(),
      updated_at = NOW()
    `,
    [
      baseline.userId,
      baseline.windowDays,
      baseline.baselineWellnessScore,
      baseline.baselineValence,
      baseline.baselineArousal,
      baseline.baselineDominance,
      baseline.wellnessStdDev,
      baseline.valenceStdDev,
      baseline.arousalStdDev,
      baseline.dominanceStdDev,
      baseline.dataPointCount,
      baseline.baselineConfidence,
    ]
  );
}

/**
 * Backfill baselines for all users with sufficient data
 * Run this once to populate historical baselines
 */
export async function backfillAllUserBaselines(): Promise<void> {
  console.log('🔄 Starting baseline backfill for all users...');

  try {
    // Get all users who have completed voice analyses
    const { rows: users } = await pool.query(
      `
      SELECT DISTINCT user_id
      FROM voice_analyses
      WHERE processing_status = 'completed'
        AND wellness_score IS NOT NULL
      `
    );

    console.log(`📊 Found ${users.length} users with voice analysis data`);

    let successCount = 0;
    let skipCount = 0;

    for (const { user_id } of users) {
      try {
        const baselines = await updateBaselineMetrics(user_id);
        if (baselines.length > 0) {
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user_id}:`, error);
        skipCount++;
      }
    }

    console.log(`✅ Baseline backfill complete: ${successCount} users processed, ${skipCount} skipped`);

  } catch (error) {
    console.error('❌ Error during baseline backfill:', error);
    throw error;
  }
}

/**
 * Check if baseline needs recalculation
 * Returns true if baseline is older than 24 hours or doesn't exist
 */
export async function shouldRecalculateBaseline(
  userId: string,
  windowDays: 30 | 60 | 90 = 30
): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      `
      SELECT last_updated_at
      FROM voice_user_baselines
      WHERE user_id = $1 AND window_days = $2
      `,
      [userId, windowDays]
    );

    if (rows.length === 0) {
      return true; // No baseline exists
    }

    const lastUpdated = new Date(rows[0].last_updated_at);
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    // Recalculate if older than 24 hours
    return hoursSinceUpdate > 24;

  } catch (error) {
    console.error(`❌ Error checking baseline age for user ${userId}:`, error);
    return true; // Recalculate on error to be safe
  }
}
