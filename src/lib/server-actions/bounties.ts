'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Bounty, BountyStatus, Industry } from '@/lib/supabase';
import { createBountySchema } from '@/lib/validations/bounties';

export async function createBounty(data: {
  title: string;
  description: string;
  reward: number;
  deadline: string;
  created_by: string;
  required_skills: string[];
  status?: BountyStatus;
  industry?: Industry;
}) {
  try {
    // Validate input using Zod
    const validationResult = createBountySchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const { data: bounty, error } = await supabaseAdmin
      .from('bounties')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        reward: validatedData.reward,
        deadline: validatedData.deadline,
        created_by: validatedData.created_by,
        required_skills: validatedData.required_skills,
        status: validatedData.status || 'open',
        industry: validatedData.industry,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, bounty };
  } catch (error) {
    console.error('Error creating bounty:', error);
    return { success: false, error: 'Failed to create bounty' };
  }
}

export async function getBounties(filters?: {
  status?: BountyStatus;
  industry?: Industry;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('bounties_with_org')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, bounties: data || [] };
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return { success: false, error: 'Failed to fetch bounties', bounties: [] };
  }
}

export async function getBountyById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bounties_with_org')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, bounty: data };
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return { success: false, error: 'Failed to fetch bounty', bounty: null };
  }
}

export async function getBountiesByCreator(creatorId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('bounties')
      .select('*')
      .eq('created_by', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, bounties: data || [] };
  } catch (error) {
    console.error('Error fetching bounties by creator:', error);
    return { success: false, error: 'Failed to fetch bounties', bounties: [] };
  }
}

export async function updateBounty(id: string, data: Partial<Bounty>) {
  try {
    const { data: bounty, error } = await supabaseAdmin
      .from('bounties')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, bounty };
  } catch (error) {
    console.error('Error updating bounty:', error);
    return { success: false, error: 'Failed to update bounty' };
  }
}

export async function deleteBounty(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('bounties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting bounty:', error);
    return { success: false, error: 'Failed to delete bounty' };
  }
}
