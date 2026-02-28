import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Pill, Calendar, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: 'medication' | 'appointment' | 'check-in' | 'achievement' | 'crisis' | 'community';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const NOTIFICATION_STORAGE_KEY = 'puresoul_notifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
    // Generate sample notifications on first load
    const hasNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!hasNotifications) {
      generateSampleNotifications();
    }
  }, []);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifs));
      setNotifications(notifs);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const generateSampleNotifications = () => {
    const samples: Notification[] = [
      {
        id: '1',
        type: 'medication',
        title: 'Medication Reminder',
        message: 'Time to take your morning medication',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        read: false,
        actionUrl: '/medications'
      },
      {
        id: '2',
        type: 'check-in',
        title: 'Daily Check-in',
        message: 'Don\'t forget your daily mood check-in',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionUrl: '/voice-journal'
      },
      {
        id: '3',
        type: 'achievement',
        title: '7-Day Streak! 🎉',
        message: 'You\'ve logged your mood for 7 days in a row',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        read: false,
        actionUrl: '/analytics'
      },
      {
        id: '4',
        type: 'community',
        title: 'New Community Event',
        message: 'Mindfulness workshop this Friday at 6 PM',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        read: true,
        actionUrl: '/community'
      }
    ];
    saveNotifications(samples);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5 text-orange-600" />;
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'check-in':
        return <Heart className="w-5 h-5 text-pink-600" />;
      case 'achievement':
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      case 'crisis':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'community':
        return <Heart className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return timestamp.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-400" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 bg-slate-900 border-slate-800 shadow-2xl max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-400 text-center">No notifications yet</p>
              <p className="text-sm text-gray-500 text-center mt-1">
                We'll notify you about important updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-slate-800 cursor-pointer transition-colors ${!notification.read ? 'bg-purple-500/10' : ''
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-white text-sm leading-tight">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-slate-800 bg-slate-800">
            <button
              onClick={clearAll}
              className="w-full text-xs text-red-400 hover:text-red-300 font-medium py-1.5 hover:bg-red-500/10 rounded transition-colors"
            >
              Clear All Notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Export function to add new notification
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const existing: Notification[] = stored ? JSON.parse(stored) : [];

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const updated = [newNotification, ...existing];
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event to trigger re-render
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};
