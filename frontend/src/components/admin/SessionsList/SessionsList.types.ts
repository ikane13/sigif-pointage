export interface SessionsListProps {
  eventId: string;
  eventStatus: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  canManage?: boolean;
}
