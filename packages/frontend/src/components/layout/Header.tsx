import { useState } from 'react';
import styles from './Header.module.css';

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.menuButton} onClick={onMenuClick}>
        <span className={styles.menuIcon}>☰</span>
      </div>
      
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search..."
        />
        <button className={styles.searchButton}>
          🔍
        </button>
      </div>
      
      <div className={styles.actions}>
        <button className={styles.actionButton}>
          🔔
        </button>
        
        <div className={styles.userDropdown}>
          <button 
            className={styles.userButton} 
            onClick={toggleDropdown}
          >
            <span className={styles.userAvatar}>👤</span>
            <span className={styles.userName}>User</span>
            <span className={styles.dropdownIcon}>▼</span>
          </button>
          
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <ul>
                <li>
                  <button className={styles.dropdownItem}>
                    Profile
                  </button>
                </li>
                <li>
                  <button className={styles.dropdownItem}>
                    Settings
                  </button>
                </li>
                <li className={styles.divider}></li>
                <li>
                  <button className={styles.dropdownItem}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;