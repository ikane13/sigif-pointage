import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Loader } from "@components/common/Loader";
import { Modal } from "@components/common/Modal";
import { SessionsList } from "@components/admin/SessionsList"; // ✅ NOUVEAU
import { useSidebarContext } from "@components/layout/Sidebar/SidebarContext";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  User,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  MoreVertical,
} from "lucide-react";
import { eventsService } from "@services/eventsService";
import { authService } from "@services/authService";
import type { Event, EventStatus, EventType } from "@/types/event.types";
import styles from "./EventDetail.module.scss";

const statusLabels: Record<EventStatus, { label: string; variant: "success" | "primary" | "neutral" | "danger" }> = {
  scheduled: { label: "Planifié", variant: "primary" },
  ongoing: { label: "En cours", variant: "success" },
  completed: { label: "Terminé", variant: "neutral" },
  cancelled: { label: "Annulé", variant: "danger" },
};

const eventTypeLabels: Record<EventType, string> = {
  workshop: "Atelier",
  meeting: "Réunion",
  committee: "Comité",
  training: "Formation",
  seminar: "Séminaire",
  other: "Autre",
};

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<null | {
    title: string;
    message: string;
    nextStatus: "ongoing" | "completed" | "cancelled";
  }>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const { setEvent: setSidebarEvent } = useSidebarContext();

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  useEffect(() => {
    if (!event) return;

    setSidebarEvent({
      id: event.id,
      title: event.title,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate ?? null,
      location: event.location,
      organizer: event.organizer ?? null,
      attendanceStats: event.attendanceStats,
    });

    return () => setSidebarEvent(null);
  }, [event, setSidebarEvent]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getById(eventId);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'événement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await eventsService.delete(id);
      navigate("/events");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      setError(err.response?.data?.message || "Erreur lors de la suppression");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeStatus = async (
    nextStatus: "ongoing" | "completed" | "cancelled"
  ) => {
    if (!id) return;

    try {
      setStatusActionLoading(true);
      setError(null);

      await eventsService.updateStatus(id, nextStatus);
      await loadEvent(id);
    } catch (err: any) {
      console.error("Erreur changement statut:", err);
      setError(
        err?.response?.data?.message || "Erreur lors du changement de statut"
      );
    } finally {
      setStatusActionLoading(false);
      setStatusModal(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!actionsRef.current || !actionsOpen) return;
      if (!actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionsOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: "#DC3545", textAlign: "center" }}>
            {error || "Événement introuvable"}
          </p>
          <Button
            onClick={() => navigate("/events")}
            style={{ marginTop: "1rem" }}
          >
            Retour à la liste
          </Button>
        </Card>
      </div>
    );
  }

  const isLocked = event.status === "completed" || event.status === "cancelled";
  const currentUser = authService.getUser();
  const canManage =
    currentUser?.role === "admin" ||
    (currentUser?.role === "organizer" &&
      (event.createdById === currentUser.id ||
        event.createdBy?.id === currentUser.id));

  return (
    <div className={styles.eventDetail}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate("/events")}
            className={styles.backBtn}
          >
            Retour
          </Button>
          <div className={styles.actions} ref={actionsRef}>
            <button
              type="button"
              className={styles.actionsTrigger}
              onClick={() => setActionsOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              disabled={statusActionLoading || deleting}
              title="Actions"
            >
              <MoreVertical size={18} />
            </button>

            {actionsOpen && (
              <div className={styles.actionsMenu} role="menu">
                {canManage && event.status === "scheduled" && (
                  <button
                    type="button"
                    className={styles.actionsItem}
                    onClick={() => {
                      setActionsOpen(false);
                      setStatusModal({
                        title: "Démarrer l'événement ?",
                        message:
                          "Une fois démarré, le pointage sera autorisé pour les participants.",
                        nextStatus: "ongoing",
                      });
                    }}
                    disabled={statusActionLoading || deleting}
                  >
                    Démarrer
                  </button>
                )}

                {canManage && event.status === "ongoing" && (
                  <>
                    <button
                      type="button"
                      className={styles.actionsItem}
                      onClick={() => {
                        setActionsOpen(false);
                        setStatusModal({
                          title: "Terminer l'événement ?",
                          message:
                            "Une fois terminé, le pointage ne sera plus autorisé pour cet événement.",
                          nextStatus: "completed",
                        });
                      }}
                      disabled={statusActionLoading || deleting}
                    >
                      Terminer
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionsItem} ${styles.actionsItemDanger}`}
                      onClick={() => {
                        setActionsOpen(false);
                        setStatusModal({
                          title: "Annuler l'événement ?",
                          message:
                            "Une fois annulé, le pointage ne sera plus autorisé pour cet événement.",
                          nextStatus: "cancelled",
                        });
                      }}
                      disabled={statusActionLoading || deleting}
                    >
                      Annuler
                    </button>
                  </>
                )}

                {canManage && (
                  <button
                    type="button"
                    className={styles.actionsItem}
                    onClick={() => {
                      setActionsOpen(false);
                      navigate(`/events/${id}/edit`);
                    }}
                    disabled={isLocked || statusActionLoading || deleting}
                  >
                    Modifier
                  </button>
                )}

                <button
                  type="button"
                  className={styles.actionsItem}
                  onClick={() => {
                    setActionsOpen(false);
                    navigate(`/events/${id}/attendances`);
                  }}
                >
                  Présences (toutes sessions)
                </button>

                {canManage && (
                  <button
                    type="button"
                    className={`${styles.actionsItem} ${styles.actionsItemDanger}`}
                    onClick={() => {
                      setActionsOpen(false);
                      setShowDeleteModal(true);
                    }}
                    disabled={isLocked || statusActionLoading || deleting}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={styles.pageHeaderMain}>
          <div className={styles.titleBlock}>
            <div>
              <h1 className={styles.title}>{event.title}</h1>
              <div className={styles.metaBadges}>
                <Badge variant={statusLabels[event.status].variant}>
                  {statusLabels[event.status].label}
                </Badge>
                <span className={styles.type}>
                  {eventTypeLabels[event.eventType as EventType] ??
                    event.eventType}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.metaLine}>
            <span className={styles.metaItem}>
              <Calendar size={16} /> {formatDate(event.startDate)}
            </span>
            <span className={styles.dot} />
            <span className={styles.metaItem}>
              <MapPin size={16} /> {event.location}
            </span>
            {event.capacity && (
              <>
                <span className={styles.dot} />
                <span className={styles.metaItem}>
                  <Users size={16} /> {event.capacity} places
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ LAYOUT MODIFIÉ : Plus de grid sidebar, tout en mainContent */}
      <div className={styles.mainContent}>
        <Card header="Informations">
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Calendar size={20} className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Date de début</div>
                <div className={styles.infoValue}>
                  {formatDate(event.startDate)}
                </div>
              </div>
            </div>

            {event.endDate && (
              <div className={styles.infoItem}>
                <Calendar size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Date de fin</div>
                  <div className={styles.infoValue}>
                    {formatDate(event.endDate)}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.infoItem}>
              <MapPin size={20} className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Lieu</div>
                <div className={styles.infoValue}>{event.location}</div>
              </div>
            </div>

            {event.organizer && (
              <div className={styles.infoItem}>
                <Building2 size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Organisateur</div>
                  <div className={styles.infoValue}>{event.organizer}</div>
                </div>
              </div>
            )}

            {event.capacity && (
              <div className={styles.infoItem}>
                <Users size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Capacité</div>
                  <div className={styles.infoValue}>
                    {event.capacity} participants
                  </div>
                </div>
              </div>
            )}

            {(event.createdBy?.fullName ||
              event.createdBy?.firstName ||
              event.createdBy?.lastName ||
              event.createdBy?.email) && (
              <div className={styles.infoItem}>
                <User size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.infoLabel}>Créé par</div>
                  <div className={styles.infoValue}>
                    {(
                      event.createdBy?.fullName ||
                      `${event.createdBy?.firstName ?? ""} ${event.createdBy?.lastName ?? ""}`.trim()
                    ) || event.createdBy?.email}
                  </div>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className={styles.description}>
              <h4>Description</h4>
              <p>{event.description}</p>
            </div>
          )}
        </Card>

        {/* ✅ NOUVEAU : SessionsList remplace QrCodeSection */}
        <SessionsList 
          eventId={event.id}
          eventStatus={event.status}
          canManage={canManage}
        />
      </div>

      {/* Modals - INCHANGÉS */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'événement ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} color="#DC3545" />
          </div>
          <div>
            <p
              style={{
                margin: "0 0 0.75rem 0",
                fontWeight: 600,
                color: "#212529",
              }}
            >
              Cette action est irréversible
            </p>
            <p style={{ margin: 0, color: "#6C757D", fontSize: "0.9375rem" }}>
              L'événement "<strong>{event.title}</strong>" sera définitivement
              supprimé, ainsi que toutes les données associées (QR code,
              présences, etc.).
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={statusModal?.title || ""}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setStatusModal(null)}
              disabled={statusActionLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={() =>
                statusModal && handleChangeStatus(statusModal.nextStatus)
              }
              loading={statusActionLoading}
            >
              Confirmer
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: "#6C757D", fontSize: "0.9375rem" }}>
          {statusModal?.message}
        </p>
      </Modal>
    </div>
  );
};
