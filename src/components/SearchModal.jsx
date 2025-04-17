// src/components/SearchModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { FiPlayCircle, FiPlus } from 'react-icons/fi'; // Icons cho actions
import apiClient from '../api/apiClient'; // Import trực tiếp hoặc hàm search cụ thể
import usePlayerStore from '../store/playerStore'; // Để play/add queue
import styles from './SearchModal.module.css';

// Hook debounce đơn giản
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ albums: [], tracks: [], artists: [] }); // Giữ cấu trúc từ API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null); // Ref cho input
  const modalRef = useRef(null); // Ref cho modal để đóng khi click ngoài (nếu cần)

  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Delay 300ms

  const playSong = usePlayerStore(state => state.playSong);
  const addToQueue = usePlayerStore(state => state.addToQueue);

  // Hàm gọi API tìm kiếm
  const fetchSearchResults = useCallback(async (query) => {
    if (!query.trim()) {
      setResults({ albums: [], tracks: [], artists: [] }); // Xóa kết quả nếu query rỗng
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Gọi API backend - Cần tạo endpoint này
      const response = await apiClient.get(`/search/?q=${encodeURIComponent(query)}`);
      // API nên trả về cấu trúc { albums: [...], tracks: [...], artists: [...] }
      setResults({
          albums: response.data.albums || [],
          tracks: response.data.tracks || [],
          artists: response.data.artists || [],
      });
    } catch (err) {
      console.error("Search API error:", err);
      setError("Failed to fetch search results.");
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback để tránh tạo lại hàm không cần thiết

  // Effect để gọi API khi debouncedSearchQuery thay đổi
  useEffect(() => {
    fetchSearchResults(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchSearchResults]);

  // Focus input khi modal mở
  useEffect(() => {
    if (isOpen) {
      // Timeout nhỏ để đảm bảo modal đã render xong trước khi focus
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
        // Reset khi đóng modal
        setSearchQuery('');
        setResults({ albums: [], tracks: [], artists: [] });
        setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearInput = () => {
    setSearchQuery('');
    inputRef.current?.focus(); // Focus lại sau khi xóa
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault(); // Ngăn submit form (nếu có)
      onClose(); // Đóng modal
      // Chuyển đến trang search với query
      // TODO: Cần tạo route và page /search/:query hoặc tương tự
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
    } else if (e.key === 'Escape') {
      onClose(); // Đóng modal khi nhấn Escape
    }
  };

  // TODO: Implement play/add actions for results
  const handlePlayTrack = (track, index) => {
      // Tạo queue tạm thời từ kết quả track
      playSong(track, results.tracks, index);
      onClose(); // Đóng modal sau khi play
  };

  const handleAddTrackToQueue = (track) => {
      addToQueue(track);
      // Có thể thêm thông báo nhỏ "Added to queue"
  };

  const handleAlbumClick = (albumId) => {
      navigate(`/album/${albumId}`); // Điều hướng đến trang album
      onClose();
  };
    const handleArtistClick = (artistId) => {
      navigate(`/artist/${artistId}`); // Điều hướng đến trang nghệ sĩ
      onClose();
  };


  // Đóng modal khi click ra ngoài (tùy chọn)
  // useEffect(() => {
  //     const handleClickOutside = (event) => {
  //         if (modalRef.current && !modalRef.current.contains(event.target)) {
  //             onClose();
  //         }
  //     };
  //     if (isOpen) {
  //         document.addEventListener('mousedown', handleClickOutside);
  //     }
  //     return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, [isOpen, onClose]);


  // Render component
  if (!isOpen) {
    return null; // Không render gì nếu modal đóng
  }

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}> {/* Click overlay để đóng */}
      {/* Ngăn sự kiện click lan tỏa từ modal lên overlay */}
      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className={styles.searchInputContainer}>
          <FiSearch className={styles.searchIcon} size={22} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for songs, albums, artists..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Xử lý Enter/Escape
          />
          {searchQuery && (
            <button onClick={clearInput} className={styles.clearButton} title="Clear search">
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className={styles.resultsContainer}>
          {isLoading && <div className={styles.loading}>Searching...</div>}
          {error && <div className={`${styles.error}`}>{error}</div>}
          {!isLoading && !error && debouncedSearchQuery.trim() && !results.albums.length && !results.tracks.length && !results.artists.length && (
              <div className={styles.noResults}>No results found for "{debouncedSearchQuery}"</div>
          )}

          {/* Hiển thị kết quả Albums */}
          {!isLoading && !error && results.albums.length > 0 && (
            <>
              <div className={styles.categoryTitle}>Albums</div>
              <ul>
                {results.albums.map(album => (
                  <li key={album._id} className={styles.resultItem} onClick={() => handleAlbumClick(album._id)}>
                    <img src={album.image_url || '/default-album-art.png'} alt={album.album_name} className={styles.itemCover} onError={(e) => {e.target.src = '/default-album-art.png'}}/>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{album.album_name}</div>
                      <div className={styles.itemMeta}>Album • {album.artist?.artist_name || 'Unknown Artist'}</div>
                    </div>
                    {/* Có thể thêm nút Play Album ở đây */}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Hiển thị kết quả Tracks */}
          {!isLoading && !error && results.tracks.length > 0 && (
            <>
              <div className={styles.categoryTitle}>Tracks</div>
              <ul>
                {results.tracks.map((track, index) => (
                  <li key={track._id} className={styles.resultItem}>
                    <img src={track.album?.image_url || '/default-album-art.png'} alt="Track cover" className={styles.itemCover} onError={(e) => {e.target.src = '/default-album-art.png'}}/>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{track.song_name}</div>
                      <div className={styles.itemMeta}>Song • {track.artists?.map(a => a.artist_name).join(', ') || 'Unknown Artist'}</div>
                    </div>
                    <div className={styles.itemActions}>
                         <button onClick={() => handleAddTrackToQueue(track)} className={styles.actionButton} title="Add to queue">
                             <FiPlus size={18}/>
                         </button>
                         <button onClick={() => handlePlayTrack(track, index)} className={styles.actionButton} title="Play">
                             <FiPlayCircle size={20}/>
                         </button>
                     </div>
                  </li>
                ))}
              </ul>
            </>
          )}

           {/* Hiển thị kết quả Artists */}
           {!isLoading && !error && results.artists.length > 0 && (
            <>
              <div className={styles.categoryTitle}>Artists</div>
              <ul>
                {results.artists.map(artist => (
                  <li key={artist._id} className={styles.resultItem} onClick={() => handleArtistClick(artist._id)}>
                    <img src={artist.artist_avatar_url || '/default-avatar.png'} alt={artist.artist_name} className={`${styles.itemCover} ${styles.artist}`} onError={(e) => {e.target.src = '/default-avatar.png'}}/>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName}>{artist.artist_name}</div>
                      <div className={styles.itemMeta}>Artist</div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SearchModal;