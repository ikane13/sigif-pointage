export type NotificationType =
  | "event.created"
  | "event.deleted"
  | "event.cancelled"
  | "session.cancelled"
  | "attendance.deleted";

export type NotificationEntityType = "event" | "session" | "attendance";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  title: string;
  message?: string | null;
  payload?: Record<string, any> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}
