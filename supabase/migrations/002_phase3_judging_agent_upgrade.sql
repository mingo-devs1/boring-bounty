-- Phase 3: Judging Agent - Enhanced Scoring Upgrade
-- Adds columns for basic_score, ai_score, final_score, and AI feedback details

-- Add new columns to submissions table
ALTER TABLE submissions
  ADD COLUMN basic_score DECIMAL(5, 2) CHECK (basic_score >= 0 AND basic_score <= 100),
  ADD COLUMN ai_score DECIMAL(5, 2) CHECK (ai_score >= 0 AND ai_score <= 100),
  ADD COLUMN final_score DECIMAL(5, 2) CHECK (final_score >= 0 AND final_score <= 100),
  ADD COLUMN ai_feedback JSONB,
  ADD COLUMN ai_strengths TEXT[],
  ADD COLUMN ai_improvements TEXT[],
  ADD COLUMN ai_confidence DECIMAL(5, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  ADD COLUMN ai_cost_estimate DECIMAL(10, 8),
  ADD COLUMN ai_evaluated_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by UUID REFERENCES users(id),
  ADD COLUMN scoring_breakdown JSONB;

-- Update existing submissions: migrate old score to basic_score and final_score
UPDATE submissions
  SET basic_score = score,
      final_score = score
  WHERE score IS NOT NULL AND basic_score IS NULL;

-- Add index for final_score for efficient ranking
CREATE INDEX idx_submissions_final_score ON submissions(final_score DESC);

-- Add index for ai_evaluated_at
CREATE INDEX idx_submissions_ai_evaluated_at ON submissions(ai_evaluated_at DESC);

-- Update status check constraint to include new statuses
ALTER TABLE submissions DROP CONSTRAINT submissions_status_check;
ALTER TABLE submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('pending', 'ai_scored', 'reviewed', 'accepted', 'rejected', 'won'));

-- Update submissions_with_builder view to include new columns
DROP VIEW IF EXISTS submissions_with_builder;
CREATE VIEW submissions_with_builder AS
SELECT 
  s.*,
  u.username as builder_username,
  u.github as builder_github,
  u.portfolio as builder_portfolio,
  u.rating as builder_rating,
  u.completed_bounties as builder_completed_bounties,
  b.title as bounty_title,
  b.reward as bounty_reward,
  b.deadline as bounty_deadline,
  b.required_skills as bounty_required_skills
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN bounties b ON s.bounty_id = b.id;

-- RLS Policy: Only bounty creator can view full AI details
CREATE POLICY "Organizations can view AI details for bounty submissions"
  ON submissions FOR SELECT
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE created_by = (
      SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
    )
  ));

-- Function to update submission status to 'ai_scored' after AI evaluation
CREATE OR REPLACE FUNCTION mark_ai_scored()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ai_score IS NOT NULL AND NEW.ai_evaluated_at IS NOT NULL AND OLD.ai_score IS NULL THEN
    NEW.status = 'ai_scored';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_ai_scored
  AFTER INSERT OR UPDATE ON submissions
  FOR EACH ROW
  WHEN (NEW.ai_score IS NOT NULL AND NEW.ai_evaluated_at IS NOT NULL)
  EXECUTE FUNCTION mark_ai_scored();
