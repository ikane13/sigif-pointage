import type { ReactNode, HTMLAttributes } from 'react';

export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  shadow?: boolean;
  hoverable?: boolean;
}