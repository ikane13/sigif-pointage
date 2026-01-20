import { type FC, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  Menu,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Bell,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService, type UserProfile } from "@services/authService";
import { notificationsService } from "@services/notificationsService";
import type { NotificationItem } from "@/types/notification.types";
import type { HeaderProps } from "./Header.types";
import styles from "./Header.module.scss";

export const Header: FC<HeaderProps> = ({
  title = "Dashboard",
  onMenuClick,
  showMenuButton = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    authService.getUser()
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const initials = () => {
    const first = currentUser?.firstName || "";
    const last = currentUser?.lastName || "";
    const email = currentUser?.email || "";
    const letters = `${first.charAt(0)}${last.charAt(0)}`.trim();
    if (letters) return letters.toUpperCase();
    if (currentUser?.fullName) {
      const parts = currentUser.fullName.trim().split(/\s+/).filter(Boolean);
      const fallback = parts
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("");
      if (fallback) return fallback.toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "U";
  };

  const fullName = currentUser?.fullName || "Utilisateur";

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const data = await notificationsService.getAll({ page: 1, limit: 6 });
      setNotifItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifItems([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        loadNotifications();
      }
      return next;
    });
  };

  const resolveNotificationUrl = (item: NotificationItem) => {
    const payload = item.payload || {};
    if (item.entityType === "event" && item.entityId) {
      return `/events/${item.entityId}`;
    }
    if (item.entityType === "session") {
      if (payload.eventId) return `/events/${payload.eventId}`;
      if (item.entityId) return `/sessions/${item.entityId}/attendances/print`;
    }
    if (item.entityType === "attendance" && payload.eventId) {
      return `/events/${payload.eventId}/attendances`;
    }
    return "/events";
  };

  const notificationTone = (item: NotificationItem) => {
    if (item.type.endsWith("created")) return styles.notifInfo;
    if (item.type.endsWith("cancelled") || item.type.endsWith("deleted")) {
      return styles.notifDanger;
    }
    return styles.notifNeutral;
  };

  const handleDeleteNotification = async (id: string) => {
    const current = notifItems.find((n) => n.id === id);
    try {
      await notificationsService.remove(id);
      setNotifItems((prev) => prev.filter((n) => n.id !== id));
      if (current && !current.readAt) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.readAt) return;
    try {
      await notificationsService.markRead(item.id);
      setNotifItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (currentUser) return;
      try {
        const profile = await authService.getProfile();
        setCurrentUser(profile);
        authService.setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
          role: profile.role,
          isActive: profile.isActive,
        });
      } catch {
        // Ignore errors and keep fallback initials.
      }
    };

    loadUser();
  }, [currentUser]);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        <div className={styles.notifications} ref={notifRef}>
          <button
            type="button"
            className={styles.notificationsButton}
            onClick={handleToggleNotifications}
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notificationsBadge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notificationsMenu} role="menu">
              <div className={styles.notificationsHeader}>
                <span>Notifications</span>
                <button
                  type="button"
                  className={styles.markAll}
                  onClick={async () => {
                    await notificationsService.markAllRead();
                    setNotifItems((prev) =>
                      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
                    );
                    setUnreadCount(0);
                  }}
                >
                  Tout marquer lu
                </button>
              </div>

              {notifLoading ? (
                <div className={styles.notificationsEmpty}>Chargement...</div>
              ) : notifItems.length === 0 ? (
                <div className={styles.notificationsEmpty}>Aucune notification.</div>
              ) : (
                <div className={styles.notificationsList}>
                  {notifItems.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.notificationItem} ${notificationTone(item)} ${
                        item.readAt ? styles.notificationRead : ""
                      }`}
                      role="menuitem"
                      onClick={() => {
                        handleMarkRead(item);
                        setNotifOpen(false);
                        navigate(resolveNotificationUrl(item));
                      }}
                    >
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTitle}>{item.title}</div>
                        {item.message && (
                          <div className={styles.notificationMessage}>{item.message}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.notificationDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(item.id);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={styles.userButton}
          >
            <div className={styles.avatar}>{initials()}</div>
            <ChevronDown
              size={16}
              className={clsx(styles.chevron, {
                [styles.open]: isDropdownOpen,
              })}
            />
          </button>

          <div
            className={clsx(styles.dropdown, { [styles.open]: isDropdownOpen })}
          >
            <button
              className={styles.dropdownItem}
              onClick={() => {
                setIsDropdownOpen(false);
                navigate("/account");
              }}
            >
              <User size={16} className={styles.icon} />
              Mon compte
            </button>
            {/* <button
              className={styles.dropdownItem}
              onClick={() => {
                setIsDropdownOpen(false);
                navigate("/admin/settings");
              }}
            >
              <Settings size={16} className={styles.icon} />
              Paramètres
            </button> */}
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
