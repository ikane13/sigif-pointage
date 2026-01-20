import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { attendancesService } from "@services/attendancesService";
import { sessionsService } from "@services/sessionsService";
import type { AttendanceListItem } from "@services/attendancesService";
import type { Session } from "@/types/session.types";
import banner from "@/assets/branding/dtai-banner.png";
import logo from "@/assets/branding/dtai-logo.png";
import styles from "./EventAttendancesPrintPage.module.scss";

type Grouped = {
  sessionId: string;
  sessionLabel: string;
  sessionDate: string;
  sessionLocation?: string | null;
  rows: AttendanceListItem[];
};

export const EventAttendancesPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AttendanceListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [eventMeta, setEventMeta] = useState<{
    title?: string;
    startDate?: string;
    endDate?: string | null;
    location?: string | null;
    organizer?: string | null;
  } | null>(null);
  const [signatureMap, setSignatureMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [attendanceRes, sessionsRes] = await Promise.all([
          attendancesService.getByEvent(id, {
            page: 1,
            limit: 100000,
            sortBy: "checkInTime",
            sortOrder: "ASC",
          }),
          sessionsService.getByEvent(id),
        ]);

        setItems(attendanceRes.items ?? []);
        setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
        setEventMeta({
          title: attendanceRes.event?.title,
          startDate: attendanceRes.event?.startDate,
          endDate: attendanceRes.event?.endDate ?? null,
          location: attendanceRes.event?.location ?? null,
          organizer: attendanceRes.event?.organizer ?? null,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Erreur lors du chargement des présences");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const grouped = useMemo<Grouped[]>(() => {
    const bySession: Record<string, Grouped> = {};

    for (const s of sessions) {
      bySession[s.id] = {
        sessionId: s.id,
        sessionLabel: s.label || `Session #${s.sessionNumber}`,
        sessionDate: formatDate(s.sessionDate),
        sessionLocation: s.location ?? null,
        rows: [],
      };
    }

    for (const item of items) {
      const sid = item.session?.id ?? "unknown";
      if (!bySession[sid]) {
        bySession[sid] = {
          sessionId: sid,
          sessionLabel: item.session?.label ?? "Session",
          sessionDate: formatDate(item.session?.sessionDate ?? null),
          sessionLocation: item.session?.location ?? null,
          rows: [],
        };
      }
      bySession[sid].rows.push(item);
    }

    return Object.values(bySession);
  }, [items, sessions]);

  useEffect(() => {
    let active = true;

    const loadSignatures = async () => {
      const targets = items.filter(
        (item) => item.hasSignature && !signatureMap[item.id]
      );

      if (!targets.length) return;

      for (const attendance of targets) {
        try {
          const res = await attendancesService.getSignature(attendance.id);
          const raw = res.signatureData;
          const format = (res.signatureFormat || "png").toLowerCase();
          const url = raw.startsWith("data:image/")
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
  }, [items, signatureMap]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
        <div className={styles.error}>{error || "Événement introuvable"}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.topBar} ${styles.noPrint}`}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Button onClick={() => window.print()}>
          Imprimer / Exporter PDF
        </Button>
      </div>

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

      <div className={styles.header}>
        <div className={styles.headerTitle}>Feuille de presence</div>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Evenement</div>
            <div className={styles.metaValue}>{eventMeta?.title ?? "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Date debut</div>
            <div className={styles.metaValue}>{formatDate(eventMeta?.startDate)}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Date fin</div>
            <div className={styles.metaValue}>{formatDate(eventMeta?.endDate ?? null)}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Lieu</div>
            <div className={styles.metaValue}>{eventMeta?.location ?? "—"}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Organisateur</div>
            <div className={styles.metaValue}>{eventMeta?.organizer ?? "—"}</div>
          </div>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.sessionId} className={styles.sessionBlock}>
          <div className={styles.sessionHeader}>
            <div>
              <div className={styles.sessionTitle}>{group.sessionLabel}</div>
              <div className={styles.sessionMeta}>
                <span>Date: {group.sessionDate}</span>
                <span className={styles.dot} />
                <span>Lieu: {group.sessionLocation ?? "—"}</span>
              </div>
            </div>
            <div className={styles.sessionCount}>{group.rows.length} presence(s)</div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>N°</th>
                  <th>Nom & Prenom</th>
                  <th>Organisation</th>
                  <th>Fonction</th>
                  <th>Email</th>
                  <th style={{ width: 140 }}>CNI</th>
                  <th style={{ width: 130 }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Aucune presence.
                    </td>
                  </tr>
                ) : (
                  group.rows.map((a, idx) => (
                    <tr key={a.id}>
                      <td>{idx + 1}</td>
                      <td className={styles.strong}>{a.participant?.fullName ?? "—"}</td>
                      <td>{a.participant?.organization ?? "—"}</td>
                      <td>{a.participant?.function ?? "—"}</td>
                      <td>{a.participant?.email ?? "—"}</td>
                      <td>{a.participant?.cniNumber ?? "—"}</td>
                      <td className={styles.signatureCell}>
                        {a.hasSignature ? (
                          signatureMap[a.id] ? (
                            <img
                              className={styles.signatureImage}
                              src={signatureMap[a.id]}
                              alt={`Signature ${a.participant?.fullName ?? ""}`}
                            />
                          ) : (
                            <span className={styles.signaturePending}>Chargement...</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
