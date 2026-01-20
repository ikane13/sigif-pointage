import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { Loader } from "@components/common/Loader";
import { Pagination } from "@components/common/Pagination";
import { Search, RotateCcw, Users } from "lucide-react";
import { participantsService } from "@services/participantsService";
import type { ParticipantListItem } from "@/types/participant.types";
import styles from "./ParticipantsPage.module.scss";

export const ParticipantsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParticipantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState("");

  const resetDisabled = !search.trim() && !organization.trim();

  const load = async (nextPage = page, q = search, org = organization) => {
    try {
      setLoading(true);
      setError(null);

      const data = await participantsService.getAll({
        page: nextPage,
        limit: pageSize,
        search: q || undefined,
        organization: org || undefined,
        sortBy: "lastName",
        sortOrder: "ASC",
      });

      setRows(data.items ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors du chargement des participants");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, search, organization);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      load(1, search, organization);
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, organization]);

  useEffect(() => {
    load(page, search, organization);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const displayName = (p: ParticipantListItem) =>
    p.fullName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";

  const pageRows = useMemo(() => rows, [rows]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement des participants..." />
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
        <h2>Participants</h2>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Users size={16} /> {total} participant(s)
          </span>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            label="Rechercher"
            name="search"
            type="text"
            placeholder="Nom, email, organisation, CNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        <div className={styles.search}>
          <Input
            label="Organisation"
            name="organization"
            type="text"
            placeholder="Filtrer par organisation"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div className={styles.filterActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={() => {
              setSearch("");
              setOrganization("");
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
              <th>Participant</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Organisation</th>
              <th>CNI</th>
              <th>Présences</th>
              <th>Dernier pointage</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Aucun participant.
                </td>
              </tr>
            ) : (
              pageRows.map((p) => (
                <tr
                  key={p.id}
                  className={styles.rowClickable}
                  onClick={() => navigate(`/participants/${p.id}`)}
                >
                  <td className={styles.strong}>{displayName(p)}</td>
                  <td>{p.email ?? "—"}</td>
                  <td>{p.phone ?? "—"}</td>
                  <td>{p.organization ?? "—"}</td>
                  <td>{p.cniNumber ?? "—"}</td>
                  <td>{p.attendanceCount ?? 0}</td>
                  <td>{formatDateTime(p.lastAttendance)}</td>
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
    </div>
  );
};
