// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/apiClient'; // Đổi tên nếu cần
import styles from './ProfilePage.module.css'; // Tạo file CSS riêng
import { FiEdit2, FiLock } from 'react-icons/fi'; // Thêm icon nếu cần

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
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return 'Ngày không hợp lệ';
        }
    };


    return (
        // Thêm pageWrapper để căn giữa
        <div className={styles.pageWrapper}>
            <div className={styles.profileCard}>
                {/* Phần Header của Card */}
                <div className={styles.cardHeader}>
                    <div className={styles.avatarContainer}>
                        <img
                            src={userData.profile_picture_url || '/default-avatar.png'} // <<< Dùng ảnh mặc định từ public
                            alt={`${userData.username}'s avatar`}
                            className={styles.avatar}
                            onError={(e) => { e.target.src = '/default-avatar.png'; }} // Fallback nếu ảnh lỗi
                        />
                        {/* Nút sửa ảnh nhỏ đè lên avatar */}
                        
                    </div>
                    {/* Tên user lớn */}
                    <div>
                        <h1 className={styles.usernameTitle}>{userData.username}</h1>
                         {/* Có thể thêm email hoặc thông tin khác ở đây */}
                         <p style={{color: '#a0a0a0', fontSize: '0.9rem', margin: 0}}>{userData.email}</p>
                    </div>
                </div>

                {/* Phần Thông tin chi tiết */}
                <div className={styles.infoSection}>
                    <h2 style={{fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid #3a3a3a', paddingBottom: '10px'}}>Details</h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Username</span>
                            <span className={styles.infoValue}>{userData.username}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Email</span>
                            <span className={styles.infoValue}>{userData.email}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Date of Birth</span>
                            <span className={styles.infoValue}>{formatDate(userData.date_of_birth)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Joined Date</span>
                            {/* Giả sử backend trả về date_joined */}
                            <span className={styles.infoValue}>{formatDate(userData.date_joined)}</span>
                        </div>
                         {/* Thêm các trường khác nếu có */}
                         {/* <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Status</span>
                            <span className={styles.infoValue}>{userData.is_active ? 'Active' : 'Inactive'}</span>
                         </div> */}
                    </div>
                </div>

                {/* Phần Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.actionButton}
                        onClick={() => navigate('/profile/edit')} // <<< Cần tạo route và trang này
                    >
                        <FiEdit2 style={{marginRight: '8px'}}/> Edit Profile
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={() => navigate('/profile/change-password')} // <<< Cần tạo route và trang này
                    >
                         <FiLock style={{marginRight: '8px'}}/> Change Password
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;