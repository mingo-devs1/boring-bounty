-- Fix submit_application function to use SECURITY DEFINER to bypass RLS
-- This allows the function to insert/update submissions table when called by builders
-- Now updates existing submission instead of creating a new one

DROP FUNCTION IF EXISTS submit_application(p_application_id UUID, p_user_id UUID);

CREATE FUNCTION submit_application(p_application_id UUID, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_bounty_id UUID;
  v_github_link TEXT;
  v_demo_link TEXT;
  v_description TEXT;
  v_submission_id UUID;
BEGIN
  -- Get application details
  SELECT bounty_id, github_link, demo_link, description
  INTO v_bounty_id, v_github_link, v_demo_link, v_description
  FROM applications
  WHERE id = p_application_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Check if submission already exists for this application
  SELECT id INTO v_submission_id
  FROM submissions
  WHERE bounty_id = v_bounty_id AND user_id = p_user_id;

  IF v_submission_id IS NOT NULL THEN
    -- Update existing submission
    UPDATE submissions
    SET
      github_link = v_github_link,
      demo_link = v_demo_link,
      description = v_description,
      last_edited_at = NOW()
    WHERE id = v_submission_id;

    -- Update categories - delete old ones and insert new ones
    DELETE FROM submission_categories WHERE submission_id = v_submission_id;
    INSERT INTO submission_categories (submission_id, category_id)
    SELECT v_submission_id, category_id
    FROM application_categories
    WHERE application_id = p_application_id;
  ELSE
    -- Create new submission
    INSERT INTO submissions (bounty_id, user_id, github_link, demo_link, description)
    VALUES (v_bounty_id, p_user_id, v_github_link, v_demo_link, v_description)
    RETURNING id INTO v_submission_id;

    -- Copy categories from application to submission
    INSERT INTO submission_categories (submission_id, category_id)
    SELECT v_submission_id, category_id
    FROM application_categories
    WHERE application_id = p_application_id;
  END IF;

  -- Update application status
  UPDATE applications
  SET status = 'submitted', submitted_at = NOW()
  WHERE id = p_application_id;

  RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
