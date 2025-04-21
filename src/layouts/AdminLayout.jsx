// src/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom'; // Import Outlet và Navigate
import AdminSidebar from '../components/admin/AdminSidebar'; // Sidebar riêng cho admin
import styles from './AdminLayout.module.css'; // CSS Module riêng

// --- Giả lập kiểm tra Admin ---
// TODO: Thay thế bằng logic kiểm tra token/session thực tế
const isAdminAuthenticated = () => {
  const token = localStorage.getItem('adminAuthToken'); // Lấy access token
  // TODO: Thêm kiểm tra token hợp lệ (ví dụ: kiểm tra hạn hoặc verify trên server)
  // Ví dụ đơn giản: chỉ cần tồn tại token
  const isLoggedInFlag = localStorage.getItem('isAdminLoggedIn') === 'true';
  return !!token && isLoggedInFlag; // Cần cả token và cờ (hoặc chỉ token nếu kiểm tra kỹ hơn)
};
// -----------------------------

const AdminLayout = () => {

  // --- Bảo vệ Route ngay tại Layout ---
  if (!isAdminAuthenticated()) {
    // Nếu chưa đăng nhập admin, chuyển hướng đến trang login (hoặc trang chủ)
    // `replace` để không lưu lại trang admin trong history
    return <Navigate to="/admin/login" replace />;
    // Hoặc <Navigate to="/admin/login" replace />; nếu có trang login riêng
  }
  // ---------------------------------

  return (
    <div className={styles.adminContainer}>
      <AdminSidebar />
      <main className={styles.adminContent}>
        <Outlet /> {/* Nơi render các trang Manage... */}
      </main>
    </div>
  );
};

export default AdminLayout;