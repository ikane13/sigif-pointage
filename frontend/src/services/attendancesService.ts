import { api } from './api';

export interface CreateParticipantForAttendanceDto {
  firstName: string;
  lastName: string;
  function?: string;
  cniNumber?: string;
  originLocality?: string;
  email?: string;
  phone?: string;
  organization?: string;
}

export interface CreateAttendanceDto {
  eventId: string;
  participant: CreateParticipantForAttendanceDto;
  signature: string; // data:image/...;base64,...
  notes?: string;
}

export const attendancesService = {
  create: async (dto: CreateAttendanceDto) => {
    const { data } = await api.post('/attendances', dto); // IMPORTANT: /attendances
    return data;
  },
};
