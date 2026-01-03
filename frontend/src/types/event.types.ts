export enum EventType {
  WORKSHOP = 'workshop',
  TRAINING = 'training',
  // CONFERENCE = 'conference',
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
  qrToken?: string;
  qrGeneratedAt?: string;
  qrScanCount?: number;
  createdAt: string;
  updatedAt: string;
}

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