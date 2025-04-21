// src/pages/admin/ManageSongs.jsx
import React, { useState, useEffect, useCallback } from 'react';
// --- Import API Functions ---
import { getSongs, addSong, updateSong, deleteSong } from '../../api/apiClient';
// -------------------------
import DataTable from '../../components/admin/DataTable.jsx';
import SongFormModal from '../../components/admin/SongFormModal.jsx'; // Giả sử đã tạo
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx'; // Giả sử đã tạo
import styles from './AdminPages.module.css';
import { FiClock } from 'react-icons/fi'; // Icon cho duration
import { Link } from 'react-router-dom'; // Cho link Album/Artist
import { toast } from 'react-toastify'; // <<< Import toast

// Helper function để định dạng thời lượng (giây -> MM:SS)
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const ManageSongs = () => {
    // --- State ---
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [songToDelete, setSongToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading cho form
    const [isDeleting, setIsDeleting] = useState(false); // Loading cho delete

    // --- Data Fetching ---
    const fetchSongs = useCallback(async () => {
        // Giữ loading=true nếu chưa có dữ liệu, không set lại nếu đang refresh
        if (songs.length === 0) setLoading(true);
        setError(null);
        try {
            const response = await getSongs();
            setSongs(response.data || []);
        } catch (err) {
            setError("Failed to load songs. Please check the API connection.");
            console.error("Fetch songs error:", err);
        } finally {
            setLoading(false); // Luôn set false sau khi fetch xong
        }
    }, [songs.length]); // Chỉ set loading=true lần đầu

    useEffect(() => {
        fetchSongs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy fetchSongs khi component mount

    // --- Modal Handlers ---
    const openAddModal = () => {
        setEditingSong(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (song) => {
        setEditingSong(song);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingSong(null);
        setError(null); // Xóa lỗi form khi đóng
    };

    const openConfirmModal = (songId, song) => {
        setSongToDelete({ id: songId, name: song?.song_name || 'this song' });
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setSongToDelete(null);
    };

    // --- API Action Handlers ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            
            if (editingSong) {
                await updateSong(editingSong._id, formData); // Gọi API update
                toast.success("Song updated successfully!"); // <<< Thông báo thành công
                // TODO: Hiển thị thông báo thành công
            } else {
                 await addSong(formData); // Gọi API add
                 toast.success("Song added successfully!"); // <<< Thông báo thành công
                 // TODO: Hiển thị thông báo thành công
            }
            closeFormModal();
            fetchSongs(); // Tải lại danh sách
        } catch (err) {
             console.error("Save song error:", err);
             // Cố gắng hiển thị lỗi từ backend nếu có
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to save song.";
             toast.error(`Error: ${apiError}`); // <<< Thông báo lỗi
             setError(apiError); // Set lỗi chung
             // Không đóng modal khi lỗi
        } finally {
            setIsSubmitting(false);
        }
    };

     const confirmDelete = async () => {
        if (!songToDelete) return;
        setIsDeleting(true);
        setError(null);
         try {
             await deleteSong(songToDelete.id); // Gọi API Delete
             toast.success(`Song "${songToDelete.name}" deleted successfully!`); // <<< Thông báo thành công
             closeConfirmModal();
             fetchSongs(); // Tải lại danh sách
             // TODO: Hiển thị thông báo thành công
         } catch (err) {
             console.error("Delete song error:", err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to delete song.";
             toast.error(`Error deleting song: ${apiError}`); // <<< Thông báo lỗi
             setError(apiError); // Set lỗi chung
             // TODO: Hiển thị thông báo lỗi
             closeConfirmModal(); // Đóng modal ngay cả khi lỗi
         } finally {
             setIsDeleting(false);
         }
     };


    // --- Định nghĩa cột cho DataTable ---
    const columns = [
        {
            key: '_index', header: '#', width: '5%',
            render: (row, index) => <div style={{textAlign: 'left', paddingRight: '16px'}}>{index + 1}</div>
        },
        {
            key: 'song_name', header: 'Name', width: '35%',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={row.album?.image_url || '/default-album-art.png'} alt="" style={{ width: '32px', height: '32px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.src = '/default-album-art.png'; }} />
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#333', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {row.song_name || 'N/A'} </div>
                        <div style={{ fontSize: '0.8rem', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {row.artists?.map(a => a.artist_name).join(', ') || 'N/A'} </div>
                    </div>
                </div>
            )
        },
        {
            key: 'album.album_name', header: 'Album', width: '30%',
            render: (row) => row.album ? (
                <Link to={`/admin/albums?edit=${row.album._id}`} style={{ color: '#1890ff', textDecoration: 'none' }}> {/* Ví dụ link sửa album */}
                    {row.album.album_name || '-'}
                 </Link>
                 ) : ('-')
        },
        {
            key: 'duration_song', header: 'Duration', width: '10%',
            render: (row) => <div style={{textAlign: 'left'}}>{formatDuration(row.duration_song)}</div>,
        },
        { key: 'status', header: 'Status', width: '10%' },
    ];

    // --- Render Component ---
    if (loading && songs.length === 0) {
        return <div className={styles.message}>Loading songs...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Songs</h1>
                <button
                    onClick={openAddModal}
                    className={styles.addButton}
                    disabled={isSubmitting || isDeleting} // Disable khi đang xử lý API
                >
                    Add New Song
                </button>
            </div>

            

            {/* Có thể thêm indicator loading nhỏ khi refresh */}
            {loading && songs.length > 0 && <div className={styles.message}>Refreshing...</div>}

            <DataTable
                columns={columns}
                data={songs}
                onEdit={openEditModal}
                onDelete={openConfirmModal} // Truyền hàm mở confirm modal
                idKey="_id"
            />

            {/* --- Render Modals --- */}
            {isFormModalOpen && ( // Render có điều kiện
                 <SongFormModal
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingSong}
                   isLoading={isSubmitting} // Truyền trạng thái loading
                   apiError={error} // Truyền lỗi API vào modal để hiển thị nếu cần
                 />
            )}

            {isConfirmModalOpen && ( // Render có điều kiện
                 <ConfirmationModal
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete <strong>${songToDelete?.name || ''}</strong>? This action cannot be undone.`}
                   isLoading={isDeleting} // Truyền trạng thái loading
                 />
            )}
        </div>
    );
};

export default ManageSongs;