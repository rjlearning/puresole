"""
Wellness Score Computation for Voice Analysis
Aggregates emotion, sentiment, and acoustic signals into 0-100 wellness score
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def calculate_wellness_score(
    emotion_result: Dict[str, Any],
    sentiment_result: Dict[str, Any],
    acoustic_features: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate comprehensive wellness score from all available signals

    Args:
        emotion_result: Result from emotion_classification module
            - vad: {valence, arousal, dominance}
            - confidence: float
        sentiment_result: Result from sentiment_analysis module
            - sentiment_score: float (-1 to 1)
            - risk_severity: str (critical/high/medium/low/none)
            - crisis_keywords: list
        acoustic_features: Result from acoustic_features module
            - pitch, energy, prosody features

    Returns:
        Dictionary with:
        - score: float (0-100)
        - risk_level: str (critical/high/medium/low/none)
        - confidence: float (0-1)
        - component_scores: dict with individual component scores
        - stress_indicators: dict
    """
    try:
        # Extract signals
        vad = emotion_result.get("vad", {"valence": 0.0, "arousal": 0.5, "dominance": 0.5})
        valence = float(vad.get("valence", 0.0))
        arousal = float(vad.get("arousal", 0.5))
        dominance = float(vad.get("dominance", 0.5))
        emotion_confidence = float(emotion_result.get("confidence", 0.7))

        sentiment_score = float(sentiment_result.get("sentiment_score", 0.0))
        risk_severity = sentiment_result.get("risk_severity", "none")
        sentiment_confidence = float(sentiment_result.get("confidence", 0.6))
        crisis_keywords = sentiment_result.get("crisis_keywords", [])

        acoustic_features = acoustic_features or {}

        # Calculate stress indicators from acoustic features
        stress_indicators = _calculate_stress_indicators(acoustic_features)

        # Component scores (each 0-100)
        component_scores = {
            "valence_score": ((valence + 1) / 2) * 25,           # -1 to 1 → 0-25
            "arousal_score": arousal * 15,                        # 0 to 1 → 0-15
            "dominance_score": dominance * 10,                    # 0 to 1 → 0-10
            "stress_score": (100 - stress_indicators.get("overall_stress", 50)) * 0.20,  # 0-20
            "sentiment_score": ((sentiment_score + 1) / 2) * 15,  # -1 to 1 → 0-15
            "risk_factor_score": (100 - _calculate_risk_factor_score(risk_severity, len(crisis_keywords))) * 0.15  # 0-15
        }

        # Weighted aggregation formula
        wellness_score = sum(component_scores.values())

        # Clamp to [0, 100]
        wellness_score = max(0.0, min(100.0, wellness_score))

        # Determine risk level based on wellness score
        risk_level = _classify_risk_level(wellness_score, risk_severity, len(crisis_keywords) > 0)

        # Calculate confidence based on data quality and input completeness
        confidence = _calculate_confidence(
            emotion_confidence,
            sentiment_confidence,
            acoustic_features,
            len(crisis_keywords) > 0  # Crisis data is more reliable for risk assessment
        )

        return {
            "score": round(wellness_score, 1),
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "component_scores": {k: round(v, 1) for k, v in component_scores.items()},
            "stress_indicators": stress_indicators,
            "crisis_detected": len(crisis_keywords) > 0,
            "crisis_keywords": crisis_keywords,
            "risk_severity": risk_severity
        }

    except Exception as e:
        logger.error(f"Wellness score calculation failed: {e}")
        return _create_default_wellness_result()


def _calculate_stress_indicators(acoustic_features: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculate stress indicators from acoustic features

    High stress indicators:
    - High pitch variation (pitch_std > 40)
    - Fast speaking rate (> 3.5 syllables/sec)
    - High energy with high variation
    - High pause ratio (speech fragmentation)
    - Low spectral qualities (tense voice)

    Returns:
        Dictionary with stress measures (0-100 scale)
    """
    stress_score = 50.0  # Baseline neutral

    # Pitch variation stress
    pitch = acoustic_features.get("pitch", {})
    f0_std = pitch.get("f0_std", 20)
    # High variation (>40) indicates stress/anxiety
    if f0_std > 40:
        stress_score += min(20, (f0_std - 40) * 0.5)
    elif f0_std < 15:
        stress_score -= 5  # Very low variation suggests calmness

    # Speaking rate stress
    prosody = acoustic_features.get("prosody", {})
    speaking_rate = prosody.get("speaking_rate", 2.5)
    # Fast rate (>3.5) or very slow (<1.5) indicates stress
    if speaking_rate > 3.5:
        stress_score += min(15, (speaking_rate - 3.5) * 5)
    elif speaking_rate < 1.5:
        stress_score += min(10, (1.5 - speaking_rate) * 10)

    # Energy characteristics
    energy = acoustic_features.get("energy", {})
    rms_mean = energy.get("rms_mean", 0.15)
    rms_std = energy.get("rms_std", 0.05)
    # High energy with high variation suggests agitation
    if rms_mean > 0.25 and rms_std > 0.1:
        stress_score += 10
    elif rms_mean < 0.1:
        stress_score -= 5  # Low energy with low variation is calming

    # Pause ratio (speech fragmentation)
    pause_ratio = prosody.get("pause_ratio", 0.15)
    if pause_ratio > 0.25:
        stress_score += min(10, pause_ratio * 20)  # Fragmented speech indicates stress

    # Voice quality indicators
    voice_quality = acoustic_features.get("voice_quality", {})
    spectral_centroid = voice_quality.get("spectral_centroid_mean", 2000)
    # Low spectral centroid (<1500) indicates tense, strained voice
    if spectral_centroid < 1500:
        stress_score += 5

    # Clamp to [0, 100]
    overall_stress = max(0.0, min(100.0, stress_score))

    return {
        "overall_stress": round(overall_stress, 1),
        "pitch_variation": round(min(100, f0_std * 2), 1),
        "speaking_rate_anomaly": round(abs(speaking_rate - 2.5) * 20, 1),
        "energy_volatility": round(rms_std * 100, 1),
        "fragmentation": round(pause_ratio * 100, 1)
    }


def _calculate_risk_factor_score(risk_severity: str, crisis_keyword_count: int) -> float:
    """
    Calculate risk factor score (0-100, lower is better)

    Based on sentiment risk severity and crisis keyword presence
    """
    risk_scores = {
        "critical": 95,  # Immediate danger
        "high": 75,      # Significant concern
        "medium": 50,    # Moderate concern
        "low": 25,       # Minor concern
        "none": 5        # Minimal risk
    }

    base_score = risk_scores.get(risk_severity, 5)

    # Add additional penalty for each crisis keyword
    keyword_penalty = min(20, crisis_keyword_count * 5)
    final_score = base_score + keyword_penalty

    return min(100.0, float(final_score))


def _classify_risk_level(
    wellness_score: float,
    risk_severity: str,
    has_crisis_keywords: bool
) -> str:
    """
    Classify risk level based on wellness score and crisis indicators

    Risk Levels:
    - Critical (0-25): Immediate intervention needed
    - High (26-40): Significant concern
    - Medium (41-60): Some challenges, monitor closely
    - Low (61-80): Generally stable with minor concerns
    - None (81-100): Positive wellness indicators
    """
    # Crisis keywords override wellness score for safety
    if has_crisis_keywords:
        if risk_severity == "critical":
            return "critical"
        elif risk_severity == "high":
            return "high"
        elif risk_severity == "medium":
            # Even medium risk keywords suggest at least medium monitoring
            return "medium" if wellness_score < 60 else "low"

    # Use wellness score as primary classifier
    if wellness_score <= 25:
        return "critical"
    elif wellness_score <= 40:
        return "high"
    elif wellness_score <= 60:
        return "medium"
    elif wellness_score <= 80:
        return "low"
    else:
        return "none"


def _calculate_confidence(
    emotion_confidence: float,
    sentiment_confidence: float,
    acoustic_features: Dict[str, Any],
    crisis_present: bool
) -> float:
    """
    Calculate overall confidence score (0-1)

    Factors:
    - Emotion classification confidence
    - Sentiment analysis confidence
    - Quality of acoustic features (complete dataset)
    - Crisis detection confidence (higher when keywords present)
    """
    # Average of primary confidence scores
    base_confidence = (emotion_confidence + sentiment_confidence) / 2

    # Boost confidence if acoustic features are comprehensive
    acoustic_completeness = 0.7  # Default: assume 70% complete
    if acoustic_features:
        required_keys = ["mfcc", "pitch", "energy", "prosody", "voice_quality"]
        present_keys = sum(1 for key in required_keys if key in acoustic_features)
        acoustic_completeness = present_keys / len(required_keys)

    base_confidence = base_confidence * (0.7 + 0.3 * acoustic_completeness)

    # Boost confidence if crisis keywords present (more definitive)
    if crisis_present:
        base_confidence = min(1.0, base_confidence * 1.15)

    return max(0.0, min(1.0, base_confidence))


def _create_default_wellness_result() -> Dict[str, Any]:
    """Create default result for error cases"""
    return {
        "score": 50.0,
        "risk_level": "medium",
        "confidence": 0.0,
        "component_scores": {
            "valence_score": 12.5,
            "arousal_score": 7.5,
            "dominance_score": 5.0,
            "stress_score": 10.0,
            "sentiment_score": 7.5,
            "risk_factor_score": 7.5
        },
        "stress_indicators": {
            "overall_stress": 50.0,
            "pitch_variation": 0.0,
            "speaking_rate_anomaly": 0.0,
            "energy_volatility": 0.0,
            "fragmentation": 0.0
        },
        "crisis_detected": False,
        "crisis_keywords": [],
        "risk_severity": "none"
    }


def extract_stress_indicators(acoustic_features: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract stress indicators for inclusion in AnalysisResult

    This is a convenience function that returns the stress indicators
    from acoustic features in a format suitable for the API response.
    """
    stress_indicators = _calculate_stress_indicators(acoustic_features)
    return stress_indicators
