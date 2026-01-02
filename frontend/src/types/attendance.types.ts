export interface AttendanceFormData {
  firstName: string;
  lastName: string;
  email?: string;
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
  eventDate: string;
  eventLocation: string;
  isValid: boolean;
}
