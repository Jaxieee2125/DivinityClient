// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/apiClient'; // Đổi tên nếu cần
import styles from './ProfilePage.module.css'; // Tạo file CSS riêng

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                // Lấy thông tin user đã lưu khi đăng nhập
                const storedUserInfo = localStorage.getItem('userInfo');
                if (!storedUserInfo) {
                    console.error("User info not found in localStorage. Redirecting to login.");
                    setError("Vui lòng đăng nhập để xem trang này.");
                    navigate('/login'); // Chuyển hướng nếu không có thông tin user
                    return;
                }

                const parsedUserInfo = JSON.parse(storedUserInfo);
                const userId = parsedUserInfo.id; // Giả sử bạn lưu 'id'

                if (!userId) {
                    console.error("User ID not found in stored info. Redirecting to login.");
                    setError("Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.");
                    navigate('/login');
                    return;
                }

                const response = await getUserProfile(userId); // Gọi API lấy chi tiết user
                setUserData(response.data);
                console.log("Profile data fetched:", response.data);
            } catch (err) {
                console.error("Error fetching user profile:", err.response || err.message);
                if (err.response && err.response.status === 401) {
                     setError("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
                     // Có thể thêm logic xóa token cũ và redirect
                     localStorage.removeItem('accessToken');
                     localStorage.removeItem('refreshToken');
                     localStorage.removeItem('userInfo');
                     navigate('/login');
                } else {
                    setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]); // Thêm navigate vào dependency array

    if (loading) {
        return <div className={styles.loading}>Đang tải thông tin cá nhân...</div>;
    }

    if (error) {
        return <div className={styles.errorContainer}>Lỗi: {error}</div>;
    }

    if (!userData) {
        return <div className={styles.container}>Không tìm thấy thông tin người dùng.</div>;
    }

    // Hàm định dạng ngày (ví dụ)
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch (e) {
            return 'Ngày không hợp lệ';
        }
    };


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Thông Tin Cá Nhân</h1>
            <div className={styles.profileCard}>
                <div className={styles.avatarSection}>
                    {/* Giả sử bạn có profile_picture_url từ API */}
                    <img
                        src={userData.profile_picture_url || 'https://via.placeholder.com/150?text=Avatar'}
                        alt={`${userData.username}'s avatar`}
                        className={styles.avatar}
                    />
                    {/* Nút thay đổi ảnh đại diện (chức năng nâng cao) */}
                    {/* <button className={styles.changeAvatarButton}>Đổi ảnh</button> */}
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Tên đăng nhập:</span>
                        <span className={styles.infoValue}>{userData.username}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{userData.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Ngày sinh:</span>
                        <span className={styles.infoValue}>{formatDate(userData.date_of_birth)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Ngày tham gia:</span>
                        <span className={styles.infoValue}>{formatDate(userData.date_joined)}</span>
                    </div>
                    {/* Thêm các thông tin khác nếu có từ API */}
                    {/* Ví dụ:
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Số bài hát yêu thích:</span>
                        <span className={styles.infoValue}>{userData.favourite_songs_count || 0}</span>
                    </div>
                    */}
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.actionButton}
                        onClick={() => navigate('/profile/edit')} // Cần tạo trang EditProfile
                    >
                        Chỉnh sửa thông tin
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={() => navigate('/profile/change-password')} // Cần tạo trang ChangePassword
                    >
                        Đổi mật khẩu
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;