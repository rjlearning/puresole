CREATE TYPE "public"."assessment_type" AS ENUM('phq9', 'gad7', 'stress_burnout', 'ptsd', 'sleep_quality', 'comprehensive', 'conversation_ai');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('email', 'google', 'twitter');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'feature_request', 'general');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'one_time', 'refund');--> statement-breakpoint
CREATE TYPE "public"."plan_interval" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'completed', 'paused', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('basic', 'premium', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."realtime_session_status" AS ENUM('active', 'completed', 'interrupted');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('minimal', 'mild', 'moderate', 'moderately_severe', 'severe');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'past_due', 'canceled', 'unpaid', 'trialing');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"badge_emoji" varchar(10) DEFAULT '🏆',
	"points" integer DEFAULT 0,
	"tier" varchar(20) DEFAULT 'bronze',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_companion_settings" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"personality" varchar(50) DEFAULT 'empathetic',
	"response_length" varchar(20) DEFAULT 'balanced',
	"crisis_monitoring" boolean DEFAULT true,
	"proactive_check_ins" boolean DEFAULT false,
	"preferred_topics" text[],
	"avoided_topics" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "assessment_type" NOT NULL,
	"responses" jsonb NOT NULL,
	"score" integer DEFAULT 0,
	"severity" "severity" NOT NULL,
	"ai_analysis" text,
	"recommendations" jsonb,
	"risk_factors" jsonb,
	"conversation_assessment_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "biomarker_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"biomarker_type" varchar(100) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"reference_range" varchar(100),
	"tested_at" timestamp NOT NULL,
	"source" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(255) DEFAULT 'New Conversation',
	"mood_before" varchar(50),
	"mood_after" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"emotion_detected" varchar(50),
	"sentiment_score" numeric(3, 2),
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "conversation_status" DEFAULT 'in_progress',
	"conversation_transcript" jsonb NOT NULL,
	"ai_checkpoints" jsonb,
	"summary_insights" jsonb,
	"assessment_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crisis_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"assessment_id" varchar,
	"alert_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"description" text NOT NULL,
	"resolved" boolean DEFAULT false,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crisis_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"region" varchar(100),
	"resource_type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"phone" varchar(50),
	"sms_number" varchar(50),
	"website_url" varchar(500),
	"chat_url" varchar(500),
	"available_24_7" boolean DEFAULT false,
	"languages" jsonb,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"entry_types" jsonb DEFAULT '[]'::jsonb,
	"options" jsonb DEFAULT '[]'::jsonb,
	"validation" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotional_blueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"stress_score" numeric DEFAULT '50',
	"anxiety_score" numeric DEFAULT '40',
	"mood_score" numeric DEFAULT '60',
	"energy_level" numeric DEFAULT '50',
	"sleep_quality" numeric DEFAULT '75',
	"detected_emotions" jsonb DEFAULT '[]',
	"insights" jsonb DEFAULT '[]',
	"wellness_score" numeric DEFAULT '60',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"entry_type" varchar(50) NOT NULL,
	"title" varchar(255),
	"content" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mood_score" integer,
	"energy_level" integer,
	"stress_level" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entry_relationships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"from_entry_id" varchar NOT NULL,
	"to_entry_id" varchar NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"strength" numeric(3, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar(255) NOT NULL,
	"description" text,
	"entry_type" varchar(50) NOT NULL,
	"is_global" boolean DEFAULT false,
	"template_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"icon" varchar(50),
	"color" varchar(50),
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_metadata" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" varchar NOT NULL,
	"width" integer DEFAULT 150,
	"is_frozen" boolean DEFAULT false,
	"is_hidden" boolean DEFAULT false,
	"description" text,
	"formula" text,
	"formula_type" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "field_metadata_field_id_unique" UNIQUE("field_id")
);
--> statement-breakpoint
CREATE TABLE "flexible_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"severity" varchar(20) DEFAULT 'info',
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"related_entry_ids" jsonb DEFAULT '[]'::jsonb,
	"confidence_score" numeric(3, 2),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goal_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" varchar NOT NULL,
	"recorded_at" timestamp DEFAULT now(),
	"value" numeric(10, 2) NOT NULL,
	"percentage" numeric(5, 2),
	"note" text,
	"mood_at_recording" integer
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"breakfast" text,
	"lunch" text,
	"dinner" text,
	"snacks" text,
	"target_calories" integer,
	"target_protein_grams" integer,
	"target_carb_grams" integer,
	"target_fat_grams" integer,
	"breastfeeding_adjustment" boolean DEFAULT false,
	"adaptive_factors" jsonb,
	"recovery_steps" jsonb DEFAULT '[]'::jsonb,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"plan_id" varchar,
	"stripe_payment_intent_id" varchar,
	"stripe_invoice_id" varchar,
	"type" "payment_type" NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "plan_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"item_type" varchar(50) NOT NULL,
	"activity_id" varchar,
	"scheduled_time" varchar(5),
	"estimated_duration" integer,
	"display_order" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"effectiveness_rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "progress_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar,
	"module_id" varchar,
	"date" timestamp NOT NULL,
	"activity_type" varchar NOT NULL,
	"activity_name" varchar NOT NULL,
	"completed" boolean DEFAULT false,
	"notes" text,
	"mood_rating" integer,
	"anxiety_level" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"recommendation_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"activity_id" varchar,
	"reasoning" text,
	"expected_benefit" text,
	"confidence_score" numeric(3, 2),
	"based_on" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"user_feedback" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "report_access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"accessor_type" varchar(50),
	"accessor_id" varchar,
	"ip_address" varchar(50),
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"report_type" varchar(50) NOT NULL,
	"sections" jsonb NOT NULL,
	"default_date_range" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resilience_trends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"coach_id" varchar,
	"trend_data" jsonb NOT NULL,
	"summary" text NOT NULL,
	"next_milestones" jsonb DEFAULT '[]'::jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"warning_signs" jsonb,
	"coping_strategies" jsonb,
	"distraction_activities" jsonb,
	"support_contacts" jsonb,
	"professional_contacts" jsonb,
	"safe_environment_steps" jsonb,
	"reasons_to_live" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" "plan_type" NOT NULL,
	"interval" "plan_interval" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"stripe_price_id" varchar NOT NULL,
	"stripe_product_id" varchar NOT NULL,
	"features" jsonb NOT NULL,
	"assessments_per_month" integer DEFAULT -1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_plans_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "supplement_protocols" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"supplement_name" varchar(255) NOT NULL,
	"dosage" varchar(100),
	"frequency" varchar(100),
	"notes" text,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"category" varchar NOT NULL,
	"priority" varchar NOT NULL,
	"description" text NOT NULL,
	"status" varchar DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "treatment_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"week" integer NOT NULL,
	"order" integer NOT NULL,
	"content" jsonb NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "treatment_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"assessment_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"status" "plan_status" DEFAULT 'active',
	"total_weeks" integer NOT NULL,
	"current_week" integer DEFAULT 1,
	"progress_percentage" numeric(5, 2) DEFAULT '0',
	"modules" jsonb NOT NULL,
	"goals" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"metric_type" varchar NOT NULL,
	"count" integer DEFAULT 1,
	"period" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"unlocked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_completions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_id" varchar NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"duration_actual" integer,
	"effectiveness_rating" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_auth_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_id" varchar NOT NULL,
	"provider_email" varchar,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_feedbacks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category" "feedback_category" NOT NULL,
	"content" text NOT NULL,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"goal_type" varchar(50) NOT NULL,
	"category" varchar(50),
	"target_metric" varchar(100),
	"target_value" numeric(10, 2),
	"current_value" numeric(10, 2) DEFAULT '0',
	"unit" varchar(50),
	"start_date" timestamp NOT NULL,
	"target_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"completion_percentage" numeric(5, 2) DEFAULT '0',
	"why_important" text,
	"reward" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"total_points" integer DEFAULT 0,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"total_activities" integer DEFAULT 0,
	"total_voice_entries" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"experience_points" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"stripe_subscription_id" varchar NOT NULL,
	"stripe_customer_id" varchar NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"is_admin" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"postpartum_delivery_date" timestamp,
	"postpartum_delivery_type" varchar(50),
	"is_breastfeeding" boolean DEFAULT false,
	"weight" numeric(5, 2),
	"height" numeric(5, 2),
	"age" integer,
	"activity_level" varchar(50),
	"fitness_goal" varchar(50),
	"gender" varchar(20),
	"birth_year" integer,
	"physical_pain_points" jsonb DEFAULT '[]'::jsonb,
	"clinical_history" jsonb DEFAULT '[]'::jsonb,
	"dietary_preferences" jsonb DEFAULT '[]'::jsonb,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"primary_mood_struggle" varchar(100),
	"assigned_coach_id" varchar,
	"growth_level" integer DEFAULT 1,
	"free_access_until" timestamp,
	"free_access_note" text,
	"password_reset_token" varchar,
	"password_reset_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "users_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "view_access_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_id" varchar NOT NULL,
	"user_id" varchar,
	"share_token" varchar(32),
	"access_type" varchar(20) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_shares" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_id" varchar NOT NULL,
	"share_token" varchar(32) NOT NULL,
	"permission" varchar(10) DEFAULT 'view',
	"password_hash" varchar(255),
	"expires_at" timestamp with time zone,
	"view_count" integer DEFAULT 0,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar NOT NULL,
	CONSTRAINT "view_shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"table_name" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"view_type" varchar(20) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '[]'::jsonb,
	"sorts" jsonb DEFAULT '[]'::jsonb,
	"visible_fields" jsonb DEFAULT '[]'::jsonb,
	"group_by" varchar(100),
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_favorite" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"journal_entry_id" varchar,
	"primary_emotion" varchar,
	"stress_indicators" jsonb DEFAULT '{}'::jsonb,
	"wellness_score" integer,
	"valence" numeric,
	"arousal" numeric,
	"dominance" numeric,
	"risk_level" varchar,
	"emotion_scores" jsonb DEFAULT '{}'::jsonb,
	"emotion_confidence" numeric,
	"transcript" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voice_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"audio_url" varchar,
	"duration" integer,
	"file_size" integer,
	"transcript" text,
	"transcription" text,
	"mood_before" integer,
	"mood_after" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"ai_analysis" jsonb,
	"emotion_data" jsonb,
	"prosody_data" jsonb,
	"crisis_assessment" jsonb,
	"stress_level" integer,
	"energy_level" integer,
	"recorded_at" timestamp DEFAULT now(),
	"analyzed_at" timestamp,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voice_realtime_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"status" realtime_session_status DEFAULT 'active' NOT NULL,
	"total_chunks_processed" integer DEFAULT 0,
	"emotions_detected" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wearable_data_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"provider" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'beginner',
	"duration" integer NOT NULL,
	"instructions" text NOT NULL,
	"benefits" text,
	"icon_emoji" varchar(10) DEFAULT '🧘',
	"gradient_class" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"data_source" varchar(50),
	"confidence_score" numeric(3, 2),
	"is_actionable" boolean DEFAULT false,
	"recommended_action" text,
	"priority" varchar(20) DEFAULT 'medium',
	"is_read" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"relevant_from" timestamp DEFAULT now(),
	"relevant_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"plan_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"target_date" timestamp NOT NULL,
	"generated_by" varchar(50) DEFAULT 'ai',
	"reasoning" text,
	"priority_focus" varchar(100),
	"baseline_mood_score" integer,
	"baseline_stress_level" integer,
	"baseline_energy_level" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wellness_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"data" jsonb NOT NULL,
	"summary" text,
	"key_insights" jsonb,
	"pdf_url" varchar(500),
	"pdf_size" integer,
	"share_code" varchar(50),
	"share_expires_at" timestamp,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	"downloaded_count" integer DEFAULT 0,
	"last_downloaded_at" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"generation_error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_companion_settings" ADD CONSTRAINT "ai_companion_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_entry_id_voice_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."voice_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_conversation_assessment_id_conversation_assessments_id_fk" FOREIGN KEY ("conversation_assessment_id") REFERENCES "public"."conversation_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biomarker_results" ADD CONSTRAINT "biomarker_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assessments" ADD CONSTRAINT "conversation_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assessments" ADD CONSTRAINT "conversation_assessments_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_insights" ADD CONSTRAINT "conversation_insights_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_alerts" ADD CONSTRAINT "crisis_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_alerts" ADD CONSTRAINT "crisis_alerts_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crisis_alerts" ADD CONSTRAINT "crisis_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotional_blueprints" ADD CONSTRAINT "emotional_blueprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_relationships" ADD CONSTRAINT "entry_relationships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_relationships" ADD CONSTRAINT "entry_relationships_from_entry_id_entries_id_fk" FOREIGN KEY ("from_entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_relationships" ADD CONSTRAINT "entry_relationships_to_entry_id_entries_id_fk" FOREIGN KEY ("to_entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_templates" ADD CONSTRAINT "entry_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_metadata" ADD CONSTRAINT "field_metadata_field_id_custom_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexible_insights" ADD CONSTRAINT "flexible_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_user_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."user_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_plan_id_wellness_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."wellness_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_plan_id_treatment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_module_id_treatment_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."treatment_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_access_logs" ADD CONSTRAINT "report_access_logs_report_id_wellness_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."wellness_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resilience_trends" ADD CONSTRAINT "resilience_trends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resilience_trends" ADD CONSTRAINT "resilience_trends_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_plans" ADD CONSTRAINT "safety_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplement_protocols" ADD CONSTRAINT "supplement_protocols_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_modules" ADD CONSTRAINT "treatment_modules_plan_id_treatment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_completions" ADD CONSTRAINT "user_activity_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_completions" ADD CONSTRAINT "user_activity_completions_activity_id_wellness_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."wellness_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_auth_providers" ADD CONSTRAINT "user_auth_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedbacks" ADD CONSTRAINT "user_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_access_log" ADD CONSTRAINT "view_access_log_view_id_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_access_log" ADD CONSTRAINT "view_access_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_shares" ADD CONSTRAINT "view_shares_view_id_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_shares" ADD CONSTRAINT "view_shares_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_analyses" ADD CONSTRAINT "voice_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_analyses" ADD CONSTRAINT "voice_analyses_journal_entry_id_voice_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."voice_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_entries" ADD CONSTRAINT "voice_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_realtime_sessions" ADD CONSTRAINT "voice_realtime_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearable_data_points" ADD CONSTRAINT "wearable_data_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_insights" ADD CONSTRAINT "wellness_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_plans" ADD CONSTRAINT "wellness_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_reports" ADD CONSTRAINT "wellness_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_crisis_resources_country" ON "crisis_resources" USING btree ("country_code","is_active");--> statement-breakpoint
CREATE INDEX "idx_crisis_resources_type" ON "crisis_resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_custom_fields_user_id" ON "custom_fields" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_entries_user_id" ON "entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_entries_entry_type" ON "entries" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "idx_entries_recorded_at" ON "entries" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_entries_user_type_date" ON "entries" USING btree ("user_id","entry_type","recorded_at");--> statement-breakpoint
CREATE INDEX "idx_entries_deleted_at" ON "entries" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_relationships_user_id" ON "entry_relationships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_from_entry" ON "entry_relationships" USING btree ("from_entry_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_to_entry" ON "entry_relationships" USING btree ("to_entry_id");--> statement-breakpoint
CREATE INDEX "idx_templates_user_id" ON "entry_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_templates_entry_type" ON "entry_templates" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "idx_templates_global" ON "entry_templates" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "idx_field_metadata_field_id" ON "field_metadata" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "idx_flexible_insights_user_id" ON "flexible_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_flexible_insights_status" ON "flexible_insights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_flexible_insights_type" ON "flexible_insights" USING btree ("insight_type");--> statement-breakpoint
CREATE INDEX "idx_flexible_insights_created_at" ON "flexible_insights" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_report_access_logs_report" ON "report_access_logs" USING btree ("report_id","accessed_at");--> statement-breakpoint
CREATE INDEX "idx_safety_plans_user" ON "safety_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_unique" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "unique_user_provider" ON "user_auth_providers" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "unique_provider_id" ON "user_auth_providers" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "idx_view_access_view_id" ON "view_access_log" USING btree ("view_id","accessed_at");--> statement-breakpoint
CREATE INDEX "idx_view_access_user_id" ON "view_access_log" USING btree ("user_id","accessed_at");--> statement-breakpoint
CREATE INDEX "idx_view_shares_token" ON "view_shares" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_view_shares_view_id" ON "view_shares" USING btree ("view_id");--> statement-breakpoint
CREATE INDEX "idx_views_user_id" ON "views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_views_table_name" ON "views" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "idx_views_user_table" ON "views" USING btree ("user_id","table_name");--> statement-breakpoint
CREATE INDEX "idx_wellness_reports_user" ON "wellness_reports" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_wellness_reports_share_code" ON "wellness_reports" USING btree ("share_code");--> statement-breakpoint
CREATE INDEX "idx_wellness_reports_status" ON "wellness_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wellness_reports_date_range" ON "wellness_reports" USING btree ("user_id","start_date","end_date");