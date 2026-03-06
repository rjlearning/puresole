/**
 * StreakEngine — lightweight localStorage-based daily streak tracker.
 * No backend required: streaks persist across sessions on the same device.
 */

const STREAK_KEY = 'puresoul_streak';
const LAST_DATE_KEY = 'puresoul_last_checkin';

export interface StreakState {
    currentStreak: number;
    lastCheckInDate: string | null; // ISO date YYYY-MM-DD
    longestStreak: number;
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

export function getStreak(): StreakState {
    try {
        const streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
        const longestStreak = parseInt(localStorage.getItem('puresoul_longest_streak') || '0', 10);
        const lastCheckInDate = localStorage.getItem(LAST_DATE_KEY);
        return { currentStreak: streak, lastCheckInDate, longestStreak };
    } catch {
        return { currentStreak: 0, lastCheckInDate: null, longestStreak: 0 };
    }
}

/**
 * Checks if user already checked in today.
 */
export function hasCheckedInToday(): boolean {
    try {
        return localStorage.getItem(LAST_DATE_KEY) === todayISO();
    } catch {
        return false;
    }
}

/**
 * Records today's check-in and increments streak.
 * Returns the new streak count.
 */
export function recordCheckIn(): number {
    try {
        const today = todayISO();
        const lastDate = localStorage.getItem(LAST_DATE_KEY);
        const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
        const longestStreak = parseInt(localStorage.getItem('puresoul_longest_streak') || '0', 10);

        if (lastDate === today) {
            // Already checked in today – no change
            return currentStreak;
        }

        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString().split('T')[0];

        const newStreak = lastDate === yesterdayISO ? currentStreak + 1 : 1;
        const newLongest = Math.max(newStreak, longestStreak);

        localStorage.setItem(STREAK_KEY, String(newStreak));
        localStorage.setItem(LAST_DATE_KEY, today);
        localStorage.setItem('puresoul_longest_streak', String(newLongest));

        return newStreak;
    } catch {
        return 0;
    }
}

/**
 * How many hours until midnight (streak resets).
 */
export function hoursUntilStreakReset(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 3_600_000);
}
