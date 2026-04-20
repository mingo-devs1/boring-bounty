-- Add Categories and Edit Submission Features

-- Create categories table (bounty-specific)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_bounty_category_name UNIQUE (bounty_id, name)
);

-- Create submission_categories junction table (many-to-many)
CREATE TABLE IF NOT EXISTS submission_categories (
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (submission_id, category_id)
);

-- Add columns to submissions table for edit tracking
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_bounty_id ON categories(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submission_categories_submission_id ON submission_categories(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_categories_category_id ON submission_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_at ON submissions(reviewed_at);

-- RLS Policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Organizations can view categories for their bounties
CREATE POLICY "Organizations can view categories for their bounties"
  ON categories FOR SELECT
  USING (
    bounty_id IN (
      SELECT id FROM bounties WHERE created_by = auth.uid()
    )
  );

-- Organizations can create categories for their bounties
CREATE POLICY "Organizations can create categories for their bounties"
  ON categories FOR INSERT
  WITH CHECK (
    bounty_id IN (
      SELECT id FROM bounties WHERE created_by = auth.uid()
    )
  );

-- Organizations can update categories for their bounties
CREATE POLICY "Organizations can update categories for their bounties"
  ON categories FOR UPDATE
  USING (
    bounty_id IN (
      SELECT id FROM bounties WHERE created_by = auth.uid()
    )
  );

-- Organizations can delete categories for their bounties
CREATE POLICY "Organizations can delete categories for their bounties"
  ON categories FOR DELETE
  USING (
    bounty_id IN (
      SELECT id FROM bounties WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for submission_categories
ALTER TABLE submission_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view submission_categories
CREATE POLICY "Everyone can view submission_categories"
  ON submission_categories FOR SELECT
  USING (true);

-- Builders can create submission_categories for their submissions
CREATE POLICY "Builders can create submission_categories for their submissions"
  ON submission_categories FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM submissions WHERE user_id = auth.uid()
    )
  );

-- Builders can delete submission_categories for their submissions
CREATE POLICY "Builders can delete submission_categories for their submissions"
  ON submission_categories FOR DELETE
  USING (
    submission_id IN (
      SELECT id FROM submissions WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE categories IS 'Bounty-specific categories that builders can apply for';
COMMENT ON TABLE submission_categories IS 'Junction table linking submissions to categories (many-to-many)';
COMMENT ON COLUMN submissions.reviewed_at IS 'Timestamp when submission was first reviewed by organization';
COMMENT ON COLUMN submissions.last_edited_at IS 'Timestamp of last edit by builder';

-- Update submissions_with_builder view to include categories and bounty deadline
DROP VIEW IF EXISTS submissions_with_builder;

CREATE VIEW submissions_with_builder AS
SELECT 
  s.*,
  u.username as builder_username,
  u.rating as builder_rating,
  u.github as builder_github,
  u.portfolio as builder_portfolio,
  b.title as bounty_title,
  b.reward as bounty_reward,
  b.deadline as bounty_deadline,
  b.created_by as bounty_created_by,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::jsonb
  ) as categories
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN bounties b ON s.bounty_id = b.id
LEFT JOIN submission_categories sc ON s.id = sc.submission_id
LEFT JOIN categories c ON sc.category_id = c.id
GROUP BY 
  s.id, u.username, u.rating, u.github, u.portfolio, 
  b.title, b.reward, b.deadline, b.created_by;
