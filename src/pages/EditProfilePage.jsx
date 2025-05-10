import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../api/apiClient';
import styles from './EditProfilePage.module.css'; // Tạo CSS riêng hoặc dùng chung
import { FiCamera, FiSave, FiXCircle } from 'react-icons/fi'; // Thêm icon cho nút

function EditProfilePage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        date_of_birth: '', // Lưu dạng YYYY-MM-DD cho input type="date"
        profile_picture: null, // Lưu file object
    });
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    // Fetch dữ liệu hiện tại khi load trang
    useEffect(() => {
        const fetchCurrentProfile = async () => {
            setLoading(true);
            setError({});
            try {
                const response = await getCurrentUserProfile();
                const profile = response.data;
                setFormData({
                    username: profile.username || '',
                    email: profile.email || '',
                    // Chuyển đổi ngày sang YYYY-MM-DD cho input type="date"
                    date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
                    profile_picture: null, // Không lấy file cũ
                });
                setCurrentAvatarUrl(profile.profile_picture_url); // Lưu URL ảnh hiện tại
            } catch (err) {
                console.error("Error fetching profile for edit:", err);
                setError({ general: "Không thể tải thông tin hiện tại." });
                 if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                     navigate('/login'); // Redirect nếu không xác thực
                 }
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi của field khi user bắt đầu nhập lại
        if (error[name]) {
             setError(prev => ({...prev, [name]: null}));
        }
         if (error.general) {
              setError(prev => ({...prev, general: null}));
         }
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, profile_picture: e.target.files[0] }));
        // Hiển thị preview ảnh mới (tùy chọn)
        if (e.target.files[0]) {
             setCurrentAvatarUrl(URL.createObjectURL(e.target.files[0]));
        }
         if (error.profile_picture) {
              setError(prev => ({...prev, profile_picture: null}));
         }
          if (error.general) {
              setError(prev => ({...prev, general: null}));
         }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError({});
        setSuccessMessage('');
        setSaving(true);

        // Tạo FormData vì có thể có file ảnh
        const dataToSubmit = new FormData();
        // Chỉ thêm các field có giá trị và khác giá trị ban đầu (tùy chọn tối ưu)
        // Hoặc đơn giản là thêm tất cả các field user có thể sửa
        dataToSubmit.append('username', formData.username);
        dataToSubmit.append('email', formData.email);
        // Backend cần xử lý date_of_birth là string YYYY-MM-DD hoặc null/''
        if(formData.date_of_birth) {
            dataToSubmit.append('date_of_birth', formData.date_of_birth);
        } else {
             // Gửi giá trị rỗng để backend biết là xóa ngày sinh
             // Hoặc không append nếu backend hiểu là không thay đổi
             // dataToSubmit.append('date_of_birth', ''); // Tùy cách backend xử lý null
        }

        if (formData.profile_picture) {
            dataToSubmit.append('profile_picture', formData.profile_picture);
        }

        console.log("Submitting profile update data:", Object.fromEntries(dataToSubmit)); // Log FormData

        try {
            const response = await updateCurrentUserProfile(dataToSubmit);
            setSuccessMessage("Cập nhật thông tin thành công!");
            // Cập nhật lại thông tin user trong localStorage nếu cần
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            // Có thể điều hướng về trang profile sau 1-2 giây
            setTimeout(() => navigate('/profile'), 1500);

        } catch (err) {
            console.error("Error updating profile:", err.response || err.message);
             if (err.response && err.response.data) {
                 if (typeof err.response.data === 'object' && err.response.data !== null) {
                     const backendErrors = {};
                     for (const key in err.response.data) {
                         if (Array.isArray(err.response.data[key])) {
                             backendErrors[key] = err.response.data[key].join(' ');
                         } else { backendErrors.general = err.response.data[key]; }
                     }
                     if(err.response.data.detail) backendErrors.general = err.response.data.detail;
                     if(err.response.data.error) backendErrors.general = err.response.data.error;
                     setError(backendErrors);
                 } else { setError({ general: 'Cập nhật thất bại. Vui lòng thử lại.' }); }
            } else { setError({ general: 'Lỗi mạng hoặc lỗi không xác định.' }); }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.loading}>Đang tải...</div>;
    if (error.general && !userData) return <div className={styles.error}>{error.general}</div>; // Lỗi không tải được data ban đầu

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.editCard}>
                <h1 className={styles.cardTitle}>Edit Your Profile</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Hiển thị lỗi chung hoặc thành công */}
                    {successMessage && <p className={`${styles.generalMessage} ${styles.success}`}>{successMessage}</p>}
                    {error.general && <p className={`${styles.generalMessage} ${styles.error}`}>{error.general}</p>}

                    {/* Phần Ảnh đại diện */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Profile Picture</h3>
                        <div className={styles.avatarUploadGroup}>
                            <img
                                src={currentAvatarUrl || '/default-avatar.png'}
                                alt="Avatar Preview"
                                className={styles.avatarPreview}
                                onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            <div className={styles.fileInputContainer}>
                                <input
                                    type="file"
                                    id="profile_picture"
                                    name="profile_picture"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={styles.fileInput} // Input gốc được ẩn
                                    disabled={saving}
                                />
                                <label htmlFor="profile_picture" className={styles.fileInputLabel}>
                                    <FiCamera style={{ marginRight: '8px' }} /> Change Avatar
                                </label>
                                {formData.profile_picture && <span className={styles.fileName}>{formData.profile_picture.name}</span>}
                            </div>
                        </div>
                        {error.profile_picture && <p className={styles.fieldError}>{error.profile_picture}</p>}
                    </div>

                    {/* Phần Thông tin Tài khoản */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Account Information</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="username" className={styles.label}>Username</label>
                                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} className={styles.input} disabled={saving} required />
                                {error.username && <p className={styles.fieldError}>{error.username}</p>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>Email</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} disabled={saving} required />
                                {error.email && <p className={styles.fieldError}>{error.email}</p>}
                            </div>
                        </div>
                    </div>

                     {/* Phần Thông tin Cá nhân */}
                     <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Personal Details</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="date_of_birth" className={styles.label}>Date of Birth</label>
                                <input type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={styles.input} disabled={saving} />
                                {error.date_of_birth && <p className={styles.fieldError}>{error.date_of_birth}</p>}
                            </div>
                            {/* Thêm các trường personal khác nếu có */}
                        </div>
                    </div>


                    <div className={styles.buttonGroup}>
                       <button type="button" className={styles.cancelButton} onClick={() => navigate('/profile')} disabled={saving}>
                            <FiXCircle style={{marginRight: '8px'}}/> Cancel
                        </button>
                       <button type="submit" className={styles.saveButton} disabled={saving}>
                            {saving ? 'Saving...' : <><FiSave style={{marginRight: '8px'}}/> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfilePage;