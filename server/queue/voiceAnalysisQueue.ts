import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';

/**
 * Voice Analysis Job Queue
 *
 * Handles asynchronous processing of voice recordings for emotion detection
 * and mental health analysis using the Python ML service.
 */

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for Bull
  enableReadyCheck: false,
};

// Create Redis clients for Bull (it needs separate clients)
const createRedisClient = () => new Redis(redisConfig);

// Initialize the voice analysis queue
export const voiceAnalysisQueue: Queue = new Bull('voice-analysis', {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return createRedisClient();
      case 'subscriber':
        return createRedisClient();
      case 'bclient':
        return createRedisClient();
      default:
        return createRedisClient();
    }
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay, then exponential backoff
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs for debugging
  },
});

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
