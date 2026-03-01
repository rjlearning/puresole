import { pool } from '../db';
import OpenAI from 'openai';
import { detectBaselineDeviations, getPersonalizedBaseline } from './userBaselineCalculation';
import { getActivePredictions } from './voicePredictiveAnalytics';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Advanced Voice Insights Service
 *
 * Generates GPT-4 powered personalized insights with:
 * - Baseline deviation analysis
 * - Predictive trend integration
 * - Actionable recommendations with priority scoring
 * - Urgency levels (1-10) for proactive intervention
 * - Cross-metric correlation analysis
 */

interface ActionItem {
  action: string;
  category: 'immediate' | 'short_term' | 'long_term';
  estimatedImpact: 'high' | 'medium' | 'low';
  timeEstimate?: string;
}

interface AdvancedInsight {
  userId: string;
  insightType: 'baseline_deviation' | 'trend_alert' | 'achievement' | 'recommendation' | 'pattern_discovery';
  title: string;
  description: string;
  urgencyLevel: number; // 1-10 (10 = highest urgency)
  priorityScore: number; // 1-100 (100 = highest priority)
  confidenceScore: number; // 0-1
  actionItems: ActionItem[];
  relatedMetrics: {
    baseline?: { metric: string; deviation: number };
    prediction?: { window: number; trend: string };
    correlations?: string[];
  };
  sourceType: 'ai_analysis' | 'statistical_detection' | 'combined';
  createdAt: Date;
  expiresAt?: Date;
  isPinned: boolean;
}

/**
 * Generate comprehensive advanced insights for a user
 * Combines baseline analysis, predictions, and GPT-4 recommendations
 */
export async function generateAdvancedInsights(userId: string): Promise<AdvancedInsight[]> {
  console.log(`🔍 Generating advanced insights for user ${userId}`);

  try {
    const insights: AdvancedInsight[] = [];

    // 1. Check for baseline deviations
    const deviationInsights = await generateDeviationInsights(userId);
    insights.push(...deviationInsights);

    // 2. Analyze predictive trends
    const trendInsights = await generateTrendInsights(userId);
    insights.push(...trendInsights);

    // 3. Generate AI-powered recommendations
    const aiInsights = await generateAIRecommendations(userId);
    insights.push(...aiInsights);

    // 4. Detect patterns and achievements
    const patternInsights = await generatePatternInsights(userId);
    insights.push(...patternInsights);

    // Sort by urgency and priority
    insights.sort((a, b) => {
      if (a.urgencyLevel !== b.urgencyLevel) {
        return b.urgencyLevel - a.urgencyLevel; // Higher urgency first
      }
      return b.priorityScore - a.priorityScore; // Higher priority first
    });

    // Save top 10 insights to database
    const topInsights = insights.slice(0, 10);
    for (const insight of topInsights) {
      await saveInsightToDB(insight);
    }

    console.log(`✅ Generated ${insights.length} insights, saved top ${topInsights.length}`);
    return insights;

  } catch (error) {
    console.error(`❌ Error generating advanced insights for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Generate insights from baseline deviations
 * Detects significant changes from personalized norms
 */
async function generateDeviationInsights(userId: string): Promise<AdvancedInsight[]> {
  const insights: AdvancedInsight[] = [];

  try {
    const deviations = await detectBaselineDeviations(userId, 7);
    const baseline = await getPersonalizedBaseline(userId, 30);

    if (!baseline || deviations.length === 0) {
      return insights;
    }

    // Only process significant deviations (|z| > 2.0)
    const significantDeviations = deviations.filter(d => d.isSignificant);

    for (const deviation of significantDeviations) {
      const isPositive = deviation.direction === 'elevated' && (deviation.metric === 'wellness' || deviation.metric === 'valence');
      const isNegative = deviation.direction === 'reduced' && (deviation.metric === 'wellness' || deviation.metric === 'valence');

      // Calculate urgency (higher for negative changes)
      const urgency = isNegative ? 8 : isPositive ? 3 : 6;
      const priority = Math.abs(deviation.zScore) * 10;

      const actionItems: ActionItem[] = [];

      if (isNegative) {
        actionItems.push(
          {
            action: 'Schedule check-in with therapist or support person',
            category: 'immediate',
            estimatedImpact: 'high',
            timeEstimate: 'Today'
          },
          {
            action: 'Practice grounding techniques (5-4-3-2-1 method)',
            category: 'immediate',
            estimatedImpact: 'medium',
            timeEstimate: '5 minutes'
          },
          {
            action: 'Review recent stressors in your journal',
            category: 'short_term',
            estimatedImpact: 'medium',
            timeEstimate: '15 minutes'
          }
        );
      } else if (isPositive) {
        actionItems.push(
          {
            action: 'Reflect on what contributed to this positive change',
            category: 'short_term',
            estimatedImpact: 'high',
            timeEstimate: '10 minutes'
          },
          {
            action: 'Document successful coping strategies',
            category: 'short_term',
            estimatedImpact: 'medium',
            timeEstimate: '10 minutes'
          }
        );
      }

      insights.push({
        userId,
        insightType: 'baseline_deviation',
        title: `${deviation.metric.charAt(0).toUpperCase() + deviation.metric.slice(1)} ${deviation.direction === 'elevated' ? 'Increase' : 'Decrease'} Detected`,
        description: `Your ${deviation.metric} is ${deviation.direction} by ${Math.abs(deviation.zScore).toFixed(1)} standard deviations from your normal baseline. Current: ${deviation.currentValue.toFixed(2)}, Baseline: ${deviation.baselineValue.toFixed(2)}.`,
        urgencyLevel: urgency,
        priorityScore: Math.min(100, Math.round(priority)),
        confidenceScore: Math.min(1, baseline.baselineConfidence),
        actionItems,
        relatedMetrics: {
          baseline: {
            metric: deviation.metric,
            deviation: deviation.zScore
          }
        },
        sourceType: 'statistical_detection',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        isPinned: urgency >= 7
      });
    }

  } catch (error) {
    console.error('Error generating deviation insights:', error);
  }

  return insights;
}

/**
 * Generate insights from predictive trends
 * Analyzes forecast direction and confidence
 */
async function generateTrendInsights(userId: string): Promise<AdvancedInsight[]> {
  const insights: AdvancedInsight[] = [];

  try {
    const predictions = await getActivePredictions(userId);

    if (predictions.length === 0) {
      return insights;
    }

    // Analyze 7-day prediction trend
    const shortTermPrediction = predictions.find(p => p.predictionWindow === 7);

    if (shortTermPrediction) {
      // Get current wellness for comparison
      const { rows } = await pool.query(
        `
        SELECT AVG(wellness_score) as current_wellness
        FROM voice_analyses
        WHERE user_id = $1
          AND processing_status = 'completed'
          AND created_at >= NOW() - INTERVAL '3 days'
        `,
        [userId]
      );

      const currentWellness = rows[0]?.current_wellness ? parseFloat(rows[0].current_wellness) : null;

      if (currentWellness) {
        const change = shortTermPrediction.predictedWellnessScore - currentWellness;
        const isImproving = change > 5;
        const isDeclining = change < -5;

        if (isImproving || isDeclining) {
          const actionItems: ActionItem[] = [];

          if (isDeclining) {
            actionItems.push(
              {
                action: 'Increase self-care activities this week',
                category: 'immediate',
                estimatedImpact: 'high',
                timeEstimate: 'Daily'
              },
              {
                action: 'Proactively address known stressors',
                category: 'short_term',
                estimatedImpact: 'high',
                timeEstimate: 'This week'
              }
            );
          }

          insights.push({
            userId,
            insightType: 'trend_alert',
            title: isImproving ? 'Positive Trend Forecast' : 'Wellness Decline Predicted',
            description: `Based on recent patterns, your wellness score is predicted to ${isImproving ? 'improve' : 'decline'} by ${Math.abs(change).toFixed(1)} points over the next week. Current: ${currentWellness.toFixed(1)}, Predicted: ${shortTermPrediction.predictedWellnessScore.toFixed(1)}.`,
            urgencyLevel: isDeclining ? 7 : 3,
            priorityScore: Math.min(100, Math.round(Math.abs(change) * 5)),
            confidenceScore: shortTermPrediction.confidenceScore,
            actionItems,
            relatedMetrics: {
              prediction: {
                window: 7,
                trend: isImproving ? 'improving' : 'declining'
              }
            },
            sourceType: 'statistical_detection',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isPinned: isDeclining
          });
        }
      }
    }

  } catch (error) {
    console.error('Error generating trend insights:', error);
  }

  return insights;
}

/**
 * Generate AI-powered recommendations using GPT-4
 * Provides personalized, context-aware suggestions
 */
async function generateAIRecommendations(userId: string): Promise<AdvancedInsight[]> {
  const insights: AdvancedInsight[] = [];

  try {
    // Get recent analysis summary
    const { rows: recentData } = await pool.query(
      `
      SELECT
        AVG(wellness_score) as avg_wellness,
        AVG(valence) as avg_valence,
        AVG(arousal) as avg_arousal,
        mode() WITHIN GROUP (ORDER BY primary_emotion) as dominant_emotion,
        COUNT(*) as analysis_count
      FROM voice_analyses
      WHERE user_id = $1
        AND processing_status = 'completed'
        AND created_at >= NOW() - INTERVAL '14 days'
      `,
      [userId]
    );

    if (!recentData[0] || recentData[0].analysis_count < 3) {
      return insights;
    }

    const data = recentData[0];

    // Construct prompt for GPT-4
    const prompt = `As a mental wellness AI assistant, analyze this user's recent voice data and provide 2-3 personalized, actionable recommendations:

Average wellness score: ${parseFloat(data.avg_wellness).toFixed(1)}/100
Average valence (positivity): ${parseFloat(data.avg_valence).toFixed(2)} (-1 to 1)
Average arousal (energy): ${parseFloat(data.avg_arousal).toFixed(2)} (0 to 1)
Dominant emotion: ${data.dominant_emotion}
Analysis count: ${data.analysis_count} entries over 14 days

Provide recommendations as a JSON array with this structure:
[{
  "title": "Brief title (max 60 chars)",
  "description": "Detailed description (2-3 sentences)",
  "priority": 1-100,
  "action_items": [
    { "action": "Specific actionable step", "category": "immediate|short_term|long_term", "impact": "high|medium|low" }
  ]
}]

Focus on evidence-based strategies. Be empathetic but practical.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate mental wellness AI assistant. Provide personalized, evidence-based recommendations in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],

      max_tokens: 800
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (responseContent) {
      // Parse JSON response
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);

        for (const rec of recommendations) {
          insights.push({
            userId,
            insightType: 'recommendation',
            title: rec.title,
            description: rec.description,
            urgencyLevel: rec.priority > 70 ? 6 : rec.priority > 40 ? 4 : 2,
            priorityScore: rec.priority,
            confidenceScore: 0.8, // GPT-4 recommendations
            actionItems: rec.action_items.map((item: any) => ({
              action: item.action,
              category: item.category,
              estimatedImpact: item.impact
            })),
            relatedMetrics: {},
            sourceType: 'ai_analysis',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            isPinned: false
          });
        }
      }
    }

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
  }

  return insights;
}

/**
 * Detect patterns and celebrate achievements
 */
async function generatePatternInsights(userId: string): Promise<AdvancedInsight[]> {
  const insights: AdvancedInsight[] = [];

  try {
    // Check for consistency achievement (7+ days in a row)
    const { rows: streakData } = await pool.query(
      `
      WITH daily_analyses AS (
        SELECT DATE(created_at) as analysis_date
        FROM voice_analyses
        WHERE user_id = $1
          AND processing_status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
      ),
      streak AS (
        SELECT
          analysis_date,
          analysis_date - ROW_NUMBER() OVER (ORDER BY analysis_date)::int AS streak_group
        FROM daily_analyses
      )
      SELECT COUNT(*) as streak_length
      FROM streak
      WHERE streak_group = (SELECT streak_group FROM streak ORDER BY analysis_date DESC LIMIT 1)
      `,
      [userId]
    );

    const streakLength = streakData[0]?.streak_length ? parseInt(streakData[0].streak_length) : 0;

    if (streakLength >= 7) {
      insights.push({
        userId,
        insightType: 'achievement',
        title: `${streakLength}-Day Consistency Streak! 🎉`,
        description: `You've recorded voice analyses for ${streakLength} consecutive days. This consistent tracking is key to understanding your emotional patterns and maintaining mental wellness.`,
        urgencyLevel: 1,
        priorityScore: 30,
        confidenceScore: 1.0,
        actionItems: [
          {
            action: 'Keep up the momentum with your next entry',
            category: 'immediate',
            estimatedImpact: 'medium',
            timeEstimate: '5 minutes'
          }
        ],
        relatedMetrics: {},
        sourceType: 'statistical_detection',
        createdAt: new Date(),
        isPinned: true
      });
    }

  } catch (error) {
    console.error('Error generating pattern insights:', error);
  }

  return insights;
}

/**
 * Save insight to database with enhanced schema
 */
async function saveInsightToDB(insight: AdvancedInsight): Promise<void> {
  await pool.query(
    `
    INSERT INTO user_insights (
      user_id,
      insight_type,
      title,
      description,
      urgency_level,
      priority,
      confidence,
      action_items,
      related_metrics,
      source_type,
      is_pinned,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      insight.userId,
      insight.insightType,
      insight.title,
      insight.description,
      insight.urgencyLevel,
      insight.priorityScore,
      insight.confidenceScore,
      JSON.stringify(insight.actionItems),
      JSON.stringify(insight.relatedMetrics),
      insight.sourceType,
      insight.isPinned,
      insight.expiresAt
    ]
  );
}

/**
 * Get active insights for a user (sorted by urgency and priority)
 */
export async function getActiveInsights(userId: string, limit: number = 10): Promise<AdvancedInsight[]> {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        user_id,
        insight_type,
        title,
        description,
        urgency_level,
        priority,
        confidence,
        action_items,
        related_metrics,
        source_type,
        is_pinned,
        created_at,
        expires_at
      FROM user_insights
      WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY is_pinned DESC, urgency_level DESC, priority DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    return rows.map(row => ({
      userId: row.user_id,
      insightType: row.insight_type,
      title: row.title,
      description: row.description,
      urgencyLevel: row.urgency_level,
      priorityScore: row.priority,
      confidenceScore: parseFloat(row.confidence),
      actionItems: row.action_items || [],
      relatedMetrics: row.related_metrics || {},
      sourceType: row.source_type,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      isPinned: row.is_pinned
    }));

  } catch (error) {
    console.error('Error retrieving active insights:', error);
    throw error;
  }
}
