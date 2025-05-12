// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// Import icons bạn muốn dùng cho admin
import { FiGrid, FiMusic, FiUsers, FiDisc, FiTag, FiLogOut } from 'react-icons/fi';
import styles from './AdminSidebar.module.css'; // CSS Module riêng

const AdminSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa thông tin đăng nhập đã lưu
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('isAdminLoggedIn');
        console.log("Admin logged out");
        // Chuyển hướng về trang login hoặc trang chủ
        navigate('/admin/login', { replace: true }); // Hoặc navigate('/')
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>Divinity Interface</div>
            <nav className={styles.nav}>
                <NavLink to="/admin" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                   <FiGrid /> Dashboard
                </NavLink>
                <NavLink to="/admin/songs" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiMusic /> Manage Songs
                </NavLink>
                <NavLink to="/admin/artists" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiUsers /> Manage Artists
                </NavLink>
                <NavLink to="/admin/albums" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiDisc /> Manage Albums
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiUsers /> Manage Users
                </NavLink>
                 <NavLink to="/admin/genres" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiTag /> Manage Genres
                </NavLink>
                <NavLink to="/admin/song-requests" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    <FiMusic /> Manage Song Requests
                </NavLink>
                {/* Thêm các link quản lý khác */}
            </nav>
            <div className={styles.logoutSection}>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    <FiLogOut /> Logout
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;