import { type FC, useRef, useState, useEffect } from 'react';
import { Button } from '@components/common/Button';
import { Eraser } from 'lucide-react';
import clsx from 'clsx';
import type { SignatureCanvasProps } from './SignatureCanvas.types';
import styles from './SignatureCanvas.module.scss';

export const SignatureCanvas: FC<SignatureCanvasProps> = ({ onSignatureChange, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Configure drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert to base64
    const base64 = canvas.toDataURL('image/png');
    onSignatureChange(base64);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange('');
  };

  return (
    <div className={styles.signatureContainer}>
      <label className={styles.label}>
        Signature
        <span className={styles.required}>*</span>
      </label>

      <div className={clsx(styles.canvasWrapper, {
        [styles.error]: error,
        [styles.hasSignature]: hasSignature,
      })}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className={clsx(styles.placeholder, { [styles.hidden]: hasSignature })}>
          ✍️ Signez ici avec votre doigt ou votre souris
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Eraser size={16} />}
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          Effacer
        </Button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {!error && (
        <div className={styles.helperText}>
          Dessinez votre signature dans le cadre ci-dessus
        </div>
      )}
    </div>
  );
};