export type EventsPeriod = 'all' | 'today' | 'thisMonth' | 'lastMonth' | 'custom';

export type EventStatusFilter = 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type EventTypeFilter = 'all' | 'workshop' | 'training' | 'committee' | 'seminar' | 'meeting' | 'other';

export interface EventsFiltersValue {
  q: string;
  status: EventStatusFilter;
  eventType: EventTypeFilter;
  period: EventsPeriod;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface EventsToolbarProps {
  value: EventsFiltersValue;
  onChange: (next: EventsFiltersValue) => void;
  onReset: () => void;
  loading?: boolean;
}
