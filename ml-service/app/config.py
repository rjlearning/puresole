"""
Configuration management for ML Service
"""
import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    """Service configuration"""

    # Server settings
    ML_SERVICE_PORT: int = int(os.getenv("ML_SERVICE_PORT", "8000"))
    ML_SERVICE_HOST: str = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    WORKERS: int = int(os.getenv("WORKERS", "4"))

    # OpenAI API
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "whisper-1")
    WHISPER_LANGUAGE: Optional[str] = os.getenv("WHISPER_LANGUAGE")  # None = auto-detect
    WHISPER_TEMPERATURE: float = float(os.getenv("WHISPER_TEMPERATURE", "0"))

    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))

    # Audio processing
    SAMPLE_RATE: int = int(os.getenv("SAMPLE_RATE", "16000"))
    MAX_AUDIO_FILE_SIZE_MB: int = int(os.getenv("MAX_AUDIO_FILE_SIZE_MB", "50"))
    MAX_AUDIO_DURATION_SECONDS: int = int(os.getenv("MAX_AUDIO_DURATION_SECONDS", "600"))

    # Feature extraction
    N_MFCC: int = int(os.getenv("N_MFCC", "13"))
    N_FFT: int = int(os.getenv("N_FFT", "2048"))
    HOP_LENGTH: int = int(os.getenv("HOP_LENGTH", "512"))

    # Model settings
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "1.0.0")
    EMOTION_MODEL_PATH: Optional[str] = os.getenv("EMOTION_MODEL_PATH")
    USE_GPU: bool = os.getenv("USE_GPU", "false").lower() == "true"

    # Processing settings
    ENABLE_CACHING: bool = os.getenv("ENABLE_CACHING", "true").lower() == "true"
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))

    # Security
    API_KEY: Optional[str] = os.getenv("ML_SERVICE_API_KEY")
    REQUIRE_API_KEY: bool = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @classmethod
    def validate(cls) -> list[str]:
        """Validate configuration and return list of errors"""
        errors = []

        if not cls.OPENAI_API_KEY:
            errors.append("OPENAI_API_KEY is required for Whisper transcription")

        if cls.REQUIRE_API_KEY and not cls.API_KEY:
            errors.append("ML_SERVICE_API_KEY is required when REQUIRE_API_KEY is true")

        if cls.MAX_AUDIO_FILE_SIZE_MB < 1 or cls.MAX_AUDIO_FILE_SIZE_MB > 500:
            errors.append("MAX_AUDIO_FILE_SIZE_MB must be between 1 and 500")

        if cls.SAMPLE_RATE not in [8000, 16000, 22050, 44100, 48000]:
            errors.append(f"SAMPLE_RATE {cls.SAMPLE_RATE} is not a standard rate")

        return errors

    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production"""
        return cls.ENVIRONMENT.lower() == "production"

    @classmethod
    def summary(cls) -> dict:
        """Get configuration summary (safe for logging)"""
        return {
            "environment": cls.ENVIRONMENT,
            "port": cls.ML_SERVICE_PORT,
            "workers": cls.WORKERS,
            "sample_rate": cls.SAMPLE_RATE,
            "max_file_size_mb": cls.MAX_AUDIO_FILE_SIZE_MB,
            "whisper_model": cls.WHISPER_MODEL,
            "has_openai_key": bool(cls.OPENAI_API_KEY),
            "has_api_key": bool(cls.API_KEY),
            "require_api_key": cls.REQUIRE_API_KEY,
            "use_gpu": cls.USE_GPU,
            "model_version": cls.MODEL_VERSION,
            "redis_host": cls.REDIS_HOST,
            "enable_caching": cls.ENABLE_CACHING,
        }


# Create singleton instance
config = Config()
