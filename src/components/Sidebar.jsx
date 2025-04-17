// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiMusic, FiDisc, FiUsers, FiList, FiSearch, FiSettings } from 'react-icons/fi';
import styles from './Sidebar.module.css'; // Import CSS Module

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>MusicWeb</div>
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <FiMusic /> Songs
        </NavLink>
        <NavLink to="/artists" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <FiUsers /> Artists
        </NavLink>
        <NavLink to="/albums" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <FiDisc /> Albums
        </NavLink>
        <NavLink to="/playlists" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <FiList /> Playlists
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
          <FiSearch /> Search
        </NavLink>
      </nav>
      <div className={styles.settingsContainer}>
        <NavLink to="/settings" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
           <FiSettings /> Settings
         </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;