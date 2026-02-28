-- Phase 6: Crisis Resources & Safety Features
-- Week 1: HIGHEST PRIORITY - Immediate safety features

-- Crisis Resources Table
CREATE TABLE IF NOT EXISTS crisis_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  country_code VARCHAR(2) NOT NULL,
  region VARCHAR(100),

  resource_type VARCHAR(50) NOT NULL, -- 'hotline', 'text', 'chat', 'emergency'
  name VARCHAR(255) NOT NULL,
  description TEXT,

  phone VARCHAR(50),
  sms_number VARCHAR(50),
  website_url VARCHAR(500),
  chat_url VARCHAR(500),

  available_24_7 BOOLEAN DEFAULT false,
  languages JSONB,

  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_resources_country ON crisis_resources(country_code, is_active);
CREATE INDEX IF NOT EXISTS idx_crisis_resources_type ON crisis_resources(resource_type);

-- Safety Plans Table
CREATE TABLE IF NOT EXISTS safety_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  warning_signs JSONB, -- List of personal warning signs
  coping_strategies JSONB, -- Internal coping methods
  distraction_activities JSONB, -- Things that help distract

  support_contacts JSONB, -- [{name, phone, relationship}]
  professional_contacts JSONB, -- Therapist, doctor contacts

  safe_environment_steps JSONB, -- How to make environment safe
  reasons_to_live JSONB, -- Personal reasons for living

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_plans_user ON safety_plans(user_id);

-- Seed US Crisis Resources
INSERT INTO crisis_resources (country_code, resource_type, name, description, phone, sms_number, website_url, available_24_7, languages, display_order) VALUES
  ('US', 'hotline', '988 Suicide & Crisis Lifeline', 'Free and confidential support for people in distress, prevention and crisis resources', '988', '988', 'https://988lifeline.org', true, '["en", "es"]'::jsonb, 1),

  ('US', 'text', 'Crisis Text Line', 'Free, 24/7 crisis support via text message', null, '741741', 'https://www.crisistextline.org', true, '["en", "es"]'::jsonb, 2),

  ('US', 'hotline', 'SAMHSA National Helpline', 'Treatment referral and information service for mental health and substance use disorders', '1-800-662-4357', null, 'https://www.samhsa.gov/find-help/national-helpline', true, '["en", "es"]'::jsonb, 3),

  ('US', 'hotline', 'Veterans Crisis Line', 'Confidential support for Veterans in crisis and their loved ones', '988', '838255', 'https://www.veteranscrisisline.net', true, '["en", "es"]'::jsonb, 4),

  ('US', 'hotline', 'LGBTQ+ Youth Support (Trevor Project)', 'Crisis intervention and suicide prevention for LGBTQ+ young people', '1-866-488-7386', '678678', 'https://www.thetrevorproject.org', true, '["en", "es"]'::jsonb, 5),

  ('US', 'chat', 'IMAlive Crisis Chat', 'Online crisis network that uses instant messaging for crisis intervention', null, null, 'https://www.imalive.org', true, '["en"]'::jsonb, 6),

  ('US', 'hotline', 'NAMI Helpline', 'Information, referrals and support for mental health concerns', '1-800-950-6264', null, 'https://www.nami.org/help', false, '["en", "es"]'::jsonb, 7),

  ('US', 'hotline', 'Domestic Violence Hotline', 'Support for victims and survivors of domestic violence', '1-800-799-7233', null, 'https://www.thehotline.org', true, '["en", "es", "200+ languages via interpreter"]'::jsonb, 8),

  ('US', 'emergency', '911', 'Emergency services for immediate danger', '911', null, null, true, '["en", "es"]'::jsonb, 0);

-- Seed International Crisis Resources
INSERT INTO crisis_resources (country_code, resource_type, name, description, phone, website_url, available_24_7, languages, display_order) VALUES
  ('CA', 'hotline', 'Canada Suicide Prevention Service', 'Nationwide crisis line for people in Canada', '1-833-456-4566', 'https://www.crisisservicescanada.ca', true, '["en", "fr"]'::jsonb, 1),
  ('CA', 'text', 'Crisis Text Line Canada', 'Free crisis support via text', '45645', 'https://www.crisistextline.ca', true, '["en", "fr"]'::jsonb, 2),

  ('GB', 'hotline', 'Samaritans', 'Confidential support for anyone in distress', '116 123', 'https://www.samaritans.org', true, '["en"]'::jsonb, 1),
  ('GB', 'emergency', '999', 'Emergency services', '999', null, true, '["en"]'::jsonb, 0),

  ('AU', 'hotline', 'Lifeline Australia', 'Crisis support and suicide prevention', '13 11 14', 'https://www.lifeline.org.au', true, '["en"]'::jsonb, 1),
  ('AU', 'hotline', 'Beyond Blue', 'Mental health support', '1300 22 4636', 'https://www.beyondblue.org.au', true, '["en"]'::jsonb, 2),

  ('IN', 'hotline', 'AASRA', 'Suicide prevention hotline', '91-9820466726', 'https://www.aasra.info', true, '["en", "hi"]'::jsonb, 1),

  ('NZ', 'hotline', 'Lifeline Aotearoa', 'Crisis support', '0800 543 354', 'https://www.lifeline.org.nz', true, '["en"]'::jsonb, 1);

SELECT '✅ Phase 6 Week 1: Crisis resources tables created!' as message;
SELECT 'Crisis resources seeded: ' || COUNT(*) as count FROM crisis_resources;
