import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';

/**
 * Voice Analysis Job Queue
 *
 * Handles asynchronous processing of voice recordings for emotion detection
 * and mental health analysis using the Python ML service.
 */

import { URL } from 'url';

// Extract credentials gracefully
let host = process.env.REDIS_HOST || process.env.REDISHOST || '127.0.0.1';
let port = parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379');
let password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined;

// If a REDIS_URL is provided, safely parse it into credentials
if (process.env.REDIS_URL) {
  try {
    const parsed = new URL(process.env.REDIS_URL);
    host = parsed.hostname;
    port = parseInt(parsed.port || '6379');
    password = parsed.password || undefined;
  } catch (error) {
    console.error("[Redis] Invalid REDIS_URL format, falling back to host/port vars");
  }
}

// Force IPv6 (family: 6) if the host belongs to Railway's private routing network
const forceIPv6 = host.includes('railway.internal');

const bullOptions: Bull.QueueOptions = {
  redis: {
    host,
    port,
    password,
    family: forceIPv6 ? 6 : 0, // Railway's private internal network uses exclusively IPv6 (fd00::).
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  }
};

// Initialize the voice analysis queue
export const voiceAnalysisQueue: Queue = new Bull('voice-analysis', bullOptions);

// Job data interfaces
export interface VoiceAnalysisJobData {
  analysisId: string;
  userId: string;
  audioFilePath: string;
  audioFileSize: number;
  durationSeconds: number;
  options?: {
    enableTranscription?: boolean;
    enableEmotionDetection?: boolean;
    enableWellnessScore?: boolean;
    enableCrisisMonitoring?: boolean;
  };
}

export interface VoiceAnalysisJobResult {
  analysisId: string;
  status: 'completed' | 'failed';
  primaryEmotion?: string;
  emotionConfidence?: number;
  emotionScores?: Record<string, number>;
  valence?: number;
  arousal?: number;
  dominance?: number;
  wellnessScore?: number;
  riskLevel?: string;
  transcript?: string;
  acousticFeatures?: any;
  linguisticFeatures?: any;
  stressIndicators?: any;
  crisisKeywords?: string[];
  processingTimeMs?: number;
  error?: string;
}

/**
 * Add a voice analysis job to the queue
 */
export async function queueVoiceAnalysis(
  data: VoiceAnalysisJobData,
  options?: JobOptions
): Promise<Job<VoiceAnalysisJobData>> {
  const job = await voiceAnalysisQueue.add(data, {
    ...options,
    jobId: data.analysisId, // Use analysisId as job ID for idempotency
    timeout: 300000, // 5 minute timeout per job
  });

  console.log(`🎤 Queued voice analysis job: ${data.analysisId} for user ${data.userId}`);
  return job;
}

/**
 * Get job status by analysis ID
 */
export async function getJobStatus(analysisId: string): Promise<{
  status: string;
  progress: number;
  result?: VoiceAnalysisJobResult;
  error?: string;
}> {
  const job = await voiceAnalysisQueue.getJob(analysisId);

  if (!job) {
    return { status: 'not_found', progress: 0 };
  }

  const state = await job.getState();
  const progress = job.progress();

  if (state === 'completed') {
    return {
      status: 'completed',
      progress: 100,
      result: job.returnvalue,
    };
  }

  if (state === 'failed') {
    return {
      status: 'failed',
      progress: 0,
      error: job.failedReason,
    };
  }

  return {
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
  };
}

/**
 * Cancel a job by analysis ID
 */
export async function cancelJob(analysisId: string): Promise<boolean> {
  const job = await voiceAnalysisQueue.getJob(analysisId);
  if (job) {
    await job.remove();
    console.log(`🚫 Cancelled voice analysis job: ${analysisId}`);
    return true;
  }
  return false;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    voiceAnalysisQueue.getWaitingCount(),
    voiceAnalysisQueue.getActiveCount(),
    voiceAnalysisQueue.getCompletedCount(),
    voiceAnalysisQueue.getFailedCount(),
    voiceAnalysisQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Clean up old jobs
 */
export async function cleanQueue() {
  // Remove completed jobs older than 24 hours
  await voiceAnalysisQueue.clean(24 * 60 * 60 * 1000, 'completed');
  // Remove failed jobs older than 7 days
  await voiceAnalysisQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  console.log('🧹 Queue cleaned');
}

// Queue event listeners
voiceAnalysisQueue.on('completed', (job: Job, result: VoiceAnalysisJobResult) => {
  console.log(`✅ Voice analysis completed: ${job.id}`);
});

voiceAnalysisQueue.on('failed', (job: Job, err: Error) => {
  console.error(`❌ Voice analysis failed: ${job.id}`, err.message);
});

voiceAnalysisQueue.on('stalled', (job: Job) => {
  console.warn(`⚠️ Voice analysis stalled: ${job.id}`);
});

voiceAnalysisQueue.on('error', (error: Error) => {
  console.error('❌ Queue error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down voice analysis queue...');
  await voiceAnalysisQueue.close();
});

export default voiceAnalysisQueue;
