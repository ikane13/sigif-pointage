export type LoaderVariant = 'spinner' | 'dots' | 'bar';
export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: string;
  text?: string;
}