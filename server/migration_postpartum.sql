-- Migration to align users table with shared/schema.ts
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id character varying;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postpartum_delivery_date timestamp without time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postpartum_delivery_type character varying(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_breastfeeding boolean DEFAULT false;

-- Handle existing password column if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
    UPDATE users SET password_hash = password WHERE password_hash IS NULL;
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
    ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;

-- Create missing tables for postpartum features
CREATE TABLE IF NOT EXISTS meal_plans (
  id character varying PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL REFERENCES users(id),
  date timestamp without time zone NOT NULL,
  breakfast jsonb,
  lunch jsonb,
  dinner jsonb,
  snacks jsonb,
  nutritional_focus text,
  adaptive_factors jsonb,
  created_at timestamp without time zone DEFAULT now()
 );

CREATE TABLE IF NOT EXISTS biomarker_results (
  id character varying PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL REFERENCES users(id),
  biomarker_name character varying NOT NULL,
  value decimal(10,2) NOT NULL,
  unit character varying,
  tested_at timestamp without time zone NOT NULL,
  source character varying,
  created_at timestamp without time zone DEFAULT now()
);
