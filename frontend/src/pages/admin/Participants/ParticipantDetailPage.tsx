import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { ArrowLeft, Calendar, Mail, Phone, Building2, IdCard } from "lucide-react";
import { participantsService } from "@services/participantsService";
import styles from "./ParticipantDetailPage.module.scss";

type ParticipantDetail = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  organization?: string;
  function?: string;
  cniNumber?: string;
  stats?: {
    totalAttendances?: number;
    lastAttendance?: string | null;
  };
  attendances?: Array<{
    id: string;
    checkInTime?: string;
    createdAt?: string;
    event?: { title?: string };
  }>;
};

export const ParticipantDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await participantsService.getById(id);
        setParticipant(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Participant introuvable");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const displayName =
    participant?.fullName ||
    `${participant?.firstName ?? ""} ${participant?.lastName ?? ""}`.trim() ||
    "—";

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const attendances = useMemo(() => participant?.attendances ?? [], [participant]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: "#DC3545", textAlign: "center" }}>{error}</p>
          <Button onClick={() => navigate("/participants")} style={{ marginTop: "1rem" }}>
            Retour
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
      </div>

      <Card>
        <div className={styles.header}>
          <h2>{displayName}</h2>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={16} /> Dernier pointage:{" "}
              {formatDateTime(participant.stats?.lastAttendance ?? null)}
            </span>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Mail size={18} />
            <span>{participant.email ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <Phone size={18} />
            <span>{participant.phone ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <Building2 size={18} />
            <span>{participant.organization ?? "—"}</span>
          </div>
          <div className={styles.infoItem}>
            <IdCard size={18} />
            <span>{participant.cniNumber ?? "—"}</span>
          </div>
        </div>
      </Card>

      <Card header="Historique des présences">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Événement</th>
                <th>Date & heure</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={2} className={styles.empty}>
                    Aucune présence.
                  </td>
                </tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id}>
                    <td className={styles.strong}>{a.event?.title ?? "—"}</td>
                    <td>{formatDateTime(a.checkInTime ?? a.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
