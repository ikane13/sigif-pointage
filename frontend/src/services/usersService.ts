import { api } from "./api";
import type { UsersListResponse, UserRole } from "@/types/user.types";

export const usersService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<UsersListResponse> => {
    const { data } = await api.get("/users", { params });
    return data.data || data;
  },
  create: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) => {
    const { data } = await api.post("/users", payload);
    return data.data || data;
  },
  update: async (
    id: string,
    payload: { role?: UserRole; isActive?: boolean; email?: string; firstName?: string; lastName?: string }
  ) => {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data.data || data;
  },
  resetPassword: async (id: string, newPassword: string) => {
    const { data } = await api.patch(`/users/${id}/reset-password`, { newPassword });
    return data.data || data;
  },
};
