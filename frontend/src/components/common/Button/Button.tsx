import type { FC } from 'react';
import clsx from 'clsx';
import type { ButtonProps } from './Button.types';
import styles from './Button.module.scss';

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.fullWidth]: fullWidth,
          [styles.loading]: loading,
          [styles.iconRight]: iconPosition === 'right',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      
      <span className={styles.content}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </span>
    </button>
  );
};