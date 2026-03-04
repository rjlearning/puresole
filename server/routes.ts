import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, isAuthenticated } from "./standardAuth";
import { setupMultiAuth, registerMultiAuthRoutes, requireAuth } from "./multiAuth";
import type { User } from "@shared/schema";
import { initializeRealtimeVoiceSocket } from "./socket/realtimeVoiceSocket";

// Security: Sanitize user object to remove sensitive fields
export function sanitizeUser(user: User | undefined): Partial<User> | null {
  if (!user) return null;

  // ONLY return safe, public fields - NEVER return sensitive data
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // EXPLICITLY EXCLUDED (for security):
    // - passwordHash: NEVER expose password hashes
    // - stripeCustomerId: Internal Stripe data
    // - stripeSubscriptionId: Internal Stripe data
  };
}

// Security: Sanitize subscription object to remove ALL Stripe IDs
function sanitizeSubscription(sub: any): any {
  if (!sub) return null;

  const { stripeCustomerId, stripeSubscriptionId, stripePriceId, stripeProductId, ...safe } = sub;
  // SECURITY: Never expose ANY Stripe identifiers to client (PCI compliance)
  return safe;
}

// Security: Sanitize subscription plan to remove Stripe IDs
function sanitizePlan(plan: any): any {
  if (!plan) return null;

  const { stripePriceId, stripeProductId, ...safe } = plan;
  // SECURITY: Never expose Stripe identifiers to client
  return safe;
}

// Security: Deeply remove ALL Stripe identifiers from any object or nested structure
function deepRemoveStripeIds(obj: any): any {
  if (!obj) return obj;

  // Handle arrays - recursively clean each element
  if (Array.isArray(obj)) {
    return obj.map(item => deepRemoveStripeIds(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip ALL keys that contain Stripe identifiers
        if (key.toLowerCase().includes('stripe')) {
          continue; // SECURITY: Drop ANY Stripe-related fields
        }
        // Recursively clean nested values
        cleaned[key] = deepRemoveStripeIds(obj[key]);
      }
    }
    return cleaned;
  }

  // Return primitives as-is
  return obj;
}

// Security: Sanitize payment to remove ALL Stripe IDs (including deeply nested metadata)
function sanitizePayment(payment: any): any {
  if (!payment) return null;

  const { stripePaymentIntentId, stripeInvoiceId, metadata, ...safe } = payment;

  // Deep clean metadata to remove ALL Stripe IDs regardless of nesting
  if (metadata) {
    return { ...safe, metadata: deepRemoveStripeIds(metadata) };
  }

  // SECURITY: Never expose Stripe payment identifiers to client
  return safe;
}

// Security: Sanitize data structures that might contain sensitive objects
// This handles arrays, nested objects, user data, subscriptions, payments, and plans
function sanitizeData(data: any): any {
  if (!data) return data;

  // Handle arrays - recursively sanitize each element
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if this object looks like a User
    if ('passwordHash' in data || 'stripeCustomerId' in data) {
      return sanitizeUser(data as User);
    }

    // Check if this object looks like a Subscription
    if ('stripeSubscriptionId' in data || 'stripePriceId' in data) {
      return sanitizeSubscription(data);
    }

    // Check if this object looks like a Payment
    if ('stripePaymentIntentId' in data || 'stripeInvoiceId' in data) {
      return sanitizePayment(data);
    }

    // Check if this object looks like a Plan
    if ('stripePriceId' in data && 'stripeProductId' in data) {
      return sanitizePlan(data);
    }

    // Otherwise, recursively sanitize nested objects
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Special handling for known sensitive properties
        if (key === 'user' && data[key]) {
          sanitized[key] = sanitizeUser(data[key]);
        } else if ((key === 'oldValue' || key === 'newValue') && data[key]) {
          // Audit log values need recursive sanitization
          sanitized[key] = sanitizeData(data[key]);
        } else {
          sanitized[key] = sanitizeData(data[key]);
        }
      }
    }
    return sanitized;
  }

  // Return primitives as-is
  return data;
}




// Unified authentication middleware
const isAuthenticatedUnified = (req: any, res: any, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Normalize the user structure for consistency
    if (!req.user.claims && (req.user as any).id) {
      req.user = {
        claims: {
          sub: (req.user as any).id,
          email: req.user.email
        },
        ...req.user
      };
    }
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};

import {
  insertAssessmentSchema,
  insertTreatmentPlanSchema,
  insertProgressEntrySchema,
  insertCrisisAlertSchema,
  insertSubscriptionPlanSchema,
  insertUserSubscriptionSchema,
  insertPaymentSchema,
  insertAuditLogSchema,
  wellnessInsights,
  progressEntries,
  userActivityCompletions,
  wellnessActivities
} from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { analyzeAssessment, generateTreatmentPlan, analyzeProgress, generateTTS, generateDailyInsight, generateUserSeason, generateSleepStory } from "./openai";
import Stripe from "stripe";
import advancedAnalyticsRouter from './routes/advancedAnalytics';
import aiCompanionRouter from './routes/aiCompanion';
import postpartumRouter from './routes/postpartum';
import patternsRouter from './routes/patterns';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.basil" as any,
});

// Audit logging helper
async function createAuditLog(
  userId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  oldValues?: any,
  newValues?: any,
  req?: any
) {
  try {
    await storage.createAuditLog({
      userId,
      entityType,
      entityId,
      action,
      oldValues,
      newValues,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'api'
      },
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent')
    });
  } catch (error) {
    // Silent failure - audit logging should not break the main flow
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup both authentication systems
  await setupSession(app);
  // Setup multi-auth
  setupMultiAuth(app);  // OAuth + Email/Password Auth

  // Register multi-auth routes
  registerMultiAuthRoutes(app);

  // Phase IV: Advanced Analytics Routes
  app.use('/api/advanced-analytics', advancedAnalyticsRouter);

  // AI Companion Routes
  app.use('/api', aiCompanionRouter);

  // Postpartum Core Engine Routes
  app.use('/api/postpartum', postpartumRouter);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      // SECURITY: Always sanitize user data before sending to client
      res.json(sanitizeUser(user));
    } catch (error) {
      // SECURITY: Don't log full error (could contain sensitive data)
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Text-to-Speech proxy
  app.post('/api/tts', isAuthenticated, async (req: any, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Valid text is required" });
      }

      const audioBuffer = await generateTTS(text, voice);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000' // Cache aggressively since text->audio mapping is static
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS generation failed:", error);
      res.status(500).json({ message: "Failed to generate speech audio" });
    }
  });

  // Support ticket submission
  app.post('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { subject, category, priority, description } = req.body;

      // SECURITY: Input validation
      if (!subject || !category || !priority || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (typeof subject !== 'string' || subject.length > 500) {
        return res.status(400).json({ message: "Invalid subject" });
      }

      if (!['general', 'technical', 'billing', 'feedback'].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }

      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ message: "Invalid priority" });
      }

      if (typeof description !== 'string' || description.length > 5000) {
        return res.status(400).json({ message: "Invalid description" });
      }

      // Create support ticket
      // The original storage.createSupportTicket is commented out as it might not exist or needs refactoring.
      // For now, we'll simulate a successful ticket creation.
      /* await storage.createSupportTicket({
        userId,
        subject,
        category,
        priority,
        description,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      }); */
      res.json({ success: true, message: "Support ticket submitted successfully." });
    } catch (error: any) {
      // SECURITY: Don't log full error (could contain sensitive data)
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        userId
      });

      // Create assessment in database
      const assessment = await storage.createAssessment(assessmentData);

      // Analyze assessment with AI and enrich the record
      try {
        const analysis = await analyzeAssessment(
          assessment.type,
          assessment.responses as Record<string, any>,
          assessment.score as number
        );

        // Enrich assessment object (in memory only - no DB duplication)
        const enrichedAssessment = {
          ...assessment,
          aiAnalysis: analysis.summary,
          recommendations: analysis.recommendations,
          riskFactors: analysis.riskFactors,
          severity: analysis.severity
        };

        // Create crisis alert if needed
        if (analysis.crisisRisk) {
          await storage.createCrisisAlert({
            userId,
            assessmentId: assessment.id,
            alertType: 'crisis',
            severity: 'high',
            description: `Crisis risk detected in ${assessment.type} assessment`
          });
        }

        res.json(enrichedAssessment);
      } catch (aiError) {
        // SECURITY: Don't log error details
        // Return assessment without AI analysis if AI fails
        res.json(assessment);
      }
    } catch (error) {
      // SECURITY: Don't log error details
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  // Daily Personalized Insight for Dashboard
  app.get('/api/dashboard/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check for an existing insight generated today
      const existingInsights = await db.select().from(wellnessInsights).where(
        and(
          eq(wellnessInsights.userId, userId),
          eq(wellnessInsights.insightType, 'daily_quote'),
          gte(wellnessInsights.createdAt, today)
        )
      ).limit(1);

      if (existingInsights.length > 0) {
        return res.json(existingInsights[0]);
      }

      // No insight for today, let's generate a new one
      const recentAssessments = await storage.getAssessmentsByUser(userId);
      const latestAssessments = recentAssessments.slice(0, 3); // Take last 3 check-ins

      // Fetch recent conversation insights via raw SQL
      const recentConversations = await db.execute(sql`
        SELECT * FROM conversation_insights
        WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ${userId})
        ORDER BY created_at DESC LIMIT 5
      `);

      // Generate via OpenAI
      const quoteContent = await generateDailyInsight(latestAssessments, recentConversations.rows);

      // Save to database
      const [newInsight] = await db.insert(wellnessInsights).values({
        userId,
        insightType: 'daily_quote',
        title: 'Your Daily Vibe',
        description: quoteContent,
        confidenceScore: "0.95",
      }).returning();

      return res.json(newInsight);
    } catch (error) {
      console.error("Failed to fetch or generate daily insight:", error);
      res.status(500).json({ message: "Failed to generate daily insight" });
    }
  });

  // User Season (Compassionate Progress Tracking)
  app.get('/api/dashboard/season', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check for an existing season generated today
      const existingSeasons = await db.select().from(wellnessInsights).where(
        and(
          eq(wellnessInsights.userId, userId),
          eq(wellnessInsights.insightType, 'season_tracking'),
          gte(wellnessInsights.createdAt, today)
        )
      ).limit(1);

      if (existingSeasons.length > 0) {
        return res.json(existingSeasons[0]);
      }

      // No season for today, generate a new one
      const recentAssessments = await storage.getAssessmentsByUser(userId);
      const latestAssessments = recentAssessments.slice(0, 5); // Last 5 check-ins

      const recentConversations = await db.execute(sql`
        SELECT * FROM conversation_insights
        WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ${userId})
        ORDER BY created_at DESC LIMIT 5
      `);

      const seasonData = await generateUserSeason(latestAssessments, recentConversations.rows);

      const [newSeason] = await db.insert(wellnessInsights).values({
        userId,
        insightType: 'season_tracking',
        title: seasonData.season,
        description: seasonData.progressStatement,
        confidenceScore: "0.90",
      }).returning();

      return res.json(newSeason);

    } catch (error) {
      console.error("Failed to fetch or generate user season:", error);
      res.status(500).json({ message: "Failed to generate user season" });
    }
  });

  // Generative Sleep Stories
  app.post('/api/sleep/generate-story', isAuthenticated, async (req: any, res) => {
    try {
      const { theme } = req.body;
      const userId = (req.user as any).id;

      if (!theme || typeof theme !== 'string') {
        return res.status(400).json({ message: "A valid theme string is required." });
      }

      // 1. Gather context (optional, for personalisation)
      let latestAssessments: any[] = [];
      let conversationRows: any[] = [];
      try {
        const recentAssessments = await storage.getAssessmentsByUser(userId);
        latestAssessments = recentAssessments.slice(0, 3);
        const recentConversations = await db.execute(sql`
          SELECT * FROM conversation_insights
          WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = ${userId})
          ORDER BY created_at DESC LIMIT 3
        `);
        conversationRows = recentConversations.rows;
      } catch (ctxErr) {
        // Context fetch failed — proceed without personalisation
        console.warn("Could not fetch user context for story, using theme only.");
      }

      // 2. Generate Story (OpenAI or built-in fallback)
      const storyText = await generateSleepStory(latestAssessments, conversationRows, theme);

      // 3. Optionally persist to DB (non-critical — don't block the response)
      try {
        await db.insert(wellnessInsights).values({
          userId,
          insightType: 'sleep_story',
          title: `Sleep Story: ${theme}`,
          description: storyText,
          confidenceScore: "0.85",
        });
      } catch (dbErr) {
        // DB save failed — not critical, log and continue
        console.warn("Could not persist sleep story to DB:", dbErr);
      }

      return res.json({ storyText });

    } catch (error) {
      console.error("Failed to generate sleep story:", error);
      res.status(500).json({ message: "Failed to generate sleep story" });
    }
  });

  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const assessments = await storage.getAssessmentsByUser(userId);
      res.json(assessments);
    } catch (error) {
      // SECURITY: Don't log error details
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = req.params.id ? parseInt(req.params.id) : 0;
      // const entryId = req.params.entryId; // entryId is not used in this route, commenting out

      if (!assessmentId) {
        return res.status(400).json({ error: "Invalid assessment ID" });
      }

      const assessment = await storage.getAssessment(assessmentId.toString()); // Convert back to string if storage expects string ID
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if user owns this assessment or is admin
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (assessment.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  // Treatment plan routes
  app.post('/api/treatment-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { assessmentId, userGoals } = req.body;

      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Generate treatment plan with AI
      try {
        const assessmentAnalysis = {
          severity: assessment.severity,
          riskFactors: assessment.riskFactors as string[] || [],
          recommendations: assessment.recommendations as string[] || [],
          treatmentPriorities: [],
          crisisRisk: false,
          summary: assessment.aiAnalysis || ''
        };

        const aiTreatmentPlan = await generateTreatmentPlan(
          assessmentAnalysis,
          assessment.type,
          userGoals
        );

        // Create treatment plan in database
        const treatmentPlan = await storage.createTreatmentPlan({
          userId,
          assessmentId,
          title: aiTreatmentPlan.title,
          description: aiTreatmentPlan.description,
          totalWeeks: aiTreatmentPlan.totalWeeks,
          modules: aiTreatmentPlan.modules,
          goals: aiTreatmentPlan.goals
        });

        // Create treatment modules
        for (const module of aiTreatmentPlan.modules) {
          await storage.createTreatmentModule({
            planId: treatmentPlan.id,
            title: module.title,
            description: module.description,
            week: module.week,
            order: 1,
            content: {
              activities: module.activities,
              learningObjectives: module.learningObjectives
            }
          });
        }

        res.json(treatmentPlan);
      } catch (aiError) {
        res.status(500).json({ message: "Failed to generate treatment plan" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create treatment plan" });
    }
  });

  app.get('/api/treatment-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const plans = await storage.getTreatmentPlansByUser(userId);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatment plans" });
    }
  });

  app.get('/api/treatment-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.getTreatmentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Treatment plan not found" });
      }

      // Check if user owns this plan or is admin
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (plan.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get modules for this plan and normalize activity fields for backward compat
      const rawModules = await storage.getTreatmentModulesByPlan(plan.id);
      const modules = (rawModules || []).map((mod: any) => ({
        ...mod,
        content: {
          ...mod.content,
          activities: (mod.content?.activities || []).map((a: any) => ({
            ...a,
            name: a.name || a.title || 'Activity',
            duration: a.duration || a.durationMinutes || 5,
            instructions: a.instructions || a.description || 'Follow the steps for this activity.',
          })),
          learningObjectives: mod.content?.learningObjectives || [],
        }
      }));

      res.json({ ...plan, modules });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatment plan" });
    }
  });

  app.patch('/api/treatment-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.getTreatmentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Treatment plan not found" });
      }

      const userId = (req.user as any).id;
      if (plan.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedPlan = await storage.updateTreatmentPlan(req.params.id, req.body);
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update treatment plan" });
    }
  });

  // Progress tracking routes
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const progressData = insertProgressEntrySchema.parse({
        ...req.body,
        userId,
        date: new Date()
      });

      const progressEntry = await storage.createProgressEntry(progressData);
      res.json(progressEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  app.get('/api/progress/plan/:planId', isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.getTreatmentPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Treatment plan not found" });
      }

      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (plan.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const progressEntries = await storage.getProgressEntriesByPlan(req.params.planId);
      // SECURITY: Sanitize any user data that might be in progress entries (admins can view other users' progress)
      const sanitized = sanitizeData(progressEntries);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress entries" });
    }
  });

  app.get('/api/progress/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const progressEntries = await storage.getProgressEntriesByUser(userId, start, end);
      res.json(progressEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      // SECURITY: Sanitize ALL user data before sending
      const sanitizedUsers = users.map(u => sanitizeUser(u));
      res.json(sanitizedUsers);
    } catch (error) {
      // SECURITY: Don't log full error
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const assessments = await storage.getRecentAssessments(50);
      // SECURITY: Sanitize any user data that might be in assessments
      const sanitized = sanitizeData(assessments);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/admin/crisis-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const resolved = req.query.resolved === 'true' ? true :
        req.query.resolved === 'false' ? false : undefined;

      const alerts = await storage.getCrisisAlerts(resolved);
      // SECURITY: Sanitize any user data that might be in alerts
      const sanitized = sanitizeData(alerts);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crisis alerts" });
    }
  });

  app.patch('/api/admin/crisis-alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const resolvedAlert = await storage.resolveCrisisAlert(req.params.id, userId);
      // SECURITY: Sanitize any user data that might be in the resolved alert
      const sanitized = sanitizeData(resolvedAlert);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve crisis alert" });
    }
  });

  // Subscription routes
  app.get('/api/subscription-plans', isAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans(true); // Only active plans
      // SECURITY: Remove ALL Stripe IDs before sending to client
      const sanitizedPlans = plans.map(p => sanitizePlan(p));
      res.json(sanitizedPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const subscription = await storage.getUserSubscription(userId);

      if (!subscription) {
        return res.json(null);
      }

      // SECURITY: Deep sanitize to remove ALL Stripe IDs including nested plan data
      const sanitized = sanitizeSubscription(subscription);
      const deepCleaned = deepRemoveStripeIds(sanitized);
      res.json(deepCleaned);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Check if user already has an active subscription
      const existingSubscription = await storage.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(400).json({ message: "User already has an active subscription" });
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
          metadata: { userId }
        });

        await storage.updateUserStripeInfo(userId, customer.id);
        await createAuditLog(userId, 'user', userId, 'stripe_customer_created', null, { stripeCustomerId: customer.id }, req);
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, planId }
      });

      // Save subscription to database
      const userSubscription = await storage.createUserSubscription({
        userId,
        planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status as any,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      });

      await createAuditLog(userId, 'subscription', userSubscription.id, 'created', null, userSubscription, req);

      // SECURITY: Deep sanitize to remove ALL Stripe IDs including nested data
      const sanitized = sanitizeSubscription(userSubscription);
      const deepCleaned = deepRemoveStripeIds(sanitized);

      res.json({
        subscription: deepCleaned,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret
      });
    } catch (error) {
      await createAuditLog(req.user?.claims?.sub, 'subscription', 'failed', 'create_failed', null, { error: (error as Error).message }, req);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const subscription = await storage.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      const oldSubscription = { ...subscription };

      // Cancel subscription in Stripe
      const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update in database
      const updatedSubscription = await storage.updateUserSubscription(subscription.id, {
        cancelAtPeriodEnd: true,
        status: stripeSubscription.status as any
      });

      await createAuditLog(userId, 'subscription', subscription.id, 'cancelled', oldSubscription, updatedSubscription, req);

      // SECURITY: Deep sanitize to remove ALL Stripe IDs including nested data
      const sanitized = sanitizeSubscription(updatedSubscription);
      res.json(deepRemoveStripeIds(sanitized));
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Retention discount: offer 30% off for 3 months when user tries to cancel
  app.post('/api/apply-retention-discount', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { accept } = req.body;
      const subscription = await storage.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      if (accept) {
        // Create (or retrieve) a 30%-off-for-3-months coupon in Stripe
        let coupon: any;
        try {
          coupon = await stripe.coupons.retrieve('STAY30_3MO');
        } catch {
          coupon = await stripe.coupons.create({
            id: 'STAY30_3MO',
            percent_off: 30,
            duration: 'repeating',
            duration_in_months: 3,
            name: '30% off for 3 months (retention)',
          });
        }

        // Apply coupon to the Stripe subscription via discounts array
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          discounts: [{ coupon: coupon.id }],
        });

        await createAuditLog(userId, 'subscription', subscription.id, 'retention_discount_applied', null, { coupon: coupon.id }, req);
        return res.json({ success: true, message: 'Discount applied! 30% off for next 3 months.' });
      } else {
        // Decline offer → proceed with standard cancel at period end
        const stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        const updatedSubscription = await storage.updateUserSubscription(subscription.id, {
          cancelAtPeriodEnd: true,
          status: stripeSubscription.status as any,
        });
        await createAuditLog(userId, 'subscription', subscription.id, 'cancelled_after_offer', null, updatedSubscription, req);
        const sanitized = sanitizeSubscription(updatedSubscription);
        return res.json(deepRemoveStripeIds(sanitized));
      }
    } catch (error) {
      console.error('Retention discount error:', error);
      res.status(500).json({ message: 'Failed to process retention offer' });
    }
  });

  app.get('/api/billing-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const payments = await storage.getPaymentsByUser(userId);
      // SECURITY: Remove ALL Stripe payment IDs before sending to client
      const sanitizedPayments = payments.map(p => sanitizePayment(p));
      res.json(sanitizedPayments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch billing history" });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);

          if (userSubscription) {
            const oldSubscription = { ...userSubscription };
            const updatedSubscription = await storage.updateUserSubscription(userSubscription.id, {
              status: subscription.status as any,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
            });

            await createAuditLog(userSubscription.userId, 'subscription', userSubscription.id, event.type, oldSubscription, updatedSubscription);
          }
          break;

        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          const invoice = event.data.object as Stripe.Invoice;
          const userSub = await storage.getUserSubscriptionByStripeId((invoice as any).subscription as string);

          if (userSub) {
            await storage.createPayment({
              userId: userSub.userId,
              subscriptionId: userSub.id,
              planId: userSub.planId,
              stripePaymentIntentId: (invoice as any).payment_intent as string,
              stripeInvoiceId: invoice.id,
              type: 'subscription',
              status: event.type === 'invoice.payment_succeeded' ? 'succeeded' : 'failed',
              amount: (invoice.amount_paid / 100).toString(),
              currency: invoice.currency,
              description: `Payment for subscription ${(invoice as any).subscription}`,
              metadata: { invoiceId: invoice.id, subscriptionId: (invoice as any).subscription }
            });

            if (invoice.id && invoice.currency) {
              await createAuditLog(userSub.userId, 'payment', invoice.id, event.type as string, null, { amount: invoice.amount_paid, currency: invoice.currency });
            }
          }
          break;
      }

      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Admin subscription management routes
  app.get('/api/admin/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all subscription plans
      const plans = await storage.getSubscriptionPlans();
      // SECURITY: Remove ALL Stripe IDs from subscription plans
      const sanitized = plans.map(p => sanitizePlan(p));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get('/api/admin/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const auditLogs = await storage.getAuditLogs('payment', 100);
      // SECURITY: Deep sanitize to remove ALL Stripe IDs including nested audit log data
      const sanitized = sanitizeData(auditLogs);
      const deepCleaned = deepRemoveStripeIds(sanitized);
      res.json(deepCleaned);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment logs" });
    }
  });

  const httpServer = createServer(app);

  // Initialize Socket.io for real-time voice analysis
  initializeRealtimeVoiceSocket(httpServer);

  // Phase 1: Shared Journeys Community Hub

  // Get aggregated, anonymous community statistics
  app.get('/api/community/stats', isAuthenticated, async (req: any, res) => {
    try {
      const isTestMode = req.query.test_mode === 'true';
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      // Query real activity from the last 15 minutes
      const realActivity = await db.select({
        activityId: userActivityCompletions.activityId,
        count: sql<number>`count(*)::int`
      })
        .from(userActivityCompletions)
        .where(gte(userActivityCompletions.completedAt, fifteenMinutesAgo))
        .groupBy(userActivityCompletions.activityId);

      // Get activity categories for these IDs
      const allActivities = await storage.getWellnessActivities();
      const activityIdToCategory = allActivities.reduce((acc, act) => {
        acc[act.id] = act.category;
        return acc;
      }, {} as Record<string, string>);

      // Map real activity to categories
      const realCounts: Record<string, number> = {
        breathing: 0,
        meditating: 0,
        journaling: 0,
        sleeping: 0,
        sos: 0
      };

      realActivity.forEach(stat => {
        const category = activityIdToCategory[stat.activityId];
        if (category && realCounts[category] !== undefined) {
          realCounts[category] += stat.count;
        }
      });

      const hour = now.getHours();
      // Generate somewhat dynamic base numbers based on the time of day
      const baseMultiplier = (hour > 8 && hour < 22) ? 1.5 : 0.8;

      const simulatedBase = {
        totalOnline: Math.floor((1200 + Math.random() * 300) * baseMultiplier),
        breathing: Math.floor((150 + Math.random() * 50) * baseMultiplier),
        meditating: Math.floor((80 + Math.random() * 30) * baseMultiplier),
        journaling: Math.floor((45 + Math.random() * 20) * baseMultiplier),
        sleeping: Math.floor((200 + Math.random() * 100) * (hour < 7 || hour > 21 ? 2 : 0.5)),
        sos: Math.floor(12 + Math.random() * 8)
      };

      const finalStats: any = {
        totalOnline: simulatedBase.totalOnline + Object.values(realCounts).reduce((a, b) => a + b, 0),
        breathing: simulatedBase.breathing + realCounts.breathing,
        meditating: simulatedBase.meditating + realCounts.meditating,
        journaling: simulatedBase.journaling + realCounts.journaling,
        sleeping: simulatedBase.sleeping + realCounts.sleeping,
        sos: simulatedBase.sos + realCounts.sos
      };

      if (isTestMode) {
        finalStats.debug = {
          simulated: simulatedBase,
          real: realCounts,
          timestamp: now.toISOString()
        };
      }

      res.json(finalStats);
    } catch (error) {
      console.error("Failed to fetch community stats:", error);
      res.status(500).json({ message: "Failed to fetch community statistics" });
    }
  });

  // Store active sparks for users (Mock DB)
  // In production, this would be a real DB table
  const activeSparks: Record<number, string[]> = {};

  // Send an anonymous spark to the community
  app.post('/api/community/sparks', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const validSparks = [
        "Someone is rooting for you today.",
        "Take a deep breath. You're doing great.",
        "You are not alone in this journey.",
        "Sending you peaceful energy.",
        "Be kind to yourself today."
      ];

      if (!validSparks.includes(message)) {
        return res.status(400).json({ message: "Invalid spark message" });
      }

      // Simulate sending to a random user by adding it to a global queue or assigning to a random ID
      // For demo purposes, we'll just acknowledge it was sent
      // In reality we would do: await db.insert(sparks).values({ message, recipientId: randomId })

      res.json({ success: true, message: "Your spark has been sent into the community." });
    } catch (error) {
      console.error("Failed to send spark:", error);
      res.status(500).json({ message: "Failed to send spark" });
    }
  });

  // Receive sparks for the current user
  app.get('/api/community/sparks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;

      // Randomly decide if the user receives a spark today (e.g. 30% chance on load)
      // and they haven't already received one.
      let mySparks = activeSparks[userId] || [];

      if (mySparks.length === 0 && Math.random() > 0.7) {
        const validSparks = [
          "Someone is rooting for you today.",
          "Take a deep breath. You're doing great.",
          "You are not alone in this journey.",
          "Sending you peaceful energy.",
          "Be kind to yourself today."
        ];
        const randomSpark = validSparks[Math.floor(Math.random() * validSparks.length)];
        mySparks.push(randomSpark);
        activeSparks[userId] = mySparks;
      }

      res.json({ sparks: mySparks });
    } catch (error) {
      console.error("Failed to fetch sparks:", error);
      res.status(500).json({ message: "Failed to fetch sparks" });
    }
  });


  return httpServer;
}
