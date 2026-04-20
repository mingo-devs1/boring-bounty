-- Phase 3 Final: Add Scoring Weights to Bounties Table
-- Allows organizations to configure custom scoring weights per bounty

-- Add scoring_weights column to bounties table
ALTER TABLE bounties
  ADD COLUMN scoring_weights JSONB DEFAULT '{
    "basic_score": 0.6,
    "ai_score": 0.4,
    "github_link": 20,
    "demo_link": 20,
    "description_quality": 30,
    "skill_match": 30
  }'::jsonb;

-- Add index for scoring weights (optional, for future queries)
CREATE INDEX idx_bounties_scoring_weights ON bounties USING GIN(scoring_weights);

-- Comment to explain the scoring weights structure
COMMENT ON COLUMN bounties.scoring_weights IS 'JSONB configuration for custom scoring weights per bounty. Structure: { basic_score (0-1), ai_score (0-1), github_link (0-100), demo_link (0-100), description_quality (0-100), skill_match (0-100) }';
