import { pool } from '../db';

// ============================================
// DAY OF WEEK PATTERNS
// ============================================

export async function analyzeDayOfWeekPatterns(userId: string) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Last 90 days

  const result = await pool.query(
    `SELECT
      EXTRACT(DOW FROM recorded_at) as day_of_week,
      TO_CHAR(recorded_at, 'Day') as day_name,
      AVG(mood_after) as avg_mood,
      AVG(energy_level) as avg_energy,
      AVG(stress_level) as avg_stress,
      COUNT(*) as entry_count
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY EXTRACT(DOW FROM recorded_at), TO_CHAR(recorded_at, 'Day')
    ORDER BY day_of_week`,
    [userId, startDate.toISOString()]
  );

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const patterns = result.rows.map(row => ({
    dayOfWeek: parseInt(row.day_of_week),
    dayName: dayNames[parseInt(row.day_of_week)],
    averageMood: parseFloat(row.avg_mood) || 0,
    averageEnergy: parseFloat(row.avg_energy) || 0,
    averageStress: parseFloat(row.avg_stress) || 0,
    entryCount: parseInt(row.entry_count)
  }));

  // Find best and worst days
  const sortedByMood = [...patterns].sort((a, b) => b.averageMood - a.averageMood);
  const bestDay = sortedByMood[0];
  const worstDay = sortedByMood[sortedByMood.length - 1];

  // Calculate variance to see if there's a significant pattern
  const avgMood = patterns.reduce((sum, p) => sum + p.averageMood, 0) / patterns.length;
  const variance = patterns.reduce((sum, p) => sum + Math.pow(p.averageMood - avgMood, 2), 0) / patterns.length;
  const hasSignificantPattern = variance > 0.5; // Threshold for "significant" variance

  return {
    patterns,
    insights: {
      bestDay: bestDay?.dayName || 'Unknown',
      worstDay: worstDay?.dayName || 'Unknown',
      moodDifference: bestDay && worstDay ? (bestDay.averageMood - worstDay.averageMood).toFixed(1) : '0',
      hasSignificantPattern,
      message: hasSignificantPattern
        ? `Your mood varies significantly by day of week. ${bestDay?.dayName} is your best day!`
        : 'Your mood is fairly consistent across all days of the week.'
    }
  };
}

// ============================================
// TIME OF DAY PATTERNS
// ============================================

export async function analyzeTimeOfDayPatterns(userId: string) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const result = await pool.query(
    `SELECT
      EXTRACT(HOUR FROM recorded_at) as hour,
      AVG(mood_after) as avg_mood,
      AVG(energy_level) as avg_energy,
      AVG(stress_level) as avg_stress,
      COUNT(*) as entry_count
    FROM voice_entries
    WHERE user_id = $1 AND recorded_at >= $2::timestamp
    GROUP BY EXTRACT(HOUR FROM recorded_at)
    ORDER BY hour`,
    [userId, startDate.toISOString()]
  );

  const getTimeOfDayLabel = (hour: number) => {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  const patterns = result.rows.map(row => ({
    hour: parseInt(row.hour),
    timeOfDay: getTimeOfDayLabel(parseInt(row.hour)),
    averageMood: parseFloat(row.avg_mood) || 0,
    averageEnergy: parseFloat(row.avg_energy) || 0,
    averageStress: parseFloat(row.avg_stress) || 0,
    entryCount: parseInt(row.entry_count)
  }));

  // Aggregate by time of day
  const timeOfDayGroups: { [key: string]: { mood: number[]; energy: number[]; stress: number[] } } = {
    Morning: { mood: [], energy: [], stress: [] },
    Afternoon: { mood: [], energy: [], stress: [] },
    Evening: { mood: [], energy: [], stress: [] },
    Night: { mood: [], energy: [], stress: [] }
  };

  patterns.forEach(p => {
    timeOfDayGroups[p.timeOfDay].mood.push(p.averageMood);
    timeOfDayGroups[p.timeOfDay].energy.push(p.averageEnergy);
    timeOfDayGroups[p.timeOfDay].stress.push(p.averageStress);
  });

  const timeOfDayAverages = Object.entries(timeOfDayGroups).map(([timeOfDay, data]) => ({
    timeOfDay,
    averageMood: data.mood.length > 0 ? data.mood.reduce((a, b) => a + b, 0) / data.mood.length : 0,
    averageEnergy: data.energy.length > 0 ? data.energy.reduce((a, b) => a + b, 0) / data.energy.length : 0,
    averageStress: data.stress.length > 0 ? data.stress.reduce((a, b) => a + b, 0) / data.stress.length : 0,
    entryCount: data.mood.length
  }));

  // Find best and worst times
  const sortedByMood = [...timeOfDayAverages].sort((a, b) => b.averageMood - a.averageMood);
  const bestTime = sortedByMood[0];
  const worstTime = sortedByMood[sortedByMood.length - 1];

  return {
    hourlyPatterns: patterns,
    timeOfDayAverages,
    insights: {
      bestTime: bestTime?.timeOfDay || 'Unknown',
      worstTime: worstTime?.timeOfDay || 'Unknown',
      message: `Your mood is typically best in the ${bestTime?.timeOfDay.toLowerCase()} and lowest in the ${worstTime?.timeOfDay.toLowerCase()}.`
    }
  };
}

// ============================================
// ACTIVITY STREAKS
// ============================================

export async function analyzeActivityStreaks(userId: string) {
  const result = await pool.query(
    `SELECT
      DATE(completed_at) as date,
      COUNT(DISTINCT activity_id) as activities_count
    FROM user_activity_completions
    WHERE user_id = $1
    GROUP BY DATE(completed_at)
    ORDER BY date DESC
    LIMIT 90`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      message: 'Start completing activities to build your streak!'
    };
  }

  const activeDates = result.rows.map(row => new Date(row.date));

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const hasActivity = activeDates.some(d => {
      const activityDate = new Date(d);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === checkDate.getTime();
    });

    if (hasActivity) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = activeDates.sort((a, b) => b.getTime() - a.getTime());

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff = Math.floor((sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDates.length,
    message: currentStreak > 0
      ? `You're on a ${currentStreak}-day streak! Keep it up!`
      : 'Complete an activity today to start a new streak!'
  };
}
