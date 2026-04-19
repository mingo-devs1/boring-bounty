'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function getOrganizations() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('role', ['organization', 'hiring_manager'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, organizations: data || [] };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return { success: false, error: 'Failed to fetch organizations', organizations: [] };
  }
}

export async function getOrganizationById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, organization: data };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return { success: false, error: 'Failed to fetch organization', organization: null };
  }
}
