import { FC } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import type { TextareaProps } from './Textarea.types';
import styles from './Textarea.module.scss';

export const Textarea: FC<TextareaProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  rows = 4,
  className,
  ...props
}) => {
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount >= maxLength * 0.8;
  const isAtLimit = maxLength && charCount >= maxLength;

  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        className={clsx(styles.textarea, {
          [styles.error]: !!error,
        })}
        {...props}
      />

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

      {maxLength && (
        <span
          className={clsx(styles.charCount, {
            [styles.nearLimit]: isNearLimit && !isAtLimit,
            [styles.atLimit]: isAtLimit,
          })}
        >
          {charCount}/{maxLength}
        </span>
      )}
    </div>
  );
};
