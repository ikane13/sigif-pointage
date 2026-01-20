import { useEffect, useMemo, useState } from "react";
import { Modal } from "@components/common/Modal";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { Card } from "@components/common/Card";
import { Loader } from "@components/common/Loader";
import { Pagination } from "@components/common/Pagination";
import { attendancesService } from "@services/attendancesService";
import type { AttendanceListItem } from "@services/attendancesService";
import { authService } from "@services/authService";
import { useToast } from "@components/common/Toast";
import type { SessionAttendancesModalProps } from "./SessionAttendancesModal.types";
import styles from "./SessionAttendancesModal.module.scss";
import { AlertCircle } from "lucide-react";

const getParticipantLabel = (a: AttendanceListItem) => {
  const p = a.participant;
  if (!p) return "—";
  return (
    (p.fullName || `${p.firstName ?? ""} ${p.lastName ?? ""}`).trim() || "—"
  );
};

export const SessionAttendancesModal = ({
  isOpen,
  onClose,
  session,
}: SessionAttendancesModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [rows, setRows] = useState<AttendanceListItem[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureFor, setSignatureFor] = useState<AttendanceListItem | null>(
    null
  );
  const [signatureMap, setSignatureMap] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AttendanceListItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const isAdmin = authService.getUser()?.role === "admin";

  // reset quand on ouvre ou quand on change de session
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setQ("");
    setPage(1);
    setRows([]);
    setTotal(0);
  }, [isOpen, session?.id]);

  const load = async () => {
    if (!session?.id) return;
    try {
      setLoading(true);
      setError(null);

      const data = await attendancesService.getBySession(session.id, {
        page,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });

      setRows(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Erreur lors du chargement des présences"
      );
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session?.id, page]);

  useEffect(() => {
    let active = true;

    const loadSignatures = async () => {
      const targets = rows.filter(
        (item) => item.hasSignature && !signatureMap[item.id]
      );

      if (!targets.length) return;

      for (const attendance of targets) {
        try {
          const res = await attendancesService.getSignature(attendance.id);
          const raw = res.signatureData;
          const format = (res.signatureFormat || "png").toLowerCase();
          const url = raw.startsWith("data:image/")
            ? raw
            : `data:image/${format};base64,${raw}`;

          if (!active) return;
          setSignatureMap((prev) => ({ ...prev, [attendance.id]: url }));
        } catch {
          // Ignore signature errors for list display.
        }
      }
    };

    loadSignatures();

    return () => {
      active = false;
    };
  }, [rows, signatureMap]);

  // Filtrage local (search)
  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((a) => {
      const p = a.participant;
      const hay = [
        p?.firstName,
        p?.lastName,
        p?.email,
        p?.phone,
        p?.organization,
        p?.function,
        p?.cniNumber,
        p?.originLocality,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(needle);
    });
  }, [rows, q]);

  const title = session ? `Présences — ${session.label}` : "Présences";

  const handleViewSignature = async (attendance: AttendanceListItem) => {
    try {
      setSignatureFor(attendance);
      setShowSignatureModal(true);
      setSignatureLoading(true);
      setSignatureError(null);
      setSignatureDataUrl(null);

      const res = await attendancesService.getSignature(attendance.id);

      // backend renvoie signatureData: "data:image/...;base64,..." ou base64 brut selon implémentation
      const raw = res.signatureData;
      const format = (res.signatureFormat || "png").toLowerCase();

      const url = raw.startsWith("data:image/")
        ? raw
        : `data:image/${format};base64,${raw}`;

      setSignatureDataUrl(url);
    } catch (err: any) {
      setSignatureError(
        err?.response?.data?.message || "Impossible de charger la signature"
      );
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!session?.id) return;

    try {
      const blob = await attendancesService.exportSessionExcel(session.id, {
        sortBy: "checkInTime",
        sortOrder: "ASC",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const safeDate = session.sessionDate || "session";
      link.download = `presences_session_${safeDate}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      // option : afficher une erreur UI
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!session?.id) return;
    window.open(
      `/sessions/${session.id}/attendances/print`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDeleteAttendance = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await attendancesService.delete(deleteTarget.id);
      showToast({
        variant: "success",
        message: "Pointage supprimé avec succès.",
      });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      showToast({
        variant: "error",
        message: err?.response?.data?.message || "Erreur lors de la suppression.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Fermer
          </Button>

          {/* Export : UI prête, branchage backend à faire ensuite */}
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            disabled={loading || !session?.id}
          >
            Exporter Excel
          </Button>

          {/* <Button variant="secondary" disabled>
            Exporter PDF
          </Button> */}
          <Button
            variant="secondary"
            onClick={handlePrint}
            disabled={loading || !session?.id}
          >
            Imprimer / Exporter PDF
          </Button>
        </>
      }
    >
      <div className={styles.wrapper}>
        <div className={styles.topBar}>
          <div className={styles.search}>
            <Input
              label="Recherche"
              name="q"
              type="text"
              placeholder="Nom, email, téléphone, organisation…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className={styles.counter}>
            <span className={styles.counterLabel}>Total: </span>
            <span className={styles.counterValue}>{total}</span>
          </div>
        </div>

        {error && (
          <Card>
            <div className={styles.error}>{error}</div>
          </Card>
        )}

        {loading ? (
          <div className={styles.loading}>
            <Loader variant="spinner" size="lg" text="Chargement..." />
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Organisation</th>
                  <th>CNI</th>
                  <th>Heure</th>
                  <th>Signature</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className={styles.empty}>
                      Aucun résultat.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((a) => (
                    <tr key={a.id}>
                      <td className={styles.name}>{getParticipantLabel(a)}</td>
                      <td>{a.participant?.email ?? "—"}</td>
                      <td>{a.participant?.phone ?? "—"}</td>
                      <td>{a.participant?.organization ?? "—"}</td>
                      <td>{a.participant?.cniNumber ?? "—"}</td>
                      <td>
                        {a.checkInTime
                          ? new Date(a.checkInTime).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : a.createdAt
                          ? new Date(a.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td>
                        <div className={styles.signatureCell}>
                          {a.hasSignature && (
                            signatureMap[a.id] ? (
                              <img
                                className={styles.signatureImage}
                                src={signatureMap[a.id]}
                                alt={`Signature ${getParticipantLabel(a)}`}
                                onClick={() => handleViewSignature(a)}
                              />
                            ) : (
                              <span className={styles.signaturePending}>
                                Chargement...
                              </span>
                            )
                          )}
                          {!a.hasSignature && "—"}
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(a)}
                          >
                            Supprimer
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={setPage}
          disabled={loading}
        />
        <Modal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setSignatureDataUrl(null);
            setSignatureError(null);
            setSignatureFor(null);
          }}
          title={`Signature — ${
            signatureFor?.participant?.fullName ?? "Participant"
          }`}
          size="md"
          footer={
            <Button
              variant="secondary"
              onClick={() => setShowSignatureModal(false)}
            >
              Fermer
            </Button>
          }
        >
          {signatureLoading ? (
            <div className={styles.sigLoading}>
              <Loader
                variant="spinner"
                size="lg"
                text="Chargement de la signature..."
              />
            </div>
          ) : signatureError ? (
            <div className={styles.sigError}>
              <AlertCircle size={18} />
              {signatureError}
            </div>
          ) : signatureDataUrl ? (
            <div className={styles.sigPreview}>
              <img src={signatureDataUrl} alt="Signature" />
            </div>
          ) : (
            <div className={styles.sigEmpty}>Aucune signature.</div>
          )}
        </Modal>

        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Supprimer ce pointage ?"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleDeleteAttendance} loading={deleting}>
                Supprimer
              </Button>
            </>
          }
        >
          <p>
            Cette action est irréversible. Le pointage sélectionné sera supprimé
            définitivement.
          </p>
        </Modal>
      </div>
    </Modal>
  );
};
