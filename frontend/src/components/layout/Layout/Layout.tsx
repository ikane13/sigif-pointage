import { type FC, useState } from 'react';
import clsx from 'clsx';
import { Home, Calendar, Users } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import type { LayoutProps } from './Layout.types';
import type { MenuItem } from '../Sidebar/Sidebar.types';
import styles from './Layout.module.scss';

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Accueil',
    icon: <Home size={20} />,
    path: '/',
  },
  {
    id: 'events',
    label: 'Événements',
    icon: <Calendar size={20} />,
    path: '/events',
  },
  {
    id: 'participants',
    label: 'Participants',
    icon: <Users size={20} />,
    path: '/participants',
  },
];

export const Layout: FC<LayoutProps> = ({ children, title }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <div className={clsx({ [styles.mobileSidebar]: true, [styles.visible]: isMobileSidebarOpen })}>
        <Sidebar
          items={menuItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
      </div>

      {/* Mobile Overlay */}
      <div
        className={clsx(styles.overlay, { [styles.visible]: isMobileSidebarOpen })}
        onClick={handleToggleMobileSidebar}
      />

      {/* Main Content */}
      <div className={clsx(styles.main, { [styles.collapsed]: isSidebarCollapsed })}>
        <Header
          title={title}
          onMenuClick={handleToggleMobileSidebar}
          showMenuButton={true}
        />

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};