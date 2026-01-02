import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { Loader } from '@components/common/Loader';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { eventsService } from '@services/eventsService';
import type { Event, EventStatus } from '@/types/event.types';
import styles from './Events.module.scss';

const statusLabels: Record<EventStatus, { label: string; variant: 'success' | 'primary' | 'neutral' | 'danger' }> = {
  scheduled: { label: 'Planifié', variant: 'primary' },
  ongoing: { label: 'En cours', variant: 'success' },
  completed: { label: 'Terminé', variant: 'neutral' },
  cancelled: { label: 'Annulé', variant: 'danger' },
};

export const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeEvents = Array.isArray(events) ? events : [];


  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
  try {
    setLoading(true);
    setError(null);

    const data = await eventsService.getAll();

    setEvents(data);
  } catch (err: any) {
    setError(err.message || 'Erreur lors du chargement des événements');
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement des événements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: '#DC3545', textAlign: 'center' }}>{error}</p>
          <Button onClick={loadEvents} style={{ marginTop: '1rem' }}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.eventsPage}>
      <div className={styles.header}>
        <div>
          <h1>Événements</h1>
          <p className={styles.subtitle}>{events.length} événement(s)</p>
        </div>
        <Button icon={<Plus size={20} />} onClick={() => navigate('/events/new')}>
          Nouvel événement
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={48} style={{ color: '#ADB5BD', margin: '0 auto 1rem' }} />
            <h3>Aucun événement</h3>
            <p style={{ color: '#6C757D', marginTop: '0.5rem' }}>
              Commencez par créer votre premier événement
            </p>
            <Button
              onClick={() => navigate('/events/new')}
              style={{ marginTop: '1.5rem' }}
            >
              Créer un événement
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.grid}>
          {safeEvents.map((event) => (
            <Card
              key={event.id}
              hoverable
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className={styles.eventCard}>
                <div className={styles.cardHeader}>
                  <h3>{event.title}</h3>
                  <Badge variant={statusLabels[event.status].variant}>
                    {statusLabels[event.status].label}
                  </Badge>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.info}>
                    <Calendar size={16} />
                    <span>{formatDate(event.startDate)}</span>
                  </div>

                  <div className={styles.info}>
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>

                  {event.qrScanCount !== undefined && (
                    <div className={styles.info}>
                      <Users size={16} />
                      <span>{event.qrScanCount} scan(s)</span>
                    </div>
                  )}
                </div>

                {event.qrToken && (
                  <div className={styles.qrBadge}>
                    <Badge variant="success" size="sm">
                      QR Code généré
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};