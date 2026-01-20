import type { Session } from './session.types';

export enum EventType {
  WORKSHOP = 'workshop',
  TRAINING = 'training',
  COMMITTEE = 'committee',
  SEMINAR = 'seminar',
  MEETING = 'meeting',
  OTHER = 'other',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Event {
  id: string;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location: string;
  description?: string;
  organizer?: string;
  capacity?: number;
  status: EventStatus;
  attendanceStats?: {
    total: number;
    withSignature: number;
    withoutSignature: number;
  };
  qrToken?: string; // ⚠️ Déprécié (migré vers sessions)
  qrGeneratedAt?: string; // ⚠️ Déprécié
  qrScanCount?: number; // ⚠️ Déprécié
  sessions?: Session[]; // ✅ NOUVEAU : Liste des sessions
  createdById?: string | null;
  createdBy?: {
    id?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ⚠️ QrCodeInfo maintenant lié aux sessions (pas aux events)
export interface QrCodeInfo {
  token: string;
  generatedAt: string;
  scanCount: number;
  urls: {
    display: string;
    pointage: string;
    downloadPng: string;
    downloadPdf: string;
  };
}

export interface CreateEventDto {
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  location: string;
  description?: string;
  organizer?: string;
  capacity?: number;
}
