-- Phase 8 Feature 3: Medication & Treatment Tracker
-- Creates tables for medication management, logging, side effects, and reminders

-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100), -- '10mg', '2 tablets', etc.
  frequency VARCHAR(100), -- 'Once daily', 'Twice daily', 'As needed', etc.
  prescribed_by VARCHAR(255), -- Doctor's name
  prescription_date DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  reason VARCHAR(500), -- Why medication was prescribed
  instructions TEXT, -- Special instructions
  refill_reminder_days INTEGER DEFAULT 7, -- Days before running out to remind
  total_quantity INTEGER, -- Total pills/doses in current prescription
  remaining_quantity INTEGER, -- Pills/doses remaining
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_user
  ON medications(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_medications_user_active
  ON medications(user_id, is_active, start_date DESC);

-- Medication Logs (tracking when medications are taken)
CREATE TABLE IF NOT EXISTS medication_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  taken_at TIMESTAMP NOT NULL,
  dosage_taken VARCHAR(100), -- Actual dosage taken (might differ from prescribed)
  was_taken BOOLEAN NOT NULL DEFAULT true, -- false if skipped
  skip_reason TEXT,
  notes TEXT,
  mood_before INTEGER, -- 1-10
  mood_after INTEGER, -- 1-10 (logged later)
  side_effects_experienced TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_medication
  ON medication_logs(medication_id, taken_at DESC);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date
  ON medication_logs(medication_id, DATE(taken_at));

-- Side Effects (detailed tracking of side effects)
CREATE TABLE IF NOT EXISTS medication_side_effects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  symptom VARCHAR(255) NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 10), -- 1=mild, 10=severe
  occurred_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER, -- How long the side effect lasted
  notes TEXT,
  reported_to_doctor BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_side_effects_medication
  ON medication_side_effects(medication_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_medication_side_effects_severity
  ON medication_side_effects(medication_id, severity DESC);

-- Medication Reminders
CREATE TABLE IF NOT EXISTS medication_reminders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- [0,1,2,3,4,5,6] for Sun-Sat
  is_enabled BOOLEAN DEFAULT true,
  notification_method VARCHAR(50) DEFAULT 'in_app', -- 'in_app', 'email', 'sms'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_medication
  ON medication_reminders(medication_id, is_enabled);

-- Medication Interactions (for warning about drug interactions)
CREATE TABLE IF NOT EXISTS medication_interactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_1_name VARCHAR(255) NOT NULL,
  medication_2_name VARCHAR(255) NOT NULL,
  interaction_severity VARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe', 'contraindicated'
  description TEXT NOT NULL,
  recommendation TEXT,
  source VARCHAR(255), -- Reference source for interaction data
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_interactions_lookup
  ON medication_interactions(medication_1_name, medication_2_name);

-- Medication Effectiveness Tracking
CREATE TABLE IF NOT EXISTS medication_effectiveness (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
  symptoms_improved TEXT[],
  symptoms_unchanged TEXT[],
  symptoms_worsened TEXT[],
  overall_mood INTEGER, -- 1-10
  would_continue BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_effectiveness_medication
  ON medication_effectiveness(medication_id, assessment_date DESC);

-- Medication Refill History
CREATE TABLE IF NOT EXISTS medication_refills (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  refill_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  pharmacy VARCHAR(255),
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_refills_medication
  ON medication_refills(medication_id, refill_date DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_medication_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medications_updated_at_trigger
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_tracker_updated_at();

CREATE TRIGGER medication_reminders_updated_at_trigger
  BEFORE UPDATE ON medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_tracker_updated_at();

-- Function to automatically update remaining quantity when medication is logged
CREATE OR REPLACE FUNCTION update_medication_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.was_taken = true THEN
    UPDATE medications
    SET remaining_quantity = GREATEST(0, remaining_quantity - 1)
    WHERE id = NEW.medication_id
      AND remaining_quantity IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medication_logs_update_quantity_trigger
  AFTER INSERT ON medication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_quantity();
