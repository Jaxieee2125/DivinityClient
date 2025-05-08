// src/components/QueueSidebar.jsx
import React, { useState, useEffect } from 'react';
import styles from './QueueSidebar.module.css';
import usePlayerStore from '../store/playerStore';
import { FiX, FiTrash2, FiMusic } from 'react-icons/fi'; // Thêm FiMusic

// Component ảnh bìa nhỏ (có thể tách file dùng chung)
const TrackCoverDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return (
        <div className={styles.trackCoverContainer}>
            {!imgError && src ? (
                <img src={src} alt={alt || 'Cover'} className={styles.trackCover} onError={() => setImgError(true)} loading="lazy" />
            ) : (
                 <div className={styles.trackCoverPlaceholder}><FiMusic size={16}/></div>
            )}
        </div>
    );
};
// --- HOẶC IMPORT TỪ FILE KHÁC ---
// import { TrackCoverDisplay } from './TrackComponents'; // Ví dụ

// Component chính của Queue Sidebar
const QueueSidebar = ({ isOpen, onClose }) => {
    // Lấy state và actions từ Zustand
    const queue = usePlayerStore(state => state.queue);
    const currentSong = usePlayerStore(state => state.currentSong);
    const currentQueueIndex = usePlayerStore(state => state.currentQueueIndex);
    const playFromQueue = usePlayerStore(state => state.playFromQueue);
    const removeFromQueue = usePlayerStore(state => state.removeFromQueue);
    // const clearQueue = usePlayerStore(state => state.clearQueue); // Nếu muốn thêm nút Clear All

    // Hàm xử lý khi double click vào một item trong queue
    const handlePlayFromQueue = (index) => {
        playFromQueue(index);
    };

    // Hàm xử lý khi nhấn nút xóa một item
    const handleRemoveFromQueue = (e, index) => {
        e.stopPropagation(); // Ngăn double click vào hàng
        removeFromQueue(index);
    };

    return (
        // Sử dụng class `open` để điều khiển hiển thị
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.header}>
                <h2 className={styles.title}>Queue</h2>
                {/* Nút đóng có thể thêm ở đây hoặc component cha quản lý */}
                <button onClick={onClose} className={styles.closeButton} title="Close Queue">
                    <FiX />
                </button>
            </div>

            {/* Danh sách bài hát trong hàng đợi */}
            <ul className={styles.queueList}>
                {queue.length === 0 ? (
                    <li className={styles.emptyQueue}>Queue is empty. Add some songs!</li>
                ) : (
                    queue.map((trackObject, index) => {
                        // API có thể trả về { song: {...}, date_added: ... } hoặc chỉ {...}
                        const song = trackObject.song || trackObject;
                        const isCurrentlyPlaying = currentSong?._id === song?._id && currentQueueIndex === index;

                        return (
                            <li
                                key={`${song?._id}-${index}`} // Key cần duy nhất, kết hợp index nếu ID có thể trùng
                                className={`${styles.queueItem} ${isCurrentlyPlaying ? styles.playing : ''}`}
                                onDoubleClick={() => handlePlayFromQueue(index)} // Double click để play
                                title={`Double click to play ${song?.song_name || 'Unknown Song'}`}
                            >
                                {/* Ảnh bìa nhỏ */}
                                <TrackCoverDisplay src={song?.album?.image_url} alt={song?.album?.album_name}/>

                                {/* Thông tin bài hát */}
                                <div className={styles.trackInfo}>
                                    <div className={styles.trackName}>
                                        {song?.song_name || 'Unknown Track'}
                                    </div>
                                    <div className={styles.trackArtist}>
                                        {song?.artists?.map(a => a.artist_name).join(', ') || 'Unknown Artist'}
                                    </div>
                                </div>

                                {/* Nút xóa */}
                                <button
                                    onClick={(e) => handleRemoveFromQueue(e, index)}
                                    className={styles.removeButton}
                                    title="Remove from queue"
                                >
                                    <FiTrash2 size={16}/>
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>
             {/* TODO: Có thể thêm nút Clear All Queue ở đây */}
             {/* {queue.length > 0 && <button onClick={clearQueue}>Clear Queue</button>} */}
        </aside>
    );
};

export default QueueSidebar;