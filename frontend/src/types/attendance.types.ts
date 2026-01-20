export interface AttendanceFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  function?: string;
  organization?: string;
  cniNumber?: string;
  originLocality?: string;
  notes?: string;
  signature: string; // Base64 data URL
}

export interface ValidatedToken {
  eventId: string;
  eventTitle: string;
  eventType?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventLocation?: string;
  eventStatus?: string;
  eventDescription?: string;

  isValid: boolean;
  canCheckIn: boolean;

  session: {
    id: string;
    sessionNumber: number;
    sessionDate: string;
    label: string;
    title?: string | null;
    startTime?: string;
    endTime?: string;
    location?: string;
    status: string;
  };
}
