import PDFDocument from 'pdfkit';
import { calculateMoodTrends, findCorrelations, predictMood } from './analyticsCalculation';

export async function generateAnalyticsPDF(userId: string, userName: string) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Fetch analytics data
  const trends = await calculateMoodTrends(userId, 'month');
  const correlations = await findCorrelations(userId, 'month');
  const predictions = await predictMood(userId, 7);

  // Header
  doc
    .fontSize(24)
    .fillColor('#1e40af')
    .text('Mental Wellness Analytics Report', { align: 'center' });

  doc
    .moveDown(0.5)
    .fontSize(12)
    .fillColor('#6b7280')
    .text(`Generated for: ${userName}`, { align: 'center' })
    .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
    .text('Last 30 Days Analysis', { align: 'center' });

  doc.moveDown(2);

  // Executive Summary Box
  doc
    .rect(50, doc.y, 495, 100)
    .fillAndStroke('#eff6ff', '#3b82f6');

  doc
    .fillColor('#1e40af')
    .fontSize(16)
    .text('Executive Summary', 60, doc.y - 90);

  doc
    .fontSize(11)
    .fillColor('#374151')
    .text(`Average Mood: ${trends.summary.averageMood.toFixed(1)}/5.0 (${trends.summary.trendDirection})`, 60, doc.y - 65)
    .text(`Average Energy: ${trends.summary.averageEnergy.toFixed(1)}/10.0`, 60, doc.y - 50)
    .text(`Average Stress: ${trends.summary.averageStress.toFixed(1)}/10.0`, 60, doc.y - 35)
    .text(`Total Entries: ${trends.summary.totalEntries}`, 60, doc.y - 20);

  doc.moveDown(3);

  // Mood Trends Section
  doc
    .fontSize(18)
    .fillColor('#1e40af')
    .text('📈 Mood Trends', { underline: true });

  doc.moveDown(0.5);

  if (trends.trends.length > 0) {
    // Create a simple text-based chart
    doc.fontSize(10).fillColor('#6b7280');
    doc.text('Daily Mood Scores (Last 14 Days):', { continued: false });
    doc.moveDown(0.5);

    const recentTrends = trends.trends.slice(-14);
    recentTrends.forEach(trend => {
      const date = new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const moodBar = '█'.repeat(Math.round(trend.mood));
      const color = trend.mood >= 4 ? '#10b981' : trend.mood >= 3 ? '#3b82f6' : '#f59e0b';

      doc
        .fillColor(color)
        .text(`${date}: ${moodBar} ${trend.mood.toFixed(1)}`, {
          indent: 20
        });
    });
  } else {
    doc.fillColor('#6b7280').text('No mood data available for this period.');
  }

  doc.moveDown(2);

  // Activity Correlations Section
  doc
    .fontSize(18)
    .fillColor('#1e40af')
    .text('🔗 Activity-Mood Correlations', { underline: true });

  doc.moveDown(0.5);

  if (correlations.correlations.length > 0) {
    doc.fontSize(10).fillColor('#6b7280');
    doc.text('Activities ranked by mood impact:', { continued: false });
    doc.moveDown(0.5);

    correlations.correlations.slice(0, 10).forEach((corr, index) => {
      const impactColor = corr.impact > 0 ? '#10b981' : '#ef4444';
      const impactSign = corr.impact > 0 ? '+' : '';

      doc
        .fillColor('#374151')
        .text(`${index + 1}. `, { continued: true, indent: 20 })
        .fillColor('#1e40af')
        .text(`${corr.category}`, { continued: true })
        .fillColor(impactColor)
        .text(` (${impactSign}${corr.impact.toFixed(2)} impact, ${corr.strength})`, { continued: false });
    });
  } else {
    doc.fillColor('#6b7280').text('No activity correlations available. Complete more activities to see patterns!');
  }

  doc.moveDown(2);

  // Predictions Section
  doc
    .fontSize(18)
    .fillColor('#1e40af')
    .text('🔮 Mood Predictions', { underline: true });

  doc.moveDown(0.5);

  if (predictions.predictions && predictions.predictions.length > 0) {
    doc.fontSize(10).fillColor('#6b7280');
    doc.text(`Forecast (${predictions.confidence} confidence):`, { continued: false });
    doc.moveDown(0.5);

    predictions.predictions.forEach(pred => {
      const date = new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const moodEmoji = pred.predictedMood >= 4 ? '😊' : pred.predictedMood >= 3 ? '😐' : '😟';

      doc
        .fillColor('#374151')
        .text(`${date}: ${moodEmoji} ${pred.predictedMood.toFixed(1)} (${pred.confidence}% confidence)`, {
          indent: 20
        });
    });
  } else {
    doc.fillColor('#6b7280').text(predictions.message || 'Not enough data for predictions.');
  }

  doc.moveDown(2);

  // Key Insights Section
  doc
    .fontSize(18)
    .fillColor('#1e40af')
    .text('💡 Key Insights', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#374151');

  // Generate insights based on data
  const insights = [];

  if (trends.summary.trendDirection === 'improving') {
    insights.push('✓ Your mood has been improving over the past month. Keep up the great work!');
  } else if (trends.summary.trendDirection === 'declining') {
    insights.push('⚠ Your mood has been declining recently. Consider reaching out for support.');
  }

  if (trends.summary.averageStress > 7) {
    insights.push('⚠ Your stress levels are elevated. Prioritize stress management activities.');
  }

  if (trends.summary.averageEnergy < 4) {
    insights.push('⚠ Low energy levels detected. Focus on sleep, nutrition, and energizing activities.');
  }

  const topActivity = correlations.correlations.find(c => c.impact > 0.5);
  if (topActivity) {
    insights.push(`✓ ${topActivity.category} activities have a strong positive impact on your mood!`);
  }

  if (trends.summary.totalEntries >= 20) {
    insights.push('✓ Excellent tracking consistency! Regular check-ins help identify patterns.');
  }

  if (insights.length === 0) {
    insights.push('Keep tracking your mood and activities to unlock personalized insights!');
  }

  insights.forEach((insight, i) => {
    doc.text(`${i + 1}. ${insight}`, { indent: 20 });
    doc.moveDown(0.3);
  });

  // Footer
  doc.moveDown(3);
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text(
      'This report is generated from self-reported data and should be used as a supplement to, not a replacement for, professional mental health care.',
      {
        align: 'center'
      }
    );

  doc
    .moveDown(0.5)
    .text('Generated by PureSoul Mental Wellness Platform', { align: 'center' })
    .text('https://puresoul.app', { align: 'center', link: 'https://puresoul.app' });

  return doc;
}
