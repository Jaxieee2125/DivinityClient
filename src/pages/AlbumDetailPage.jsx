// src/pages/AlbumDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbumDetail, getAlbumSongs } from '../api/apiClient';
import usePlayerStore from '../store/playerStore';
import styles from './AlbumDetailPage.module.css'; // <<< Import CSS Module
import {
    FiPlay, FiHeart, FiMoreHorizontal, FiSettings, FiClock,
    FiPlayCircle, FiPlusSquare, FiDisc, FiUsers // Thêm FiUsers nếu cần
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// Helper function để định dạng thời lượng (giây -> MM:SS)
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Component hiển thị ảnh bìa (Có thể tách file riêng)
const AlbumCoverDisplay = ({ src, alt, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div className={`${styles.coverWrapper} ${className}`}>
            {!imgError && src ? (
                <img src={src} alt={alt || 'Cover'} className={styles.coverImage} onError={() => setImgError(true)} loading="lazy" />
            ) : (
                <div className={styles.coverPlaceholder}><FiDisc size={40}/></div> // Icon placeholder
            )}
        </div>
    );
};


const AlbumDetailPage = () => {
    const { albumId } = useParams();
    

    // State cho chi tiết album và danh sách bài hát
    const [albumDetails, setAlbumDetails] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalDurationSec, setTotalDurationSec] = useState(0);

    // Lấy actions từ player store
    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);
    // State like tạm thời cho album (cần lấy từ dữ liệu user sau)
    const [isAlbumLiked, setIsAlbumLiked] = useState(false);

    // Fetch dữ liệu Album và Tracks
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [albumRes, tracksRes] = await Promise.all([
                getAlbumDetail(albumId),
                getAlbumSongs(albumId) // API này cần trả về tracks với artist/album lồng nhau
            ]);

            if (!albumRes.data) throw new Error("Album not found.");

            setAlbumDetails(albumRes.data);
            const fetchedTracks = tracksRes.data || [];
            setTracks(fetchedTracks);

            const totalSec = fetchedTracks.reduce((sum, track) => sum + (track.duration_song || 0), 0);
            setTotalDurationSec(totalSec);
             // TODO: Kiểm tra xem album này có trong danh sách yêu thích của user không
             // setIsAlbumLiked(checkIfAlbumIsLiked(albumId));

        } catch (err) {
            console.error("Error fetching album details or tracks:", err);
            const apiError = err.response?.data?.detail || err.message || "Failed to load album data.";
            setError(apiError);
            toast.error(apiError);
        } finally {
            setLoading(false);
        }
    }, [albumId]); // Phụ thuộc vào albumId

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---
    const handlePlayAlbum = () => {
        if (tracks.length > 0) {
            playSong(tracks[0], tracks, 0); // Phát bài đầu tiên, đặt cả album làm queue
        } else {
            toast.warn("This album has no tracks to play.");
        }
    };

    const handlePlayTrack = (track, index) => {
        playSong(track, tracks, index); // Phát bài hát cụ thể, queue là tracks của album
    };

     const handleAddToQueue = (e, song) => {
        e.stopPropagation(); // Ngăn click vào hàng
        addToQueue(song);
        toast.info(`"${song.song_name}" added to queue.`);
    };

     const handleLikeAlbumToggle = (e) => {
        e.stopPropagation();
        setIsAlbumLiked(!isAlbumLiked); // Toggle state tạm thời
        console.log("TODO: Call API to Like/Unlike Album", albumId);
        toast.info("Like album feature not implemented yet.");
    };

     const handleLikeTrackToggle = (e, trackId) => {
         e.stopPropagation();
         console.log("TODO: Call API to Like/Unlike Track", trackId);
         toast.info("Like track feature not implemented yet.");
         // Cần cập nhật state isLiked riêng cho từng track nếu cần
     };


     const handleMoreOptions = (e) => {
        e.stopPropagation();
        console.log("TODO: Show more options for album", albumId);
        toast.info("More options feature not implemented yet.");
    };

    // --- Render ---
    if (loading) return <div className={styles.message}>Loading album details...</div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;
    if (!albumDetails) return <div className={styles.message}>Album not found.</div>;

    // Định dạng thông tin meta
    const releaseDate = albumDetails.release_time ? new Date(albumDetails.release_time).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const totalDurationFormatted = formatDuration(totalDurationSec);
    const trackCount = tracks.length;

    return (
        <div className={styles.pageContainer}>
            {/* --- Header Section --- */}
            <div className={styles.albumHeader}>
                <div className={styles.headerCover}>
                    <AlbumCoverDisplay src={albumDetails.image_url} alt={albumDetails.album_name} className={styles.largeCover} />
                </div>
                <div className={styles.headerInfo}>
                    <p className={styles.itemType}>Album</p>
                    <h1 className={styles.albumTitle}>{albumDetails.album_name}</h1>
                    <div className={styles.metaInfo}>
                        {albumDetails.artist && (
                            <Link to={`/artist/${albumDetails.artist._id}`} className={styles.artistLink}>
                                {/* Có thể thêm ảnh nhỏ của nghệ sĩ ở đây nếu muốn */}
                                {/* <img src={albumDetails.artist.artist_avatar_url} /> */}
                                {albumDetails.artist.artist_name}
                            </Link>
                        )}
                        {releaseDate && <span>• {releaseDate}</span>}
                        {trackCount > 0 && <span>• {trackCount} {trackCount > 1 ? 'tracks' : 'track'}</span>}
                        {totalDurationSec > 0 && <span>• {totalDurationFormatted}</span>}
                    </div>
                </div>
            </div>

            {/* --- Action Bar --- */}
            <div className={styles.actionBar}>
                <button className={styles.playButtonLarge} onClick={handlePlayAlbum} title={`Play ${albumDetails.album_name}`}>
                    <FiPlay />
                </button>
                <button
                    className={`${styles.iconButton} ${isAlbumLiked ? styles.liked : ''}`}
                    onClick={handleLikeAlbumToggle}
                    title={isAlbumLiked ? "Remove from Your Library" : "Save to Your Library"}
                >
                    <FiHeart size={24} fill={isAlbumLiked ? 'currentColor' : 'none'} stroke={isAlbumLiked ? 'none' : 'currentColor'}/>
                </button>
                <button className={styles.iconButton} onClick={handleMoreOptions} title="More options">
                    <FiMoreHorizontal size={24} />
                </button>
                 {/* <button className={`${styles.iconButton} ${styles.settingsButton}`}><FiSettings size={20}/></button> */}
            </div>

            {/* --- Track List Section --- */}
            <div className={styles.trackListContainer}>
                <table className={styles.trackTable}>
                    <thead>
                        <tr className={styles.tableHeader}>
                            <th className={styles.indexCol}>#</th>
                            <th className={styles.titleCol}>Title</th>
                            {/* Bỏ cột Album */}
                            <th className={styles.artistCol}>Artist</th>
                            <th className={styles.playsCol}>Plays</th>
                            <th className={styles.durationCol}><FiClock size={16} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tracks.map((track, index) => (
                            <tr key={track._id} className={styles.trackRow} onDoubleClick={() => handlePlayTrack(track, index)} title={`Play ${track.song_name}`}>
                                {/* Cột Index / Play */}
                                <td className={styles.trackIndex}>
                                    <span className={styles.playButtonContainer}>
                                        <button onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index); }} className={styles.playButton}><FiPlayCircle /></button>
                                    </span>
                                    <span className={styles.indexNumber}>{index + 1}</span>
                                </td>
                                {/* Cột Title (Không cần ảnh bìa ở đây) */}
                                <td className={styles.trackTitleCell}>
                                    <div className={styles.trackInfo}>
                                        <div className={styles.trackName}>{track.song_name || 'Unknown Track'}</div>
                                        {/* Có thể hiển thị nghệ sĩ ở đây nếu bài hát có nhiều nghệ sĩ khác album artist */}
                                        {/* <div className={styles.trackArtists}> ... </div> */}
                                    </div>
                                </td>
                                {/* Cột Artist */}
                                <td className={styles.trackArtistCell}>
                                     {track.artists?.map((a, i) => (
                                        <React.Fragment key={a._id}>
                                            <Link to={`/artist/${a._id}`} className={styles.tableLink} onClick={(e) => e.stopPropagation()}>
                                                {a.artist_name}
                                            </Link>
                                            {i < track.artists.length - 1 && ', '}
                                        </React.Fragment>
                                    )) || '-'}
                                </td>
                                {/* Cột Plays */}
                                <td className={styles.trackPlaysCell}>
                                    {track.number_of_plays != null ? track.number_of_plays : '-'}
                                </td>
                                {/* Cột Duration và Actions */}
                                <td className={styles.trackDurationCell}>
                                    {/* Số thời gian */}
                                    <span className={styles.durationText}>
                                        {formatDuration(track.duration_song)}
                                    </span>
                                    {/* Actions */}
                                </td>
                                <td className={styles.trackActionsCell}>
                                    <div className={styles.trackActions}>
                                         <button onClick={(e) => handleLikeTrackToggle(e, track._id)} className={styles.actionButton} title="Save to your Liked Songs">
                                            <FiHeart size={16} /> {/* TODO: Thêm state like cho từng track */}
                                         </button>
                                         <button onClick={(e) => handleAddToQueue(e, track)} className={styles.actionButton} title="Add to queue">
                                            <FiPlusSquare size={16}/>
                                         </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlbumDetailPage;