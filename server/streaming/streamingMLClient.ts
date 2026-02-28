import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { log } from '../vite';

/**
 * Streaming ML Client for Real-Time Voice Analysis
 *
 * Handles communication with the ML service for real-time emotion detection
 * Optimized for <200ms latency on chunk analysis
 */

export interface StreamingAnalysisResult {
  timestamp: number;
  primary_emotion: string;
  emotion_confidence: number;
  emotion_scores: Record<string, number>;
  valence: number;
  arousal: number;
  dominance: number;
  processingTimeMs: number;
  transcript?: string;
  crisis_keywords?: string[];
  risk_level?: string;
}

export interface StreamingMLClientConfig {
  baseURL: string;
  timeout: number; // ms
  maxRetries: number;
}

export class StreamingMLClient {
  private client: AxiosInstance;
  private config: StreamingMLClientConfig;

  constructor(config?: Partial<StreamingMLClientConfig>) {
    this.config = {
      baseURL: config?.baseURL || process.env.ML_SERVICE_URL || 'http://localhost:8000',
      timeout: config?.timeout || 2000, // 2 second timeout for real-time
      maxRetries: config?.maxRetries || 2
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json'
      }
    });

    log(`[StreamingMLClient] Initialized with base URL: ${this.config.baseURL}`);
  }

  /**
   * Analyze audio chunk for real-time emotion detection
   *
   * @param formData - FormData containing audio_file and metadata
   * @returns Streaming analysis result with emotions and timing
   */
  async analyzeChunk(formData: FormData): Promise<StreamingAnalysisResult> {
    const startTime = Date.now();

    try {
      const response = await this.client.post('/analyze-chunk', formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: this.config.timeout
      });

      const processingTime = Date.now() - startTime;

      log(`[StreamingMLClient] Chunk analyzed in ${processingTime}ms`);

      // Transform ML service response to streaming format
      return {
        timestamp: Date.now(),
        primary_emotion: response.data.primary_emotion || 'neutral',
        emotion_confidence: response.data.emotion_confidence || 0.5,
        emotion_scores: response.data.emotion_scores || {},
        valence: response.data.valence || 0,
        arousal: response.data.arousal || 0,
        dominance: response.data.dominance || 0.5,
        processingTimeMs: processingTime,
        transcript: response.data.transcript || undefined,
        crisis_keywords: response.data.crisis_keywords || undefined,
        risk_level: response.data.risk_level || undefined
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      if (error.code === 'ECONNABORTED') {
        log(`[StreamingMLClient] Request timeout after ${processingTime}ms`);
        throw new Error('ML service timeout - analysis took too long');
      }

      if (error.response) {
        log(`[StreamingMLClient] ML service error: ${error.response.status} - ${error.response.data?.detail || error.message}`);
        throw new Error(`ML service error: ${error.response.data?.detail || error.message}`);
      }

      if (error.request) {
        log(`[StreamingMLClient] ML service unavailable`);
        throw new Error('ML service unavailable - cannot reach endpoint');
      }

      log(`[StreamingMLClient] Unexpected error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze chunk with retry logic for transient failures
   */
  async analyzeChunkWithRetry(formData: FormData): Promise<StreamingAnalysisResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.analyzeChunk(formData);
      } catch (error: any) {
        lastError = error;
        log(`[StreamingMLClient] Attempt ${attempt}/${this.config.maxRetries} failed: ${error.message}`);

        // Don't retry on timeout or client errors
        if (error.message.includes('timeout') || error.message.includes('unavailable')) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 500);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, return degraded result
    log(`[StreamingMLClient] All retries failed, returning degraded result`);
    return this.getDegradedResult(lastError);
  }

  /**
   * Return a degraded result when ML service is unavailable
   * Allows the system to continue functioning with reduced capabilities
   */
  private getDegradedResult(error: Error | null): StreamingAnalysisResult {
    return {
      timestamp: Date.now(),
      primary_emotion: 'neutral',
      emotion_confidence: 0.3,
      emotion_scores: {
        neutral: 1.0
      },
      valence: 0,
      arousal: 0.3,
      dominance: 0.5,
      processingTimeMs: 0,
      transcript: undefined
    };
  }

  /**
   * Health check to verify ML service is responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 1000
      });

      const isHealthy = response.status === 200;
      log(`[StreamingMLClient] Health check: ${isHealthy ? 'OK' : 'FAILED'}`);

      return isHealthy;

    } catch (error) {
      log(`[StreamingMLClient] Health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Get ML service metrics (for monitoring)
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await this.client.get('/metrics', {
        timeout: 1000
      });

      return response.data;

    } catch (error) {
      log(`[StreamingMLClient] Failed to get metrics: ${error}`);
      return null;
    }
  }
}

/**
 * Global singleton instance
 */
let streamingMLClient: StreamingMLClient | null = null;

/**
 * Get or create the streaming ML client singleton
 */
export function getStreamingMLClient(): StreamingMLClient {
  if (!streamingMLClient) {
    streamingMLClient = new StreamingMLClient();
  }

  return streamingMLClient;
}

/**
 * Factory function with custom config
 */
export function createStreamingMLClient(config?: Partial<StreamingMLClientConfig>): StreamingMLClient {
  return new StreamingMLClient(config);
}
