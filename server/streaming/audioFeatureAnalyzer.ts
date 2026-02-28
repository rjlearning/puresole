import { log } from '../vite';

/**
 * Audio Feature Analyzer
 *
 * Maps real-time audio features (from client-side Web Audio API) to emotion estimates
 * when the ML service is unavailable. Uses volume, spectral characteristics,
 * and temporal patterns to infer emotional state.
 *
 * This provides meaningful varied emotion feedback instead of always returning "neutral".
 */

export interface AudioFeatures {
  volume: number;           // 0-1 RMS volume level
  spectralCentroid: number; // 0-1 normalized frequency center (brightness)
  spectralFlatness: number; // 0-1 how noisy vs tonal the spectrum is
  isSpeaking: boolean;      // whether speech is detected (volume above threshold)
}

export interface EmotionEstimate {
  primary_emotion: string;
  emotion_scores: Record<string, number>;
  emotion_confidence: number;
  valence: number;
  arousal: number;
  dominance: number;
  processingTimeMs: number;
  timestamp: number;
}

// Emotion-to-valence mapping for computing aggregate valence
const EMOTION_VALENCE: Record<string, number> = {
  happy: 0.65,
  calm: 0.35,
  neutral: 0.0,
  anxious: -0.35,
  sad: -0.55,
  stressed: -0.45
};

export class AudioFeatureAnalyzer {
  private featureHistory: AudioFeatures[] = [];
  private readonly maxHistory = 30;
  private silenceSegmentCount = 0;

  /**
   * Analyze audio features and return an emotion estimate
   */
  analyze(features: AudioFeatures): EmotionEstimate {
    const startTime = Date.now();

    // Store in history (keep up to 30 frames)
    this.featureHistory.push(features);
    if (this.featureHistory.length > this.maxHistory) {
      this.featureHistory.shift();
    }

    // Track silence
    if (features.isSpeaking) {
      this.silenceSegmentCount = 0;
    } else {
      this.silenceSegmentCount++;
    }

    // Extended silence → neutral
    if (!features.isSpeaking && this.silenceSegmentCount > 2) {
      return this.createSimpleResult('neutral', 0.35, 0, 0.1, 0.5, startTime);
    }

    // Need at least a few speaking frames
    const recentFeatures = this.featureHistory.filter(f => f.isSpeaking).slice(-12);
    if (recentFeatures.length < 2) {
      return this.createSimpleResult('neutral', 0.40, 0, 0.2, 0.5, startTime);
    }

    const volumes = recentFeatures.map(f => f.volume);
    const centroids = recentFeatures.map(f => f.spectralCentroid);
    const flatnesses = recentFeatures.map(f => f.spectralFlatness ?? 0.5);

    const avgVolume = this.average(volumes);
    const volumeVar = this.variance(volumes);
    const avgCentroid = this.average(centroids);
    const centroidVar = this.variance(centroids);
    const avgFlatness = this.average(flatnesses);

    // ──────────────────────────────────────────────────────────────────────────
    // CALIBRATED THRESHOLDS
    // Browser microphones typically produce:
    //   volume   :  0.05 – 0.55  (not 0–1 in practice)
    //   centroid :  0.18 – 0.55  (speech is rarely < 0.20 OR > 0.55)
    //   flatness :  0.10 – 0.60  (more tonal = lower flatness)
    // volumeVar  :  0.001 – 0.06 (high = animated / low = monotone)
    // centroidVar:  0.001 – 0.04
    // ──────────────────────────────────────────────────────────────────────────

    const scores: Record<string, number> = {
      neutral: 0,
      happy: 0,
      calm: 0,
      sad: 0,
      anxious: 0,
      stressed: 0
    };

    // HAPPY — moderate-good volume, brighter/mid centroid, somewhat animated, less noisy
    // Spectral centroid > 0.30 = brighter tone of voice
    if (avgVolume > 0.12 && avgCentroid > 0.28 && volumeVar > 0.002 && avgFlatness < 0.55) {
      scores.happy = 0.10
        + Math.max(0, avgCentroid - 0.28) * 0.80
        + Math.max(0, avgVolume - 0.12) * 0.40
        + Math.min(volumeVar * 4, 0.20);
    }

    // CALM — softer volume, smooth delivery (low variance), mid centroid
    // Key: variability is very low (smooth, measured speech)
    if (avgVolume > 0.05 && avgVolume < 0.38 && volumeVar < 0.010 && centroidVar < 0.015) {
      scores.calm = 0.12
        + Math.max(0, 0.010 - volumeVar) * 8
        + Math.max(0, 0.015 - centroidVar) * 6
        + Math.max(0, 0.38 - avgVolume) * 0.25;
    }

    // SAD — ONLY fires when BOTH volume AND centroid are very low together
    // AND there's almost no variation (flat, lifeless delivery)
    // Raised bar: avgVolume < 0.12 AND centroid < 0.24 (much tighter)
    if (avgVolume < 0.12 && avgCentroid < 0.24 && volumeVar < 0.005) {
      scores.sad = 0.05
        + Math.max(0, 0.12 - avgVolume) * 0.60
        + Math.max(0, 0.24 - avgCentroid) * 0.50;
    }

    // ANXIOUS — high variability in both volume and centroid (shaky, rushed speech)
    if (volumeVar > 0.015 && (centroidVar > 0.012 || avgCentroid > 0.38)) {
      scores.anxious = 0.08
        + Math.min(volumeVar * 6, 0.30)
        + Math.min(centroidVar * 5, 0.20);
    }

    // STRESSED — high volume + bright centroid + some variance (tense, clipped speech)
    if (avgVolume > 0.38 && avgCentroid > 0.36 && volumeVar > 0.006) {
      scores.stressed = 0.10
        + Math.max(0, avgVolume - 0.38) * 0.70
        + Math.max(0, avgCentroid - 0.36) * 0.50;
    }

    // NEUTRAL — baseline; strongest when nothing else fires clearly
    const emotionTotal = Object.values(scores).reduce((a, b) => a + b, 0);
    if (emotionTotal < 0.20) {
      // Nothing stood out → neutral
      scores.neutral = 0.50 + (0.20 - emotionTotal) * 0.8;
    } else {
      scores.neutral = Math.max(0.03, (1 - emotionTotal) * 0.12);
    }

    // Normalize to sum = 1.0
    this.normalizeScores(scores);

    // Primary emotion
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const primaryEmotion = sorted[0][0];
    const primaryScore = sorted[0][1];

    // ── History smoothing: bias toward previous primary if consistent ──
    // (reduces flickering between very similar scores)
    if (this.featureHistory.length >= 6) {
      const prevPrimary = this._lastPrimary;
      if (prevPrimary && prevPrimary !== primaryEmotion) {
        const prevScore = scores[prevPrimary] ?? 0;
        const gap = primaryScore - prevScore;
        if (gap < 0.10) {
          // very close — keep the previous emotion for stability
          scores[prevPrimary] = primaryScore + 0.01;
          this.normalizeScores(scores);
          const reRanked = Object.entries(scores).sort(([, a], [, b]) => b - a);
          this._lastPrimary = reRanked[0][0];
        } else {
          this._lastPrimary = primaryEmotion;
        }
      } else {
        this._lastPrimary = primaryEmotion;
      }
    } else {
      this._lastPrimary = primaryEmotion;
    }

    // Final primary after smoothing
    const finalPrimary = this._lastPrimary;
    const finalScore = scores[finalPrimary];

    // VAD dimensions
    // Arousal: driven by volume + variance (energy/animation)
    const arousal = Math.min(avgVolume * 1.5 + volumeVar * 3, 1.0);
    // Dominance: higher volume + lower variance = more controlled/dominant
    const dominance = Math.max(0, Math.min(1, 0.30 + avgVolume * 0.35 + (0.010 - Math.min(volumeVar, 0.010)) * 5));

    // Valence from weighted emotion scores
    let valence = 0;
    for (const [emotion, score] of Object.entries(scores)) {
      valence += (EMOTION_VALENCE[emotion] || 0) * score;
    }
    valence += (Math.random() - 0.5) * 0.04; // tiny natural variation
    valence = Math.max(-1, Math.min(1, valence));

    const confidence = Math.min(finalScore * 1.20 + 0.12, 0.88);

    log(`[AudioFeatureAnalyzer] vol=${avgVolume.toFixed(3)} cent=${avgCentroid.toFixed(3)} ` +
      `volVar=${volumeVar.toFixed(4)} centVar=${centroidVar.toFixed(4)} → ${finalPrimary} (${(confidence * 100).toFixed(0)}%)`);

    return {
      primary_emotion: finalPrimary,
      emotion_scores: scores,
      emotion_confidence: confidence,
      valence,
      arousal,
      dominance,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  /** Tracks last primary for hysteresis smoothing */
  private _lastPrimary: string = 'neutral';


  private normalizeScores(scores: Record<string, number>): void {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key of Object.keys(scores)) {
        scores[key] = Math.round((scores[key] / total) * 100) / 100;
      }
    }
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  private variance(arr: number[]): number {
    if (arr.length < 2) return 0;
    const avg = this.average(arr);
    return arr.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / arr.length;
  }

  private createSimpleResult(
    emotion: string, confidence: number, valence: number, arousal: number, dominance: number, startTime: number
  ): EmotionEstimate {
    const scores: Record<string, number> = {
      neutral: 0, happy: 0, calm: 0, sad: 0, anxious: 0, stressed: 0
    };
    scores[emotion] = 1.0;
    return {
      primary_emotion: emotion,
      emotion_scores: scores,
      emotion_confidence: confidence,
      valence,
      arousal,
      dominance,
      processingTimeMs: Date.now() - startTime,
      timestamp: Date.now()
    };
  }

  reset(): void {
    this.featureHistory = [];
    this.silenceSegmentCount = 0;
  }
}

export function createAudioFeatureAnalyzer(): AudioFeatureAnalyzer {
  return new AudioFeatureAnalyzer();
}
