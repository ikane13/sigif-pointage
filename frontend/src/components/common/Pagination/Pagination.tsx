import type { FC } from 'react';
import clsx from 'clsx';
import { Button } from '@components/common/Button';
import styles from './Pagination.module.scss';
import type { PaginationProps } from './Pagination.types';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getPageItems(page: number, totalPages: number, maxButtons: number) {
  // Retourne: [1, '…', 4, 5, 6, '…', 12]
  if (totalPages <= maxButtons + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: Array<number | '…'> = [];
  const half = Math.floor(maxButtons / 2);

  const start = clamp(page - half, 2, Math.max(2, totalPages - maxButtons));
  const end = clamp(start + maxButtons - 1, Math.min(totalPages - 1, maxButtons + 1), totalPages - 1);

  items.push(1);

  if (start > 2) items.push('…');

  for (let p = start; p <= end; p++) items.push(p);

  if (end < totalPages - 1) items.push('…');

  items.push(totalPages);

  return items;
}

export const Pagination: FC<PaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
  maxPageButtons = 5,
  disabled = false,
  showWhenSinglePage = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = clamp(page, 1, totalPages);

  const startItem = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, totalItems);

  const items = getPageItems(current, totalPages, maxPageButtons);

  const goTo = (p: number) => {
    const next = clamp(p, 1, totalPages);
    if (next !== current) onPageChange(next);
  };

  // si une seule page, pas de pagination (sauf si forcé)
  if (totalItems <= pageSize && !showWhenSinglePage) return null;

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        Affichage <strong>{startItem}</strong>–<strong>{endItem}</strong> sur <strong>{totalItems}</strong>
      </div>

      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => goTo(current - 1)}
          disabled={disabled || current <= 1}
        >
          Précédent
        </Button>

        <div className={styles.pages}>
          {items.map((it, idx) =>
            it === '…' ? (
              <span key={`dots-${idx}`} className={styles.dots} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={it}
                type="button"
                className={clsx(styles.pageBtn, it === current && styles.active)}
                onClick={() => goTo(it)}
                disabled={disabled}
                aria-current={it === current ? 'page' : undefined}
              >
                {it}
              </button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => goTo(current + 1)}
          disabled={disabled || current >= totalPages}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};
