/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Input } from "@components/common/Input";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { SignatureCanvas } from "@components/public/SignatureCanvas";
import { Calendar, MapPin, User, Mail, Phone, Clock } from "lucide-react";
import { qrCodesService } from "@services/qrCodesService";
import { attendancesService } from "@services/attendancesService";
import { participantsService } from "@services/participantsService";
import {
  getSessionDisplayName,
  formatSessionDateFull,
  formatSessionTime,
} from "@/utils/session.utils";
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
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showPrefill, setShowPrefill] = useState(false);

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
      setTokenError("Token manquant");
      setLoading(false);
      return;
    }
    validateToken(token);
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      setLoading(true);
      setTokenError(null);
      const data = await qrCodesService.validateToken(tokenValue);
      setValidatedToken(data);
    } catch (err: any) {
      setValidatedToken(null);
      setTokenError(err.response?.data?.message || "Token invalide ou expiré");
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
    if (name === "cniNumber" || name === "email") {
      setLookupError(null);
    }
  };

  const handleSignatureChange = (signature: string) => {
    setFormData((prev) => ({ ...prev, signature }));
    if (errors.signature) {
      setErrors((prev) => ({ ...prev, signature: "" }));
    }
  };

  const handleLookup = async () => {
    const cni = formData.cniNumber.trim();
    const email = formData.email.trim();

    if (!cni && !email) {
      setLookupError("Renseignez le CNI ou l'email.");
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);

      const data = await participantsService.lookupPublic({
        cni: cni || undefined,
        email: email || undefined,
      });

      setFormData((prev) => ({
        ...prev,
        firstName: data.firstName ?? prev.firstName,
        lastName: data.lastName ?? prev.lastName,
        email: data.email ?? prev.email,
        phone: data.phone ?? prev.phone,
        function: data.function ?? prev.function,
        organization: data.organization ?? prev.organization,
        cniNumber: data.cniNumber ?? prev.cniNumber,
        originLocality: data.originLocality ?? prev.originLocality,
      }));
    } catch (err: any) {
      setLookupError(err?.response?.data?.message || "Participant introuvable.");
    } finally {
      setLookupLoading(false);
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

    if (!validate() || !token || !validatedToken) return;

    // ✅ VÉRIFICATION : Si canCheckIn = false, bloquer
    if (!validatedToken.canCheckIn) {
      setError(
        "Le pointage n'est pas autorisé pour cette session. Contactez l'organisateur."
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await attendancesService.create({
        eventId: validatedToken.eventId,
        sessionId: validatedToken.session.id, // ✅ AJOUTÉ : sessionId obligatoire
        participant: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          function: formData.function || undefined,
          organization: formData.organization || undefined,
          cniNumber: formData.cniNumber || undefined,
          originLocality: formData.originLocality || undefined,
        },
        signature: formData.signature,
        notes: formData.notes || undefined,
      });

      // Rediriger vers page de confirmation avec event + session
      navigate("/pointage/confirmation", {
        state: {
          event: validatedToken,
          participant: formData,
          session: validatedToken.session,
          token,
        },
      });
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Erreur lors du pointage");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
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

  if (tokenError || !validatedToken) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <Card>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>❌</div>
              <h2>Token invalide</h2>
              <p>
                {tokenError || "Le QR code scanné est invalide ou a expiré."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ AJOUTÉ : Vérifier si le pointage est autorisé
  if (!validatedToken.canCheckIn) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <Card>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>⚠️</div>
              <h2>Pointage non autorisé</h2>
              <p>
                Le pointage n'est pas encore autorisé pour cette session.
                <br />
                Contactez l'organisateur pour plus d'informations.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  //  AJOUTÉ : Récupérer le nom de la session
  const sessionDisplayName = getSessionDisplayName(validatedToken.session);
  const sessionDateFormatted = formatSessionDateFull(
    validatedToken.session.sessionDate
  );
  const sessionTimeFormatted = formatSessionTime(
    validatedToken.session.startTime,
    validatedToken.session.endTime
  );

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
              <h2>Système de Pointage</h2>
              <h4>Direction du Traitement Automatique de l'Information (DTAI)</h4>
            </div>
          </div>
        </div>

        <Card>
          <div className={styles.eventInfo}>
            {/* MODIFIÉ : Afficher titre event + session */}
            <div className={styles.eventTitleRow}>
              <h2>{validatedToken.eventTitle}</h2>
              <span className={styles.sessionInline}>{sessionDisplayName}</span>
            </div>

            <div className={styles.eventMeta}>
              {/* ✅ MODIFIÉ : Date session (pas date event) */}
              <div className={styles.metaItem}>
                <Calendar size={18} />
                <span>{sessionDateFormatted}</span>
              </div>

              {/* ✅ AJOUTÉ : Horaires session (si définis) */}
              {sessionTimeFormatted && (
                <div className={styles.metaItem}>
                  <Clock size={18} />
                  <span>{sessionTimeFormatted}</span>
                </div>
              )}

              {/* ✅ MODIFIÉ : Lieu session (ou lieu event en fallback) */}
              <div className={styles.metaItem}>
                <MapPin size={18} />
                <span>
                  {validatedToken.session.location ||
                    validatedToken.eventLocation}
                </span>
              </div>
              <span className={styles.helperText}>Auto-remplissez vos informations déja saisi 
                en cliquant sur Pré-remplir vos information</span>
            </div>
          </div>
        </Card>

        {/* AJOUTÉ : Message d'erreur si présent */}
       {submitError && (
  <div className={styles.alertError}>
    <span>⚠️</span>
    <span>{submitError}</span>
  </div>
)}

        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h3>Vos informations</h3>
              <a
                href="#cni-lookup"
                className={styles.prefillLink}
                onClick={() => setShowPrefill(true)}
              >
                Pré-remplir vos informations
              </a>
            </div>

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
              <div className={styles.cniBlock}>
                <Input
                  label="Numéro CNI / Passeport"
                  name="cniNumber"
                  type="text"
                  placeholder="Ex : 1234567890"
                  value={formData.cniNumber || ""}
                  onChange={handleChange}
                  icon={<User size={20} />}
                />

                {showPrefill && (
                  <div id="cni-lookup" className={styles.prefillZone}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLookup}
                      loading={lookupLoading}
                    >
                      Auto-remplir à partir du CNI
                    </Button>
                    {lookupError && (
                      <div className={styles.prefillError}>{lookupError}</div>
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Localité d'origine (optionnel)"
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
