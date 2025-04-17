// src/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import usePlayerStore from '../store/playerStore';
import { FiPlayCircle, FiClock, FiStar } from 'react-icons/fi';
import styles from './SearchResultsPage.module.css';

// Helper format duration
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// Component hiển thị Avatar nghệ sĩ với fallback
const ArtistAvatarDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false); // Reset lỗi khi src thay đổi
    }, [src]);

    return (
        <div className={styles.artistAvatarContainer}>
            {!imgError && src ? (
                <img
                    src={src}
                    alt={alt}
                    className={styles.artistAvatar}
                    onError={() => setImgError(true)}
                />
            ) : (
                <FiStar size={20} className={styles.artistAvatarPlaceholder} /> // Hiện icon sao nếu lỗi hoặc không có src
            )}
        </div>
    );
};


const SearchResultsPage = () => {
    const { query } = useParams();
    const [results, setResults] = useState({ tracks: [], albums: [], artists: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tracks');
    const navigate = useNavigate();

    const playSong = usePlayerStore(state => state.playSong);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setResults({ tracks: [], albums: [], artists: [] });
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/search/?q=${encodeURIComponent(query)}&limit=50`);
                setResults({
                    tracks: response.data.tracks || [],
                    albums: response.data.albums || [],
                    artists: response.data.artists || [],
                });
            } catch (err) {
                setError("Failed to load search results.");
                console.error("Search results page error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [query]);

    const handlePlayTrack = (track, index) => {
        playSong(track, results.tracks, index);
    };

    const handleRowClick = (path) => {
        navigate(path);
    };

    // --- Render Phần Kết Quả ---
    const renderResults = () => {
        if (loading) return <div className={styles.message}>Loading results...</div>;
        if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

        switch (activeTab) {
            case 'tracks':
                if (results.tracks.length === 0) return <div className={styles.message}>No tracks found matching "{query}".</div>;
                return (
                    <table className={`${styles.resultsTable} ${styles.trackTable}`}>
                         <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.indexCol}>#</th>
                                <th className={styles.titleCol}>Title</th>
                                <th className={styles.albumCol}>Album</th>
                                <th className={styles.durationCol}><FiClock size={16} /></th>
                            </tr>
                        </thead>
                        <tbody>
                             {results.tracks.map((track, index) => (
                                <tr key={track._id} className={styles.trackRow}>
                                    {/* --- Cột Index và Play Button --- */}
                                    <td className={styles.trackIndex}>
                                        <span className={styles.playButtonContainer}>
                                             <button onClick={() => handlePlayTrack(track, index)} className={styles.playButton} title={`Play ${track.song_name}`}> <FiPlayCircle /> </button>
                                         </span>
                                         <span className={styles.indexNumber}>{index + 1}</span>
                                    </td>
                                     {/* --- Cột Title (Ảnh, Tên, Nghệ sĩ) --- */}
                                     <td className={styles.trackTitleCell}>
                                         <img src={track.album?.image_url || '/default-album-art.png'} alt="Track cover" className={styles.trackCover} onError={(e) => {e.target.src = '/default-album-art.png'}}/>
                                         <div className={styles.trackInfo}>
                                             <div className={styles.trackName}>{track.song_name || 'Unknown Track'}</div>
                                             <div className={styles.trackArtists}>
                                                 {track.artists?.map((a, i) => (
                                                     <Link key={a._id} to={`/artist/${a._id}`} className={styles.artistLink} onClick={(e) => e.stopPropagation()}>
                                                         {a.artist_name}
                                                     </Link>
                                                 )).reduce((prev, curr, i) => [prev, (i > 0 ? ', ' : ''), curr], []) || 'Unknown Artist'}
                                             </div>
                                         </div>
                                     </td>
                                     {/* --- Cột Album --- */}
                                     <td className={styles.trackAlbumCell}>
                                         {track.album ? ( <Link to={`/album/${track.album._id}`} className={styles.trackAlbumLink}> {track.album.album_name || 'Unknown Album'} </Link> ) : ( <span>Unknown Album</span> )}
                                     </td>
                                     {/* --- Cột Duration --- */}
                                     <td className={styles.trackDurationCell}> {formatDuration(track.duration_song)} </td>
                                 </tr>
                             ))}
                         </tbody>
                    </table>
                );
            case 'albums':
                if (results.albums.length === 0) return <div className={styles.message}>No albums found matching "{query}".</div>;
                return (
                     <table className={`${styles.resultsTable} ${styles.albumTable}`}>
                        <thead>
                             <tr className={styles.tableHeader}>
                                 <th className={styles.indexCol}>#</th>
                                 <th className={styles.headerTitle}>Title</th>
                                 <th className={styles.headerAlbumArtist}>Album Artist</th>
                                 <th className={styles.headerYear}>Year</th>
                             </tr>
                         </thead>
                         <tbody>
                             {results.albums.map((album, index) => (
                                 <tr key={album._id} className={styles.albumRow} onClick={() => handleRowClick(`/album/${album._id}`)}>
                                     <td className={styles.trackIndex}>{index + 1}</td>
                                     <td className={styles.albumTitleCell}>
                                         <img src={album.image_url || '/default-album-art.png'} alt={album.album_name} className={styles.albumCover} onError={(e) => {e.target.src = '/default-album-art.png'}}/>
                                         <div className={styles.albumInfo}>
                                             <div className={styles.albumName}>{album.album_name || 'Unknown Album'}</div>
                                             <div className={styles.albumMetaArtist}>{album.artist?.artist_name || 'Unknown Artist'}</div>
                                         </div>
                                     </td>
                                     <td className={styles.albumArtistCell}>
                                        {album.artist ? (
                                            <Link to={`/artist/${album.artist._id}`} className={styles.albumArtistLink} onClick={(e) => e.stopPropagation()}>
                                                {album.artist.artist_name || 'Unknown Artist'}
                                            </Link>
                                        ) : ( <span>Unknown Artist</span> )}
                                     </td>
                                     <td className={styles.albumYearCell}>
                                         {/* API cần trả về năm (vd: từ release_time) */}
                                         {album.release_year || (album.release_time ? new Date(album.release_time).getFullYear() : '----')}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                );
            case 'artists':
                if (results.artists.length === 0) return <div className={styles.message}>No artists found matching "{query}".</div>;
                return (
                    <table className={`${styles.resultsTable} ${styles.artistTable}`}>
                         <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.indexCol}>#</th>
                                <th className={styles.headerArtistName}>Title</th>
                            </tr>
                        </thead>
                        <tbody>
                             {results.artists.map((artist, index) => (
                                 <tr key={artist._id} className={styles.artistRow} onClick={() => handleRowClick(`/artist/${artist._id}`)}>
                                     <td className={styles.trackIndex}>{index + 1}</td>
                                     <td className={styles.artistTitleCell}>
                                         <ArtistAvatarDisplay src={artist.artist_avatar_url} alt={artist.artist_name} />
                                         <div className={styles.artistInfo}>
                                             <div className={styles.artistName}>{artist.artist_name || 'Unknown Artist'}</div>
                                             <div className={styles.artistMeta}>Artist</div>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                        </tbody>
                    </table>
                );
            default:
                setActiveTab('tracks'); // Fallback về tab tracks
                return null;
        }
    };

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Search results for "{decodeURIComponent(query || '')}"</h1>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button onClick={() => setActiveTab('tracks')} className={`${styles.tabButton} ${activeTab === 'tracks' ? styles.active : ''}`}> Tracks </button>
                <button onClick={() => setActiveTab('albums')} className={`${styles.tabButton} ${activeTab === 'albums' ? styles.active : ''}`}> Albums </button>
                <button onClick={() => setActiveTab('artists')} className={`${styles.tabButton} ${activeTab === 'artists' ? styles.active : ''}`}> Artists </button>
            </div>
            {/* Kết quả */}
            <div className={styles.resultsSection}>
                {renderResults()}
            </div>
        </div>
    );
};

export default SearchResultsPage;