import { Link } from '@tanstack/react-router';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.visible : ''}`} 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <h1>Cody Batch</h1>
        </div>
        
        <nav className={styles.nav}>
          <ul>
            <li>
              <Link 
                to="/" 
                className={styles.navLink}
                activeProps={{ className: styles.active }}
                onClick={onClose}
              >
                <span className={styles.icon}>📊</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/repositories" 
                className={styles.navLink}
                activeProps={{ className: styles.active }}
                onClick={onClose}
              >
                <span className={styles.icon}>📁</span>
                <span>Repositories</span>
              </Link>
            </li>
            <li className={styles.navGroup}>
              <div className={styles.navGroupHeader}>
                <span className={styles.icon}>🔄</span>
                <span>Jobs</span>
              </div>
              <ul className={styles.subNav}>
                <li>
                  <Link 
                    to="/jobs" 
                    className={styles.navLink}
                    activeProps={{ className: styles.active }}
                    onClick={onClose}
                  >
                    <span>Job List</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/jobs/create" 
                    className={styles.navLink}
                    activeProps={{ className: styles.active }}
                    onClick={onClose}
                  >
                    <span>Create Job</span>
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link 
                to="/settings" 
                className={styles.navLink}
                activeProps={{ className: styles.active }}
                onClick={onClose}
              >
                <span className={styles.icon}>⚙️</span>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className={styles.footer}>
          <p>Cody Batch v0.1.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;