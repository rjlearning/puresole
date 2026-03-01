import OpenAI from 'openai';
import { pool } from '../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface UserPatterns {
  avgStress: number;
  avgMood: number;
  avgEnergy: number;
  avgAnxiety: number;
  commonEmotions: string[];
  trends: {
    mood: 'improving' | 'declining' | 'stable';
    stress: 'improving' | 'declining' | 'stable';
  };
}

interface PlanItem {
  title: string;
  description: string;
  item_type: 'activity' | 'reminder' | 'reflection';
  activity_id?: string;
  scheduled_time?: string;
  estimated_duration: number;
  display_order: number;
}

interface GeneratedPlan {
  title: string;
  description: string;
  reasoning: string;
  priority_focus: string;
  items: PlanItem[];
}

export async function getUserPatterns(userId: string, days: number = 7): Promise<UserPatterns> {
  try {
    // Get emotional blueprints from last N days
    const blueprintsResult = await pool.query(
      `SELECT stress_score, mood_score, energy_level, anxiety_score, detected_emotions
       FROM emotional_blueprints
       WHERE user_id = $1
         AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [userId]
    );

    if (blueprintsResult.rows.length === 0) {
      // Default patterns for new users
      return {
        avgStress: 50,
        avgMood: 60,
        avgEnergy: 50,
        avgAnxiety: 40,
        commonEmotions: ['neutral'],
        trends: { mood: 'stable', stress: 'stable' }
      };
    }

    const blueprints = blueprintsResult.rows;

    // Calculate averages
    const avgStress = Math.round(
      blueprints.reduce((sum: number, b: any) => sum + (b.stress_score || 50), 0) / blueprints.length
    );
    const avgMood = Math.round(
      blueprints.reduce((sum: number, b: any) => sum + (b.mood_score || 60), 0) / blueprints.length
    );
    const avgEnergy = Math.round(
      blueprints.reduce((sum: number, b: any) => sum + (b.energy_level || 50), 0) / blueprints.length
    );
    const avgAnxiety = Math.round(
      blueprints.reduce((sum: number, b: any) => sum + (b.anxiety_score || 40), 0) / blueprints.length
    );

    // Extract common emotions
    const emotionCounts: Record<string, number> = {};
    blueprints.forEach((b: any) => {
      if (b.detected_emotions && Array.isArray(b.detected_emotions)) {
        b.detected_emotions.forEach((emotion: string) => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }
    });

    const commonEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Determine trends (compare first half to second half)
    const midpoint = Math.floor(blueprints.length / 2);
    const firstHalf = blueprints.slice(midpoint);
    const secondHalf = blueprints.slice(0, midpoint);

    const firstMood = firstHalf.reduce((sum: number, b: any) => sum + (b.mood_score || 60), 0) / firstHalf.length;
    const secondMood = secondHalf.reduce((sum: number, b: any) => sum + (b.mood_score || 60), 0) / secondHalf.length;
    const moodTrend = secondMood > firstMood + 5 ? 'improving' : secondMood < firstMood - 5 ? 'declining' : 'stable';

    const firstStress = firstHalf.reduce((sum: number, b: any) => sum + (b.stress_score || 50), 0) / firstHalf.length;
    const secondStress = secondHalf.reduce((sum: number, b: any) => sum + (b.stress_score || 50), 0) / secondHalf.length;
    const stressTrend = secondStress < firstStress - 5 ? 'improving' : secondStress > firstStress + 5 ? 'declining' : 'stable';

    return {
      avgStress,
      avgMood,
      avgEnergy,
      avgAnxiety,
      commonEmotions: commonEmotions.length > 0 ? commonEmotions : ['neutral'],
      trends: { mood: moodTrend, stress: stressTrend }
    };
  } catch (error) {
    console.error('[Plan Generation] Error getting user patterns:', error);
    throw error;
  }
}

export async function getEffectiveActivities(userId: string): Promise<any[]> {
  try {
    // Get activities user has completed with high ratings
    const result = await pool.query(
      `SELECT wa.id, wa.name, wa.category, wa.duration, wa.difficulty,
              AVG(uac.effectiveness_rating) as avg_rating,
              COUNT(uac.id) as completion_count
       FROM wellness_activities wa
       JOIN user_activity_completions uac ON wa.id = uac.activity_id
       WHERE uac.user_id = $1
         AND uac.effectiveness_rating >= 4
         AND uac.completed_at >= NOW() - INTERVAL '30 days'
       GROUP BY wa.id, wa.name, wa.category, wa.duration, wa.difficulty
       ORDER BY avg_rating DESC, completion_count DESC
       LIMIT 10`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('[Plan Generation] Error getting effective activities:', error);
    return [];
  }
}

export async function generateDailyPlan(
  userId: string,
  targetDate: Date = new Date(),
  focusArea?: string
): Promise<GeneratedPlan> {
  try {
    console.log(`[Plan Generation] Generating plan for user ${userId}, date: ${targetDate.toDateString()}`);

    // 1. Get user patterns
    const patterns = await getUserPatterns(userId, 7);

    // 2. Get effective activities
    const effectiveActivities = await getEffectiveActivities(userId);

    // 3. Get user's active goals
    const goalsResult = await pool.query(
      `SELECT id, title, category, target_date, completion_percentage
       FROM user_goals
       WHERE user_id = $1 AND status = 'active'
       ORDER BY target_date ASC
       LIMIT 3`,
      [userId]
    );
    const activeGoals = goalsResult.rows;

    // 4. Get all available activities
    const activitiesResult = await pool.query(
      `SELECT id, name, description, category, duration, difficulty, instructions, benefits
       FROM wellness_activities
       ORDER BY name`
    );
    const allActivities = activitiesResult.rows;

    // 5. Determine focus area if not specified
    if (!focusArea) {
      if (patterns.avgStress > 65) focusArea = 'stress_reduction';
      else if (patterns.avgAnxiety > 60) focusArea = 'anxiety_management';
      else if (patterns.avgMood < 50) focusArea = 'mood_improvement';
      else if (patterns.avgEnergy < 40) focusArea = 'energy_building';
      else focusArea = 'overall_wellness';
    }

    // 6. Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
      console.log('[Plan Generation] No OpenAI API key, using rule-based generation');
      return generateRuleBasedPlan(patterns, allActivities, focusArea, effectiveActivities, activeGoals);
    }

    // 7. Generate AI plan with GPT-4
    return await generateAIPlan(patterns, allActivities, focusArea, effectiveActivities, activeGoals, targetDate);
  } catch (error) {
    console.error('[Plan Generation] Error:', error);
    throw error;
  }
}

async function generateAIPlan(
  patterns: UserPatterns,
  activities: any[],
  focusArea: string,
  effectiveActivities: any[],
  goals: any[],
  targetDate: Date
): Promise<GeneratedPlan> {
  const prompt = `You are an expert wellness coach creating a personalized daily plan.

User's Current State:
- Stress Level: ${patterns.avgStress}/100 (${patterns.trends.stress})
- Mood Score: ${patterns.avgMood}/100 (${patterns.trends.mood})
- Energy Level: ${patterns.avgEnergy}/100
- Anxiety Level: ${patterns.avgAnxiety}/100
- Recent Emotions: ${patterns.commonEmotions.join(', ')}

Focus Area: ${focusArea}

Activities that have worked well for this user:
${effectiveActivities.map(a => `- ${a.name} (${a.category}, rating: ${a.avg_rating}/5)`).join('\n') || 'None yet - user is new'}

Active Goals:
${goals.map(g => `- ${g.title} (${g.completion_percentage}% complete)`).join('\n') || 'No active goals'}

Available Activities:
${activities.slice(0, 20).map(a => `- ${a.name}: ${a.description} (${a.duration} min, ${a.category})`).join('\n')}

Create a daily wellness plan with 5-6 activities for ${targetDate.toDateString()}. Include:
1. A mix of morning, afternoon, and evening activities
2. Prioritize activities the user has found effective
3. Include at least one stress-reduction technique if stress is elevated
4. Balance different activity types (breathing, meditation, movement, reflection)
5. Suggest realistic times (e.g., 8:00 AM, 2:00 PM, 8:00 PM)

Respond in JSON format:
{
  "title": "Plan title (e.g., 'Morning Calm & Evening Reflection')",
  "description": "Brief description (1-2 sentences)",
  "reasoning": "Why this plan is ideal for the user right now (2-3 sentences)",
  "priority_focus": "${focusArea}",
  "items": [
    {
      "title": "Activity name",
      "description": "What to do (1 sentence)",
      "item_type": "activity",
      "scheduled_time": "08:00",
      "estimated_duration": 10,
      "display_order": 1
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],

      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from GPT-4');

    const plan = JSON.parse(content);

    // Match activities to database IDs where possible
    plan.items = plan.items.map((item: any, index: number) => {
      const matchingActivity = activities.find(a =>
        a.name.toLowerCase().includes(item.title.toLowerCase()) ||
        item.title.toLowerCase().includes(a.name.toLowerCase())
      );

      return {
        ...item,
        activity_id: matchingActivity?.id,
        display_order: index + 1
      };
    });

    console.log('[Plan Generation] AI plan generated successfully');
    return plan;
  } catch (error: any) {
    console.error('[Plan Generation] AI error, falling back to rules:', error.message);
    return generateRuleBasedPlan(patterns, activities, focusArea, effectiveActivities, goals);
  }
}

function generateRuleBasedPlan(
  patterns: UserPatterns,
  activities: any[],
  focusArea: string,
  effectiveActivities: any[],
  goals: any[]
): GeneratedPlan {
  const items: PlanItem[] = [];
  let order = 1;

  // Morning routine (always start with something calming)
  if (patterns.avgStress > 60 || patterns.avgAnxiety > 50) {
    const breathingActivity = activities.find(a => a.category === 'breathing');
    if (breathingActivity) {
      items.push({
        title: breathingActivity.name,
        description: 'Start your day with calming breathwork',
        item_type: 'activity',
        activity_id: breathingActivity.id,
        scheduled_time: '08:00',
        estimated_duration: breathingActivity.duration,
        display_order: order++
      });
    }
  }

  // Add meditation for mindfulness
  const meditationActivity = activities.find(a => a.category === 'meditation');
  if (meditationActivity) {
    items.push({
      title: meditationActivity.name,
      description: 'Practice mindfulness and presence',
      item_type: 'activity',
      activity_id: meditationActivity.id,
      scheduled_time: '08:15',
      estimated_duration: meditationActivity.duration,
      display_order: order++
    });
  }

  // Afternoon check-in
  items.push({
    title: 'Midday Mood Check',
    description: 'Take a moment to notice how you\'re feeling',
    item_type: 'reflection',
    scheduled_time: '14:00',
    estimated_duration: 2,
    display_order: order++
  });

  // Movement for energy (if low energy)
  if (patterns.avgEnergy < 50) {
    const movementActivity = activities.find(a => a.category === 'movement');
    if (movementActivity) {
      items.push({
        title: movementActivity.name,
        description: 'Boost your energy with gentle movement',
        item_type: 'activity',
        activity_id: movementActivity.id,
        scheduled_time: '15:00',
        estimated_duration: movementActivity.duration,
        display_order: order++
      });
    }
  }

  // Evening journaling
  const journalingActivity = activities.find(a => a.category === 'journaling');
  if (journalingActivity) {
    items.push({
      title: journalingActivity.name,
      description: 'Reflect on your day and express gratitude',
      item_type: 'activity',
      activity_id: journalingActivity.id,
      scheduled_time: '20:00',
      estimated_duration: journalingActivity.duration,
      display_order: order++
    });
  }

  // Evening wind-down
  const groundingActivity = activities.find(a => a.category === 'grounding');
  if (groundingActivity) {
    items.push({
      title: groundingActivity.name,
      description: 'Prepare for restful sleep',
      item_type: 'activity',
      activity_id: groundingActivity.id,
      scheduled_time: '21:00',
      estimated_duration: groundingActivity.duration,
      display_order: order++
    });
  }

  // Generate title and description based on focus area
  const titles: Record<string, string> = {
    stress_reduction: 'Stress Relief Plan',
    anxiety_management: 'Calm & Centered Plan',
    mood_improvement: 'Mood Boost Plan',
    energy_building: 'Energy & Vitality Plan',
    overall_wellness: 'Balanced Wellness Plan'
  };

  const descriptions: Record<string, string> = {
    stress_reduction: 'A calming routine to help reduce stress and find peace',
    anxiety_management: 'Grounding activities to ease anxiety and build inner calm',
    mood_improvement: 'Uplifting activities to brighten your mood and spirits',
    energy_building: 'Energizing practices to boost vitality and motivation',
    overall_wellness: 'A balanced approach to support your overall wellbeing'
  };

  return {
    title: titles[focusArea] || 'Daily Wellness Plan',
    description: descriptions[focusArea] || 'A personalized plan for your wellness journey',
    reasoning: `Based on your recent patterns (stress: ${patterns.avgStress}, mood: ${patterns.avgMood}, energy: ${patterns.avgEnergy}), this plan focuses on ${focusArea.replace('_', ' ')} with a mix of calming and energizing activities throughout your day.`,
    priority_focus: focusArea,
    items
  };
}

export async function savePlanToDatabase(
  userId: string,
  plan: GeneratedPlan,
  targetDate: Date
): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current patterns for baseline
    const patterns = await getUserPatterns(userId, 7);

    // Insert wellness plan
    const planResult = await client.query(
      `INSERT INTO wellness_plans (
        user_id, title, description, plan_type, target_date,
        reasoning, priority_focus,
        baseline_mood_score, baseline_stress_level, baseline_energy_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        userId,
        plan.title,
        plan.description,
        'daily',
        targetDate,
        plan.reasoning,
        plan.priority_focus,
        patterns.avgMood,
        patterns.avgStress,
        patterns.avgEnergy
      ]
    );

    const planId = planResult.rows[0].id;

    // Insert plan items
    for (const item of plan.items) {
      await client.query(
        `INSERT INTO plan_items (
          plan_id, title, description, item_type, activity_id,
          scheduled_time, estimated_duration, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          planId,
          item.title,
          item.description,
          item.item_type,
          item.activity_id || null,
          item.scheduled_time || null,
          item.estimated_duration,
          item.display_order
        ]
      );
    }

    await client.query('COMMIT');

    console.log(`[Plan Generation] Plan saved successfully: ${planId}`);
    return planId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Plan Generation] Error saving plan:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default { generateDailyPlan, savePlanToDatabase, getUserPatterns };
