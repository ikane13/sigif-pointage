import type { FC } from 'react';
import clsx from 'clsx';
import type { CardProps } from './Card.types';
import styles from './Card.module.scss';

export const Card: FC<CardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  shadow = true,
  hoverable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
        {
          [styles.shadow]: shadow,
          [styles.hoverable]: hoverable,
        },
        className
      )}
      {...props}
    >
      {header && <div className={styles.header}>{header}</div>}
      
      <div className={styles.body}>{children}</div>
      
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};