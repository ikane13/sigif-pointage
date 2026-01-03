import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Loader } from "@components/common/Loader";
import { Modal } from "@components/common/Modal";
import { QrCodeSection } from "@components/admin/QrCodeSection";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { eventsService } from "@services/eventsService";
import type { Event, EventStatus, EventType } from "@/types/event.types";
import styles from "./EventDetail.module.scss";

const statusLabels: Record<
  EventStatus,
  { label: string; variant: "success" | "primary" | "neutral" | "danger" }
> = {
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

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

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

      // Rediriger vers la liste
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

      // Recharge l'événement pour afficher le nouveau statut
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
          <div className={styles.actions}>
            {event.status === "scheduled" && (
              <Button
                size="sm"
                onClick={() =>
                  setStatusModal({
                    title: "Démarrer l'événement ?",
                    message:
                      "Une fois démarré, le pointage sera autorisé pour les participants.",
                    nextStatus: "ongoing",
                  })
                }
                disabled={statusActionLoading || deleting}
              >
                Démarrer
              </Button>
            )}

            {event.status === "ongoing" && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setStatusModal({
                      title: "Terminer l'événement ?",
                      message:
                        "Une fois terminé, le pointage ne sera plus autorisé pour cet événement.",
                      nextStatus: "completed",
                    })
                  }
                  disabled={statusActionLoading || deleting}
                >
                  Terminer
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setStatusModal({
                      title: "Annuler l'événement ?",
                      message:
                        "Une fois annulé, le pointage ne sera plus autorisé pour cet événement.",
                      nextStatus: "cancelled",
                    })
                  }
                  disabled={statusActionLoading || deleting}
                >
                  Annuler
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={<Edit size={16} />}
              onClick={() => navigate(`/events/${id}/edit`)}
              disabled={isLocked || statusActionLoading || deleting}
            >
              Modifier
            </Button>

            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={() => setShowDeleteModal(true)}
              disabled={isLocked || statusActionLoading || deleting}
            >
              Supprimer
            </Button>
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

      <div className={styles.grid}>
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
            </div>

            {event.description && (
              <div className={styles.description}>
                <h4>Description</h4>
                <p>{event.description}</p>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          {isLocked ? (
            <Card header="QR Code">
              <p style={{ margin: 0, color: "#6C757D" }}>
                QR Code indisponible : l’événement est{" "}
                {event.status === "completed" ? "terminé" : "annulé"}.
              </p>
            </Card>
          ) : (
            <QrCodeSection eventId={event.id} />
          )}
        </div>
      </div>

      {/* Modal de confirmation suppression */}
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
