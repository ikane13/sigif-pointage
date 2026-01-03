import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EventForm } from "@components/admin/EventForm";
import type { EventFormData } from "@components/admin/EventForm";
import { eventsService } from "@services/eventsService";
import type { Event, EventType } from "@/types/event.types";
import { Card } from "@components/common/Card";
import { Loader } from "@components/common/Loader";
import pageStyles from "@/styles/adminFormPage.module.scss";
import { Button } from "@components/common/Button";

export const EventEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de l'événement manquant");
      setLoading(false);
      return;
    }
    loadEvent(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getById(eventId);
      setEvent(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur lors du chargement de l'événement"
      );
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: EventFormData) => {
    if (!id) return;

    try {
      setSubmitting(true);
      setError(null);

      const updateData = {
        title: formData.title,
        eventType: formData.eventType as EventType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        location: formData.location,
        description: formData.description || undefined,
        organizer: formData.organizer || undefined,
        capacity: formData.capacity
          ? parseInt(formData.capacity, 10)
          : undefined,
      };

      await eventsService.update(id, updateData);

      navigate(`/events/${id}`);
    } catch (err: any) {
      console.error("Erreur modification événement:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur lors de la modification de l'événement"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (id) navigate(`/events/${id}`);
    else navigate("/events");
  };

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.container}>
        {loading && (
          <Card>
            <div style={{ padding: "1.5rem" }}>
              <Loader
                variant="spinner"
                size="lg"
                text="Chargement de l'événement..."
              />
            </div>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#DC3545", margin: 0 }}>{error}</p>
              <div style={{ marginTop: "1rem" }}>
                <Button onClick={() => navigate("/events")}>
                  Retour à la liste
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!loading && !error && event && (
          <EventForm
            initialData={event}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
            submitLabel="Enregistrer les modifications"
            cancelLabel="Annuler"
          />
        )}
      </div>
    </div>
  );
};
