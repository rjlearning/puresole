import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { supabase } from "./supabase";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "voice");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `voice-${uniqueId}.webm`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

export function registerVoiceRoutes(app: Express) {
  // Create voice entry
  app.post(
    "/api/voice-entries",
    upload.single("audio"),
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ message: "User ID not found" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        const {
          duration,
          moodBefore,
          moodAfter,
          tags,
          notes,
          emotions,
        } = req.body;

        // Parse tags if it's a string
        let parsedTags: string[] = [];
        if (tags) {
          try {
            parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
          } catch (e) {
            console.error("Error parsing tags:", e);
          }
        }

        // Parse feelings/emotions if it's a string
        let parsedEmotions = null;
        if (emotions) {
          try {
            parsedEmotions = typeof emotions === "string" ? JSON.parse(emotions) : emotions;
          } catch (e) {
            console.error("Error parsing emotions:", e);
          }
        }

        let finalAudioUrl = `/uploads/voice/${req.file.filename}`;

        // Upload to Supabase if available
        if (supabase) {
          const fileBuffer = fs.readFileSync(req.file.path);
          const { data, error } = await supabase.storage
            .from('voice-memos')
            .upload(`${userId}/${req.file.filename}`, fileBuffer, {
              contentType: 'audio/webm',
              upsert: true
            });

          if (error) {
            console.error("Supabase upload error:", error);
          } else if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('voice-memos')
              .getPublicUrl(data.path);
            finalAudioUrl = publicUrl;
          }
        }

        // Save to database
        const [voiceEntry] = await db
          .insert(schema.voiceEntries)
          .values({
            userId,
            audioUrl: finalAudioUrl,
            duration: parseInt(duration) || 0,
            fileSize: req.file.size,
            moodBefore: moodBefore ? parseInt(moodBefore) : null,
            moodAfter: moodAfter ? parseInt(moodAfter) : null,
            tags: parsedTags,
            notes: notes || null,
            emotionData: parsedEmotions,
          })
          .returning();

        res.json({
          message: "Voice entry saved successfully",
          entry: voiceEntry,
        });
      } catch (error) {
        console.error("Error saving voice entry:", error);
        res.status(500).json({ message: "Error saving voice entry" });
      }
    }
  );

  // Get all voice entries for current user
  app.get("/api/voice-entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const entries = await db.query.voiceEntries.findMany({
        where: eq(schema.voiceEntries.userId, userId),
        orderBy: [desc(schema.voiceEntries.recordedAt)],
        limit,
      });

      res.json({ entries });
    } catch (error) {
      console.error("Error fetching voice entries:", error);
      res.status(500).json({ message: "Error fetching voice entries" });
    }
  });

  // Get single voice entry
  app.get("/api/voice-entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      const entryId = req.params.id;

      const [entry] = await db
        .select()
        .from(schema.voiceEntries)
        .where(eq(schema.voiceEntries.id, entryId))
        .limit(1);

      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error fetching voice entry:", error);
      res.status(500).json({ message: "Error fetching voice entry" });
    }
  });

  // Delete voice entry
  app.delete("/api/voice-entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      const entryId = req.params.id;

      const [entry] = await db
        .select()
        .from(schema.voiceEntries)
        .where(eq(schema.voiceEntries.id, entryId))
        .limit(1);

      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete file from disk
      if (entry.audioUrl) {
        const filePath = path.join(process.cwd(), entry.audioUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete from database
      await db
        .delete(schema.voiceEntries)
        .where(eq(schema.voiceEntries.id, entryId));

      res.json({ message: "Voice entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting voice entry:", error);
      res.status(500).json({ message: "Error deleting voice entry" });
    }
  });

  // Serve uploaded audio files
  app.use("/uploads/voice", (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });

  app.use("/uploads/voice", (req, res, next) => {
    res.setHeader("Content-Type", "audio/webm");
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });
}
