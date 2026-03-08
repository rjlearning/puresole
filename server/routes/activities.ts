import { Router } from 'express';
import { storage } from '../storage';
import { pool } from '../db';
import { isAuthenticated } from '../standardAuth';

const router = Router();

// Static data matching client/src/lib/activity-data.ts
interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  icon_emoji: string;
  gradient_class: string;
  benefits: string[];
  animation_type?: string;
  ai_suggested: boolean;
  instructions: string[];
}

const sampleActivities: Activity[] = [
  {
    id: 'breathing-1',
    name: '4-7-8 Breathing',
    description: 'Reduce anxiety and promote calmness with this simple breathing technique',
    category: 'breathing',
    difficulty: 'beginner',
    duration: 5,
    icon_emoji: '🫁',
    gradient_class: 'from-blue-500 to-cyan-500',
    benefits: ['Reduces stress', 'Improves sleep', 'Calms nervous system'],
    animation_type: 'breathing',
    ai_suggested: true,
    instructions: [
      'Sit comfortably with your back straight. Place the tip of your tongue against the ridge behind your upper front teeth.',
      'Exhale completely through your mouth, making a whoosh sound.',
      'Close your mouth and inhale quietly through your nose for 4 counts.',
      'Hold your breath for 7 counts.',
      'Exhale completely through your mouth for 8 counts, making a whoosh sound.',
      'Repeat this cycle 3-4 times. You may feel lightheaded at first - this is normal.'
    ]
  },
  {
    id: 'meditation-1',
    name: 'Guided Mindfulness',
    description: 'A 10-minute guided meditation to center your thoughts and relax your mind',
    category: 'meditation',
    difficulty: 'beginner',
    duration: 10,
    icon_emoji: '🧘',
    gradient_class: 'from-purple-500 to-pink-500',
    benefits: ['Improves focus', 'Reduces anxiety', 'Emotional balance'],
    animation_type: 'meditation',
    ai_suggested: true,
    instructions: [
      'Find a quiet space and sit comfortably with your back straight but relaxed.',
      'Close your eyes or maintain a soft gaze downward.',
      'Bring your attention to your breath. Notice the natural rhythm of breathing in and out.',
      'When thoughts arise, acknowledge them without judgment and gently return focus to your breath.',
      'Scan your body from head to toe, noticing any tension and allowing it to release.',
      'Expand awareness to sounds around you, then to the feeling of your body in space.',
      'In the final minute, slowly bring movement back to your fingers and toes.',
      'Take a deep breath and open your eyes when ready.'
    ]
  },
  {
    id: 'journaling-1',
    name: 'Gratitude Journal',
    description: 'Write down three things you\'re grateful for today to shift your mindset',
    category: 'journaling',
    difficulty: 'beginner',
    duration: 5,
    icon_emoji: '📝',
    gradient_class: 'from-green-500 to-emerald-500',
    benefits: ['Positive thinking', 'Better mood', 'Mindfulness'],
    ai_suggested: false,
    animation_type: 'journaling',
    instructions: [
      'Get a notebook or open your digital journal.',
      'Think about your day and identify three things you\'re grateful for. They can be big or small.',
      'Write each item clearly. Instead of just listing, explain WHY you\'re grateful. Example: "I\'m grateful for my morning coffee because it gave me a moment of peace."',
      'Be specific and genuine. Focus on people, experiences, or things that truly matter.',
      'Re-read what you wrote and let the positive feelings sink in.',
      'Optional: End with one thing you\'re looking forward to tomorrow.'
    ]
  },
  {
    id: 'movement-1',
    name: 'Yoga for Stress',
    description: 'Gentle yoga flows designed to release tension and improve flexibility',
    category: 'movement',
    difficulty: 'intermediate',
    duration: 15,
    icon_emoji: '🤸',
    gradient_class: 'from-orange-500 to-red-500',
    benefits: ['Reduces tension', 'Improves flexibility', 'Body awareness'],
    animation_type: 'movement',
    ai_suggested: true,
    instructions: [
      'Find a quiet space with your yoga mat. Wear comfortable clothing.',
      'Start in Child\'s Pose: Kneel, sit back on heels, extend arms forward. Hold for 1 minute, breathing deeply.',
      'Move to Cat-Cow: On hands and knees, alternate arching back (cow) and rounding spine (cat). Repeat 5 times.',
      'Downward Dog: From hands and knees, lift hips up and back, forming an inverted V. Hold for 5 breaths.',
      'Transition to Warrior I: Step right foot forward, raise arms overhead, bend right knee. Hold 5 breaths, switch sides.',
      'Child\'s Pose for 1 minute to rest.',
      'Seated Forward Fold: Sit with legs extended, reach for toes. Hold for 1 minute.',
      'End in Savasana (Corpse Pose): Lie flat, arms at sides, palms up. Relax completely for 2-3 minutes.'
    ]
  },
  {
    id: 'grounding-1',
    name: '5-4-3-2-1 Technique',
    description: 'Ground yourself in the present moment using your five senses',
    category: 'grounding',
    difficulty: 'beginner',
    duration: 5,
    icon_emoji: '🌍',
    gradient_class: 'from-teal-500 to-green-500',
    benefits: ['Reduces panic', 'Present awareness', 'Calming'],
    ai_suggested: false,
    animation_type: 'grounding',
    instructions: [
      'Sit or stand comfortably. Take a deep breath.',
      '5 THINGS YOU SEE: Look around and name 5 things you can see. Say them out loud or in your mind. Example: "I see a blue chair, a lamp, a window, a book, my phone."',
      '4 THINGS YOU TOUCH: Acknowledge 4 things you can physically feel. Example: "I feel the chair beneath me, my feet on the floor, my hands on my lap, the air on my skin."',
      '3 THINGS YOU HEAR: Listen carefully and identify 3 sounds. Example: "I hear birds chirping, a car passing, the hum of the refrigerator."',
      '2 THINGS YOU SMELL: Notice 2 scents. If you can\'t smell anything, name 2 scents you like.',
      '1 THING YOU TASTE: Identify 1 thing you can taste, or name your favorite flavor.',
      'Take another deep breath and notice how you feel more present and calm.'
    ]
  },
  {
    id: 'breathing-2',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs to stay calm under pressure',
    category: 'breathing',
    difficulty: 'intermediate',
    duration: 8,
    icon_emoji: '🫁',
    gradient_class: 'from-blue-500 to-cyan-500',
    benefits: ['Focus', 'Stress relief', 'Mental clarity'],
    animation_type: 'breathing',
    ai_suggested: true,
    instructions: [
      'Sit upright in a comfortable position with feet flat on the floor.',
      'Exhale slowly through your mouth to empty your lungs completely.',
      'STEP 1 - Inhale: Breathe in slowly through your nose for 4 counts.',
      'STEP 2 - Hold: Hold your breath for 4 counts. Stay relaxed.',
      'STEP 3 - Exhale: Breathe out slowly through your mouth for 4 counts.',
      'STEP 4 - Hold: Hold your breath (lungs empty) for 4 counts.',
      'Repeat this "box" pattern for 5-10 cycles. Imagine tracing the sides of a square.',
      'End with a few natural breaths and notice your calmer state.'
    ]
  },
  {
    id: 'meditation-2',
    name: 'Body Scan Meditation',
    description: 'Progressive relaxation technique to release physical tension',
    category: 'meditation',
    difficulty: 'beginner',
    duration: 12,
    icon_emoji: '🧘',
    gradient_class: 'from-purple-500 to-pink-500',
    benefits: ['Deep relaxation', 'Better sleep', 'Pain relief'],
    animation_type: 'meditation',
    ai_suggested: true,
    instructions: [
      'Lie down comfortably on your back with arms at your sides, palms facing up.',
      'Close your eyes and take 3 deep, slow breaths.',
      'Bring attention to your toes. Notice any sensations. Consciously relax them.',
      'Move attention up to your feet, then ankles. Relax each area as you go.',
      'Continue scanning: calves, knees, thighs, hips. Release tension in each part.',
      'Move to your abdomen, chest, and back. Breathe into any tight areas.',
      'Scan your shoulders, arms, hands, and fingers. Let them become heavy.',
      'Finally, relax your neck, jaw, face, and scalp.',
      'Stay in this fully relaxed state for 2-3 minutes before slowly opening your eyes.'
    ]
  },
  {
    id: 'movement-2',
    name: 'Walking Meditation',
    description: 'Combine gentle movement with mindfulness practice',
    category: 'movement',
    difficulty: 'beginner',
    duration: 10,
    icon_emoji: '🚶',
    gradient_class: 'from-orange-500 to-red-500',
    benefits: ['Mood boost', 'Mental clarity', 'Energy'],
    ai_suggested: false,
    animation_type: 'movement',
    instructions: [
      'Find a quiet path or space where you can walk for 10 minutes uninterrupted.',
      'Stand still for a moment. Take 3 deep breaths and set an intention to be present.',
      'Begin walking at a slow, natural pace. There is no destination.',
      'Focus on the physical sensations: feet touching the ground, legs moving, arms swinging.',
      'Notice how your weight shifts from heel to toe with each step.',
      'When your mind wanders (it will!), gently bring attention back to the sensation of walking.',
      'Observe your surroundings with fresh eyes, but keep primary focus on the act of walking.',
      'In the last minute, gradually slow down. Stand still and take 3 final deep breaths.',
      'Notice how you feel - often calmer and more grounded.'
    ]
  },
  {
    id: 'journaling-2',
    name: 'Thought Dump',
    description: 'Free-write everything on your mind for mental clarity',
    category: 'journaling',
    difficulty: 'beginner',
    duration: 10,
    icon_emoji: '📝',
    gradient_class: 'from-green-500 to-emerald-500',
    benefits: ['Mental clarity', 'Stress release', 'Self-awareness'],
    ai_suggested: false,
    animation_type: 'journaling',
    instructions: [
      'Grab a notebook or open a blank document. Set a timer for 10 minutes.',
      'Start writing everything that comes to mind. Don\'t filter, edit, or judge.',
      'Write continuously. If you get stuck, write "I don\'t know what to write" until something comes.',
      'Include worries, tasks, random thoughts, feelings - anything occupying mental space.',
      'Don\'t worry about grammar, spelling, or making sense. This is just for you.',
      'Keep your hand moving for the full 10 minutes.',
      'When the timer ends, take a breath. You don\'t need to reread it unless you want to.',
      'Notice the mental clarity and lightness that comes from emptying your mind onto paper.'
    ]
  }
];

// GET all activities (with optional category filter)
router.get('/activities', async (req, res) => {
  try {
    const { category } = req.query;
    let activities = await storage.getWellnessActivities(category as string);

    // Add static activities
    const { sampleActivities } = await import('../../shared/lib/activity-data');
    let staticActivities = sampleActivities;
    if (category && category !== 'all') {
      staticActivities = sampleActivities.filter((a: any) => a.category === category);
    }

    // Combine and deduplicate by ID
    const combined = [...activities, ...staticActivities];
    const uniqueActivities = Array.from(new Map(combined.map(a => [a.id, a])).values());

    // Format activities for frontend (convert text to arrays)
    const formattedActivities = uniqueActivities.map((a: any) => ({
      ...a,
      instructions: typeof a.instructions === 'string' ? a.instructions.split('\n').filter(Boolean) : a.instructions,
      benefits: typeof a.benefits === 'string' ? a.benefits.split('\n').filter(Boolean) : a.benefits
    }));

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error('[Activities] Error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET today's activity completions for the current user
router.get('/activities/completions/today', isAuthenticated, async (req: any, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const completions = await storage.getActivityCompletionsByUser(userId, startOfDay, new Date());
    // Return just the IDs for easy checking in the UI
    res.json({ completedIds: completions.map(c => c.activityId) });
  } catch (error) {
    console.error('[Activities] Error fetching today\'s completions:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s completions' });
  }
});

// GET single activity
router.get('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let activity: any = await storage.getWellnessActivity(id);

    if (!activity) {
      // Fall back to static list
      const { sampleActivities } = await import('../../shared/lib/activity-data');
      activity = sampleActivities.find((a: any) => a.id === id);
    }

    if (!activity) {
      const userId = (req.user as any)?.id;
      if (userId) {
        const plans = await storage.getTreatmentPlansByUser(userId);
        for (const plan of plans) {
          const modules = await storage.getTreatmentModulesByPlan(plan.id);
          for (const mod of modules) {
            const activities = (mod.content as any)?.activities || [];
            const decodedId = decodeURIComponent(id);
            const found = activities.find((a: any) => a.name === id || a.name === decodedId);
            if (found) {
              activity = {
                id: found.name,
                name: found.name,
                description: found.description || found.instructions || '',
                category: found.type || 'exercise',
                difficulty: 'beginner',
                duration: found.duration || 10,
                icon_emoji: '✨',
                gradient_class: 'from-indigo-500 to-rose-500',
                benefits: ['Personalized for your specific emotional state'],
                instructions: found.instructions || found.description || '',
                animation_type: 'default'
              };
              break;
            }
          }
          if (activity) break;
        }
      }
    }

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Format for frontend
    const formattedActivity = {
      ...activity,
      instructions: typeof activity.instructions === 'string' ? activity.instructions.split('\n').filter(Boolean) : activity.instructions,
      benefits: typeof activity.benefits === 'string' ? activity.benefits.split('\n').filter(Boolean) : activity.benefits
    };

    res.json({ activity: formattedActivity });
  } catch (error) {
    console.error('[Activities] Error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// POST complete activity
router.post('/activities/:id/complete', isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    const { effectiveness_rating, notes, duration_actual } = req.body;

    let activity: any = null;
    let foundPlanId: string | null = null;
    let foundModuleId: string | null = null;

    try { activity = await storage.getWellnessActivity(id); } catch (_) { }
    if (!activity) {
      // Fall back to static list
      const { sampleActivities } = await import('../../shared/lib/activity-data');
      activity = sampleActivities.find((a: any) => a.id === id);
    }

    if (!activity) {
      const plans = await storage.getTreatmentPlansByUser(userId);
      for (const plan of plans) {
        const modules = await storage.getTreatmentModulesByPlan(plan.id);
        for (const mod of modules) {
          const activities = (mod.content as any)?.activities || [];
          const decodedId = decodeURIComponent(id);
          const found = activities.find((a: any) => a.name === id || a.name === decodedId);
          if (found) {
            activity = {
              id: found.name,
              name: found.name,
              description: found.description || found.instructions || '',
              category: found.type || 'exercise',
              difficulty: 'beginner',
              duration: found.duration || 10,
              icon_emoji: '✨',
              gradient_class: 'from-indigo-500 to-rose-500',
              benefits: ['Personalized for your specific emotional state'],
              instructions: found.instructions || found.description || '',
              animation_type: 'default'
            };
            foundPlanId = plan.id;
            foundModuleId = mod.id;
            break;
          }
        }
        if (activity) break;
      }
    }
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Calculate points
    const durationBonus = Math.min(duration_actual || 0, activity.duration) * 2;
    const effectivenessBonus = Math.round(((effectiveness_rating || 5) / 10) * 20);
    const points_earned = 10 + durationBonus + effectivenessBonus;

    // Save to user_activity_completions table
    await storage.createActivityCompletion({
      userId,
      activityId: id,
      durationActual: duration_actual || 0,
      effectivenessRating: effectiveness_rating || 5,
      notes: notes || null,
      completedAt: new Date(),
    });

    if (foundPlanId && foundModuleId) {
      await storage.createProgressEntry({
        userId,
        planId: foundPlanId,
        moduleId: foundModuleId,
        activityName: activity.name,
        activityType: activity.category,
        completed: true,
        date: new Date()
      });
    }

    // Update active treatment plan progress
    const plans = await storage.getTreatmentPlansByUser(userId);
    const activePlan = plans[0];
    if (activePlan) {
      const currentPct = Number(activePlan.progressPercentage || 0);
      const newPct = Math.min(100, currentPct + 5);
      await storage.updateTreatmentPlan(activePlan.id, {
        progressPercentage: newPct.toString()
      });
    }

    res.json({
      success: true,
      message: `Activity completed! You earned ${points_earned} points.`,
      points_earned,
    });
  } catch (error) {
    console.error('[Activities] Completion Error:', error);
    res.status(500).json({ error: 'Failed to record progress', detail: String(error) });
  }
});

export default router;
