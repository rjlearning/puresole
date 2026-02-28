import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { generateReport, saveReport } from '../services/reportGeneration';
import { generateReportPDF } from '../services/pdfGeneration';

const router = Router();

// ============================================
// WELLNESS REPORTS
// ============================================

// POST /api/reports/generate - Generate a new wellness report
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { title, reportType, startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Generate report data
    const reportData = await generateReport(userId, start, end, reportType || 'custom');

    // Save report to database
    const reportId = await saveReport(
      userId,
      title || `Wellness Report ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      reportType || 'custom',
      start,
      end,
      reportData
    );

    res.json({
      message: 'Report generated successfully',
      reportId,
      data: reportData
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/reports - Get all reports for user
router.get('/reports', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { status, reportType, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT id, title, report_type, start_date, end_date,
             status, view_count, downloaded_count,
             share_code, share_expires_at,
             created_at, updated_at
      FROM wellness_reports
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (reportType) {
      query += ` AND report_type = $${paramIndex}`;
      params.push(reportType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM wellness_reports WHERE user_id = $1',
      [userId]
    );

    res.json({
      message: 'Reports retrieved',
      reports: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/templates - Get report templates (must come BEFORE :id route)
router.get('/reports/templates', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, report_type, sections, default_date_range
       FROM report_templates
       WHERE is_active = true
       ORDER BY name ASC`
    );

    res.json({
      message: 'Report templates retrieved',
      templates: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/reports/:id - Get single report with full data
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM wellness_reports
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Increment view count
    await pool.query(
      `UPDATE wellness_reports
       SET view_count = view_count + 1,
           last_viewed_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Log access
    await pool.query(
      `INSERT INTO report_access_logs (report_id, access_type, accessor_type, accessor_id)
       VALUES ($1, 'view', 'user', $2)`,
      [id, userId]
    );

    res.json({
      message: 'Report retrieved',
      report: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET /api/reports/:id/pdf - Download report as PDF
router.get('/reports/:id/pdf', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Get report data
    const result = await pool.query(
      `SELECT * FROM wellness_reports
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Generate PDF
    const pdfDoc = generateReportPDF(report);

    // Increment download count
    await pool.query(
      `UPDATE wellness_reports
       SET downloaded_count = downloaded_count + 1,
           last_downloaded_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Log access
    await pool.query(
      `INSERT INTO report_access_logs (report_id, access_type, accessor_type, accessor_id)
       VALUES ($1, 'download', 'user', $2)`,
      [id, userId]
    );

    // Set response headers
    const filename = `wellness-report-${id.substring(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM wellness_reports
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// POST /api/reports/:id/share - Generate share code for report
router.post('/reports/:id/share', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { expiresInDays = 30 } = req.body;

    // Generate unique share code
    const shareCode = generateShareCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await pool.query(
      `UPDATE wellness_reports
       SET share_code = $1,
           share_expires_at = $2,
           status = 'shared',
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING share_code, share_expires_at`,
      [shareCode, expiresAt, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Share code generated',
      shareCode: result.rows[0].share_code,
      expiresAt: result.rows[0].share_expires_at,
      shareUrl: `${req.protocol}://${req.get('host')}/shared-reports/${shareCode}`
    });
  } catch (error: any) {
    console.error('Error generating share code:', error);
    res.status(500).json({ error: 'Failed to generate share code' });
  }
});

// GET /api/reports/shared/:shareCode - View shared report (no auth required)
router.get('/reports/shared/:shareCode', async (req: Request, res: Response) => {
  try {
    const { shareCode } = req.params;

    const result = await pool.query(
      `SELECT id, title, report_type, start_date, end_date, data, key_insights,
              created_at, share_expires_at
       FROM wellness_reports
       WHERE share_code = $1
         AND status = 'shared'
         AND (share_expires_at IS NULL OR share_expires_at > NOW())`,
      [shareCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shared report not found or expired' });
    }

    // Log anonymous access
    await pool.query(
      `INSERT INTO report_access_logs (report_id, access_type, accessor_type, ip_address, user_agent)
       VALUES ($1, 'view', 'anonymous', $2, $3)`,
      [result.rows[0].id, req.ip, req.get('user-agent')]
    );

    res.json({
      message: 'Shared report retrieved',
      report: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching shared report:', error);
    res.status(500).json({ error: 'Failed to fetch shared report' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;
