// src/pages/LikedSongsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// --- API function mới ---
import { getUserFavouriteSongs } from '../api/apiClient';
// ----------------------
import usePlayerStore from '../store/playerStore';
import styles from './LikedSongsPage.module.css'; // CSS cho trang này
import { FiHeart, FiPlayCircle, FiPlusSquare, FiClock, FiRefreshCcw } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Helpers và Components (Giữ nguyên hoặc import)

const formatDuration = (seconds) => { if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--'; const minutes = Math.floor(seconds / 60); const remainingSeconds = Math.floor(seconds % 60); return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`; };

const AlbumCoverDisplay = ({ src, alt }) => { const [imgError, setImgError] = useState(false); useEffect(() => { setImgError(false); }, [src]); return ( <div className={styles.trackCoverContainer}> {!imgError && src ? ( <img src={src} alt={alt || 'Cover'} className={styles.trackCover} onError={() => setImgError(true)} loading="lazy" /> ) : ( <div className={styles.trackCoverPlaceholder}>?</div> )} </div> ); };


const LikedSongsPage = () => {
    const [likedSongs, setLikedSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    // TODO: State cho sort/filter client-side nếu muốn

    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);
    // Lấy action để cập nhật trạng thái like trong store (nếu cần)
    const setCurrentSongLikedStatus = usePlayerStore(state => state.setCurrentSongLikedStatus);
    const currentSong = usePlayerStore(state => state.currentSong);


    const fetchLikedSongs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API getUserFavouriteSongs cần được bảo vệ và tự lấy user_id từ token
            const response = await getUserFavouriteSongs();
            // API này nên trả về danh sách các object bài hát đầy đủ (đã $lookup artist, album)
            setLikedSongs(response.data.results || response.data || []);
            setTotalCount(response.data.count || (response.data?.length ?? 0));
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load liked songs.";
            setError(apiError); toast.error(apiError);
            setLikedSongs([]); setTotalCount(0);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLikedSongs(); }, [fetchLikedSongs]);

    // Handler khi nhấn Play trên một track
    const handlePlay = (trackToPlay, index) => {
        // Danh sách likedSongs hiện tại làm queue
        playSong(trackToPlay, likedSongs, index);
    };

    // Handler cho nút Add to Queue
    
    const handleAddToQueue = (e, song) => { e.stopPropagation(); addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };


    // Handler cho nút Like/Unlike (sẽ gọi API toggle và fetch lại)
    const handleToggleLike = async (e, song) => {
        e.stopPropagation();
        // TODO: Gọi API toggleUserFavouriteSongApi(song._id)
        // Sau khi thành công, gọi fetchLikedSongs() để cập nhật danh sách
        // Và nếu bài đang phát là bài này, cập nhật isCurrentSongLiked trong store
        console.log("TODO: Toggle like for song:", song._id);
        toast.info("Toggle like feature needs API call.");
        // Giả sử API thành công và trả về is_favourited mới
        // const newIsLiked = !song.is_favourited; // Giả sử có trường này
        // if (currentSong && currentSong._id === song._id) {
        //    setCurrentSongLikedStatus(newIsLiked);
        // }
        // fetchLikedSongs(); // Tải lại để cập nhật biểu tượng trái tim
    };


    if (loading) return <div className={styles.message}>Loading your liked songs...</div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                 <div className={styles.headerIcon}><FiHeart fill="#fff"/></div> {/* Icon trái tim tô đầy */}
                <h1 className={styles.pageTitle}>Loved Songs</h1>
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

            {/* TODO: Có thể thêm Toolbar với các tùy chọn sort/filter client-side */}
            {/* <div className={styles.toolbar}> ... </div> */}

            {likedSongs.length === 0 && !loading && (
                <p className={styles.message}>You haven't liked any songs yet.</p>
            )}

            {likedSongs.length > 0 && (
                <table className={styles.trackTable}>
                    <thead>
                        <tr className={styles.tableHeader}>
                            <th className={styles.indexCol}>#</th>
                            <th className={styles.titleCol}>Title</th>
                            <th className={styles.albumCol}>Album</th>
                            <th className={styles.artistCol}>Artist</th>
                            {/* Có thể thêm cột "Date Liked" nếu API trả về */}
                            <th className={styles.durationCol}><FiClock size={16} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {likedSongs.map((song, index) => ( // song ở đây là object bài hát đầy đủ
                            <tr key={song._id} className={styles.trackRow} onDoubleClick={() => handlePlay(song, index)}>
                                <td className={styles.trackIndex}>
                                    <span className={styles.playButtonContainer} onClick={(e) => { e.stopPropagation(); handlePlay(song, index); }}>
                                        <button className={styles.playButton} title={`Play ${song.song_name}`}><FiPlayCircle /></button>
                                    </span>
                                    <span className={styles.indexNumber}>{index + 1}</span>
                                </td>
                                <td className={styles.trackTitleCell}>
                                    <AlbumCoverDisplay src={song.album?.image_url} alt={song.album?.album_name} />
                                    <div className={styles.trackInfo}>
                                        <div className={styles.trackName}>{song.song_name || 'Unknown Track'}</div>
                                        <div className={styles.trackSubArtists}>
                                             {song.artists?.map((a, i) => (
                                                <React.Fragment key={a._id}>
                                                    <Link to={`/artist/${a._id}`} className={styles.tableLinkSub} onClick={(e) => e.stopPropagation()}> {a.artist_name} </Link>
                                                    {i < song.artists.length - 1 && ', '}
                                                </React.Fragment>
                                            )) || '-'}
                                         </div>
                                    </div>
                                </td>
                                <td className={styles.trackAlbumCell}>
                                    {song.album ? ( <Link to={`/album/${song.album._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}> {song.album.album_name || '-'} </Link> ) : ( <span>-</span> )}
                                </td>
                                <td className={styles.trackArtistCell}>
                                     {/* Hiển thị nghệ sĩ chính hoặc tất cả */}
                                     {song.artists?.[0] ? (
                                        <Link to={`/artist/${song.artists[0]._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}>
                                            {song.artists[0].artist_name}
                                        </Link>
                                     ) : '-'}
                                </td>
                                <td className={styles.trackDurationCell}>
                                    <span className={styles.durationText}>{formatDuration(song.duration_song)}</span>
                                </td>
                                <td className={styles.trackActionsCell}>
                                    <div className={styles.trackActions}>
                                         {/* Nút Like ở đây luôn là unlike vì đây là danh sách đã like */}
                                         <button onClick={(e) => handleToggleLike(e, song)} className={`${styles.actionButton} ${styles.liked}`} title="Remove from Liked Songs"> <FiHeart fill="currentColor" size={16} /> </button>
                                         <button onClick={(e) => handleAddToQueue(e, song)} className={styles.actionButton} title="Add to queue"> <FiPlusSquare size={16}/> </button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
             {/* TODO: Pagination nếu API hỗ trợ và danh sách dài */}
        </div>
    );
};

export default LikedSongsPage;