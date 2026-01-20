import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Loader } from "@components/common/Loader";
import { Calendar, MapPin, Users, Plus, Building2, MoreVertical } from "lucide-react";
import { eventsService } from "@services/eventsService";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Event, EventStatus, EventType } from "@/types/event.types";

import { EventsToolbar } from "@components/admin/Events/EventsToolbar";
import { EventsStats } from "@components/admin/Events/EventsStats";
import type { EventsFiltersValue } from "@components/admin/Events/EventsToolbar";

import styles from "./Events.module.scss";

import { Pagination } from "@components/common/Pagination";

const statusLabels: Record<
  EventStatus,
  { label: string; variant: "success" | "primary" | "neutral" | "danger" }
> = {
  scheduled: { label: "Planifié", variant: "primary" },
  ongoing: { label: "En cours", variant: "success" },
  completed: { label: "Terminé", variant: "neutral" },
  cancelled: { label: "Annulé", variant: "danger" },
};

const defaultFilters: EventsFiltersValue = {
  q: "",
  status: "all",
  eventType: "all",
  period: "all",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

export const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<EventsFiltersValue>(defaultFilters);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Pagination front (préparation)
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getAll();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des événements");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrage front
  const filteredEvents = useMemo(() => {
    const q = normalize(filters.q);
    const now = new Date();

    let from: Date | null = null;
    let to: Date | null = null;

    if (filters.period === "today") {
      from = new Date(now);
      to = new Date(now);
    } else if (filters.period === "thisMonth") {
      from = startOfMonth(now);
      to = endOfMonth(now);
    } else if (filters.period === "lastMonth") {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from = startOfMonth(last);
      to = endOfMonth(last);
    } else if (filters.period === "custom") {
      if (filters.from) from = new Date(`${filters.from}T00:00:00`);
      if (filters.to) to = new Date(`${filters.to}T23:59:59`);
    }

    return (Array.isArray(events) ? events : []).filter((ev) => {
      if (q) {
        const hay = normalize(
          [
            ev.title,
            ev.location ?? "",
            ev.description ?? "",
            ev.organizer ?? "",
          ].join(" ")
        );
        if (!hay.includes(q)) return false;
      }

      if (filters.status !== "all" && ev.status !== filters.status)
        return false;
      if (filters.eventType !== "all" && ev.eventType !== filters.eventType)
        return false;

      if (from || to) {
        const d = new Date(ev.startDate);
        if (filters.period === "today") {
          if (!isSameDay(d, now)) return false;
        } else {
          if (from && d < from) return false;
          if (to && d > to) return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  // Stats sur la liste filtrée
  const stats = useMemo(() => {
    const base = {
      total: filteredEvents.length,
      scheduled: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const e of filteredEvents)
      base[e.status] = (base[e.status] as number) + 1;
    return base;
  }, [filteredEvents]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageEvents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, safePage]);

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !openMenuId) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader
          variant="spinner"
          size="lg"
          text="Chargement des événements..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: "#DC3545", textAlign: "center" }}>{error}</p>
          <Button onClick={loadEvents} style={{ marginTop: "1rem" }}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.eventsPage}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div>
            <h1>Événements</h1>
            <p className={styles.subtitle}>
              {filteredEvents.length} événement(s)
            </p>
          </div>
          <Button
            icon={<Plus size={20} />}
            onClick={() => navigate("/events/new")}
          >
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Toolbar (recherche + filtres) */}
      <EventsToolbar
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {/* Stats rapides */}
      <EventsStats value={stats} />

      {/* Empty global */}
      {events.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Calendar
              size={48}
              style={{ color: "#ADB5BD", margin: "0 auto 1rem" }}
            />
            <h3>Aucun événement</h3>
            <p style={{ color: "#6C757D", marginTop: "0.5rem" }}>
              Commencez par créer votre premier événement
            </p>
            <Button
              onClick={() => navigate("/events/new")}
              style={{ marginTop: "1.5rem" }}
            >
              Créer un événement
            </Button>
          </div>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <div className={styles.emptyFiltered}>
            Aucun événement ne correspond aux critères.
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.grid}>
            {pageEvents.map((event) => (
              <Card
                key={event.id}
                hoverable
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className={styles.eventCard}>
                  <div className={styles.cardHeader}>
                    <h3>{event.title}</h3>
                    <div className={styles.cardHeaderActions}>
                      <Badge variant={statusLabels[event.status].variant}>
                        {statusLabels[event.status].label}
                      </Badge>
                      <div
                        className={styles.menuWrapper}
                        ref={openMenuId === event.id ? menuRef : null}
                      >
                        <button
                          type="button"
                          className={styles.menuTrigger}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((prev) => (prev === event.id ? null : event.id));
                          }}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === event.id}
                          title="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === event.id && (
                          <div
                            className={styles.menu}
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={styles.menuItem}
                              onClick={() => navigate(`/events/${event.id}/attendances`)}
                            >
                              📊 Voir présences (toutes sessions)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.info}>
                      <Calendar size={16} />
                      <span>{formatDate(event.startDate)}</span>
                    </div>

                    <div className={styles.info}>
                      <MapPin size={16} />
                      <span>{event.location ?? "—"}</span>
                    </div>

                    <div className={styles.info}>
                      <Building2 size={16} />
                      <span>{event.organizer ?? "—"}</span>
                    </div>

                    {/* Cohérent avec la migration sessions */}
                    <div className={styles.info}>
                      <Users size={16} />
                      <span>{event.sessions?.length ?? 0} session(s)</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredEvents.length}
            onPageChange={setPage}
            showWhenSinglePage
          />
        </>
      )}
    </div>
  );
};
