import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : supabase;

// Database types based on our schema
export type UserRole = 'builder' | 'organization' | 'hiring_manager';
export type BountyStatus = 'open' | 'closed';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'won';
export type Industry = 'AI' | 'Web3' | 'Crypto' | 'Robotics' | 'DeFi' | 'Gaming' | 'Infrastructure' | 'Other';

export interface User {
  id: string;
  wallet_address: string;
  role: UserRole;
  username?: string;
  telegram?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  portfolio?: string;
  cv?: string;
  linkedin?: string;
  x?: string;
  name?: string;
  description?: string;
  website?: string;
  rating: number;
  completed_bounties: number;
  created_at: string;
  updated_at: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  created_by: string;
  required_skills: string[];
  status: BountyStatus;
  industry?: Industry;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  organization_description?: string;
  organization_website?: string;
  organization_rating?: number;
}

export interface Submission {
  id: string;
  bounty_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  builder_username?: string;
  builder_github?: string;
  builder_portfolio?: string;
  builder_rating?: number;
  builder_completed_bounties?: number;
  bounty_title?: string;
  bounty_reward?: number;
  bounty_deadline?: string;
}
