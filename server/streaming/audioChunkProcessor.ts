import FormData from 'form-data';
import fs from 'fs';
import { log } from '../vite';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audio Chunk Processor for Real-Time Voice Analysis
 *
 * Handles:
 * - Combining multiple audio chunks into analyzable segments
 * - Sliding window management (2-5 second windows)
 * - Temporary file management for ML service processing
 * - Audio format validation and conversion
 */

export interface AudioChunk {
  buffer: Buffer;
  timestamp: number;
  sampleRate?: number;
  channels?: number;
}

export interface ProcessedAudioSegment {
  filePath: string;
  durationMs: number;
  chunks: number;
  startTimestamp: number;
  endTimestamp: number;
}

export class AudioChunkProcessor {
  private chunks: AudioChunk[] = [];
  private tempDir: string;
  private windowSizeMs: number;
  private overlapMs: number;

  constructor(options?: {
    windowSizeMs?: number;
    overlapMs?: number;
    tempDir?: string;
  }) {
    this.windowSizeMs = options?.windowSizeMs || 3000; // 3 seconds default
    this.overlapMs = options?.overlapMs || 1000; // 1 second overlap
    this.tempDir = options?.tempDir || '/tmp/voice-realtime';

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Add a new audio chunk to the buffer
   */
  addChunk(chunk: AudioChunk): void {
    // SECURITY/ROBUSTNESS: Forcefully overwrite the client timestamp with the server's timestamp
    // to prevent client-server clock skew from instantly discarding incoming chunks.
    const serverTimestamp = Date.now();
    chunk.timestamp = serverTimestamp;

    this.chunks.push(chunk);

    // Keep only chunks within the sliding window + overlap
    const cutoffTime = serverTimestamp - (this.windowSizeMs + this.overlapMs);
    this.chunks = this.chunks.filter(c => c.timestamp >= cutoffTime);
  }

  /**
   * Check if enough chunks are available for analysis
   */
  canProcess(): boolean {
    if (this.chunks.length === 0) return false;

    const firstChunkTime = this.chunks[0].timestamp;
    const lastChunkTime = this.chunks[this.chunks.length - 1].timestamp;
    const duration = lastChunkTime - firstChunkTime;

    return duration >= this.windowSizeMs;
  }

  /**
   * Process accumulated chunks into a temporary audio file for ML analysis
   *
   * Returns the file path and metadata about the processed segment
   */
  async processWindow(): Promise<ProcessedAudioSegment | null> {
    if (!this.canProcess()) {
      return null;
    }

    try {
      // Combine buffers from sliding window
      const windowChunks = this.getWindowChunks();

      if (windowChunks.length === 0) {
        return null;
      }

      // Concatenate audio data
      const combinedBuffer = Buffer.concat(windowChunks.map(c => c.buffer));

      // Generate unique filename
      const filename = `realtime_${uuidv4()}.webm`;
      const filePath = path.join(this.tempDir, filename);

      // Write to temporary file
      await fs.promises.writeFile(filePath, combinedBuffer);

      const startTimestamp = windowChunks[0].timestamp;
      const endTimestamp = windowChunks[windowChunks.length - 1].timestamp;
      const durationMs = endTimestamp - startTimestamp;

      log(`[AudioChunkProcessor] Processed window: ${windowChunks.length} chunks, ${durationMs}ms duration`);

      return {
        filePath,
        durationMs,
        chunks: windowChunks.length,
        startTimestamp,
        endTimestamp
      };

    } catch (error) {
      log(`[AudioChunkProcessor] Error processing window: ${error}`);
      return null;
    }
  }

  /**
   * Get chunks within the current sliding window
   */
  private getWindowChunks(): AudioChunk[] {
    if (this.chunks.length === 0) return [];

    const endTime = this.chunks[this.chunks.length - 1].timestamp;
    const startTime = endTime - this.windowSizeMs;

    return this.chunks.filter(c => c.timestamp >= startTime && c.timestamp <= endTime);
  }

  /**
   * Create FormData for ML service request
   */
  createFormData(filePath: string, metadata?: any): FormData {
    const form = new FormData();

    // Attach audio file
    form.append('audio_file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'audio/webm'
    });

    // Attach metadata
    if (metadata) {
      form.append('metadata', JSON.stringify(metadata));
    }

    return form;
  }

  /**
   * Clean up temporary file after processing
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
      log(`[AudioChunkProcessor] Cleaned up temp file: ${filePath}`);
    } catch (error) {
      log(`[AudioChunkProcessor] Error cleaning up file ${filePath}: ${error}`);
    }
  }

  /**
   * Clean up all temporary files older than a certain age
   */
  async cleanupOldFiles(maxAgeMs: number = 3600000): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.promises.stat(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          log(`[AudioChunkProcessor] Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      log(`[AudioChunkProcessor] Error during cleanup: ${error}`);
    }
  }

  /**
   * Reset the chunk buffer (e.g., on session end)
   */
  reset(): void {
    this.chunks = [];
    log('[AudioChunkProcessor] Reset chunk buffer');
  }

  /**
   * Get current buffer statistics
   */
  getStats(): {
    chunkCount: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
    totalDurationMs: number;
  } {
    if (this.chunks.length === 0) {
      return {
        chunkCount: 0,
        oldestTimestamp: null,
        newestTimestamp: null,
        totalDurationMs: 0
      };
    }

    return {
      chunkCount: this.chunks.length,
      oldestTimestamp: this.chunks[0].timestamp,
      newestTimestamp: this.chunks[this.chunks.length - 1].timestamp,
      totalDurationMs: this.chunks[this.chunks.length - 1].timestamp - this.chunks[0].timestamp
    };
  }
}

/**
 * Factory function to create an AudioChunkProcessor instance
 */
export function createAudioChunkProcessor(options?: {
  windowSizeMs?: number;
  overlapMs?: number;
  tempDir?: string;
}): AudioChunkProcessor {
  return new AudioChunkProcessor(options);
}
