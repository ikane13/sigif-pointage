import { api } from "./api";
import type { ParticipantsListResponse } from "@/types/participant.types";

export const participantsService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    organization?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<ParticipantsListResponse> => {
    const { data } = await api.get("/participants", { params });
    return data.data || data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/participants/${id}`);
    return data.data || data;
  },
  lookupPublic: async (params: { cni?: string; email?: string }) => {
    const { data } = await api.get(`/public/participants/lookup`, { params });
    return data.data || data;
  },
};
