import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Input } from "@components/common/Input";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { SignatureCanvas } from "@components/public/SignatureCanvas";
import { Calendar, MapPin, User, Mail, Phone } from "lucide-react";
import { qrCodesService } from "@services/qrCodesService";
import { attendancesService } from "@services/attendancesService";
import type {
  ValidatedToken,
  AttendanceFormData,
} from "@/types/attendance.types";
import banner from "@/assets/branding/dtai-banner.png";
import logo from "@/assets/branding/dtai-logo.png";

import styles from "./PointagePage.module.scss";

export const PointagePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [validatedToken, setValidatedToken] = useState<ValidatedToken | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AttendanceFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    function: "",
    organization: "",
    cniNumber: "",
    originLocality: "",
    notes: "",
    signature: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setError("Token manquant");
      setLoading(false);
      return;
    }
    validateToken(token);
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      setLoading(true);
      const data = await qrCodesService.validateToken(tokenValue);
      setValidatedToken(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Token invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSignatureChange = (signature: string) => {
    setFormData((prev) => ({ ...prev, signature }));
    if (errors.signature) {
      setErrors((prev) => ({ ...prev, signature: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.signature) {
      newErrors.signature = "La signature est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !token) return;

    try {
      setSubmitting(true);
      await attendancesService.create({
        eventId: validatedToken.eventId,
        participant: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          function: formData.function || undefined,
          organization: formData.organization || undefined,
          cniNumber: formData.cniNumber || undefined,
          originLocality: formData.originLocality || undefined,
        },
        signature: formData.signature,
        notes: formData.notes || undefined,
      });

      // Rediriger vers page de confirmation
      navigate("/pointage/confirmation", {
        state: {
          event: validatedToken,
          participant: formData,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du pointage");
    } finally {
      setSubmitting(false);
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
      <div className={styles.container}>
        <div className={styles.centered}>
          <Loader variant="spinner" size="lg" text="Validation en cours..." />
        </div>
      </div>
    );
  }

  if (error || !validatedToken) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <Card>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>❌</div>
              <h2>Token invalide</h2>
              <p>{error || "Le QR code scanné est invalide ou a expiré."}</p>
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
              <h1>Pointage de présence</h1>
              <p>Direction du Traitement Automatique de l’Information (DTAI)</p>
            </div>
          </div>
        </div>

        <Card>
          <div className={styles.eventInfo}>
            <h2>{validatedToken.eventTitle}</h2>
            <div className={styles.eventMeta}>
              <div className={styles.metaItem}>
                <Calendar size={18} />
                <span>{formatDate(validatedToken.eventDate)}</span>
              </div>
              <div className={styles.metaItem}>
                <MapPin size={18} />
                <span>{validatedToken.eventLocation}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3>Vos informations</h3>

            <div className={styles.formRow}>
              <Input
                label="Prénom"
                name="firstName"
                type="text"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={handleChange}
                icon={<User size={20} />}
                error={errors.firstName}
                required
              />

              <Input
                label="Nom"
                name="lastName"
                type="text"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={handleChange}
                icon={<User size={20} />}
                error={errors.lastName}
                required
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail size={20} />}
              error={errors.email}
              required
            />

            <Input
              label="Téléphone (optionnel)"
              name="phone"
              type="tel"
              placeholder="+221 XX XXX XX XX"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone size={20} />}
            />

            <div className={styles.formRow}>
              <Input
                label="Fonction (optionnel)"
                name="function"
                type="text"
                placeholder="Ex : Chef de bureau"
                value={formData.function || ""}
                onChange={handleChange}
                icon={<User size={20} />}
              />

              <Input
                label="Organisation (optionnel)"
                name="organization"
                type="text"
                placeholder="Ex : Ministère / Direction / Service"
                value={formData.organization || ""}
                onChange={handleChange}
                icon={<User size={20} />}
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label="Numéro CNI (optionnel)"
                name="cniNumber"
                type="text"
                placeholder="Ex : 1234567890"
                value={formData.cniNumber || ""}
                onChange={handleChange}
                icon={<User size={20} />}
              />

              <Input
                label="Localité d’origine (optionnel)"
                name="originLocality"
                type="text"
                placeholder="Ex : Dakar"
                value={formData.originLocality || ""}
                onChange={handleChange}
                icon={<MapPin size={20} />}
              />
            </div>

            <Input
              label="Notes (optionnel)"
              name="notes"
              type="text"
              placeholder="Ex : Observations / précisions"
              value={formData.notes || ""}
              onChange={handleChange}
            />

            <SignatureCanvas
              onSignatureChange={handleSignatureChange}
              error={errors.signature}
            />

            <Button type="submit" fullWidth loading={submitting}>
              Confirmer ma présence
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
