import {
  users,
  userAuthProviders,
  assessments,
  conversationAssessments,
  treatmentPlans,
  treatmentModules,
  progressEntries,
  crisisAlerts,
  subscriptionPlans,
  userSubscriptions,
  payments,
  auditLogs,
  usageMetrics,
  supportTickets,
  type User,
  type UpsertUser,
  type UserAuthProvider,
  type InsertUserAuthProvider,
  type Assessment,
  type InsertAssessment,
  type ConversationAssessment,
  type InsertConversationAssessment,
  type TreatmentPlan,
  type InsertTreatmentPlan,
  type TreatmentModule,
  type InsertTreatmentModule,
  type ProgressEntry,
  type InsertProgressEntry,
  type CrisisAlert,
  type InsertCrisisAlert,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
  type Payment,
  type InsertPayment,
  type AuditLog,
  type InsertAuditLog,
  type UsageMetric,
  type InsertUsageMetric,
  type SupportTicket,
  type InsertSupportTicket,
  resilienceTrends,
  type ResilienceTrend,
  type InsertResilienceTrend,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Multi-auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  getUserByResetToken(token: string): Promise<User | undefined>;

  // Auth provider operations  
  createAuthProvider(provider: InsertUserAuthProvider): Promise<UserAuthProvider>;
  getAuthProvider(provider: string, providerId: string): Promise<UserAuthProvider | undefined>;
  getAuthProvidersByUser(userId: string): Promise<UserAuthProvider[]>;
  updateAuthProvider(id: string, updates: Partial<UserAuthProvider>): Promise<UserAuthProvider>;

  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentsByUser(userId: string): Promise<Assessment[]>;

  // Conversational assessment operations
  createConversationAssessment(data: InsertConversationAssessment): Promise<ConversationAssessment>;
  getConversationAssessment(id: string): Promise<ConversationAssessment | undefined>;
  appendConversationTurn(id: string, turn: any, checkpoint?: any): Promise<ConversationAssessment>;
  finalizeConversationAssessment(id: string, summaryInsights: any, assessmentId?: string): Promise<ConversationAssessment>;

  // Treatment plan operations
  createTreatmentPlan(plan: InsertTreatmentPlan): Promise<TreatmentPlan>;
  getTreatmentPlan(id: string): Promise<TreatmentPlan | undefined>;
  getTreatmentPlansByUser(userId: string): Promise<TreatmentPlan[]>;
  updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan>;

  // Treatment module operations
  createTreatmentModule(module: InsertTreatmentModule): Promise<TreatmentModule>;
  getTreatmentModulesByPlan(planId: string): Promise<TreatmentModule[]>;
  updateTreatmentModule(id: string, updates: Partial<TreatmentModule>): Promise<TreatmentModule>;

  // Progress tracking operations
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  getProgressEntriesByPlan(planId: string): Promise<ProgressEntry[]>;
  getProgressEntriesByUser(userId: string, startDate?: Date, endDate?: Date): Promise<ProgressEntry[]>;

  // Crisis alert operations
  createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert>;
  getCrisisAlerts(resolved?: boolean): Promise<CrisisAlert[]>;
  resolveCrisisAlert(id: string, resolvedBy: string): Promise<CrisisAlert>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllAssessments(): Promise<Assessment[]>;
  getRecentAssessments(limit?: number): Promise<Assessment[]>;

  // Subscription operations
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;

  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined>;
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription>;

  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getPaymentsBySubscription(subscriptionId: string): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;

  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, limit?: number): Promise<AuditLog[]>;

  createUsageMetric(metric: InsertUsageMetric): Promise<UsageMetric>;
  getUserUsageMetrics(userId: string, metricType?: string): Promise<UsageMetric[]>;

  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // User activity completions
  getWellnessActivities(category?: string): Promise<any[]>;
  getWellnessActivity(id: string): Promise<any | undefined>;
  createActivityCompletion(completion: any): Promise<any>;
  getActivityCompletionsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  // Resilience trend operations
  createResilienceTrend(trend: InsertResilienceTrend): Promise<ResilienceTrend>;
  getResilienceTrendsByUser(userId: string): Promise<ResilienceTrend[]>;
  getResilienceTrendsByCoach(coachId: string): Promise<ResilienceTrend[]>;

  resetUserProgress(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Multi-auth operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
    return user;
  }

  // Auth provider operations
  async createAuthProvider(provider: InsertUserAuthProvider): Promise<UserAuthProvider> {
    const [authProvider] = await db
      .insert(userAuthProviders)
      .values(provider)
      .returning();
    return authProvider;
  }

  async getAuthProvider(provider: string, providerId: string): Promise<UserAuthProvider | undefined> {
    const [authProvider] = await db
      .select()
      .from(userAuthProviders)
      .where(and(eq(userAuthProviders.provider, provider as any), eq(userAuthProviders.providerId, providerId)));
    return authProvider;
  }

  async getAuthProvidersByUser(userId: string): Promise<UserAuthProvider[]> {
    return await db
      .select()
      .from(userAuthProviders)
      .where(eq(userAuthProviders.userId, userId));
  }

  async updateAuthProvider(id: string, updates: Partial<UserAuthProvider>): Promise<UserAuthProvider> {
    const [authProvider] = await db
      .update(userAuthProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userAuthProviders.id, id))
      .returning();
    return authProvider;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
    return assessment;
  }

  async getAssessmentsByUser(userId: string): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }

  // Conversational assessment operations
  async createConversationAssessment(data: InsertConversationAssessment): Promise<ConversationAssessment> {
    const [newConversation] = await db
      .insert(conversationAssessments)
      .values(data)
      .returning();
    return newConversation;
  }

  async getConversationAssessment(id: string): Promise<ConversationAssessment | undefined> {
    const [conversation] = await db
      .select()
      .from(conversationAssessments)
      .where(eq(conversationAssessments.id, id));
    return conversation;
  }

  async appendConversationTurn(id: string, turn: any, checkpoint?: any): Promise<ConversationAssessment> {
    const conversation = await this.getConversationAssessment(id);
    if (!conversation) {
      throw new Error("Conversation assessment not found");
    }

    const transcript = conversation.conversationTranscript as any[] || [];
    transcript.push(turn);

    const checkpoints = conversation.aiCheckpoints as any[] || [];
    if (checkpoint) {
      checkpoints.push(checkpoint);
    }

    const [updated] = await db
      .update(conversationAssessments)
      .set({
        conversationTranscript: transcript,
        aiCheckpoints: checkpoints,
        updatedAt: new Date()
      })
      .where(eq(conversationAssessments.id, id))
      .returning();

    return updated;
  }

  async finalizeConversationAssessment(id: string, summaryInsights: any, assessmentId?: string): Promise<ConversationAssessment> {
    const [updated] = await db
      .update(conversationAssessments)
      .set({
        status: 'completed',
        summaryInsights,
        assessmentId,
        updatedAt: new Date()
      })
      .where(eq(conversationAssessments.id, id))
      .returning();

    return updated;
  }

  // Treatment plan operations
  async createTreatmentPlan(plan: InsertTreatmentPlan): Promise<TreatmentPlan> {
    const [newPlan] = await db
      .insert(treatmentPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getTreatmentPlan(id: string): Promise<TreatmentPlan | undefined> {
    const [plan] = await db
      .select()
      .from(treatmentPlans)
      .where(eq(treatmentPlans.id, id));
    return plan;
  }

  async getTreatmentPlansByUser(userId: string): Promise<TreatmentPlan[]> {
    return await db
      .select()
      .from(treatmentPlans)
      .where(eq(treatmentPlans.userId, userId))
      .orderBy(desc(treatmentPlans.createdAt));
  }

  async updateTreatmentPlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    const [updatedPlan] = await db
      .update(treatmentPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(treatmentPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Treatment module operations
  async createTreatmentModule(module: InsertTreatmentModule): Promise<TreatmentModule> {
    const [newModule] = await db
      .insert(treatmentModules)
      .values(module)
      .returning();
    return newModule;
  }

  async getTreatmentModulesByPlan(planId: string): Promise<TreatmentModule[]> {
    return await db
      .select()
      .from(treatmentModules)
      .where(eq(treatmentModules.planId, planId))
      .orderBy(treatmentModules.week, treatmentModules.order);
  }

  async updateTreatmentModule(id: string, updates: Partial<TreatmentModule>): Promise<TreatmentModule> {
    const [updatedModule] = await db
      .update(treatmentModules)
      .set(updates)
      .where(eq(treatmentModules.id, id))
      .returning();
    return updatedModule;
  }

  // Progress tracking operations
  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const [newEntry] = await db
      .insert(progressEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getProgressEntriesByPlan(planId: string): Promise<ProgressEntry[]> {
    return await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.planId, planId))
      .orderBy(desc(progressEntries.date));
  }

  async getProgressEntriesByUser(userId: string, startDate?: Date, endDate?: Date): Promise<ProgressEntry[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(progressEntries)
        .where(
          and(
            eq(progressEntries.userId, userId),
            gte(progressEntries.date, startDate),
            lte(progressEntries.date, endDate)
          )
        )
        .orderBy(desc(progressEntries.date));
    }

    return await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId))
      .orderBy(desc(progressEntries.date));
  }

  // Crisis alert operations
  async createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert> {
    const [newAlert] = await db
      .insert(crisisAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getCrisisAlerts(resolved?: boolean): Promise<CrisisAlert[]> {
    if (resolved !== undefined) {
      return await db
        .select()
        .from(crisisAlerts)
        .where(eq(crisisAlerts.resolved, resolved))
        .orderBy(desc(crisisAlerts.createdAt));
    }

    return await db
      .select()
      .from(crisisAlerts)
      .orderBy(desc(crisisAlerts.createdAt));
  }

  async resolveCrisisAlert(id: string, resolvedBy: string): Promise<CrisisAlert> {
    const [resolvedAlert] = await db
      .update(crisisAlerts)
      .set({
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(crisisAlerts.id, id))
      .returning();
    return resolvedAlert;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .orderBy(desc(assessments.createdAt));
  }

  async getRecentAssessments(limit: number = 10): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .orderBy(desc(assessments.createdAt))
      .limit(limit);
  }

  // Subscription operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getSubscriptionPlans(activeOnly?: boolean): Promise<SubscriptionPlan[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price);
    }

    return await db
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.price);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
    return subscription;
  }

  async getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsBySubscription(subscriptionId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.subscriptionId, subscriptionId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAuditLogs(entityType?: string, limit: number = 100): Promise<AuditLog[]> {
    if (entityType) {
      return await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityType, entityType))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async createUsageMetric(metric: InsertUsageMetric): Promise<UsageMetric> {
    const [newMetric] = await db
      .insert(usageMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getUserUsageMetrics(userId: string, metricType?: string): Promise<UsageMetric[]> {
    if (metricType) {
      return await db
        .select()
        .from(usageMetrics)
        .where(
          and(
            eq(usageMetrics.userId, userId),
            eq(usageMetrics.metricType, metricType)
          )
        )
        .orderBy(desc(usageMetrics.createdAt));
    }

    return await db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.userId, userId))
      .orderBy(desc(usageMetrics.createdAt));
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updates: Partial<User> = {
      stripeCustomerId,
      updatedAt: new Date(),
    };

    if (stripeSubscriptionId) {
      updates.stripeSubscriptionId = stripeSubscriptionId;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // User activity completions
  async getWellnessActivities(category?: string): Promise<any[]> {
    const { wellnessActivities } = await import("@shared/schema");
    if (category && category !== 'all') {
      return await db.select().from(wellnessActivities).where(eq(wellnessActivities.category, category));
    }
    return await db.select().from(wellnessActivities);
  }

  async getWellnessActivity(id: string): Promise<any | undefined> {
    const { wellnessActivities } = await import("@shared/schema");
    const [activity] = await db.select().from(wellnessActivities).where(eq(wellnessActivities.id, id));
    return activity;
  }

  async createActivityCompletion(completion: any): Promise<any> {
    const { userActivityCompletions } = await import("@shared/schema");
    const [newCompletion] = await db.insert(userActivityCompletions).values(completion).returning();
    return newCompletion;
  }

  async getActivityCompletionsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const { userActivityCompletions } = await import("@shared/schema");
    if (startDate && endDate) {
      return await db
        .select()
        .from(userActivityCompletions)
        .where(
          and(
            eq(userActivityCompletions.userId, userId),
            gte(userActivityCompletions.completedAt, startDate),
            lte(userActivityCompletions.completedAt, endDate)
          )
        )
        .orderBy(desc(userActivityCompletions.completedAt));
    }
    return await db
      .select()
      .from(userActivityCompletions)
      .where(eq(userActivityCompletions.userId, userId))
      .orderBy(desc(userActivityCompletions.completedAt));
  }

  // Resilience trend operations
  async createResilienceTrend(trend: InsertResilienceTrend): Promise<ResilienceTrend> {
    const [newTrend] = await db
      .insert(resilienceTrends)
      .values(trend)
      .returning();
    return newTrend;
  }

  async getResilienceTrendsByUser(userId: string): Promise<ResilienceTrend[]> {
    return await db
      .select()
      .from(resilienceTrends)
      .where(eq(resilienceTrends.userId, userId))
      .orderBy(desc(resilienceTrends.recordedAt));
  }

  async getResilienceTrendsByCoach(coachId: string): Promise<ResilienceTrend[]> {
    return await db
      .select()
      .from(resilienceTrends)
      .where(eq(resilienceTrends.coachId, coachId))
      .orderBy(desc(resilienceTrends.recordedAt));
  }

  async resetUserProgress(userId: string): Promise<void> {
    const {
      dailySignals, behaviorProfiles, voiceEntries, voiceAnalyses,
      wellnessPlans, planItems, userGoals, goalProgress,
      wellnessInsights, recommendations, userActivityCompletions,
      userAchievements, userStats, safetyPlans, wellnessReports,
      reportAccessLogs, entries, customFields, flexibleInsights,
      entryRelationships, entryTemplates, views, viewShares,
      viewAccessLog, voiceRealtimeSessions, biomarkerResults,
      wearableDataPoints, mealPlans, supplementProtocols
    } = await import("@shared/schema");

    await db.transaction(async (tx) => {
      // 1. Delete data from related tables
      await tx.delete(progressEntries).where(eq(progressEntries.userId, userId));

      // Fix: Use inArray with a subquery to handle multiple plans
      const userPlanIds = db.select({ id: treatmentPlans.id }).from(treatmentPlans).where(eq(treatmentPlans.userId, userId));
      await tx.delete(treatmentModules).where(inArray(treatmentModules.planId, userPlanIds));

      await tx.delete(treatmentPlans).where(eq(treatmentPlans.userId, userId));
      await tx.delete(assessments).where(eq(assessments.userId, userId));
      await tx.delete(conversationAssessments).where(eq(conversationAssessments.userId, userId));
      await tx.delete(crisisAlerts).where(eq(crisisAlerts.userId, userId));

      // Phase 12+ tables
      await tx.delete(dailySignals).where(eq(dailySignals.userId, userId));
      await tx.delete(behaviorProfiles).where(eq(behaviorProfiles.userId, userId));

      // Other feature tables
      await tx.delete(voiceAnalyses).where(eq(voiceAnalyses.userId, userId));
      await tx.delete(voiceEntries).where(eq(voiceEntries.userId, userId));
      await tx.delete(wellnessPlans).where(eq(wellnessPlans.userId, userId));
      await tx.delete(userGoals).where(eq(userGoals.userId, userId));
      await tx.delete(wellnessInsights).where(eq(wellnessInsights.userId, userId));
      await tx.delete(recommendations).where(eq(recommendations.userId, userId));
      await tx.delete(userActivityCompletions).where(eq(userActivityCompletions.userId, userId));
      await tx.delete(userAchievements).where(eq(userAchievements.userId, userId));
      await tx.delete(safetyPlans).where(eq(safetyPlans.userId, userId));
      await tx.delete(wellnessReports).where(eq(wellnessReports.userId, userId));
      await tx.delete(entries).where(eq(entries.userId, userId));
      await tx.delete(customFields).where(eq(customFields.userId, userId));
      await tx.delete(flexibleInsights).where(eq(flexibleInsights.userId, userId));
      await tx.delete(viewAccessLog).where(eq(viewAccessLog.userId, userId));
      await tx.delete(voiceRealtimeSessions).where(eq(voiceRealtimeSessions.userId, userId));
      await tx.delete(biomarkerResults).where(eq(biomarkerResults.userId, userId));
      await tx.delete(wearableDataPoints).where(eq(wearableDataPoints.userId, userId));
      await tx.delete(mealPlans).where(eq(mealPlans.userId, userId));
      await tx.delete(supplementProtocols).where(eq(supplementProtocols.userId, userId));

      // 2. Reset user stats to defaults
      await tx.update(userStats)
        .set({
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalActivities: 0,
          totalVoiceEntries: 0,
          level: 1,
          experiencePoints: 0,
          lastActivityDate: null,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));

      // 3. Reset profile fields in users table
      await tx.update(users)
        .set({
          postpartumDeliveryDate: null,
          postpartumDeliveryType: null,
          isBreastfeeding: false,
          weight: null,
          height: null,
          age: null,
          activityLevel: null,
          fitnessGoal: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    });
  }
}

export const storage = new DatabaseStorage();
