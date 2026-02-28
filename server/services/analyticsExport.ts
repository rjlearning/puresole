import { pool } from '../db';
import { calculateMoodTrends, findCorrelations, predictMood } from './analyticsCalculation';

// ============================================
// CSV EXPORT
// ============================================

export async function generateAnalyticsCSV(userId: string, timePeriod: 'week' | 'month' | 'quarter' = 'month') {
  const days = timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get raw mood data
  const moodData = await pool.query(
    `SELECT
      DATE(recorded_at) as date,
      mood_after as mood,
      energy_level,
      stress_level,
      COUNT(*) as entries_count
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY DATE(recorded_at), mood_after, energy_level, stress_level
    ORDER BY date ASC`,
    [userId, startDate.toISOString()]
  );

  // Get activity data
  const activityData = await pool.query(
    `SELECT
      DATE(uac.completed_at) as date,
      wa.name as activity,
      wa.category,
      COUNT(*) as completions
    FROM user_activity_completions uac
    JOIN wellness_activities wa ON uac.activity_id = wa.id
    WHERE uac.user_id = $1 AND uac.completed_at >= $2::timestamp
    GROUP BY DATE(uac.completed_at), wa.name, wa.category
    ORDER BY date ASC`,
    [userId, startDate.toISOString()]
  );

  // Build CSV header
  const csvLines = ['Date,Mood (1-5),Energy Level (1-10),Stress Level (1-10),Entries Count,Activities Completed'];

  // Aggregate data by date
  const dataByDate = new Map();

  moodData.rows.forEach(row => {
    const date = row.date.toISOString().split('T')[0];
    if (!dataByDate.has(date)) {
      dataByDate.set(date, {
        date,
        mood: row.mood || 'N/A',
        energy: row.energy_level || 'N/A',
        stress: row.stress_level || 'N/A',
        entries: row.entries_count || 0,
        activities: 0
      });
    }
  });

  activityData.rows.forEach(row => {
    const date = row.date.toISOString().split('T')[0];
    if (dataByDate.has(date)) {
      const data = dataByDate.get(date);
      data.activities += parseInt(row.completions);
    } else {
      dataByDate.set(date, {
        date,
        mood: 'N/A',
        energy: 'N/A',
        stress: 'N/A',
        entries: 0,
        activities: parseInt(row.completions)
      });
    }
  });

  // Sort by date and build CSV rows
  const sortedDates = Array.from(dataByDate.keys()).sort();
  sortedDates.forEach(date => {
    const data = dataByDate.get(date);
    csvLines.push(`${data.date},${data.mood},${data.energy},${data.stress},${data.entries},${data.activities}`);
  });

  return csvLines.join('\n');
}

// ============================================
// COMPREHENSIVE ANALYTICS EXPORT
// ============================================

export async function generateComprehensiveCSV(userId: string) {
  const trends = await calculateMoodTrends(userId, 'month');
  const correlations = await findCorrelations(userId, 'month');
  const predictions = await predictMood(userId, 7);

  const csvSections = [];

  // Section 1: Mood Trends
  csvSections.push('=== MOOD TRENDS (Last 30 Days) ===');
  csvSections.push('Date,Average Mood,Average Energy,Average Stress,Entries');
  trends.trends.forEach(t => {
    csvSections.push(`${t.date},${t.mood.toFixed(2)},${t.energy.toFixed(2)},${t.stress.toFixed(2)},${t.entries}`);
  });
  csvSections.push('');

  // Section 2: Summary Statistics
  csvSections.push('=== SUMMARY STATISTICS ===');
  csvSections.push('Metric,Value');
  csvSections.push(`Average Mood,${trends.summary.averageMood.toFixed(2)}`);
  csvSections.push(`Average Energy,${trends.summary.averageEnergy.toFixed(2)}`);
  csvSections.push(`Average Stress,${trends.summary.averageStress.toFixed(2)}`);
  csvSections.push(`Trend Direction,${trends.summary.trendDirection}`);
  csvSections.push(`Total Entries,${trends.summary.totalEntries}`);
  csvSections.push('');

  // Section 3: Activity Correlations
  csvSections.push('=== ACTIVITY CORRELATIONS ===');
  csvSections.push('Activity Category,Average Mood,Impact,Strength,Sample Size');
  correlations.correlations.forEach(c => {
    csvSections.push(`${c.category},${c.averageMood.toFixed(2)},${c.impact.toFixed(2)},${c.strength},${c.sampleSize}`);
  });
  csvSections.push('');

  // Section 4: Predictions
  csvSections.push('=== MOOD PREDICTIONS (Next 7 Days) ===');
  csvSections.push('Date,Predicted Mood,Confidence (%)');
  if (predictions.predictions && predictions.predictions.length > 0) {
    predictions.predictions.forEach(p => {
      csvSections.push(`${p.date},${p.predictedMood.toFixed(1)},${p.confidence}`);
    });
  } else {
    csvSections.push('Not enough data for predictions');
  }

  return csvSections.join('\n');
}

// ============================================
// INSIGHTS EXPORT
// ============================================

export async function generateInsightsCSV(userId: string) {
  const insights = await pool.query(
    `SELECT
      insight_type,
      title,
      description,
      confidence_score,
      priority,
      status,
      created_at
    FROM user_insights
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50`,
    [userId]
  );

  const csvLines = ['Type,Title,Description,Confidence,Priority,Status,Created Date'];

  insights.rows.forEach(insight => {
    const description = insight.description.replace(/,/g, ';').replace(/\n/g, ' ');
    const createdDate = new Date(insight.created_at).toISOString().split('T')[0];
    csvLines.push(
      `${insight.insight_type},` +
      `"${insight.title}",` +
      `"${description}",` +
      `${insight.confidence_score || 'N/A'},` +
      `${insight.priority},` +
      `${insight.status},` +
      `${createdDate}`
    );
  });

  return csvLines.join('\n');
}

// ============================================
// THERAPIST REPORT
// ============================================

export async function generateTherapistReport(userId: string) {
  // Get user info
  const userResult = await pool.query(
    'SELECT first_name, last_name, email FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  const trends = await calculateMoodTrends(userId, 'quarter');
  const correlations = await findCorrelations(userId, 'quarter');

  const reportLines = [];

  // Header
  reportLines.push('='.repeat(80));
  reportLines.push('MENTAL WELLNESS ANALYTICS REPORT');
  reportLines.push('Generated for Mental Health Professional Review');
  reportLines.push('='.repeat(80));
  reportLines.push('');

  // Patient Info (anonymized if needed)
  reportLines.push('PATIENT INFORMATION');
  reportLines.push(`Name: ${user.first_name} ${user.last_name}`);
  reportLines.push(`Report Date: ${new Date().toISOString().split('T')[0]}`);
  reportLines.push(`Time Period: Last 90 Days`);
  reportLines.push('');

  // Executive Summary
  reportLines.push('EXECUTIVE SUMMARY');
  reportLines.push(`Overall Mood Trend: ${trends.summary.trendDirection.toUpperCase()}`);
  reportLines.push(`Average Mood Score: ${trends.summary.averageMood.toFixed(2)}/5.0`);
  reportLines.push(`Average Energy Level: ${trends.summary.averageEnergy.toFixed(2)}/10.0`);
  reportLines.push(`Average Stress Level: ${trends.summary.averageStress.toFixed(2)}/10.0`);
  reportLines.push(`Total Mood Entries: ${trends.summary.totalEntries}`);
  reportLines.push('');

  // Key Patterns
  reportLines.push('KEY PATTERNS IDENTIFIED');
  if (correlations.correlations.length > 0) {
    reportLines.push('\nPositive Correlations (Activities that improve mood):');
    correlations.correlations
      .filter(c => c.impact > 0.3)
      .slice(0, 5)
      .forEach((c, i) => {
        reportLines.push(`  ${i + 1}. ${c.category}: +${c.impact.toFixed(2)} mood impact (${c.strength} correlation)`);
      });

    const negative = correlations.correlations.filter(c => c.impact < -0.3);
    if (negative.length > 0) {
      reportLines.push('\nAreas of Concern:');
      negative.forEach((c, i) => {
        reportLines.push(`  ${i + 1}. ${c.category}: ${c.impact.toFixed(2)} mood impact`);
      });
    }
  }
  reportLines.push('');

  // Recommendations
  reportLines.push('CLINICAL RECOMMENDATIONS');
  reportLines.push('Based on data patterns:');
  if (trends.summary.averageStress > 7) {
    reportLines.push('  • High stress levels detected - recommend stress management interventions');
  }
  if (trends.summary.averageMood < 3) {
    reportLines.push('  • Low mood scores - consider assessment for depression');
  }
  if (trends.summary.trendDirection === 'declining') {
    reportLines.push('  • Declining mood trend - increased monitoring recommended');
  }
  if (correlations.correlations.length === 0) {
    reportLines.push('  • Limited activity engagement - consider behavioral activation');
  }
  reportLines.push('');

  // Footer
  reportLines.push('='.repeat(80));
  reportLines.push('This report is generated from self-reported data and AI analysis.');
  reportLines.push('It should supplement, not replace, clinical judgment and assessment.');
  reportLines.push('='.repeat(80));

  return reportLines.join('\n');
}
