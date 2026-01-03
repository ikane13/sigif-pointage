import type { Event } from '@/types/event.types';

export interface EventFormData {
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  organizer: string;
  capacity: string;
}

export interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: EventFormData) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}
