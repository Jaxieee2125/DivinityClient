import React, { useState } from 'react';
import { loginUser } from '../../api/apiClient'; // Import hàm gọi API
import styles from './AuthForm.module.css'; // CSS Module cho styling

function LoginForm() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(''); // Xóa lỗi cũ
        if (!identifier || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);

        try {
            const response = await loginUser(identifier, password);
            console.log('Login successful:', response.data);
            // --- Xử lý sau khi đăng nhập thành công ---
            // 1. Lưu tokens (ví dụ vào localStorage)
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            // 2. Lưu thông tin user (nếu cần)
            localStorage.setItem('userInfo', JSON.stringify(response.data.user));
            // 3. Cập nhật trạng thái global (nếu dùng Context/Redux/Zustand)
            // 4. Chuyển hướng người dùng (ví dụ về trang chủ)
            window.location.href = '/'; // Chuyển hướng đơn giản, nên dùng useNavigate của React Router

        } catch (err) {
            console.error('Login error:', err.response || err.message);
            if (err.response && err.response.data) {
                // Hiển thị lỗi từ backend
                setError(err.response.data.detail || err.response.data.error || 'Login failed. Please try again.');
            } else {
                setError('There was an error connecting to the server. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputGroup}>
                    <label htmlFor="identifier" className={styles.label}>Username</label>
                    <input
                        type="text"
                        id="identifier"
                        name="identifier"
                        className={styles.input}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your username or email" // Thêm placeholder
                        required
                        disabled={loading}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password" className={styles.label}>Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password" // Thêm placeholder
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Processing...' : 'Login'}
                </button>
                <div className={styles.links}>
                    {/* Sử dụng Link của React Router nếu có */}
                    <a href="/register" className={styles.link}>Register</a>
                    <a href="/forgot-password" className={styles.link}>Forgot your password?</a>
                </div>
            </form>
        </div>
    );
}

export default LoginForm;