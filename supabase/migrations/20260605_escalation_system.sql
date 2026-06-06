-- Add phone to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add whatsapp column to profiles (if not already present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- Add escalation response columns to bot_feedback
ALTER TABLE bot_feedback ADD COLUMN IF NOT EXISTS admin_answer text;
ALTER TABLE bot_feedback ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE bot_feedback ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'escalation_new', 'escalation_answered'
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
