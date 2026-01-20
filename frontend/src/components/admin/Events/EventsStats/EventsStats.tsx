import { type FC } from 'react';
import { Card } from '@components/common/Card';
import type { EventsStatsProps } from './EventsStats.types';
import styles from './EventsStats.module.scss';

export const EventsStats: FC<EventsStatsProps> = ({ value }) => {
  const items = [
    { label: 'Total', val: value.total },
    { label: 'En cours', val: value.ongoing },
    { label: 'Planifiés', val: value.scheduled },
    { label: 'Terminés', val: value.completed },
  ];

  return (
    <Card>
      <div className={styles.stats}>
        {items.map((it) => (
          <div key={it.label} className={styles.stat}>
            <div className={styles.value}>{it.val}</div>
            <div className={styles.label}>{it.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};
