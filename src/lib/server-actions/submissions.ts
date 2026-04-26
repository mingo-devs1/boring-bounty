'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Submission, SubmissionStatus } from '@/lib/supabase';
import { createSubmissionSchema } from '@/lib/validations/submissions';
import { calculateSubmissionScore } from '@/lib/scoring';
import { evaluateSubmissionWithAI, combineScores } from '@/lib/ai-evaluation';

export async function createSubmission(data: {
  bounty_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description: string;
  category_ids?: string[];
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

    // Fetch bounty details for required skills and scoring weights
    const { data: bounty, error: bountyError } = await supabaseAdmin
      .from('bounties')
      .select('title, description, required_skills, scoring_weights')
      .eq('id', validatedData.bounty_id)
      .single();

    if (bountyError) throw bountyError;

    // Fetch user details for builder skills
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('skills')
      .eq('id', validatedData.user_id)
      .single();

    if (userError) throw userError;

    // Calculate basic submission score with per-bounty weights
    const basicScoreResult = calculateSubmissionScore({
      github_link: validatedData.github_link || null,
      demo_link: validatedData.demo_link || null,
      description: validatedData.description,
      builder_skills: user?.skills || [],
      required_skills: bounty?.required_skills || [],
      weights: bounty?.scoring_weights || {},
    });

    // Optional AI evaluation for enhanced scoring
    let finalScore = basicScoreResult.score;
    let aiScore: number | null = null;
    let aiFeedback = '';
    let aiStrengths: string[] = [];
    let aiImprovements: string[] = [];
    let aiConfidence: number | null = null;
    let aiCostEstimate: number | null = null;
    let aiEvaluatedAt: string | null = null;
    let scoringBreakdown: any = null;

    try {
      const aiEvaluation = await evaluateSubmissionWithAI({
        bounty_title: bounty?.title || '',
        bounty_description: bounty?.description || '',
        bounty_required_skills: bounty?.required_skills || [],
        submission_description: validatedData.description,
        github_link: validatedData.github_link,
        demo_link: validatedData.demo_link,
        builder_skills: user?.skills,
      });

      // Combine basic score with AI evaluation using custom weights if provided
      aiScore = aiEvaluation.score;
      finalScore = combineScores(
        basicScoreResult.score, 
        aiEvaluation, 
        0.4,
        bounty?.scoring_weights || undefined
      );
      aiFeedback = aiEvaluation.feedback;
      aiStrengths = aiEvaluation.strengths;
      aiImprovements = aiEvaluation.improvements;
      aiConfidence = aiEvaluation.confidence_score;
      aiCostEstimate = aiEvaluation.cost_estimate || null;
      aiEvaluatedAt = new Date().toISOString();
      scoringBreakdown = {
        basic: basicScoreResult.breakdown,
        ai: aiEvaluation.breakdown,
      };
    } catch (aiError) {
      console.error('AI evaluation failed, using basic score:', aiError);
      // Continue with basic score if AI evaluation fails
      scoringBreakdown = {
        basic: basicScoreResult.breakdown,
      };
    }

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        bounty_id: validatedData.bounty_id,
        user_id: validatedData.user_id,
        github_link: validatedData.github_link,
        demo_link: validatedData.demo_link,
        description: validatedData.description,
        status: 'pending',
        basic_score: basicScoreResult.score,
        ai_score: aiScore,
        final_score: finalScore,
        score: finalScore, // Keep for backward compatibility
        feedback: aiFeedback || null,
        ai_feedback: aiFeedback ? {
          feedback: aiFeedback,
          breakdown: scoringBreakdown,
        } : null,
        ai_strengths: aiStrengths,
        ai_improvements: aiImprovements,
        ai_confidence: aiConfidence,
        ai_cost_estimate: aiCostEstimate,
        ai_evaluated_at: aiEvaluatedAt,
        scoring_breakdown: scoringBreakdown,
      })
      .select()
      .single();

    if (error) throw error;

    // Link categories to submission if provided
    if (validatedData.category_ids && validatedData.category_ids.length > 0) {
      const categoryLinks = validatedData.category_ids.map((category_id) => ({
        submission_id: submission.id,
        category_id,
      }));

      const { error: categoryError } = await supabaseAdmin
        .from('submission_categories')
        .insert(categoryLinks);

      if (categoryError) {
        console.error('Error linking categories:', categoryError);
        // Don't fail the submission creation if category linking fails
      }
    }

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
      .order('final_score', { ascending: false, nullsFirst: false });

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

export async function markAsReviewed(submissionId: string, feedback?: string) {
  try {
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'reviewed', 
        feedback,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking submission as reviewed:', error);
    return { success: false, error: 'Failed to mark submission as reviewed' };
  }
}

export async function runAIEvaluation(submissionId: string) {
  try {
    // Fetch submission with bounty and user details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, bounties(title, description, required_skills, scoring_weights, deadline), users(skills)')
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    // Calculate basic score with per-bounty weights
    const basicScoreResult = calculateSubmissionScore({
      github_link: submission.github_link || null,
      demo_link: submission.demo_link || null,
      description: submission.description,
      builder_skills: submission.users?.skills || [],
      required_skills: submission.bounties?.required_skills || [],
      weights: submission.bounties?.scoring_weights || {},
    });

    // Run AI evaluation
    const aiEvaluation = await evaluateSubmissionWithAI({
      bounty_title: submission.bounties?.title || '',
      bounty_description: submission.bounties?.description || '',
      bounty_required_skills: submission.bounties?.required_skills || [],
      submission_description: submission.description,
      github_link: submission.github_link,
      demo_link: submission.demo_link,
      builder_skills: submission.users?.skills,
    });

    // Combine scores using custom weights if provided
    const finalScore = combineScores(
      basicScoreResult.score, 
      aiEvaluation, 
      0.4,
      submission.bounties?.scoring_weights || undefined
    );

    // Update submission with AI evaluation results
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        basic_score: basicScoreResult.score,
        ai_score: aiEvaluation.score,
        final_score: finalScore,
        score: finalScore,
        feedback: aiEvaluation.feedback,
        ai_feedback: {
          feedback: aiEvaluation.feedback,
          breakdown: {
            basic: basicScoreResult.breakdown,
            ai: aiEvaluation.breakdown,
          },
        },
        ai_strengths: aiEvaluation.strengths,
        ai_improvements: aiEvaluation.improvements,
        ai_confidence: aiEvaluation.confidence_score,
        ai_cost_estimate: aiEvaluation.cost_estimate,
        ai_evaluated_at: new Date().toISOString(),
        scoring_breakdown: {
          basic: basicScoreResult.breakdown,
          ai: aiEvaluation.breakdown,
        },
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error running AI evaluation:', error);
    return { success: false, error: 'Failed to run AI evaluation' };
  }
}

/**
 * Edit a submission (with time limit and reviewed status checks)
 * Can only be edited before bounty deadline and before submission is reviewed
 */
export async function editSubmission(data: {
  submission_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description: string;
  category_ids?: string[];
}) {
  try {
    // Fetch submission with bounty details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, bounties(deadline, created_by)')
      .eq('id', data.submission_id)
      .single();

    if (subError) throw subError;

    // Verify user owns the submission
    if (submission.user_id !== data.user_id) {
      return { success: false, error: 'You can only edit your own submissions' };
    }

    // Check if submission has been reviewed
    if (submission.reviewed_at) {
      return { success: false, error: 'Cannot edit submission after it has been reviewed' };
    }

    // Check if bounty deadline has passed
    const deadline = new Date(submission.bounties.deadline);
    const now = new Date();
    if (now > deadline) {
      return { success: false, error: 'Cannot edit submission after bounty deadline' };
    }

    // Update submission
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        github_link: data.github_link,
        demo_link: data.demo_link,
        description: data.description,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', data.submission_id);

    if (updateError) throw updateError;

    // Update categories if provided
    if (data.category_ids !== undefined) {
      // Delete existing category links
      await supabaseAdmin
        .from('submission_categories')
        .delete()
        .eq('submission_id', data.submission_id);

      // Add new category links
      if (data.category_ids.length > 0) {
        const categoryLinks = data.category_ids.map((category_id) => ({
          submission_id: data.submission_id,
          category_id,
        }));

        const { error: categoryError } = await supabaseAdmin
          .from('submission_categories')
          .insert(categoryLinks);

        if (categoryError) {
          console.error('Error updating categories:', categoryError);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error editing submission:', error);
    return { success: false, error: 'Failed to edit submission' };
  }
}
