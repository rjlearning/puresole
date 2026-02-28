import { Router } from 'express';
import { requireAuth } from '../multiAuth';
import {
  calculateUserBaseline,
  updateBaselineMetrics,
  detectBaselineDeviations,
  getAllBaselines
} from '../services/userBaselineCalculation';
import {
  generateWellnessPredictions,
  generateAllPredictions,
  getActivePredictions,
  updatePredictionsIfNeeded
} from '../services/voicePredictiveAnalytics';
import {
  generateAdvancedInsights,
  getActiveInsights
} from '../services/advancedVoiceInsights';
import {
  performComprehensiveCrossMetricAnalysis,
  findOptimalLag
} from '../services/crossMetricAnalysis';
import {
  generateComprehensivePDFReport,
  generateCSVExport,
  getExportRecord,
  getUserExports,
  markExportDownloaded
} from '../services/advancedReportGeneration';

const router = Router();

/**
 * Phase IV: Advanced Analytics API Endpoints
 *
 * Provides access to:
 * - Personalized baselines
 * - Predictive analytics
 * - Advanced insights
 * - Cross-metric correlations
 * - Report generation
 */

// ============================================================================
// BASELINE ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced-analytics/baselines
 * Get all baselines (30/60/90-day) for authenticated user
 */
router.get('/baselines', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const baselines = await getAllBaselines(userId);

    res.json({
      success: true,
      baselines,
      count: baselines.length
    });
  } catch (error: any) {
    console.error('Error fetching baselines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch baselines',
      message: error.message
    });
  }
});

/**
 * POST /api/advanced-analytics/baselines/calculate
 * Calculate/update baselines for authenticated user
 * Body: { window?: 30 | 60 | 90 } (optional, calculates all if not specified)
 */
router.post('/baselines/calculate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { window } = req.body;

    if (window && ![30, 60, 90].includes(window)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid window. Must be 30, 60, or 90 days.'
      });
    }

    if (window) {
      const baseline = await calculateUserBaseline(userId, window);
      res.json({
        success: true,
        baseline
      });
    } else {
      const baselines = await updateBaselineMetrics(userId);
      res.json({
        success: true,
        baselines,
        count: baselines.length
      });
    }
  } catch (error: any) {
    console.error('Error calculating baselines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate baselines',
      message: error.message
    });
  }
});

/**
 * GET /api/advanced-analytics/baselines/deviations
 * Detect significant deviations from baseline
 * Query: ?days=7 (default: 7)
 */
router.get('/baselines/deviations', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 7;

    const deviations = await detectBaselineDeviations(userId, days);

    res.json({
      success: true,
      deviations,
      significantCount: deviations.filter(d => d.isSignificant).length
    });
  } catch (error: any) {
    console.error('Error detecting deviations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect deviations',
      message: error.message
    });
  }
});

// ============================================================================
// PREDICTION ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced-analytics/predictions
 * Get active predictions for authenticated user
 */
router.get('/predictions', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const predictions = await getActivePredictions(userId);

    res.json({
      success: true,
      predictions,
      count: predictions.length
    });
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions',
      message: error.message
    });
  }
});

/**
 * POST /api/advanced-analytics/predictions/generate
 * Generate new predictions for authenticated user
 * Body: { window?: 7 | 14 | 30 } (optional, generates all if not specified)
 */
router.post('/predictions/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { window } = req.body;

    if (window && ![7, 14, 30].includes(window)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid window. Must be 7, 14, or 30 days.'
      });
    }

    if (window) {
      const prediction = await generateWellnessPredictions(userId, window);
      res.json({
        success: true,
        prediction
      });
    } else {
      const predictions = await generateAllPredictions(userId);
      res.json({
        success: true,
        predictions,
        count: predictions.length
      });
    }
  } catch (error: any) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions',
      message: error.message
    });
  }
});

/**
 * POST /api/advanced-analytics/predictions/update
 * Update predictions if expired (lazy regeneration)
 */
router.post('/predictions/update', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const updatedPredictions = await updatePredictionsIfNeeded(userId);

    res.json({
      success: true,
      updatedCount: updatedPredictions.length,
      predictions: updatedPredictions
    });
  } catch (error: any) {
    console.error('Error updating predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update predictions',
      message: error.message
    });
  }
});

// ============================================================================
// INSIGHTS ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced-analytics/insights
 * Get active insights for authenticated user
 * Query: ?limit=10 (default: 10)
 */
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const insights = await getActiveInsights(userId, limit);

    res.json({
      success: true,
      insights,
      count: insights.length
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights',
      message: error.message
    });
  }
});

/**
 * POST /api/advanced-analytics/insights/generate
 * Generate new advanced insights for authenticated user
 */
router.post('/insights/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const insights = await generateAdvancedInsights(userId);

    res.json({
      success: true,
      insights,
      count: insights.length
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

// ============================================================================
// CORRELATION ENDPOINTS
// ============================================================================

/**
 * GET /api/advanced-analytics/correlations
 * Perform comprehensive cross-metric correlation analysis
 * Query: ?days=30 (default: 30)
 */
router.get('/correlations', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const analysis = await performComprehensiveCrossMetricAnalysis(userId, days);

    res.json({
      success: true,
      analysis: {
        analysisDate: analysis.analysisDate,
        topCorrelations: analysis.topCorrelations,
        insights: analysis.insights,
        totalCorrelations: analysis.correlations.length
      }
    });
  } catch (error: any) {
    console.error('Error analyzing correlations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze correlations',
      message: error.message
    });
  }
});

/**
 * GET /api/advanced-analytics/correlations/optimal-lag
 * Find optimal lag for a specific metric type
 * Query: ?metricType=mood|sleep|medication|activity&days=30
 */
router.get('/correlations/optimal-lag', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricType, days } = req.query;

    if (!metricType || !['mood', 'sleep', 'medication', 'activity'].includes(metricType as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid metricType. Must be mood, sleep, medication, or activity.'
      });
    }

    const daysNum = parseInt(days as string) || 30;
    const result = await findOptimalLag(userId, metricType as any, daysNum);

    res.json({
      success: true,
      metricType,
      ...result
    });
  } catch (error: any) {
    console.error('Error finding optimal lag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find optimal lag',
      message: error.message
    });
  }
});

// ============================================================================
// REPORT GENERATION ENDPOINTS
// ============================================================================

/**
 * POST /api/advanced-analytics/reports/generate
 * Generate comprehensive wellness report
 * Body: {
 *   format: 'pdf' | 'csv',
 *   reportType: 'comprehensive' | 'baseline' | 'predictions' | 'correlations',
 *   dateRangeStart?: Date,
 *   dateRangeEnd?: Date
 * }
 */
router.post('/reports/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      format,
      reportType,
      dateRangeStart,
      dateRangeEnd
    } = req.body;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Must be pdf or csv.'
      });
    }

    const metadata = {
      userId,
      reportType: reportType || 'comprehensive',
      format,
      dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : new Date()
    };

    let exportRecord;

    if (format === 'pdf') {
      exportRecord = await generateComprehensivePDFReport(userId, metadata);
    } else {
      exportRecord = await generateCSVExport(userId, metadata);
    }

    res.json({
      success: true,
      export: {
        id: exportRecord.id,
        format: exportRecord.reportFormat,
        fileSizeKB: Math.round(exportRecord.fileSizeBytes / 1024),
        generatedAt: exportRecord.generatedAt,
        expiresAt: exportRecord.expiresAt,
        downloadUrl: `/api/advanced-analytics/reports/${exportRecord.id}/download`
      }
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * GET /api/advanced-analytics/reports/:exportId/download
 * Download a generated report
 */
router.get('/reports/:exportId/download', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { exportId } = req.params;

    const exportRecord = await getExportRecord(exportId, userId);

    if (!exportRecord) {
      return res.status(404).json({
        success: false,
        error: 'Export not found or access denied'
      });
    }

    if (exportRecord.status === 'expired') {
      return res.status(410).json({
        success: false,
        error: 'Export has expired'
      });
    }

    // Mark as downloaded
    await markExportDownloaded(exportId);

    // Send file
    const contentType = exportRecord.reportFormat === 'pdf'
      ? 'application/pdf'
      : 'text/csv';

    const filename = exportRecord.filePath.split('/').pop() || 'download';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(exportRecord.filePath);

  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
      message: error.message
    });
  }
});

/**
 * GET /api/advanced-analytics/reports
 * Get user's recent exports
 * Query: ?limit=10
 */
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const exports = await getUserExports(userId, limit);

    res.json({
      success: true,
      exports: exports.map(exp => ({
        id: exp.id,
        type: exp.exportType,
        format: exp.reportFormat,
        fileSizeKB: Math.round(exp.fileSizeBytes / 1024),
        status: exp.status,
        generatedAt: exp.generatedAt,
        expiresAt: exp.expiresAt,
        downloadCount: exp.downloadCount,
        downloadUrl: `/api/advanced-analytics/reports/${exp.id}/download`
      })),
      count: exports.length
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

export default router;
