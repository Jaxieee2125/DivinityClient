// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';    // Import file .jsx
import PlayerBar from '../components/PlayerBar.jsx';  // Import file .jsx
import styles from './MainLayout.module.css';     // Import CSS Module

// Nhận prop openSearchModal từ App
const MainLayout = ({ openSearchModal }) => {
  return (
    <div className={styles.container}>
      {/* Truyền openSearchModal xuống Sidebar */}
      <Sidebar openSearchModal={openSearchModal} />
      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <Outlet />
        </main>
        <PlayerBar />
      </div>
    </div>
  );
};

export default MainLayout;