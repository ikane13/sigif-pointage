import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '@components/admin/EventForm';
import type { EventFormData } from '@components/admin/EventForm';
import { eventsService } from '@services/eventsService';
import { EventType } from '@/types/event.types';
import { Card } from '@components/common/Card';
import styles from '@/styles/adminFormPage.module.scss';


export const EventCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: EventFormData) => {
    try {
      setLoading(true);
      setError(null);

      const createData = {
        title: formData.title,
        eventType: formData.eventType as EventType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        location: formData.location,
        description: formData.description || undefined,
        organizer: formData.organizer || undefined,
        capacity: formData.capacity
          ? parseInt(formData.capacity, 10)
          : undefined,
      };

      const res: any = await eventsService.create(createData);

      // Sécurisation du retour API
      const eventId = res?.id ?? res?.data?.id;

      if (!eventId) {
        throw new Error('Réponse API invalide : id manquant');
      }

      navigate(`/events/${eventId}`);
    } catch (err: any) {
      console.error('Erreur création événement:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur lors de la création de l'événement"
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  return (
  <div className={styles.page}>
    <div className={styles.container}>
      {error && (
        <Card>
          <p style={{ color: '#DC3545', margin: 0 }}>{error}</p>
        </Card>
      )}

      <EventForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitLabel="Créer l'événement"
        cancelLabel="Annuler"
      />
    </div>
  </div>
);
};
