import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get notifications for a user
 */
export async function getNotificationsByUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications', notifications: [] };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return { success: false, error: 'Failed to fetch unread count', count: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}
