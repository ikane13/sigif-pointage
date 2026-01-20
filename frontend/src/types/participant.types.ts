export interface ParticipantListItem {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  function?: string;
  cniNumber?: string;
  originLocality?: string;
  email?: string;
  phone?: string;
  organization?: string;
  createdAt?: string;
  updatedAt?: string;
  attendanceCount?: number;
  lastAttendance?: string | null;
}

export interface ParticipantsListResponse {
  items: ParticipantListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
