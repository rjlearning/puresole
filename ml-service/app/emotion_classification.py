"""
Emotion Classification for Voice Analysis
Uses GPT-4 with acoustic context to classify emotions and calculate VAD scores
"""
import json
import logging
from typing import Dict, Any, Optional

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from .config import config
from .acoustic_features import summarize_acoustic_features

logger = logging.getLogger(__name__)

# 11 emotion categories for mental wellness tracking
EMOTION_CATEGORIES = [
    "happy", "sad", "anxious", "stressed", "calm",
    "angry", "fearful", "surprised", "neutral", "excited", "tired"
]


class EmotionClassifier:
    """
    Hybrid emotion classifier using GPT-4 and acoustic features
    """

    def __init__(self):
        """Initialize emotion classifier"""
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI library not installed. Install with: pip install openai")
            self.client = None
            return

        if not config.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. Emotion classification will not be available.")
            self.client = None
            return

        try:
            self.client = OpenAI(api_key=config.OPENAI_API_KEY)
            logger.info("✅ Emotion classifier initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Check if emotion classification is available"""
        return self.client is not None

    async def classify_emotions(
        self,
        transcript: str,
        acoustic_features: Dict[str, Any],
        mood_before: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Classify emotions using GPT-4 with acoustic context

        Args:
            transcript: Transcribed text from voice entry
            acoustic_features: Acoustic features extracted from audio
            mood_before: Optional self-reported mood score (1-10)

        Returns:
            Dictionary with:
            - emotions: Dict[emotion, confidence_score]
            - primary_emotion: str
            - confidence: float (0-1)
            - vad: Dict[valence, arousal, dominance]
            - reasoning: str

        Raises:
            Exception: If classification fails
        """
        if not self.is_available():
            # Fallback: Use acoustic features alone
            logger.warning("OpenAI not available, using acoustic-only fallback")
            return self._classify_from_acoustic_only(acoustic_features)

        try:
            # Generate acoustic summary for GPT-4
            acoustic_summary = summarize_acoustic_features(acoustic_features)

            # Build prompt
            system_prompt = """You are an emotion detection system specialized in mental wellness tracking.
Analyze voice entries to classify emotions with high accuracy. Consider both what is said (transcript)
and how it is said (acoustic features like pitch, energy, speaking rate).

Be sensitive and nuanced in your analysis. Return JSON only."""

            user_prompt = self._build_classification_prompt(
                transcript, acoustic_summary, mood_before
            )

            # Call GPT-4
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent results
                response_format={"type": "json_object"}
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Validate and normalize
            validated_result = self._validate_and_normalize(result, acoustic_features)

            logger.info(f"✅ Emotion classification complete: {validated_result['primary_emotion']}")
            return validated_result

        except Exception as e:
            logger.error(f"Emotion classification failed: {e}")
            # Fallback to acoustic-only
            return self._classify_from_acoustic_only(acoustic_features)

    def _build_classification_prompt(
        self,
        transcript: str,
        acoustic_summary: str,
        mood_before: Optional[int]
    ) -> str:
        """Build GPT-4 classification prompt"""

        prompt = f"""Analyze this voice entry for emotion classification:

TRANSCRIPT:
{transcript if transcript else "[No speech detected]"}

ACOUSTIC CONTEXT:
{acoustic_summary}
"""

        if mood_before:
            prompt += f"\nSELF-REPORTED MOOD (before entry): {mood_before}/10\n"

        prompt += f"""
Classify the emotional state across these 11 emotions: {', '.join(EMOTION_CATEGORIES)}

Provide emotion distribution (scores 0-1 that sum to ~1.0), identify the primary emotion,
calculate VAD (Valence-Arousal-Dominance) scores, and explain your reasoning.

**VAD Definitions:**
- Valence: Emotional positivity (-1 = very negative, 0 = neutral, +1 = very positive)
- Arousal: Energy/activation level (0 = calm/tired, 1 = excited/anxious)
- Dominance: Sense of control/agency (0 = powerless/stressed, 1 = in control/confident)

Return JSON in this exact format:
{{
  "emotions": {{
    "happy": 0.15,
    "sad": 0.05,
    "anxious": 0.20,
    "stressed": 0.10,
    "calm": 0.30,
    "angry": 0.02,
    "fearful": 0.05,
    "surprised": 0.03,
    "neutral": 0.05,
    "excited": 0.03,
    "tired": 0.02
  }},
  "primary_emotion": "calm",
  "confidence": 0.85,
  "vad": {{
    "valence": 0.2,
    "arousal": 0.3,
    "dominance": 0.5
  }},
  "reasoning": "Speaker shows calm prosody with moderate energy. Transcript suggests reflection without significant distress. Slight positive valence from constructive content."
}}"""

        return prompt

    def _validate_and_normalize(
        self,
        result: Dict[str, Any],
        acoustic_features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate GPT-4 response and normalize values

        Ensures:
        - All 11 emotions present
        - Emotion scores sum to ~1.0
        - VAD scores in valid ranges
        - Primary emotion matches highest score
        - Confidence is reasonable
        """
        # Ensure all emotions present
        emotions = result.get("emotions", {})
        for emotion in EMOTION_CATEGORIES:
            if emotion not in emotions:
                emotions[emotion] = 0.0

        # Normalize emotion scores to sum to 1.0
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v / total for k, v in emotions.items()}
        else:
            # If all zeros, default to neutral
            emotions["neutral"] = 1.0

        # Find primary emotion
        primary_emotion = max(emotions.items(), key=lambda x: x[1])[0]

        # Validate VAD scores
        vad = result.get("vad", {"valence": 0.0, "arousal": 0.5, "dominance": 0.5})
        vad["valence"] = max(-1.0, min(1.0, vad.get("valence", 0.0)))
        vad["arousal"] = max(0.0, min(1.0, vad.get("arousal", 0.5)))
        vad["dominance"] = max(0.0, min(1.0, vad.get("dominance", 0.5)))

        # Calculate confidence
        confidence = result.get("confidence", 0.7)
        confidence = max(0.0, min(1.0, confidence))

        # Boost confidence if acoustic features align with classification
        if self._acoustic_alignment_check(primary_emotion, acoustic_features):
            confidence = min(1.0, confidence * 1.1)

        return {
            "emotions": emotions,
            "primary_emotion": primary_emotion,
            "confidence": confidence,
            "vad": vad,
            "reasoning": result.get("reasoning", "Emotion classification based on transcript and acoustic analysis.")
        }

    def _acoustic_alignment_check(self, emotion: str, acoustic_features: Dict[str, Any]) -> bool:
        """
        Check if acoustic features align with detected emotion

        Returns True if acoustic signals support the emotion classification
        """
        prosody = acoustic_features.get("prosody", {})
        pitch = acoustic_features.get("pitch", {})
        energy = acoustic_features.get("energy", {})

        speaking_rate = prosody.get("speaking_rate", 2.5)
        pitch_std = pitch.get("f0_std", 20)
        energy_mean = energy.get("rms_mean", 0.15)

        # Heuristic alignment checks
        if emotion in ["anxious", "stressed", "excited"]:
            # Expect fast speech, high pitch variation, or high energy
            return speaking_rate > 3.0 or pitch_std > 35 or energy_mean > 0.25

        elif emotion in ["calm", "neutral"]:
            # Expect moderate speech, low pitch variation
            return 2.0 <= speaking_rate <= 3.5 and pitch_std < 30

        elif emotion in ["sad", "tired"]:
            # Expect slow speech, low energy
            return speaking_rate < 2.5 or energy_mean < 0.15

        elif emotion == "angry":
            # Expect high energy, high pitch variation
            return energy_mean > 0.25 and pitch_std > 30

        # Default: consider aligned
        return True

    def _classify_from_acoustic_only(self, acoustic_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback: Classify emotions using only acoustic features

        This is a simplified heuristic-based approach when GPT-4 is unavailable.
        """
        logger.info("Using acoustic-only fallback classification")

        prosody = acoustic_features.get("prosody", {})
        pitch = acoustic_features.get("pitch", {})
        energy = acoustic_features.get("energy", {})

        speaking_rate = prosody.get("speaking_rate", 2.5)
        pitch_std = pitch.get("f0_std", 20)
        energy_mean = energy.get("rms_mean", 0.15)
        pause_ratio = prosody.get("pause_ratio", 0.15)

        # Initialize emotion scores
        emotions = {emotion: 0.1 for emotion in EMOTION_CATEGORIES}

        # Heuristic scoring based on acoustic features
        if speaking_rate > 3.5 and pitch_std > 35:
            emotions["anxious"] += 0.3
            emotions["stressed"] += 0.2
            emotions["excited"] += 0.1
        elif speaking_rate < 2.0 and energy_mean < 0.12:
            emotions["tired"] += 0.3
            emotions["sad"] += 0.2
            emotions["calm"] += 0.1
        elif 2.0 <= speaking_rate <= 3.0 and pitch_std < 25:
            emotions["calm"] += 0.3
            emotions["neutral"] += 0.2
        else:
            emotions["neutral"] += 0.3

        # Normalize
        total = sum(emotions.values())
        emotions = {k: v / total for k, v in emotions.items()}

        primary_emotion = max(emotions.items(), key=lambda x: x[1])[0]

        # Estimate VAD from acoustic features
        vad = self._estimate_vad_from_acoustic(acoustic_features)

        return {
            "emotions": emotions,
            "primary_emotion": primary_emotion,
            "confidence": 0.5,  # Lower confidence for acoustic-only
            "vad": vad,
            "reasoning": "Fallback classification using acoustic features only (GPT-4 unavailable)."
        }

    def _estimate_vad_from_acoustic(self, acoustic_features: Dict[str, Any]) -> Dict[str, float]:
        """Estimate VAD scores from acoustic features"""
        prosody = acoustic_features.get("prosody", {})
        pitch = acoustic_features.get("pitch", {})
        energy = acoustic_features.get("energy", {})

        speaking_rate = prosody.get("speaking_rate", 2.5)
        pitch_mean = pitch.get("f0_mean", 150)
        energy_mean = energy.get("rms_mean", 0.15)

        # Valence: Higher pitch and moderate energy suggest positivity
        valence = (pitch_mean - 150) / 100  # Normalize around 150Hz
        valence = max(-1.0, min(1.0, valence))

        # Arousal: Speaking rate and energy indicate activation
        arousal = (speaking_rate / 5.0) + (energy_mean / 0.3)
        arousal = max(0.0, min(1.0, arousal / 2))

        # Dominance: Moderate arousal and energy suggest control
        dominance = 0.5 + (0.2 if 2.0 <= speaking_rate <= 3.5 else -0.2)
        dominance = max(0.0, min(1.0, dominance))

        return {
            "valence": valence,
            "arousal": arousal,
            "dominance": dominance
        }

    def classify_from_acoustic_only(self, acoustic_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Public method: Classify emotions using only acoustic features (no transcription)

        Optimized for real-time streaming where transcription adds too much latency.
        Uses heuristic-based classification from prosody, pitch, energy, and speaking rate.

        Args:
            acoustic_features: Acoustic features extracted from audio

        Returns:
            Dictionary with emotion scores, primary emotion, VAD, and confidence
        """
        return self._classify_from_acoustic_only(acoustic_features)


# Create singleton instance
emotion_classifier = EmotionClassifier()
