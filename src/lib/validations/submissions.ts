import { z } from 'zod';

export const createSubmissionSchema = z.object({
  bounty_id: z.string().uuid('Invalid bounty ID'),
  user_id: z.string().uuid('Invalid user ID'),
  github_link: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  demo_link: z.string().url('Invalid demo URL').optional().or(z.literal('')),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
