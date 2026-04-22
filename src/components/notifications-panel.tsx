'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getNotificationsByUser, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/server-actions/notifications';
import { Bell, X, Check, Trash2, Trophy, Star, Zap, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPanel() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const result = await getNotificationsByUser(user.id);
    if (result.success) {
      setNotifications(result.notifications);
    }
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    const result = await getUnreadNotificationCount(user.id);
    if (result.success) {
      setUnreadCount(typeof result.count === 'number' ? result.count : 0);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
    loadUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(user!.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    loadUnreadCount();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'winner_announcement':
        return <Trophy className="w-5 h-5 text-[#FFD700]" />;
      case 'achievement_unlocked':
        return <Award className="w-5 h-5 text-[#14B8A6]" />;
      case 'submission_update':
        return <Zap className="w-5 h-5 text-[#FF3B3B]" />;
      case 'new_bounty':
        return <Briefcase className="w-5 h-5 text-[#14B8A6]" />;
      default:
        return <Bell className="w-5 h-5 text-[#64748B]" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'winner_announcement':
        return 'bg-[#FFD700]/10 border-[#FFD700]/20';
      case 'achievement_unlocked':
        return 'bg-[#14B8A6]/10 border-[#14B8A6]/20';
      case 'submission_update':
        return 'bg-[#FF3B3B]/10 border-[#FF3B3B]/20';
      case 'new_bounty':
        return 'bg-[#14B8A6]/10 border-[#14B8A6]/20';
      default:
        return 'bg-[#F8F4ED] border-[#1F2A2E]/10';
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#F8F4ED] rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-[#1F2A2E]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF3B3B] text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#1F2A2E]/10 flex items-center justify-between">
                <h3 className="font-semibold text-[#1F2A2E]">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-[#FF3B3B] hover:text-[#E53333] font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[500px]">
                {loading ? (
                  <div className="p-8 text-center text-[#64748B]">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B]">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-[#1F2A2E]/20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1F2A2E]/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-[#F8F4ED] transition-colors ${
                          !notification.read_at ? 'bg-[#FF3B3B]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1F2A2E] text-sm">
                              {notification.title}
                            </p>
                            <p className="text-sm text-[#64748B] mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#64748B] mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read_at && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 hover:bg-[#F8F4ED] rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-[#64748B]" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1 hover:bg-[#F8F4ED] rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-[#64748B]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
