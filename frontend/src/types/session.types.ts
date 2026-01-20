export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Session {
  id: string;
  eventId: string;
  sessionNumber: number;
  sessionDate: string; // Format: YYYY-MM-DD
  label: string;
  title?: string;
  startTime?: string; // Format: HH:MM
  endTime?: string; // Format: HH:MM
  status: SessionStatus;
  location?: string;
  qrToken?: string;
  qrGeneratedAt?: string;
  qrScanCount?: number;
  attendanceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  sessionNumber: number;
  sessionDate: string; // YYYY-MM-DD
  label: string;
  title?: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  location?: string;
}

export interface UpdateSessionDto extends Partial<CreateSessionDto> {
  status?: SessionStatus;
}

export interface SessionFormData {
  sessionNumber: string;
  sessionDate: string;
  label: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}
