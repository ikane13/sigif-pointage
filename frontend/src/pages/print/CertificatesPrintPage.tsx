import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificatesService } from '../../services/certificatesService';
import type { Certificate } from '../../types/certificate.types';
import { EventType } from '../../types/event.types';
import styles from './CertificatesPrintPage.module.scss';

// Mapping des types d'événements en français
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.WORKSHOP]: 'Atelier',
  [EventType.TRAINING]: 'Formation',
  [EventType.SEMINAR]: 'Séminaire',
  [EventType.MEETING]: 'Réunion',
  [EventType.COMMITTEE]: 'Comité',
  [EventType.OTHER]: 'Autre',
};

const CertificatesPrintPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadCertificates();
    }
  }, [eventId]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificatesService.getCertificatesByEvent(eventId!);
      setCertificates(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des certificats');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    navigate(-1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return `le ${formatDate(startDate)}`;
    }
    return `du ${formatDate(startDate)} au ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des attestations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Erreur</h3>
          <p>{error}</p>
          <button onClick={handleClose} className={styles.btnPrimary}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Aucune attestation</h3>
          <p>Aucune attestation n'a été trouvée pour cet événement.</p>
          <button onClick={handleClose} className={styles.btnPrimary}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header - visible seulement à l'écran */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Attestations - {certificates[0]?.eventTitle} ({certificates.length})
        </h1>
        <div className={styles.actions}>
          <button onClick={handleClose} className={styles.btnSecondary}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            Fermer
          </button>
          <button onClick={handlePrint} className={styles.btnPrimary}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      {/* Certificats */}
      <div className={styles.certificatesWrapper}>
        {certificates.map((certificate) => (
          <div key={certificate.id} className={styles.certificate}>
            {/* Bordures décoratives */}
            <div className={`${styles.decorativeBorder} ${styles.top}`} />
            <div className={`${styles.decorativeBorder} ${styles.bottom}`} />

            {/* Header */}
            <div className={styles.certificateHeader}>
              {/* Logo - À remplacer par le vrai logo */}
              {/* <img src="/logo.png" alt="Logo" className={styles.logo} /> */}

              {certificate.organizer && (
                <div className={styles.organizer}>{certificate.organizer}</div>
              )}

              <h1 className={styles.certificateTitle}>Attestation de Participation</h1>

              <div className={styles.eventTypeBadge} data-type={certificate.eventType}>
                {EVENT_TYPE_LABELS[certificate.eventType as EventType]}
              </div>

              <div className={styles.certificateNumber}>
                N° {certificate.certificateNumber}
              </div>
            </div>

            {/* Body */}
            <div className={styles.certificateBody}>
              <p className={styles.introText}>
                Il est attesté par la présente que
              </p>

              <div className={styles.participantName}>
                {certificate.participant?.firstName} {certificate.participant?.lastName}
              </div>

              <p className={styles.introText}>
                a participé {certificate.eventType === EventType.TRAINING ? 'à la formation' :
                            certificate.eventType === EventType.WORKSHOP ? 'à l\'atelier' :
                            certificate.eventType === EventType.SEMINAR ? 'au séminaire' : 'à l\'événement'} intitulé(e) :
              </p>

              <div className={styles.eventDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Titre :</span>
                  <span className={styles.detailValue}>{certificate.eventTitle}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date(s) :</span>
                  <span className={styles.detailValue}>
                    {formatDateRange(certificate.startDate, certificate.endDate)}
                  </span>
                </div>

                {certificate.durationHours && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Durée :</span>
                    <span className={styles.detailValue}>{certificate.durationHours} heure(s)</span>
                  </div>
                )}

                {certificate.location && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Lieu :</span>
                    <span className={styles.detailValue}>{certificate.location}</span>
                  </div>
                )}

                {certificate.trainer && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Formateur :</span>
                    <span className={styles.detailValue}>{certificate.trainer}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.issuedDate}>
                Fait à {certificate.location || '.....................'}, le {formatDate(certificate.issuedAt)}
              </div>

              <div className={styles.signature}>
                <div className={styles.signatureLabel}>Le Signataire</div>

                {certificate.signatureImageUrl && (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${certificate.signatureImageUrl}`}
                    alt="Signature"
                    className={styles.signatureImage}
                  />
                )}

                <div className={styles.signatoryName}>{certificate.signatoryName}</div>
                <div className={styles.signatoryRole}>{certificate.signatoryRole}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPrintPage;
