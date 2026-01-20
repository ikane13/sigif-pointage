import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/common/Button';
import { Loader } from '@components/common/Loader';
import { attendancesService } from '@services/attendancesService';
import type { AttendanceListItem } from '@services/attendancesService';
import banner from '@/assets/branding/dtai-banner.png';
import logo from '@/assets/branding/dtai-logo.png';
import styles from './SessionAttendancesPrintPage.module.scss';

type ApiData = {
  session?: {
    id: string;
    sessionNumber: number;
    sessionDate: string;
    label: string;
    location?: string | null;
  };
  items: AttendanceListItem[];
  meta?: { total: number };
  stats?: {
    total: number;
    withSignature: number;
    withoutSignature: number;
    signatureRate: string;
  };
};

export const SessionAttendancesPrintPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<ApiData | null>(null);
  const [signatureMap, setSignatureMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError(null);

        // On charge "large" (tout). Ton backend supporte limit.
        const res = await attendancesService.getBySession(sessionId, {
          page: 1,
          limit: 100000,
          sortBy: 'checkInTime',
          sortOrder: 'ASC',
        });

        // res contient seulement items/total/page/limit côté frontend,
        // mais ton backend renvoie aussi event/session/stats.
        // Donc on va refaire un GET brut via api si tu veux 100% meta.
        // Ici : on s'appuie sur items + total (et on affiche session via 1er item/session si dispo en item)
        // => Si tu veux stats/session exacts : je te donne une option plus bas.

        setData({
          items: res.items,
          meta: { total: res.total },
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erreur lors du chargement des présences');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId]);

  const rows = data?.items ?? [];

  useEffect(() => {
    let active = true;

    const loadSignatures = async () => {
      const targets = rows.filter(
        (item) => item.hasSignature && !signatureMap[item.id]
      );

      if (!targets.length) return;

      for (const attendance of targets) {
        try {
          const res = await attendancesService.getSignature(attendance.id);
          const raw = res.signatureData;
          const format = (res.signatureFormat || 'png').toLowerCase();
          const url = raw.startsWith('data:image/')
            ? raw
            : `data:image/${format};base64,${raw}`;

          if (!active) return;
          setSignatureMap((prev) => ({ ...prev, [attendance.id]: url }));
        } catch {
          // Ignore signature errors for print; keep placeholder.
        }
      }
    };

    loadSignatures();

    return () => {
      active = false;
    };
  }, [rows, signatureMap]);

  const headerInfo = useMemo(() => {
    const first = rows[0] as any;

    const eventTitle = first?.event?.title ?? '—';
    const eventType = first?.event?.eventType ?? '—';
    const eventStartDate = first?.event?.startDate ?? null;
    const eventOrganizer = first?.event?.organizer ?? '—';

    const sessionLabel = first?.session?.label ?? '—';
    const sessionDate = first?.session?.sessionDate ?? '—';
    const location = first?.session?.location ?? '—';

    const fmtDateTime = (iso?: string | null) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const eventTypeFR = (t?: string) => {
      switch (t) {
        case 'workshop':
          return 'Atelier';
        case 'training':
          return 'Formation';
        case 'committee':
          return 'Comité';
        case 'seminar':
          return 'Séminaire';
        case 'meeting':
          return 'Réunion';
        case 'other':
          return 'Autre';
        default:
          return t ?? '—';
      }
    };

    return {
      eventTitle,
      eventTypeFR: eventTypeFR(eventType),
      eventStartDateLabel: fmtDateTime(eventStartDate),
      eventOrganizer,
      sessionLabel,
      sessionDate,
      location,
      generatedAt: fmtDateTime(new Date().toISOString()),
      total: data?.meta?.total ?? rows.length,
    };
  }, [rows, data?.meta?.total]);

  const fmtTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
        <div className={styles.error}>
          {error || 'Session introuvable'}
        </div>
      </div>
    );
  }

  return (
    
    <div className={styles.page}>
      {/* Zone actions non imprimable */}
      <div className={`${styles.topBar} ${styles.noPrint}`}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Button onClick={() => window.print()}>
          Imprimer / Exporter PDF
        </Button>
      </div>

      {/* Bandeau institutionnel */}
      <div className={styles.brandHeader}>
        <img
          className={styles.banner}
          src={banner}
          alt="Republique du Senegal - Ministere des Finances et du Budget"
        />
        <div className={styles.brandInner}>
          <img className={styles.logo} src={logo} alt="DTAI" />
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>Systeme de Pointage</div>
            <div className={styles.brandSubtitle}>
              Direction du Traitement Automatique de l'Information (DTAI)
            </div>
          </div>
        </div>
      </div>

      {/* Header institutionnel */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>Feuille de présence</div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Événement</div>
            <div className={styles.metaValue}>{headerInfo.eventTitle}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Type</div>
            <div className={styles.metaValue}>{headerInfo.eventTypeFR}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Date événement</div>
            <div className={styles.metaValue}>{headerInfo.eventStartDateLabel}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Organisateur</div>
            <div className={styles.metaValue}>{headerInfo.eventOrganizer}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Session</div>
            <div className={styles.metaValue}>{headerInfo.sessionLabel}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Date session</div>
            <div className={styles.metaValue}>{headerInfo.sessionDate}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Lieu</div>
            <div className={styles.metaValue}>{headerInfo.location}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Total présences</div>
            <div className={styles.metaValue}>{headerInfo.total}</div>
          </div>

          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Généré le</div>
            <div className={styles.metaValue}>{headerInfo.generatedAt}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>N°</th>
              <th>Nom & Prénom</th>
              <th>Organisation</th>
              <th>Fonction</th>
              <th>Email</th>
              <th style={{ width: 140 }}>CNI</th>
              <th style={{ width: 90 }} className={styles.noPrint}>Heure</th>
              <th style={{ width: 110 }}>Signature</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Aucune présence.
                </td>
              </tr>
            ) : (
              rows.map((a: any, idx: number) => (
                <tr key={a.id}>
                  <td>{idx + 1}</td>
                  <td className={styles.strong}>{a.participant?.fullName ?? '—'}</td>
                  <td>{a.participant?.organization ?? '—'}</td>
                  <td>{a.participant?.function ?? '—'}</td>
                  <td>{a.participant?.email ?? '—'}</td>
                  <td>{a.participant?.cniNumber ?? '—'}</td>
                  <td className={styles.noPrint}>{fmtTime(a.checkInTime ?? a.createdAt)}</td>
                  <td className={styles.signatureCell}>
                    {a.hasSignature ? (
                      signatureMap[a.id] ? (
                        <img
                          className={styles.signatureImage}
                          src={signatureMap[a.id]}
                          alt={`Signature ${a.participant?.fullName ?? ''}`}
                        />
                      ) : (
                        <span className={styles.signaturePending}>Chargement...</span>
                      )
                    ) : (
                      'Non'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer print */}
      <div className={styles.footer}>
        Document généré via SIGIF POINTAGE — Direction du Traitement Automatique de l’Information (DTAI)
      </div>
    </div>
  );
};
