import type { FC, ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react";
import { Card } from "@components/common/Card";
import { Input } from "@components/common/Input";
import { Select } from "@components/common/Select";
import { Textarea } from "@components/common/Textarea";
import { Button } from "@components/common/Button";
import { Calendar, MapPin, Users, User, FileText, Tag } from "lucide-react";
import { EventType } from "@/types/event.types";
import type { EventFormProps, EventFormData } from "./EventForm.types";
import styles from "./EventForm.module.scss";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Atelier" },
  { value: EventType.TRAINING, label: "Formation" },
  { value: EventType.COMMITTEE, label: "Conférence" },
  { value: EventType.SEMINAR, label: "Séminaire" },
  { value: EventType.MEETING, label: "Réunion" },
  { value: EventType.OTHER, label: "Autre" },
];

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const EventForm: FC<EventFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = "Créer l'événement",
  cancelLabel = "Annuler",
  onCancel,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    eventType: EventType.WORKSHOP,
    startDate: "",
    endDate: "",
    location: "",
    description: "",
    organizer: "",
    capacity: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        eventType: initialData.eventType || EventType.WORKSHOP,
        startDate: initialData.startDate
          ? formatDateTimeLocal(initialData.startDate)
          : "",
        endDate: initialData.endDate
          ? formatDateTimeLocal(initialData.endDate)
          : "",
        location: initialData.location || "",
        description: initialData.description || "",
        organizer: initialData.organizer || "",
        capacity: initialData.capacity ? String(initialData.capacity) : "",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Le titre est requis";
    if (!formData.eventType)
      newErrors.eventType = "Le type d'événement est requis";
    if (!formData.startDate)
      newErrors.startDate = "La date de début est requise";
    if (!formData.location.trim()) newErrors.location = "Le lieu est requis";

    if (formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start)
        newErrors.endDate = "La date de fin doit être après la date de début";
    }

    if (formData.capacity) {
      const cap = Number(formData.capacity);
      if (Number.isNaN(cap) || cap < 1)
        newErrors.capacity = "La capacité doit être un nombre positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
  <Card
    header={initialData ? "Modifier l'événement" : "Créer un événement"}
    footer={
      <>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" form="event-form" loading={loading}>
          {submitLabel}
        </Button>
      </>
    }
  >
<form id="event-form" onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <h3>Informations générales</h3>

        <div className={styles.formRow}>
          <Input
            label="Titre de l'événement"
            name="title"
            type="text"
            placeholder="Ex: Formation Blockchain"
            value={formData.title}
            onChange={handleChange}
            icon={<FileText size={20} />}
            error={errors.title}
            required
          />

          <div className={styles.formGrid}>
            <Select
              label="Type d'événement"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              options={eventTypeOptions}
              icon={<Tag size={20} />}
              error={errors.eventType}
              required
            />

            <Input
              label="Capacité (optionnel)"
              name="capacity"
              type="number"
              placeholder="Ex: 50"
              value={formData.capacity}
              onChange={handleChange}
              icon={<Users size={20} />}
              error={errors.capacity}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Date et lieu</h3>

        <div className={styles.formRow}>
          <div className={styles.formGrid}>
            <Input
              label="Date de début"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              icon={<Calendar size={20} />}
              error={errors.startDate}
              required
            />

            <Input
              label="Date de fin (optionnel)"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              icon={<Calendar size={20} />}
              error={errors.endDate}
            />
          </div>

          <Input
            label="Lieu"
            name="location"
            type="text"
            placeholder="Ex: Salle Innovation DTAI - Building A"
            value={formData.location}
            onChange={handleChange}
            icon={<MapPin size={20} />}
            error={errors.location}
            required
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Détails supplémentaires</h3>

        <div className={styles.formRow}>
          <Input
            label="Organisateur (optionnel)"
            name="organizer"
            type="text"
            placeholder="Ex: Direction DTAI"
            value={formData.organizer}
            onChange={handleChange}
            icon={<User size={20} />}
            error={errors.organizer}
          />

          <Textarea
            label="Description (optionnel)"
            name="description"
            placeholder="Décrivez l'événement..."
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            maxLength={500}
            rows={4}
          />
        </div>
      </div>
    </form>
  </Card>
);

};
