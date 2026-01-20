// import type { EventStatus } from '@/types/event.types';

export interface EventsStatsValue {
  total: number;
  scheduled: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export interface EventsStatsProps {
  value: EventsStatsValue;
}
