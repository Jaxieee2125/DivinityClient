// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    getFeaturedContent,
    getMostPlayed,
    getLibraryHighlights,
    getRecentlyAddedAlbums,
    getAlbumSongs,
    getArtistTopTracks
} from '../api/apiClient';
import usePlayerStore from '../store/playerStore';
import styles from './HomePage.module.css';
import {
    FiPlay, FiChevronLeft, FiChevronRight, FiLoader, FiDisc, FiUsers, FiList, FiMusic
} from 'react-icons/fi';
import { toast } from 'react-toastify';

// --- Component ItemCard (Đã cập nhật logic lấy ảnh) ---
const ItemCard = ({ item, type, onPlay, onNavigate }) => {
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();

    // Xác định tên, thông tin meta, và nguồn ảnh dựa trên type và item_type (nếu có)
    const currentItemType = item.item_type || type; // Ưu tiên item_type từ dữ liệu (cho LibraryHighlights)

    let coverSrcFromItem;
    let itemName = item.name || item.album_name || item.artist_name || item.song_name || 'Unknown';
    let itemMeta = '';
    let linkTo = '#';

    if (currentItemType === 'artist') {
        coverSrcFromItem = item.artist_avatar_url;
        itemMeta = 'Artist';
        linkTo = `/artist/${item._id}`;
    } else if (currentItemType === 'album') {
        coverSrcFromItem = item.image_url;
        itemMeta = `${item.release_year || (item.release_time ? new Date(item.release_time).getFullYear() : '')} • ${item.artist?.artist_name || 'Various Artists'}`;
        linkTo = `/album/${item._id}`;
    } else if (currentItemType === 'playlist') {
        coverSrcFromItem = item.image_url; // Giả sử playlist có image_url
        itemMeta = `${item.owner || 'User Playlist'}`;
        linkTo = `/playlist/${item._id}`;
    } else if (currentItemType === 'track') {
        // --- LẤY ẢNH TỪ ALBUM CỦA TRACK ---
        coverSrcFromItem = item.album?.image_url;
        // ---------------------------------
        itemMeta = `${item.artists?.map(a => a.artist_name).join(', ') || 'Various Artists'}`;
        // Tracks thường không có trang chi tiết riêng, sẽ được play trực tiếp
    }

    const defaultCover = currentItemType === 'artist' ? '/default-avatar.png' : '/default-album-art.png';

    useEffect(() => {
        setImageError(false); // Reset lỗi ảnh khi item thay đổi
    }, [item]);

    const handleImageError = () => { setImageError(true); };

    const currentCoverSrc = imageError ? defaultCover : (coverSrcFromItem || defaultCover);

    const handleCardClick = () => {
        if (onNavigate) {
            onNavigate(item, currentItemType);
        } else if (linkTo !== '#') {
            navigate(linkTo);
        }
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        onPlay(item, currentItemType);
    };

    return (
        <div className={styles.itemCard} onClick={handleCardClick}>
            <div className={styles.itemCoverWrapper}>
                <img
                    key={item._id || item.id || itemName} // Thêm key để re-mount khi item thay đổi
                    src={currentCoverSrc}
                    alt={itemName}
                    className={currentItemType === 'artist' ? styles.artistItemCover : styles.itemCover}
                    onError={handleImageError}
                    loading="lazy"
                />
                <button
                    className={styles.playButtonOverlay}
                    onClick={handlePlayClick}
                    title={`Play ${itemName}`}
                >
                    <FiPlay />
                </button>
            </div>
            <div className={styles.itemName} title={itemName}>{itemName}</div>
            <div className={styles.itemMeta}>{itemMeta}</div>
        </div>
    );
};


// --- Component CarouselSection (Giữ nguyên logic cuộn và ẩn scrollbar) ---
const CarouselSection = ({ title, items, itemType, onPlayItem, onNavigateToSection, viewAllLink }) => {
    const scrollRef = useRef(null);
    const navigate = useNavigate();
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft < (scrollWidth - clientWidth - 5));
        }
    }, []);

    useEffect(() => {
        const currentScrollRef = scrollRef.current;
        if (currentScrollRef) {
            checkScrollability();
            currentScrollRef.addEventListener('scroll', checkScrollability);
            window.addEventListener('resize', checkScrollability);
            return () => {
                currentScrollRef.removeEventListener('scroll', checkScrollability);
                window.removeEventListener('resize', checkScrollability);
            };
        }
    }, [items, checkScrollability]);


    const scroll = (direction) => { 
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.75;
            scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };


    if (!items || items.length === 0) return null;

    const navigateTo = () => {
     if (onNavigateToSection && typeof onNavigateToSection === 'function' && viewAllLink === undefined) onNavigateToSection(); else if (viewAllLink) navigate(viewAllLink); };


    const showNavButtons = canScrollLeft || canScrollRight;

    return (
        <section className={styles.carouselSection}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} onClick={navigateTo} title={viewAllLink ? `View all ${title.toLowerCase()}` : title}> {title} </h2>
                {showNavButtons && ( <div className={styles.carouselNavButtons}> <button onClick={() => scroll('left')} className={styles.navButton} title="Scroll left" disabled={!canScrollLeft}><FiChevronLeft /></button> <button onClick={() => scroll('right')} className={styles.navButton} title="Scroll right" disabled={!canScrollRight}><FiChevronRight /></button> </div> )}
            </div>
            <div className={`${styles.horizontalScroll} ${styles.hideScrollbar}`} ref={scrollRef}>
                {items.map(item => ( <ItemCard key={item._id || item.id} item={item} type={item.item_type || itemType} onPlay={onPlayItem} onNavigate={onNavigateToSection} /> ))}
            </div>
        </section>
    );
};


const HomePage = () => {
    // --- State ---
    const [featuredItem, setFeaturedItem] = useState(null);
    const [mostPlayed, setMostPlayed] = useState([]);
    const [libraryHighlights, setLibraryHighlights] = useState([]);
    const [newReleases, setNewReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playingItemId, setPlayingItemId] = useState(null);

    const navigate = useNavigate();
    const playSong = usePlayerStore(state => state.playSong);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [featuredRes, mostPlayedRes, libraryRes, newReleasesRes] = await Promise.all([
                getFeaturedContent().catch(e => { console.error("Featured Error:", e); return { data: null }; }),
                getMostPlayed({ type: 'songs', limit: 10 }).catch(e => { console.error("MostPlayed Error:", e); return { data: { results: [] } }; }),
                getLibraryHighlights({ limit: 10 }).catch(e => { console.error("LibraryHighlights Error:", e); return { data: { results: [] } }; }),
                getRecentlyAddedAlbums({ limit: 10 }).catch(e => { console.error("NewReleases Error:", e); return { data: { results: [] } }; })
            ]);

            setFeaturedItem(featuredRes.data);
            setMostPlayed(mostPlayedRes.data.results || mostPlayedRes.data || []);
            setLibraryHighlights(Array.isArray(libraryRes.data.results) ? libraryRes.data.results : []);
            setNewReleases(Array.isArray(newReleasesRes.data.results) ? newReleasesRes.data.results : []);

        } catch (err) {
            const apiError = "Failed to load some home page content.";
            setError(apiError); toast.error(apiError);
            console.error("Fetch HomePage data error:", err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Handlers ---
    const handlePlayItem = async (item, type) => {
        if (!item || !item._id || playingItemId === item._id) return;
        setPlayingItemId(item._id);
        const itemNameForToast = item.name || item.album_name || item.artist_name || item.song_name;
        const toastId = toast.loading(`Loading "${itemNameForToast}"...`);
        try {
            let tracksToPlay = []; let firstTrack;
            if (type === 'track') { tracksToPlay = [item]; firstTrack = item; }
            else if (type === 'album') { const res = await getAlbumSongs(item._id); tracksToPlay = res.data || []; firstTrack = tracksToPlay[0]; }
            else if (type === 'playlist') { /* TODO: API call */ tracksToPlay = []; firstTrack = null; toast.info("Playlist play not implemented."); }
            else if (type === 'artist') { const res = await getArtistTopTracks(item._id, { limit: 20 }); tracksToPlay = res.data || []; firstTrack = tracksToPlay[0]; }

            if (firstTrack && tracksToPlay.length > 0) {
                playSong(firstTrack, tracksToPlay, 0);
                toast.update(toastId, { render: `Playing "${firstTrack.song_name || itemNameForToast}"`, type: "success", isLoading: false, autoClose: 3000 });
            } else if (type !== 'playlist'){
                toast.update(toastId, { render: `No tracks found for "${itemNameForToast}".`, type: "warning", isLoading: false, autoClose: 3000 });
            } else { toast.dismiss(toastId); }
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Could not play item.";
            toast.update(toastId, { render: `Error: ${apiError}`, type: "error", isLoading: false, autoClose: 5000 });
        } finally { setPlayingItemId(null); }
    };

    const handleNavigateToItem = (item, type) => {
        if (!item || !item._id) return;
        if (type === 'album') navigate(`/album/${item._id}`);
        else if (type === 'artist') navigate(`/artist/${item._id}`);
        else if (type === 'playlist') navigate(`/playlist/${item._id}`);
    };

    // --- Render ---
    if (loading) return <div className={styles.message}><FiLoader className={styles.animateSpin} size={32}/> Loading Home...</div>;
    if (error && !featuredItem && mostPlayed.length === 0 && libraryHighlights.length === 0 && newReleases.length === 0) {
        return <div className={`${styles.message} ${styles.error}`}>{error}</div>;
    }

    return (
        <div className={styles.pageContainer}>
            {/* --- Hero Section --- */}
            {featuredItem && (
                <div
                    className={styles.heroSection}
                    style={{ backgroundImage: `url(${featuredItem.image_url || featuredItem.cover || '/default-banner.jpg'})` }}
                    onClick={() => handleNavigateToItem(featuredItem, featuredItem.type)}
                >
                    <img src={featuredItem.image_url || featuredItem.cover || '/default-album-art.png'} alt={featuredItem.album_name || featuredItem.playlist_name || 'Featured'} className={styles.heroCover} onError={(e)=>{e.target.style.display='none';}} />
                    <div className={styles.heroInfo}>
                        <p className={styles.heroItemType}>{featuredItem.type?.toUpperCase() || 'FEATURED'}</p> {/* Viết hoa type */}
                        <h1 className={styles.heroTitle}>{featuredItem.album_name || featuredItem.playlist_name || featuredItem.song_name || 'Featured Item'}</h1>
                        <div className={styles.heroMeta}>
                            {(featuredItem.artist || (featuredItem.artists && featuredItem.artists.length > 0)) && (
                                <Link to={`/artist/${(featuredItem.artist?._id || featuredItem.artists[0]?._id)}`} className={styles.heroArtistLink} onClick={e=>e.stopPropagation()}>
                                    {featuredItem.artist?.artist_name || featuredItem.artists[0]?.artist_name}
                                </Link>
                            )}
                            <span>{featuredItem.year || (featuredItem.release_time ? new Date(featuredItem.release_time).getFullYear() : '')}</span>
                            {featuredItem.track_count !== undefined && <span>{featuredItem.track_count} tracks</span>}
                        </div>
                        <button className={styles.heroPlayButton} onClick={(e)=>{e.stopPropagation(); handlePlayItem(featuredItem, featuredItem.type);}} disabled={playingItemId === featuredItem._id}>
                            {playingItemId === featuredItem._id ? <FiLoader className={styles.animateSpin} /> : 'Play'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- Carousels --- */}
            <CarouselSection title="Most played" items={mostPlayed} itemType="track" onPlayItem={handlePlayItem} viewAllLink="/library/songs?sort=most_played" />
            <CarouselSection title="Explore from your library" items={libraryHighlights} onPlayItem={handlePlayItem} onNavigateToSection={handleNavigateToItem} viewAllLink="/library" />
            <CarouselSection title="Newly added releases" items={newReleases} itemType="album" onPlayItem={handlePlayItem} onNavigateToSection={handleNavigateToItem} viewAllLink="/albums?sort=newest" />
        </div>
    );
};

export default HomePage;