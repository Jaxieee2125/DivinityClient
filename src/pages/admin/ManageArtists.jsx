// src/pages/admin/ManageArtists.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getArtists, addArtist, updateArtist, deleteArtist, getGenreOptions } from '../../api/apiClient'; // Import API functions
import DataTable from '../../components/admin/DataTable.jsx';
import ArtistFormModal from '../../components/admin/ArtistFormModal.jsx'; // Import component thật
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx'; // Import component thật
import styles from './AdminPages.module.css';
import { FiUsers } from 'react-icons/fi'; // Icon cho placeholder avatar
import { toast } from 'react-toastify'; // <<< Import react-toastify

// Component Avatar (Có thể tách ra file riêng)
const ArtistAvatarDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]); // Reset lỗi khi src thay đổi
    return (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {!imgError && src ? (
                <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
                <FiUsers size={18} style={{ color: '#aaa' }} /> // Icon người dùng thay cho sao
            )}
        </div>
    );
};

const ManageArtists = () => {
    // --- State ---
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true); // Loading cho cả bảng
    const [error, setError] = useState(null); // Lưu lỗi chung (có thể không cần nếu toast đủ)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingArtist, setEditingArtist] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [artistToDelete, setArtistToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading cho form
    const [isDeleting, setIsDeleting] = useState(false); // Loading cho delete

    // --- Data Fetching ---
    const fetchArtists = useCallback(async () => {
        // Giữ loading=true nếu chưa có dữ liệu
        if (artists.length === 0) setLoading(true);
        setError(null); // Xóa lỗi cũ khi fetch lại
        try {
            const response = await getArtists();
            setArtists(response.data || []);
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load artists.";
            setError(apiError); // Set lỗi nếu fetch thất bại
            toast.error(apiError); // Thông báo lỗi fetch bằng toast
            console.error("Fetch artists error:", err);
        } finally {
            setLoading(false);
        }
    }, [artists.length]); // Chỉ phụ thuộc vào artists.length để set loading lần đầu

    useEffect(() => {
        fetchArtists();
    }, [fetchArtists]);

    // --- Modal Handlers (Giữ nguyên) ---
    const openAddModal = () => { setEditingArtist(null); setIsFormModalOpen(true); };
    const openEditModal = (artist) => { setEditingArtist(artist); setIsFormModalOpen(true); };
    const closeFormModal = () => { setIsFormModalOpen(false); setEditingArtist(null); setError(null); }; // Reset error khi đóng form
    const openConfirmModal = (artistId, artist) => { setArtistToDelete({ id: artistId, name: artist?.artist_name || 'this artist' }); setIsConfirmModalOpen(true); };
    const closeConfirmModal = () => { setIsConfirmModalOpen(false); setArtistToDelete(null); };

    // --- API Action Handlers ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);
        setError(null); // Xóa lỗi hiển thị chung trước khi submit
        const action = editingArtist ? 'updated' : 'added'; // Để dùng trong thông báo
        try {
            if (editingArtist) {
                await updateArtist(editingArtist._id, formData);
            } else {
                 await addArtist(formData);
            }
            toast.success(`Artist ${action} successfully!`); // <<< Thông báo thành công
            closeFormModal();
            fetchArtists(); // Tải lại danh sách
        } catch (err) {
             console.error(`Save artist error (${action}):`, err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.response?.data || err.message || `Failed to ${action} artist.`;
             toast.error(`Error: ${typeof apiError === 'object' ? JSON.stringify(apiError) : apiError}`); // <<< Thông báo lỗi
             // Không cần setError ở đây nữa nếu lỗi đã hiển thị qua toast
             // setError(typeof apiError === 'object' ? JSON.stringify(apiError) : apiError);
        } finally {
            setIsSubmitting(false);
        }
    };

     const confirmDelete = async () => {
        if (!artistToDelete) return;
        setIsDeleting(true);
        setError(null);
         try {
             await deleteArtist(artistToDelete.id);
             toast.success(`Artist "${artistToDelete.name}" deleted successfully!`); // <<< Thông báo thành công
             closeConfirmModal();
             fetchArtists();
         } catch (err) {
             console.error("Delete artist error:", err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to delete artist.";
             toast.error(`Error deleting artist: ${apiError}`); // <<< Thông báo lỗi
             // setError(apiError); // Có thể không cần set lỗi chung nữa
             closeConfirmModal();
         } finally {
             setIsDeleting(false);
         }
     };

    // --- Định nghĩa cột cho DataTable ---
    const columns = [
         { key: '_index', header: '#', width: '5%', render: (row, index) => <div style={{textAlign: 'right', paddingRight: '16px'}}>{index + 1}</div> },
         {
            key: 'artist_name', header: 'Name', width: '40%',
            render: (row) => ( <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> <ArtistAvatarDisplay src={row.artist_avatar_url} alt={row.artist_name} /> <span style={{ color: '#333', fontWeight: '500' }}> {row.artist_name || 'N/A'} </span> </div> )
        },
        { key: 'national', header: 'Nationality', width: '20%', render: (row) => row.national || '-' },
        { key: 'number_of_songs', header: 'Songs', width: '10%', render: (row) => row.number_of_songs || 0 },
        { key: 'number_of_plays', header: 'Plays', width: '10%', render: (row) => row.number_of_plays || 0 },
    ];

    // --- Render ---
    if (loading && artists.length === 0) {
        return <div className={styles.message}>Loading artists...</div>;
    }
    // Chỉ hiển thị lỗi fetch ban đầu nếu không mở modal
    if (error && !loading && artists.length === 0 && !isFormModalOpen && !isConfirmModalOpen) {
         return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Artists</h1>
                <button onClick={openAddModal} className={styles.addButton} disabled={isSubmitting || isDeleting}>
                    Add New Artist
                </button>
            </div>

             {/* Có thể hiển thị loading refresh một cách tinh tế hơn */}
             {/* {loading && artists.length > 0 && <div className={styles.message}>Refreshing...</div>} */}

            <DataTable
                columns={columns}
                data={artists}
                onEdit={openEditModal}
                onDelete={openConfirmModal} // Sửa lại: Truyền hàm mở modal confirm
                idKey="_id"
            />

            {/* --- Render Modals --- */}
            {isFormModalOpen && (
                 <ArtistFormModal // <<< Component thật
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingArtist}
                   isLoading={isSubmitting}
                   // Không cần truyền apiError vào form nếu dùng toast
                 />
            )}

            {isConfirmModalOpen && (
                 <ConfirmationModal // <<< Component thật
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete <strong>${artistToDelete?.name || ''}</strong>?`}
                   isLoading={isDeleting}
                 />
            )}
        </div>
    );
};

export default ManageArtists;