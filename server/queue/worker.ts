import 'dotenv/config';
import { voiceAnalysisQueue } from './voiceAnalysisQueue';
import processVoiceAnalysis from './processors/voiceAnalysisProcessor';

/**
 * Bull Queue Worker
 *
 * Processes jobs from the voice analysis queue
 * Can be run as a separate process for scaling
 */

const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '2');

console.log(`🚀 Starting voice analysis worker (concurrency: ${CONCURRENCY})...`);

// Register processor
voiceAnalysisQueue.process(CONCURRENCY, processVoiceAnalysis);

// Worker event listeners
voiceAnalysisQueue.on('global:completed', (jobId: string) => {
  console.log(`✅ Job ${jobId} completed globally`);
});

voiceAnalysisQueue.on('global:failed', (jobId: string, err: Error) => {
  console.error(`❌ Job ${jobId} failed globally:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await voiceAnalysisQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker interrupted...');
  await voiceAnalysisQueue.close();
  process.exit(0);
});

console.log('✅ Worker ready and listening for jobs');
