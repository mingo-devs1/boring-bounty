import { z } from 'zod';
import { Industry, BountyStatus } from '@/lib/supabase';

export const createBountySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be less than 5000 characters'),
  reward: z.number().min(1, 'Reward must be at least $1').max(1000000, 'Reward must be less than $1,000,000'),
  deadline: z.string().min(1, 'Deadline is required'),
  created_by: z.string().uuid('Invalid creator ID'),
  required_skills: z.array(z.string()).min(1, 'At least one skill is required'),
  status: z.enum(['open', 'closed']).optional(),
  industry: z.enum(['AI', 'Web3', 'Crypto', 'Robotics', 'DeFi', 'Gaming', 'Infrastructure', 'Other']).optional(),
});

export type CreateBountyInput = z.infer<typeof createBountySchema>;
