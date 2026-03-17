/**
 * LIWC-style journal NLP analysis
 * Extracts mental health signal markers from free text.
 * Pure function — no DB, no network.
 */

// Word lists for signal detection
const NEGATIVE_EMOTION_WORDS = new Set([
    'sad', 'sadness', 'unhappy', 'depressed', 'hopeless', 'worthless', 'miserable', 'terrible',
    'awful', 'horrible', 'dreadful', 'anxious', 'worried', 'scared', 'afraid', 'nervous', 'stressed',
    'overwhelmed', 'exhausted', 'helpless', 'empty', 'numb', 'lonely', 'lost', 'broken', 'pain',
    'hurt', 'suffer', 'struggle', 'fear', 'cry', 'crying', 'tears', 'despair', 'grief',
    'angry', 'rage', 'frustrated', 'hate', 'useless', 'failure', 'failed', 'fail', 'shame', 'ashamed',
    'guilty', 'regret', 'sorry', 'weak', 'tired', 'can\'t', 'cannot', 'won\'t', 'impossible',
]);

const ABSOLUTIST_WORDS = new Set([
    'never', 'always', 'nothing', 'everything', 'nobody', 'everybody', 'completely', 'totally',
    'absolutely', 'forever', 'everywhere', 'impossible', 'no one', 'all', 'none', 'every',
    'entire', 'constant', 'constantly', 'endless', 'endlessly', 'inevitable', 'inevitably',
]);

const FIRST_PERSON_SINGULAR = new Set(['i', 'me', 'my', 'myself', 'mine']);
const POSITIVE_EMOTION_WORDS = new Set([
    'happy', 'joy', 'excited', 'grateful', 'calm', 'peaceful', 'hopeful', 'good', 'great', 'amazing',
    'wonderful', 'fantastic', 'proud', 'confident', 'strong', 'better', 'improving', 'progress',
    'love', 'enjoy', 'appreciate', 'thankful', 'blessed', 'inspired', 'motivated', 'content',
]);

export interface JournalNLPResult {
    sentimentScore: number;      // -1.0 to 1.0 (negative to positive)
    negativityRatio: number;     // 0-1 (negative words / total words)
    positivtyRatio: number;      // 0-1
    absolutismScore: number;     // 0-1 (absolutist words / total words × 10 scaled)
    ruminationScore: number;     // 0-1 (first-person singular density)
    wordCount: number;
    signalSummary: string;       // human-readable summary
}

export function analyzeJournalText(text: string): JournalNLPResult {
    if (!text || text.trim().length < 5) {
        return {
            sentimentScore: 0, negativityRatio: 0, positivtyRatio: 0,
            absolutismScore: 0, ruminationScore: 0, wordCount: 0,
            signalSummary: 'Insufficient text'
        };
    }

    // Tokenize — lowercase, strip punctuation
    const words = text
        .toLowerCase()
        .replace(/[^a-z\s']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);

    const wordCount = words.length;
    if (wordCount === 0) return {
        sentimentScore: 0, negativityRatio: 0, positivtyRatio: 0,
        absolutismScore: 0, ruminationScore: 0, wordCount: 0,
        signalSummary: 'No words found'
    };

    let negCount = 0;
    let posCount = 0;
    let absolutistCount = 0;
    let firstPersonCount = 0;

    for (const word of words) {
        if (NEGATIVE_EMOTION_WORDS.has(word)) negCount++;
        if (POSITIVE_EMOTION_WORDS.has(word)) posCount++;
        if (ABSOLUTIST_WORDS.has(word)) absolutistCount++;
        if (FIRST_PERSON_SINGULAR.has(word)) firstPersonCount++;
    }

    const negativityRatio = negCount / wordCount;
    const positivtyRatio = posCount / wordCount;
    const absolutismScore = Math.min(1, (absolutistCount / wordCount) * 10);
    const ruminationScore = Math.min(1, (firstPersonCount / wordCount) * 5);

    // Sentiment: positive score lifts, negative drags, absolutism penalises
    const rawSentiment = (positivtyRatio - negativityRatio) - (absolutismScore * 0.3) - (ruminationScore * 0.1);
    const sentimentScore = Math.max(-1, Math.min(1, rawSentiment * 5));

    // Human summary
    let signalSummary = '';
    if (sentimentScore > 0.3) signalSummary = 'Positive emotional tone detected';
    else if (sentimentScore > -0.1) signalSummary = 'Neutral to mixed emotional tone';
    else if (sentimentScore > -0.5) signalSummary = 'Moderate negative emotional markers present';
    else signalSummary = 'Strong negative emotional markers — elevated monitoring recommended';

    if (absolutismScore > 0.3) signalSummary += '; absolutist thinking patterns detected';
    if (ruminationScore > 0.5) signalSummary += '; elevated self-focused rumination';

    return { sentimentScore, negativityRatio, positivtyRatio, absolutismScore, ruminationScore, wordCount, signalSummary };
}

/** Convert sentiment score (-1..1) to a 0-100 wellness proxy */
export function sentimentToWellnessScore(sentimentScore: number): number {
    // Map -1..1 → 0..100, centred at 50
    return Math.round(((sentimentScore + 1) / 2) * 100);
}
