// src/pages/PlaylistsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// API getPlaylists đã có, cần API lấy tracks của playlist
import { getPlaylists, /* getPlaylistTracks */ } from '../api/apiClient';
import usePlayerStore from '../store/playerStore';
import styles from './PlaylistsPage.module.css'; // <<< Sử dụng CSS Module này
import { FiList, FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown, FiPlay, FiMusic } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Component hiển thị ảnh bìa Playlist
const PlaylistCoverDisplay = ({ playlist }) => {
    const [imgError, setImgError] = useState(false);
    // Giả sử playlist có trường `image_url` (nếu người dùng đặt)
    // hoặc `tracks_preview` là mảng 4 URL ảnh bìa của 4 bài đầu tiên
    const coverImageUrl = playlist.image_url;
    const trackPreviewImages = playlist.tracks_preview || []; // Backend cần cung cấp

    useEffect(() => { setImgError(false); }, [coverImageUrl]);

    if (coverImageUrl && !imgError) {
        return <img src={coverImageUrl} alt={playlist.playlist_name} className={styles.playlistCover} onError={() => setImgError(true)} loading="lazy" />;
    }
    // Hiển thị lưới 4 ảnh nếu có
    if (trackPreviewImages.length > 0) {
        return (
            <div className={styles.playlistCoverGrid}>
                {trackPreviewImages.slice(0, 4).map((imgUrl, index) => (
                    imgUrl ? <img key={index} src={imgUrl} alt="" onError={(e) => e.target.style.display='none'}/> : <div key={index}></div>
                ))}
                {/* Nếu không đủ 4 ảnh, có thể lấp đầy bằng placeholder */}
                {trackPreviewImages.length < 4 && Array(4 - trackPreviewImages.length).fill(0).map((_,i) =>
                    (trackPreviewImages.length === 0 && i === 0) ? // Chỉ hiện icon nếu không có ảnh nào
                    <div key={`ph-${i}`} className={styles.placeholderIcon}><FiMusic size="50%"/></div> :
                    <div key={`ph-${i}`}></div>
                )}
            </div>
        );
    }
    // Fallback cuối cùng là icon
    return <div className={styles.playlistCoverGrid}><div className={styles.placeholderIcon}><FiList size="50%"/></div></div>;
};


const PlaylistsPage = () => {
    // --- State ---
    const [allPlaylists, setAllPlaylists] = useState([]);
    const [displayPlaylists, setDisplayPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState('playlist_name'); // Mặc định sort theo tên
    const [sortOrder, setSortOrder] = useState('asc');
    const [playingPlaylistId, setPlayingPlaylistId] = useState(null);

    const navigate = useNavigate();
    const playSong = usePlayerStore(state => state.playSong);

    // --- Data Fetching ---
    const fetchAllPlaylists = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API getPlaylists nên trả về cả thông tin user tạo (nếu cần)
            // và có thể là một vài ảnh bìa track đầu tiên để hiển thị
            const response = await getPlaylists();
            const fetchedPlaylists = response.data.results || response.data || [];
            setAllPlaylists(fetchedPlaylists);
            setTotalCount(fetchedPlaylists.length);
        } catch (err) { /* ... xử lý lỗi ... */ }
        finally { setLoading(false); }
         fetchAllPlaylists = useCallback(async () => { // Re-define
            setLoading(true); setError(null);
            try {
                const response = await getPlaylists();
                const fetchedPlaylists = response.data.results || response.data || [];
                setAllPlaylists(fetchedPlaylists); setTotalCount(fetchedPlaylists.length);
            } catch (err) {
                const apiError = err.response?.data?.detail || err.message || "Failed to load playlists.";
                setError(apiError); toast.error(apiError); setAllPlaylists([]); setTotalCount(0);
            } finally { setLoading(false); }
        }, []);

    }, []);

    useEffect(() => { fetchAllPlaylists(); }, [fetchAllPlaylists]);

    // --- useEffect Lọc/Sort ---
    useEffect(() => {
        let processedPlaylists = [...allPlaylists];
        // TODO: Thêm logic filter nếu có ô search
        processedPlaylists.sort((a, b) => {
             let valA = a[sortBy]?.toLowerCase() || ''; // Chủ yếu sort theo playlist_name
             let valB = b[sortBy]?.toLowerCase() || '';
             // Thêm logic cho 'recently_added' nếu có trường ngày tạo
             if (sortBy === 'recently_added') { valA = a._id || ''; valB = b._id || ''; }

             let comparison = valA.localeCompare(valB);
             if (sortBy === 'recently_added') return sortOrder === 'asc' ? comparison : comparison * -1;
             return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
        setDisplayPlaylists(processedPlaylists);
    }, [allPlaylists, sortBy, sortOrder]);

    // --- Handlers ---
    const handleSortChange = (e) => { setSortBy(e.target.value); setSortOrder(e.target.value === 'recently_added' ? 'desc' : 'asc'); };
    const handleSortOrderToggle = () => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); };
    const handlePlaylistClick = (playlistId) => { navigate(`/playlist/${playlistId}`); };

    const handlePlayPlaylist = async (e, playlistId, playlistName) => {
        e.stopPropagation();
        if (playingPlaylistId) return;
        setPlayingPlaylistId(playlistId);
        const toastId = toast.loading(`Loading tracks for "${playlistName}"...`);
        try {
            // const tracksResponse = await getPlaylistTracks(playlistId); // <<< Cần API này
            // const playlistTracks = tracksResponse.data?.results || tracksResponse.data || [];
            const playlistTracks = []; // <<<< Thay bằng dữ liệu thật
            if (playlistTracks.length > 0) {
                playSong(playlistTracks[0], playlistTracks, 0);
                toast.update(toastId, { render: `Playing "${playlistName}"`, type: "success", isLoading: false, autoClose: 3000 });
            } else {
                 toast.update(toastId, { render: `Playlist "${playlistName}" is empty.`, type: "warning", isLoading: false, autoClose: 3000 });
            }
        } catch (err) { /* ... xử lý lỗi toast ... */ }
        finally { setPlayingPlaylistId(null); }
         handlePlayPlaylist = async (e, playlistId, playlistName) => { // Re-define
            e.stopPropagation(); if (playingPlaylistId) return;
            setPlayingPlaylistId(playlistId);
            const toastId = toast.loading(`Loading "${playlistName}"...`);
            try {
                // Giả sử API getPlaylistTracks đã được tạo trong apiClient.js
                // và backend có endpoint /api/playlists/<playlistId>/tracks/
                // const response = await getPlaylistTracks(playlistId);
                // const fetchedTracks = response.data.results || response.data || [];
                // ---- Dùng dữ liệu giả để test UI ----
                const fetchedTracks = allSongs.filter((s,i) => i < 5 + Math.floor(Math.random()*5)); // Lấy vài bài hát ngẫu nhiên làm track của playlist
                // ----------------------------------
                if (fetchedTracks.length > 0) {
                    playSong(fetchedTracks[0], fetchedTracks, 0);
                    toast.update(toastId, { render: `Playing "${playlistName}"`, type: "success", isLoading: false, autoClose: 3000 });
                } else {
                    toast.update(toastId, { render: `Playlist "${playlistName}" is empty.`, type: "warning", isLoading: false, autoClose: 3000 });
                }
            } catch (err) {
                const apiError = err.response?.data?.detail || err.message || "Could not load playlist tracks.";
                toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
            } finally { setPlayingPlaylistId(null); }
        };

    };


    // --- Render ---
    if (loading) return <div className={styles.message}>Loading playlists...</div>;
    if (error && allPlaylists.length === 0) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

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
                         {/* Thêm sort theo người tạo nếu có */}
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
                                    disabled={playingPlaylistId === playlist._id}
                                >
                                     {playingPlaylistId === playlist._id ? ( <FiLoader size={24} className={styles["animate-spin"]} /> ) : ( <FiPlay /> )}
                                </button>
                            </div>
                            <div className={styles.playlistInfo}>
                                <Link to={`/playlist/${playlist._id}`} className={styles.playlistName} title={playlist.playlist_name} onClick={(e) => e.stopPropagation()}>
                                    {playlist.playlist_name || 'Untitled Playlist'}
                                </Link>
                                <div className={styles.playlistMeta}>
                                    {/* API cần trả về tên người tạo hoặc số lượng bài hát */}
                                    Playlist {playlist.user?.username && `• By ${playlist.user.username}`}
                                    {/* Hoặc: {playlist.track_count || 0} songs */}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PlaylistsPage;