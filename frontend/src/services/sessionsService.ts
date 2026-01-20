import { api } from './api';
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/session.types';

export const sessionsService = {
  /**
   * Créer une session pour un événement
   */
  create: async (eventId: string, dto: CreateSessionDto): Promise<Session> => {
    const { data } = await api.post(`/events/${eventId}/sessions`, dto);
    return data.data || data;
  },

  /**
   * Liste des sessions d'un événement
   */
  getByEvent: async (eventId: string): Promise<Session[]> => {
    const { data } = await api.get(`/events/${eventId}/sessions`);
    return data.data || data;
  },

  /**
   * Détails d'une session
   */
  getById: async (sessionId: string): Promise<Session> => {
    const { data } = await api.get(`/sessions/${sessionId}`);
    return data.data || data;
  },

  /**
   * Mettre à jour une session
   */
  update: async (sessionId: string, dto: UpdateSessionDto): Promise<Session> => {
    const { data } = await api.patch(`/sessions/${sessionId}`, dto);
    return data.data || data;
  },

  /**
   * Supprimer une session
   */
  delete: async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}`);
  },

  /**
   * Changer le statut d'une session
   */
  updateStatus: async (
    sessionId: string,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<Session> => {
    const { data } = await api.patch(`/sessions/${sessionId}/status`, { status });
    return data.data || data;
  },

  /**
   * Générer automatiquement les sessions journalières
   */
  generateDaily: async (eventId: string): Promise<{ created: number; skipped: number; totalDays: number }> => {
    const { data } = await api.post(`/events/${eventId}/sessions/generate`);
    return data.data || data;
  },
};