import { api } from "./api";
import type { NotificationsResponse } from "@/types/notification.types";

export const notificationsService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> => {
    const { data } = await api.get("/notifications", { params });
    return data.data || data;
  },
  markRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data || data;
  },
  markAllRead: async () => {
    const { data } = await api.patch("/notifications/read-all");
    return data.data || data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data.data || data;
  },
};
