-- Draft Applications Feature
-- Separate application (draft) from submission (submitted)

-- Create applications table for draft submissions
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_link TEXT,
  demo_link TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted'
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_bounty_application UNIQUE (user_id, bounty_id)
);

-- Create application_categories junction table
CREATE TABLE IF NOT EXISTS application_categories (
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (application_id, category_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_bounty_id ON applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_application_categories_application_id ON application_categories(application_id);
CREATE INDEX IF NOT EXISTS idx_application_categories_category_id ON application_categories(category_id);

-- RLS Policies for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Builders can view their own applications
CREATE POLICY "Builders can view their own applications"
  ON applications FOR SELECT
  USING (user_id = auth.uid());

-- Builders can create their own applications
CREATE POLICY "Builders can create their own applications"
  ON applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Builders can update their own draft applications
CREATE POLICY "Builders can update their own draft applications"
  ON applications FOR UPDATE
  USING (user_id = auth.uid() AND status = 'draft');

-- Organizations can view submitted applications for their bounties
CREATE POLICY "Organizations can view submitted applications for their bounties"
  ON applications FOR SELECT
  USING (
    status = 'submitted'
    AND bounty_id IN (
      SELECT id FROM bounties WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for application_categories
ALTER TABLE application_categories ENABLE ROW LEVEL SECURITY;

-- Builders can view categories for their applications
CREATE POLICY "Builders can view categories for their applications"
  ON application_categories FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

-- Builders can add categories to their applications
CREATE POLICY "Builders can add categories to their applications"
  ON application_categories FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

-- Organizations can view categories for submitted applications on their bounties
CREATE POLICY "Organizations can view categories for submitted applications"
  ON application_categories FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications 
      WHERE status = 'submitted'
      AND bounty_id IN (
        SELECT id FROM bounties WHERE created_by = auth.uid()
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_application_updated_at_trigger
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_updated_at();

-- Function to submit application (convert to submission)
CREATE OR REPLACE FUNCTION submit_application(p_application_id UUID, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_bounty_id UUID;
  v_github_link TEXT;
  v_demo_link TEXT;
  v_description TEXT;
  v_category_ids UUID[];
  v_submission_id UUID;
BEGIN
  -- Get application details
  SELECT bounty_id, github_link, demo_link, description
  INTO v_bounty_id, v_github_link, v_demo_link, v_description
  FROM applications
  WHERE id = p_application_id AND user_id = p_user_id AND status = 'draft';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not a draft';
  END IF;
  
  -- Create submission
  INSERT INTO submissions (bounty_id, user_id, github_link, demo_link, description)
  VALUES (v_bounty_id, p_user_id, v_github_link, v_demo_link, v_description)
  RETURNING id INTO v_submission_id;
  
  -- Copy categories from application to submission
  INSERT INTO submission_categories (submission_id, category_id)
  SELECT v_submission_id, category_id
  FROM application_categories
  WHERE application_id = p_application_id;
  
  -- Update application status
  UPDATE applications
  SET status = 'submitted', submitted_at = NOW()
  WHERE id = p_application_id;
  
  RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE applications IS 'Draft applications that builders can save and edit before submitting';
COMMENT ON TABLE application_categories IS 'Junction table linking applications to categories';
COMMENT ON COLUMN applications.status IS 'Status: draft (hidden from orgs) or submitted (visible to orgs)';
