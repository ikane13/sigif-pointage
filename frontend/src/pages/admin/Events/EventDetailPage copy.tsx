import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { Loader } from '@components/common/Loader';
import { QrCodeSection } from '@components/admin/QrCodeSection';
import { ArrowLeft, Calendar, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { eventsService } from '@services/eventsService';
import type { Event, EventStatus } from '@/types/event.types';
import styles from './EventDetail.module.scss';

const statusLabels: Record<EventStatus, { label: string; variant: 'success' | 'primary' | 'neutral' | 'danger' }> = {
  scheduled: { label: 'Planifié', variant: 'primary' },
  ongoing: { label: 'En cours', variant: 'success' },
  completed: { label: 'Terminé', variant: 'neutral' },
  cancelled: { label: 'Annulé', variant: 'danger' },
};

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getById(eventId);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'événement');
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
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: '#DC3545', textAlign: 'center' }}>
            {error || 'Événement introuvable'}
          </p>
          <Button onClick={() => navigate('/events')} style={{ marginTop: '1rem' }}>
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.eventDetail}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={20} />}
          onClick={() => navigate('/events')}
        >
          Retour
        </Button>

        <div className={styles.actions}>
          <Button variant="secondary" size="sm" icon={<Edit size={16} />}>
            Modifier
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={16} />}>
            Supprimer
          </Button>
        </div>
      </div>

      <div className={styles.titleSection}>
        <div>
          <h1>{event.title}</h1>
          <div className={styles.meta}>
            <Badge variant={statusLabels[event.status].variant}>
              {statusLabels[event.status].label}
            </Badge>
            <span className={styles.type}>{event.eventType}</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainContent}>
          <Card header="Informations">
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <Calendar size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Date de début</div>
                  <div className={styles.infoValue}>{formatDate(event.startDate)}</div>
                </div>
              </div>

              {event.endDate && (
                <div className={styles.infoItem}>
                  <Calendar size={20} className={styles.infoIcon} />
                  <div>
                    <div className={styles.infoLabel}>Date de fin</div>
                    <div className={styles.infoValue}>{formatDate(event.endDate)}</div>
                  </div>
                </div>
              )}

              <div className={styles.infoItem}>
                <MapPin size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Lieu</div>
                  <div className={styles.infoValue}>{event.location}</div>
                </div>
              </div>

              {event.capacity && (
                <div className={styles.infoItem}>
                  <Users size={20} className={styles.infoIcon} />
                  <div>
                    <div className={styles.infoLabel}>Capacité</div>
                    <div className={styles.infoValue}>{event.capacity} participants</div>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div className={styles.description}>
                <h4>Description</h4>
                <p>{event.description}</p>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          <QrCodeSection eventId={event.id} />
        </div>
      </div>
    </div>
  );
};