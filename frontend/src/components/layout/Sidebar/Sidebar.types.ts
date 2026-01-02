import type { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number | string;
  children?: MenuItem[];
}

export interface SidebarProps {
  items: MenuItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}