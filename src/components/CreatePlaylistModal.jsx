// src/components/modals/CreatePlaylistModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './CreatePlaylistModal.module.css'; // Hoặc bạn có thể dùng chung SongFormModal.module.css
import { FiX } from 'react-icons/fi';
import { createPlaylistApi } from '../api/apiClient'; // <<< Import hàm API
import { toast } from 'react-toastify'; // <<< Import toast

const CreatePlaylistModal = ({ isOpen, onClose, onCreateSuccess }) => {
    const [playlistName, setPlaylistName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true); // Mặc định là public
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null); // Để hiển thị lỗi từ API

    // Reset form khi modal được mở hoặc đóng
    useEffect(() => {
        if (isOpen) {
            setPlaylistName('');
            setDescription('');
            setIsPublic(true);
            setErrors({});
            setApiError(null); // Xóa lỗi API cũ khi mở modal
        }
    }, [isOpen]);

    // Client-side validation
    const validateForm = () => {
        const newErrors = {};
        if (!playlistName.trim()) {
            newErrors.playlistName = 'Playlist name is required.';
        } else if (playlistName.trim().length > 100) { // Ví dụ giới hạn độ dài
            newErrors.playlistName = 'Playlist name cannot exceed 100 characters.';
        }
        if (description.trim().length > 255) { // Ví dụ giới hạn độ dài
            newErrors.description = 'Description cannot exceed 255 characters.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // True nếu không có lỗi
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading) return; // Ngăn submit nếu đang loading hoặc form không hợp lệ

        setIsLoading(true);
        setApiError(null); // Xóa lỗi API cũ trước khi submit

        const playlistData = {
            playlist_name: playlistName.trim(),
            description: description.trim(),
            is_public: isPublic,
            songs: [], // Playlist mới ban đầu không có bài hát
            // user_id sẽ được backend tự động gán dựa trên user đang đăng nhập (thông qua token)
        };

        try {
            // Gọi API để tạo playlist
            const response = await createPlaylistApi(playlistData); // <<< Sử dụng hàm API thật

            toast.success(`Playlist "${response.data.playlist_name}" created successfully!`);
            if (onCreateSuccess) {
                onCreateSuccess(response.data); // Gọi callback để component cha xử lý (vd: fetch lại list)
            }
            onClose(); // Đóng modal sau khi thành công
        } catch (err) {
            console.error("Create playlist error:", err);
            // Cố gắng lấy thông báo lỗi cụ thể từ response API
            const errorMsg = err.response?.data?.playlist_name?.[0] || // Lỗi validation của DRF
                             err.response?.data?.detail ||
                             err.response?.data?.error ||
                             err.message ||
                             "Failed to create playlist. Please try again.";
            setApiError(errorMsg); // Hiển thị lỗi API trên modal
            toast.error(`Error: ${errorMsg}`);
        } finally {
            setIsLoading(false); // Kết thúc trạng thái loading
        }
    };

    // Không render gì nếu modal không mở
    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}>
                    <FiX />
                </button>
                <div className={styles.modalHeader}>
                    Create New Playlist
                </div>

                {/* Hiển thị lỗi API nếu có */}
                {apiError && <div className={styles.apiErrorBanner}>{apiError}</div>}

                {/* Thẻ form bao quanh modalBody và modalFooter */}
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {/* Trường Tên Playlist */}
                        <div className={styles.formGroup}>
                            <label htmlFor="playlistName" className={styles.required}>Name</label>
                            <input
                                type="text"
                                id="playlistName"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                placeholder="My Awesome Playlist"
                                disabled={isLoading}
                                required
                                autoFocus // Tự động focus vào trường này khi modal mở
                            />
                            {errors.playlistName && <span className={styles.errorMessage}>{errors.playlistName}</span>}
                        </div>

                        {/* Trường Mô tả */}
                        <div className={styles.formGroup}>
                            <label htmlFor="playlistDescription">Description (Optional)</label>
                            <textarea
                                id="playlistDescription"
                                rows="4" // Tăng số dòng
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Give your playlist a catchy description."
                                disabled={isLoading}
                            ></textarea>
                            {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
                        </div>

                        {/* Checkbox Public/Private */}
                        <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                disabled={isLoading}
                            />
                            <label htmlFor="isPublic">Public Playlist</label>
                        </div>
                    </div>

                    {/* Footer chứa nút bấm */}
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Playlist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;