// src/pages/ArtistsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getArtists } from '../api/apiClient';
import usePlayerStore from '../store/playerStore'; // Nếu cần nút play artist
import styles from './ArtistsPage.module.css'; // <<< Sử dụng CSS Module này
import { FiUsers, FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown, FiPlay, FiStar, FiLoader } from 'react-icons/fi'; // Thêm FiStar
import { toast } from 'react-toastify';
import { getArtistTopTracks } from '../api/apiClient';


// Component Avatar (Có thể tách ra)
const ArtistAvatarDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div className={styles.artistAvatarWrapper}> {/* <<< Container tròn */}
            {!imgError && src ? (
                <img src={src} alt={alt || 'Artist'} className={styles.artistAvatar} onError={() => setImgError(true)} loading="lazy" />
            ) : (
                <FiStar size="50%" className={styles.avatarPlaceholder} /> // <<< Icon sao placeholder
            )}
        </div>
    );
};




const ArtistsPage = () => {
    // --- State ---
    const [allArtists, setAllArtists] = useState([]);
    const [displayArtists, setDisplayArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState('artist_name'); // Mặc định sort theo tên
    const [sortOrder, setSortOrder] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [playingArtistId, setPlayingArtistId] = useState(null); // <<< State loading play

    const playSong = usePlayerStore(state => state.playSong);

    const navigate = useNavigate();
    // const playArtist = usePlayerStore(state => state.playArtist); // TODO: Action nếu có

    // --- Data Fetching ---
    const fetchAllArtists = useCallback(async () => { // Re-define
            setLoading(true); setError(null);
            try {
                const response = await getArtists();
                const fetchedArtists = response.data.results || response.data || [];
                setAllArtists(fetchedArtists); setTotalCount(fetchedArtists.length);
            } catch (err) {
                const apiError = err.response?.data?.detail || err.message || "Failed to load artists.";
                setError(apiError); toast.error(apiError); setAllArtists([]); setTotalCount(0);
            } finally { setLoading(false); }
        }, []);

    

    useEffect(() => { fetchAllArtists(); }, [fetchAllArtists]);

    // --- useEffect Lọc/Sort ---
    useEffect(() => {
        let processedArtists = [...allArtists];
        const lowerCaseSearch = searchTerm.toLowerCase().trim();
        if (lowerCaseSearch) {
            processedArtists = processedArtists.filter(artist =>
                artist.artist_name?.toLowerCase().includes(lowerCaseSearch)
            );
        }
        processedArtists.sort((a, b) => {
             let valA = a[sortBy] || ''; // Chủ yếu sort theo artist_name
             let valB = b[sortBy] || '';
             if (sortBy === 'recently_added') { valA = a._id || ''; valB = b._id || ''; } // Giả sử sort mới nhất

             if (typeof valA === 'string') valA = valA.toLowerCase();
             if (typeof valB === 'string') valB = valB.toLowerCase();
             let comparison = 0; if (valA > valB) comparison = 1; else if (valA < valB) comparison = -1;
             if (sortBy === 'recently_added') return sortOrder === 'asc' ? comparison : comparison * -1;
             else return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
        setDisplayArtists(processedArtists);
    }, [allArtists, sortBy, sortOrder, searchTerm]);

    // --- Handlers Sort/Filter ---
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setSortOrder(e.target.value === 'recently_added' ? 'desc' : 'asc');
    };
    const handleSortOrderToggle = () => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); };

    // --- Handlers khác ---
    const handleArtistClick = (artistId) => { navigate(`/artist/${artistId}`); };
    const handlePlayArtist = async (e, artistId, artistName) => {
        e.stopPropagation();
        setPlayingArtistId(artistId); // Bắt đầu loading
        const toastId = toast.loading(`Loading top tracks for "${artistName}"...`);
        try {
            console.log(`TODO: Fetch top tracks for artist ${artistName} (${artistId})`);
            const tracksResponse = await getArtistTopTracks(artistId); // <<< Cần API này
            const artistTracks = tracksResponse.data || [];
            // const artistTracks = []; // <<<< Thay bằng dữ liệu thật
            if (artistTracks.length > 0) {
                playSong(artistTracks[0], artistTracks, 0); // Play bài đầu tiên
                toast.update(toastId, { render: `Playing top tracks by "${artistName}"`, type: "success", isLoading: false, autoClose: 3000 });
            } else {
                 toast.update(toastId, { render: `No tracks found for "${artistName}".`, type: "warning", isLoading: false, autoClose: 3000 });
            }
        } catch (err) {
             const apiError = err.response?.data?.detail || err.message || "Could not load artist tracks.";
             toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setPlayingArtistId(null); // Kết thúc loading
        }
    };

    // --- Render ---
    if (loading) return <div className={styles.message}>Loading artists...</div>;
    if (error && allArtists.length === 0) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                 <div className={styles.headerIcon}><FiUsers /></div>
                <h1 className={styles.pageTitle}>Artists</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

             {/* Toolbar */}
            <div className={styles.toolbar}>
                 <div className={styles.sortFilterGroup}>
                     <select className={styles.sortSelect} value={sortBy} onChange={handleSortChange} disabled={loading}>
                         <option value="artist_name">Name</option>
                         <option value="recently_added">Recently Added</option>
                     </select>
                     <button onClick={handleSortOrderToggle} className={styles.filterButton} title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`} disabled={loading}>
                         {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                     </button>
                     {/* <button className={styles.filterButton} title="Filter"><FiFilter /></button> */}
                 </div>
                 <div className={styles.sortFilterGroup}>
                      <button className={styles.filterButton} title="Refresh" onClick={fetchAllArtists} disabled={loading}><FiRefreshCcw /></button>
                      {/* <button className={styles.moreActionsButton} title="More options"><FiMoreHorizontal /></button> */}
                 </div>
            </div>

            {/* Artist Grid */}
             {!loading && displayArtists.length === 0 && (
                 <div className={styles.message}>No artists found{searchTerm ? ` matching "${searchTerm}"` : ''}.</div>
            )}
            {displayArtists.length > 0 && (
                <ul className={styles.artistGrid}>
                    {displayArtists.map((artist) => (
                        // Sử dụng Link hoặc div tùy thuộc bạn muốn click cả card hay chỉ tên
                        <li key={artist._id} className={styles.artistCard} onClick={() => handleArtistClick(artist._id)}>
                            <div className={styles.artistAvatarLink}> {/* Container cho ảnh và nút play */}
                                <ArtistAvatarDisplay src={artist.artist_avatar_url} alt={artist.artist_name} />
                                {/* Nút Play Overlay */}
                                <button
                                    className={styles.playButtonOverlay}
                                    onClick={(e) => handlePlayArtist(e, artist._id, artist.artist_name)}
                                    title={`Play top tracks by ${artist.artist_name}`}
                                    disabled={playingArtistId === artist._id} // Disable khi đang load
                                >
                                     {playingArtistId === artist._id ? (
                                        <FiLoader size={24} className={styles["animate-spin"]} />
                                    ) : (
                                        <FiPlay />
                                    )}
                                </button>
                            </div>
                            <div className={styles.artistInfo}>
                                <Link to={`/artist/${artist._id}`} className={styles.artistName} title={artist.artist_name} onClick={(e) => e.stopPropagation()}>
                                    {artist.artist_name || 'Unknown Artist'}
                                </Link>
                                <div className={styles.artistMeta}>Artist</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ArtistsPage;