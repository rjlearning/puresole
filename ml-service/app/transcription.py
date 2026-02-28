"""
OpenAI Whisper API integration for speech-to-text transcription
"""
import os
import time
import logging
from typing import Optional, Dict, Any
from pathlib import Path

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from .config import config

logger = logging.getLogger(__name__)


class WhisperTranscriber:
    """OpenAI Whisper API transcription service"""

    def __init__(self):
        """Initialize Whisper transcriber"""
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI library not installed. Install with: pip install openai")
            self.client = None
            return

        if not config.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. Transcription will not be available.")
            self.client = None
            return

        try:
            self.client = OpenAI(api_key=config.OPENAI_API_KEY)
            logger.info("✅ Whisper transcriber initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Check if transcription is available"""
        return self.client is not None

    async def transcribe(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        temperature: float = 0.0,
        response_format: str = "verbose_json"
    ) -> Dict[str, Any]:
        """
        Transcribe audio file using OpenAI Whisper API

        Args:
            audio_file_path: Path to audio file
            language: ISO-639-1 language code (None for auto-detect)
            prompt: Optional prompt to guide transcription
            temperature: Sampling temperature (0-1)
            response_format: Response format (json, text, srt, verbose_json, vtt)

        Returns:
            Dictionary with transcription results:
            {
                "text": str,
                "language": str,
                "duration": float,
                "confidence": float (if available),
                "segments": list (if verbose_json),
                "words": list (if verbose_json with word timestamps)
            }

        Raises:
            Exception: If transcription fails
        """
        if not self.is_available():
            raise Exception("Whisper transcription not available. Check OPENAI_API_KEY.")

        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")

        # Check file size
        file_size_mb = os.path.getsize(audio_file_path) / (1024 * 1024)
        if file_size_mb > config.MAX_AUDIO_FILE_SIZE_MB:
            raise ValueError(f"Audio file too large: {file_size_mb:.1f}MB (max: {config.MAX_AUDIO_FILE_SIZE_MB}MB)")

        logger.info(f"Transcribing audio file: {audio_file_path} ({file_size_mb:.2f}MB)")

        start_time = time.time()

        try:
            # Open audio file
            with open(audio_file_path, "rb") as audio_file:
                # Call Whisper API
                response = self.client.audio.transcriptions.create(
                    model=config.WHISPER_MODEL,
                    file=audio_file,
                    language=language or config.WHISPER_LANGUAGE,
                    prompt=prompt,
                    temperature=temperature,
                    response_format=response_format
                )

            duration = time.time() - start_time
            logger.info(f"✅ Transcription completed in {duration:.2f}s")

            # Parse response based on format
            if response_format == "verbose_json":
                result = {
                    "text": response.text,
                    "language": response.language,
                    "duration": response.duration,
                    "segments": response.segments if hasattr(response, "segments") else [],
                }

                # Calculate average confidence from segments
                if hasattr(response, "segments") and response.segments:
                    confidences = []
                    for segment in response.segments:
                        if hasattr(segment, "avg_logprob"):
                            # Convert log probability to confidence (0-1)
                            # Whisper returns avg_logprob typically between -2 and 0
                            confidence = max(0.0, min(1.0, (segment.avg_logprob + 2) / 2))
                            confidences.append(confidence)

                    if confidences:
                        result["confidence"] = sum(confidences) / len(confidences)
                    else:
                        result["confidence"] = None
                else:
                    result["confidence"] = None

                # Include word-level timestamps if available
                if hasattr(response, "words") and response.words:
                    result["words"] = response.words

            else:
                # For simple text response
                result = {
                    "text": response if isinstance(response, str) else response.text,
                    "language": getattr(response, "language", "unknown"),
                    "duration": duration,
                    "confidence": None,
                }

            # Add metadata
            result["transcription_time"] = duration
            result["file_size_mb"] = file_size_mb
            result["model"] = config.WHISPER_MODEL

            return result

        except Exception as e:
            logger.error(f"❌ Transcription failed: {str(e)}")
            raise Exception(f"Whisper transcription failed: {str(e)}")

    async def transcribe_with_retry(
        self,
        audio_file_path: str,
        max_retries: int = 3,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Transcribe with automatic retry on failure

        Args:
            audio_file_path: Path to audio file
            max_retries: Maximum number of retry attempts
            **kwargs: Additional arguments passed to transcribe()

        Returns:
            Transcription result dictionary

        Raises:
            Exception: If all retry attempts fail
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                return await self.transcribe(audio_file_path, **kwargs)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    logger.warning(f"Transcription attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"All {max_retries} transcription attempts failed")

        raise Exception(f"Transcription failed after {max_retries} attempts: {last_error}")

    def detect_language(self, transcript: str) -> str:
        """
        Detect language from transcript text

        Args:
            transcript: Transcribed text

        Returns:
            ISO-639-1 language code
        """
        # Simple heuristic-based language detection
        # In production, use a proper language detection library like langdetect

        if not transcript or len(transcript.strip()) < 10:
            return "unknown"

        # Very basic detection (can be enhanced with langdetect or similar)
        # For now, just return the language from the transcription if available
        return "en"  # Default to English

    def calculate_confidence_score(self, segments: list) -> float:
        """
        Calculate overall confidence score from segments

        Args:
            segments: List of segment dictionaries with confidence scores

        Returns:
            Average confidence (0.0 to 1.0)
        """
        if not segments:
            return 0.0

        confidences = []
        for segment in segments:
            if "confidence" in segment and segment["confidence"] is not None:
                confidences.append(segment["confidence"])
            elif "avg_logprob" in segment:
                # Convert log probability to confidence
                confidence = max(0.0, min(1.0, (segment["avg_logprob"] + 2) / 2))
                confidences.append(confidence)

        if not confidences:
            return 0.0

        return sum(confidences) / len(confidences)

    def extract_keywords(self, transcript: str, top_n: int = 10) -> list[str]:
        """
        Extract important keywords from transcript

        Args:
            transcript: Transcribed text
            top_n: Number of top keywords to return

        Returns:
            List of keywords
        """
        # Simple keyword extraction (can be enhanced with NLTK, spaCy, or YAKE)
        if not transcript:
            return []

        # Remove common stop words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
            "be", "have", "has", "had", "do", "does", "did", "will", "would",
            "could", "should", "may", "might", "can", "i", "you", "he", "she",
            "it", "we", "they", "my", "your", "his", "her", "its", "our", "their"
        }

        # Tokenize and count
        words = transcript.lower().split()
        word_freq = {}

        for word in words:
            # Clean word
            word = word.strip(".,!?;:\"'()[]{}").strip()
            if len(word) > 2 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Sort by frequency and return top N
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:top_n]]


# Create singleton instance
transcriber = WhisperTranscriber()
