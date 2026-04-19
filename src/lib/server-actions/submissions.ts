'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Submission, SubmissionStatus } from '@/lib/supabase';
import { createSubmissionSchema } from '@/lib/validations/submissions';

export async function createSubmission(data: {
  bounty_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description: string;
}) {
  try {
    // Validate input using Zod
    const validationResult = createSubmissionSchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        bounty_id: validatedData.bounty_id,
        user_id: validatedData.user_id,
        github_link: validatedData.github_link,
        demo_link: validatedData.demo_link,
        description: validatedData.description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, submission };
  } catch (error) {
    console.error('Error creating submission:', error);
    return { success: false, error: 'Failed to create submission' };
  }
}

export async function getSubmissionsByBounty(bountyId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('submissions_with_builder')
      .select('*')
      .eq('bounty_id', bountyId)
      .order('score', { ascending: false, nullsFirst: false });

    if (error) throw error;

    return { success: true, submissions: data || [] };
  } catch (error) {
    console.error('Error fetching submissions by bounty:', error);
    return { success: false, error: 'Failed to fetch submissions', submissions: [] };
  }
}

export async function getSubmissionsByUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('submissions_with_builder')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return { success: true, submissions: data || [] };
  } catch (error) {
    console.error('Error fetching submissions by user:', error);
    return { success: false, error: 'Failed to fetch submissions', submissions: [] };
  }
}

export async function updateSubmission(id: string, data: Partial<Submission>) {
  try {
    const updateData: any = { ...data };

    if (data.status && data.status !== 'pending') {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, submission };
  } catch (error) {
    console.error('Error updating submission:', error);
    return { success: false, error: 'Failed to update submission' };
  }
}

export async function scoreSubmission(id: string, score: number) {
  try {
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .update({ score })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, submission };
  } catch (error) {
    console.error('Error scoring submission:', error);
    return { success: false, error: 'Failed to score submission' };
  }
}

export async function selectWinner(submissionId: string, feedback?: string) {
  try {
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    // Update submission status to won
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'won', 
        feedback,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Reject all other submissions for this bounty
    const { error: rejectError } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      })
      .eq('bounty_id', submission.bounty_id)
      .neq('id', submissionId);

    if (rejectError) throw rejectError;

    // Close the bounty
    const { error: bountyError } = await supabaseAdmin
      .from('bounties')
      .update({ status: 'closed' })
      .eq('id', submission.bounty_id);

    if (bountyError) throw bountyError;

    // Update builder stats
    const { error: statsError } = await supabaseAdmin.rpc('increment_completed_bounties', {
      user_id: submission.user_id
    });

    if (statsError) {
      console.error('Error updating builder stats:', statsError);
      // Don't throw - the main operation succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Error selecting winner:', error);
    return { success: false, error: 'Failed to select winner' };
  }
}

export async function rejectSubmission(submissionId: string, feedback?: string) {
  try {
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'rejected', 
        feedback,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return { success: false, error: 'Failed to reject submission' };
  }
}
