import { useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className={styles.content}>
        <Header onMenuClick={toggleSidebar} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;