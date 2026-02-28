import PDFDocument from 'pdfkit';
import { createWriteStream, unlinkSync } from 'fs';
import { join } from 'path';
import { pool } from '../db';
import { getAllBaselines } from './userBaselineCalculation';
import { getActivePredictions } from './voicePredictiveAnalytics';
import { getActiveInsights } from './advancedVoiceInsights';
import { performComprehensiveCrossMetricAnalysis } from './crossMetricAnalysis';

/**
 * Advanced Report Generation Service
 *
 * Generates comprehensive wellness reports with:
 * - PDF exports with charts and insights
 * - CSV data exports for external analysis
 * - JSON API responses
 * - Automatic cleanup and expiration
 * - Export tracking in analytics_exports table
 */

interface ReportMetadata {
  userId: string;
  reportType: 'comprehensive' | 'baseline' | 'predictions' | 'correlations' | 'insights';
  format: 'pdf' | 'csv' | 'json';
  dateRangeStart: Date;
  dateRangeEnd: Date;
  includeCharts?: boolean;
  includeRecommendations?: boolean;
}

interface ExportRecord {
  id: string;
  userId: string;
  exportType: string;
  reportFormat: string;
  filePath: string;
  fileSizeBytes: number;
  status: 'pending' | 'ready' | 'failed' | 'expired';
  generatedAt: Date;
  expiresAt: Date;
  downloadCount: number;
}

/**
 * Generate comprehensive wellness report in PDF format
 * Includes baselines, predictions, insights, and correlations
 */
export async function generateComprehensivePDFReport(
  userId: string,
  metadata: ReportMetadata
): Promise<ExportRecord> {
  console.log(`📄 Generating comprehensive PDF report for user ${userId}`);

  try {
    // Fetch all data
    const [user, baselines, predictions, insights, correlations] = await Promise.all([
      getUserInfo(userId),
      getAllBaselines(userId),
      getActivePredictions(userId),
      getActiveInsights(userId, 10),
      performComprehensiveCrossMetricAnalysis(userId, 30)
    ]);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Generate file path
    const fileName = `wellness-report-${userId}-${Date.now()}.pdf`;
    const filePath = join('/tmp', fileName);
    const writeStream = createWriteStream(filePath);

    doc.pipe(writeStream);

    // === COVER PAGE ===
    doc
      .fontSize(28)
      .fillColor('#1e40af')
      .text('Comprehensive Wellness Report', { align: 'center' });

    doc
      .moveDown(0.5)
      .fontSize(14)
      .fillColor('#6b7280')
      .text(`${user.firstName} ${user.lastName}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .text(`Report Period: ${metadata.dateRangeStart.toLocaleDateString()} - ${metadata.dateRangeEnd.toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(3);

    // === EXECUTIVE SUMMARY ===
    doc.addPage();
    doc
      .fontSize(20)
      .fillColor('#1e40af')
      .text('Executive Summary', { underline: true });

    doc.moveDown(1);

    if (baselines.length > 0) {
      const baseline30 = baselines.find(b => b.windowDays === 30);
      if (baseline30) {
        doc
          .fontSize(12)
          .fillColor('#374151')
          .text(`Current Wellness Baseline: ${baseline30.baselineWellnessScore.toFixed(1)}/100`, { indent: 20 })
          .text(`Baseline Confidence: ${(baseline30.baselineConfidence * 100).toFixed(0)}%`, { indent: 20 })
          .text(`Data Points: ${baseline30.dataPointCount} voice analyses`, { indent: 20 });
      }
    }

    doc.moveDown(1);

    if (predictions.length > 0) {
      const prediction7 = predictions.find(p => p.predictionWindow === 7);
      if (prediction7) {
        doc
          .fillColor('#374151')
          .text(`7-Day Forecast: ${prediction7.predictedWellnessScore.toFixed(1)}/100`, { indent: 20 })
          .text(`Prediction Confidence: ${(prediction7.confidenceScore * 100).toFixed(0)}%`, { indent: 20 });
      }
    }

    doc.moveDown(2);

    // === BASELINES SECTION ===
    doc
      .fontSize(18)
      .fillColor('#1e40af')
      .text('📊 Personalized Baselines', { underline: true });

    doc.moveDown(1);

    if (baselines.length > 0) {
      doc.fontSize(11).fillColor('#6b7280');

      for (const baseline of baselines) {
        doc
          .fillColor('#1e40af')
          .fontSize(14)
          .text(`${baseline.windowDays}-Day Baseline`);

        doc
          .fontSize(11)
          .fillColor('#374151')
          .text(`Wellness: ${baseline.baselineWellnessScore.toFixed(1)} ± ${baseline.wellnessStdDev.toFixed(1)}`, { indent: 20 })
          .text(`Valence: ${baseline.baselineValence.toFixed(2)} ± ${baseline.valenceStdDev.toFixed(2)}`, { indent: 20 })
          .text(`Arousal: ${baseline.baselineArousal.toFixed(2)} ± ${baseline.arousalStdDev.toFixed(2)}`, { indent: 20 })
          .text(`Dominance: ${baseline.baselineDominance.toFixed(2)} ± ${baseline.dominanceStdDev.toFixed(2)}`, { indent: 20 })
          .text(`Last Updated: ${baseline.lastUpdatedAt.toLocaleDateString()}`, { indent: 20 });

        doc.moveDown(1);
      }
    } else {
      doc.fillColor('#6b7280').text('No baseline data available. Record more voice analyses to establish baselines.');
    }

    // === PREDICTIONS SECTION ===
    doc.addPage();
    doc
      .fontSize(18)
      .fillColor('#1e40af')
      .text('🔮 Wellness Forecasts', { underline: true });

    doc.moveDown(1);

    if (predictions.length > 0) {
      for (const pred of predictions) {
        doc
          .fillColor('#1e40af')
          .fontSize(14)
          .text(`${pred.predictionWindow}-Day Forecast`);

        doc
          .fontSize(11)
          .fillColor('#374151')
          .text(`Predicted Wellness: ${pred.predictedWellnessScore.toFixed(1)}/100`, { indent: 20 })
          .text(`Confidence Interval: ${pred.wellnessCiLower.toFixed(1)} - ${pred.wellnessCiUpper.toFixed(1)}`, { indent: 20 })
          .text(`Model Quality (R²): ${(pred.rSquared * 100).toFixed(0)}%`, { indent: 20 })
          .text(`Confidence: ${(pred.confidenceScore * 100).toFixed(0)}%`, { indent: 20 })
          .text(`Training Data: ${pred.trainingDataPoints} analyses`, { indent: 20 });

        doc.moveDown(1);
      }
    } else {
      doc.fillColor('#6b7280').text('Insufficient data for predictions. Need at least 14 voice analyses.');
    }

    // === INSIGHTS SECTION ===
    doc.addPage();
    doc
      .fontSize(18)
      .fillColor('#1e40af')
      .text('💡 Personalized Insights', { underline: true });

    doc.moveDown(1);

    if (insights.length > 0) {
      for (const insight of insights.slice(0, 5)) {
        // Urgency indicator
        const urgencyColor = insight.urgencyLevel >= 7 ? '#ef4444' : insight.urgencyLevel >= 4 ? '#f59e0b' : '#3b82f6';

        doc
          .fillColor(urgencyColor)
          .fontSize(14)
          .text(`${insight.title} (Urgency: ${insight.urgencyLevel}/10)`);

        doc
          .fontSize(11)
          .fillColor('#374151')
          .text(insight.description, { indent: 20 });

        if (insight.actionItems && insight.actionItems.length > 0) {
          doc.moveDown(0.5);
          doc.fillColor('#6b7280').text('Recommended Actions:', { indent: 20 });

          insight.actionItems.forEach((item: any, idx: number) => {
            doc
              .fillColor('#374151')
              .text(`${idx + 1}. ${item.action} [${item.category}, ${item.estimatedImpact} impact]`, { indent: 40 });
          });
        }

        doc.moveDown(1);
      }
    } else {
      doc.fillColor('#6b7280').text('No active insights available.');
    }

    // === CORRELATIONS SECTION ===
    doc.addPage();
    doc
      .fontSize(18)
      .fillColor('#1e40af')
      .text('🔗 Cross-Metric Correlations', { underline: true });

    doc.moveDown(1);

    if (correlations.topCorrelations.length > 0) {
      doc
        .fontSize(12)
        .fillColor('#6b7280')
        .text('Top correlations between voice wellness and other health metrics:');

      doc.moveDown(0.5);

      for (const corr of correlations.topCorrelations) {
        const strengthColor =
          corr.significance === 'strong' ? '#10b981' :
          corr.significance === 'moderate' ? '#3b82f6' :
          corr.significance === 'weak' ? '#f59e0b' : '#6b7280';

        doc
          .fillColor(strengthColor)
          .fontSize(12)
          .text(`${corr.metricName}: ${(corr.correlationStrength * 100).toFixed(1)}% (${corr.significance})`);

        doc
          .fontSize(10)
          .fillColor('#374151')
          .text(corr.interpretation, { indent: 20 });

        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      if (correlations.insights.length > 0) {
        doc
          .fillColor('#1e40af')
          .fontSize(12)
          .text('Key Insights:');

        correlations.insights.forEach(insight => {
          doc
            .fillColor('#374151')
            .fontSize(10)
            .text(`• ${insight}`, { indent: 20 });
        });
      }
    } else {
      doc.fillColor('#6b7280').text('No significant correlations found. Continue tracking multiple metrics.');
    }

    // === FOOTER ===
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        `Generated by PureSoul Mental Wellness Platform | ${new Date().toISOString()}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );

    doc.end();

    // Wait for file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Get file size
    const stats = await import('fs').then(fs => fs.promises.stat(filePath));
    const fileSizeBytes = stats.size;

    // Create export record
    const exportRecord = await createExportRecord({
      userId,
      exportType: metadata.reportType,
      reportFormat: 'pdf',
      filePath,
      fileSizeBytes,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    console.log(`✅ PDF report generated: ${filePath} (${(fileSizeBytes / 1024).toFixed(0)} KB)`);
    return exportRecord;

  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}

/**
 * Generate CSV export of voice analysis data
 */
export async function generateCSVExport(
  userId: string,
  metadata: ReportMetadata
): Promise<ExportRecord> {
  console.log(`📊 Generating CSV export for user ${userId}`);

  try {
    // Fetch voice analysis data
    const { rows } = await pool.query(
      `
      SELECT
        created_at,
        wellness_score,
        primary_emotion,
        valence,
        arousal,
        dominance,
        risk_level,
        duration_seconds
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= $2::timestamp
        AND created_at <= $3::timestamp
      ORDER BY created_at ASC
      `,
      [userId, metadata.dateRangeStart, metadata.dateRangeEnd]
    );

    // Generate CSV content
    const headers = ['Date', 'Time', 'Wellness Score', 'Primary Emotion', 'Valence', 'Arousal', 'Dominance', 'Risk Level', 'Duration (s)'];
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const date = new Date(row.created_at);
      const csvRow = [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        row.wellness_score,
        row.primary_emotion,
        row.valence,
        row.arousal,
        row.dominance,
        row.risk_level,
        row.duration_seconds
      ];
      csvRows.push(csvRow.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Write to file
    const fileName = `voice-data-${userId}-${Date.now()}.csv`;
    const filePath = join('/tmp', fileName);
    const fs = await import('fs');
    await fs.promises.writeFile(filePath, csvContent, 'utf-8');

    const fileSizeBytes = Buffer.byteLength(csvContent, 'utf-8');

    // Create export record
    const exportRecord = await createExportRecord({
      userId,
      exportType: 'voice_data',
      reportFormat: 'csv',
      filePath,
      fileSizeBytes,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ CSV export generated: ${filePath} (${rows.length} rows)`);
    return exportRecord;

  } catch (error) {
    console.error('Error generating CSV export:', error);
    throw error;
  }
}

/**
 * Get user info for report header
 */
async function getUserInfo(userId: string): Promise<{ firstName: string; lastName: string }> {
  const { rows } = await pool.query(
    `SELECT first_name, last_name FROM users WHERE id = $1`,
    [userId]
  );

  return {
    firstName: rows[0]?.first_name || 'User',
    lastName: rows[0]?.last_name || ''
  };
}

/**
 * Create export record in database
 */
async function createExportRecord(data: {
  userId: string;
  exportType: string;
  reportFormat: string;
  filePath: string;
  fileSizeBytes: number;
  expiresAt: Date;
}): Promise<ExportRecord> {
  const { rows } = await pool.query(
    `
    INSERT INTO analytics_exports (
      user_id,
      export_type,
      report_format,
      file_path,
      file_size_bytes,
      status,
      generated_at,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, 'ready', NOW(), $6)
    RETURNING id, user_id, export_type, report_format, file_path,
              file_size_bytes, status, generated_at, expires_at, download_count
    `,
    [
      data.userId,
      data.exportType,
      data.reportFormat,
      data.filePath,
      data.fileSizeBytes,
      data.expiresAt
    ]
  );

  return {
    id: rows[0].id,
    userId: rows[0].user_id,
    exportType: rows[0].export_type,
    reportFormat: rows[0].report_format,
    filePath: rows[0].file_path,
    fileSizeBytes: rows[0].file_size_bytes,
    status: rows[0].status,
    generatedAt: rows[0].generated_at,
    expiresAt: rows[0].expires_at,
    downloadCount: rows[0].download_count
  };
}

/**
 * Get export record by ID
 */
export async function getExportRecord(exportId: string, userId: string): Promise<ExportRecord | null> {
  const { rows } = await pool.query(
    `
    SELECT
      id, user_id, export_type, report_format, file_path,
      file_size_bytes, status, generated_at, expires_at, download_count
    FROM analytics_exports
    WHERE id = $1 AND user_id = $2
    `,
    [exportId, userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    id: rows[0].id,
    userId: rows[0].user_id,
    exportType: rows[0].export_type,
    reportFormat: rows[0].report_format,
    filePath: rows[0].file_path,
    fileSizeBytes: rows[0].file_size_bytes,
    status: rows[0].status,
    generatedAt: rows[0].generated_at,
    expiresAt: rows[0].expires_at,
    downloadCount: rows[0].download_count
  };
}

/**
 * Mark export as downloaded (increment counter)
 */
export async function markExportDownloaded(exportId: string): Promise<void> {
  await pool.query(
    `
    UPDATE analytics_exports
    SET download_count = download_count + 1,
        downloaded_at = CASE WHEN downloaded_at IS NULL THEN NOW() ELSE downloaded_at END
    WHERE id = $1
    `,
    [exportId]
  );
}

/**
 * Cleanup expired exports
 * Call this periodically (e.g., daily cron job)
 */
export async function cleanupExpiredExports(): Promise<number> {
  console.log('🧹 Cleaning up expired exports...');

  try {
    // Get expired exports
    const { rows } = await pool.query(
      `
      SELECT id, file_path
      FROM analytics_exports
      WHERE expires_at < NOW() AND status != 'expired'
      `
    );

    let deletedCount = 0;

    for (const row of rows) {
      try {
        // Delete file
        unlinkSync(row.file_path);

        // Mark as expired
        await pool.query(
          `UPDATE analytics_exports SET status = 'expired' WHERE id = $1`,
          [row.id]
        );

        deletedCount++;
      } catch (error) {
        console.error(`Error deleting export ${row.id}:`, error);
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} expired exports`);
    return deletedCount;

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get user's recent exports
 */
export async function getUserExports(userId: string, limit: number = 10): Promise<ExportRecord[]> {
  const { rows } = await pool.query(
    `
    SELECT
      id, user_id, export_type, report_format, file_path,
      file_size_bytes, status, generated_at, expires_at, download_count
    FROM analytics_exports
    WHERE user_id = $1 AND status = 'ready'
    ORDER BY generated_at DESC
    LIMIT $2
    `,
    [userId, limit]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    exportType: row.export_type,
    reportFormat: row.report_format,
    filePath: row.file_path,
    fileSizeBytes: row.file_size_bytes,
    status: row.status,
    generatedAt: row.generated_at,
    expiresAt: row.expires_at,
    downloadCount: row.download_count
  }));
}
