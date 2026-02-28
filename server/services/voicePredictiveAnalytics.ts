import { pool } from '../db';

/**
 * Voice Predictive Analytics Service
 *
 * Generates wellness forecasts using linear regression and time-series analysis.
 * Provides 7/14/30-day predictions with confidence intervals for proactive wellness planning.
 * Follows the analytics pattern from analyticsCalculation.ts
 */

interface PredictionResult {
  userId: string;
  predictionDate: Date;
  predictionWindow: 7 | 14 | 30;
  predictedWellnessScore: number;
  predictedValence: number;
  predictedArousal: number;
  predictedDominance: number;
  confidenceScore: number;
  rSquared: number;
  wellnessCiLower: number;
  wellnessCiUpper: number;
  valenceCiLower: number;
  valenceCiUpper: number;
  modelType: 'linear' | 'exponential' | 'ensemble';
  trainingDataPoints: number;
  generatedAt: Date;
  expiresAt: Date;
}

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
}

/**
 * Perform simple linear regression on time-series data
 * Returns slope, intercept, R², and standard error for confidence intervals
 */
function linearRegression(xValues: number[], yValues: number[]): LinearRegressionResult {
  const n = xValues.length;

  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, standardError: 0 };
  }

  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    ssTotal += Math.pow(yValues[i] - yMean, 2);
    ssResidual += Math.pow(yValues[i] - predicted, 2);
  }

  const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

  // Calculate standard error for confidence intervals
  const standardError = Math.sqrt(ssResidual / (n - 2));

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp to [0, 1]
    standardError
  };
}

/**
 * Generate wellness predictions for a user
 * Uses linear regression on historical voice analysis data
 */
export async function generateWellnessPredictions(
  userId: string,
  predictionWindow: 7 | 14 | 30 = 7,
  trainingDays: number = 60
): Promise<PredictionResult> {
  console.log(`📈 Generating ${predictionWindow}-day wellness prediction for user ${userId}`);

  try {
    // Get historical voice analysis data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - trainingDays);

    const { rows: historicalData } = await pool.query(
      `
      SELECT
        created_at,
        wellness_score,
        valence,
        arousal,
        dominance
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND wellness_score IS NOT NULL
      ORDER BY created_at ASC
      `,
      [userId, startDate.toISOString()]
    );

    const dataPointCount = historicalData.length;

    // Require minimum 14 data points for reliable predictions
    if (dataPointCount < 14) {
      console.log(`⚠️  Insufficient data for prediction (${dataPointCount} points, need 14+)`);
      throw new Error(`Insufficient data: need at least 14 voice analyses, found ${dataPointCount}`);
    }

    // Prepare time-series data (days since first analysis)
    const firstTimestamp = new Date(historicalData[0].created_at).getTime();
    const xValues: number[] = [];
    const wellnessValues: number[] = [];
    const valenceValues: number[] = [];
    const arousalValues: number[] = [];
    const dominanceValues: number[] = [];

    historicalData.forEach(row => {
      const daysSinceStart = (new Date(row.created_at).getTime() - firstTimestamp) / (1000 * 60 * 60 * 24);
      xValues.push(daysSinceStart);
      wellnessValues.push(parseFloat(row.wellness_score) || 0);
      valenceValues.push(parseFloat(row.valence) || 0);
      arousalValues.push(parseFloat(row.arousal) || 0);
      dominanceValues.push(parseFloat(row.dominance) || 0);
    });

    // Perform linear regression for each metric
    const wellnessModel = linearRegression(xValues, wellnessValues);
    const valenceModel = linearRegression(xValues, valenceValues);
    const arousalModel = linearRegression(xValues, arousalValues);
    const dominanceModel = linearRegression(xValues, dominanceValues);

    // Calculate prediction point (days into the future)
    const lastDataDay = xValues[xValues.length - 1];
    const predictionDay = lastDataDay + predictionWindow;

    // Generate predictions
    const predictedWellness = wellnessModel.slope * predictionDay + wellnessModel.intercept;
    const predictedValence = valenceModel.slope * predictionDay + valenceModel.intercept;
    const predictedArousal = arousalModel.slope * predictionDay + arousalModel.intercept;
    const predictedDominance = dominanceModel.slope * predictionDay + dominanceModel.intercept;

    // Calculate 95% confidence intervals (±1.96 standard errors)
    const ciMultiplier = 1.96;
    const wellnessCiMargin = wellnessModel.standardError * ciMultiplier;
    const valenceCiMargin = valenceModel.standardError * ciMultiplier;

    // Calculate overall confidence score (based on R² and data quantity)
    const avgRSquared = (wellnessModel.rSquared + valenceModel.rSquared + arousalModel.rSquared + dominanceModel.rSquared) / 4;
    const dataQualityFactor = Math.min(1, dataPointCount / 30); // Full confidence at 30+ points
    const confidenceScore = avgRSquared * dataQualityFactor;

    // Set expiration (predictions valid for 6 hours)
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000);

    // Determine prediction date
    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + predictionWindow);

    const result: PredictionResult = {
      userId,
      predictionDate,
      predictionWindow,
      predictedWellnessScore: Math.max(0, Math.min(100, predictedWellness)),
      predictedValence: Math.max(-1, Math.min(1, predictedValence)),
      predictedArousal: Math.max(0, Math.min(1, predictedArousal)),
      predictedDominance: Math.max(0, Math.min(1, predictedDominance)),
      confidenceScore: Math.round(confidenceScore * 10000) / 10000,
      rSquared: Math.round(avgRSquared * 10000) / 10000,
      wellnessCiLower: Math.max(0, Math.min(100, predictedWellness - wellnessCiMargin)),
      wellnessCiUpper: Math.max(0, Math.min(100, predictedWellness + wellnessCiMargin)),
      valenceCiLower: Math.max(-1, Math.min(1, predictedValence - valenceCiMargin)),
      valenceCiUpper: Math.max(-1, Math.min(1, predictedValence + valenceCiMargin)),
      modelType: 'linear',
      trainingDataPoints: dataPointCount,
      generatedAt,
      expiresAt
    };

    // Save prediction to database
    await savePredictionToDB(result);

    console.log(`✅ Generated ${predictionWindow}-day prediction: wellness=${result.predictedWellnessScore.toFixed(1)}, confidence=${(result.confidenceScore * 100).toFixed(0)}%`);
    return result;

  } catch (error) {
    console.error(`❌ Error generating prediction for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Generate predictions for all standard time windows (7, 14, 30 days)
 */
export async function generateAllPredictions(userId: string): Promise<PredictionResult[]> {
  console.log(`🔮 Generating all predictions for user ${userId}`);

  const predictions: PredictionResult[] = [];

  for (const window of [7, 14, 30] as const) {
    try {
      const prediction = await generateWellnessPredictions(userId, window);
      predictions.push(prediction);
    } catch (error) {
      console.error(`⚠️  Failed to generate ${window}-day prediction:`, error);
    }
  }

  console.log(`✅ Generated ${predictions.length} predictions for user ${userId}`);
  return predictions;
}

/**
 * Get active (non-expired) predictions for a user
 */
export async function getActivePredictions(userId: string): Promise<PredictionResult[]> {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        user_id,
        prediction_date,
        prediction_window,
        predicted_wellness_score,
        predicted_valence,
        predicted_arousal,
        predicted_dominance,
        confidence_score,
        r_squared,
        wellness_ci_lower,
        wellness_ci_upper,
        valence_ci_lower,
        valence_ci_upper,
        model_type,
        training_data_points,
        generated_at,
        expires_at
      FROM voice_predictions
      WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY prediction_window ASC
      `,
      [userId]
    );

    return rows.map(row => ({
      userId: row.user_id,
      predictionDate: row.prediction_date,
      predictionWindow: row.prediction_window,
      predictedWellnessScore: parseFloat(row.predicted_wellness_score),
      predictedValence: parseFloat(row.predicted_valence),
      predictedArousal: parseFloat(row.predicted_arousal),
      predictedDominance: parseFloat(row.predicted_dominance),
      confidenceScore: parseFloat(row.confidence_score),
      rSquared: parseFloat(row.r_squared),
      wellnessCiLower: parseFloat(row.wellness_ci_lower),
      wellnessCiUpper: parseFloat(row.wellness_ci_upper),
      valenceCiLower: parseFloat(row.valence_ci_lower),
      valenceCiUpper: parseFloat(row.valence_ci_upper),
      modelType: row.model_type,
      trainingDataPoints: row.training_data_points,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at
    }));

  } catch (error) {
    console.error(`❌ Error retrieving predictions for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if predictions need regeneration (expired or don't exist)
 */
export async function shouldRegeneratePredictions(
  userId: string,
  window: 7 | 14 | 30
): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      `
      SELECT expires_at
      FROM voice_predictions
      WHERE user_id = $1 AND prediction_window = $2
      ORDER BY generated_at DESC
      LIMIT 1
      `,
      [userId, window]
    );

    if (rows.length === 0) {
      return true; // No prediction exists
    }

    const expiresAt = rows[0].expires_at;
    if (!expiresAt) {
      return false; // Prediction never expires
    }

    // Regenerate if expired
    return new Date(expiresAt) <= new Date();

  } catch (error) {
    console.error(`❌ Error checking prediction age for user ${userId}:`, error);
    return true; // Regenerate on error to be safe
  }
}

/**
 * Update predictions if needed (lazy regeneration)
 */
export async function updatePredictionsIfNeeded(userId: string): Promise<PredictionResult[]> {
  console.log(`🔄 Checking if predictions need update for user ${userId}`);

  const predictions: PredictionResult[] = [];

  for (const window of [7, 14, 30] as const) {
    const needsUpdate = await shouldRegeneratePredictions(userId, window);

    if (needsUpdate) {
      try {
        const prediction = await generateWellnessPredictions(userId, window);
        predictions.push(prediction);
      } catch (error) {
        console.error(`⚠️  Failed to regenerate ${window}-day prediction:`, error);
      }
    } else {
      console.log(`✓ ${window}-day prediction still valid, skipping`);
    }
  }

  if (predictions.length > 0) {
    console.log(`✅ Regenerated ${predictions.length} expired predictions`);
  } else {
    console.log(`✅ All predictions up to date`);
  }

  return predictions;
}

/**
 * Save prediction to database with upsert logic
 */
async function savePredictionToDB(prediction: PredictionResult): Promise<void> {
  await pool.query(
    `
    INSERT INTO voice_predictions (
      user_id,
      prediction_date,
      prediction_window,
      predicted_wellness_score,
      predicted_valence,
      predicted_arousal,
      predicted_dominance,
      confidence_score,
      r_squared,
      wellness_ci_lower,
      wellness_ci_upper,
      valence_ci_lower,
      valence_ci_upper,
      model_type,
      training_data_points,
      generated_at,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (user_id, prediction_date, prediction_window)
    DO UPDATE SET
      predicted_wellness_score = EXCLUDED.predicted_wellness_score,
      predicted_valence = EXCLUDED.predicted_valence,
      predicted_arousal = EXCLUDED.predicted_arousal,
      predicted_dominance = EXCLUDED.predicted_dominance,
      confidence_score = EXCLUDED.confidence_score,
      r_squared = EXCLUDED.r_squared,
      wellness_ci_lower = EXCLUDED.wellness_ci_lower,
      wellness_ci_upper = EXCLUDED.wellness_ci_upper,
      valence_ci_lower = EXCLUDED.valence_ci_lower,
      valence_ci_upper = EXCLUDED.valence_ci_upper,
      model_type = EXCLUDED.model_type,
      training_data_points = EXCLUDED.training_data_points,
      generated_at = EXCLUDED.generated_at,
      expires_at = EXCLUDED.expires_at
    `,
    [
      prediction.userId,
      prediction.predictionDate,
      prediction.predictionWindow,
      prediction.predictedWellnessScore,
      prediction.predictedValence,
      prediction.predictedArousal,
      prediction.predictedDominance,
      prediction.confidenceScore,
      prediction.rSquared,
      prediction.wellnessCiLower,
      prediction.wellnessCiUpper,
      prediction.valenceCiLower,
      prediction.valenceCiUpper,
      prediction.modelType,
      prediction.trainingDataPoints,
      prediction.generatedAt,
      prediction.expiresAt
    ]
  );
}

/**
 * Compare predicted vs actual wellness (for model validation)
 * Call this after the prediction date has passed
 */
export async function validatePrediction(
  userId: string,
  predictionDate: Date,
  window: 7 | 14 | 30
): Promise<{ predicted: number; actual: number; error: number; percentError: number } | null> {
  try {
    // Get prediction
    const { rows: predictionRows } = await pool.query(
      `
      SELECT predicted_wellness_score
      FROM voice_predictions
      WHERE user_id = $1
        AND prediction_date::date = $2::date
        AND prediction_window = $3
      LIMIT 1
      `,
      [userId, predictionDate, window]
    );

    if (predictionRows.length === 0) {
      return null;
    }

    const predicted = parseFloat(predictionRows[0].predicted_wellness_score);

    // Get actual wellness score around prediction date (±2 days)
    const startDate = new Date(predictionDate);
    startDate.setDate(startDate.getDate() - 2);
    const endDate = new Date(predictionDate);
    endDate.setDate(endDate.getDate() + 2);

    const { rows: actualRows } = await pool.query(
      `
      SELECT AVG(wellness_score) as avg_wellness
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND created_at <= $3::timestamp
      `,
      [userId, startDate.toISOString(), endDate.toISOString()]
    );

    if (!actualRows[0].avg_wellness) {
      return null;
    }

    const actual = parseFloat(actualRows[0].avg_wellness);
    const error = Math.abs(predicted - actual);
    const percentError = actual !== 0 ? (error / actual) * 100 : 0;

    return {
      predicted,
      actual,
      error: Math.round(error * 100) / 100,
      percentError: Math.round(percentError * 100) / 100
    };

  } catch (error) {
    console.error('❌ Error validating prediction:', error);
    return null;
  }
}
