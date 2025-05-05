// src/pages/admin/ManageSongs.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSongs, addSong, updateSong, deleteSong } from '../../api/apiClient'; // Import API functions
import DataTable from '../../components/admin/DataTable.jsx'; // Component bảng
import SongFormModal from '../../components/admin/SongFormModal.jsx'; // Component modal form
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx'; // Component modal xác nhận
import Pagination from '../../components/admin/Pagination.jsx'; // Component phân trang
import SearchInput from '../../components/admin/SearchInput.jsx'; // Component ô tìm kiếm
import styles from './AdminPages.module.css'; // CSS chung
import { toast } from 'react-toastify'; // Toast thông báo
import { FiClock, FiUsers } from 'react-icons/fi'; // Icons

// Helper function để định dạng thời lượng
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Component hiển thị ảnh bìa nhỏ
const AlbumCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div style={{ width: '40px', height: '40px', flexShrink: 0, backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!imgError && src ? (
                <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
                 <div style={{width: '100%', height: '100%', display:'flex', alignItems:'center', justifyContent:'center', color: '#aaa', fontSize: '0.8rem'}}>?</div>
            )}
        </div>
    );
};


const ManageSongs = () => {
    // --- State ---
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true); // Loading ban đầu và refresh
    const [error, setError] = useState(null);
    // Modal state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [songToDelete, setSongToDelete] = useState(null);
    // API operation states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // Pagination and Search states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [limit] = useState(10); // Số lượng item mỗi trang (có thể lấy từ state nếu muốn thay đổi)
    const [searchTerm, setSearchTerm] = useState(''); // Giá trị input search
    const [currentSearch, setCurrentSearch] = useState(''); // Query đang dùng để fetch

    // --- Data Fetching ---
    const fetchSongs = useCallback(async (page = 1, search = '') => {
        setLoading(true); // Luôn set loading khi bắt đầu fetch
        setError(null);
        try {
            const params = { page, limit, search: search.trim() };
            const response = await getSongs(params);
            setSongs(response.data.results || []);
            setTotalCount(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);
            // Chỉ cập nhật currentPage nếu nó được trả về từ API và khác hiện tại
            // Điều này quan trọng nếu API tự điều chỉnh trang (vd: trang không tồn tại)
            if (response.data.current_page && response.data.current_page !== currentPage) {
                 setCurrentPage(response.data.current_page);
            } else if (page !== currentPage) { // Hoặc cập nhật nếu gọi với trang khác
                 setCurrentPage(page);
            }

        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load songs.";
            setError(apiError);
            toast.error(apiError);
            console.error("Fetch songs error:", err);
            // Reset state nếu lỗi
            setSongs([]); setTotalCount(0); setTotalPages(1); setCurrentPage(1);
        } finally {
            setLoading(false);
        }
     // limit là dependency ổn định, không cần thêm page và search vì chúng trigger việc gọi lại hàm này
    }, [limit]);

    // Fetch lần đầu
    useEffect(() => {
        fetchSongs(1, ''); // Fetch trang 1, không search
    }, [fetchSongs]);

    // --- Handlers cho Search và Pagination ---
    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Hàm này được gọi khi nhấn nút Search hoặc Enter trong SearchInput
    const executeSearch = (finalSearchTerm = searchTerm) => {
         const trimmedSearch = finalSearchTerm.trim();
         // Chỉ fetch lại nếu query thực sự thay đổi hoặc từ rỗng thành có query/ngược lại
         if (trimmedSearch !== currentSearch) {
             setCurrentSearch(trimmedSearch); // Cập nhật query đang dùng
             setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
             fetchSongs(1, trimmedSearch); // Fetch với query mới, trang 1
         }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
             setCurrentPage(newPage);
             fetchSongs(newPage, currentSearch); // Fetch trang mới với query hiện tại
        }
    };


    // --- Modal Handlers (Giữ nguyên) ---
    const openAddModal = () => { setEditingSong(null); setIsFormModalOpen(true); };
    const openEditModal = (song) => { setEditingSong(song); setIsFormModalOpen(true); };
    const closeFormModal = () => { setIsFormModalOpen(false); setEditingSong(null); setError(null); };
    const openConfirmModal = (songId, song) => { setSongToDelete({ id: songId, name: song?.song_name || 'this song' }); setIsConfirmModalOpen(true); };
    const closeConfirmModal = () => { setIsConfirmModalOpen(false); setSongToDelete(null); };

    // --- API Action Handlers ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true); setError(null);
        const action = editingSong ? 'updated' : 'added';
        const toastId = toast.loading(`Submitting song data...`); // Toast loading
        try {
            if (editingSong) {
                await updateSong(editingSong._id, formData);
            } else {
                 await addSong(formData);
            }
            toast.update(toastId, { render: `Song ${action} successfully!`, type: "success", isLoading: false, autoClose: 3000 });
            closeFormModal();
             // Fetch lại trang hiện tại (hoặc trang 1 nếu là add mới) để thấy thay đổi
            fetchSongs(editingSong ? currentPage : 1, currentSearch);
        } catch (err) {
             console.error(`Save song error (${action}):`, err);
             const apiError = err.response?.data?.detail || err.response?.data?.error || err.response?.data || err.message || `Failed to ${action} song.`;
             const errorMsg = typeof apiError === 'object' ? JSON.stringify(apiError) : apiError;
             toast.update(toastId, { render: `Error: ${errorMsg}`, type: "error", isLoading: false, autoClose: 5000 });
             setError(errorMsg); // Set lỗi để form hiển thị nếu cần
        } finally { setIsSubmitting(false); }
    };

     const confirmDelete = async () => {
        if (!songToDelete) return;
        setIsDeleting(true); setError(null);
        const toastId = toast.loading("Deleting song...");
         try {
             await deleteSong(songToDelete.id);
             toast.update(toastId, { render: `Song "${songToDelete.name}" deleted!`, type: "success", isLoading: false, autoClose: 3000 });
             closeConfirmModal();
             // Fetch lại trang hiện tại, có thể cần điều chỉnh nếu xóa item cuối cùng của trang
             fetchSongs(currentPage, currentSearch);
         } catch (err) {
             console.error("Delete song error:", err);
             const apiError = err.response?.data?.detail || err.message || "Failed to delete song.";
             toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
             setError(apiError);
             closeConfirmModal();
         } finally { setIsDeleting(false); }
     };


    // --- Định nghĩa cột cho DataTable ---
    const columns = useMemo(() => [ // Bọc trong useMemo nếu không thay đổi thường xuyên
         {
             key: '_index', header: '#', width: '5%',
             render: (row, index) => <div style={{textAlign: 'right', paddingRight: '16px'}}>{((currentPage - 1) * limit) + index + 1}</div> // Số thứ tự theo trang
        },
        {
            key: 'song_name', header: 'Name', width: '35%',
            render: (row) => ( <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> <AlbumCoverDisplay src={row.album?.image_url} alt="" /> <div style={{ overflow: 'hidden' }}> <div className={styles.tableName}> {row.song_name || 'N/A'} </div> <div className={styles.tableMeta}> {row.artists?.map(a => a.artist_name).join(', ') || 'N/A'} </div> </div> </div> )
        },
        {
            key: 'album.album_name', header: 'Album', width: '30%',
            render: (row) => row.album ? (<Link to={`/admin/albums?edit=${row.album._id}`} className={styles.tableLink}>{row.album.album_name || '-'}</Link>) : ('-')
        },
        {
            key: 'duration_song', header: 'Duration', width: '10%',
            render: (row) => <div style={{textAlign: 'right'}}>{formatDuration(row.duration_song)}</div>,
        },
        { key: 'status', header: 'Status', width: '10%' },
    ], [currentPage, limit]); // Phụ thuộc vào currentPage và limit để tính _index đúng

    // --- Render Component ---
    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Songs</h1>
                <button onClick={openAddModal} className={styles.addButton} disabled={isSubmitting || isDeleting || loading}>
                    Add New Song
                </button>
            </div>

            {/* --- Search Input --- */}
            <SearchInput
                value={searchTerm}
                onChange={handleSearchInputChange} // Chỉ cập nhật state input
                onSearch={() => executeSearch(searchTerm)} // Thực hiện search khi nhấn nút/enter
                placeholder="Search songs by name..."
                disabled={loading}
            />

            {/* Hiển thị lỗi fetch chung */}
            {error && !loading && songs.length === 0 && !isFormModalOpen && !isConfirmModalOpen && (
                <div className={styles.error} style={{ marginTop: '16px' }}>{error}</div>
            )}

            {/* Trạng thái Loading / No Data */}
            {loading && <div className={styles.message}>Loading...</div>}
            {!loading && songs.length === 0 && !error && (
                 <div className={styles.message}>No songs found{currentSearch ? ` matching "${currentSearch}"` : ''}.</div>
            )}

            {/* Bảng và Phân trang */}
            {!loading && songs.length > 0 && (
                <>
                    <DataTable
                        columns={columns}
                        data={songs}
                        onEdit={openEditModal}
                        onDelete={openConfirmModal} // Đã sửa ở lần trước
                        idKey="_id"
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        disabled={loading || isSubmitting || isDeleting}
                    />
                </>
            )}

            {/* --- Modals --- */}
            {isFormModalOpen && (
                 <SongFormModal
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingSong}
                   isLoading={isSubmitting}
                   // Không cần truyền apiError nếu dùng toast
                 />
            )}

            {isConfirmModalOpen && (
                 <ConfirmationModal
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete <strong>${songToDelete?.name || ''}</strong>?`}
                   isLoading={isDeleting}
                 />
            )}
        </div>
    );
};

// Thêm các định nghĩa CSS vào AdminPages.module.css nếu cần
// Ví dụ: .tableName, .tableMeta, .tableLink

export default ManageSongs;