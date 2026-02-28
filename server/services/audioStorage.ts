import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Encrypted Audio Storage Service
 *
 * Handles secure storage and retrieval of voice recordings with:
 * - AES-256 encryption at rest
 * - Automatic file cleanup based on retention policies
 * - File integrity verification
 */

const STORAGE_BASE_PATH = process.env.AUDIO_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'voice');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate one (should be in .env for production!)
const getEncryptionKey = (): Buffer => {
  const key = process.env.AUDIO_ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️ AUDIO_ENCRYPTION_KEY not set! Using default key (INSECURE for production)');
    // In production, this should throw an error
    return crypto.scryptSync('default-insecure-key-change-me', 'salt', 32);
  }
  return crypto.scryptSync(key, 'puresoul-audio-salt', 32);
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Ensure storage directory exists
 */
async function ensureStorageDirectory(userId: string): Promise<string> {
  const userDir = path.join(STORAGE_BASE_PATH, userId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

/**
 * Generate a unique filename for audio storage
 */
function generateFilename(analysisId: string, extension: string = '.enc'): string {
  return `${analysisId}${extension}`;
}

/**
 * Encrypt and store audio file
 */
export async function storeAudioFile(
  userId: string,
  analysisId: string,
  sourceFilePath: string
): Promise<{
  storagePath: string;
  fileSize: number;
  checksum: string;
}> {
  const userDir = await ensureStorageDirectory(userId);
  const filename = generateFilename(analysisId);
  const destinationPath = path.join(userDir, filename);

  // Generate IV (Initialization Vector)
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

  // Calculate checksum of original file
  const checksum = await calculateFileChecksum(sourceFilePath);

  // Encrypt file
  const readStream = createReadStream(sourceFilePath);
  const writeStream = createWriteStream(destinationPath);

  // Write IV at the beginning of encrypted file
  writeStream.write(iv);

  // Pipe through cipher
  await pipeline(readStream, cipher, writeStream);

  // Append authentication tag
  const authTag = cipher.getAuthTag();
  await fs.appendFile(destinationPath, authTag);

  // Get file size
  const stats = await fs.stat(destinationPath);

  console.log(`🔒 Audio file encrypted and stored: ${destinationPath}`);

  return {
    storagePath: destinationPath,
    fileSize: stats.size,
    checksum,
  };
}

/**
 * Decrypt and retrieve audio file
 */
export async function retrieveAudioFile(
  storagePath: string,
  outputPath: string
): Promise<void> {
  // Read IV from beginning of file
  const fileHandle = await fs.open(storagePath, 'r');
  const ivBuffer = Buffer.alloc(IV_LENGTH);
  await fileHandle.read(ivBuffer, 0, IV_LENGTH, 0);

  // Read encrypted data (excluding IV and auth tag)
  const stats = await fs.stat(storagePath);
  const encryptedDataLength = stats.size - IV_LENGTH - AUTH_TAG_LENGTH;
  const encryptedData = Buffer.alloc(encryptedDataLength);
  await fileHandle.read(encryptedData, 0, encryptedDataLength, IV_LENGTH);

  // Read auth tag from end of file
  const authTag = Buffer.alloc(AUTH_TAG_LENGTH);
  await fileHandle.read(authTag, 0, AUTH_TAG_LENGTH, IV_LENGTH + encryptedDataLength);
  await fileHandle.close();

  // Create decipher
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, ivBuffer);
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  // Write decrypted file
  await fs.writeFile(outputPath, decrypted);

  console.log(`🔓 Audio file decrypted: ${outputPath}`);
}

/**
 * Delete audio file
 */
export async function deleteAudioFile(storagePath: string): Promise<void> {
  try {
    await fs.unlink(storagePath);
    console.log(`🗑️ Audio file deleted: ${storagePath}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // File doesn't exist, that's okay
  }
}

/**
 * Delete all audio files for a user
 */
export async function deleteAllUserAudio(userId: string): Promise<number> {
  const userDir = path.join(STORAGE_BASE_PATH, userId);

  try {
    const files = await fs.readdir(userDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(userDir, file);
      await fs.unlink(filePath);
      deletedCount++;
    }

    // Remove empty directory
    await fs.rmdir(userDir);

    console.log(`🗑️ Deleted ${deletedCount} audio files for user ${userId}`);
    return deletedCount;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return 0; // Directory doesn't exist
    }
    throw error;
  }
}

/**
 * Clean up old audio files based on retention policy
 */
export async function cleanupOldFiles(
  userId: string,
  retentionDays: number
): Promise<number> {
  const userDir = path.join(STORAGE_BASE_PATH, userId);
  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  try {
    const files = await fs.readdir(userDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(userDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old audio files for user ${userId}`);
    return deletedCount;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
}

/**
 * Calculate file checksum (SHA-256)
 */
async function calculateFileChecksum(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Get storage statistics for a user
 */
export async function getUserStorageStats(userId: string): Promise<{
  fileCount: number;
  totalSizeBytes: number;
  oldestFileDate: Date | null;
  newestFileDate: Date | null;
}> {
  const userDir = path.join(STORAGE_BASE_PATH, userId);

  try {
    const files = await fs.readdir(userDir);
    let totalSize = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    for (const file of files) {
      const filePath = path.join(userDir, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;

      const fileDate = stats.mtime;
      if (!oldestDate || fileDate < oldestDate) {
        oldestDate = fileDate;
      }
      if (!newestDate || fileDate > newestDate) {
        newestDate = fileDate;
      }
    }

    return {
      fileCount: files.length,
      totalSizeBytes: totalSize,
      oldestFileDate: oldestDate,
      newestFileDate: newestDate,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        fileCount: 0,
        totalSizeBytes: 0,
        oldestFileDate: null,
        newestFileDate: null,
      };
    }
    throw error;
  }
}

export default {
  storeAudioFile,
  retrieveAudioFile,
  deleteAudioFile,
  deleteAllUserAudio,
  cleanupOldFiles,
  getUserStorageStats,
};
