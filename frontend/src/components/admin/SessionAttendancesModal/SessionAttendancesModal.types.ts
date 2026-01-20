import type { Session } from '@/types/session.types';

export interface SessionAttendancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}
