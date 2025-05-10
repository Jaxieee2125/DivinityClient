// src/components/modals/AddSongsToPlaylistModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './AddSongsToPlaylistModal.module.css';
import { FiX, FiSearch } from 'react-icons/fi';
import { getSongs } from '../api/apiClient'; // API lấy tất cả bài hát
import { toast } from 'react-toastify';

const AddSongsToPlaylistModal = ({ isOpen, onClose, onAddSongs, playlistId, existingSongIds = [] }) => {
    const [allSongs, setAllSongs] = useState([]);
    const [filteredSongs, setFilteredSongs] = useState([]);
    const [selectedSongIds, setSelectedSongIds] = useState(new Set()); // Dùng Set để quản lý ID đã chọn
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch tất cả bài hát khi modal mở
    const fetchAllAvailableSongs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API getSongs cần trả về artist/album lồng nhau để hiển thị
            const response = await getSongs({ limit: 1000 }); // Lấy nhiều bài (cần pagination nếu quá lớn)
            const available = (response.data.results || response.data || []).filter(
                song => !existingSongIds.includes(song._id) // Loại bỏ các bài đã có trong playlist
            );
            setAllSongs(available);
            setFilteredSongs(available); // Ban đầu hiển thị tất cả
        } catch (err) {
            console.error("Error fetching all songs:", err);
            setError("Failed to load songs to add.");
            toast.error("Failed to load songs.");
        } finally { setLoading(false); }
    }, [existingSongIds]); // Fetch lại nếu existingSongIds thay đổi

    useEffect(() => {
        if (isOpen) {
            fetchAllAvailableSongs();
            setSelectedSongIds(new Set()); // Reset khi mở
            setSearchTerm('');
        }
    }, [isOpen, fetchAllAvailableSongs]);

    // Lọc bài hát dựa trên searchTerm
    useEffect(() => {
        if (!searchTerm) {
            setFilteredSongs(allSongs);
            return;
        }
        const lowerSearch = searchTerm.toLowerCase();
        setFilteredSongs(
            allSongs.filter(song =>
                song.song_name?.toLowerCase().includes(lowerSearch) ||
                song.artists?.some(a => a.artist_name?.toLowerCase().includes(lowerSearch)) ||
                song.album?.album_name?.toLowerCase().includes(lowerSearch)
            )
        );
    }, [searchTerm, allSongs]);

    const handleToggleSelectSong = (songId) => {
        setSelectedSongIds(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(songId)) {
                newSelected.delete(songId);
            } else {
                newSelected.add(songId);
            }
            return newSelected;
        });
    };

    const handleSubmit = async () => {
        if (selectedSongIds.size === 0) {
            toast.warn("Please select at least one song to add.");
            return;
        }
        setSubmitting(true);
        try {
            await onAddSongs(playlistId, Array.from(selectedSongIds)); // Gọi hàm từ cha
            toast.success(`${selectedSongIds.size} song(s) added to playlist!`);
            onClose(); // Đóng modal sau khi thành công
        } catch (err) {
            console.error("Error adding songs to playlist:", err);
            toast.error("Failed to add songs. Please try again.");
            // Không đóng modal nếu lỗi để user thử lại
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!submitting ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    Add Songs to Playlist
                    <button onClick={onClose} className={styles.closeButton} title="Close" disabled={submitting}><FiX /></button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.searchInputContainer}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search songs to add..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                            disabled={loading || submitting}
                        />
                    </div>

                    <div className={styles.songListContainer}>
                        {loading && <div className={styles.message}>Loading songs...</div>}
                        {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
                        {!loading && filteredSongs.length === 0 && (
                            <div className={styles.message}>
                                {searchTerm ? `No songs found matching "${searchTerm}".` : "No more songs to add or all songs loaded."}
                            </div>
                        )}
                        {!loading && filteredSongs.length > 0 && (
                            <table className={styles.songTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.checkboxCell}></th>
                                        <th>Title</th>
                                        <th>Artist(s)</th>
                                        <th>Album</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSongs.map(song => (
                                        <tr
                                            key={song._id}
                                            onClick={() => handleToggleSelectSong(song._id)}
                                            className={selectedSongIds.has(song._id) ? styles.selectedRow : ''}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <td className={styles.checkboxCell}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSongIds.has(song._id)}
                                                    onChange={() => handleToggleSelectSong(song._id)}
                                                    onClick={(e) => e.stopPropagation()} // Ngăn click vào hàng
                                                />
                                            </td>
                                            <td className={styles.titleCell}>
                                                <img src={song.album?.image_url || '/default-album-art.png'} alt="" className={styles.coverArt}/>
                                                <div>
                                                    <div className={styles.songName}>{song.song_name}</div>
                                                </div>
                                            </td>
                                            <td><div className={styles.artistName}>{song.artists?.map(a => a.artist_name).join(', ') || '-'}</div></td>
                                            <td><div className={styles.albumName}>{song.album?.album_name || '-'}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <span className={styles.selectedCount}>{selectedSongIds.size} song(s) selected</span>
                    <div className={styles.actionButtons}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={submitting}>Cancel</button>
                        <button type="button" onClick={handleSubmit} className={styles.addButton} disabled={submitting || selectedSongIds.size === 0}>
                            {submitting ? 'Adding...' : 'Add to Playlist'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSongsToPlaylistModal;