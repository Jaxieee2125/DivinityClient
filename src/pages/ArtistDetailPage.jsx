// src/pages/ArtistDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Import các hàm API đã tạo
import { getArtistDetail, getArtistAlbums, getArtistTopTracks } from '../api/apiClient';
import usePlayerStore from '../store/playerStore'; // Store player
import styles from './ArtistDetailPage.module.css'; // CSS Module riêng
import {
    FiPlay, FiHeart, FiMoreHorizontal, FiUsers, FiList, FiMusic,
    FiClock, FiPlayCircle, FiPlusSquare // Icons cần thiết
} from 'react-icons/fi';
import { toast } from 'react-toastify'; // Thông báo

// --- Helper Components ---

// Component Avatar (Tách hoặc định nghĩa lại)
const ArtistAvatarDisplay = ({ src, alt, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div className={`${styles.avatarWrapper} ${className}`}>
            {!imgError && src ? (
                <img src={src} alt={alt || 'Artist'} className={styles.avatarImage} onError={() => setImgError(true)} loading="lazy"/>
            ) : (
                <div className={styles.avatarPlaceholder}><FiUsers size="50%"/></div>
            )}
        </div>
    );
};

// Component Ảnh bìa Album (Dùng trong bảng track và card mini)
const AlbumCoverDisplay = ({ src, alt, className = '' }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        // Sử dụng class cụ thể hơn nếu cần phân biệt kích thước
        <div className={`${styles.trackCoverContainer} ${className}`}>
            {!imgError && src ? (
                <img src={src} alt={alt || 'Cover'} className={styles.trackCover} onError={() => setImgError(true)} loading="lazy" />
            ) : (
                // Icon placeholder cho album
                <div className={styles.coverPlaceholder}><FiDisc size={20}/></div>
            )}
        </div>
    );
};

// Component Card Album nhỏ cho cuộn ngang
const MiniAlbumCard = ({ album }) => {
    const navigate = useNavigate();
    // TODO: Thêm hàm play album nhỏ nếu cần
    // const handleMiniPlay = (e) => { e.stopPropagation(); console.log("Play mini album"); }

    return (
        // Đổi thẻ li thành div để tránh lỗi validate HTML khi không có ul cha trực tiếp
        <div className={styles.miniAlbumCard} onClick={() => navigate(`/album/${album._id}`)}>
             <div className={styles.miniAlbumCoverWrapper}>
                 <img
                    src={album.image_url || '/default-album-art.png'}
                    alt={album.album_name}
                    className={styles.miniAlbumCover}
                    onError={(e)=>{e.target.src='/default-album-art.png'}}
                    loading="lazy"
                 />
                 {/* Nút play nhỏ trên ảnh bìa (tùy chọn) */}
                 {/* <button className={styles.playButtonOverlaySmall} onClick={handleMiniPlay}><FiPlay/></button> */}
            </div>
            <div className={styles.miniAlbumName} title={album.album_name}>
                {/* Link đến trang album */}
                <Link to={`/album/${album._id}`} onClick={(e) => e.stopPropagation()}>
                    {album.album_name}
                </Link>
            </div>
            <div className={styles.miniAlbumMeta}>
                {/* Năm phát hành */}
                {album.release_time ? new Date(album.release_time).getFullYear() : ''} • Album
            </div>
        </div>
    );
};


// Helper format duration
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};


// --- Component Chính ---
const ArtistDetailPage = () => {
    const { artistId } = useParams();
    const navigate = useNavigate();

    // --- State ---
    const [artistDetails, setArtistDetails] = useState(null);
    const [recentAlbums, setRecentAlbums] = useState([]); // Danh sách album mới nhất
    const [topTracks, setTopTracks] = useState([]);     // Danh sách top tracks
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isArtistLiked, setIsArtistLiked] = useState(false); // State follow/like artist

    // --- Zustand Actions ---
    const playSong = usePlayerStore(state => state.playSong);
    const addToQueue = usePlayerStore(state => state.addToQueue);

    // --- Fetch Data ---
    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // Gọi song song các API
            const requests = [
                getArtistDetail(artistId),
                getArtistAlbums(artistId, { limit: 8, sort: 'release_time', order: 'desc' }), // Lấy 8 album mới nhất
                getArtistTopTracks(artistId, { limit: 5 }) // Lấy 5 bài phổ biến nhất
            ];
            const [artistRes, albumsRes, tracksRes] = await Promise.allSettled(requests); // Dùng allSettled để xử lý lỗi từng request

            // Xử lý kết quả Artist Detail
            if (artistRes.status === 'fulfilled' && artistRes.value.data) {
                setArtistDetails(artistRes.value.data);
                // TODO: Kiểm tra trạng thái like của artist
                // setIsArtistLiked(checkIfArtistIsLiked(artistId));
            } else {
                throw new Error(artistRes.reason?.response?.data?.detail || artistRes.reason?.message || "Artist not found.");
            }

            // Xử lý kết quả Albums
            if (albumsRes.status === 'fulfilled' && albumsRes.value.data) {
                setRecentAlbums(albumsRes.value.data.results || albumsRes.value.data || []);
            } else {
                console.error("Error fetching artist albums:", albumsRes.reason);
                // Không cần báo lỗi nghiêm trọng nếu chỉ albums lỗi
                toast.warn("Could not load recent albums.");
            }

            // Xử lý kết quả Top Tracks
            if (tracksRes.status === 'fulfilled' && tracksRes.value.data) {
                 setTopTracks(tracksRes.value.data.results || tracksRes.value.data || []);
            } else {
                console.error("Error fetching artist top tracks:", tracksRes.reason);
                 toast.warn("Could not load popular tracks.");
            }

        } catch (err) { // Lỗi nghiêm trọng (ví dụ: artist không tồn tại)
            console.error("Error fetching artist page data:", err);
            const apiError = err.message || "Failed to load artist data.";
            setError(apiError);
            toast.error(apiError);
            setArtistDetails(null); // Đảm bảo không hiển thị gì nếu lỗi
        } finally {
            setLoading(false);
        }
    }, [artistId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Handlers ---
    const handlePlayArtist = () => {
        if (topTracks.length > 0) {
            // Phát bài đầu tiên trong top tracks, queue là toàn bộ top tracks
            playSong(topTracks[0], topTracks, 0);
        } else {
            toast.warn("This artist has no popular tracks to play.");
        }
    };
    const handleLikeArtistToggle = (e) => { e.stopPropagation(); setIsArtistLiked(!isArtistLiked); console.log("TODO: API Like/Unlike Artist", artistId); toast.info("Follow artist feature not implemented yet."); };
    const handleMoreOptions = (e) => { e.stopPropagation(); console.log("TODO: Show more options for artist", artistId); toast.info("More options feature not implemented yet."); };
    const handlePlayTrack = (track, index) => { playSong(track, topTracks, index); }; // Play từ danh sách top tracks
    const handleAddToQueue = (e, song) => { e.stopPropagation(); addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };
    const handleLikeTrackToggle = (e, trackId) => { e.stopPropagation(); console.log("TODO: API Like/Unlike Track", trackId); toast.info("Like track feature not implemented yet."); };


    // --- Render ---
    if (loading) return <div className={styles.message}>Loading artist details...</div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;
    if (!artistDetails) return <div className={styles.message}>Artist not found.</div>;

    // Lấy thông tin cần thiết từ artistDetails
    const { artist_name, artist_avatar_url, total_albums, total_tracks } = artistDetails;

    return (
        <div className={styles.pageContainer}>
            {/* --- Header Section --- */}
            <div className={styles.artistHeader}>
                <div className={styles.headerAvatar}>
                    <ArtistAvatarDisplay src={artist_avatar_url} alt={artist_name} className={styles.largeAvatar} />
                </div>
                <div className={styles.headerInfo}>
                    <p className={styles.itemType}>Artist</p>
                    <h1 className={styles.artistTitle}>{artist_name}</h1>
                    <div className={styles.metaInfo}>
                        {/* Hiển thị stats nếu có */}
                        {total_albums > 0 && <span>{total_albums} {total_albums > 1 ? 'albums' : 'album'}</span>}
                        {total_tracks > 0 && <span>{total_tracks} {total_tracks > 1 ? 'tracks' : 'track'}</span>}
                        {/* Thêm total plays nếu API trả về */}
                        {/* {artistDetails.total_plays && <span>{artistDetails.total_plays.toLocaleString()} plays</span>} */}
                    </div>
                </div>
            </div>

            {/* --- Action Bar --- */}
            <div className={styles.actionBar}>
                <button className={styles.playButtonLarge} onClick={handlePlayArtist} title={`Play top tracks by ${artist_name}`}>
                    <FiPlay />
                </button>
                <button
                    className={`${styles.iconButton} ${isArtistLiked ? styles.liked : ''}`}
                    onClick={handleLikeArtistToggle}
                    title={isArtistLiked ? "Unfollow" : "Follow"}
                >
                    <FiHeart size={24} fill={isArtistLiked ? 'currentColor' : 'none'} stroke={isArtistLiked ? 'none' : 'currentColor'} />
                </button>
                <button className={styles.iconButton} onClick={handleMoreOptions} title="More options">
                    <FiMoreHorizontal size={24} />
                </button>
            </div>

             {/* --- Section Recent Releases --- */}
             {recentAlbums.length > 0 && (
                <section className={styles.contentSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent releases</h2>
                        <Link to={`/artist/${artistId}/discography`} className={styles.viewAllLink}>View discography</Link> {/* Cần route này */}
                    </div>
                    <div className={styles.horizontalScroll}>
                        {recentAlbums.map(album => (
                            <MiniAlbumCard key={album._id} album={album} />
                        ))}
                    </div>
                </section>
             )}

            {/* --- Section Top Tracks --- */}
            {topTracks.length > 0 && (
                <section className={styles.contentSection}>
                     <div className={styles.sectionHeader}>
                        <h2>Popular Tracks</h2>
                        {/* <Link to={`/artist/${artistId}/tracks`} className={styles.viewAllLink}>View all tracks</Link> */} {/* Link này có thể không cần */}
                    </div>
                    <table className={styles.trackTable}>
                         <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.indexCol}>#</th>
                                <th className={styles.titleCol}>Title</th>
                                <th className={styles.albumCol}>Album</th>
                                <th className={styles.playsCol}>Plays</th>
                                <th className={styles.durationCol}><FiClock size={16} /></th>
                            </tr>
                        </thead>
                         <tbody>
                            {topTracks.map((track, index) => (
                                <tr key={track._id} className={styles.trackRow} onDoubleClick={() => handlePlayTrack(track, index)}>
                                    <td className={styles.trackIndex}>
                                        <span className={styles.playButtonContainer} onClick={(e) => { e.stopPropagation(); handlePlayTrack(track, index); }}> <button className={styles.playButton}><FiPlayCircle /></button> </span>
                                        <span className={styles.indexNumber}>{index + 1}</span>
                                    </td>
                                    <td className={styles.trackTitleCell}>
                                         <AlbumCoverDisplay src={track.album?.image_url} alt={track.album?.album_name} />
                                         <div className={styles.trackInfo}> <div className={styles.trackName}>{track.song_name}</div> </div>
                                     </td>
                                     <td className={styles.trackAlbumCell}>
                                         {track.album ? ( <Link to={`/album/${track.album._id}`} className={styles.tableLink} onClick={(e)=>e.stopPropagation()}> {track.album.album_name || '-'} </Link> ) : ( <span>-</span> )}
                                     </td>
                                    <td className={styles.trackPlaysCell}>{track.number_of_plays != null ? track.number_of_plays.toLocaleString() : '-'}</td> {/* Format số lượt nghe */}
                                    <td className={styles.trackDurationCell}>
                                         <span className={styles.durationText}>{formatDuration(track.duration_song)}</span>
                                         <div className={styles.trackActions}>
                                             <button onClick={(e) => handleLikeTrackToggle(e, track._id)} className={styles.actionButton} title="Save to your Liked Songs"><FiHeart size={16} /></button>
                                             <button onClick={(e) => handleAddToQueue(e, track)} className={styles.actionButton} title="Add to queue"><FiPlusSquare size={16}/></button>
                                         </div>
                                     </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

             {/* Hiển thị nếu không có album và track */}
             {!loading && recentAlbums.length === 0 && topTracks.length === 0 && (
                 <div className={styles.message}>This artist doesn't have any albums or popular tracks available right now.</div>
             )}
        </div>
    );
};

export default ArtistDetailPage;