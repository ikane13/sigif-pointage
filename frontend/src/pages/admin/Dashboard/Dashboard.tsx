import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Badge } from "@components/common/Badge";
import { Loader } from "@components/common/Loader";
import { Calendar, Users, ClipboardList, Activity, QrCode, Printer } from "lucide-react";
import { eventsService } from "@services/eventsService";
import { sessionsService } from "@services/sessionsService";
import { participantsService } from "@services/participantsService";
import type { Session } from "@/types/session.types";
import type { Event, EventStatus } from "@/types/event.types";
import styles from "./Dashboard.module.scss";

type EventItem = Event & { attendanceCount?: number };

const statusLabels: Record<EventStatus, { label: string; variant: "success" | "primary" | "neutral" | "danger" }> = {
  scheduled: { label: "Planifié", variant: "primary" },
  ongoing: { label: "En cours", variant: "success" },
  completed: { label: "Terminé", variant: "neutral" },
  cancelled: { label: "Annulé", variant: "danger" },
};

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participantsTotal, setParticipantsTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const eventsData = await eventsService.getAll();
        const eventList = Array.isArray(eventsData) ? eventsData : [];
        setEvents(eventList);

        const participantData = await participantsService.getAll({ page: 1, limit: 1 });
        setParticipantsTotal(participantData.meta?.total ?? 0);

        const sessionLists = await Promise.all(
          eventList.slice(0, 10).map((ev) => sessionsService.getByEvent(ev.id))
        );
        const allSessions = sessionLists.flat();
        setSessions(allSessions);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalSessions = sessions.length;
  const totalAttendances = events.reduce(
    (sum, ev) => sum + (ev.attendanceCount ?? 0),
    0
  );

  const recentEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 5),
    [events]
  );

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
        .slice(0, 5),
    [sessions]
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.kpiGrid}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={styles.kpiSkeleton} />
          ))}
        </div>
        <div className={styles.sectionSkeleton} />
        <div className={styles.sectionSkeleton} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Calendar size={22} />
            </div>
            <div>
              <div className={styles.kpiLabel}>Événements</div>
              <div className={styles.kpiValue}>{events.length}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <ClipboardList size={22} />
            </div>
            <div>
              <div className={styles.kpiLabel}>Sessions</div>
              <div className={styles.kpiValue}>{totalSessions}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Users size={22} />
            </div>
            <div>
              <div className={styles.kpiLabel}>Participants</div>
              <div className={styles.kpiValue}>{participantsTotal}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Activity size={22} />
            </div>
            <div>
              <div className={styles.kpiLabel}>Présences</div>
              <div className={styles.kpiValue}>{totalAttendances}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card header="Derniers événements">
        {recentEvents.length === 0 ? (
          <div className={styles.empty}>Aucun événement récent.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Créé par</th>
                  <th>Statut</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td className={styles.strong}>{ev.title}</td>
                    <td>{formatDate(ev.startDate)}</td>
                    <td>{ev.location ?? "—"}</td>
                    <td>
                      {(ev as any).createdBy?.fullName ||
                        (ev as any).createdBy?.email ||
                        "—"}
                    </td>
                    <td>
                      <Badge variant={statusLabels[ev.status].variant}>
                        {statusLabels[ev.status].label}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/events/${ev.id}`} className={styles.tableLink}>
                        Voir détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card header="Dernières sessions">
        {recentSessions.length === 0 ? (
          <div className={styles.empty}>Aucune session récente.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>QR</th>
                  <th>Présences</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td className={styles.strong}>{session.label}</td>
                    <td>{formatDate(session.sessionDate)}</td>
                    <td>
                      <Badge variant={statusLabels[session.status as EventStatus].variant}>
                        {statusLabels[session.status as EventStatus].label}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/sessions/${session.id}/qr-display`} className={styles.iconLink}>
                        <QrCode size={16} />
                      </Link>
                    </td>
                    <td className={styles.actionsCell}>
                      <Link to={`/events/${session.eventId}/attendances`} className={styles.tableLink}>
                        Présences
                      </Link>
                      <Link to={`/sessions/${session.id}/attendances/print`} className={styles.iconLink}>
                        <Printer size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
