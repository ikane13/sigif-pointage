import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { Select } from "@components/common/Select";
import { Loader } from "@components/common/Loader";
import { Calendar, MapPin, ArrowLeft, Users, Search, Building2, Award } from "lucide-react";
import { attendancesService } from "@services/attendancesService";
import { sessionsService } from "@services/sessionsService";
import { participantsService } from "@services/participantsService";
import { useSidebarContext } from "@components/layout/Sidebar/SidebarContext";
import GenerateCertificatesModal from "@components/admin/GenerateCertificatesModal/GenerateCertificatesModal";
import type { AttendanceListItem } from "@services/attendancesService";
import type { Session } from "@/types/session.types";
import type { ParticipantListItem } from "@/types/participant.types";
import type { Event } from "@/types/event.types";
import styles from "./EventAttendancesPage.module.scss";

type SessionOption = { value: string; label: string };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const EventAttendancesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setEvent: setSidebarEvent } = useSidebarContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AttendanceListItem[]>([]);
  const [eventMeta, setEventMeta] = useState<{
    id: string;
    title?: string;
    startDate?: string;
    endDate?: string | null;
    location?: string | null;
    organizer?: string | null;
    status?: string;
    eventType?: string;
    stats?: { total: number };
  } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);

  const [q, setQ] = useState("");
  const [sessionId, setSessionId] = useState("all");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [attendanceRes, sessionsRes, participantsRes] = await Promise.all([
          attendancesService.getByEvent(id, {
            page: 1,
            limit: 100000,
            sortBy: "checkInTime",
            sortOrder: "ASC",
          }),
          sessionsService.getByEvent(id),
          participantsService.getAll({ page: 1, limit: 100000 }),
        ]);

        setItems(attendanceRes.items ?? []);
        setEventMeta({
          id: attendanceRes.event?.id || id,
          title: attendanceRes.event?.title,
          startDate: attendanceRes.event?.startDate,
          endDate: attendanceRes.event?.endDate ?? null,
          location: attendanceRes.event?.location ?? null,
          organizer: attendanceRes.event?.organizer ?? null,
          status: attendanceRes.event?.status,
          eventType: attendanceRes.event?.eventType,
          stats: { total: attendanceRes.stats?.total ?? attendanceRes.items?.length ?? 0 },
        });
        setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
        setParticipants(participantsRes.items ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Erreur lors du chargement des présences");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!eventMeta) return;
    setSidebarEvent({
      id: eventMeta.id,
      title: eventMeta.title ?? "Événement",
      status: eventMeta.status ?? "scheduled",
      startDate: eventMeta.startDate ?? new Date().toISOString(),
      endDate: eventMeta.endDate ?? null,
      location: eventMeta.location ?? null,
      organizer: eventMeta.organizer ?? null,
      attendanceStats: eventMeta.stats
        ? { total: eventMeta.stats.total, withSignature: 0, withoutSignature: 0 }
        : undefined,
    });

    return () => setSidebarEvent(null);
  }, [eventMeta, setSidebarEvent]);

  const sessionOptions: SessionOption[] = useMemo(() => {
    const base = [{ value: "all", label: "Toutes les sessions" }];
    return base.concat(
      sessions.map((s) => ({
        value: s.id,
        label: s.label || `Session #${s.sessionNumber}`,
      }))
    );
  }, [sessions]);

  const filteredItems = useMemo(() => {
    const needle = normalize(q);
    return items.filter((item) => {
      if (sessionId !== "all" && item.session?.id !== sessionId) return false;
      if (!needle) return true;

      const p = item.participant ?? {};
      const hay = normalize(
        [
          p.fullName,
          p.email,
          p.organization,
          p.function,
          p.cniNumber,
          item.session?.label,
        ]
          .filter(Boolean)
          .join(" ")
      );
      return hay.includes(needle);
    });
  }, [items, q, sessionId]);

  // IDs des participants présents (ayant pointé)
  const attendedParticipantIds = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.participant?.id).filter(Boolean) as string[]));
  }, [items]);

  // Construire un objet Event complet pour la modal
  const eventForModal: Event | null = useMemo(() => {
    if (!eventMeta) return null;
    return {
      id: eventMeta.id,
      title: eventMeta.title || "Événement",
      eventType: eventMeta.eventType as any,
      startDate: eventMeta.startDate || new Date().toISOString(),
      endDate: eventMeta.endDate || undefined,
      location: eventMeta.location || "",
      organizer: eventMeta.organizer || "",
      status: eventMeta.status as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [eventMeta]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
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

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement des présences..." />
      </div>
    );
  }

  if (error || !eventMeta) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: "#DC3545", textAlign: "center" }}>
            {error || "Événement introuvable"}
          </p>
          <Button onClick={() => navigate("/events")} style={{ marginTop: "1rem" }}>
            Retour aux événements
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
          Retour
        </Button>
        <div className={styles.topActions}>
          <Button onClick={() => navigate(`/events/${eventMeta.id}`)}>
            Détail événement
          </Button>
          <Button
            variant="primary"
            icon={<Award size={18} />}
            onClick={() => setShowCertificatesModal(true)}
            disabled={attendedParticipantIds.length === 0}
          >
            Générer attestations
          </Button>
          <Button variant="secondary" onClick={() => window.open(`/events/${eventMeta.id}/attendances/print`, "_blank")}>
            Imprimer / Exporter PDF
          </Button>
        </div>
      </div>

      <Card>
        <div className={styles.header}>
          <div>
            <h2>Présences — {eventMeta.title}</h2>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <Calendar size={16} /> {formatDate(eventMeta.startDate)}
              </span>
              <span className={styles.dot} />
              <span className={styles.metaItem}>
                <MapPin size={16} /> {eventMeta.location || "—"}
              </span>
              <span className={styles.dot} />
              <span className={styles.metaItem}>
                <Building2 size={16} /> {eventMeta.organizer || "—"}
              </span>
              <span className={styles.dot} />
              <span className={styles.metaItem}>
                <Users size={16} /> {eventMeta.stats?.total ?? filteredItems.length} présences
              </span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.search}>
            <Input
              label="Rechercher"
              name="q"
              type="text"
              placeholder="Nom, email, organisation, CNI..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <Select
            label="Session"
            name="sessionId"
            value={sessionId}
            options={sessionOptions}
            onChange={(e) => setSessionId(e.target.value)}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 48 }}>N°</th>
                <th>Nom & Prénom</th>
                <th>Organisation</th>
                <th>Fonction</th>
                <th>Email</th>
                <th style={{ width: 120 }}>CNI</th>
                <th style={{ width: 140 }}>Session</th>
                <th style={{ width: 90 }}>Heure</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    Aucune présence.
                  </td>
                </tr>
              ) : (
                filteredItems.map((a, idx) => (
                  <tr key={a.id}>
                    <td>{idx + 1}</td>
                    <td className={styles.strong}>{a.participant?.fullName ?? "—"}</td>
                    <td>{a.participant?.organization ?? "—"}</td>
                    <td>{a.participant?.function ?? "—"}</td>
                    <td>{a.participant?.email ?? "—"}</td>
                    <td>{a.participant?.cniNumber ?? "—"}</td>
                    <td>{a.session?.label ?? "—"}</td>
                    <td>{formatTime(a.checkInTime ?? a.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de génération des certificats */}
      {eventForModal && (
        <GenerateCertificatesModal
          isOpen={showCertificatesModal}
          onClose={() => setShowCertificatesModal(false)}
          event={eventForModal}
          participants={participants}
          attendedParticipantIds={attendedParticipantIds}
        />
      )}
    </div>
  );
};
