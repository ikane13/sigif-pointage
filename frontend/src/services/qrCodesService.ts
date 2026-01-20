import { api } from './api';
import type { QrCodeInfo } from '@/types/event.types';
import type { ValidatedToken } from '@/types/attendance.types';


/**
 * 🔧 SERVICE QR CODES - ADAPTÉ POUR SESSIONS
 * 
 * ⚠️ CHANGEMENT MAJEUR :
 * - Avant : QR Code par EVENT (1 QR pour tout l'événement)
 * - Après : QR Code par SESSION (1 QR par jour/session)
 * 
 * 🔄 MODIFICATIONS FONCTIONNELLES :
 * 1. Tous les endpoints passent de /events/:id/qr-code à /sessions/:id/qr-code
 * 2. Le paramètre s'appelle maintenant sessionId au lieu d'eventId
 * 3. validateToken() reste PUBLIC et renvoie event + session
 */
export const qrCodesService = {
  /**
   * 🎯 Générer le QR code pour une SESSION
   * 
   * ❌ AVANT : generate(eventId) → POST /events/:eventId/qr-code
   * ✅ APRÈS : generate(sessionId) → POST /sessions/:sessionId/qr-code
   * 
   * @param sessionId - ID de la session (pas eventId!)
   * @returns Infos du QR code généré
   */
  generate: async (sessionId: string): Promise<QrCodeInfo> => {
    const { data } = await api.post(`/sessions/${sessionId}/qr-code`);
    return data.data || data;
  },

  /**
   * 🎯 Récupérer les infos du QR code d'une SESSION
   * 
   * ❌ AVANT : getInfo(eventId) → GET /events/:eventId/qr-code
   * ✅ APRÈS : getInfo(sessionId) → GET /sessions/:sessionId/qr-code
   * 
   * @param sessionId - ID de la session
   * @returns Infos du QR code (token, scanCount, urls)
   */
  getInfo: async (sessionId: string): Promise<QrCodeInfo> => {
    const { data } = await api.get(`/sessions/${sessionId}/qr-code`);
    return data.data || data;
  },

  /**
   * 🎯 Télécharger le QR code en PNG
   * 
   * ❌ AVANT : downloadPng(eventId)
   * ✅ APRÈS : downloadPng(sessionId)
   * 
   * @param sessionId - ID de la session
   * @returns Blob PNG
   */
  downloadPng: async (sessionId: string): Promise<Blob> => {
    const { data } = await api.get(`/sessions/${sessionId}/qr-code/download?format=png`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * 🎯 Télécharger le QR code en PDF
   * 
   * ❌ AVANT : downloadPdf(eventId)
   * ✅ APRÈS : downloadPdf(sessionId)
   * 
   * Le PDF généré contient maintenant :
   * - Titre événement
   * - Label session (ex: "Session 1 – 10 juin 2026")
   * - Date session
   * - Horaires session
   * - Lieu session (ou lieu event en fallback)
   * 
   * @param sessionId - ID de la session
   * @returns Blob PDF
   */
  downloadPdf: async (sessionId: string): Promise<Blob> => {
    const { data } = await api.get(`/sessions/${sessionId}/qr-code/download?format=pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * 🎯 Valider un token QR code (ENDPOINT PUBLIC)
   * 
   * ✅ ENDPOINT INCHANGÉ : GET /qr-codes/validate/:token
   * 
   * 🔄 RÉPONSE MODIFIÉE :
   * Le backend renvoie maintenant :
   * {
   *   event: { id, title, ... },
   *   session: { id, label, sessionDate, status, ... },
   *   canCheckIn: event.status === 'ongoing' && session.status === 'ongoing'
   * }
   * 
   * ⚠️ CHANGEMENT IMPORTANT :
   * canCheckIn dépend maintenant du statut SESSION (pas event)
   * 
   * @param token - Token du QR code
   * @returns Infos event + session + canCheckIn
   */
validateToken: async (token: string): Promise<ValidatedToken> => {
    const { data } = await api.get(`/qr-codes/validate/${token}`);

    const event = data?.data?.event;
    const session = data?.data?.session;

    return {
      // Infos événement
      eventId: event?.id,
      eventTitle: event?.title,
      eventType: event?.eventType,
      eventStartDate: event?.startDate,
      eventEndDate: event?.endDate,
      eventLocation: event?.location,
      eventStatus: event?.status,
      eventDescription: event?.description,

      // ✅ NOUVEAU : Infos session
      session: {
        id: session?.id,
        sessionNumber: session?.sessionNumber,
        sessionDate: session?.sessionDate,
        label: session?.label,
        title: session?.title ?? null,
        startTime: session?.startTime,
        endTime: session?.endTime,
        location: session?.location,
        status: session?.status,
      },

      // ✅ MODIFIÉ : canCheckIn dépend du statut SESSION
      canCheckIn: data?.data?.canCheckIn ?? false,
      isValid: true,
    };
  },
};