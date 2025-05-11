// src/pages/PlaylistDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPlaylistDetail } from '../api/apiClient'; // API function
import usePlayerStore from '../store/playerStore'; // Zustand store for player
import styles from './PlaylistDetailPage.module.css'; // CSS Module cho trang này
import AddSongsToPlaylistModal from '../components/AddSongsToPlaylistModal'; // <<< IMPORT MODAL
import { addSongsToPlaylistApi, removeSongFromPlaylistApi, deletePlaylistApi,  } from '../api/apiClient'; // API function để thêm bài hát vào playlist
import {
    FiPlay, FiHeart, FiMoreHorizontal, FiList, FiClock,
    FiPlayCircle, FiPlusSquare, FiLoader, FiTrash2, FiUsers, FiPlus // Thêm FiUsers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/admin/ConfirmationModal'; // Modal xác nhận xóa playlist
import usePlaylistStore from '../store/playlistStore';

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
    const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false); // <<< STATE MỚI
    const [deletingTrackId, setDeletingTrackId] = useState(null);
    const [isConfirmDeletePlaylistOpen, setIsConfirmDeletePlaylistOpen] = useState(false);
    const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);
    const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);

    const fetchData = useCallback(async () => { // Re-define
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

    const handleRemoveTrack = async (e, trackIdToRemove, trackName) => {
        e.stopPropagation();
        if (deletingTrackId) return; // Ngăn click nhiều lần

        // Optional: Thêm modal xác nhận ở đây nếu muốn
        // const confirm = window.confirm(`Remove "${trackName}" from this playlist?`);
        // if (!confirm) return;

        setDeletingTrackId(trackIdToRemove); // Bắt đầu loading cho track này
        const toastId = toast.loading(`Removing "${trackName}"...`);
        try {
            await removeSongFromPlaylistApi(playlistId, trackIdToRemove);
            toast.update(toastId, { render: `"${trackName}" removed from playlist.`, type: "success", isLoading: false, autoClose: 3000 });
            fetchData(); // Tải lại toàn bộ chi tiết playlist để cập nhật danh sách tracks
        } catch (err) {
            console.error("Error removing track from playlist:", err);
            const apiError = err.response?.data?.detail || err.message || "Failed to remove track.";
            toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setDeletingTrackId(null); // Kết thúc loading
        }
    };

    const openDeletePlaylistModal = (e) => {
        e.stopPropagation();
        setIsConfirmDeletePlaylistOpen(true);
    };
    const closeDeletePlaylistModal = () => {
        setIsConfirmDeletePlaylistOpen(false);
    };
    const confirmDeletePlaylist = async () => {
        if (!playlistDetails?._id) return;
        setIsDeletingPlaylist(true);
        const toastId = toast.loading(`Deleting playlist "${playlistDetails.playlist_name}"...`);
        try {
            await deletePlaylistApi(playlistDetails._id);
            toast.update(toastId, { render: `Playlist "${playlistDetails.playlist_name}" deleted.`, type: "success", isLoading: false, autoClose: 3000 });
            // Gọi fetchPlaylists từ store Sidebar để cập nhật danh sách ở đó
            if(typeof fetchPlaylists === 'function') fetchPlaylists(true); // true để force refresh
            navigate('/playlists'); // Chuyển hướng về trang danh sách playlist
        } catch (err) {
            console.error("Delete playlist error:", err);
            const apiError = err.response?.data?.detail || err.message || "Failed to delete playlist.";
            toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setIsDeletingPlaylist(false);
            setIsConfirmDeletePlaylistOpen(false); // Đóng modal sau khi xử lý
        }
    };

    const handlePlayTrack = (trackObject, index) => {
        const trackToPlay = trackObject.song || trackObject;
        const queueTracks = playlistDetails?.songs?.map(item => item.song || item) || [];
        playSong(trackToPlay, queueTracks, index);
    };

    const handleAddToQueue = (e, trackObject) => { e.stopPropagation(); const song = trackObject.song || trackObject; addToQueue(song); toast.info(`"${song.song_name}" added to queue.`); };
    const handleLikeTrackToggle = (e, trackId) => { e.stopPropagation(); console.log("TODO: Like/Unlike Track", trackId); toast.info("Like track feature not implemented yet."); };

    const openAddSongsModal = (e) => {
        e.stopPropagation();
        setIsAddSongsModalOpen(true);
    };
    const closeAddSongsModal = () => {
        setIsAddSongsModalOpen(false);
    };

    const handleAddSongsToPlaylist = async (pId, songIdsToAdd) => {
        // Hàm này được gọi từ AddSongsToPlaylistModal
        try {
            await addSongsToPlaylistApi(pId, songIdsToAdd); // Gọi API
            toast.success("Songs added to playlist!");
            fetchData(); // Tải lại dữ liệu trang chi tiết playlist
        } catch (err) {
            console.error("Error in handleAddSongsToPlaylist:", err);
            toast.error("Failed to add songs to playlist.");
            throw err; // Ném lỗi lại để modal xử lý isSubmitting
        }
    };

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
                <button className={styles.iconButton} onClick={openAddSongsModal} title="Add songs to this playlist">
                    <FiPlus size={24} /> {/* Hoặc FiMusic, FiPlusSquare */}
                </button>
                <button
                    className={`${styles.iconButton} ${styles.deletePlaylistButton}`} // Thêm class riêng nếu muốn style khác
                    onClick={openDeletePlaylistModal}
                    title="Delete this playlist"
                    disabled={isDeletingPlaylist} // Disable khi đang xóa
                >
                    <FiTrash2 size={22} />
                </button>
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
                                        </td>
                                        <td className={styles.trackActionsCell}>
                                            <div className={styles.trackActions}>
                                                 <button onClick={(e) => handleLikeTrackToggle(e, song._id)} className={styles.actionButton} title="Like"> <FiHeart size={16} /> </button>
                                                 <button onClick={(e) => handleAddToQueue(e, song)} className={styles.actionButton} title="Add to queue"> <FiPlusSquare size={16}/> </button>
                                                 {/* Nút Xóa Track khỏi Playlist */}
                                                 <button onClick={(e) => handleRemoveTrack(e, song._id, song.song_name)} className={styles.actionButton} title="Remove from this playlist" disabled={deletingTrackId === song._id} >
                                                     {deletingTrackId === song._id ? <FiLoader className={styles['animate-spin']} size={16}/> : <FiTrash2 size={16}/>}
                                                 </button>
                                             </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                <AddSongsToPlaylistModal
                        isOpen={isAddSongsModalOpen}
                        onClose={closeAddSongsModal}
                        onAddSongs={handleAddSongsToPlaylist} // Truyền hàm callback
                        playlistId={playlistId} // Truyền ID playlist hiện tại
                        // Truyền mảng ID các bài hát đã có trong playlist để modal loại trừ
                        existingSongIds={tracks.map(item => (item.song || item)._id)}
                    />
                {isConfirmDeletePlaylistOpen && (
                <ConfirmationModal
                    isOpen={isConfirmDeletePlaylistOpen}
                    onClose={closeDeletePlaylistModal}
                    onConfirm={confirmDeletePlaylist}
                    title="Delete Playlist"
                    message={`Are you sure you want to delete the playlist <strong>"${playlistDetails.playlist_name}"</strong>? This action cannot be undone.`}
                    isLoading={isDeletingPlaylist}
                />
            )}
            </div>
             {/* TODO: Pagination nếu API trả về phân trang cho tracks trong playlist */}
        </div>
    );
};

export default PlaylistDetailPage;