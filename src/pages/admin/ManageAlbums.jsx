// src/pages/admin/ManageAlbums.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link nếu cần link trong bảng
import { getAlbums, addAlbum, updateAlbum, deleteAlbum } from '../../api/apiClient'; // Import API functions cho Album
import DataTable from '../../components/admin/DataTable.jsx'; // Component bảng
import AlbumFormModal from '../../components/admin/AlbumFormModal.jsx'; // Component form modal cho Album
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx'; // Component modal xác nhận
import styles from './AdminPages.module.css'; // CSS chung cho các trang admin
import { toast } from 'react-toastify'; // Import toast để thông báo

// Component hiển thị ảnh bìa nhỏ (có thể dùng chung hoặc định nghĩa lại)
const AlbumCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]); // Reset lỗi khi src thay đổi

    return (
        <div style={{ width: '40px', height: '40px', flexShrink: 0, backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!imgError && src ? (
                <img
                    src={src}
                    alt={alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgError(true)} // Set lỗi nếu không tải được ảnh
                />
            ) : (
                 // Placeholder đơn giản nếu không có ảnh hoặc lỗi
                 <div style={{width: '100%', height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color: '#aaa', fontSize: '0.8rem'}}>?</div>
            )}
        </div>
    );
};

const ManageAlbums = () => {
    // --- State quản lý dữ liệu và UI ---
    const [albums, setAlbums] = useState([]); // Danh sách albums
    const [loading, setLoading] = useState(true); // Trạng thái tải trang ban đầu
    const [error, setError] = useState(null); // Lỗi fetch hoặc lỗi chung
    const [isFormModalOpen, setIsFormModalOpen] = useState(false); // Trạng thái mở/đóng modal form
    const [editingAlbum, setEditingAlbum] = useState(null); // Dữ liệu album đang sửa (null = chế độ thêm mới)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Trạng thái mở/đóng modal xác nhận xóa
    const [albumToDelete, setAlbumToDelete] = useState(null); // Thông tin album chuẩn bị xóa
    const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái loading khi submit form
    const [isDeleting, setIsDeleting] = useState(false); // Trạng thái loading khi xác nhận xóa

    // --- Hàm Fetch dữ liệu Albums ---
    const fetchAlbums = useCallback(async () => {
        // Chỉ set loading=true khi fetch lần đầu (chưa có dữ liệu)
        if (albums.length === 0) setLoading(true);
        setError(null); // Xóa lỗi cũ trước khi fetch
        try {
            // API getAlbums cần trả về dữ liệu artist lồng nhau
            const response = await getAlbums(/* Có thể thêm params phân trang */);
            setAlbums(response.data || []); // Cập nhật state albums
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load albums.";
            setError(apiError); // Set lỗi để có thể hiển thị nếu cần
            toast.error(apiError); // Thông báo lỗi fetch bằng toast
            console.error("Fetch albums error:", err);
        } finally {
            setLoading(false); // Kết thúc trạng thái loading
        }
    }, [albums.length]); // Dependency array chỉ chứa albums.length để chỉ set loading lần đầu

    // Gọi fetchAlbums khi component được mount
    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]); // fetchAlbums là dependency theo quy tắc của React Hooks

    // --- Các hàm xử lý mở/đóng Modals ---
    const openAddModal = () => {
        setEditingAlbum(null); // Đảm bảo form ở chế độ thêm mới
        setIsFormModalOpen(true); // Mở modal form
    };

    const openEditModal = (album) => {
        setEditingAlbum(album); // Đặt dữ liệu album cần sửa
        setIsFormModalOpen(true); // Mở modal form
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false); // Đóng modal form
        setEditingAlbum(null); // Reset trạng thái sửa
        setError(null); // Xóa lỗi hiển thị (nếu có)
    };

    const openConfirmModal = (albumId, album) => {
        // Lưu lại thông tin album cần xóa để hiển thị và xử lý
        setAlbumToDelete({ id: albumId, name: album?.album_name || 'this album' });
        setIsConfirmModalOpen(true); // Mở modal xác nhận
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false); // Đóng modal xác nhận
        setAlbumToDelete(null); // Reset trạng thái xóa
    };

    // --- Các hàm xử lý thao tác API (Submit Form, Confirm Delete) ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true); // Bắt đầu trạng thái submit
        setError(null); // Xóa lỗi cũ
        const action = editingAlbum ? 'updated' : 'added'; // Xác định hành động để thông báo
        try {
            if (editingAlbum) {
                await updateAlbum(editingAlbum._id, formData); // Gọi API cập nhật
            } else {
                 await addAlbum(formData); // Gọi API thêm mới
            }
            toast.success(`Album ${action} successfully!`); // Hiển thị toast thành công
            closeFormModal(); // Đóng form modal
            fetchAlbums(); // Tải lại danh sách albums
        } catch (err) {
             console.error(`Save album error (${action}):`, err);
             // Lấy thông báo lỗi chi tiết từ API hoặc dùng lỗi mặc định
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.response?.data || err.message || `Failed to ${action} album.`;
             toast.error(`Error: ${typeof apiError === 'object' ? JSON.stringify(apiError) : apiError}`); // Hiển thị toast lỗi
             // setError(typeof apiError === 'object' ? JSON.stringify(apiError) : apiError); // Có thể set lỗi để hiển thị trong form nếu muốn
        } finally {
            setIsSubmitting(false); // Kết thúc trạng thái submit
        }
    };

     const confirmDelete = async () => {
        if (!albumToDelete) return; // Không làm gì nếu không có album để xóa
        setIsDeleting(true); // Bắt đầu trạng thái xóa
        setError(null);
         try {
             await deleteAlbum(albumToDelete.id); // Gọi API xóa
             toast.success(`Album "${albumToDelete.name}" deleted successfully!`); // Hiển thị toast thành công
             closeConfirmModal(); // Đóng modal xác nhận
             fetchAlbums(); // Tải lại danh sách albums
         } catch (err) {
             console.error("Delete album error:", err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to delete album.";
             toast.error(`Error deleting album: ${apiError}`); // Hiển thị toast lỗi
             // setError(apiError); // Set lỗi chung nếu cần
             closeConfirmModal(); // Vẫn đóng modal khi có lỗi
         } finally {
             setIsDeleting(false); // Kết thúc trạng thái xóa
         }
     };


    // --- Định nghĩa các cột cho DataTable ---
    const columns = [
         {
             key: '_index', header: '#', width: '5%',
             render: (row, index) => <div style={{textAlign: 'right', paddingRight: '16px'}}>{index + 1}</div>
         },
         {
            key: 'album_name', header: 'Title', width: '40%',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlbumCoverDisplay src={row.image_url} alt={row.album_name} />
                    <div style={{ overflow: 'hidden' }}>
                        <div className={styles.albumName}> {row.album_name || 'N/A'} </div>
                        <div className={styles.albumMetaArtist}> {row.artist?.artist_name || 'N/A'} </div>
                    </div>
                </div>
            )
        },
        {
            key: 'artist.artist_name', header: 'Album Artist', width: '30%',
             render: (row) => row.artist ? (
                 // Link đến trang quản lý artist (ví dụ)
                 <Link to={`/admin/artists?edit=${row.artist._id}`} className={styles.link}>
                     {row.artist.artist_name || '-'}
                 </Link>
             ) : ('-')
        },
        {
            key: 'release_year', header: 'Year', width: '10%',
             render: (row) => row.release_time ? new Date(row.release_time).getFullYear() : '-'
        },
         {
            key: 'number_of_songs', header: 'Tracks', width: '10%',
             render: (row) => <div style={{textAlign: 'left'}}>{row.number_of_songs || 0}</div>
        },
    ];

    // --- Render Component ---
    // Hiển thị loading ban đầu
    if (loading && albums.length === 0) {
        return <div className={styles.message}>Loading albums...</div>;
    }
    // Hiển thị lỗi fetch ban đầu (nếu không có modal nào đang mở)
    if (error && !loading && albums.length === 0 && !isFormModalOpen && !isConfirmModalOpen) {
         return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.pageContainer}>
            {/* Header của trang */}
            <div className={styles.pageHeader}>
                <h1>Manage Albums</h1>
                <button
                    onClick={openAddModal}
                    className={styles.addButton}
                    disabled={isSubmitting || isDeleting} // Disable nút khi đang có thao tác API
                >
                    Add New Album
                </button>
            </div>

             {/* Có thể hiển thị lỗi API chung ở đây nếu không muốn toast che */}
             {/* {error && !isFormModalOpen && !isConfirmModalOpen && <div className={styles.error} style={{ marginBottom: '16px' }}>{error}</div>} */}

             {/* Indicator loading nhỏ khi refresh */}
             {loading && albums.length > 0 && <div className={styles.message}>Refreshing...</div>}

            {/* Bảng dữ liệu */}
            <DataTable
                columns={columns}
                data={albums}
                onEdit={openEditModal} // Truyền hàm mở form edit
                onDelete={openConfirmModal} // Truyền hàm mở confirm delete
                idKey="_id"             // Key định danh duy nhất
            />

            {/* --- Render Modals --- */}
            {/* Modal Form Thêm/Sửa Album */}
            {isFormModalOpen && (
                 <AlbumFormModal
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingAlbum}
                   isLoading={isSubmitting} // Truyền trạng thái loading của form
                   apiError={error} // Truyền lỗi API để hiển thị trong form nếu cần
                 />
            )}

            {/* Modal Xác nhận Xóa */}
            {isConfirmModalOpen && (
                 <ConfirmationModal
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete album <strong>${albumToDelete?.name || ''}</strong>? This might affect associated songs.`}
                   isLoading={isDeleting} // Truyền trạng thái loading của việc xóa
                 />
            )}
        </div>
    );
};

export default ManageAlbums;