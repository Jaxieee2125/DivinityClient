// src/pages/PlaylistDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPlaylistDetail } from '../api/apiClient'; // API function
import usePlayerStore from '../store/playerStore'; // Zustand store for player
import styles from './PlaylistDetailPage.module.css'; // CSS Module cho trang này
import {
    FiPlay, FiHeart, FiMoreHorizontal, FiList, FiClock,
    FiPlayCircle, FiPlusSquare, FiEdit3, FiShare2, FiTrash2, FiUsers // Thêm FiUsers
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// Helper function để định dạng thời lượng (giây -> MM:SS)
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Component hiển thị ảnh bìa nhỏ cho tracks
const AlbumCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div className={styles.trackCoverContainer}>
            {!imgError && src ? (
                <img src={src} alt={alt || 'Cover'} className={styles.trackCover} onError={() => setImgError(true)} loading="lazy" />
            ) : (
                 <div className={styles.trackCoverPlaceholder}>?</div>
            )}
        </div>
    );
};

// Component hiển thị ảnh bìa Playlist (có thể là lưới 4 ảnh)
const PlaylistHeaderCoverDisplay = ({ playlist }) => {
    const coverImageUrl = playlist?.image_url; // Ảnh bìa chính của playlist (nếu có)
    // Giả sử API trả về tracks_preview là mảng 4 URL ảnh bìa track đầu tiên
    const trackPreviewImages = playlist?.tracks_preview || [];

    if (coverImageUrl) {
        return <img src={coverImageUrl} alt={playlist.playlist_name} className={styles.largeCoverImage} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex';}} loading="lazy"/>;
    }
    if (trackPreviewImages.length > 0) {
        return (
            <div className={styles.headerCoverGrid}>
                {trackPreviewImages.slice(0, 4).map((imgUrl, index) => (
                    imgUrl ? <img key={index} src={imgUrl} alt="" onError={(e) => e.target.style.display='none'}/> : <div key={index} className={styles.gridCellPlaceholder}></div>
                ))}
                {/* Lấp đầy nếu không đủ 4 ảnh */}
                {trackPreviewImages.length === 0 && <div className={styles.gridPlaceholderIcon}><FiList size="50%"/></div>}
            </div>
        );
    }
    // Fallback cuối cùng
    return <div className={styles.headerCoverGrid}><div className={styles.gridPlaceholderIcon}><FiList size="50%"/></div></div>;
};


const PlaylistDetailPage = () => {
    const { playlistId } = useParams();
    const navigate = useNavigate();

    const [playlistDetails, setPlaylistDetails] = useState(null); // Bao gồm cả mảng songs (đã fetch chi tiết)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [isPlaylistLiked, setIsPlaylistLiked] = useState(false); // TODO

    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API getPlaylistDetail giờ nên trả về playlist và mảng songs chi tiết
            const response = await getPlaylistDetail(playlistId);
            if (!response.data) throw new Error("Playlist not found.");
            setPlaylistDetails(response.data);
            // TODO: Cập nhật isPlaylistLiked
        } catch (err) { /* ... xử lý lỗi ... */ }
        finally { setLoading(false); }
         fetchData = useCallback(async () => { // Re-define
            setLoading(true); setError(null);
            try {
                const response = await getPlaylistDetail(playlistId);
                if (!response.data) throw new Error("Playlist not found.");
                setPlaylistDetails(response.data);
            } catch (err) {
                console.error("Error fetching playlist details:", err);
                const apiError = err.response?.data?.detail || err.message || "Failed to load playlist data.";
                setError(apiError); toast.error(apiError);
            } finally { setLoading(false); }
        }, [playlistId]);

    }, [playlistId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Handlers ---
    const handlePlayPlaylist = () => {
        const tracksInPlaylist = playlistDetails?.songs?.map(item => item.song || item) || [];
        if (tracksInPlaylist.length > 0) {
            playSong(tracksInPlaylist[0], tracksInPlaylist, 0);
        } else {
            toast.warn("This playlist is empty.");
        }
    };

    const handlePlayTrack = (trackObject, index) => {
        const trackToPlay = trackObject.song || trackObject;
        const queueTracks = playlistDetails?.songs?.map(item => item.song || item) || [];
        playSong(trackToPlay, queueTracks, index);
    };

    const handleAddToQueue = (e, trackObject) => { e.stopPropagation(); const song = trackObject.song || trackObject; addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };
    const handleLikePlaylist = (e) => { e.stopPropagation(); console.log("TODO: Like/Unlike Playlist", playlistId); toast.info("Like playlist feature not implemented yet."); /* setIsPlaylistLiked(!isPlaylistLiked); */ };
    const handleMoreOptionsPlaylist = (e) => { e.stopPropagation(); console.log("TODO: Show more options for playlist", playlistId); toast.info("More options feature not implemented yet."); };
    const handleLikeTrackToggle = (e, trackId) => { e.stopPropagation(); console.log("TODO: Like/Unlike Track", trackId); toast.info("Like track feature not implemented yet."); };

    // --- Tính toán thông tin meta ---
    const tracks = playlistDetails?.songs || []; // Mảng các object {song: {...}, date_added: ...} hoặc chỉ object song
    const trackCount = tracks.length;
    const totalDurationSec = tracks.reduce((sum, item) => {
        const song = item.song || item; // Lấy object song
        return sum + (song.duration_song || 0);
    }, 0);
    const totalDurationFormatted = formatDuration(totalDurationSec);

    // --- Render ---
    if (loading) return <div className={styles.message}>Loading playlist...</div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;
    if (!playlistDetails) return <div className={styles.message}>Playlist not found.</div>;

    return (
        <div className={styles.pageContainer}>
            {/* --- Header Section --- */}
            <div className={styles.playlistHeader}>
                 <div className={styles.headerCover}>
                    <PlaylistHeaderCoverDisplay playlist={playlistDetails} />
                 </div>
                <div className={styles.headerInfo}>
                    <p className={styles.itemType}>Playlist</p>
                    <h1 className={styles.playlistTitle}>{playlistDetails.playlist_name || "Untitled Playlist"}</h1>
                    {playlistDetails.description && <p className={styles.playlistDescription}>{playlistDetails.description}</p>}
                    <div className={styles.metaInfo}>
                        {playlistDetails.user?.username && (
                            <Link to={`/user/${playlistDetails.user._id}`} className={styles.userLink}>
                                {playlistDetails.user.username}
                            </Link>
                        )}
                        {trackCount > 0 && <span>• {trackCount} {trackCount > 1 ? 'songs' : 'song'}</span>}
                        {totalDurationSec > 0 && <span>, {totalDurationFormatted}</span>}
                    </div>
                </div>
            </div>

            {/* --- Action Bar --- */}
            <div className={styles.actionBar}>
                <button className={styles.playButtonLarge} onClick={handlePlayPlaylist} title={`Play ${playlistDetails.playlist_name}`} disabled={tracks.length === 0}>
                    <FiPlay />
                </button>
                {/* <button className={`${styles.iconButton} ${isPlaylistLiked ? styles.liked : ''}`} onClick={handleLikePlaylist} title="Save to Your Library"><FiHeart size={24} fill={isPlaylistLiked ? 'currentColor' : 'none'} stroke={isPlaylistLiked ? 'none' : 'currentColor'} /></button> */}
                <button className={styles.iconButton} onClick={handleMoreOptionsPlaylist} title="More options"><FiMoreHorizontal size={24} /></button>
                {/* Toolbar Actions theo hình ảnh */}
                <div className={styles.toolbarActions}>
                    {/* <span className={styles.actionText}>Id</span> */}
                    {/* <button className={styles.iconButton} title="Sort"><FiArrowDown size={20}/></button> */}
                    {/* <button className={styles.iconButton} title="More Actions"><FiMoreHorizontal size={20}/></button> */}
                </div>
            </div>

            {/* --- Track List Section --- */}
            <div className={styles.trackListContainer}>
                 {tracks.length === 0 && !loading && ( <div className={styles.message}>This playlist is empty. Add some songs!</div> )}
                {tracks.length > 0 && (
                    <table className={styles.trackTable}>
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.indexCol}>#</th>
                                <th className={styles.titleCol}>Title</th>
                                <th className={styles.albumCol}>Album</th>
                                {/* Bỏ cột Artist vì thường là playlist đa dạng */}
                                {/* <th className={styles.artistCol}>Artist</th> */}
                                <th className={styles.dateAddedCol}>Date Added</th>
                                <th className={styles.durationCol}><FiClock size={16} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map((trackItem, index) => {
                                // API trả về playlist.songs là [{song: {song_details...}, date: "..."}]
                                // hoặc chỉ là mảng [ {song_details...} ]
                                const song = trackItem.song || trackItem; // Lấy object song
                                const dateAdded = trackItem.date; // Lấy ngày thêm vào từ trackItem

                                return (
                                    <tr key={song._id || index} className={styles.trackRow} onDoubleClick={() => handlePlayTrack(song, index)}>
                                        <td className={styles.trackIndex}>
                                            <span className={styles.playButtonContainer} onClick={(e) => { e.stopPropagation(); handlePlayTrack(song, index); }}>
                                                <button className={styles.playButton}><FiPlayCircle /></button>
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
                                        {/* Bỏ cột Artist riêng */}
                                        <td className={styles.trackDateAddedCell}>
                                            {dateAdded ? new Date(dateAdded).toLocaleDateString() : '-'}
                                        </td>
                                        <td className={styles.trackDurationCell}>
                                            <span className={styles.durationText}>{formatDuration(song.duration_song)}</span>
                                            <div className={styles.trackActions}>
                                                 <button onClick={(e) => handleLikeTrackToggle(e, song._id)} className={styles.actionButton} title="Like"> <FiHeart size={16} /> </button>
                                                 <button onClick={(e) => handleAddToQueue(e, song)} className={styles.actionButton} title="Add to queue"> <FiPlusSquare size={16}/> </button>
                                             </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
             {/* TODO: Pagination nếu API trả về phân trang cho tracks trong playlist */}
        </div>
    );
};

export default PlaylistDetailPage;