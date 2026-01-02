import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { CheckCircle, Calendar, MapPin, User, Mail } from 'lucide-react';
import styles from './ConfirmationPage.module.scss';

export const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { event, participant } = location.state || {};

  if (!event || !participant) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <Card>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>❌</div>
              <h2>Page introuvable</h2>
              <p>Aucune information de pointage disponible.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>DTAI</div>
        </div>

        <Card>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle size={64} />
            </div>

            <h1>Présence confirmée !</h1>
            <p className={styles.successMessage}>
              Votre présence a été enregistrée avec succès.
            </p>

            <div className={styles.divider} />

            <div className={styles.details}>
              <h3>Récapitulatif</h3>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Calendar size={20} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Événement</div>
                    <div className={styles.detailValue}>{event.eventTitle}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <MapPin size={20} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Lieu</div>
                    <div className={styles.detailValue}>{event.eventLocation}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <Calendar size={20} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Date</div>
                    <div className={styles.detailValue}>{formatDate(event.eventDate)}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <User size={20} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Participant</div>
                    <div className={styles.detailValue}>
                      {participant.firstName} {participant.lastName}
                    </div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <Mail size={20} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Email</div>
                    <div className={styles.detailValue}>{participant.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.footer}>
              <p className={styles.footerText}>
                Un email de confirmation vous a été envoyé à <strong>{participant.email}</strong>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};