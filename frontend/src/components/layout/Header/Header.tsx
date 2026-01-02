import { type FC, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Menu, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import type { HeaderProps } from './Header.types';
import styles from './Header.module.scss';

export const Header: FC<HeaderProps> = ({
  title = 'Dashboard',
  onMenuClick,
  showMenuButton = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // TODO: Implémenter la déconnexion
    console.log('Déconnexion');
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {showMenuButton && (
          <button onClick={onMenuClick} className={styles.menuButton}>
            <Menu size={24} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={styles.userButton}
          >
            <div className={styles.avatar}>A</div>
            <ChevronDown
              size={16}
              className={clsx(styles.chevron, { [styles.open]: isDropdownOpen })}
            />
          </button>

          <div className={clsx(styles.dropdown, { [styles.open]: isDropdownOpen })}>
            <button className={styles.dropdownItem}>
              <User size={16} className={styles.icon} />
              Mon compte
            </button>
            <button className={styles.dropdownItem}>
              <Settings size={16} className={styles.icon} />
              Paramètres
            </button>
            <div className={styles.divider} />
            <button onClick={handleLogout} className={styles.dropdownItem}>
              <LogOut size={16} className={styles.icon} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};