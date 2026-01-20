import type { Session } from '@/types/session.types';

export interface SessionCardProps {
  session: Session;
  onStatusChange?: (sessionId: string, status: 'ongoing' | 'completed' | 'cancelled') => void;
  onViewQr?: (sessionId: string) => void;
  onViewAttendances?: (sessionId: string) => void; // NEW
  onEdit?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  loading?: boolean;
  canManage?: boolean;
}
