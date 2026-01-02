import type { FC } from 'react';
import clsx from 'clsx';
import type { BadgeProps } from './Badge.types';
import styles from './Badge.module.scss';

export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  rounded = false,
}) => {
  return (
    <span
      className={clsx(
        styles.badge,
        styles[variant],
        styles[size],
        {
          [styles.rounded]: rounded,
        }
      )}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};