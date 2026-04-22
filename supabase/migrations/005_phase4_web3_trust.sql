-- Phase 4: Web3 & Trust Layer
-- Reputation System, Enhanced Profiles, Notifications, Smart Contract Escrow

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'submission_update', 'winner_announcement', 'new_bounty', 'payment_sent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon identifier
  criteria JSONB, -- conditions to unlock this achievement
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Add columns to bounties for smart contract escrow
ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS escrow_contract_address TEXT,
  ADD COLUMN IF NOT EXISTS escrow_chain TEXT, -- 'solana', 'ethereum', etc.
  ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'in_escrow', 'released', 'refunded'
  ADD COLUMN IF NOT EXISTS payment_transaction_hash TEXT;

-- Add columns to submissions for payment tracking
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'in_escrow', 'released', 'refunded'
  ADD COLUMN IF NOT EXISTS payment_transaction_hash TEXT,
  ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_bounties_payment_status ON bounties(payment_status);
CREATE INDEX IF NOT EXISTS idx_submissions_payment_status ON submissions(payment_status);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for achievements (public read, admin write)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view user achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can create user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Pre-populate some achievements
INSERT INTO achievements (name, description, icon, criteria) VALUES
  ('First Submission', 'Submitted your first bounty', '🎯', '{"type": "first_submission"}'),
  ('First Win', 'Won your first bounty', '🏆', '{"type": "first_win"}'),
  ('Top Performer', 'Achieved a rating of 4.5 or higher', '⭐', '{"type": "rating", "min_rating": 4.5}'),
  ('Streak Master', 'Won 3 bounties in a row', '🔥', '{"type": "streak", "count": 3}'),
  ('Speed Demon', 'Won a bounty within 24 hours of submission', '⚡', '{"type": "speed", "hours": 24}'),
  ('Community Favorite', 'Received 5 or more positive feedbacks', '💎', '{"type": "feedback", "count": 5}')
ON CONFLICT (name) DO NOTHING;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create notification when submission status changes
CREATE OR REPLACE FUNCTION notify_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify builder about status change
    PERFORM create_notification(
      NEW.user_id,
      'submission_update',
      'Submission Status Updated',
      'Your submission for "' || (SELECT title FROM bounties WHERE id = NEW.bounty_id) || '" is now ' || NEW.status,
      jsonb_build_object(
        'submission_id', NEW.id,
        'bounty_id', NEW.bounty_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_submission_status_change_trigger
  AFTER UPDATE OF status ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_submission_status_change();

-- Trigger: Create notification when winner is selected
CREATE OR REPLACE FUNCTION notify_winner_selected()
RETURNS TRIGGER AS $$
DECLARE
  bounty_title TEXT;
BEGIN
  SELECT title INTO bounty_title FROM bounties WHERE id = NEW.bounty_id;
  
  IF NEW.status = 'won' THEN
    -- Notify winner
    PERFORM create_notification(
      NEW.user_id,
      'winner_announcement',
      'Congratulations! You Won!',
      'You have been selected as the winner for "' || bounty_title || '"',
      jsonb_build_object(
        'submission_id', NEW.id,
        'bounty_id', NEW.bounty_id,
        'reward', (SELECT reward FROM bounties WHERE id = NEW.bounty_id)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_winner_selected_trigger
  AFTER UPDATE OF status ON submissions
  FOR EACH ROW
  WHEN (NEW.status = 'won')
  EXECUTE FUNCTION notify_winner_selected();

-- Trigger: Create notification when new bounty is posted (notify matching builders)
CREATE OR REPLACE FUNCTION notify_new_bounty()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify builders with matching skills (simplified - could be enhanced with skill matching)
  PERFORM create_notification(
    u.id,
    'new_bounty',
    'New Bounty Posted: ' || NEW.title,
    'A new bounty matching your skills has been posted',
    jsonb_build_object(
      'bounty_id', NEW.id,
      'reward', NEW.reward,
      'required_skills', NEW.required_skills
    )
  )
  FROM users u
  WHERE u.role = 'builder'
  AND EXISTS (
    SELECT 1 FROM unnest(NEW.required_skills) skill
    WHERE skill = ANY(u.skills)
  )
  LIMIT 100; -- Limit to first 100 matching builders to avoid spam
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_bounty_trigger
  AFTER INSERT ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_bounty();

-- Function to update builder reputation
CREATE OR REPLACE FUNCTION update_builder_reputation()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
  won_count INTEGER;
  avg_score NUMERIC;
  new_rating NUMERIC;
BEGIN
  -- Count completed bounties
  SELECT COUNT(*) INTO completed_count
  FROM submissions
  WHERE user_id = NEW.user_id
  AND status IN ('won', 'accepted');
  
  -- Count won bounties
  SELECT COUNT(*) INTO won_count
  FROM submissions
  WHERE user_id = NEW.user_id
  AND status = 'won';
  
  -- Calculate average score
  SELECT COALESCE(AVG(final_score), 0) INTO avg_score
  FROM submissions
  WHERE user_id = NEW.user_id
  AND status IN ('won', 'accepted');
  
  -- Calculate new rating (weighted average of score and win rate)
  IF completed_count > 0 THEN
    new_rating = (avg_score * 0.7) + ((won_count::NUMERIC / completed_count) * 100 * 0.3);
  ELSE
    new_rating = 0;
  END IF;
  
  -- Update user
  UPDATE users
  SET 
    rating = new_rating,
    completed_bounties = completed_count
  WHERE id = NEW.user_id;
  
  -- Check for achievements
  PERFORM check_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  achievement RECORD;
  criteria JSONB;
  should_unlock BOOLEAN;
BEGIN
  FOR achievement IN SELECT * FROM achievements LOOP
    criteria := achievement.criteria;
    should_unlock := false;
    
    -- Skip if already unlocked
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check achievement criteria
    IF criteria->>'type' = 'first_submission' THEN
      should_unlock := EXISTS (SELECT 1 FROM submissions WHERE user_id = p_user_id);
    ELSIF criteria->>'type' = 'first_win' THEN
      should_unlock := EXISTS (SELECT 1 FROM submissions WHERE user_id = p_user_id AND status = 'won');
    ELSIF criteria->>'type' = 'rating' THEN
      should_unlock := (SELECT rating FROM users WHERE id = p_user_id) >= (criteria->>'min_rating')::NUMERIC;
    ELSIF criteria->>'type' = 'streak' THEN
      -- Simplified streak check (could be enhanced with proper streak logic)
      should_unlock := (SELECT COUNT(*) FROM submissions WHERE user_id = p_user_id AND status = 'won') >= (criteria->>'count')::INTEGER;
    ELSIF criteria->>'type' = 'speed' THEN
      should_unlock := EXISTS (
        SELECT 1 FROM submissions s
        JOIN bounties b ON s.bounty_id = b.id
        WHERE s.user_id = p_user_id
        AND s.status = 'won'
        AND EXTRACT(EPOCH FROM (s.reviewed_at - s.submitted_at)) / 3600 <= (criteria->>'hours')::NUMERIC
      );
    ELSIF criteria->>'type' = 'feedback' THEN
      -- This would require a feedbacks table - placeholder for now
      should_unlock := false;
    END IF;
    
    -- Unlock achievement
    IF should_unlock THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement.id);
      
      -- Notify user
      PERFORM create_notification(
        p_user_id,
        'achievement_unlocked',
        'Achievement Unlocked!',
        'You earned the "' || achievement.name || '" achievement: ' || achievement.description,
        jsonb_build_object(
          'achievement_id', achievement.id,
          'achievement_name', achievement.name
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update reputation when submission status changes
CREATE TRIGGER update_reputation_on_status_change
  AFTER UPDATE OF status ON submissions
  FOR EACH ROW
  WHEN (NEW.status IN ('won', 'accepted', 'rejected'))
  EXECUTE FUNCTION update_builder_reputation();

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for submission updates, winner announcements, and new bounties';
COMMENT ON TABLE achievements IS 'Achievement badges that builders can unlock';
COMMENT ON TABLE user_achievements IS 'Junction table linking users to unlocked achievements';
COMMENT ON COLUMN bounties.escrow_contract_address IS 'Smart contract address for escrow payment';
COMMENT ON COLUMN bounties.escrow_chain IS 'Blockchain network for escrow (solana, ethereum)';
COMMENT ON COLUMN submissions.payment_status IS 'Payment status: pending, in_escrow, released, refunded';
