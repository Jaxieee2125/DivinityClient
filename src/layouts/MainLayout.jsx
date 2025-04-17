// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';    // Import file .jsx
import PlayerBar from '../components/PlayerBar.jsx';  // Import file .jsx
import styles from './MainLayout.module.css';     // Import CSS Module

const MainLayout = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <Outlet /> {/* Nơi render các trang con */}
        </main>
        <PlayerBar />
      </div>
    </div>
  );
};

export default MainLayout;