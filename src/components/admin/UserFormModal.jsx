// src/components/admin/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './SongFormModal.module.css'; // Tái sử dụng CSS
import { FiX } from 'react-icons/fi';

const UserFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, apiError = null }) => {
    // --- State cho form fields ---
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Chỉ để nhập mật khẩu MỚI
    const [confirmPassword, setConfirmPassword] = useState(''); // Để xác nhận mật khẩu mới
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [existingPictureUrl, setExistingPictureUrl] = useState(null);
    const [dateOfBirth, setDateOfBirth] = useState('');
    // Thêm state cho is_staff nếu bạn muốn admin có thể quản lý quyền admin khác
    const [isActive, setIsActive ] = useState(false);
    const [errors, setErrors] = useState({});

    // --- Điền dữ liệu vào form ---
    useEffect(() => {
        if (isOpen) {
            if (initialData) { // Edit Mode
                setUsername(initialData.username || '');
                setEmail(initialData.email || '');
                setPassword(''); // KHÔNG điền mật khẩu cũ
                setConfirmPassword('');
                setProfilePictureFile(null);
                setIsActive(initialData.is_active || false);
                setExistingPictureUrl(initialData.profile_picture_url || null);
                setDateOfBirth(initialData.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : '');
                
            } else { // Add Mode
                setUsername(''); setEmail(''); setPassword(''); setConfirmPassword('');
                setProfilePictureFile(null); setExistingPictureUrl(null); setDateOfBirth('');
                setIsActive(false); // Mặc định là không active
                
            }
            setErrors({});
        }
    }, [initialData, isOpen]);

    // --- Validation ---
    const validateForm = () => {
        const newErrors = {};
        if (!username.trim()) newErrors.username = 'Username is required.';
        // Email validation cơ bản
        if (!email.trim()) {
             newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
             newErrors.email = 'Email address is invalid.';
        }
        // Password validation khi thêm mới hoặc khi nhập password mới lúc sửa
        if (!initialData && !password) { // Bắt buộc password khi thêm mới
            newErrors.password = 'Password is required for new users.';
        }
        if (password && password !== confirmPassword) { // Chỉ validate confirm nếu password được nhập
            newErrors.confirmPassword = 'Passwords do not match.';
        }
        // Thêm validation khác nếu cần
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading) return;

        const formData = new FormData(); // Dùng FormData vì có thể có ảnh
        formData.append('username', username.trim());
        formData.append('email', email.trim());
        // Chỉ gửi password nếu người dùng đã nhập vào ô password
        if (password) {
            formData.append('password', password);
        }
        formData.append('is_active', isActive); // Chỉ gửi nếu có thay đổi
        if (dateOfBirth) formData.append('date_of_birth', dateOfBirth);

        if (profilePictureFile instanceof File) {
            formData.append('profile_picture', profilePictureFile, profilePictureFile.name); // Key khớp backend
        }
        // Không cần gửi gì nếu giữ ảnh cũ

        onSubmit(formData, initialData?._id);
    };

    // Handler cho input file ảnh
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file && file instanceof File) {
            setProfilePictureFile(file);
            setExistingPictureUrl(null);
            setErrors(prev => ({ ...prev, profilePicture: undefined }));
        } else {
            setProfilePictureFile(null);
            if (initialData) setExistingPictureUrl(initialData.profile_picture_url || null);
        }
    };

    // --- Render ---
    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}><FiX /></button>
                <div className={styles.modalHeader}>
                    {initialData ? 'Edit User' : 'Add New User'}
                </div>
                {apiError && <div className={styles.apiErrorBanner}>Error: {apiError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                             {/* Username */}
                             <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.required}>Username</label>
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} required />
                                {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                            </div>

                             {/* Email */}
                             <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.required}>Email</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required />
                                {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                            </div>

                            {/* Password */}
                            <div className={styles.formGroup}>
                                {/* Label thay đổi tùy theo ngữ cảnh Add/Edit */}
                                <label htmlFor="password">{initialData ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required={!initialData} />
                                {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                            </div>

                            {/* Confirm Password (chỉ hiển thị nếu đang nhập password mới) */}
                            {password && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} required />
                                    {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                                </div>
                            )}

                            {/* Date of Birth */}
                             <div className={styles.formGroup}>
                                <label htmlFor="dateOfBirth">Date of Birth</label>
                                <input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isLoading}/>
                            </div>

                            {/* Profile Picture */}
                            <div className={styles.formGroup}>
                                <label htmlFor="profilePictureFile">Profile Picture</label>
                                {initialData && existingPictureUrl && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <img src={existingPictureUrl} alt="Current Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}/>
                                    </div>
                                )}
                                <input type="file" id="profilePictureFile" onChange={handleFileChange} disabled={isLoading} accept="image/*" />
                                {profilePictureFile && <span className={styles.fileNameDisplay}>New: {profilePictureFile.name}</span>}
                                {errors.profilePicture && <span className={styles.errorMessage}>{errors.profilePicture}</span>}
                            </div>

                            {/* Is Staff Checkbox (Ví dụ) */}
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <div className={styles.checkboxGroup}>
                                     <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isLoading}/>
                                     <label htmlFor="isActive">Is Active?</label>
                                </div>
                           </div>

                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancel</button>
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;