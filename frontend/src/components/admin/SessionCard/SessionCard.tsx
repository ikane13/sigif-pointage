import { type FC, useEffect, useRef, useState } from 'react';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { Calendar, Clock, MapPin, Users, QrCode, MoreVertical } from 'lucide-react';
import { getSessionDisplayName, formatSessionDateFull, formatSessionTime } from '@/utils/session.utils';
import { SessionStatus } from '@/types/session.types';
import type { SessionCardProps } from './SessionCard.types';
import styles from './SessionCard.module.scss';

/**
 * SessionCard - Card individuelle pour une session
 */
export const SessionCard: FC<SessionCardProps> = ({
  session,
  onStatusChange,
  onViewQr,
  onViewAttendances,
  onEdit,
  onDelete,
  loading = false,
  canManage = true,
}) => {
  const isLocked =
    session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const statusLabels: Record<
    SessionStatus,
    { label: string; variant: 'success' | 'primary' | 'neutral' | 'danger' }
  > = {
    [SessionStatus.SCHEDULED]: { label: 'Planifiée', variant: 'primary' },
    [SessionStatus.ONGOING]: { label: 'En cours', variant: 'success' },
    [SessionStatus.COMPLETED]: { label: 'Terminée', variant: 'neutral' },
    [SessionStatus.CANCELLED]: { label: 'Annulée', variant: 'danger' },
  };

  const displayName = session.title?.trim() || session.label;
  const dateFormatted = formatSessionDateFull(session.sessionDate);
  const timeFormatted = formatSessionTime(session.startTime, session.endTime);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !menuOpen) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleMenuAction = (action?: () => void) => {
    setMenuOpen(false);
    action?.();
  };

  const canStart = session.status === SessionStatus.SCHEDULED;
  const canFinish = session.status === SessionStatus.ONGOING;
  const showPrimaryAction = canManage && (canStart || canFinish);

  return (
    <div className={`${styles.sessionCard} ${isLocked ? styles.locked : ''}`}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <h3 className={styles.sessionTitle}>{displayName}</h3>
          <p className={styles.sessionSubtitle}>Session #{session.sessionNumber}</p>
        </div>
        <div className={styles.cardHeaderRight}>
          <Badge variant={statusLabels[session.status].variant}>
            {statusLabels[session.status].label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.infoItem}>
          <Calendar size={18} />
          <span>{dateFormatted}</span>
        </div>

        {timeFormatted && (
          <div className={styles.infoItem}>
            <Clock size={18} />
            <span>{timeFormatted}</span>
          </div>
        )}

        {session.location && (
          <div className={styles.infoItem}>
            <MapPin size={18} />
            <span>{session.location}</span>
          </div>
        )}

        <div className={styles.infoItem}>
          <Users size={18} />
          <span>{session.attendanceCount ?? session.qrScanCount ?? 0} pointage(s)</span>
        </div>
      </div>

      {/* Footer - Actions */}
      <div className={styles.cardFooter}>
        <div className={styles.actionsRow}>
          {showPrimaryAction && (
            <Button
              fullWidth
              onClick={() =>
                onStatusChange?.(session.id, canStart ? 'ongoing' : 'completed')
              }
              disabled={loading || isLocked}
            >
              {canStart ? 'Démarrer la session' : 'Terminer la session'}
            </Button>
          )}

          <div className={styles.menuWrapper} ref={menuRef}>
            <button
              type="button"
              className={styles.menuTrigger}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={loading}
              title="Actions"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className={styles.menu} role="menu">
                {onViewAttendances && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => handleMenuAction(() => onViewAttendances(session.id))}
                  >
                    📊 Voir les présences
                  </button>
                )}

                {onViewQr && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => handleMenuAction(() => onViewQr(session.id))}
                  >
                    📱 Afficher le QR Code
                  </button>
                )}

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() =>
                    handleMenuAction(() =>
                      window.open(`/sessions/${session.id}/qr-display`, "_blank")
                    )
                  }
                >
                  🖥️ Afficher QR plein écran
                </button>

                {canManage && session.status === SessionStatus.ONGOING && (
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={() =>
                      handleMenuAction(() => onStatusChange?.(session.id, 'cancelled'))
                    }
                  >
                    ❌ Annuler la session
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
