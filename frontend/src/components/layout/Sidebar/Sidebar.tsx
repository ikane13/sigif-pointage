import { type FC, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, ClipboardList, Users } from 'lucide-react';
import type { SidebarProps, MenuItem } from './Sidebar.types';
import { useSidebarContext } from './SidebarContext';
import dtaiLogo from '../../../assets/branding/dtai-logo.png';
import styles from './Sidebar.module.scss';

export const Sidebar: FC<SidebarProps> = ({ items, isCollapsed = false, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { event } = useSidebarContext();

  const toggleItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleItem(item.id)}
            className={styles.menuItem}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.badge && <span className={styles.badge}>{item.badge}</span>}
            <ChevronDown
              size={16}
              className={clsx(styles.expandIcon, {
                [styles.expanded]: isExpanded,
              })}
            />
          </button>

          <div
            className={styles.submenu}
            style={{
              maxHeight: isExpanded ? `${item.children!.length * 48}px` : '0',
            }}
          >
            {item.children!.map((child) => (
              <NavLink
                key={child.id}
                to={child.path}
                className={({ isActive }) =>
                  clsx(styles.menuItem, { [styles.active]: isActive })
                }
              >
                <span className={styles.icon}>{child.icon}</span>
                <span className={styles.label}>{child.label}</span>
                {child.badge && <span className={styles.badge}>{child.badge}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={item.path}
        className={({ isActive }) =>
          clsx(styles.menuItem, { [styles.active]: isActive })
        }
      >
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.label}>{item.label}</span>
        {item.badge && <span className={styles.badge}>{item.badge}</span>}
      </NavLink>
    );
  };

  const screenLabel = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/events')) return 'Événements';
    if (path.startsWith('/participants')) return 'Participants';
    if (path === '/') return 'Tableau de bord';
    return 'Administration';
  }, [location.pathname]);

  const formatDate = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planifié';
      case 'ongoing':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status ?? '—';
    }
  };

  return (
    <aside className={clsx(styles.sidebar, { [styles.collapsed]: isCollapsed })}>
      <div className={styles.logo}>
        <div className={styles.logoButton} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <img className={styles.logoImage} src={dtaiLogo} alt="DTAI" />
      </div>

      <nav className={styles.menu}>{items.map(renderMenuItem)}</nav>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Raccourcis</div>
        <div className={styles.quickActions}>
          <NavLink to="/events/new" className={styles.quickAction}>
            <Plus size={16} />
            <span>Créer un événement</span>
          </NavLink>
          <NavLink to="/events" className={styles.quickAction}>
            <ClipboardList size={16} />
            <span>Liste des événements</span>
          </NavLink>
          <NavLink to="/participants" className={styles.quickAction}>
            <Users size={16} />
            <span>Participants</span>
          </NavLink>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Contexte</div>
        <div className={styles.contextCard}>
          {event ? (
            <>
              <div className={styles.contextTitle}>{event.title}</div>
              <div className={styles.contextMeta}>
                <span className={styles.contextMetaLabel}>Statut</span>
                <span className={clsx(styles.statusBadge, styles[`status${event.status}`])}>
                  {statusLabel(event.status)}
                </span>
              </div>
              <div className={styles.contextItem}>
                <span className={styles.contextLabel}>Début</span>
                <span className={styles.contextValue}>{formatDate(event.startDate)}</span>
              </div>
              <div className={styles.contextItem}>
                <span className={styles.contextLabel}>Fin</span>
                <span className={styles.contextValue}>{formatDate(event.endDate)}</span>
              </div>
              <div className={styles.contextStats}>
                <div className={styles.contextStat}>
                  <span className={styles.contextStatValue}>
                    {event.attendanceStats?.total ?? 0}
                  </span>
                  <span className={styles.contextStatLabel}>Présences</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.contextItem}>
                <span className={styles.contextLabel}>Écran</span>
                <span className={styles.contextValue}>{screenLabel}</span>
              </div>
              <div className={styles.contextItem}>
                <span className={styles.contextLabel}>Organisation</span>
                <span className={styles.contextValue}>DTAI</span>
              </div>
              <div className={styles.contextHint}>
                Sélectionnez un événement pour afficher un résumé détaillé.
              </div>
            </>
          )}
        </div>
      </div>

      {onToggle && (
        <div className={styles.footer}>
          <button onClick={onToggle} className={styles.toggleButton}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      )}
    </aside>
  );
};
