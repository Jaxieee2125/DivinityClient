// src/pages/MusicGenreDetailPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGenreTracks, getMusicGenreName, getMusicGenres} from '../api/apiClient'; // getMusicGenres để lấy tên genre
import usePlayerStore from '../store/playerStore';
import styles from './MusicGenreDetailPage.module.css'; // <<< CSS Module cho trang này
import {
    FiPlay, FiPlayCircle, FiPlusSquare, FiHeart, FiClock,
    FiFilter, FiRefreshCcw, FiMoreHorizontal, FiArrowUp, FiArrowDown, FiTag, FiLoader
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// Helper function để định dạng thời lượng (giây -> MM:SS)
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
        <div className={styles.trackCoverContainer}>
            {!imgError && src ? (
                <img
                    src={src}
                    alt={alt || 'Album cover'}
                    className={styles.trackCover}
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            ) : (
                 <div className={styles.trackCoverPlaceholder}>?</div>
            )}
        </div>
    );
};


const MusicGenreDetailPage = () => {
    const params = useParams();
    console.log("URL Params:", params); // <<< LOG TOÀN BỘ OBJECT PARAMS
    const {genreId} = useParams(); // Lấy ID genre từ URL
    console.log("Genre ID:", genreId); // <<< LOG ID ĐỂ KIỂM TRA
    
    const navigate = useNavigate(); // Dùng để điều hướng nếu cần

    const [genreDetails, setGenreDetails] = useState(null); // State lưu chi tiết genre (chủ yếu là tên)
    const [tracks, setTracks] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(true);
    const [loadingGenreInfo, setLoadingGenreInfo] = useState(true);
    const [error, setError] = useState(null); // Lỗi chung
    // Pagination and Sort states
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20); // Số track mỗi trang
    const [sortBy, setSortBy] = useState('song_name'); // Mặc định sort
    const [sortOrder, setSortOrder] = useState('asc');

    // --- Zustand Store Access ---
    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);

    // --- Effect 1: Fetch chi tiết Genre (tên) khi genreId thay đổi ---
    useEffect(() => {
        const fetchGenreInfo = async () => {
            if (!genreId) {
                setGenreDetails(null);
                setLoadingGenreInfo(false);
                setError("Genre ID is missing."); // Set lỗi nếu không có ID
                return;
            }
            setLoadingGenreInfo(true);
            // Reset error liên quan đến fetch genre info
            // Không reset error chung nếu nó đến từ fetch tracks
            // setError(null);
            console.log(`[Effect 1] Fetching genre info for ID: ${genreId}`);
            try {
                // API getMusicGenres nên có khả năng lọc theo _id
                // Hoặc bạn tạo API getMusicGenreDetail(genreId) riêng
                const response = await getMusicGenreName(genreId); // Gọi API lấy chi tiết genre
                const foundGenre = response.data;

                if (foundGenre) {
                    console.log("[Effect 1] Genre Info Found:", foundGenre);
                    setGenreDetails(foundGenre);
                } else {
                    console.warn(`[Effect 1] Genre with ID ${genreId} not found.`);
                    setError(`Genre with ID ${genreId} not found.`); // Set lỗi
                    setGenreDetails({ musicgenre_name: "Unknown Genre", _id: genreId }); // Fallback
                    toast.warn(`Genre with ID ${genreId} not found.`);
                }
            } catch (err) {
                console.error("Error fetching genre details:", err);
                const apiError = err.response?.data?.detail || err.message || "Failed to load genre details.";
                setError(apiError);
                toast.error(apiError);
                setGenreDetails({ musicgenre_name: "Genre", _id: genreId }); // Fallback
            } finally {
                setLoadingGenreInfo(false);
            }
        };
        fetchGenreInfo();
    }, [genreId]); // <<< CHỈ PHỤ THUỘC VÀO genreId

    // --- Effect 2: Fetch Tracks của Genre ---
    const fetchGenreTracks = useCallback(async (pageToFetch) => {
        if (!genreId) {
            setTracks([]); setTotalCount(0); setTotalPages(1); setLoadingTracks(false);
            return;
        }
        setLoadingTracks(true);
        // Không reset error chung ở đây để giữ lỗi từ fetchGenreInfo nếu có
        console.log(`[Effect 2] Fetching tracks for genre ID: ${genreId}, Page: ${pageToFetch}, Sort: ${sortBy}, Order: ${sortOrder}`);
        try {
            const params = { page: pageToFetch, limit, sort: sortBy, order: sortOrder };
            const response = await getGenreTracks(genreId, params); // Gọi API lấy tracks
            setTracks(response.data.results || []);
            setTotalCount(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);
            // Cập nhật currentPage từ response nếu nó khác
            if (response.data.current_page && response.data.current_page !== currentPage) {
                setCurrentPage(response.data.current_page);
            } else if (pageToFetch !== currentPage) { // Hoặc cập nhật nếu gọi với trang khác
                setCurrentPage(pageToFetch);
            }
        } catch (err) {
            console.error("Error fetching genre tracks:", err);
             const apiError = err.response?.data?.detail || err.message || `Failed to load tracks for this genre.`;
            setError(apiError); // Set lỗi fetch tracks
            toast.error(apiError);
            setTracks([]); setTotalCount(0); setTotalPages(1); setCurrentPage(1);
        } finally {
            setLoadingTracks(false);
        }
    // sortBy và sortOrder là dependency của useCallback này
    }, [genreId, limit, sortBy, sortOrder, currentPage]); // Thêm currentPage để đảm bảo fetch đúng khi nó thay đổi từ Pagination

    // Gọi fetchTracks khi các yếu tố chính thay đổi (bao gồm cả currentPage)
    useEffect(() => {
        fetchGenreTracks(currentPage);
    }, [fetchGenreTracks, currentPage]); // sortBy, sortOrder đã nằm trong deps của fetchGenreTracks


    // --- Handlers Sort/Pagination ---
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setSortOrder(e.target.value === 'duration_song' || e.target.value === 'number_of_plays' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset về trang 1 khi đổi sort
    };
    const handleSortOrderToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset về trang 1 khi đổi order
    };
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage); // useEffect sẽ tự động fetch lại tracks cho trang mới
        }
    };

    // --- Handlers Play/Queue/Like ---
    const handlePlayAllGenreTracks = () => {
        if (tracks.length > 0) {
            playSong(tracks[0], tracks, 0);
        } else {
            toast.warn("No tracks in this genre to play.");
        }
    };
    const handlePlayTrack = (track, index) => {
        playSong(track, tracks, index);
    };
    const handleAddToQueue = (e, song) => { e.stopPropagation(); addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };
    const handleLike = (e, trackId) => { e.stopPropagation(); console.log("TODO: Like/Unlike track:", trackId); toast.info("Like feature not implemented yet."); };


    // --- Render ---
    const isLoadingPage = loadingGenreInfo || (loadingTracks && tracks.length === 0 && currentPage === 1);
    const currentGenreName = genreDetails?.musicgenre_name || (genreId ? `Genre ...` : "Genre");

    if (isLoadingPage) return <div className={styles.message}>Loading...</div>;
    if (error && !genreDetails?.musicgenre_name) return <div className={`${styles.message} ${styles.error}`}>{error}</div>; // Lỗi nghiêm trọng không có cả tên genre

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                 <button
                    className={styles.headerIcon}
                    onClick={handlePlayAllGenreTracks}
                    disabled={tracks.length === 0 || loadingTracks}
                    title={`Play all tracks in "${currentGenreName}"`}
                 >
                     <FiPlay />
                 </button>
                <h1 className={styles.pageTitle}>"{currentGenreName}" tracks</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.sortFilterGroup}>
                    <select className={styles.sortSelect} value={sortBy} onChange={handleSortChange} disabled={loadingTracks}>
                         <option value="song_name">Title</option>
                         <option value="artist.artist_name">Artist</option>
                         <option value="album.album_name">Album</option>
                         <option value="duration_song">Duration</option>
                         <option value="number_of_plays">Popularity</option>
                    </select>
                    <button onClick={handleSortOrderToggle} className={styles.filterButton} title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`} disabled={loadingTracks}>
                        {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                    </button>
                </div>
                <div className={styles.sortFilterGroup}>
                    <button className={styles.filterButton} title="Refresh" onClick={() => fetchGenreTracks(1)} disabled={loadingTracks}><FiRefreshCcw /></button>
                </div>
            </div>

            {/* Track Table Section */}
            <div className={styles.resultsSection}>
                {loadingTracks && tracks.length === 0 && <div className={styles.message}>Loading tracks...</div>}
                {!loadingTracks && tracks.length === 0 && !error && ( <div className={styles.message}>No tracks found for this genre.</div> )}
                {/* Hiển thị lỗi fetch tracks nếu có */}
                {error && !loadingTracks && tracks.length === 0 && <div className={`${styles.message} ${styles.error}`}>{error}</div>}

                {tracks.length > 0 && (
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
                            {tracks.map((track, index) => (
                                <tr key={track._id} className={styles.trackRow} onDoubleClick={() => handlePlayTrack(track, index)}>
                                    <td className={styles.trackIndex}>
                                        <span className={styles.playButtonContainer} onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index); }}>
                                            <button className={styles.playButton} title={`Play ${track.song_name}`}><FiPlayCircle /></button>
                                        </span>
                                        <span className={styles.indexNumber}>{((currentPage - 1) * limit) + index + 1}</span>
                                    </td>
                                    <td className={styles.trackTitleCell}>
                                        <AlbumCoverDisplay src={track.album?.image_url} alt={track.album?.album_name} />
                                        <div className={styles.trackInfo}>
                                            <div className={styles.trackName}>{track.song_name || 'Unknown Track'}</div>
                                            <div className={styles.trackSubArtists}>
                                                {track.artists && track.artists.length > 1 &&
                                                track.artists.slice(1).map(a => a.artist_name).join(', ')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.trackAlbumCell}>
                                        {track.album ? ( <Link to={`/album/${track.album._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}> {track.album.album_name || '-'} </Link> ) : ( <span>-</span> )}
                                    </td>
                                    <td className={styles.trackArtistCell}>
                                         {track.artists?.map((a, i) => (
                                            <React.Fragment key={a._id}>
                                                <Link to={`/artist/${a._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}> {a.artist_name} </Link>
                                                {i < track.artists.length - 1 && ', '}
                                            </React.Fragment>
                                        )) || '-'}
                                    </td>
                                    
                                    <td className={styles.trackDurationCell}>
                                        <span className={styles.durationText}>{formatDuration(track.duration_song)}</span>
                                        
                                    </td>
                                    <td className={styles.trackActionsCell}>
                                        <div className={styles.trackActions}>
                                             <button onClick={(e) => handleLike(e, track._id)} className={styles.actionButton} title="Save to your Liked Songs"> <FiHeart size={16} /> </button>
                                             <button onClick={(e) => handleAddToQueue(e, track)} className={styles.actionButton} title="Add to queue"> <FiPlusSquare size={16}/> </button>
                                         </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 )}
            </div>
            {/* Pagination */}
             {totalPages > 1 && !loadingTracks && tracks.length > 0 && (
                 <Pagination
                     currentPage={currentPage}
                     totalPages={totalPages}
                     onPageChange={handlePageChange}
                     disabled={loadingTracks}
                 />
             )}
        </div>
    );
};

export default MusicGenreDetailPage;