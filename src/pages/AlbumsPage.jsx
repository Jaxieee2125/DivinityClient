// src/pages/AlbumsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Import API functions
import { getAlbums, getAlbumSongs } from '../api/apiClient';
import usePlayerStore from '../store/playerStore'; // Import player store
import styles from './AlbumsPage.module.css'; // Import CSS Module cho trang này
// Import icons
import { FiDisc, FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown, FiPlay, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify'; // Import toast để thông báo

// Component hiển thị ảnh bìa nhỏ (có thể tách file riêng)
const AlbumCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]); // Reset lỗi khi src thay đổi

    return (
        <div style={{
            width: '100%',
            aspectRatio: '1 / 1', // Đảm bảo ảnh vuông
            flexShrink: 0,
            backgroundColor: '#333', // Màu nền placeholder
            borderRadius: '6px',    // Bo góc ảnh
            overflow: 'hidden',     // Giữ bo góc
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {!imgError && src ? (
                <img
                    src={src}
                    alt={alt || 'Album'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgError(true)} // Set lỗi nếu không tải được ảnh
                    loading="lazy" // Thêm lazy loading
                />
            ) : (
                 // Icon placeholder nếu không có ảnh hoặc lỗi
                 <FiDisc size={40} style={{ color: '#555' }} />
            )}
        </div>
    );
};


const AlbumsPage = () => {
    // --- State ---
    const [allAlbums, setAllAlbums] = useState([]);     // Lưu trữ TOÀN BỘ albums gốc từ API
    const [displayAlbums, setDisplayAlbums] = useState([]); // Albums đã lọc/sort để hiển thị
    const [loading, setLoading] = useState(true);      // Trạng thái loading fetch ban đầu
    const [error, setError] = useState(null);        // Lỗi fetch dữ liệu
    const [totalCount, setTotalCount] = useState(0); // Tổng số album (tính ở client)
    // --- State cho Sort/Filter phía Client ---
    const [sortBy, setSortBy] = useState('recently_added'); // Mặc định sort theo mới nhất
    const [sortOrder, setSortOrder] = useState('desc');   // Mới nhất lên đầu (desc)
    const [searchTerm, setSearchTerm] = useState('');     // State cho filter tìm kiếm (nếu thêm ô search)
    const [playingAlbumId, setPlayingAlbumId] = useState(null); // ID của album đang được fetch nhạc để play

    const navigate = useNavigate();
    const playSong = usePlayerStore(state => state.playSong); // Lấy action playSong

    // --- Data Fetching (Chỉ fetch 1 lần khi mount) ---
    const fetchAllAlbums = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await getAlbums(); // Gọi API getAlbums
            // API cần trả về dữ liệu lồng nhau (vd: artist)
            const fetchedAlbums = response.data.results || response.data || [];
            setAllAlbums(fetchedAlbums);
            setTotalCount(fetchedAlbums.length);
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load albums.";
            setError(apiError); toast.error(apiError); setAllAlbums([]); setTotalCount(0);
            console.error("Fetch albums error:", err);
        } finally { setLoading(false); }
    }, []); // Dependency rỗng

    useEffect(() => {
        fetchAllAlbums();
    }, [fetchAllAlbums]);

    // --- useEffect để Lọc và Sắp xếp dữ liệu hiển thị ---
    useEffect(() => {
        let processedAlbums = [...allAlbums];

        // 1. Lọc (nếu có searchTerm)
        const lowerCaseSearch = searchTerm.toLowerCase().trim();
        if (lowerCaseSearch) {
            processedAlbums = processedAlbums.filter(album =>
                album.album_name?.toLowerCase().includes(lowerCaseSearch) ||
                album.artist?.artist_name?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. Sắp xếp
        processedAlbums.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'artist.artist_name') { valA = a.artist?.artist_name || ''; valB = b.artist?.artist_name || ''; }
            else if (sortBy === 'release_time') { const dateA = a.release_time ? new Date(a.release_time).getTime() : 0; const dateB = b.release_time ? new Date(b.release_time).getTime() : 0; valA = dateA || (a.release_year || 0); valB = dateB || (b.release_year || 0); }
            else if (sortBy === 'recently_added') { valA = a._id || ''; valB = b._id || ''; }
            else { valA = a[sortBy] || ''; valB = b[sortBy] || ''; } // Sort theo album_name

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            let comparison = 0; if (valA > valB) { comparison = 1; } else if (valA < valB) { comparison = -1; }

            if (sortBy === 'recently_added') { return sortOrder === 'asc' ? comparison : comparison * -1; } // Đảo mặc định cho recently added
            else { return sortOrder === 'desc' ? (comparison * -1) : comparison; }
        });

        setDisplayAlbums(processedAlbums);

    }, [allAlbums, sortBy, sortOrder, searchTerm]);

    // --- Handlers cho Sort/Filter ---
    const handleSortChange = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        setSortOrder(newSortBy === 'release_time' || newSortBy === 'recently_added' ? 'desc' : 'asc');
    };

    const handleSortOrderToggle = () => {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    };

    // --- Handlers khác ---
     const handleAlbumClick = (albumId) => { navigate(`/album/${albumId}`); };

     // --- HOÀN THIỆN HÀM NÀY ---
     const handlePlayAlbum = async (e, albumId, albumName) => {
         e.stopPropagation();
         if (playingAlbumId) return; // Ngăn click nhiều lần khi đang load

         setPlayingAlbumId(albumId); // Bắt đầu loading cho album này
         const toastId = toast.loading(`Loading "${albumName}"...`);

         try {
             const response = await getAlbumSongs(albumId); // Gọi API lấy tracks
             const albumTracks = response.data;

             if (albumTracks && albumTracks.length > 0) {
                 playSong(albumTracks[0], albumTracks, 0); // Phát bài đầu, đặt queue
                 toast.update(toastId, { render: `Playing "${albumName}"`, type: "success", isLoading: false, autoClose: 3000 });
             } else {
                  toast.update(toastId, { render: `Album "${albumName}" is empty.`, type: "warning", isLoading: false, autoClose: 3000 });
             }
         } catch (err) {
              console.error(`Error fetching songs for album ${albumId}:`, err);
              const apiError = err.response?.data?.detail || err.message || "Could not load album tracks.";
              toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
         } finally {
              setPlayingAlbumId(null); // Kết thúc loading cho album này
         }
     };
     // --------------------------

    // --- Render Component ---
    if (loading) return <div className={styles.message}>Loading albums...</div>;
    if (error && !loading && allAlbums.length === 0) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerIcon}><FiDisc /></div>
                <h1 className={styles.pageTitle}>Albums</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

             {/* Toolbar */}
            <div className={styles.toolbar}>
                 <div className={styles.sortFilterGroup}>
                     <select className={styles.sortSelect} value={sortBy} onChange={handleSortChange} disabled={loading}>
                         <option value="recently_added">Recently Added</option>
                         <option value="album_name">Alphabetical</option>
                         <option value="artist.artist_name">Artist</option>
                         <option value="release_time">Release Year</option>
                     </select>
                     <button onClick={handleSortOrderToggle} className={styles.filterButton} title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`} disabled={loading}>
                         {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                     </button>
                     {/* <button className={styles.filterButton} title="Filter"><FiFilter /></button> */}
                 </div>
                 <div className={styles.sortFilterGroup}>
                      <button className={styles.filterButton} title="Refresh" onClick={fetchAllAlbums} disabled={loading}><FiRefreshCcw /></button>
                      {/* <button className={styles.moreActionsButton} title="More options"><FiMoreHorizontal /></button> */}
                 </div>
            </div>

            {/* Album Grid */}
            {displayAlbums.length === 0 && !loading && (
                 <div className={styles.message}>No albums found{searchTerm ? ` matching "${searchTerm}"` : ''}.</div>
            )}
            {displayAlbums.length > 0 && (
                <ul className={styles.albumGrid}>
                    {displayAlbums.map((album) => (
                        <li key={album._id} className={styles.albumCard} onClick={() => handleAlbumClick(album._id)}>
                            <div className={styles.albumCoverLink}>
                                <AlbumCoverDisplay src={album.image_url} alt={album.album_name} />
                                {/* Nút Play Overlay */}
                                <button
                                    className={styles.playButtonOverlay}
                                    onClick={(e) => handlePlayAlbum(e, album._id, album.album_name)}
                                    title={`Play ${album.album_name}`}
                                    // Disable nút nếu đang loading cho album này
                                    disabled={playingAlbumId === album._id}
                                >
                                    {/* Hiển thị spinner nếu đang loading */}
                                    {playingAlbumId === album._id ? (
                                        <FiLoader size={24} className="animate-spin" /> // Cần CSS cho animate-spin
                                    ) : (
                                        <FiPlay />
                                    )}
                                </button>
                            </div>
                            <div className={styles.albumInfo}>
                                <Link to={`/album/${album._id}`} className={styles.albumName} title={album.album_name} onClick={(e) => e.stopPropagation()}>
                                    {album.album_name || 'Unknown Album'}
                                </Link>
                                <div className={styles.albumMeta}>
                                     {album.release_time && <span>{new Date(album.release_time).getFullYear()}</span>}
                                    {album.artist && (
                                         <Link to={`/artist/${album.artist._id}`} className={styles.artistLink} onClick={(e) => e.stopPropagation()}>
                                            {album.artist.artist_name || 'Unknown Artist'}
                                         </Link>
                                    )}
                                    {!album.artist && <span>Unknown Artist</span>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AlbumsPage;