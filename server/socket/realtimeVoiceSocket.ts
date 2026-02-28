import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../vite';
import { createAudioChunkProcessor, AudioChunkProcessor } from '../streaming/audioChunkProcessor';
import { getStreamingMLClient } from '../streaming/streamingMLClient';
import { AudioFeatureAnalyzer, AudioFeatures, createAudioFeatureAnalyzer } from '../streaming/audioFeatureAnalyzer';

interface RealtimeSession {
  sessionId: string;
  userId: string;
  startedAt: Date;
  audioChunks: Buffer[];
  emotions: any[];
  lastAnalysisTimestamp: number;
  chunkProcessor: AudioChunkProcessor;
  featureAnalyzer: AudioFeatureAnalyzer;
  latestFeatures: AudioFeatures | null;
}

// Store active sessions in memory
const activeSessions = new Map<string, RealtimeSession>();

/**
 * Ensure the voice_realtime_sessions table exists.
 * Runs on startup so the socket handler never fails due to a missing table.
 */
async function ensureRealtimeSessionsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_realtime_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        status VARCHAR NOT NULL DEFAULT 'active',
        total_chunks_processed INTEGER DEFAULT 0,
        emotions_detected JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    log('[WebSocket] voice_realtime_sessions table verified/created');
  } catch (error) {
    log(`[WebSocket] Warning: Could not verify voice_realtime_sessions table: ${error}`);
  }
}

/**
 * Initialize Socket.io server for real-time voice analysis
 * Namespace: /realtime-voice
 */
export function initializeRealtimeVoiceSocket(httpServer: HTTPServer): SocketIOServer {
  // Ensure the table exists before accepting connections
  ensureRealtimeSessionsTable();

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.APP_DOMAINS || '').split(',').map(d => `https://${d.trim()}`)
        : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000', 'http://127.0.0.1:4000'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Namespace for real-time voice analysis
  const realtimeVoiceNamespace = io.of('/realtime-voice');

  realtimeVoiceNamespace.on('connection', async (socket: Socket) => {
    log(`[WebSocket] Client connected: ${socket.id}`);

    // Extract userId from handshake query or authentication
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      log(`[WebSocket] Connection rejected: No userId provided`);
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    log(`[WebSocket] Authenticated user: ${userId}`);

    // Handle session start
    socket.on('start-session', async (data: { metadata?: any }) => {
      try {
        const sessionId = uuidv4();
        const startedAt = new Date();

        // Create session in database
        await pool.query(`
          INSERT INTO voice_realtime_sessions (
            id, user_id, started_at, status, metadata
          ) VALUES ($1, $2, $3, 'active', $4)
        `, [sessionId, userId, startedAt, JSON.stringify(data.metadata || {})]);

        // Create audio chunk processor for this session
        const chunkProcessor = createAudioChunkProcessor({
          windowSizeMs: 3000,  // 3-second sliding window
          overlapMs: 1000      // 1-second overlap
        });

        // Create audio feature analyzer for fallback emotion detection
        const featureAnalyzer = createAudioFeatureAnalyzer();

        // Store session in memory
        activeSessions.set(socket.id, {
          sessionId,
          userId,
          startedAt,
          audioChunks: [],
          emotions: [],
          lastAnalysisTimestamp: Date.now(),
          chunkProcessor,
          featureAnalyzer,
          latestFeatures: null
        });

        log(`[WebSocket] Session started: ${sessionId} for user ${userId}`);

        socket.emit('session-started', {
          sessionId,
          startedAt,
          message: 'Real-time session initiated successfully'
        });

        // Join room for this session
        socket.join(sessionId);

      } catch (error) {
        log(`[WebSocket] Error starting session: ${error}`);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    // Handle audio chunk streaming
    socket.on('audio-chunk', async (data: { chunk: ArrayBuffer, timestamp: number, audioFeatures?: AudioFeatures }) => {
      try {
        const session = activeSessions.get(socket.id);

        if (!session) {
          // Silently ignore — this is normal during stop (race condition between
          // MediaRecorder's final chunk and end-session). Not an error.
          return;
        }

        // Store audio features from client-side Web Audio API analysis
        if (data.audioFeatures) {
          session.latestFeatures = data.audioFeatures;
        }

        // Convert ArrayBuffer to Buffer
        const audioBuffer = Buffer.from(data.chunk);

        // Add chunk to processor
        session.chunkProcessor.addChunk({
          buffer: audioBuffer,
          timestamp: data.timestamp
        });

        // Store in array for final aggregation
        session.audioChunks.push(audioBuffer);

        // Check if we can process a window
        if (session.chunkProcessor.canProcess()) {
          const timeSinceLastAnalysis = Date.now() - session.lastAnalysisTimestamp;
          const analysisInterval = 3000; // 3 seconds

          if (timeSinceLastAnalysis >= analysisInterval) {
            // Trigger real-time analysis
            await analyzeAudioChunks(socket, session);
            session.lastAnalysisTimestamp = Date.now();
          }
        }

        // Acknowledge receipt
        socket.emit('chunk-received', {
          timestamp: data.timestamp,
          chunkSize: audioBuffer.length
        });

      } catch (error) {
        log(`[WebSocket] Error processing audio chunk: ${error}`);
        socket.emit('error', { message: 'Failed to process audio chunk' });
      }
    });

    // Handle session end
    socket.on('end-session', async () => {
      try {
        const session = activeSessions.get(socket.id);

        if (!session) {
          // Silently ignore — session may have already ended via disconnect
          log('[WebSocket] end-session called but no active session (already cleaned up)');
          return;
        }

        const endedAt = new Date();
        const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

        // Update session in database
        await pool.query(`
          UPDATE voice_realtime_sessions
          SET ended_at = $1,
              status = 'completed',
              duration_seconds = $2,
              total_chunks_processed = $3,
              emotions_detected = $4
          WHERE id = $5
        `, [
          endedAt,
          durationSeconds,
          session.audioChunks.length,
          JSON.stringify(session.emotions),
          session.sessionId
        ]);

        log(`[WebSocket] Session ended: ${session.sessionId}, duration: ${durationSeconds}s`);

        socket.emit('session-ended', {
          sessionId: session.sessionId,
          durationSeconds,
          totalChunks: session.audioChunks.length,
          emotionsDetected: session.emotions.length
        });

        // Clean up session
        socket.leave(session.sessionId);
        activeSessions.delete(socket.id);

      } catch (error) {
        log(`[WebSocket] Error ending session: ${error}`);
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', async (reason) => {
      log(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);

      const session = activeSessions.get(socket.id);
      if (session) {
        // Mark session as interrupted
        try {
          await pool.query(`
            UPDATE voice_realtime_sessions
            SET status = 'interrupted',
                ended_at = NOW()
            WHERE id = $1
          `, [session.sessionId]);

          log(`[WebSocket] Session marked as interrupted: ${session.sessionId}`);
        } catch (error) {
          log(`[WebSocket] Error updating interrupted session: ${error}`);
        }

        activeSessions.delete(socket.id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      log(`[WebSocket] Socket error: ${error}`);
    });
  });

  log('[WebSocket] Real-time voice socket initialized on namespace /realtime-voice');

  return io;
}

/**
 * Analyze accumulated audio chunks and emit real-time emotion updates
 */
async function analyzeAudioChunks(socket: Socket, session: RealtimeSession): Promise<void> {
  let processedSegment = null;

  try {
    // Process audio window
    processedSegment = await session.chunkProcessor.processWindow();

    if (!processedSegment) {
      log(`[WebSocket] No processable window available`);
      return;
    }

    log(`[WebSocket] Processing window: ${processedSegment.durationMs}ms, ${processedSegment.chunks} chunks`);

    // Create FormData for ML service
    const formData = session.chunkProcessor.createFormData(processedSegment.filePath, {
      sessionId: session.sessionId,
      userId: session.userId,
      timestamp: Date.now()
    });

    // Call ML service for real-time analysis
    const mlClient = getStreamingMLClient();
    const analysisResult = await mlClient.analyzeChunkWithRetry(formData);

    // Check if ML returned a degraded result (processingTimeMs === 0 means ML was unavailable)
    // In that case, use client-side audio features for better emotion detection
    const isDegraded = analysisResult.processingTimeMs === 0 && analysisResult.emotion_confidence <= 0.3;

    let emotionUpdate;

    if (isDegraded && session.latestFeatures) {
      // ML service unavailable — use audio feature analysis for meaningful emotions
      const featureResult = session.featureAnalyzer.analyze(session.latestFeatures);

      emotionUpdate = {
        timestamp: featureResult.timestamp,
        primary_emotion: featureResult.primary_emotion,
        emotion_scores: featureResult.emotion_scores,
        emotion_confidence: featureResult.emotion_confidence,
        valence: featureResult.valence,
        arousal: featureResult.arousal,
        dominance: featureResult.dominance,
        processingTime: featureResult.processingTimeMs,
        status: 'feature-based'
      };

      log(`[WebSocket] Feature-based emotion: ${featureResult.primary_emotion} (${(featureResult.emotion_confidence * 100).toFixed(0)}%)`);
    } else {
      // ML service worked — use its result
      emotionUpdate = {
        timestamp: analysisResult.timestamp,
        primary_emotion: analysisResult.primary_emotion,
        emotion_scores: analysisResult.emotion_scores,
        emotion_confidence: analysisResult.emotion_confidence,
        valence: analysisResult.valence,
        arousal: analysisResult.arousal,
        dominance: analysisResult.dominance,
        processingTime: analysisResult.processingTimeMs
      };

      log(`[WebSocket] ML analysis completed in ${analysisResult.processingTimeMs}ms`);
    }

    // Store emotion in session
    session.emotions.push(emotionUpdate);

    // Emit real-time update to client
    socket.emit('emotion-update', emotionUpdate);

    // Check for crisis indicators
    const anxietyScore = emotionUpdate.emotion_scores.anxious || 0;
    const stressScore = emotionUpdate.emotion_scores.stressed || 0;

    if (anxietyScore > 0.5 || stressScore > 0.5) {
      socket.emit('crisis-alert', {
        severity: anxietyScore > 0.7 || stressScore > 0.7 ? 'high' : 'medium',
        message: anxietyScore > stressScore
          ? 'Elevated anxiety detected in voice patterns'
          : 'Elevated stress detected in voice patterns',
        timestamp: Date.now(),
        emotionScores: {
          anxious: anxietyScore,
          stressed: stressScore
        }
      });

      log(`[WebSocket] Crisis alert sent: anxiety=${anxietyScore.toFixed(2)}, stress=${stressScore.toFixed(2)}`);
    }

    log(`[WebSocket] Emotion update sent for session ${session.sessionId}: ${emotionUpdate.primary_emotion}`);

    // Clean up temp file
    await session.chunkProcessor.cleanupFile(processedSegment.filePath);

  } catch (error) {
    log(`[WebSocket] ML service unavailable, using audio feature analysis: ${error}`);

    // Use audio feature analyzer for real emotion estimation when ML is unavailable
    if (session.latestFeatures) {
      const featureResult = session.featureAnalyzer.analyze(session.latestFeatures);

      const emotionUpdate = {
        timestamp: featureResult.timestamp,
        primary_emotion: featureResult.primary_emotion,
        emotion_scores: featureResult.emotion_scores,
        emotion_confidence: featureResult.emotion_confidence,
        valence: featureResult.valence,
        arousal: featureResult.arousal,
        dominance: featureResult.dominance,
        processingTime: featureResult.processingTimeMs,
        status: 'feature-based'
      };

      session.emotions.push(emotionUpdate);
      socket.emit('emotion-update', emotionUpdate);

      // Check for crisis indicators
      const anxietyScore = featureResult.emotion_scores.anxious || 0;
      const stressScore = featureResult.emotion_scores.stressed || 0;

      if (anxietyScore > 0.5 || stressScore > 0.5) {
        socket.emit('crisis-alert', {
          severity: anxietyScore > 0.7 || stressScore > 0.7 ? 'high' : 'medium',
          message: anxietyScore > stressScore
            ? 'Elevated anxiety detected in voice patterns'
            : 'Elevated stress detected in voice patterns',
          timestamp: Date.now(),
          emotionScores: {
            anxious: anxietyScore,
            stressed: stressScore
          }
        });
      }

      log(`[WebSocket] Feature-based emotion: ${featureResult.primary_emotion} (${(featureResult.emotion_confidence * 100).toFixed(0)}%)`);
    } else {
      // No features available — send minimal degraded result
      socket.emit('emotion-update', {
        timestamp: Date.now(),
        primary_emotion: 'neutral',
        emotion_scores: { neutral: 1.0 },
        emotion_confidence: 0.3,
        valence: 0,
        arousal: 0.3,
        dominance: 0.5,
        processingTime: 0,
        status: 'degraded',
        error: 'Analysis temporarily unavailable'
      });
    }

    // Clean up temp file if it exists
    if (processedSegment?.filePath) {
      try {
        await session.chunkProcessor.cleanupFile(processedSegment.filePath);
      } catch (cleanupError) {
        log(`[WebSocket] Error during cleanup: ${cleanupError}`);
      }
    }
  }
}
