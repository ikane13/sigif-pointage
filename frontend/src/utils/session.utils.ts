// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Session } from '@/types/session.types';
type SessionLike = {
  label: string;
  title?: string | null;
};


/**
 * 🎯 Formater le nom d'affichage d'une session selon la convention officielle
 * 
 * RÈGLE :
 * - Si title existe : "Atelier cadrage technique (Session 1 – 10 juin 2026)"
 * - Sinon : "Session 1 – 10 juin 2026"
 * 
 * @param session - Objet session
 * @returns Nom formaté pour affichage
 * 
 * @example
 * // Session sans title
 * getSessionDisplayName({ label: "Session 1 – 10 juin 2026", title: null })
 * // → "Session 1 – 10 juin 2026"
 * 
 * // Session avec title
 * getSessionDisplayName({ 
 *   label: "Session 1 – 10 juin 2026", 
 *   title: "Atelier cadrage technique" 
 * })
 * // → "Atelier cadrage technique (Session 1 – 10 juin 2026)"
 */
export function getSessionDisplayName(session: SessionLike): string {
  return session.title 
    ? `${session.title} (${session.label})`
    : session.label;
}

/**
 * 🎯 Formater la date d'une session en français lisible
 * 
 * Format : "10 juin 2026"
 * 
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée en français
 * 
 * @example
 * formatSessionDate("2026-06-10")
 * // → "10 juin 2026"
 */
export function formatSessionDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * 🎯 Formater la date complète d'une session (avec jour de la semaine)
 * 
 * Format : "Vendredi 10 juin 2026"
 * 
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @returns Date complète formatée
 * 
 * @example
 * formatSessionDateFull("2026-06-10")
 * // → "Vendredi 10 juin 2026"
 */
export function formatSessionDateFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * 🎯 Formater l'horaire d'une session
 * 
 * RÈGLES :
 * - Si startTime ET endTime : "9h00 - 17h00"
 * - Si seulement startTime : "Dès 9h00"
 * - Si seulement endTime : "Jusqu'à 17h00"
 * - Si aucun : null
 * 
 * @param startTime - Heure de début (HH:MM)
 * @param endTime - Heure de fin (HH:MM)
 * @returns Horaire formaté ou null
 * 
 * @example
 * formatSessionTime("09:00", "17:00")
 * // → "9h00 - 17h00"
 * 
 * formatSessionTime("09:00", undefined)
 * // → "Dès 9h00"
 * 
 * formatSessionTime(undefined, undefined)
 * // → null
 */
export function formatSessionTime(startTime?: string, endTime?: string): string | null {
  if (!startTime && !endTime) return null;

  // Fonction helper pour formatter HH:MM en "9h00"
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    return `${h}h${minutes}`;
  };

  if (startTime && endTime) {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }
  
  if (startTime) {
    return `Dès ${formatTime(startTime)}`;
  }
  
  if (endTime) {
    return `Jusqu'à ${formatTime(endTime)}`;
  }

  return null;
}

/**
 * 🎯 Générer un label de session par défaut (génération auto)
 * 
 * Format : "Session {number} – {date}"
 * Exemple : "Session 1 – 10 juin 2026"
 * 
 * Cette fonction est utilisée côté frontend pour prévisualiser,
 * mais le vrai label est généré par le backend.
 * 
 * @param sessionNumber - Numéro de session
 * @param sessionDate - Date de session (ISO ou Date)
 * @returns Label formaté
 */
export function generateDefaultLabel(sessionNumber: number, sessionDate: string | Date): string {
  const date = typeof sessionDate === 'string' ? new Date(sessionDate) : sessionDate;
  const formatted = formatSessionDate(date.toISOString().split('T')[0]);
  return `Session ${sessionNumber} – ${formatted}`;
}