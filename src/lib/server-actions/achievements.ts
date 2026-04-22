import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get achievements for a user
 */
export async function getUserAchievements(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;

    return { success: true, achievements: data || [] };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return { success: false, error: 'Failed to fetch achievements', achievements: [] };
  }
}

/**
 * Get all available achievements
 */
export async function getAllAchievements() {
  try {
    const { data, error } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, achievements: data || [] };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return { success: false, error: 'Failed to fetch achievements', achievements: [] };
  }
}
