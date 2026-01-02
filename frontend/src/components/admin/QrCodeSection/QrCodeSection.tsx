import { type FC, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Badge } from "@components/common/Badge";
import { Loader } from "@components/common/Loader";
import { Modal } from "@components/common/Modal";
import {
  QrCode,
  Download,
  RefreshCw,
  Copy,
  Check,
  FileImage,
  FileText,
} from "lucide-react";
import { qrCodesService } from "@services/qrCodesService";
import type { QrCodeInfo } from "@/types/event.types";
import type { QrCodeSectionProps } from "./QrCodeSection.types";
import styles from "./QrCodeSection.module.scss";

export const QrCodeSection: FC<QrCodeSectionProps> = ({ eventId }) => {
  const [qrInfo, setQrInfo] = useState<QrCodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadQrInfo();
  }, [eventId]);

  const loadQrInfo = async () => {
    try {
      setLoading(true);
      const data = await qrCodesService.getInfo(eventId);
      setQrInfo(data);
    } catch (err: any) {
      // Pas encore généré
      if (err.response?.status === 404) {
        setQrInfo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const data = await qrCodesService.generate(eventId);
      setQrInfo(data);
    } catch (err: any) {
      console.error("Erreur génération QR:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateModal(false);
    await handleGenerate();
  };

  const handleDownload = async (format: "png" | "pdf") => {
    try {
      const blob =
        format === "png"
          ? await qrCodesService.downloadPng(eventId)
          : await qrCodesService.downloadPdf(eventId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-code-${eventId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erreur téléchargement:", err);
    }
  };

  const handleCopyUrl = async () => {
    if (!qrInfo) return;

    try {
      await navigator.clipboard.writeText(qrInfo.urls.pointage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <div className={styles.loading}>
          <Loader variant="spinner" size="lg" text="Chargement..." />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.qrSection}>
        <div className={styles.header}>
          <h3>QR Code de pointage</h3>
          {qrInfo && (
            <Badge variant="success">{qrInfo.scanCount} scan(s)</Badge>
          )}
        </div>

        {!qrInfo ? (
          <div className={styles.empty}>
            <div className={styles.icon}>
              <QrCode size={32} />
            </div>
            <h4>Aucun QR code généré</h4>
            <p>
              Générez un QR code pour permettre aux participants de pointer leur
              présence
            </p>
            <Button
              onClick={handleGenerate}
              loading={generating}
              icon={<QrCode size={20} />}
            >
              Générer le QR Code
            </Button>
          </div>
        ) : (
          <div className={styles.qrContent}>
            <div className={styles.qrCard}>
              <div className={styles.qrTop}>
                <div className={styles.qrTopLeft}>
                  <h3>QR Code de pointage</h3>
                  <Badge variant="success">{qrInfo.scanCount} scan(s)</Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw size={16} />}
                  onClick={() => setShowRegenerateModal(true)}
                >
                  Régénérer
                </Button>
              </div>

              <div className={styles.qrCanvas}>
                <div className={styles.qrImage}>
                  {qrInfo?.urls.pointage && (
                    <QRCodeSVG
                      value={qrInfo.urls.pointage}
                      size={218}
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.statBox}>
                  <div className={styles.statValue}>{qrInfo.scanCount}</div>
                  <div className={styles.statLabel}>Nombre de scans</div>
                </div>

                <div className={styles.statBox}>
                  <div className={styles.statValue}>
                    {formatDate(qrInfo.generatedAt)}
                  </div>
                  <div className={styles.statLabel}>Généré le</div>
                </div>
              </div>

              <div className={styles.urlBlock}>
                <div className={styles.urlLabel}>URL de pointage</div>
                <div className={styles.urlBox}>
                  <input type="text" value={qrInfo.urls.pointage} readOnly />
                  <button onClick={handleCopyUrl} title="Copier">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FileImage size={16} />}
                  onClick={() => handleDownload("png")}
                >
                  Télécharger PNG
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FileText size={16} />}
                  onClick={() => handleDownload("pdf")}
                >
                  Télécharger PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        title="Régénérer le QR Code ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRegenerateModal(false)}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleRegenerate}>
              Régénérer
            </Button>
          </>
        }
      >
        <p>⚠️ Attention : La régénération créera un nouveau QR code.</p>
        <p style={{ marginTop: "0.5rem" }}>
          L'ancien QR code ne fonctionnera plus.
        </p>
      </Modal>
    </Card>
  );
};
