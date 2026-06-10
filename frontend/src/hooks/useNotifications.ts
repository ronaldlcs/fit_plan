import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllRead,
  markRead,
  clearAll,
  onNotificationsChange,
  type AppNotification,
} from "../services/notificationStore";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications);

  useEffect(() => {
    const unsub = onNotificationsChange(() => setNotifications(getNotifications()));
    return unsub;
  }, []);

  return {
    notifications,
    hasUnread: notifications.some((n) => n.unread),
    unreadCount: notifications.filter((n) => n.unread).length,
    markRead,
    markAllRead,
    clearAll,
  };
}
