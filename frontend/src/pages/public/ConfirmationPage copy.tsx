import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { CheckCircle, Calendar, MapPin, User, Mail, ArrowLeft } from "lucide-react";
import banner from "@/assets/branding/dtai-banner.png";
import logo from "@/assets/branding/dtai-logo.png";
import styles from "./ConfirmationPage.module.scss";

export const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { event, participant } = location.state || {};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!event || !participant) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <img
              className={styles.banner}
              src={banner}
              alt="République du Sénégal - Ministère des Finances et du Budget"
            />
            <div className={styles.headerInner}>
              <img className={styles.logo} src={logo} alt="DTAI" />
              <div className={styles.headerText}>
                <h1>Confirmation</h1>
                <p>Direction du Traitement Automatique de l’Information (DTAI)</p>
              </div>
            </div>
          </div>

          <Card>
            <div className={styles.errorCard}>
              <h2>Page indisponible</h2>
              <p>Aucune information de pointage n’a été trouvée.</p>

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="secondary"
                  icon={<ArrowLeft size={18} />}
                  onClick={() => navigate("/")}
                >
                  Retour à l’accueil
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img
            className={styles.banner}
            src={banner}
            alt="République du Sénégal - Ministère des Finances et du Budget"
          />
          <div className={styles.headerInner}>
            <img className={styles.logo} src={logo} alt="DTAI" />
            <div className={styles.headerText}>
              <h1>Pointage</h1>
              <p>Direction du Traitement Automatique de l’Information (DTAI)</p>
            </div>
          </div>
        </div>

        <Card>
          <div className={styles.successCard}>
            <div className={styles.statusRow}>
              <div className={styles.statusIcon} aria-hidden="true">
                <CheckCircle size={22} />
              </div>
              <div className={styles.statusText}>
                <div className={styles.statusTitle}>Présence confirmée</div>
                <div className={styles.statusSubTitle}>
                  Votre présence a été enregistrée avec succès.
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.details}>
              <h2>Récapitulatif</h2>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Calendar size={18} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Événement</div>
                    <div className={styles.detailValue}>{event.eventTitle}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <MapPin size={18} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Lieu</div>
                    <div className={styles.detailValue}>{event.eventLocation}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <Calendar size={18} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Date</div>
                    <div className={styles.detailValue}>{formatDate(event.eventDate)}</div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <User size={18} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Participant</div>
                    <div className={styles.detailValue}>
                      {participant.firstName} {participant.lastName}
                    </div>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <Mail size={18} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Email</div>
                    <div className={styles.detailValue}>{participant.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.notice}>
              <div className={styles.noticeTitle}>Accusé de réception</div>
              <div className={styles.noticeText}>
                Un email de confirmation a été envoyé à <strong>{participant.email}</strong>.
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => navigate("/pointage")}>
                Retour au pointage
              </Button>

              <Button type="button" onClick={() => navigate("/")}>
                Accéder au portail
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
