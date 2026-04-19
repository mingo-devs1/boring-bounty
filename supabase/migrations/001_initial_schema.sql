-- BORING BOUNTY - Initial Schema Migration
-- Complete database schema with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('builder', 'organization', 'hiring_manager')),
    username TEXT UNIQUE,
    
    -- Builder-specific fields
    telegram TEXT,
    bio TEXT,
    skills TEXT[],
    github TEXT,
    portfolio TEXT,
    cv TEXT,
    linkedin TEXT,
    x TEXT,
    
    -- Organization/Hiring Manager specific fields
    name TEXT,
    description TEXT,
    website TEXT,
    
    -- Reputation fields
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    completed_bounties INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOUNTIES TABLE
-- =====================================================
CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward DECIMAL(12, 2) NOT NULL CHECK (reward >= 0),
    deadline TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    required_skills TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    
    -- Industry categorization
    industry TEXT CHECK (industry IN ('AI', 'Web3', 'Crypto', 'Robotics', 'DeFi', 'Gaming', 'Infrastructure', 'Other')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_link TEXT,
    demo_link TEXT,
    description TEXT NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'won')),
    score DECIMAL(5, 2) CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating ON users(rating DESC);

-- Bounties indexes
CREATE INDEX idx_bounties_created_by ON bounties(created_by);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_deadline ON bounties(deadline);
CREATE INDEX idx_bounties_industry ON bounties(industry);
CREATE INDEX idx_bounties_reward ON bounties(reward DESC);
CREATE INDEX idx_bounties_created_at ON bounties(created_at DESC);

-- Submissions indexes
CREATE INDEX idx_submissions_bounty_id ON submissions(bounty_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_score ON submissions(score DESC);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- GIN indexes for array fields
CREATE INDEX idx_bounties_required_skills ON bounties USING GIN(required_skills);
CREATE INDEX idx_users_skills ON users USING GIN(skills);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Users updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_users()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_users();

-- Bounties updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_bounties()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bounties_updated_at
    BEFORE UPDATE ON bounties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_bounties();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS RLS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = wallet_address OR id = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text LIMIT 1
    ));

-- Users can read public profiles of other users (read-only fields)
CREATE POLICY "Users can read public profiles"
    ON users FOR SELECT
    USING (true);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid()::text = wallet_address);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = wallet_address OR id = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text LIMIT 1
    ));

-- =====================================================
-- BOUNTIES RLS POLICIES
-- =====================================================

-- Everyone can read open bounties
CREATE POLICY "Everyone can read open bounties"
    ON bounties FOR SELECT
    USING (status = 'open');

-- Organizations can read their own bounties (including closed)
CREATE POLICY "Organizations can read own bounties"
    ON bounties FOR SELECT
    USING (created_by = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
    ));

-- Organizations can create bounties
CREATE POLICY "Organizations can create bounties"
    ON bounties FOR INSERT
    WITH CHECK (created_by = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
    ));

-- Organizations can update their own bounties
CREATE POLICY "Organizations can update own bounties"
    ON bounties FOR UPDATE
    USING (created_by = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
    ));

-- Organizations can delete their own bounties
CREATE POLICY "Organizations can delete own bounties"
    ON bounties FOR DELETE
    USING (created_by = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
    ));

-- =====================================================
-- SUBMISSIONS RLS POLICIES
-- =====================================================

-- Builders can read their own submissions
CREATE POLICY "Builders can read own submissions"
    ON submissions FOR SELECT
    USING (user_id = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text LIMIT 1
    ));

-- Organizations can read submissions for their bounties
CREATE POLICY "Organizations can read bounty submissions"
    ON submissions FOR SELECT
    USING (bounty_id IN (
        SELECT id FROM bounties WHERE created_by = (
            SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
        )
    ));

-- Builders can create submissions
CREATE POLICY "Builders can create submissions"
    ON submissions FOR INSERT
    WITH CHECK (user_id = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role = 'builder' LIMIT 1
    ));

-- Builders can update their own submissions (before review)
CREATE POLICY "Builders can update own submissions"
    ON submissions FOR UPDATE
    USING (user_id = (
        SELECT id FROM users WHERE wallet_address = auth.uid()::text LIMIT 1
    ) AND status = 'pending');

-- Organizations can update submissions for their bounties (review)
CREATE POLICY "Organizations can review submissions"
    ON submissions FOR UPDATE
    USING (bounty_id IN (
        SELECT id FROM bounties WHERE created_by = (
            SELECT id FROM users WHERE wallet_address = auth.uid()::text AND role IN ('organization', 'hiring_manager') LIMIT 1
        )
    ));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update builder rating and completed bounties
CREATE OR REPLACE FUNCTION update_builder_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'won' AND OLD.status != 'won' THEN
        -- Increment completed bounties for the builder
        UPDATE users 
        SET completed_bounties = completed_bounties + 1
        WHERE id = NEW.user_id;
        
        -- Recalculate average rating based on feedback
        UPDATE users 
        SET rating = COALESCE((
            SELECT AVG(CASE 
                WHEN feedback LIKE '%1%' THEN 1
                WHEN feedback LIKE '%2%' THEN 2
                WHEN feedback LIKE '%3%' THEN 3
                WHEN feedback LIKE '%4%' THEN 4
                WHEN feedback LIKE '%5%' THEN 5
                ELSE 3
            END)
            FROM submissions 
            WHERE user_id = NEW.user_id AND status = 'won'
        ), 0)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_builder_stats
    AFTER UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_builder_stats();

-- Function to auto-close expired bounties
CREATE OR REPLACE FUNCTION close_expired_bounties()
RETURNS void AS $$
BEGIN
    UPDATE bounties
    SET status = 'closed'
    WHERE status = 'open' AND deadline < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for bounties with organization details
CREATE VIEW bounties_with_org AS
SELECT 
    b.*,
    u.name as organization_name,
    u.description as organization_description,
    u.website as organization_website,
    u.rating as organization_rating
FROM bounties b
JOIN users u ON b.created_by = u.id
WHERE u.role IN ('organization', 'hiring_manager');

-- View for submissions with builder details
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
    b.deadline as bounty_deadline
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN bounties b ON s.bounty_id = b.id;

-- View for leaderboard (top builders)
CREATE VIEW builder_leaderboard AS
SELECT 
    id,
    username,
    rating,
    completed_bounties,
    github,
    portfolio
FROM users
WHERE role = 'builder'
ORDER BY rating DESC, completed_bounties DESC;
