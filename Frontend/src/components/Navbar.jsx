import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/notificationApi";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { canManageEvents, isAdmin, isAuthenticated, logout, user } = useAuth();

  const primaryLinks = useMemo(() => {
    const links = [
      { to: "/", label: "Home" },
      { to: "/events", label: "Events" },
    ];

    if (isAuthenticated) {
      links.push({ to: "/dashboard", label: "Dashboard" });
      links.push({ to: "/notifications", label: "Notifications" });
      links.push({ to: "/profile", label: "Profile" });
    }

    if (isAuthenticated && canManageEvents) {
      links.push({ to: "/create-event", label: "Create Event" });
    }

    if (isAuthenticated && !canManageEvents) {
      links.push({ to: "/my-orders", label: "My Orders" });
    }

    if (isAuthenticated && isAdmin) {
      links.push({ to: "/admin/reports", label: "Admin" });
    }

    return links;
  }, [canManageEvents, isAdmin, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotificationCount(0);
      return;
    }

    let ignore = false;

    async function loadUnreadCount() {
      try {
        const response = await notificationApi.getMyNotifications(user);
        if (!ignore) {
          const unread = response.notifications.filter(
            (item) => !item.isRead,
          ).length;
          setNotificationCount(unread);
        }
      } catch {
        if (!ignore) {
          setNotificationCount(0);
        }
      }
    }

    loadUnreadCount();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, location.pathname, user?.email, user?.id]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  const userInitials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">EN</span>
            <span className="brand-text">EventNest</span>
          </Link>

          <button className="menu-toggle" onClick={toggleMenu}>
            <span className={`hamburger ${isMenuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
            <div className="navbar-links">
              {primaryLinks.map((link) => {
                const isActive =
                  location.pathname === link.to ||
                  (link.to !== "/" && location.pathname.startsWith(link.to));

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={isActive ? "nav-link active" : "nav-link"}
                    onClick={closeMenu}
                  >
                    {link.label}
                    {link.to === "/notifications" && notificationCount > 0 ? (
                      <span className="nav-badge">{notificationCount}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            <div className="navbar-actions">
              {isAuthenticated ? (
                <>
                  <div className="user-pill" title={user?.email}>
                    <span className="user-pill-avatar">
                      {userInitials || "U"}
                    </span>
                    <span className="user-pill-text">
                      {user?.role || "USER"}
                    </span>
                  </div>
                  <button className="btn btn-outline" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-outline"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
