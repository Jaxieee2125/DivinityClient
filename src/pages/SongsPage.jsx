// src/pages/SongsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSongs } from '../api/apiClient'; // API function to get songs
import usePlayerStore from '../store/playerStore'; // Zustand store for player state and actions
import styles from './SongsPage.module.css'; // Specific CSS module for this page
import {
    FiMusic, FiPlayCircle, FiPlusSquare, FiHeart, FiClock,
    FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { toast } from 'react-toastify'; // For user feedback

// Helper function to format duration (seconds -> MM:SS)
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Component to display small album cover art with fallback
const AlbumCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]); // Reset error when src changes

    return (
        <div className={styles.trackCoverContainer}> {/* Use specific class */}
            {!imgError && src ? (
                <img
                    src={src}
                    alt={alt || 'Album cover'}
                    className={styles.trackCover} // Use specific class
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            ) : (
                 <div className={styles.trackCoverPlaceholder}>?</div> // Placeholder
            )}
        </div>
    );
};


const SongsPage = () => {
    // --- State ---
    const [allSongs, setAllSongs] = useState([]);         // Stores all songs fetched from API
    const [displaySongs, setDisplaySongs] = useState([]); // Filtered and sorted songs for display
    const [loading, setLoading] = useState(true);         // Initial loading state
    const [error, setError] = useState(null);           // API fetch error
    const [totalCount, setTotalCount] = useState(0);    // Total number of songs
    // Client-side Sorting/Filtering State
    const [sortBy, setSortBy] = useState('recently_added'); // Default sort
    const [sortOrder, setSortOrder] = useState('desc');      // Default order for recently_added
    const [searchTerm, setSearchTerm] = useState('');       // Filter search term (if adding search later)

    // --- Zustand Store Access ---
    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);

    // --- Data Fetching ---
    const fetchAllSongs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API should return songs with nested artist and album objects
            const response = await getSongs();
            const fetchedSongs = response.data.results || response.data || [];
            setAllSongs(fetchedSongs);
            setTotalCount(fetchedSongs.length);
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load songs.";
            setError(apiError); toast.error(apiError); setAllSongs([]); setTotalCount(0);
            console.error("Fetch songs error:", err);
        } finally { setLoading(false); }
    }, []); // Empty dependency array - fetch only once on mount

    useEffect(() => {
        fetchAllSongs();
    }, [fetchAllSongs]);

    // --- Client-side Filtering and Sorting Logic ---
    useEffect(() => {
        let processedSongs = [...allSongs];
        const lowerCaseSearch = searchTerm.toLowerCase().trim();

        // 1. Filter (if search term exists)
        if (lowerCaseSearch) {
            processedSongs = processedSongs.filter(song =>
                song.song_name?.toLowerCase().includes(lowerCaseSearch) ||
                song.album?.album_name?.toLowerCase().includes(lowerCaseSearch) ||
                song.artists?.some(a => a.artist_name?.toLowerCase().includes(lowerCaseSearch))
            );
        }

        // 2. Sort
        processedSongs.sort((a, b) => {
             let valA, valB;
             // Define how to get values based on sortBy key
             if (sortBy === 'album.album_name') { valA = a.album?.album_name || ''; valB = b.album?.album_name || ''; }
             else if (sortBy === 'artist.artist_name') { valA = a.artists?.[0]?.artist_name || ''; valB = b.artists?.[0]?.artist_name || ''; } // Sort by first artist
             else if (sortBy === 'duration_song') { valA = a.duration_song || 0; valB = b.duration_song || 0; }
             else if (sortBy === 'recently_added') { valA = a._id || ''; valB = b._id || ''; }
             else { valA = a.song_name || ''; valB = b.song_name || ''; } // Default sort by song_name (title)

             // Case-insensitive string comparison
             if (typeof valA === 'string') valA = valA.toLowerCase();
             if (typeof valB === 'string') valB = valB.toLowerCase();

             let comparison = 0;
             if (valA > valB) { comparison = 1; }
             else if (valA < valB) { comparison = -1; }

             // Apply sort order (desc for recently_added by default)
             if (sortBy === 'recently_added') { return sortOrder === 'asc' ? comparison : comparison * -1; }
             else { return sortOrder === 'desc' ? (comparison * -1) : comparison; }
        });

        // 3. Update the state used for display
        setDisplaySongs(processedSongs);

    }, [allSongs, sortBy, sortOrder, searchTerm]); // Re-run when data or criteria change

    // --- Handlers for Toolbar ---
    const handleSortChange = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        // Reset order for new sort field (default to asc, desc for time-based)
        setSortOrder(newSortBy === 'recently_added' ? 'desc' : 'asc');
    };
    const handleSortOrderToggle = () => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); };

    // --- Handlers for Row Actions ---
    const handlePlay = (songToPlay, index) => {
        // Play the song, using the currently displayed (filtered/sorted) list as the queue
        playSong(songToPlay, displaySongs, index);
    };
    const handleAddToQueue = (e, song) => { e.stopPropagation(); addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };
    const handleLike = (e, songId) => { e.stopPropagation(); console.log("TODO: Like/Unlike song:", songId); toast.info("Like feature not implemented yet."); };

    // --- Render Logic ---
    if (loading) return <div className={styles.message}>Loading songs...</div>;
    if (error && allSongs.length === 0) return <div className={`${styles.message} ${styles.error}`}>{error}</div>; // Show error only if loading failed completely

    return (
        <div className={styles.pageContainer}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
            <div className={styles.headerIcon}><FiMusic /></div>
                <h1 className={styles.pageTitle}>Tracks</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                 <div className={styles.sortFilterGroup}>
                     <select className={styles.sortSelect} value={sortBy} onChange={handleSortChange} disabled={loading}>
                         <option value="recently_added">Recently Added</option>
                         <option value="song_name">Title</option>
                         <option value="artist.artist_name">Artist</option>
                         <option value="album.album_name">Album</option>
                         <option value="duration_song">Duration</option>
                     </select>
                     <button onClick={handleSortOrderToggle} className={styles.filterButton} title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`} disabled={loading}>
                         {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                     </button>
                     {/* Optional Filter Button */}
                     {/* <button className={styles.filterButton} title="Filter"><FiFilter /></button> */}
                 </div>
                 <div className={styles.sortFilterGroup}>
                      <button className={styles.filterButton} title="Refresh" onClick={fetchAllSongs} disabled={loading}><FiRefreshCcw /></button>
                      {/* <button className={styles.moreActionsButton} title="More options"><FiMoreHorizontal /></button> */}
                 </div>
            </div>

            {/* Track Table Section */}
            <div className={styles.resultsSection}>
                {displaySongs.length === 0 && !loading && (
                     <div className={styles.message}>No songs found{searchTerm ? ` matching "${searchTerm}"` : ''}.</div>
                )}
                {displaySongs.length > 0 && (
                    <table className={styles.trackTable}>
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.indexCol}>#</th>
                                <th className={styles.titleCol}>Title</th>
                                <th className={styles.albumCol}>Album</th>
                                <th className={styles.artistCol}>Artist</th>
                                <th className={styles.durationCol}><FiClock size={16} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displaySongs.map((song, index) => (
                                <tr key={song._id} className={styles.trackRow} onDoubleClick={() => handlePlay(song, index)}>
                                    <td className={styles.trackIndex}>
                                        <span className={styles.playButtonContainer}>
                                            <button onClick={(e) => { e.stopPropagation(); handlePlay(song, index); }} className={styles.playButton} title={`Play ${song.song_name}`}><FiPlayCircle /></button>
                                        </span>
                                        <span className={styles.indexNumber}>{index + 1}</span>
                                    </td>
                                    <td className={styles.trackTitleCell}>
                                        <AlbumCoverDisplay src={song.album?.image_url} alt={song.album?.album_name} />
                                        <div className={styles.trackInfo}>
                                            <div className={styles.trackName}>{song.song_name || 'Unknown Track'}</div>
                                            {/* Show contributing artists below title if different from primary artist */}
                                            <div className={styles.trackSubArtists}>
                                                 {song.artists && song.artists.length > 1 &&
                                                    song.artists.slice(1).map(a => a.artist_name).join(', ')}
                                             </div>
                                        </div>
                                    </td>
                                    <td className={styles.trackAlbumCell}>
                                        {song.album ? ( <Link to={`/album/${song.album._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}> {song.album.album_name || '-'} </Link> ) : ( <span>-</span> )}
                                    </td>
                                    <td className={styles.trackArtistCell}>
                                         {song.artists?.map((a, i) => (
                                            <React.Fragment key={a._id}>
                                                <Link to={`/artist/${a._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}> {a.artist_name} </Link>
                                                {i < song.artists.length - 1 && ', '}
                                            </React.Fragment>
                                        )) || '-'}
                                    </td>
                                    <td className={styles.trackDurationCell}>
                                        <span className={styles.durationText}>{formatDuration(song.duration_song)}</span>
                                        <div className={styles.trackActions}>
                                             {/* <button onClick={(e) => handleLike(e, song._id)} className={styles.actionButton} title="Save to your Liked Songs"> <FiHeart size={16} /> </button>
                                             <button onClick={(e) => handleAddToQueue(e, song)} className={styles.actionButton} title="Add to queue"> <FiPlusSquare size={16}/> </button> */}
                                         </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
             {/* No Pagination needed for client-side sort/filter */}
        </div>
    );
};

// Đổi tên export nếu đây là file SongsPage.jsx
// export default SongsPage;
export default SongsPage; // Giữ nguyên nếu đây là HomePage.jsx