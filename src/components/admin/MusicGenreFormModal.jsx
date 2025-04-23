// src/components/admin/MusicGenreFormModal.jsx // <<< Đổi tên file
import React, { useState, useEffect } from 'react';
import styles from './SongFormModal.module.css'; // Vẫn có thể tái sử dụng CSS này
import { FiX } from 'react-icons/fi';

// Đổi tên component và props cho rõ ràng
const MusicGenreFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, apiError = null }) => {
    const [musicGenreName, setMusicGenreName] = useState(''); // <<< Đổi tên state
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setMusicGenreName(initialData.musicgenre_name || ''); // <<< Sử dụng đúng tên trường
            } else {
                setMusicGenreName('');
            }
            setErrors({});
        }
    }, [initialData, isOpen]);

    const validateForm = () => {
        const newErrors = {};
        if (!musicGenreName.trim()) {
            newErrors.musicGenreName = 'Genre name is required.'; // <<< Cập nhật thông báo lỗi
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading) return;

        const formData = {
            musicgenre_name: musicGenreName.trim() // <<< Gửi đúng tên trường
        };
        onSubmit(formData, initialData?._id);
    };

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}><FiX /></button>
                <div className={styles.modalHeader}>
                    {initialData ? 'Edit Music Genre' : 'Add New Music Genre'} {/* <<< Đổi tiêu đề */}
                </div>
                {apiError && <div className={styles.apiErrorBanner}>Error: {apiError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                            <label htmlFor="musicGenreName" className={styles.required}>Genre Name</label>
                            <input
                                type="text"
                                id="musicGenreName" // <<< Đổi id
                                value={musicGenreName}
                                onChange={(e) => setMusicGenreName(e.target.value)}
                                disabled={isLoading}
                                required
                                autoFocus
                            />
                            {errors.musicGenreName && <span className={styles.errorMessage}>{errors.musicGenreName}</span>}
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancel</button>
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Genre')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Đổi tên export
export default MusicGenreFormModal;