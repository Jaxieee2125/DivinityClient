// src/components/auth/ChangePasswordForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changePassword } from '../../api/apiClient';
import styles from './AuthForm.module.css';

function ChangePasswordForm() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({}); // Lưu lỗi theo field hoặc lỗi chung
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!oldPassword) newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ.";
        if (!newPassword) {
            newErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
        } else if (newPassword.length < 8) { // Đồng bộ với backend validator
            newErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
        }
        if (!confirmPassword) {
             newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }
        setLoading(true);

        try {
            const response = await changePassword(oldPassword, newPassword);
            setSuccessMessage(response.data.message || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            // Xóa form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Cân nhắc: Logout người dùng sau khi đổi mật khẩu thành công
            // localStorage.removeItem('accessToken');
            // localStorage.removeItem('refreshToken');
            // localStorage.removeItem('userInfo');
            // Có thể thêm delay trước khi chuyển hướng
            setTimeout(() => {
                 navigate('/login'); // Chuyển về trang đăng nhập
            }, 2000); // Chờ 2 giây

        } catch (err) {
            console.error("Change password error:", err.response || err.message);
            if (err.response && err.response.data) {
                 if (typeof err.response.data === 'object' && err.response.data !== null) {
                     // Map lỗi backend vào state error (ví dụ: lỗi old_password, new_password)
                     const backendErrors = {};
                     for (const key in err.response.data) {
                         if (Array.isArray(err.response.data[key])) {
                             backendErrors[key] = err.response.data[key].join(' ');
                         } else {
                              backendErrors.general = err.response.data[key]; // Lỗi chung
                         }
                     }
                      if(err.response.data.detail) backendErrors.general = err.response.data.detail;
                      if(err.response.data.error) backendErrors.general = err.response.data.error;
                     setErrors(backendErrors);
                 } else {
                     setErrors({ general: 'Đổi mật khẩu thất bại. Vui lòng thử lại.' });
                 }
            } else {
                setErrors({ general: 'Đã xảy ra lỗi mạng hoặc lỗi không xác định.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>Đổi Mật Khẩu</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {successMessage && <p className={styles.success}>{successMessage}</p>}
                {errors.general && <p className={styles.error}>{errors.general}</p>}

                <div className={styles.inputGroup}>
                    <label htmlFor="oldPassword" className={styles.label}>Mật khẩu cũ</label>
                    <input
                        type="password"
                        id="oldPassword"
                        name="oldPassword"
                        className={styles.input}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errors.old_password && <p className={styles.fieldError}>{errors.old_password}</p>} {/* Key khớp với backend */}
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="newPassword" className={styles.label}>Mật khẩu mới</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        className={styles.input}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errors.new_password && <p className={styles.fieldError}>{errors.new_password}</p>} {/* Key khớp với backend */}
                    {errors.newPassword && <p className={styles.fieldError}>{errors.newPassword}</p>} {/* Lỗi từ client validation */}
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>Xác nhận mật khẩu mới</label>
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
                    {errors.confirmPassword && <p className={styles.fieldError}>{errors.confirmPassword}</p>}
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Đổi Mật Khẩu'}
                </button>
                 <div className={styles.links}>
                    <Link to="/profile" className={styles.link}>Quay lại Profile</Link> {/* Sử dụng Link */}
                </div>
            </form>
        </div>
    );
}

export default ChangePasswordForm;