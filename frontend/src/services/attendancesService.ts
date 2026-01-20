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
  sessionId: string;
  participant: CreateParticipantForAttendanceDto;
  signature: string;
  notes?: string;
}

/** Liste présence (retour API) */
export interface AttendanceListItem {
  id: string;

  event?: {
    id: string;
    title?: string;
    eventType?: string;
    startDate?: string;
    organizer?: string;
  };

  session?: {
    id: string;
    sessionNumber: number;
    sessionDate: string;
    label: string;
    title?: string | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
  };

  participant: {
    id?: string;
    fullName: string;
    function?: string;
    organization?: string;
    email?: string;
    phone?: string;
    cniNumber?: string;
    originLocality?: string;

    // optionnel au cas où ça existe plus tard
    firstName?: string;
    lastName?: string;
  };

  checkInTime?: string;
  createdAt?: string;
  checkInMode?: 'qr_code' | 'manual';
  hasSignature?: boolean;
  signatureFormat?: 'png' | 'jpg';
  ipAddress?: string;
  notes?: string;
}


/** Réponse paginée tolérante (compat) */
export interface PaginatedAttendances {
  items: AttendanceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface EventAttendancesPayload {
  event?: {
    id: string;
    title?: string;
    startDate?: string;
    endDate?: string | null;
    location?: string | null;
    organizer?: string | null;
    status?: string;
  };
  items: AttendanceListItem[];
  meta?: { total: number; page?: number; limit?: number };
  stats?: {
    total: number;
    withSignature: number;
    withoutSignature: number;
    signatureRate: string;
  };
}

function normalizePaginated(data: any, fallbackPage: number, fallbackLimit: number): PaginatedAttendances {
  const payload = data?.data ?? data;

  // ✅ Ton format actuel: { items: [...], meta: { total, page, limit } }
  if (Array.isArray(payload?.items) && payload?.meta) {
    return {
      items: payload.items,
      total: Number(payload.meta.total ?? payload.items.length ?? 0),
      page: Number(payload.meta.page ?? fallbackPage),
      limit: Number(payload.meta.limit ?? fallbackLimit),
    };
  }

  // Cas 1: { items, total, page, limit }
  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items,
      total: Number(payload.total ?? payload.count ?? payload.items.length ?? 0),
      page: Number(payload.page ?? fallbackPage),
      limit: Number(payload.limit ?? fallbackLimit),
    };
  }

  // Cas 2: { results, total }
  if (Array.isArray(payload?.results)) {
    return {
      items: payload.results,
      total: Number(payload.total ?? payload.count ?? payload.results.length ?? 0),
      page: Number(payload.page ?? fallbackPage),
      limit: Number(payload.limit ?? fallbackLimit),
    };
  }

  // Cas 3: tableau direct
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, page: fallbackPage, limit: fallbackLimit };
  }

  return { items: [], total: 0, page: fallbackPage, limit: fallbackLimit };
}

export const attendancesService = {
  create: async (dto: CreateAttendanceDto) => {
    const { data } = await api.post('/attendances', dto);
    return data.data || data;
  },

  /** GET /sessions/:id/attendances */
  getBySession: async (sessionId: string, params?: {
    page?: number;
    limit?: number;
    hasSignature?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedAttendances> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const { data } = await api.get(`/sessions/${sessionId}/attendances`, {
      params: {
        page,
        limit,
        ...(params?.hasSignature !== undefined ? { hasSignature: params.hasSignature } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
      },
    });

    return normalizePaginated(data, page, limit);
  },

  /** GET /attendances/:id/signature */
  getSignature: async (
    attendanceId: string
  ): Promise<{ signatureData: string; signatureFormat: string }> => {
    const { data } = await api.get(`/attendances/${attendanceId}/signature`);
    const payload = data?.data ?? data;

    return {
      signatureData: payload.signatureData,
      signatureFormat: payload.signatureFormat,
    };
  },

  /** GET /attendances/event/:eventId */
  getByEvent: async (
    eventId: string,
    params?: {
      page?: number;
      limit?: number;
      hasSignature?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Promise<EventAttendancesPayload> => {
    const { data } = await api.get(`/attendances/event/${eventId}`, {
      params,
    });
    return data.data || data;
  },

  exportSessionExcel: async (sessionId: string, params?: {
  hasSignature?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<Blob> => {
  const { data } = await api.get(`/sessions/${sessionId}/attendances/export`, {
    params: {
      format: 'xlsx',
      ...(params?.hasSignature !== undefined ? { hasSignature: params.hasSignature } : {}),
      ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
    },
    responseType: 'blob',
  });
  return data;
},

  delete: async (attendanceId: string): Promise<void> => {
    await api.delete(`/attendances/${attendanceId}`);
  },

};
