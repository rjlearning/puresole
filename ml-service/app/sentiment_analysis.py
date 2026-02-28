"""
Sentiment Analysis and Linguistic Feature Extraction for Voice Analysis
Analyzes transcript for sentiment, psychological patterns, and crisis indicators
"""
import re
import logging
from typing import Dict, Any, List, Optional

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from .config import config

logger = logging.getLogger(__name__)


# Crisis keyword severity levels
CRISIS_KEYWORDS = {
    "critical": ["suicide", "kill", "harm myself", "harm myself", "self-harm", "death wish", "end it all", "better off dead"],
    "high": ["hopeless", "worthless", "can't go on", "can't continue", "end it", "give up", "no point"],
    "medium": ["severely depressed", "emergency", "crisis", "suicidal thoughts", "self injury"],
    "low": ["overwhelmed", "struggling", "can't cope", "falling apart", "breaking down"]
}

# Psychological linguistic patterns
FIRST_PERSON_PRONOUNS = ["i", "me", "my", "mine", "myself"]
ABSOLUTIST_WORDS = ["always", "never", "must", "should", "have to", "can't", "won't", "will never"]
NEGATIONS = ["not", "no", "don't", "doesn't", "didn't", "can't", "won't", "shouldn't"]


class SentimentAnalyzer:
    """
    Analyzes transcripts for sentiment, linguistic patterns, and crisis indicators
    """

    def __init__(self):
        """Initialize sentiment analyzer"""
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI library not installed. Install with: pip install openai")
            self.client = None
            return

        if not config.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. Sentiment analysis will not be available.")
            self.client = None
            return

        try:
            self.client = OpenAI(api_key=config.OPENAI_API_KEY)
            logger.info("✅ Sentiment analyzer initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Check if sentiment analysis is available"""
        return self.client is not None

    async def analyze_sentiment(self, transcript: str) -> Dict[str, Any]:
        """
        Analyze transcript for sentiment, linguistic patterns, and crisis indicators

        Args:
            transcript: Transcribed text from voice entry

        Returns:
            Dictionary with:
            - sentiment_score: float (-1 to 1)
            - linguistic_features: dict with counts and statistics
            - crisis_keywords: list of detected keywords
            - risk_severity: str (critical/high/medium/low/none)
            - confidence: float (0-1)

        Raises:
            Exception: If analysis fails
        """
        if not transcript or len(transcript.strip()) < 3:
            logger.warning("Transcript too short for sentiment analysis")
            return self._create_empty_result()

        try:
            # Extract linguistic features (synchronous, local analysis)
            linguistic_features = self._extract_linguistic_features(transcript)

            # Detect crisis keywords
            crisis_keywords, risk_severity = self._detect_crisis_keywords(transcript)

            # Analyze sentiment using GPT-4 if available
            if self.is_available():
                sentiment_score = await self._analyze_sentiment_with_gpt4(transcript)
                confidence = 0.85
            else:
                # Fallback: estimate from keywords and linguistic features
                sentiment_score = self._estimate_sentiment_from_features(linguistic_features, risk_severity)
                confidence = 0.65

            return {
                "sentiment_score": sentiment_score,
                "linguistic_features": linguistic_features,
                "crisis_keywords": crisis_keywords,
                "risk_severity": risk_severity,
                "confidence": confidence
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            # Return fallback result
            return self._create_fallback_result(transcript)

    async def _analyze_sentiment_with_gpt4(self, transcript: str) -> float:
        """
        Analyze sentiment using GPT-4 API

        Returns sentiment score from -1 (very negative) to 1 (very positive)
        """
        try:
            system_prompt = """You are a sentiment analysis system for mental wellness.
Analyze voice entry transcripts for emotional valence on a scale from -1 (very negative) to 1 (very positive).
Consider word choice, tone indicators, and emotional content.
Return JSON with a single field: {"sentiment_score": <number between -1 and 1>}"""

            user_prompt = f"""Analyze the sentiment of this voice entry transcript:

{transcript}

Return the sentiment score as a JSON object."""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)
            sentiment_score = float(result.get("sentiment_score", 0.0))

            # Clamp to valid range
            return max(-1.0, min(1.0, sentiment_score))

        except Exception as e:
            logger.error(f"GPT-4 sentiment analysis failed: {e}")
            return 0.0  # Neutral fallback

    def _extract_linguistic_features(self, transcript: str) -> Dict[str, Any]:
        """
        Extract psychological linguistic features from transcript

        Returns:
            Dictionary with feature counts and statistics
        """
        text_lower = transcript.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        sentences = re.split(r'[.!?]+', transcript)
        sentences = [s.strip() for s in sentences if s.strip()]

        # Count first-person pronouns
        first_person_count = sum(1 for word in words if word in FIRST_PERSON_PRONOUNS)

        # Count absolutist language
        absolutist_count = sum(1 for word in words if word in ABSOLUTIST_WORDS)

        # Count negations
        negation_count = sum(1 for word in words if word in NEGATIONS)

        # Count questions
        question_count = len([s for s in sentences if s.strip().endswith('?')])

        # Calculate average sentence length
        avg_sentence_length = len(words) / len(sentences) if sentences else 0

        # Vocabulary diversity (unique words / total words)
        vocabulary_diversity = len(set(words)) / len(words) if words else 0

        return {
            "first_person_pronouns": first_person_count,
            "absolutist_words": absolutist_count,
            "negations": negation_count,
            "questions": question_count,
            "avg_sentence_length": round(avg_sentence_length, 2),
            "vocabulary_diversity": round(vocabulary_diversity, 2),
            "total_words": len(words),
            "total_sentences": len(sentences)
        }

    def _detect_crisis_keywords(self, transcript: str) -> tuple[List[str], str]:
        """
        Detect crisis keywords and determine risk severity

        Returns:
            Tuple of (detected_keywords, risk_severity)
            risk_severity: "critical", "high", "medium", "low", or "none"
        """
        text_lower = transcript.lower()
        detected_keywords = []
        max_severity = "none"
        severity_levels = ["none", "low", "medium", "high", "critical"]

        # Check each severity level
        for severity in ["critical", "high", "medium", "low"]:
            keywords = CRISIS_KEYWORDS.get(severity, [])
            for keyword in keywords:
                # Use word boundary matching for more accurate detection
                if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                    detected_keywords.append(keyword)
                    # Update max severity if this is more severe
                    if severity_levels.index(severity) > severity_levels.index(max_severity):
                        max_severity = severity

        return detected_keywords, max_severity

    def _estimate_sentiment_from_features(
        self,
        linguistic_features: Dict[str, Any],
        risk_severity: str
    ) -> float:
        """
        Estimate sentiment score from linguistic features
        Used when GPT-4 is unavailable
        """
        # Start with neutral
        sentiment = 0.0

        # Risk severity heavily impacts sentiment negatively
        severity_impact = {
            "critical": -0.9,
            "high": -0.7,
            "medium": -0.4,
            "low": -0.2,
            "none": 0.0
        }
        sentiment += severity_impact.get(risk_severity, 0.0)

        # High first-person focus suggests rumination (negative)
        first_person = linguistic_features.get("first_person_pronouns", 0)
        total_words = linguistic_features.get("total_words", 1)
        first_person_ratio = first_person / total_words if total_words > 0 else 0
        if first_person_ratio > 0.15:  # More than 15% first-person
            sentiment -= 0.15

        # Absolutist language suggests rigidity (negative)
        absolutist = linguistic_features.get("absolutist_words", 0)
        if absolutist > 3:
            sentiment -= min(0.2, absolutist * 0.05)

        # Questions suggest uncertainty (slightly negative)
        questions = linguistic_features.get("questions", 0)
        if questions > 3:
            sentiment -= 0.1

        # Higher vocabulary diversity suggests better emotional expression (positive)
        diversity = linguistic_features.get("vocabulary_diversity", 0)
        if diversity > 0.6:
            sentiment += 0.15

        # Clamp to valid range
        return max(-1.0, min(1.0, sentiment))

    def _create_empty_result(self) -> Dict[str, Any]:
        """Create result for empty/invalid transcript"""
        return {
            "sentiment_score": 0.0,
            "linguistic_features": {
                "first_person_pronouns": 0,
                "absolutist_words": 0,
                "negations": 0,
                "questions": 0,
                "avg_sentence_length": 0.0,
                "vocabulary_diversity": 0.0,
                "total_words": 0,
                "total_sentences": 0
            },
            "crisis_keywords": [],
            "risk_severity": "none",
            "confidence": 0.0
        }

    def _create_fallback_result(self, transcript: str) -> Dict[str, Any]:
        """Create fallback result with local analysis only"""
        linguistic_features = self._extract_linguistic_features(transcript)
        crisis_keywords, risk_severity = self._detect_crisis_keywords(transcript)
        sentiment_score = self._estimate_sentiment_from_features(linguistic_features, risk_severity)

        return {
            "sentiment_score": sentiment_score,
            "linguistic_features": linguistic_features,
            "crisis_keywords": crisis_keywords,
            "risk_severity": risk_severity,
            "confidence": 0.6
        }


# Create singleton instance
sentiment_analyzer = SentimentAnalyzer()
