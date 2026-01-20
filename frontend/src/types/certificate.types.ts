import type { EventType } from './event.types';

export interface Certificate {
  id: string;
  eventId: string;
  participantId: string;
  attendanceId?: string;
  certificateNumber: string;

  // Données figées de l'événement
  eventTitle: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  location?: string;
  organizer?: string;
  trainer?: string;

  // Date de délivrance
  issuedAt: string;

  // Signataire
  signatoryName: string;
  signatoryRole: string;
  signatureImageUrl?: string;

  // Conditions
  conditionsMet: boolean;
  evaluationId?: string;

  // Métadonnées
  createdById?: string;
  createdAt: string;
  updatedAt: string;

  // Relations optionnelles
  participant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
    eventType: EventType;
  };
}

export interface CreateCertificateDto {
  participantId: string;
  attendanceId?: string;
  eventTitle: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  location?: string;
  organizer?: string;
  trainer?: string;
  issuedAt?: string;
  signatoryName: string;
  signatoryRole: string;
  signatureImageUrl?: string;
  conditionsMet?: boolean;
  evaluationId?: string;
}

export interface GenerateCertificatesDto {
  participantIds: string[];
  eventTitle: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  location?: string;
  organizer?: string;
  trainer?: string;
  issuedAt?: string;
  signatoryName: string;
  signatoryRole: string;
  signatureImageUrl?: string;
  conditionsMet?: boolean;
}

export interface CertificateFormData {
  // Sélection des participants
  selectedParticipantIds: string[];

  // Données éditables
  eventTitle: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  location?: string;
  organizer?: string;
  trainer?: string;
  issuedAt: string;

  // Signataire
  signatoryName: string;
  signatoryRole: string;
  signatureFile?: File;
  signatureImageUrl?: string;
}
