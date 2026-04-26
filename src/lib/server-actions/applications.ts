import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Schema for creating/updating an application
const applicationSchema = z.object({
  bounty_id: z.string().uuid('Invalid bounty ID'),
  user_id: z.string().uuid('Invalid user ID'),
  github_link: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  demo_link: z.string().url('Invalid demo URL').optional().or(z.literal('')),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  category_ids: z.array(z.string().uuid()).optional(),
});

/**
 * Create a draft application
 */
export async function createApplication(data: {
  bounty_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description: string;
  category_ids?: string[];
}) {
  try {
    const validatedData = applicationSchema.parse(data);

    // Check if application already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('bounty_id', validatedData.bounty_id)
      .eq('user_id', validatedData.user_id)
      .single();

    if (existing) {
      return { success: false, error: 'You already have an application for this bounty' };
    }

    // Create application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        bounty_id: validatedData.bounty_id,
        user_id: validatedData.user_id,
        github_link: validatedData.github_link || null,
        demo_link: validatedData.demo_link || null,
        description: validatedData.description,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    // Link categories if provided
    if (validatedData.category_ids && validatedData.category_ids.length > 0) {
      const categoryLinks = validatedData.category_ids.map((category_id) => ({
        application_id: application.id,
        category_id,
      }));

      const { error: categoryError } = await supabase
        .from('application_categories')
        .insert(categoryLinks);

      if (categoryError) throw categoryError;
    }

    return { success: true, application };
  } catch (error) {
    console.error('Error creating application:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create application',
      details: error
    };
  }
}

/**
 * Update a draft application
 */
export async function updateApplication(data: {
  application_id: string;
  user_id: string;
  github_link?: string;
  demo_link?: string;
  description?: string;
  category_ids?: string[];
}) {
  try {
    // Check if application exists (allow editing both draft and submitted)
    const { data: existing } = await supabase
      .from('applications')
      .select('*')
      .eq('id', data.application_id)
      .eq('user_id', data.user_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Application not found' };
    }

    // Update application
    const { data: application, error } = await supabase
      .from('applications')
      .update({
        github_link: data.github_link !== undefined ? data.github_link : existing.github_link,
        demo_link: data.demo_link !== undefined ? data.demo_link : existing.demo_link,
        description: data.description !== undefined ? data.description : existing.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.application_id)
      .select()
      .single();

    if (error) throw error;

    // Update categories if provided
    if (data.category_ids !== undefined) {
      // Delete existing categories
      await supabase
        .from('application_categories')
        .delete()
        .eq('application_id', data.application_id);

      // Add new categories
      if (data.category_ids.length > 0) {
        const categoryLinks = data.category_ids.map((category_id) => ({
          application_id: data.application_id,
          category_id,
        }));

        const { error: categoryError } = await supabase
          .from('application_categories')
          .insert(categoryLinks);

        if (categoryError) throw categoryError;
      }
    }

    return { success: true, application };
  } catch (error) {
    console.error('Error updating application:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

/**
 * Get applications for a user
 */
export async function getApplicationsByUser(userId: string) {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        bounties (
          title,
          reward,
          deadline
        ),
        application_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, applications: applications || [] };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return { success: false, error: 'Failed to fetch applications', applications: [] };
  }
}

export async function getApplicationByUserAndBounty(userId: string, bountyId: string) {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        application_categories (
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .eq('bounty_id', bountyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is expected if user hasn't applied
        return { success: true, application: null };
      }
      throw error;
    }

    return { success: true, application };
  } catch (error) {
    console.error('Error fetching application:', error);
    return { success: false, error: 'Failed to fetch application', application: null };
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(applicationId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        bounties (title, reward, deadline),
        application_categories (
          categories (id, name, description)
        )
      `)
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { success: true, application: data };
  } catch (error) {
    console.error('Error fetching application:', error);
    return { success: false, error: 'Failed to fetch application', application: null };
  }
}

/**
 * Submit application (convert to submission)
 */
export async function submitApplication(applicationId: string, userId: string) {
  try {
    // Call the database function to submit the application
    const { data, error } = await supabase.rpc('submit_application', {
      p_application_id: applicationId,
      p_user_id: userId,
    });

    if (error) throw error;

    return { success: true, submission_id: data };
  } catch (error) {
    console.error('Error submitting application:', error);
    return { success: false, error: 'Failed to submit application' };
  }
}

/**
 * Delete a draft application
 */
export async function deleteApplication(applicationId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('user_id', userId)
      .eq('status', 'draft');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: 'Failed to delete application' };
  }
}

/**
 * Get submitted applications for a bounty (for organizations)
 */
export async function getSubmittedApplicationsByBounty(bountyId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        users (username, rating, github, portfolio),
        application_categories (
          categories (id, name, description)
        )
      `)
      .eq('bounty_id', bountyId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return { success: true, applications: data || [] };
  } catch (error) {
    console.error('Error fetching submitted applications:', error);
    return { success: false, error: 'Failed to fetch submitted applications', applications: [] };
  }
}
