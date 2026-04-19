import { z } from 'zod';
import { UserRole } from '@/lib/supabase';

export const createProfileSchema = z.object({
  wallet_address: z.string().min(1, 'Wallet address is required'),
  role: z.enum(['builder', 'organization', 'hiring_manager']),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').optional(),
  telegram: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  cv: z.string().url('Invalid CV URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  x: z.string().url('Invalid X URL').optional().or(z.literal('')),
  name: z.string().min(1, 'Organization name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
