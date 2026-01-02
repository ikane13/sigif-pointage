import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputVariant = 'text' | 'email' | 'password' | 'tel' | 'number';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  name: string;
  type?: InputVariant;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}