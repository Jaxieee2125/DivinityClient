// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react'; // <<< THÊM useState, useEffect
import { Outlet, useNavigate } from 'react-router-dom'; // <<< THÊM useNavigate
import Sidebar from '../components/Sidebar.jsx';
import PlayerBar from '../components/PlayerBar.jsx';
import styles from './MainLayout.module.css';

// Nhận prop openSearchModal từ App
const MainLayout = ({ openSearchModal, toggleQueueSidebar }) => {
  // --- THÊM STATE VÀ LOGIC XỬ LÝ AUTH ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State để biết user đăng nhập chưa
  const navigate = useNavigate(); // Hook để điều hướng

  // Kiểm tra trạng thái đăng nhập khi component mount và khi localStorage thay đổi
  useEffect(() => {
    // Hàm kiểm tra token
    const checkAuthStatus = () => {
      const token = localStorage.getItem('accessToken'); // <<< Dùng key bạn lưu token khi đăng nhập user thành công
      setIsLoggedIn(!!token); // Cập nhật state: true nếu có token, false nếu không
    };

    checkAuthStatus(); // Kiểm tra lần đầu khi mount

    // Lắng nghe sự kiện 'storage' để cập nhật nếu token thay đổi ở tab khác
    window.addEventListener('storage', checkAuthStatus);

    // Cleanup: gỡ bỏ listener khi component unmount
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []); // Chỉ chạy một lần khi mount

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    console.log("MainLayout: handleLogout called");
    // Xóa thông tin khỏi localStorage
    localStorage.removeItem('accessToken');   // <<< Key token user
    localStorage.removeItem('refreshToken'); // <<< Key refresh token user
    localStorage.removeItem('userInfo');     // <<< Key thông tin user (nếu có)

    setIsLoggedIn(false); // Cập nhật state
    navigate('/'); // Chuyển hướng về trang đăng nhập
  };
  // --- KẾT THÚC PHẦN THÊM STATE VÀ LOGIC ---

  return (
    <div className={styles.container}>
      {/* === TRUYỀN PROPS XUỐNG SIDEBAR === */}
      <Sidebar
        openSearchModal={openSearchModal}
        isLoggedIn={isLoggedIn}       // <<< Truyền trạng thái login
        handleLogout={handleLogout}     // <<< Truyền hàm logout
      />
      {/* ================================== */}
      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <Outlet />
        </main>
        <PlayerBar toggleQueueSidebar={toggleQueueSidebar} />
      </div>
    </div>
  );
};

export default MainLayout;