import React, { useState } from 'react';
import { registerUser } from '../../api/apiClient'; // Import hàm gọi API
import styles from './AuthForm.module.css'; // Dùng chung CSS Module

function RegistrationForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState({}); // Lưu lỗi theo từng field
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập.";
        if (!email.trim()) {
             newErrors.email = "Vui lòng nhập email.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
             newErrors.email = "Địa chỉ email không hợp lệ.";
        }
        if (!password) {
             newErrors.password = "Vui lòng nhập mật khẩu.";
        } else if (password.length < 8) { // Nên đồng bộ với validation backend
             newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
        }
        if (password !== confirmPassword) {
             newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
        }
        setError(newErrors);
        return Object.keys(newErrors).length === 0; // True nếu không có lỗi
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError({}); // Xóa lỗi cũ
        setSuccessMessage('');

        if (!validateForm()) {
            return; // Dừng nếu validation phía client thất bại
        }
        setLoading(true);

        try {
            await registerUser(username, email, password);
            setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập.');
            // Xóa form sau khi thành công
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
             // Có thể chuyển hướng người dùng sang trang đăng nhập ở đây
             // history.push('/login'); // Nếu dùng React Router v5
             // navigate('/login'); // Nếu dùng React Router v6

        } catch (err) {
            console.error('Registration error:', err.response || err.message);
            if (err.response && err.response.data) {
                // Hiển thị lỗi từ backend (thường là lỗi validation)
                // Lỗi có thể là dạng {"username": ["lỗi 1"], "email": ["lỗi 2"]}
                // Hoặc dạng {"error": "thông báo lỗi chung"}
                 if (typeof err.response.data === 'object' && err.response.data !== null) {
                     // Map lỗi backend vào state error
                     const backendErrors = {};
                     for (const key in err.response.data) {
                         if (Array.isArray(err.response.data[key])) {
                             backendErrors[key] = err.response.data[key].join(' '); // Nối các lỗi thành 1 string
                         } else {
                              backendErrors.general = err.response.data[key]; // Lỗi chung
                         }
                     }
                     // Ưu tiên hiển thị lỗi detail/error nếu có
                     if(err.response.data.detail) backendErrors.general = err.response.data.detail;
                     if(err.response.data.error) backendErrors.general = err.response.data.error;

                     setError(backendErrors);
                 } else {
                     setError({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
                 }

            } else {
                setError({ general: 'Đã xảy ra lỗi mạng hoặc lỗi không xác định.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>Đăng ký</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {successMessage && <p className={styles.success}>{successMessage}</p>}
                {error.general && <p className={styles.error}>{error.general}</p>}

                <div className={styles.inputGroup}>
                    <label htmlFor="reg-username" className={styles.label}>Username</label>
                    <input
                        type="text"
                        id="reg-username"
                        name="username"
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                     {error.username && <p className={styles.fieldError}>{error.username}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="reg-email" className={styles.label}>Email</label>
                    <input
                        type="email"
                        id="reg-email"
                        name="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {error.email && <p className={styles.fieldError}>{error.email}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="reg-password" className={styles.label}>Mật khẩu</label>
                    <input
                        type="password"
                        id="reg-password"
                        name="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                     {/* Hiển thị lỗi password từ backend hoặc client */}
                     {error.password && <p className={styles.fieldError}>{error.password}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className={styles.input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {error.confirmPassword && <p className={styles.fieldError}>{error.confirmPassword}</p>}
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
                 <div className={styles.links}>
                    <a href="/login" className={styles.link}>Đã có tài khoản? Đăng nhập</a>
                </div>
            </form>
        </div>
    );
}

export default RegistrationForm;