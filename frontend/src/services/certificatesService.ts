import { api } from './api';
import type {
  Certificate,
  CreateCertificateDto,
  GenerateCertificatesDto,
} from '../types/certificate.types';

/**
 * Service pour gérer les certificats/attestations
 */
export const certificatesService = {
  /**
   * Générer des certificats en masse pour un événement
   */
  async generateBulkCertificates(
    eventId: string,
    data: GenerateCertificatesDto
  ): Promise<Certificate[]> {
    const response = await api.post<Certificate[]>(
      `/certificates/events/${eventId}/generate`,
      data
    );
    return response.data;
  },

  /**
   * Créer un certificat individuel
   */
  async createCertificate(
    eventId: string,
    data: CreateCertificateDto
  ): Promise<Certificate> {
    const response = await api.post<Certificate>(
      `/certificates/events/${eventId}`,
      data
    );
    return response.data;
  },

  /**
   * Récupérer tous les certificats d'un événement
   */
  async getCertificatesByEvent(eventId: string): Promise<Certificate[]> {
    const response = await api.get<Certificate[]>(
      `/certificates/events/${eventId}`
    );
    return response.data;
  },

  /**
   * Récupérer un certificat par son ID
   */
  async getCertificateById(id: string): Promise<Certificate> {
    const response = await api.get<Certificate>(`/certificates/${id}`);
    return response.data;
  },

  /**
   * Récupérer les certificats d'un participant
   */
  async getCertificatesByParticipant(
    participantId: string
  ): Promise<Certificate[]> {
    const response = await api.get<Certificate[]>(
      `/certificates/participants/${participantId}`
    );
    return response.data;
  },

  /**
   * Vérifier si un participant a un certificat pour un événement
   */
  async hasCertificate(
    eventId: string,
    participantId: string
  ): Promise<boolean> {
    const response = await api.get<{ exists: boolean }>(
      `/certificates/events/${eventId}/participants/${participantId}/exists`
    );
    return response.data.exists;
  },

  /**
   * Récupérer le certificat d'un participant pour un événement
   */
  async getCertificateByEventAndParticipant(
    eventId: string,
    participantId: string
  ): Promise<Certificate | null> {
    const response = await api.get<Certificate | null>(
      `/certificates/events/${eventId}/participants/${participantId}`
    );
    return response.data;
  },

  /**
   * Supprimer un certificat
   */
  async deleteCertificate(id: string): Promise<void> {
    await api.delete(`/certificates/${id}`);
  },

  /**
   * Uploader une image de signature
   */
  async uploadSignature(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string; filename: string }>(
      '/uploads/signatures',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
