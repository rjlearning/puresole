"""
PureSoul Voice Analysis ML Service
FastAPI microservice for voice emotion detection and mental health analysis
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging
import os
import tempfile
import shutil
import time
from pathlib import Path

from .config import config
from .transcription import transcriber
from .acoustic_features import extract_acoustic_features
from .emotion_classification import emotion_classifier
from .sentiment_analysis import sentiment_analyzer
from .wellness_scoring import calculate_wellness_score, extract_stress_indicators

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PureSoul Voice Analysis API",
    description="ML service for voice-based emotion detection and mental health analysis",
    version="1.0.0"
)

# CORS configuration - should match your Express server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5000",
        "https://puresoul.com",  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class AnalysisRequest(BaseModel):
    audio_file_path: str
    user_id: str
    analysis_id: str
    options: Optional[Dict] = {}

class AnalysisResult(BaseModel):
    analysis_id: str
    status: str
    primary_emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None
    emotion_scores: Optional[Dict[str, float]] = {}
    valence: Optional[float] = None
    arousal: Optional[float] = None
    dominance: Optional[float] = None
    wellness_score: Optional[float] = None
    risk_level: Optional[str] = None
    transcript: Optional[str] = None
    acoustic_features: Optional[Dict] = {}
    linguistic_features: Optional[Dict] = {}
    stress_indicators: Optional[Dict] = {}
    crisis_keywords: Optional[List[str]] = []
    processing_time_ms: Optional[float] = None
    error: Optional[str] = None

class RealtimeEmotionUpdate(BaseModel):
    timestamp: str
    emotion: str
    confidence: float
    valence: float
    arousal: float

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "service": "puresoul-ml-voice-analysis",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "PureSoul Voice Analysis ML Service",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check",
            "/analyze": "Analyze audio file (POST)",
            "/analyze/status/{analysis_id}": "Check analysis status (GET)",
            "/realtime/emotion": "Real-time emotion detection (WebSocket)",
            "/models/info": "Get loaded models information"
        }
    }

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_audio(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    user_id: str = None,
    analysis_id: str = None
):
    """
    Analyze uploaded audio file for emotion and mental health indicators

    This endpoint:
    1. Receives audio file
    2. Extracts acoustic features (MFCCs, pitch, energy, etc.)
    3. Transcribes speech using Whisper
    4. Performs emotion classification
    5. Analyzes linguistic patterns
    6. Computes wellness score and risk level
    7. Returns comprehensive analysis results
    """
    temp_file_path = None
    start_time = time.time()

    try:
        logger.info(f"Received analysis request: user_id={user_id}, analysis_id={analysis_id}")

        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {audio_file.content_type}. Expected audio file."
            )

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(audio_file.file, temp_file)

        logger.info(f"File saved: {audio_file.filename} ({audio_file.content_type})")

        # 1. Extract acoustic features
        logger.info("Extracting acoustic features...")
        acoustic_features = extract_acoustic_features(temp_file_path)
        logger.info(f"✅ Acoustic features extracted")

        # 2. Transcribe audio
        logger.info("Transcribing audio...")
        transcript_result = await transcriber.transcribe_with_retry(temp_file_path)
        transcript = transcript_result.get("text", "")
        logger.info(f"✅ Transcription complete: {len(transcript)} characters")

        # 3. Classify emotions
        logger.info("Classifying emotions...")
        emotion_result = await emotion_classifier.classify_emotions(
            transcript=transcript,
            acoustic_features=acoustic_features
        )
        logger.info(f"✅ Emotion classification complete: {emotion_result.get('primary_emotion')}")

        # 4. Analyze sentiment
        logger.info("Analyzing sentiment...")
        sentiment_result = await sentiment_analyzer.analyze_sentiment(transcript)
        logger.info(f"✅ Sentiment analysis complete: {sentiment_result.get('risk_severity')}")

        # 5. Calculate wellness score
        logger.info("Calculating wellness score...")
        wellness_result = calculate_wellness_score(
            emotion_result,
            sentiment_result,
            acoustic_features
        )
        logger.info(f"✅ Wellness score: {wellness_result.get('score')}, Risk: {wellness_result.get('risk_level')}")

        # 6. Extract stress indicators
        stress_indicators = extract_stress_indicators(acoustic_features)

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        # 7. Build and return comprehensive result
        result = AnalysisResult(
            analysis_id=analysis_id or "test-analysis-id",
            status="completed",
            primary_emotion=emotion_result.get("primary_emotion"),
            emotion_confidence=emotion_result.get("confidence"),
            emotion_scores=emotion_result.get("emotions", {}),
            valence=emotion_result.get("vad", {}).get("valence"),
            arousal=emotion_result.get("vad", {}).get("arousal"),
            dominance=emotion_result.get("vad", {}).get("dominance"),
            wellness_score=wellness_result.get("score"),
            risk_level=wellness_result.get("risk_level"),
            transcript=transcript,
            acoustic_features=acoustic_features,
            linguistic_features=sentiment_result.get("linguistic_features", {}),
            stress_indicators=stress_indicators,
            crisis_keywords=sentiment_result.get("crisis_keywords", []),
            processing_time_ms=processing_time_ms
        )

        logger.info(f"✅ Analysis completed successfully for {analysis_id} in {processing_time_ms:.0f}ms")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing audio: {str(e)}")
        processing_time_ms = (time.time() - start_time) * 1000

        # Return partial result with error information
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")

@app.get("/analyze/status/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """
    Get the status of an ongoing or completed analysis
    """
    # TODO: Implement status tracking with Redis
    return {
        "analysis_id": analysis_id,
        "status": "completed",
        "progress": 100,
        "message": "Analysis completed successfully"
    }

@app.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: Optional[str] = None,
    prompt: Optional[str] = None
):
    """
    Transcribe audio to text using OpenAI Whisper API

    Args:
        audio_file: Audio file to transcribe
        language: Optional ISO-639-1 language code (e.g., 'en', 'es', 'fr')
        prompt: Optional prompt to guide transcription

    Returns:
        Transcription result with text, language, confidence, etc.
    """
    temp_file_path = None

    try:
        # Check if transcriber is available
        if not transcriber.is_available():
            raise HTTPException(
                status_code=503,
                detail="Transcription service unavailable. Check OPENAI_API_KEY configuration."
            )

        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {audio_file.content_type}. Expected audio file."
            )

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(audio_file.file, temp_file)

        logger.info(f"Transcribing file: {audio_file.filename} ({audio_file.content_type})")

        # Transcribe using Whisper
        result = await transcriber.transcribe_with_retry(
            audio_file_path=temp_file_path,
            language=language,
            prompt=prompt,
            response_format="verbose_json",
            max_retries=3
        )

        logger.info(f"✅ Transcription successful: {len(result.get('text', ''))} characters")

        return {
            "transcript": result["text"],
            "confidence": result.get("confidence"),
            "language": result.get("language", "unknown"),
            "duration_seconds": result.get("duration"),
            "transcription_time_seconds": result.get("transcription_time"),
            "segments": result.get("segments", []),
            "words": result.get("words", []),
            "model": result.get("model", config.WHISPER_MODEL),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")

@app.post("/analyze-chunk")
async def analyze_audio_chunk(
    audio_file: UploadFile = File(...),
    metadata: Optional[str] = None
):
    """
    Real-time audio chunk analysis optimized for low latency (<200ms)

    This lightweight endpoint is designed for streaming audio analysis:
    - Skips transcription to save time (transcription adds ~1-2s)
    - Focuses on acoustic features only
    - Returns emotion classification based on prosody, pitch, energy
    - Targets <200ms processing time for real-time feedback

    Use case: WebSocket-based real-time emotion detection during recording
    """
    temp_file_path = None
    start_time = time.time()

    try:
        logger.info(f"[Streaming] Received chunk analysis request")

        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {audio_file.content_type}. Expected audio file."
            )

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(audio_file.file, temp_file)

        # STEP 1: Extract acoustic features (FAST - ~50-100ms)
        logger.info("[Streaming] Extracting acoustic features...")
        acoustic_features = extract_acoustic_features(temp_file_path)

        # STEP 2: Classify emotions based on acoustic features ONLY (FAST - ~50-100ms)
        # Skip transcription for speed in streaming mode
        logger.info("[Streaming] Classifying emotions from acoustic features...")

        # For real-time streaming, use acoustic-only emotion detection
        # Derive emotional state from pitch, energy, speaking rate
        emotion_result = emotion_classifier.classify_from_acoustic_only(acoustic_features)

        # STEP 3: Extract stress indicators for crisis detection
        stress_indicators = extract_stress_indicators(acoustic_features)

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        # Build lightweight result for streaming
        result = {
            "timestamp": time.time(),
            "primary_emotion": emotion_result.get("primary_emotion", "neutral"),
            "emotion_confidence": emotion_result.get("confidence", 0.5),
            "emotion_scores": emotion_result.get("emotions", {}),
            "valence": emotion_result.get("vad", {}).get("valence", 0),
            "arousal": emotion_result.get("vad", {}).get("arousal", 0.5),
            "dominance": emotion_result.get("vad", {}).get("dominance", 0.5),
            "processing_time_ms": processing_time_ms,
            "stress_level": stress_indicators.get("overall_stress", 0),
            "crisis_indicators": stress_indicators.get("crisis_indicators", [])
        }

        logger.info(f"[Streaming] ✅ Chunk analysis completed in {processing_time_ms:.0f}ms")

        # Log warning if latency exceeds target
        if processing_time_ms > 200:
            logger.warning(f"[Streaming] ⚠️  Latency exceeded target: {processing_time_ms:.0f}ms > 200ms")

        return result

    except HTTPException:
        raise
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        logger.error(f"[Streaming] Error analyzing chunk: {str(e)} (after {processing_time_ms:.0f}ms)")

        # Return degraded result to keep streaming alive
        return {
            "timestamp": time.time(),
            "primary_emotion": "neutral",
            "emotion_confidence": 0.3,
            "emotion_scores": {"neutral": 1.0},
            "valence": 0,
            "arousal": 0.3,
            "dominance": 0.5,
            "processing_time_ms": processing_time_ms,
            "error": str(e),
            "status": "degraded"
        }

    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")

@app.get("/models/info")
async def get_models_info():
    """
    Get information about loaded ML models and services
    """
    return {
        "transcription": {
            "status": "ready" if transcriber.is_available() else "unavailable",
            "service": "OpenAI Whisper API",
            "model": config.WHISPER_MODEL,
            "has_api_key": bool(config.OPENAI_API_KEY)
        },
        "emotion_classifier": {
            "status": "not_loaded",
            "model_type": "LSTM",
            "version": "1.0.0",
            "accuracy": 0.78,
            "note": "Will be implemented in Phase II"
        },
        "sentiment_analyzer": {
            "status": "not_loaded",
            "model_type": "DistilBERT",
            "version": "1.0.0",
            "note": "Will be implemented in Phase II"
        },
        "feature_extractor": {
            "status": "not_loaded",
            "library": "librosa",
            "note": "Will be implemented in Phase II"
        },
        "config": config.summary()
    }

@app.on_event("startup")
async def startup_event():
    """
    Initialize models and resources on startup
    """
    logger.info("🚀 Starting PureSoul ML Service...")
    logger.info(f"Environment: {config.ENVIRONMENT}")
    logger.info(f"Version: {config.MODEL_VERSION}")

    # Validate configuration
    config_errors = config.validate()
    if config_errors:
        logger.warning("⚠️  Configuration warnings:")
        for error in config_errors:
            logger.warning(f"  - {error}")

    # Check service availability
    logger.info("\nService Status:")
    logger.info(f"  Transcription (Whisper): {'✅ Ready' if transcriber.is_available() else '❌ Unavailable'}")

    if transcriber.is_available():
        logger.info(f"    Model: {config.WHISPER_MODEL}")
        logger.info(f"    Language: {config.WHISPER_LANGUAGE or 'Auto-detect'}")

    # TODO: Load emotion classification model (Phase II)
    # TODO: Load sentiment analysis model (Phase II)
    # TODO: Initialize feature extractors (Phase II)
    # TODO: Connect to Redis for job queue (Phase III)

    logger.info("\n✅ ML Service ready!")
    logger.info(f"📊 Configuration: {config.summary()}")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown
    """
    logger.info("Shutting down ML Service...")
    # TODO: Cleanup resources

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ML_SERVICE_PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
