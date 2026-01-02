import { api } from './api';
import type { QrCodeInfo } from '@/types/event.types';

export const qrCodesService = {
  // Générer le QR code pour un événement
  generate: async (eventId: string): Promise<QrCodeInfo> => {
    const { data } = await api.post(`/events/${eventId}/qr-code`);
    return data.data || data;
  },

  // Récupérer les infos du QR code
  getInfo: async (eventId: string): Promise<QrCodeInfo> => {
    const { data } = await api.get(`/events/${eventId}/qr-code`);
    return data.data || data;
  },

  // Télécharger le QR code en PNG
  downloadPng: async (eventId: string): Promise<Blob> => {
    const { data } = await api.get(`/events/${eventId}/qr-code/download?format=png`, {
      responseType: 'blob',
    });
    return data;
  },

  // Télécharger le QR code en PDF
  downloadPdf: async (eventId: string): Promise<Blob> => {
    const { data } = await api.get(`/events/${eventId}/qr-code/download?format=pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  // Valider un token (endpoint public)
  validateToken: async (token: string) => {
    const { data } = await api.get(`/qr-codes/validate/${token}`);

    const event = data?.data?.event;

    return {
      eventId: event?.id,
      eventTitle: event?.title,
      eventDate: event?.startDate,
      eventLocation: event?.location,
      isValid: true,
      canCheckIn: data?.data?.canCheckIn ?? false,
      eventType: event?.eventType,
      endDate: event?.endDate,
      status: event?.status,
      description: event?.description,
    };
  },
};