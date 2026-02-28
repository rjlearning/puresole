import { Router, Request, Response } from 'express';
import {
  generateAnalyticsCSV,
  generateComprehensiveCSV,
  generateInsightsCSV,
  generateTherapistReport
} from '../services/analyticsExport';
import { generateAnalyticsPDF } from '../services/analyticsPdfGeneration';

const router = Router();

// ============================================
// CSV EXPORTS
// ============================================

// GET /api/analytics/export/csv - Export basic analytics as CSV
router.get('/analytics/export/csv', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { period = 'month' } = req.query;

    const csv = await generateAnalyticsCSV(
      userId,
      period as 'week' | 'month' | 'quarter'
    );

    const filename = `analytics-${period}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: 'Failed to generate CSV',
      details: error.message
    });
  }
});

// GET /api/analytics/export/comprehensive-csv - Export all analytics data
router.get('/analytics/export/comprehensive-csv', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const csv = await generateComprehensiveCSV(userId);

    const filename = `analytics-comprehensive-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Comprehensive CSV export error:', error);
    res.status(500).json({
      error: 'Failed to generate comprehensive CSV',
      details: error.message
    });
  }
});

// GET /api/analytics/export/insights-csv - Export insights as CSV
router.get('/analytics/export/insights-csv', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const csv = await generateInsightsCSV(userId);

    const filename = `insights-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Insights CSV export error:', error);
    res.status(500).json({
      error: 'Failed to generate insights CSV',
      details: error.message
    });
  }
});

// ============================================
// PDF EXPORT
// ============================================

// GET /api/analytics/export/pdf - Export analytics as PDF
router.get('/analytics/export/pdf', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const user = req.user as any;
    const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();

    const pdfDoc = await generateAnalyticsPDF(userId, userName);
    const filename = `analytics-report-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
});

// ============================================
// THERAPIST REPORT
// ============================================

// GET /api/analytics/export/therapist-report - Generate therapist report
router.get('/analytics/export/therapist-report', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const report = await generateTherapistReport(userId);

    const filename = `therapist-report-${Date.now()}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(report);
  } catch (error: any) {
    console.error('Therapist report error:', error);
    res.status(500).json({
      error: 'Failed to generate therapist report',
      details: error.message
    });
  }
});

export default router;
