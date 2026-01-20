/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { Select } from "@components/common/Select";
import { Loader } from "@components/common/Loader";
import { Pagination } from "@components/common/Pagination";
import { Modal } from "@components/common/Modal";
import { useToast } from "@components/common/Toast";
import { UserPlus, RotateCcw, KeyRound } from "lucide-react";
import { usersService } from "@services/usersService";
import type { UserListItem, UserRole } from "@/types/user.types";
import styles from "./AdminUsersPage.module.scss";

const roleOptions = [
  { value: "all", label: "Tous les rôles" },
  { value: "admin", label: "Admin" },
  { value: "organizer", label: "Organisateur" },
  { value: "viewer", label: "Lecture" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Désactivés" },
];

export const AdminUsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | UserRole>("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "organizer" as UserRole,
    password: "",
  });

  const [resetUser, setResetUser] = useState<UserListItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserListItem | null>(null);

  const { showToast } = useToast();

  const resetDisabled = !search.trim() && role === "all" && status === "all";

  const load = async (nextPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const data = await usersService.getAll({
        page: nextPage,
        limit: pageSize,
        search: search || undefined,
        role: role !== "all" ? role : undefined,
        isActive: status === "all" ? undefined : status === "active",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });

      setRows(data.items ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors du chargement des utilisateurs");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      load(1);
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, status]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      await usersService.create(createForm);
      setShowCreate(false);
      setCreateForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "organizer",
        password: "",
      });
      load(1);
      showToast({
        variant: "success",
        message: "Utilisateur créé avec succès.",
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Erreur lors de la création";
      setCreateError(message);
      showToast({ variant: "error", message });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    try {
      await usersService.update(user.id, { isActive: !user.isActive });
      load(page);
      showToast({
        variant: "success",
        message: user.isActive
          ? "Compte désactivé avec succès."
          : "Compte activé avec succès.",
      });
    } catch (err: any) {
      showToast({
        variant: "error",
        message: err?.response?.data?.message || "Erreur lors de la mise à jour.",
      });
    }
  };

  const handleRoleChange = async (user: UserListItem, newRole: UserRole) => {
    try {
      await usersService.update(user.id, { role: newRole });
      load(page);
      showToast({
        variant: "success",
        message: "Rôle mis à jour.",
      });
    } catch (err: any) {
      showToast({
        variant: "error",
        message: err?.response?.data?.message || "Erreur lors de la mise à jour.",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    try {
      setResetLoading(true);
      setResetError(null);
      await usersService.resetPassword(resetUser.id, resetPassword);
      setResetUser(null);
      setResetPassword("");
      showToast({
        variant: "success",
        message: "Mot de passe réinitialisé.",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Erreur lors de la réinitialisation";
      setResetError(message);
      showToast({ variant: "error", message });
    } finally {
      setResetLoading(false);
    }
  };

  const fullName = (u: UserListItem) =>
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—";

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement des utilisateurs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <Card>
          <p style={{ color: "#DC3545", textAlign: "center" }}>{error}</p>
          <Button onClick={() => load()} style={{ marginTop: "1rem" }}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Utilisateurs</h2>
        <div className={styles.headerActions}>
          <Button
            icon={<UserPlus size={18} />}
            onClick={() => setShowCreate(true)}
          >
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            label="Recherche"
            name="search"
            type="text"
            placeholder="Nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          label="Rôle"
          name="role"
          value={role}
          options={roleOptions}
          onChange={(e) => setRole(e.target.value as "all" | UserRole)}
        />
        <Select
          label="Statut"
          name="status"
          value={status}
          options={statusOptions}
          onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
        />
        <div className={styles.filterActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={() => {
              setSearch("");
              setRole("all");
              setStatus("all");
            }}
            disabled={resetDisabled}
          >
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Aucun utilisateur.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className={styles.strong}>{fullName(u)}</td>
                  <td>{u.email}</td>
                  <td>
                    <Select
                      name={`role-${u.id}`}
                      value={u.role}
                      options={[
                        { value: "admin", label: "Admin" },
                        { value: "organizer", label: "Organisateur" },
                        { value: "viewer", label: "Lecture" },
                      ]}
                      onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                    />
                  </td>
                  <td>
                    <span className={u.isActive ? styles.active : styles.inactive}>
                      {u.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => (u.isActive ? setConfirmUser(u) : handleToggleActive(u))}
                    >
                      {u.isActive ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<KeyRound size={16} />}
                      onClick={() => setResetUser(u)}
                    >
                      Reset MDP
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={setPage}
        showWhenSinglePage
      />

      {showCreate && (
        <Card header="Créer un utilisateur">
          <div className={styles.formGrid}>
            {createError && <div className={styles.formError}>{createError}</div>}
            <Input
              label="Prénom"
              name="firstName"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Nom"
              name="lastName"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              helperText="8+ caractères, 1 maj, 1 min, 1 chiffre, 1 spécial"
            />
            <Select
              label="Rôle"
              name="roleCreate"
              value={createForm.role}
              options={[
                { value: "admin", label: "Admin" },
                { value: "organizer", label: "Organisateur" },
                { value: "viewer", label: "Lecture" },
              ]}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
            />
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} loading={createLoading}>
                Créer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {resetUser && (
        <Card header={`Réinitialiser le mot de passe — ${fullName(resetUser)}`}>
          <div className={styles.formGrid}>
            {resetError && <div className={styles.formError}>{resetError}</div>}
            <Input
              label="Nouveau mot de passe"
              name="resetPassword"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              helperText="8+ caractères, 1 maj, 1 min, 1 chiffre, 1 spécial"
              required
            />
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setResetUser(null)}>
                Annuler
              </Button>
              <Button onClick={handleResetPassword} loading={resetLoading}>
                Réinitialiser
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal
        isOpen={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        title="Désactiver le compte"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmUser(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!confirmUser) return;
                handleToggleActive(confirmUser);
                setConfirmUser(null);
              }}
            >
              Désactiver
            </Button>
          </>
        }
      >
        <p>
          Voulez-vous vraiment désactiver le compte{" "}
          <strong>{confirmUser ? fullName(confirmUser) : ""}</strong> ?
        </p>
      </Modal>
    </div>
  );
};
