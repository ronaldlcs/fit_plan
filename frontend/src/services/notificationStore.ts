const STORAGE_KEY = "fitplan_notifications";
const MAX_NOTIFICATIONS = 30;
const EVENT_NAME = "fitplan:notifications";

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  category: "workout" | "nutrition" | "plan" | "general";
}

export function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(notifications: AppNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function addNotification(
  notif: Omit<AppNotification, "id" | "createdAt" | "unread">
): void {
  const current = getNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    unread: true,
  };
  save([newNotif, ...current].slice(0, MAX_NOTIFICATIONS));
}

export function markRead(id: string): void {
  save(getNotifications().map((n) => (n.id === id ? { ...n, unread: false } : n)));
}

export function markAllRead(): void {
  save(getNotifications().map((n) => ({ ...n, unread: false })));
}

export function clearAll(): void {
  save([]);
}

export function onNotificationsChange(cb: () => void): () => void {
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
}

export function formatNotifTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `${days} dias atrás`;
}
