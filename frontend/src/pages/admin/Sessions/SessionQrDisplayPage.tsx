/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@components/common/Button";
import { Loader } from "@components/common/Loader";
import { qrCodesService } from "@services/qrCodesService";
import { sessionsService } from "@services/sessionsService";
import type { Session } from "@/types/session.types";
import banner from "@/assets/branding/dtai-banner.png";
import logo from "@/assets/branding/dtai-logo.png";
import styles from "./SessionQrDisplayPage.module.scss";

export const SessionQrDisplayPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<{
    token: string;
    generatedAt: string;
    scanCount: number;
    urls: { pointage: string };
  } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);

      const [sessionData, qrData] = await Promise.all([
        sessionsService.getById(sessionId),
        qrCodesService.getInfo(sessionId),
      ]);

      setSession(sessionData);
      setQrInfo(qrData);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setQrInfo(null);
        if (!session) {
          try {
            const sessionData = await sessionsService.getById(sessionId);
            setSession(sessionData);
          } catch {
            setError("Session introuvable");
          }
        }
      } else {
        setError(err?.response?.data?.message || "Erreur lors du chargement du QR code");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const id = window.setInterval(() => {
      qrCodesService.getInfo(sessionId).then(setQrInfo).catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(id);
  }, [sessionId]);

  const handleGenerate = async () => {
    if (!sessionId) return;
    try {
      setGenerating(true);
      const data = await qrCodesService.generate(sessionId);
      setQrInfo(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de la génération du QR code");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loader variant="spinner" size="lg" text="Chargement..." />
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
        <div className={styles.error}>{error || "Session introuvable"}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <div className={styles.topActions}>
          <Button variant="secondary" onClick={() => load()}>
            Actualiser
          </Button>
        </div>
      </div>

      <div className={styles.brandHeader}>
        <img
          className={styles.banner}
          src={banner}
          alt="Republique du Senegal - Ministere des Finances et du Budget"
        />
        <div className={styles.brandInner}>
          <img className={styles.logo} src={logo} alt="DTAI" />
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>Systeme de Pointage</div>
            <div className={styles.brandSubtitle}>
              Direction du Traitement Automatique de l'Information (DTAI)
            </div>
          </div>
        </div>
      </div>

      <div className={styles.headerCard}>
        <div className={styles.headerTitle}>QR Code de pointage</div>
        <div className={styles.headerSubtitle}>
          Présentez ce QR code à l’entrée pour un pointage rapide.
        </div>
        <div className={styles.metaRow}>
          <div className={styles.metaChip}>
            <span className={styles.metaKey}>Session</span>
            <span className={styles.metaValue}>
              {session?.label || `Session #${session?.sessionNumber ?? ""}`}
            </span>
          </div>
          <div className={styles.metaChip}>
            <span className={styles.metaKey}>Date</span>
            <span className={styles.metaValue}>{formatDate(session?.sessionDate)}</span>
          </div>
          <div className={styles.metaChip}>
            <span className={styles.metaKey}>Lieu</span>
            <span className={styles.metaValue}>{session?.location ?? "—"}</span>
          </div>
          {/* <div className={styles.metaChip}>
            <span className={styles.metaKey}>Scans</span>
            <span className={styles.metaValue}>{qrInfo?.scanCount ?? 0}</span>
          </div> */}
        </div>
      </div>

      <div className={styles.qrPanel}>
        {!qrInfo ? (
          <div className={styles.empty}>
            <p>Aucun QR code généré pour cette session.</p>
            <Button onClick={handleGenerate} loading={generating}>
              Générer le QR Code
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.qrBox}>
              <QRCodeSVG value={qrInfo.urls.pointage} size={360} level="H" />
            </div>
            <div className={styles.qrHint}>
              Scannez ce QR code pour pointer votre présence.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
