import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'Student';

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          📊 Smart Project Monitor
        </Link>

        <div style={styles.menu}>
          {user && (
            <>
              <Link to="/" style={styles.link}>
                Dashboard
              </Link>
              {isStudent && (
                <>
                  <Link to="/projects" style={styles.link}>
                    My Projects
                  </Link>
                  <Link to="/ai-reviewer" style={styles.link}>
                    AI Reviewer
                  </Link>
                </>
              )}
              {!isStudent && (
                <>
                  <Link to="/assigned-projects" style={styles.link}>
                    Assigned Projects
                  </Link>
                  <Link to="/excel-import" style={styles.link}>
                    Import Data
                  </Link>
                </>
              )}
              <Link to="/notifications" style={styles.link}>
                🔔 Notifications
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount}</span>
                )}
              </Link>

              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.name}</span>
                <span style={styles.userRole}>{user.role}</span>
              </div>

              <button onClick={handleLogout} className="btn btn-danger btn-sm">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#4f46e5',
    textDecoration: 'none',
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  link: {
    textDecoration: 'none',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  badge: {
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7280',
  },
};

