import { pool } from '../db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface VoiceInsight {
  type: 'positive' | 'alert' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  priority: number; // 1-100, higher = more important
  confidence: number; // 0-1
  recommendations?: string[];
}

// ============================================
// INSIGHT GENERATION
// ============================================

/**
 * Generate AI-powered insights from voice analysis trends and correlations
 * Uses GPT-4 to synthesize personalized insights
 * Applies priority system: High (significant changes) > Medium (patterns) > Low (observations)
 * Cached 12-24h
 */
export async function generateVoiceInsights(userId: string): Promise<VoiceInsight[]> {
  try {
    // Get recent trends (last 30 days)
    const { rows: trendsData } = await pool.query(
      `SELECT
        avg_wellness_score,
        trend_direction,
        emotion_distribution,
        recording_count
       FROM voice_wellness_trends
       WHERE user_id = $1
         AND period_start >= NOW() - INTERVAL '30 days'
         AND period_type = 'day'
       ORDER BY period_start DESC
       LIMIT 30`,
      [userId]
    );

    // Get recent analyses for additional context (Last 20 analyses)
    const { rows: recentAnalyses } = await pool.query(
      `SELECT
        wellness_score,
        primary_emotion,
        risk_level,
        valence,
        arousal,
        dominance,
        acoustic_features,
        created_at
       FROM voice_analyses
       WHERE user_id = $1
         AND processing_status = 'completed'
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Get correlations if available
    const { rows: correlationsData } = await pool.query(
      `SELECT
        correlated_with_type,
      correlation_strength,
      confidence
       FROM voice_correlations
       WHERE user_id = $1
       ORDER BY ABS(correlation_strength) DESC
       LIMIT 5`,
      [userId]
    ).catch(() => ({ rows: [] }));

    if (recentAnalyses.length === 0) {
      return [{
        type: 'suggestion',
        title: 'Start Voice Analysis Tracking',
        description: 'Begin recording voice entries to get personalized insights about your emotional wellness patterns.',
        priority: 30,
        confidence: 1.0,
        recommendations: ['Record a voice entry today', 'Set up daily voice check-in reminders']
      }];
    }

    // Calculate summary statistics
    const avgWellness = recentAnalyses.reduce((sum, a) => sum + a.wellness_score, 0) / recentAnalyses.length;
    const avgValence = recentAnalyses.reduce((sum, a) => sum + a.valence, 0) / recentAnalyses.length;
    const avgArousal = recentAnalyses.reduce((sum, a) => sum + a.arousal, 0) / recentAnalyses.length;
    const avgDominance = recentAnalyses.reduce((sum, a) => sum + a.dominance, 0) / recentAnalyses.length;

    // Count emotions
    const emotionCounts: { [key: string]: number } = {};
    recentAnalyses.forEach(a => {
      emotionCounts[a.primary_emotion] = (emotionCounts[a.primary_emotion] || 0) + 1;
    });

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    // Count risk levels
    const highRiskCount = recentAnalyses.filter(a =>
      a.risk_level === 'high' || a.risk_level === 'critical'
    ).length;

    // Calculate trend
    const trendDirection = trendsData.length > 0
      ? (trendsData.slice(-7).reduce((sum, t) => sum + t.avg_wellness_score, 0) / 7 >
        trendsData.slice(0, 7).reduce((sum, t) => sum + t.avg_wellness_score, 0) / 7 ? 'improving' : 'declining')
      : 'stable';

    // Extract recent clinical biomarkers (Last 10 recordings for diagnostic precision)
    const voiceDiagnosticData = recentAnalyses
      .slice(0, 10)
      .map(a => ({
        recordedAt: a.created_at,
        wellnessScore: a.wellness_score,
        primaryEmotion: a.primary_emotion,
        biomarkers: a.acoustic_features?.opensmile_biomarkers
      }))
      .filter(d => d.biomarkers != null);

    let diagnosticSummary = "Insufficient clinical biomarker data for precision diagnostic (need at least 5 samples).";
    let confidenceScore = Math.min(0.95, (voiceDiagnosticData.length / 10) * 0.9 + 0.1);

    if (voiceDiagnosticData.length > 0) {
      diagnosticSummary = voiceDiagnosticData.map(d => `
- [${new Date(d.recordedAt).toLocaleDateString()}] Wellness: ${d.wellnessScore}, Emotion: ${d.primaryEmotion}
  - Vocal Tension (Jitter): ${d.biomarkers.jitterLocal_sma3nz_amean || 'N/A'}
  - Breathiness (Shimmer): ${d.biomarkers.shimmerLocaldB_sma3nz_amean || 'N/A'}
  - Mean Pitch (F0): ${d.biomarkers.F0semitoneFrom27_5Hz_sma3nz_amean || 'N/A'}
  - Clarity (HNR): ${d.biomarkers.HNRdBACF_sma3nz_amean || 'N/A'}`).join('\n');
    }

    // Prepare correlations summary
    const correlationsSummary = correlationsData.length > 0
      ? correlationsData.map(c => `${c.correlated_with_type}: ${(c.correlation_strength * 100).toFixed(0)}%`).join(', ')
      : 'No strong correlations detected yet';

    // Construct GPT-4 prompt with Precision Diagnostic Focus
    const prompt = `You are a Senior AI Mental Wellness & Voice Biomarker Specialist. Analyze this user's longitudinal voice data to provide a "Precision Diagnostic Summary" and 3-5 actionable insights.

VOICE ANALYSIS SUMMARY (Historical Window):
- Total analysis data points: ${recentAnalyses.length}
- Average wellness score: ${avgWellness.toFixed(1)}/100
- Trend direction: ${trendDirection}
- Dominant emotions: ${topEmotions.join(', ')}
- High-risk triggers: ${highRiskCount}
- VAD scores: Valence=${avgValence.toFixed(2)}, Arousal=${avgArousal.toFixed(2)}, Dominance=${avgDominance.toFixed(2)}

PRECISION CLINICAL DATA (Last 10 Samples):
${diagnosticSummary}

CORRELATIONS WITH OTHER BIOMETRICS:
${correlationsSummary}

DIAGNOSTIC CONTEXT:
The user is recording multiple voice memos to provide enough data for a multi-sample precision diagnostic. Each sample provides a snapshot of their neuro-acoustic state. Look for consistency across samples or sudden shifts in vocal tension (jitter) and fatigue (shimmer) which correlate with burnout or autonomic nervous system strain.

Please provide insights as a JSON array with this structure:
[
  {
    "type": "positive|alert|suggestion|achievement",
    "title": "Precision Insight Title",
    "description": "Synthesized insight from multiple samples",
    "priority": 1-100,
    "confidence": ${confidenceScore.toFixed(2)},
    "recommendations": ["specific action 1", "specific action 2"]
  }
]

Guidelines:
- If fewer than 5 clinical samples are provided, state that more data is needed for a "Precision Tier" diagnostic.
- "positive": User showing healthy stabilization across samples.
- "alert": Persistent high tension or sudden physiological shifts detected.
- "suggestion": Personalized somatic or metabolic alignment recommendations.
- Recommendations must be hyper-specific and relate back to the biomarkers (e.g., if Jitter is high, suggest nervous system regulation).`;

    // Call GPT-4
    const message = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a mental wellness AI assistant specialized in voice analysis insights. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],

      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    let insights: VoiceInsight[] = [];

    try {
      const content = message.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        insights = Array.isArray(parsed) ? parsed : parsed.insights || [];
      }
    } catch (parseError) {
      console.error('Failed to parse GPT-4 response:', parseError);
      // Fall back to rule-based insights
      insights = generateRuleBasedInsights(avgWellness, trendDirection, highRiskCount, topEmotions);
    }

    // Ensure insights are valid
    insights = insights.filter(i => i && i.type && i.title && i.description);

    // Add fallback insights if GPT returned empty
    if (insights.length === 0) {
      insights = generateRuleBasedInsights(avgWellness, trendDirection, highRiskCount, topEmotions);
    }

    // Save insights to database
    for (const insight of insights) {
      await saveVoiceInsight(userId, insight);
    }

    return insights.slice(0, 5); // Return top 5 insights

  } catch (error) {
    console.error('Error generating voice insights:', error);
    return generateRuleBasedInsights(0, 'stable', 0, []);
  }
}

/**
 * Generate rule-based insights as fallback
 */
function generateRuleBasedInsights(
  avgWellness: number,
  trendDirection: string,
  highRiskCount: number,
  topEmotions: string[]
): VoiceInsight[] {
  const insights: VoiceInsight[] = [];

  // Wellness level insights
  if (avgWellness >= 80) {
    insights.push({
      type: 'achievement',
      title: 'Excellent Wellness Status',
      description: 'Your overall wellness is excellent. Continue these positive patterns and maintain your current practices.',
      priority: 85,
      confidence: 0.95,
      recommendations: ['Share what\'s working with others', 'Document your wellness routine']
    });
  } else if (avgWellness >= 60) {
    insights.push({
      type: 'positive',
      title: 'Generally Positive Wellness',
      description: 'Your wellness levels are healthy. Focus on maintaining stability and building on these good patterns.',
      priority: 70,
      confidence: 0.90
    });
  } else if (avgWellness >= 40) {
    insights.push({
      type: 'suggestion',
      title: 'Opportunity for Improvement',
      description: 'Your wellness could be improved. Consider adding more wellness activities and tracking what helps.',
      priority: 60,
      confidence: 0.85,
      recommendations: ['Try a new wellness activity', 'Schedule regular check-ins with yourself']
    });
  } else {
    insights.push({
      type: 'alert',
      title: 'Low Wellness Alert',
      description: 'Your wellness scores indicate you may be struggling. Please reach out for support if needed.',
      priority: 90,
      confidence: 0.88,
      recommendations: ['Contact your support network', 'Consider professional support']
    });
  }

  // Trend insights
  if (trendDirection === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Positive Trend Detected',
      description: 'Your wellness is improving over time. Keep up with the activities and habits that are helping.',
      priority: 75,
      confidence: 0.92
    });
  } else if (trendDirection === 'declining') {
    insights.push({
      type: 'alert',
      title: 'Declining Wellness Trend',
      description: 'Recent recordings show a declining trend in wellness. Investigate what changed and take action.',
      priority: 85,
      confidence: 0.90,
      recommendations: ['Review recent life changes', 'Increase wellness activities', 'Seek support if needed']
    });
  }

  // Risk insights
  if (highRiskCount > 0) {
    insights.push({
      type: 'alert',
      title: 'High-Risk Analyses Detected',
      description: `${highRiskCount} of your recent voice analyses showed elevated risk indicators.Please prioritize self - care and support.`,
      priority: 95,
      confidence: 0.93,
      recommendations: ['Reach out to a trusted person', 'Use stress-management techniques', 'Contact a mental health professional if needed']
    });
  }

  // Emotion insights
  if (topEmotions.includes('anxious') || topEmotions.includes('stressed')) {
    insights.push({
      type: 'suggestion',
      title: 'Stress Management Opportunity',
      description: 'Anxiety or stress appears frequently in your voice analysis. Try evidence-based stress-reduction techniques.',
      priority: 70,
      confidence: 0.88,
      recommendations: ['Try 5-minute breathing exercises', 'Practice progressive muscle relaxation', 'Consider meditation']
    });
  }

  return insights.slice(0, 5);
}

// ============================================
// CACHING & STORAGE
// ============================================

/**
 * Get cached insights for user
 */
export async function getCachedVoiceInsights(userId: string): Promise<VoiceInsight[] | null> {
  try {
    const cacheKey = `voice_insights:${userId} `;
    const { rows } = await pool.query(
      `SELECT data, cached_at, expires_at
       FROM cache_store
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );

    if (rows.length > 0) {
      return rows[0].data;
    }
  } catch (error) {
    console.error('Error getting cached insights:', error);
  }

  return null;
}

/**
 * Save generated insights to database
 */
async function saveVoiceInsight(userId: string, insight: VoiceInsight): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_insights
    (user_id, insight_type, title, description, confidence_score, priority, metadata, source_type)
  VALUES($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT(user_id, insight_type, title) DO NOTHING`,
      [
        userId,
        insight.type,
        insight.title,
        insight.description,
        insight.confidence,
        insight.priority,
        JSON.stringify({
          recommendations: insight.recommendations || [],
          generated_at: new Date().toISOString()
        }),
        'voice_analysis'
      ]
    );
  } catch (error) {
    console.error('Error saving voice insight:', error);
  }
}

/**
 * Cache insights with TTL
 */
export async function cacheVoiceInsights(
  userId: string,
  insights: VoiceInsight[],
  ttlHours: number = 12
): Promise<void> {
  try {
    const cacheKey = `voice_insights:${userId} `;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await pool.query(
      `INSERT INTO cache_store(cache_key, data, expires_at)
  VALUES($1, $2, $3)
       ON CONFLICT(cache_key)
       DO UPDATE SET data = $2, expires_at = $3, cached_at = NOW()`,
      [cacheKey, JSON.stringify(insights), expiresAt.toISOString()]
    );
  } catch (error) {
    console.error('Error caching voice insights:', error);
  }
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

/**
 * Get or generate insights for API endpoint
 */
export async function getVoiceInsights(userId: string): Promise<VoiceInsight[]> {
  // Try cache first
  const cached = await getCachedVoiceInsights(userId);
  if (cached) {
    return cached;
  }

  // Generate fresh insights
  const insights = await generateVoiceInsights(userId);

  // Cache for 12 hours
  await cacheVoiceInsights(userId, insights, 12);

  return insights;
}

/**
 * Force refresh insights
 */
export async function refreshVoiceInsights(userId: string): Promise<VoiceInsight[]> {
  // Clear cache
  const cacheKey = `voice_insights:${userId} `;
  await pool.query(
    `DELETE FROM cache_store WHERE cache_key = $1`,
    [cacheKey]
  ).catch(() => { });

  // Generate new insights
  const insights = await generateVoiceInsights(userId);

  // Cache for 12 hours
  await cacheVoiceInsights(userId, insights, 12);

  return insights;
}
