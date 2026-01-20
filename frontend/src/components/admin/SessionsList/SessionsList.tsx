/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FC, useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Loader } from '@components/common/Loader';
import { Modal } from '@components/common/Modal';
import { Badge } from '@components/common/Badge';
import { SessionCard } from '@components/admin/SessionCard';
import { Input } from '@components/common/Input';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, AlertCircle, Copy, Check, Download, Plus } from 'lucide-react';
import { sessionsService } from '@services/sessionsService';
import { qrCodesService } from '@services/qrCodesService';
import { eventsService } from '@services/eventsService';
import { getSessionDisplayName, formatSessionDateFull } from '@/utils/session.utils';
import type { Session } from '@/types/session.types';
import type { QrCodeInfo } from '@/types/event.types';
import type { SessionsListProps } from './SessionsList.types';
import styles from './SessionsList.module.scss';
import { SessionAttendancesModal } from '@components/admin/SessionAttendancesModal';

export const SessionsList: FC<SessionsListProps> = ({
  eventId,
  eventStatus,
  canManage = true,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal QR Code
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [qrInfo, setQrInfo] = useState<QrCodeInfo | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal Présences
  const [showAttendancesModal, setShowAttendancesModal] = useState(false);
  const [selectedAttendancesSession, setSelectedAttendancesSession] = useState<Session | null>(null);
  const [eventLocation, setEventLocation] = useState<string | null>(null);

  // Modal création session
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    sessionDate: '',
  });

  const isEventLocked = eventStatus === 'completed' || eventStatus === 'cancelled';

  useEffect(() => {
    loadSessions();
    loadEventLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionsService.getByEvent(eventId);
      setSessions(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadEventLocation = async () => {
    try {
      const event = await eventsService.getById(eventId);
      setEventLocation(event.location ?? null);
    } catch {
      setEventLocation(null);
    }
  };

  const handleGenerateDaily = async () => {
    if (!canManage) return;
    try {
      setGenerating(true);
      setError(null);
      const result = await sessionsService.generateDaily(eventId);

      await loadSessions();
      alert(`${result.created} session(s) créée(s) sur ${result.totalDays} jour(s)`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la génération des sessions');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (
    sessionId: string,
    status: 'ongoing' | 'completed' | 'cancelled'
  ) => {
    if (!canManage) return;
    try {
      setActionLoading(sessionId);
      setError(null);
      await sessionsService.updateStatus(sessionId, status);
      await loadSessions();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewQr = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    setSelectedSession(session);
    setShowQrModal(true);
    setLoadingQr(true);
    setQrInfo(null);

    try {
      if (session.qrToken) {
        const data = await qrCodesService.getInfo(sessionId);
        setQrInfo(data);
      } else {
        const data = await qrCodesService.generate(sessionId);
        setQrInfo(data);
        await loadSessions();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement du QR code');
      setShowQrModal(false);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleViewAttendances = (sessionId: string) => {
    const s = sessions.find((x) => x.id === sessionId) || null;
    setSelectedAttendancesSession(s);
    setShowAttendancesModal(true);
  };

  const handleCopyUrl = async () => {
    if (!qrInfo) return;

    try {
      await navigator.clipboard.writeText(qrInfo.urls.pointage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  const handleDownloadQr = async (format: 'png' | 'pdf') => {
    if (!selectedSession) return;

    try {
      const blob =
        format === 'png'
          ? await qrCodesService.downloadPng(selectedSession.id)
          : await qrCodesService.downloadPdf(selectedSession.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-session-${selectedSession.sessionNumber}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du téléchargement');
    }
  };

  const handleCreateSession = async () => {
    if (!canManage) return;
    if (!eventId) return;

    const lastSession = sessions[sessions.length - 1];
    const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;
    const baseDate = lastSession?.sessionDate
      ? new Date(lastSession.sessionDate)
      : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + 1);
    const defaultDate = nextDate.toISOString().slice(0, 10);
    const sessionDate = formData.sessionDate || defaultDate;

    try {
      setCreating(true);
      setFormError(null);

      const label = `Session du ${sessionDate}`;

      await sessionsService.create(eventId, {
        sessionNumber,
        sessionDate,
        label,
        title: formData.title || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        location: formData.location || eventLocation || undefined,
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        location: '',
        sessionDate: '',
      });
      await loadSessions();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card header="Sessions" className={styles.sessionsCard}>
        <div className={styles.loading}>
          <Loader variant="spinner" size="lg" text="Chargement des sessions..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.sessionsCard}>
      <div className={styles.sessionsList}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h3>Sessions ({sessions.length})</h3>
          </div>
          <div className={styles.headerRight}>
            {!isEventLocked && canManage && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={16} />}
                onClick={() => setShowCreateModal(true)}
              >
                Ajouter une session
              </Button>
            )}
            {sessions.length === 0 && !isEventLocked && canManage && (
              <Button
                size="sm"
                icon={<Calendar size={16} />}
                onClick={handleGenerateDaily}
                loading={generating}
              >
                Générer automatiquement
              </Button>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Calendar size={32} />
            </div>
            <h4>Aucune session</h4>
            <p>
              Cet événement n'a pas encore de sessions. <br />
              Générez automatiquement une session par jour ou créez-les manuellement.
            </p>
            {!isEventLocked && canManage && (
              <Button icon={<Calendar size={18} />} onClick={handleGenerateDaily} loading={generating}>
                Générer automatiquement
              </Button>
            )}
          </div>
        )}

        {/* Grid sessions */}
        {sessions.length > 0 && (
          <div className={styles.sessionGrid}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onStatusChange={handleStatusChange}
                onViewQr={handleViewQr}
                onViewAttendances={handleViewAttendances}
                canManage={canManage}
                loading={actionLoading === session.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="QR Code de pointage" size="md">
        <div className={styles.qrModal}>
          {loadingQr ? (
            <div className={styles.loading}>
              <Loader variant="spinner" size="lg" text="Chargement du QR code..." />
            </div>
          ) : (
            <div className={styles.qrContent}>
              {selectedSession && (
                <div className={styles.qrInfo}>
                  <h3>{getSessionDisplayName(selectedSession)}</h3>
                  <p>{formatSessionDateFull(selectedSession.sessionDate)}</p>
                  <Badge variant="success" size="sm">
                    {selectedSession?.attendanceCount ?? 0} pointage(s)
                  </Badge>
                </div>
              )}

              {qrInfo && (
                <>
                  <div className={styles.qrCanvas}>
                    <div className={styles.qrImage}>
                      <QRCodeSVG value={qrInfo.urls.pointage} size={260} level="H" includeMargin={false} />
                    </div>
                  </div>

                  <div className={styles.urlBox}>
                    <input type="text" value={qrInfo.urls.pointage} readOnly />
                    <button onClick={handleCopyUrl}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>

                  <div className={styles.qrActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download size={16} />}
                      onClick={() => handleDownloadQr('png')}
                      fullWidth
                    >
                      Télécharger PNG
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={16} />}
                      onClick={() => handleDownloadQr('pdf')}
                      fullWidth
                    >
                      Télécharger PDF
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Présences session */}
      <SessionAttendancesModal
        isOpen={showAttendancesModal}
        onClose={() => setShowAttendancesModal(false)}
        session={selectedAttendancesSession}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter une session"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateSession} loading={creating}>
              Créer la session
            </Button>
          </>
        }
      >
        <div className={styles.createForm}>
          {formError && <div className={styles.formError}>{formError}</div>}
          <div className={styles.autoFields}>
            <div className={styles.autoItem}>
              <div className={styles.autoLabel}>Numéro</div>
              <div className={styles.autoValue}>
                {sessions.length ? sessions[sessions.length - 1].sessionNumber + 1 : 1}
              </div>
            </div>
            <div className={styles.autoItem}>
              <div className={styles.autoLabel}>Libellé</div>
              <div className={styles.autoValue}>
                {(() => {
                  const last = sessions[sessions.length - 1];
                  const base = last?.sessionDate ? new Date(last.sessionDate) : new Date();
                  const next = new Date(base);
                  next.setDate(base.getDate() + 1);
                  const defaultDate = next.toISOString().slice(0, 10);
                  const labelDate = formData.sessionDate || defaultDate;
                  return `Session du ${labelDate}`;
                })()}
              </div>
            </div>
          </div>

          <Input
            label="Titre (optionnel)"
            name="title"
            type="text"
            placeholder="Ex : Session de clôture"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Input
            label="Date de la session"
            name="sessionDate"
            type="date"
            value={formData.sessionDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, sessionDate: e.target.value }))}
            helperText="Laissez vide pour proposer automatiquement la date suivante."
          />

          <div className={styles.formRow}>
            <Input
              label="Heure début (optionnel)"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
            />
            <Input
              label="Heure fin (optionnel)"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endTime: e.target.value }))
              }
            />
          </div>

          <Input
            label="Lieu (optionnel)"
            name="location"
            type="text"
            placeholder="Ex : Salle de réunion"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
          />
        </div>
      </Modal>
    </Card>
  );
};
