import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@components/common/Card";
import { Input } from "@components/common/Input";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { useToast } from "@components/common/Toast";
import { authService, type UserProfile } from "@services/authService";
import styles from "./AccountPage.module.scss";

export const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { showToast } = useToast();

  const initials = useMemo(() => {
    const first = profile?.firstName ?? "";
    const last = profile?.lastName ?? "";
    const email = profile?.email ?? "";
    const letters = `${first.charAt(0)}${last.charAt(0)}`.trim();
    if (letters) return letters.toUpperCase();
    return email ? email.slice(0, 2).toUpperCase() : "U";
  }, [profile?.firstName, profile?.lastName, profile?.email]);

  const fullName = useMemo(() => {
    if (!profile) return "Utilisateur";
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email;
  }, [profile]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const roleLabel = (value?: string) => {
    if (value === "admin") return "Admin";
    if (value === "organizer") return "Organisateur";
    if (value === "viewer") return "Lecture";
    return value ?? "—";
  };

  const isProfileDirty =
    !!profile &&
    (profileForm.firstName !== (profile.firstName ?? "") ||
      profileForm.lastName !== (profile.lastName ?? "") ||
      profileForm.email !== (profile.email ?? ""));

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getProfile();
      setProfile(data);
      setProfileForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Impossible de charger votre profil.";
      setError(message);
      showToast({ variant: "error", message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError(null);
      const updated = await authService.updateProfile(profileForm);
      setProfile(updated);
      showToast({ variant: "success", message: "Profil mis à jour." });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Erreur lors de la mise à jour.";
      setError(message);
      showToast({ variant: "error", message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetProfileForm = () => {
    if (!profile) return;
    setProfileForm({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      email: profile.email ?? "",
    });
  };

  const handleChangePassword = async () => {
    if (!profile) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      setSavingPassword(true);
      setPasswordError(null);
      await authService.changePassword({
        userId: profile.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast({ variant: "success", message: "Mot de passe mis à jour." });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Erreur lors du changement de mot de passe.";
      setPasswordError(message);
      showToast({ variant: "error", message });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement du profil..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.centered}>
        <Card>
          <p className={styles.errorText}>{error ?? "Profil indisponible."}</p>
          <Button style={{ marginTop: "1rem" }} onClick={loadProfile}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <h2>{fullName}</h2>
            <div className={styles.heroMeta}>
              <span>{roleLabel(profile.role)}</span>
              <span className={styles.dot} />
              <span>{profile.isActive ? "Compte actif" : "Compte désactivé"}</span>
              <span className={styles.dot} />
              <span>{profile.email}</span>
            </div>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div>
            <span className={styles.statLabel}>Dernière connexion</span>
            <span className={styles.statValue}>
              {formatDateTime(profile.lastLoginAt ?? null)}
            </span>
          </div>
          <div>
            <span className={styles.statLabel}>Compte créé le</span>
            <span className={styles.statValue}>{formatDateTime(profile.createdAt ?? null)}</span>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        <Card header="Profil">
          <div className={styles.section}>
            <h3>Informations personnelles</h3>
            <div className={styles.formGrid}>
              <Input
                label="Prénom"
                name="firstName"
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, firstName: e.target.value })
                }
              />
              <Input
                label="Nom"
                name="lastName"
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, lastName: e.target.value })
                }
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
              />
              <div className={styles.inlineActions}>
                <Button variant="ghost" size="sm" onClick={handleResetProfileForm}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <h3>Détails du compte</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Identifiant</span>
                <span className={styles.detailValue}>{profile.id}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nom complet</span>
                <span className={styles.detailValue}>{fullName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Rôle</span>
                <span className={styles.detailValue}>{roleLabel(profile.role)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Statut</span>
                <span className={styles.detailValue}>
                  {profile.isActive ? "Actif" : "Désactivé"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Dernière connexion</span>
                <span className={styles.detailValue}>
                  {formatDateTime(profile.lastLoginAt ?? null)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Créé le</span>
                <span className={styles.detailValue}>
                  {formatDateTime(profile.createdAt ?? null)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Dernière mise à jour</span>
                <span className={styles.detailValue}>
                  {formatDateTime(profile.updatedAt ?? null)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.sectionActions}>
            <Button
              onClick={handleSaveProfile}
              loading={savingProfile}
              disabled={!isProfileDirty}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </Card>

        <Card header="Sécurité">
          <div className={styles.section}>
            <h3>Changer votre mot de passe</h3>
            <p className={styles.helperText}>
              Utilisez un mot de passe fort avec 8+ caractères, 1 majuscule, 1 minuscule, 1
              chiffre et 1 caractère spécial.
            </p>
            {passwordError && <div className={styles.errorBanner}>{passwordError}</div>}
            <div className={styles.formGrid}>
              <Input
                label="Mot de passe actuel"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
              <Input
                label="Nouveau mot de passe"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
              <Input
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
            <div className={styles.sectionActions}>
              <Button onClick={handleChangePassword} loading={savingPassword}>
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
