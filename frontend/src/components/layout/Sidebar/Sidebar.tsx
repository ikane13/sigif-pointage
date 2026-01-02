import { type FC, useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SidebarProps, MenuItem } from './Sidebar.types';
import styles from './Sidebar.module.scss';

export const Sidebar: FC<SidebarProps> = ({ items, isCollapsed = false, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  return (
    <aside className={clsx(styles.sidebar, { [styles.collapsed]: isCollapsed })}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>D</div>
        <span className={styles.logoText}>DTAI</span>
      </div>

      <nav className={styles.menu}>{items.map(renderMenuItem)}</nav>

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