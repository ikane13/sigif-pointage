import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../common/Modal/Modal';
import type { Event } from '../../../types/event.types';
import type { ParticipantListItem } from '../../../types/participant.types';
import type { Certificate, CertificateFormData } from '../../../types/certificate.types';
import { certificatesService } from '../../../services/certificatesService';
import styles from './GenerateCertificatesModal.module.scss';

interface GenerateCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  participants: ParticipantListItem[];
  attendedParticipantIds?: string[];
}

const GenerateCertificatesModal: React.FC<GenerateCertificatesModalProps> = ({
  isOpen,
  onClose,
  event,
  participants,
  attendedParticipantIds = [],
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCertificates, setExistingCertificates] = useState<Map<string, Certificate>>(new Map());
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<CertificateFormData>({
    selectedParticipantIds: attendedParticipantIds,
    eventTitle: event.title,
    eventType: event.eventType,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location || '',
    organizer: event.organizer || '',
    trainer: '',
    issuedAt: new Date().toISOString().split('T')[0],
    signatoryName: '',
    signatoryRole: '',
    signatureImageUrl: undefined,
  });

  // Charger les certificats existants
  useEffect(() => {
    if (isOpen) {
      loadExistingCertificates();
    }
  }, [isOpen, event.id]);

  const loadExistingCertificates = async () => {
    try {
      const certificates = await certificatesService.getCertificatesByEvent(event.id);
      const certMap = new Map(certificates.map(cert => [cert.participantId, cert]));
      setExistingCertificates(certMap);

      // Si des certificats existent, pré-remplir avec les dernières valeurs utilisées
      if (certificates.length > 0) {
        const lastCert = certificates[0];
        setFormData(prev => ({
          ...prev,
          organizer: lastCert.organizer || prev.organizer,
          trainer: lastCert.trainer || prev.trainer,
          signatoryName: lastCert.signatoryName,
          signatoryRole: lastCert.signatoryRole,
          signatureImageUrl: lastCert.signatureImageUrl,
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des certificats:', err);
    }
  };

  // Calculer la durée en heures
  const durationHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return undefined;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10; // Arrondi à 1 décimale
  }, [formData.startDate, formData.endDate]);

  const handleCheckboxChange = (participantId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedParticipantIds: prev.selectedParticipantIds.includes(participantId)
        ? prev.selectedParticipantIds.filter(id => id !== participantId)
        : [...prev.selectedParticipantIds, participantId],
    }));
  };

  // Filtrer les participants selon la recherche
  const attendedParticipants = useMemo(() => {
    const attended = participants.filter(p => attendedParticipantIds.includes(p.id));

    if (!searchQuery.trim()) return attended;

    const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return attended.filter(p => {
      const searchableText = [
        p.fullName,
        p.firstName,
        p.lastName,
        p.email,
        p.organization,
        p.function,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return searchableText.includes(query);
    });
  }, [participants, attendedParticipantIds, searchQuery]);

  const handleSelectAll = () => {
    const visibleIds = attendedParticipants.map(p => p.id);
    const allVisibleSelected = visibleIds.every(id => formData.selectedParticipantIds.includes(id));

    setFormData(prev => ({
      ...prev,
      selectedParticipantIds: allVisibleSelected
        ? prev.selectedParticipantIds.filter(id => !visibleIds.includes(id))
        : [...new Set([...prev.selectedParticipantIds, ...visibleIds])],
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5MB).');
      return;
    }

    setError(null);
    setUploadingSignature(true);

    try {
      const result = await certificatesService.uploadSignature(file);
      setFormData(prev => ({
        ...prev,
        signatureFile: file,
        signatureImageUrl: result.url,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload de la signature');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      signatureFile: undefined,
      signatureImageUrl: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.selectedParticipantIds.length === 0) {
      setError('Veuillez sélectionner au moins un participant');
      return;
    }

    if (!formData.signatoryName || !formData.signatoryRole) {
      setError('Veuillez renseigner le nom et la fonction du signataire');
      return;
    }

    setLoading(true);

    try {
      await certificatesService.generateBulkCertificates(event.id, {
        participantIds: formData.selectedParticipantIds,
        eventTitle: formData.eventTitle,
        eventType: formData.eventType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationHours,
        location: formData.location,
        organizer: formData.organizer,
        trainer: formData.trainer,
        issuedAt: formData.issuedAt,
        signatoryName: formData.signatoryName,
        signatoryRole: formData.signatoryRole,
        signatureImageUrl: formData.signatureImageUrl,
      });

      // Rediriger vers la page d'impression
      navigate(`/print/certificates/${event.id}`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la génération des certificats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Générer des attestations"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Section Sélection des participants */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Participants</h3>

          {/* Barre de recherche */}
          <div className={styles.searchBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un participant (nom, email, organisation...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchBtn}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.selectionSummary}>
            <span>
              {formData.selectedParticipantIds.length} participant(s) sélectionné(s)
              {searchQuery && ` • ${attendedParticipants.length} résultat(s)`}
            </span>
            <button
              type="button"
              className={styles.selectAllBtn}
              onClick={handleSelectAll}
            >
              {attendedParticipants.every(p => formData.selectedParticipantIds.includes(p.id))
                ? 'Tout décocher'
                : 'Tout cocher'}
            </button>
          </div>

          <div className={styles.participantsList}>
            {attendedParticipants.length === 0 ? (
              <div className={styles.noResults}>
                {searchQuery
                  ? `Aucun participant trouvé pour "${searchQuery}"`
                  : 'Aucun participant présent'}
              </div>
            ) : (
              attendedParticipants.map(participant => {
              const hasCert = existingCertificates.has(participant.id);
              const cert = existingCertificates.get(participant.id);

              return (
                <div key={participant.id} className={styles.participantItem}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={formData.selectedParticipantIds.includes(participant.id)}
                    onChange={() => handleCheckboxChange(participant.id)}
                  />
                  <div className={styles.participantInfo}>
                    <div className={styles.participantName}>
                      {participant.fullName || `${participant.firstName} ${participant.lastName}`}
                    </div>
                    <div className={styles.participantEmail}>{participant.email}</div>
                  </div>
                  {hasCert && (
                    <div className={styles.certificateBadge}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {cert?.certificateNumber}
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Section Données de l'événement */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Informations de l'événement</h3>

          <div className={styles.formGroup}>
            <label>Titre de l'événement *</label>
            <input
              type="text"
              value={formData.eventTitle}
              onChange={e => setFormData(prev => ({ ...prev, eventTitle: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Date de début *</label>
              <input
                type="date"
                value={formData.startDate?.split('T')[0]}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Date de fin</label>
              <input
                type="date"
                value={formData.endDate?.split('T')[0] || ''}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Lieu</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Durée (heures)</label>
              <input
                type="text"
                value={durationHours || ''}
                readOnly
                placeholder="Auto-calculée"
                disabled
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Organisme</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={e => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Formateur/Intervenant</label>
              <input
                type="text"
                value={formData.trainer}
                onChange={e => setFormData(prev => ({ ...prev, trainer: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Date de délivrance *</label>
            <input
              type="date"
              value={formData.issuedAt}
              onChange={e => setFormData(prev => ({ ...prev, issuedAt: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Section Signataire */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Signataire</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nom complet *</label>
              <input
                type="text"
                value={formData.signatoryName}
                onChange={e => setFormData(prev => ({ ...prev, signatoryName: e.target.value }))}
                required
                placeholder="ex: Dr. Jean DUPONT"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Fonction *</label>
              <input
                type="text"
                value={formData.signatoryRole}
                onChange={e => setFormData(prev => ({ ...prev, signatoryRole: e.target.value }))}
                required
                placeholder="ex: Directeur Général"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Signature / Cachet (optionnel)</label>
            <div className={styles.fileUpload}>
              {!formData.signatureImageUrl ? (
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    id="signature"
                    className={styles.fileInput}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
                    onChange={handleFileChange}
                    disabled={uploadingSignature}
                  />
                  <label htmlFor="signature" className={styles.fileLabel}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                    </svg>
                    {uploadingSignature ? 'Upload en cours...' : 'Choisir une image'}
                  </label>
                </div>
              ) : (
                <div className={styles.filePreview}>
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${formData.signatureImageUrl}`}
                    alt="Signature"
                  />
                  <span className={styles.fileName}>
                    {formData.signatureFile?.name || 'Signature uploadée'}
                  </span>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={handleRemoveFile}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || formData.selectedParticipantIds.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: loading ? '#ccc' : '#2c5f9f',
              color: 'white',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {loading && <span className={styles.loadingSpinner} />}
            {loading ? 'Génération...' : 'Générer et Imprimer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateCertificatesModal;
