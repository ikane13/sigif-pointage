import { api } from './api';
import type { Event, CreateEventDto } from '@/types/event.types';

export const eventsService = {
  // Récupérer tous les événements
  getAll: async (): Promise<Event[]> => {
    const { data } = await api.get('/events');

    const payload = data?.data ?? data; // compat

    // Si c'est déjà un tableau → ok
    if (Array.isArray(payload)) return payload;

    // Si le backend renvoie un objet paginé, ex: { items: [...] } ou { results: [...] }
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.events)) return payload.events;

    // Sinon, on fallback
    return [];
  },

  // Récupérer un événement par ID
  getById: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`);
    return data.data || data;
  },

  // Créer un événement
  create: async (dto: CreateEventDto): Promise<Event> => {
    const { data } = await api.post('/events', dto);
    return data.data || data;
  },

  // Mettre à jour un événement
  update: async (id: string, dto: Partial<CreateEventDto>): Promise<Event> => {
    const { data } = await api.patch(`/events/${id}`, dto);
    return data.data || data;
  },

  // Supprimer un événement
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  updateStatus: async (
    id: string,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<Event> => {
    const { data } = await api.patch(`/events/${id}/status`, { status });
    return data.data || data;
  },

};