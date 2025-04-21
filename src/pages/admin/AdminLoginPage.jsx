// src/pages/admin/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../api/apiClient'; // Hàm API sẽ tạo ở bước sau
import styles from './AdminLoginPage.module.css'; // CSS cho trang login

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Xóa lỗi cũ
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        setLoading(true);
        try {
            // Gọi API login backend
            const response = await loginAdmin(username, password);

            // API /api/token/ trả về { access: '...', refresh: '...' }
            if (response.data.access && response.data.refresh) {
                // --- Lưu trữ Tokens ---
                // Lưu ý: localStorage không phải là an toàn nhất, nhưng đơn giản để bắt đầu
                // Cân nhắc HttpOnly Cookies nếu có thể cấu hình backend
                localStorage.setItem('adminAuthToken', response.data.access);
                localStorage.setItem('adminRefreshToken', response.data.refresh);
                localStorage.setItem('isAdminLoggedIn', 'true'); // Đặt cờ đăng nhập admin

                console.log("Admin login successful!");
                // Chuyển hướng đến trang admin dashboard
                navigate('/admin', { replace: true }); // replace để không quay lại trang login bằng nút back
            } else {
                 setError('Login failed: Invalid response from server.');
            }
        } catch (err) {
            console.error("Admin login error:", err);
            if (err.response && err.response.status === 401) {
                setError('Login failed: Invalid username or password.');
            } else {
                setError('Login failed: An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h2>Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;