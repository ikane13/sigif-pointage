import type { FC } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import type { SelectProps } from './Select.types';
import styles from './Select.module.scss';

export const Select: FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  icon,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.selectContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          className={clsx(styles.select, {
            [styles.hasIcon]: !!icon,
            [styles.error]: !!error,
          })}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <span id={`${name}-error`} className={styles.errorText} role="alert">
          <AlertCircle size={16} />
          {error}
        </span>
      )}

      {!error && helperText && (
        <span id={`${name}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
};