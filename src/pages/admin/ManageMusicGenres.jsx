// src/pages/admin/ManageMusicGenres.jsx // <<< Đổi tên file
import React, { useState, useEffect, useCallback } from 'react';
// --- Import các hàm API đã đổi tên ---
import { getMusicGenres, addMusicGenre, updateMusicGenre, deleteMusicGenre } from '../../api/apiClient';
// --------------------------------------
import DataTable from '../../components/admin/DataTable.jsx';
import MusicGenreFormModal from '../../components/admin/MusicGenreFormModal.jsx'; // <<< Import form đã đổi tên
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx';
import styles from './AdminPages.module.css';
import { toast } from 'react-toastify';

// Đổi tên component
const ManageMusicGenres = () => {
    // --- State ---
    const [musicGenres, setMusicGenres] = useState([]); // <<< Đổi tên state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGenre, setEditingGenre] = useState(null); // Giữ editingGenre để truyền vào modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [genreToDelete, setGenreToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Data Fetching ---
    const fetchMusicGenres = useCallback(async () => { // <<< Đổi tên hàm fetch
        if (musicGenres.length === 0) setLoading(true); setError(null);
        try {
            const response = await getMusicGenres(); // <<< Gọi hàm API đã đổi tên
            console.log("Fetched music genres:", response.data); // Debug log
            setMusicGenres(response.data || []); // <<< Cập nhật state đã đổi tên
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load music genres.";
            setError(apiError); toast.error(apiError);
            console.error("Fetch music genres error:", err);
        } finally { setLoading(false); }
    }, [musicGenres.length]); // <<< Dependency đã đổi tên

    useEffect(() => { fetchMusicGenres(); }, [fetchMusicGenres]); // <<< Gọi hàm fetch đã đổi tên

    // --- Modal Handlers ---
    const openAddModal = () => { setEditingGenre(null); setIsFormModalOpen(true); };
    const openEditModal = (genre) => { setEditingGenre(genre); setIsFormModalOpen(true); };
    const closeFormModal = () => { setIsFormModalOpen(false); setEditingGenre(null); setError(null); };
    // Sử dụng musicgenre_name khi mở confirm modal
    const openConfirmModal = (genreId, genre) => { setGenreToDelete({ id: genreId, name: genre?.musicgenre_name || 'this genre' }); setIsConfirmModalOpen(true); };
    const closeConfirmModal = () => { setIsConfirmModalOpen(false); setGenreToDelete(null); };

    // --- API Action Handlers ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true); setError(null);
        const action = editingGenre ? 'updated' : 'added';
        try {
            if (editingGenre) {
                await updateMusicGenre(editingGenre._id, formData); // <<< Gọi API đã đổi tên
            } else {
                 await addMusicGenre(formData); // <<< Gọi API đã đổi tên
            }
            toast.success(`Music Genre ${action} successfully!`); // <<< Cập nhật thông báo
            closeFormModal();
            fetchMusicGenres(); // <<< Gọi hàm fetch đã đổi tên
        } catch (err) {
             console.error(`Save music genre error (${action}):`, err);
             const apiError = err.response?.data?.musicgenre_name?.[0] || err.response?.data?.detail || err.response?.data?.error || err.message || `Failed to ${action} music genre.`;
             toast.error(`Error: ${apiError}`);
             setError(apiError);
        } finally { setIsSubmitting(false); }
    };

     const confirmDelete = async () => {
        if (!genreToDelete) return;
        setIsDeleting(true); setError(null);
         try {
             await deleteMusicGenre(genreToDelete.id); // <<< Gọi API đã đổi tên
             toast.success(`Music Genre "${genreToDelete.name}" deleted successfully!`); // <<< Cập nhật thông báo
             closeConfirmModal();
             fetchMusicGenres(); // <<< Gọi hàm fetch đã đổi tên
         } catch (err) {
             console.error("Delete music genre error:", err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to delete music genre.";
             toast.error(`Error deleting music genre: ${apiError}`);
             setError(apiError);
             closeConfirmModal();
         } finally { setIsDeleting(false); }
     };

    // --- Định nghĩa cột cho DataTable ---
    const columns = [
         { key: '_index', header: '#', width: '10%', render: (row, index) => <div style={{textAlign: 'left', paddingRight: '16px'}}>{index + 1}</div> },
         // Sử dụng đúng tên trường từ API
         { key: 'musicgenre_name', header: 'Genre Name', width: '75%' },
    ];

    // --- Render ---
    if (loading && musicGenres.length === 0) return <div className={styles.message}>Loading Music Genres...</div>;
    if (error && !loading && musicGenres.length === 0 && !isFormModalOpen && !isConfirmModalOpen) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Music Genres</h1> {/* <<< Đổi tiêu đề trang */}
                <button onClick={openAddModal} className={styles.addButton} disabled={isSubmitting || isDeleting}>
                    Add New Genre
                </button>
            </div>

             {loading && musicGenres.length > 0 && <div className={styles.message}>Refreshing...</div>}

            <DataTable
                columns={columns}
                data={musicGenres} // <<< Sử dụng state đã đổi tên
                onEdit={openEditModal}
                onDelete={openConfirmModal}
                idKey="_id"
            />

            {/* --- Render Modals --- */}
            {isFormModalOpen && (
                 <MusicGenreFormModal // <<< Sử dụng component form đã đổi tên
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingGenre} // Truyền dữ liệu genre cần sửa
                   isLoading={isSubmitting}
                   apiError={error}
                 />
            )}

            {isConfirmModalOpen && (
                 <ConfirmationModal
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete genre <strong>${genreToDelete?.name || ''}</strong>?`}
                   isLoading={isDeleting}
                 />
            )}
        </div>
    );
};

// Đổi tên export
export default ManageMusicGenres;