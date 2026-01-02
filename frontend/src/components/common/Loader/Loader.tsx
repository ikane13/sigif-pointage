import type { FC } from 'react';
import clsx from 'clsx';
import type { LoaderProps } from './Loader.types';
import styles from './Loader.module.scss';

export const Loader: FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = '#0047AB',
  text,
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={clsx(styles.spinner, styles[size])}
            style={{ color }}
            role="status"
            aria-label="Chargement"
          />
        );

      case 'dots':
        return (
          <div className={styles.dots} style={{ color }} role="status" aria-label="Chargement">
            <span className={clsx(styles.dot, styles[size])} />
            <span className={clsx(styles.dot, styles[size])} />
            <span className={clsx(styles.dot, styles[size])} />
          </div>
        );

      case 'bar':
        return (
          <div className={clsx(styles.bar, styles[size])} role="status" aria-label="Chargement">
            <div className={styles.barProgress} style={{ backgroundColor: color }} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.loader}>
      {renderLoader()}
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
};