// src/pages/PlaylistsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// API getPlaylists đã có, cần API lấy tracks của playlist
import { getPlaylists, /* getPlaylistTracks */ } from '../api/apiClient'; // <<< Đảm bảo đường dẫn đúng
import usePlayerStore from '../store/playerStore'; // <<< Đảm bảo đường dẫn đúng
import styles from './PlaylistsPage.module.css';
import { FiList, FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown, FiPlay, FiMusic, FiLoader } from 'react-icons/fi'; // <<< Thêm FiLoader
import { toast } from 'react-toastify'; // <<< Cần cài đặt và import nếu dùng

// --- Dữ liệu giả cho Player (Xóa khi có API thật) ---
const allSongs = [ /* ... Mảng các object bài hát giả ... */ ];
// ---------------------------------------------------

// Component hiển thị ảnh bìa Playlist
const PlaylistCoverDisplay = ({ playlist }) => {
    // ... (Code component này giữ nguyên) ...
    const [imgError, setImgError] = useState(false);
    const coverImageUrl = playlist.image_url;
    const trackPreviewImages = playlist.tracks_preview || [];

    useEffect(() => { setImgError(false); }, [coverImageUrl]);

    if (coverImageUrl && !imgError) {
        return <img src={coverImageUrl} alt={playlist.playlist_name} className={styles.playlistCover} onError={() => setImgError(true)} loading="lazy" />;
    }
    if (trackPreviewImages.length > 0) {
        return (
            <div className={styles.playlistCoverGrid}>
                {trackPreviewImages.slice(0, 4).map((imgUrl, index) => (
                    imgUrl ? <img key={index} src={imgUrl} alt="" onError={(e) => e.target.style.display='none'}/> : <div key={index}></div>
                ))}
                {trackPreviewImages.length < 4 && Array(4 - trackPreviewImages.length).fill(0).map((_,i) =>
                    (trackPreviewImages.length === 0 && i === 0) ?
                    <div key={`ph-${i}`} className={styles.placeholderIcon}><FiMusic size="50%"/></div> :
                    <div key={`ph-${i}`}></div>
                )}
            </div>
        );
    }
    return <div className={styles.playlistCoverGrid}><div className={styles.placeholderIcon}><FiList size="50%"/></div></div>;
};


const PlaylistsPage = () => {
    // --- State ---
    const [allPlaylists, setAllPlaylists] = useState([]);
    const [displayPlaylists, setDisplayPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState('playlist_name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [playingPlaylistId, setPlayingPlaylistId] = useState(null);

    const navigate = useNavigate();
    const playSong = usePlayerStore(state => state.playSong);

    // --- Data Fetching ---
    // <<< Chỉ cần MỘT lần khai báo fetchAllPlaylists >>>
    const fetchAllPlaylists = useCallback(async () => {
        console.log("Fetching playlists..."); // Thêm log
        setLoading(true);
        setError(null);
        try {
            const response = await getPlaylists();
            // Kiểm tra cấu trúc response từ API của bạn
            const fetchedPlaylists = response.data?.results || response.data || [];
            console.log("Fetched playlists:", fetchedPlaylists);
            setAllPlaylists(fetchedPlaylists);
            setTotalCount(fetchedPlaylists.length);
        } catch (err) {
            console.error("Fetch playlists error:", err.response || err);
            const apiError = err.response?.data?.detail || err.message || "Failed to load playlists.";
            setError(apiError);
            if(toast) toast.error(apiError); // Kiểm tra toast tồn tại trước khi gọi
            setAllPlaylists([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
            console.log("Finished fetching playlists.");
        }
    }, []); // <<< Đóng dependency array của useCallback

    // <<< XÓA BỎ KHAI BÁO THỪA Ở ĐÂY (Dòng 82 cũ) >>>
    // }, []); // <<<< XÓA DÒNG NÀY

    useEffect(() => {
        fetchAllPlaylists();
    }, [fetchAllPlaylists]);

    // --- useEffect Lọc/Sort ---
    useEffect(() => {
        let processedPlaylists = [...allPlaylists];
        processedPlaylists.sort((a, b) => {
            let valA, valB;
            // Sort theo ngày tạo (giả sử _id của MongoDB có timestamp)
             if (sortBy === 'recently_added') {
                 // Lấy timestamp từ ObjectId (cần backend gửi _id dạng string)
                 const timeA = a._id ? parseInt(a._id.substring(0, 8), 16) : 0;
                 const timeB = b._id ? parseInt(b._id.substring(0, 8), 16) : 0;
                 valA = timeA;
                 valB = timeB;
                 // Đảo ngược để mới nhất lên đầu nếu sortOrder là 'desc' (mặc định cho recently_added)
                 return sortOrder === 'asc' ? valA - valB : valB - valA;
             } else { // Sort theo tên hoặc trường khác
                 valA = (a[sortBy] || '').toLowerCase();
                 valB = (b[sortBy] || '').toLowerCase();
                 let comparison = valA.localeCompare(valB);
                 return sortOrder === 'desc' ? comparison * -1 : comparison;
             }
        });
        setDisplayPlaylists(processedPlaylists);
    }, [allPlaylists, sortBy, sortOrder]);

    // --- Handlers ---
    const handleSortChange = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        // Đặt mặc định sort order khi đổi trường sort
        setSortOrder(newSortBy === 'recently_added' ? 'desc' : 'asc');
    };
    const handleSortOrderToggle = () => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); };
    const handlePlaylistClick = (playlistId) => { navigate(`/playlist/${playlistId}`); };

    // <<< Chỉ cần MỘT lần khai báo handlePlayPlaylist >>>
    const handlePlayPlaylist = useCallback(async (e, playlistId, playlistName) => {
        e.stopPropagation(); // Ngăn event click chạy lên thẻ li cha
        if (playingPlaylistId === playlistId) return; // Không làm gì nếu đang load/play playlist này rồi

        setPlayingPlaylistId(playlistId); // Đánh dấu đang xử lý playlist này
        const toastId = toast?.loading(`Loading "${playlistName}"...`); // Kiểm tra toast tồn tại

        try {
            // === THAY THẾ BẰNG API THẬT ===
            // const response = await getPlaylistTracks(playlistId);
            // const fetchedTracks = response.data?.results || response.data || [];
            // ============================

            // --- Dùng dữ liệu giả để test UI ---
            console.log("Using mock tracks for playlist:", playlistId);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập thời gian chờ API
            const fetchedTracks = allSongs.filter((s, i) => i < 5 + Math.floor(Math.random() * 5));
            // ----------------------------------

            if (fetchedTracks.length > 0) {
                playSong(fetchedTracks[0], fetchedTracks, 0); // Gọi hàm từ player store
                if(toastId && toast) toast.update(toastId, { render: `Playing "${playlistName}"`, type: "success", isLoading: false, autoClose: 3000 });
            } else {
                if(toastId && toast) toast.update(toastId, { render: `Playlist "${playlistName}" is empty.`, type: "warning", isLoading: false, autoClose: 3000 });
            }
        } catch (err) {
            console.error(`Error loading tracks for playlist ${playlistId}:`, err.response || err);
            const apiError = err.response?.data?.detail || err.message || "Could not load playlist tracks.";
            if(toastId && toast) toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setPlayingPlaylistId(null); // Kết thúc xử lý
        }
    }, [playingPlaylistId, playSong]); // <<< Đóng dependency array của useCallback

    // <<< XÓA BỎ KHAI BÁO THỪA Ở ĐÂY (Dòng 126 cũ) >>>

    // --- Logic Render ---
    // <<< Các câu lệnh return này phải nằm BÊN TRONG component PlaylistsPage >>>
    if (loading) {
        return <div className={styles.message}>Loading playlists...</div>;
    }
    if (error && allPlaylists.length === 0) { // Chỉ hiện lỗi nếu không có playlist nào để hiển thị
        return <div className={`${styles.message} ${styles.error}`}>{error}</div>;
    }

    // JSX chính trả về
    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                 <div className={styles.headerIcon}><FiList /></div>
                <h1 className={styles.pageTitle}>Playlists</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                 <div className={styles.sortFilterGroup}>
                     <select className={styles.sortSelect} value={sortBy} onChange={handleSortChange} disabled={loading}>
                         <option value="playlist_name">Name</option>
                         <option value="recently_added">Recently Added</option>
                     </select>
                     <button onClick={handleSortOrderToggle} className={styles.filterButton} title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`} disabled={loading}>
                         {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                     </button>
                 </div>
                 <div className={styles.sortFilterGroup}>
                      <button className={styles.filterButton} title="Refresh" onClick={fetchAllPlaylists} disabled={loading}><FiRefreshCcw /></button>
                 </div>
            </div>

            {/* Playlist Grid */}
            {displayPlaylists.length === 0 && !loading && (
                 <div className={styles.message}>No playlists found.</div>
            )}
            {/* Hiển thị lỗi ở đây nếu có lỗi nhưng vẫn có playlist cũ */}
            {error && allPlaylists.length > 0 && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
            {displayPlaylists.length > 0 && (
                <ul className={styles.playlistGrid}>
                    {displayPlaylists.map((playlist) => (
                        <li key={playlist._id} className={styles.playlistCard} onClick={() => handlePlaylistClick(playlist._id)}>
                            <div className={styles.playlistCoverLink}>
                                <PlaylistCoverDisplay playlist={playlist} />
                                <button
                                    className={styles.playButtonOverlay}
                                    onClick={(e) => handlePlayPlaylist(e, playlist._id, playlist.playlist_name)}
                                    title={`Play ${playlist.playlist_name}`}
                                    disabled={playingPlaylistId === playlist._id} // Disable khi đang loading/playing
                                >
                                     {/* Thay đổi icon dựa trên state */}
                                     {playingPlaylistId === playlist._id ? (
                                         <FiLoader size={24} className={styles["animate-spin"]} />
                                     ) : (
                                         <FiPlay size={24} />
                                     )}
                                </button>
                            </div>
                            <div className={styles.playlistInfo}>
                                <Link to={`/playlist/${playlist._id}`} className={styles.playlistName} title={playlist.playlist_name} onClick={(e) => e.stopPropagation()}>
                                    {playlist.playlist_name || 'Untitled Playlist'}
                                </Link>
                                <div className={styles.playlistMeta}>
                                    Playlist {playlist.user?.username && `• By ${playlist.user.username}`}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

}; // <<< Đóng component PlaylistsPage ở đây

export default PlaylistsPage;