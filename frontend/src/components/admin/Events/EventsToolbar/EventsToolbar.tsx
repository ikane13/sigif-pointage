import { type FC, useEffect, useMemo, useState } from 'react';
import { Input } from '@components/common/Input';
import { Select } from '@components/common/Select';
import { Button } from '@components/common/Button';
import { Search, RotateCcw } from 'lucide-react';
import type { EventsToolbarProps, EventsPeriod, EventStatusFilter, EventTypeFilter } from './EventsToolbar.types';
import styles from './EventsToolbar.module.scss';

const statusOptions: Array<{ value: EventStatusFilter; label: string }> = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'scheduled', label: 'Planifié' },
  { value: 'ongoing', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

const typeOptions: Array<{ value: EventTypeFilter; label: string }> = [
  { value: 'all', label: 'Tous les types' },
  { value: 'training', label: 'Formation' },
  { value: 'workshop', label: 'Atelier' },
  { value: 'meeting', label: 'Réunion' },
  { value: 'committee', label: 'Comité' },
  { value: 'seminar', label: 'Séminaire' },
  { value: 'other', label: 'Autre' },
];

const periodOptions: Array<{ value: EventsPeriod; label: string }> = [
  { value: 'all', label: 'Toutes les périodes' },
  { value: 'today', label: 'Aujourd’hui' },
  { value: 'thisMonth', label: 'Ce mois' },
  { value: 'lastMonth', label: 'Mois précédent' },
  { value: 'custom', label: 'Période personnalisée' },
];

export const EventsToolbar: FC<EventsToolbarProps> = ({ value, onChange, onReset, loading }) => {
  const [qLocal, setQLocal] = useState(value.q);

  // Debounce recherche
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qLocal !== value.q) onChange({ ...value, q: qLocal });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  useEffect(() => setQLocal(value.q), [value.q]);

  const resetDisabled = useMemo(() => {
    return (
      value.q.trim() === '' &&
      value.status === 'all' &&
      value.eventType === 'all' &&
      value.period === 'all' &&
      !value.from &&
      !value.to
    );
  }, [value]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <div className={styles.search}>
          <Input
            label="Rechercher"
            name="q"
            type="text"
            placeholder="Rechercher par titre, lieu, ou organisateur…"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            icon={<Search size={18} />}
            disabled={!!loading}
          />
        </div>

        <div className={styles.filters}>
          <Select
            label="Statut"
            name="status"
            value={value.status}
            options={statusOptions}
            onChange={(e) => onChange({ ...value, status: e.target.value as EventStatusFilter })}
            disabled={!!loading}
          />

          <Select
            label="Type"
            name="eventType"
            value={value.eventType}
            options={typeOptions}
            onChange={(e) => onChange({ ...value, eventType: e.target.value as EventTypeFilter })}
            disabled={!!loading}
          />

          <Select
            label="Période"
            name="period"
            value={value.period}
            options={periodOptions}
            onChange={(e) => {
              const next = e.target.value as EventsPeriod;
              onChange({
                ...value,
                period: next,
                ...(next !== 'custom' ? { from: undefined, to: undefined } : {}),
              });
            }}
            disabled={!!loading}
          />

          <div className={styles.reset}>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={16} />}
              onClick={onReset}
              disabled={resetDisabled || !!loading}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Dates personnalisées : inputs natifs stylés */}
      {value.period === 'custom' && (
        <div className={styles.customRange}>
          <div className={styles.nativeField}>
            <label className={styles.nativeLabel} htmlFor="fromDate">Du</label>
            <input
              id="fromDate"
              className={styles.nativeInput}
              type="date"
              value={value.from ?? ''}
              onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
              disabled={!!loading}
            />
          </div>

          <div className={styles.nativeField}>
            <label className={styles.nativeLabel} htmlFor="toDate">Au</label>
            <input
              id="toDate"
              className={styles.nativeInput}
              type="date"
              value={value.to ?? ''}
              onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
              disabled={!!loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
