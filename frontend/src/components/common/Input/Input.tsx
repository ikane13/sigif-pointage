import { type FC, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { InputProps } from './Input.types';
import styles from './Input.module.scss';

export const Input: FC<InputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
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

      <div className={styles.inputContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}

        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          className={clsx(styles.input, {
            [styles.hasIcon]: !!icon,
            [styles.hasToggle]: isPassword,
            [styles.error]: !!error,
          })}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleButton}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
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