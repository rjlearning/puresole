# PureSoul ML Service

Machine Learning microservice for voice-based emotion detection and mental health analysis.

## Overview

This FastAPI-based service provides:
- **Voice emotion classification** (happy, sad, anxious, stressed, calm, etc.)
- **Speech transcription** using OpenAI Whisper API
- **Acoustic feature extraction** (MFCCs, pitch, energy, speaking rate)
- **Sentiment analysis** on transcribed text
- **Wellness score computation** based on vocal patterns
- **Crisis keyword detection** for safety monitoring
- **Real-time emotion tracking** via WebSocket

## Architecture

```
┌─────────────────┐
│  Express API    │
│  (Node.js)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  FastAPI ML     │
│  Service        │
│  (Python)       │
└────────┬────────┘
         │
    ┌────┴────┬─────────────┐
    ▼         ▼             ▼
┌────────┐ ┌────────┐  ┌────────┐
│librosa │ │Whisper │  │TF/Keras│
│(Audio) │ │(Speech)│  │(Models)│
└────────┘ └────────┘  └────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd ml-service

# For minimal setup (recommended for testing):
pip3 install -r requirements-minimal.txt

# OR for full ML setup with all models:
pip3 install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (required for transcription)
```

### 3. Run the Service

**Development mode (recommended):**
```bash
python3 run.py
```

**Alternative - run as module:**
```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Docker:**
```bash
docker build -t puresoul-ml-service .
docker run -p 8000:8000 --env-file .env puresoul-ml-service
```

### 4. Test the Service

```bash
# Health check
curl http://localhost:8000/health

# Analyze audio
curl -X POST http://localhost:8000/analyze \
  -F "audio_file=@sample.wav" \
  -F "user_id=test-user" \
  -F "analysis_id=test-123"
```

## API Endpoints

### Analysis

- `POST /analyze` - Analyze audio file
  - Form data: `audio_file`, `user_id`, `analysis_id`
  - Returns: Comprehensive analysis results

- `GET /analyze/status/{analysis_id}` - Check analysis status
  - Returns: Current status and progress

### Transcription

- `POST /transcribe` - Transcribe audio to text
  - Form data: `audio_file`
  - Returns: Transcript with confidence score

### Real-Time

- `WS /realtime/emotion` - WebSocket for live emotion detection
  - Streams emotion updates as audio is received

### System

- `GET /health` - Health check
- `GET /models/info` - Loaded models information

## Development Phases

### Phase I: Foundation & Infrastructure (✅ COMPLETE)
- [x] Basic FastAPI structure
- [x] Audio upload endpoint
- [x] Whisper API integration for transcription
- [x] Configuration management
- [x] Health check and status endpoints
- [ ] Basic acoustic feature extraction (Phase II)
- [ ] Simple emotion classification (Phase II)

### Phase II: Enhanced Analysis
- [ ] Advanced MFCC extraction with librosa
- [ ] Pitch, energy, and prosody analysis
- [ ] Sentiment analysis on transcripts
- [ ] Stress indicator detection
- [ ] Custom-trained emotion classifier

### Phase III: Real-Time
- [ ] WebSocket streaming
- [ ] Sliding-window emotion detection
- [ ] Low-latency inference (<500ms)
- [ ] ONNX optimization

### Phase IV: Production
- [ ] Redis job queue integration
- [ ] Model versioning
- [ ] Prometheus metrics
- [ ] Rate limiting
- [ ] Horizontal scaling

## Machine Learning Models

### Emotion Classifier
- **Type:** LSTM or CNN
- **Input:** MFCC features (13 coefficients x time frames)
- **Output:** 11 emotion classes
- **Training:** RAVDESS, IEMOCAP datasets
- **Target Accuracy:** >75%

### Sentiment Analyzer
- **Model:** distilbert-base-uncased-finetuned-sst-2-english
- **Input:** Transcribed text
- **Output:** Sentiment score (-1 to 1)

## Feature Extraction

### Acoustic Features
- **MFCCs:** 13 coefficients, delta, delta-delta
- **Pitch:** F0 contour, pitch variance
- **Energy:** RMS energy, zero-crossing rate
- **Prosody:** Speaking rate, pause ratio
- **Voice Quality:** Jitter, shimmer

### Linguistic Features
- **Sentiment:** Positive/negative word counts
- **Complexity:** Lexical diversity, avg word length
- **Psychological:** First-person pronouns, uncertainty markers
- **Emotion Words:** Affective lexicon matching

## Configuration

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ML_SERVICE_PORT` | Service port | 8000 |
| `OPENAI_API_KEY` | Whisper API key | Required |
| `REDIS_HOST` | Redis host for queue | localhost |
| `SAMPLE_RATE` | Audio sample rate | 16000 Hz |
| `MAX_AUDIO_FILE_SIZE_MB` | Max upload size | 50 MB |

## Testing

```bash
# Run unit tests
pytest tests/

# Test with sample audio
python scripts/test_analysis.py --audio sample.wav

# Load test
locust -f tests/load_test.py --host http://localhost:8000
```

## Deployment

### Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Cloud Deployment

**AWS:**
- Deploy on EC2 with GPU (p3.2xlarge for production)
- Or use ECS/Fargate for container orchestration

**GCP:**
- Deploy on Compute Engine with GPU
- Or use Cloud Run for serverless

**Azure:**
- Deploy on Container Instances
- Or use AKS for Kubernetes orchestration

## Performance Optimization

- Use ONNX Runtime for 2-3x faster inference
- Enable GPU acceleration for TensorFlow models
- Implement request batching for high throughput
- Cache feature extraction results in Redis
- Use Whisper API (not local model) for transcription

## Security

- API key authentication
- Rate limiting per user
- Input validation and sanitization
- Encrypted audio storage
- CORS restrictions
- No storage of raw audio (features only)

## Monitoring

- Health check endpoint for load balancers
- Prometheus metrics (request count, latency, errors)
- Structured logging (JSON format)
- Error tracking with Sentry (optional)

## Troubleshooting

### Common Issues

**Import errors:**
```bash
pip install --upgrade -r requirements.txt
```

**Audio file not supported:**
- Convert to WAV format: `ffmpeg -i input.mp3 output.wav`

**CUDA errors:**
- CPU-only mode: `pip install tensorflow-cpu`

**Memory errors:**
- Reduce batch size or max file size
- Add swap space for large models

## Contributing

1. Create feature branch
2. Add tests for new features
3. Update documentation
4. Submit pull request

## License

MIT License - see LICENSE file

## Support

For issues or questions:
- GitHub Issues: [github.com/yourorg/puresoul](https://github.com/yourorg/puresoul)
- Email: support@puresoul.com
