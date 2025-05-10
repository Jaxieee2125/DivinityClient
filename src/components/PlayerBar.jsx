// src/components/PlayerBar.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiVolume2, FiVolumeX, FiHeart, FiList, FiShuffle, FiRepeat, FiMaximize, FiMinimize, FiChevronUp, FiDownload
} from 'react-icons/fi';
import usePlayerStore from '../store/playerStore'; // Đảm bảo đường dẫn đúng
import styles from './PlayerBar.module.css'; // Đảm bảo import CSS Module
import { toast } from 'react-toastify'; // Thêm import cho toast
import { toggleUserFavouriteSongApi, checkUserFavouriteStatusApi } from '../api/apiClient';

const PlayerBar = ({ toggleQueueSidebar }) => {
  const audioRef = useRef(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateSlider, setShowRateSlider] = useState(false);
  const [isLikedLocal, setIsLikedLocal] = useState(false); // <<< State cục bộ để quản lý icon trước khi store cập nhật

  // --- State & Actions từ Zustand ---
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const volume = usePlayerStore(state => state.volume);
  const isMuted = usePlayerStore(state => state.isMuted);
  const currentTime = usePlayerStore(state => state.currentTime);
  const duration = usePlayerStore(state => state.duration);
  const togglePlayPause = usePlayerStore(state => state.togglePlayPause);
  const playNext = usePlayerStore(state => state.playNext);
  const playPrevious = usePlayerStore(state => state.playPrevious);
  const setVolume = usePlayerStore(state => state.setVolume);
  const toggleMute = usePlayerStore(state => state.toggleMute);
  const setCurrentTime = usePlayerStore(state => state.setCurrentTime);
  const setDuration = usePlayerStore(state => state.setDuration);
  const isCurrentSongLiked = usePlayerStore(state => state.isCurrentSongLiked);
  const setCurrentSongLikedStatus = usePlayerStore(state => state.setCurrentSongLikedStatus);

  useEffect(() => {
        setIsLikedLocal(isCurrentSongLiked);
    }, [isCurrentSongLiked]);

  useEffect(() => {
        const checkLikeStatus = async () => {
            if (currentSong?._id) {
                try {
                    // API này trả về object: { "song_id_string": true/false }
                    const response = await checkUserFavouriteStatusApi(currentSong._id);
                    if (response.data && response.data[currentSong._id] !== undefined) {
                        setCurrentSongLikedStatus(response.data[currentSong._id]);
                    } else {
                        setCurrentSongLikedStatus(false); // Mặc định là false nếu không có thông tin
                    }
                } catch (error) {
                    console.error("Error checking favourite status:", error);
                    setCurrentSongLikedStatus(false); // Lỗi thì coi như chưa like
                }
            } else {
                setCurrentSongLikedStatus(false); // Không có bài hát thì không like
            }
        };
        checkLikeStatus();
    }, [currentSong, setCurrentSongLikedStatus]); // Chạy khi currentSong thay đổi

  const handleLikeToggle = useCallback(async () => {
        if (!currentSong?._id) {
            toast.warn("No song is currently playing to like.");
            return;
        }
        // Cập nhật UI ngay lập tức để có phản hồi nhanh
        const newLikedStatus = !isLikedLocal;
        setIsLikedLocal(newLikedStatus); // Cập nhật state cục bộ

        try {
            const response = await toggleUserFavouriteSongApi(currentSong._id);
            // Cập nhật state trong store với giá trị từ API (để đảm bảo đồng bộ)
            setCurrentSongLikedStatus(response.data.is_favourited);
            setIsLikedLocal(response.data.is_favourited); // Đồng bộ lại state cục bộ
            toast.success(response.data.message);
        } catch (err) {
            console.error("Toggle favourite error:", err);
            toast.error("Failed to update favourite status.");
            // Quay lại trạng thái cũ nếu API lỗi
            setIsLikedLocal(!newLikedStatus);
            setCurrentSongLikedStatus(!newLikedStatus);
        }
    }, [currentSong, isLikedLocal, setCurrentSongLikedStatus]);


  const handleShuffleToggle = useCallback(() => {
    setIsShuffle(!isShuffle);
    console.log("Toggle Shuffle:", !isShuffle);
  }, [isShuffle]);

  const handleRepeatToggle = useCallback(() => {
    setRepeatMode(prevMode => {
      if (prevMode === 'none') return 'all';
      if (prevMode === 'all') return 'one';
      return 'none';
    });
  }, [setRepeatMode]);

  const toggleMiniPlayer = () => {
    setIsMiniPlayer(!isMiniPlayer);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setPosition({
      x: e.clientX - e.target.getBoundingClientRect().left,
      y: e.clientY - e.target.getBoundingClientRect().top
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - position.x;
      const newY = e.clientY - position.y;
      e.target.style.left = `${newX}px`;
      e.target.style.top = `${newY}px`;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handlePlaybackRateChange = (event) => {
    const newRate = parseFloat(event.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleRateClick = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setShowRateSlider(false);
  };

  const toggleRateSlider = (e) => {
    e.stopPropagation();
    setShowRateSlider(!showRateSlider);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          if (e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'arrowright':
          playNext();
          break;
        case 'arrowleft':
          playPrevious();
          break;
        case 'arrowup':
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'l':
          handleLikeToggle();
          break;
        case 's':
          handleShuffleToggle();
          break;
        case 'r':
          handleRepeatToggle();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, playNext, playPrevious, volume, setVolume, toggleMute, handleLikeToggle, handleShuffleToggle, handleRepeatToggle]);

  const handleDownload = useCallback(() => {
    if (!currentSong || !currentSong.file_url) {
        toast.error("No song selected or file URL is missing.");
        return;
    }

    try {
        const link = document.createElement('a');
        link.href = currentSong.file_url;

        // Tạo tên file gợi ý (ví dụ: Artist - Song Name.mp3)
        // Cần xử lý ký tự đặc biệt trong tên file
        const artistName = currentSong.artists?.[0]?.artist_name || 'Unknown Artist';
        const songName = currentSong.song_name || 'Unknown Song';
        // Lấy đuôi file từ URL
        const fileExtension = currentSong.file_url.split('.').pop() || 'mp3';
         // Làm sạch tên file, loại bỏ ký tự không hợp lệ
        const safeFilename = `${artistName} - ${songName}`.replace(/[\\/:*?"<>|]/g, '_');
        link.download = `${safeFilename}.${fileExtension}`;


        // Thêm vào DOM, click, rồi xóa đi
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Attempting download for: ${link.download}`);
        toast.success("Download started...");

    } catch (error) {
        console.error("Error initiating download:", error);
        toast.error("Could not start download.");
    }
  }, [currentSong]); // Phụ thuộc vào currentSong

  // --- USE EFFECTS ---
  useEffect(() => {
    // Sử dụng file_url (hoặc tên trường đúng từ API)
    if (audioRef.current && currentSong?.file_url) {
      const audioSource = currentSong.file_url;
      if (audioRef.current.src !== audioSource) {
        audioRef.current.src = audioSource;
        audioRef.current.load();
      }
    }
    // TODO: Cập nhật isLiked dựa trên currentSong và dữ liệu người dùng
    // Ví dụ: setIsLiked(checkIfSongIsLiked(currentSong));
  }, [currentSong]);

   useEffect(() => {
       if (!currentSong && audioRef.current) {
           if (audioRef.current.src !== '') {
               audioRef.current.pause();
               audioRef.current.src = '';
               setCurrentTime(0);
               setDuration(0);
           }
       }
   }, [currentSong, setCurrentTime, setDuration]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentSong) {
        audioRef.current.play().catch(error => console.error("Play error:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Cập nhật thuộc tính loop của thẻ audio khi repeatMode thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = (repeatMode === 'one');
    }
  }, [repeatMode]);

  // --- CALLBACKS CHO AUDIO EVENTS ---
  const handleLoadedMetadata = useCallback(() => {
      if (audioRef.current) {
          setDuration(audioRef.current.duration || 0);
      }
   }, [setDuration]);

  const handleTimeUpdate = useCallback(() => {
      if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime || 0);
      }
  }, [setCurrentTime]);

  // Xử lý khi bài hát kết thúc dựa trên repeatMode
  const handleSongEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if(audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
       playNext();
    }
  }, [repeatMode, playNext]);

  // --- CALLBACKS CHO USER INTERACTIONS ---
  const handleSeekChange = (event) => {
      const newTime = parseFloat(event.target.value);
      if (audioRef.current) {
          audioRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
  };

  const handleVolumeChange = (event) => {
      const newVolume = parseFloat(event.target.value);
      setVolume(newVolume);
  };

  const handleShowQueue = useCallback(() => {
    if(toggleQueueSidebar) { // Kiểm tra prop tồn tại
      toggleQueueSidebar(); // Gọi hàm từ App.jsx
    } else {
        console.warn("toggleQueueSidebar function not passed to PlayerBar");
    }
  }, [toggleQueueSidebar]); // Thêm dependency


  // --- HELPER ---
   const formatTime = (time) => {
    if (isNaN(time) || time === Infinity || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- RENDER ---
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showRateSlider && !e.target.closest(`.${styles.playbackRate}`)) {
        setShowRateSlider(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showRateSlider]);

  return (
    <>
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnd}
        onError={(e) => console.error("Audio Error:", e)}
      />
      
      {isMiniPlayer ? (
        <div 
          className={`${styles.miniPlayer} ${styles.fadeIn}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img
            src={currentSong?.album?.image_url || '/default-album-art.png'}
            alt={currentSong?.album?.album_name || 'Album Art'}
            className={styles.albumArt}
          />
          <div className={styles.songDetails}>
            <div className={styles.songName}>{currentSong?.song_name || 'Unknown Song'}</div>
            <div className={styles.artistName}>{currentSong?.artists?.[0]?.artist_name || 'Unknown Artist'}</div>
          </div>
          <div className={styles.controlButtons}>
            <button onClick={togglePlayPause} className={styles.playButton} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <FiPause size={16}/> : <FiPlay size={16}/>}
            </button>
            <button onClick={playNext} className={styles.controlButton} title="Next">
              <FiSkipForward size={16}/>
            </button>
            <button onClick={toggleMiniPlayer} className={styles.controlButton} title="Maximize">
              <FiMaximize size={16} />
            </button>
          </div>
        </div>
      ) : (
        <footer className={`${styles.playerBar} ${styles.slideIn}`}>
      {/* Phần Thông tin bài hát */}
      <div className={styles.songInfo}>
        {currentSong ? (
          <>
                <div className={styles.albumArtContainer}>
            <img
                    src={currentSong.album?.image_url || '/default-album-art.png'}
              alt={currentSong.album?.album_name || 'Album Art'}
              className={styles.albumArt}
              onError={(e) => { e.target.src = '/default-album-art.png'; }}
            />
                  <button onClick={handleExpandToggle} className={styles.expandButton}>
                    <FiChevronUp size={20} />
                  </button>
                </div>
            <div className={styles.songDetails}>
              <div className={styles.songName} title={currentSong.song_name}>
                {currentSong.song_name || 'Unknown Song'}
              </div>
              <div className={styles.artistName} title={currentSong.artists?.[0]?.artist_name}>
                {currentSong.artists?.[0]?.artist_name || 'Unknown Artist'}
              </div>
            </div>
            <button
                onClick={handleLikeToggle}
                className={`${styles.likeButton} ${isLikedLocal ? styles.liked : ''}`}
                title={isLikedLocal ? "Remove from Liked Songs" : "Save to Liked Songs"}
                disabled={!currentSong} // Disable nếu không có bài hát
            >
                <FiHeart fill={isLikedLocal ? 'currentColor' : 'none'} stroke={isLikedLocal ? 'currentColor' : '#b3b3b3'}/>
            </button>
            <button onClick={handleDownload} className={styles.controlButton} title="Download track" disabled={!currentSong}>
                         <FiDownload size={18} />
            </button>
          </>
        ) : (
              <div className={styles.albumArt} style={{ background: 'transparent', width: '56px', height: '56px' }}></div>
        )}
      </div>

      {/* Phần Điều khiển Chính */}
      <div className={styles.controls}>
        <div className={styles.controlButtons}>
          <button
            onClick={handleShuffleToggle}
            className={`${styles.controlButton} ${isShuffle ? styles.active : ''}`}
            title="Shuffle"
                disabled={!currentSong}
          >
            <FiShuffle size={18} />
          </button>
          <button onClick={playPrevious} className={styles.controlButton} title="Previous" disabled={!currentSong}>
            <FiSkipBack size={20}/>
          </button>
          <button onClick={togglePlayPause} className={styles.playButton} title={isPlaying ? "Pause" : "Play"} disabled={!currentSong}>
            {isPlaying ? <FiPause size={20}/> : <FiPlay size={20} className={styles.playIcon}/>}
          </button>
          <button onClick={playNext} className={styles.controlButton} title="Next" disabled={!currentSong}>
            <FiSkipForward size={20}/>
          </button>
          <button
            onClick={handleRepeatToggle}
            className={`${styles.controlButton} ${repeatMode !== 'none' ? styles.active : ''}`}
            title={`Repeat: ${repeatMode === 'none' ? 'Off' : (repeatMode === 'one' ? 'One' : 'All')}`}
                disabled={!currentSong}
          >
            <FiRepeat size={18} />
             {repeatMode === 'one' && <span className={styles.repeatOneIndicator}>1</span>}
          </button>
        </div>
        <div className={styles.seekBarContainer}>
           <span className={styles.time}>{formatTime(currentTime)}</span>
           <input
              type="range"
              min="0"
              max={duration || 1}
              value={currentTime}
              onChange={handleSeekChange}
              className={styles.seekBar}
              disabled={!currentSong || duration === 0}
                style={{ '--progress-percent': `${progressPercent}%` }}
            />
           <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Phần Điều khiển Phụ */}
      <div className={styles.extraControls}>
            <div className={styles.playbackRate}>
              <span 
                className={styles.rateText} 
                title="Playback Rate"
                onClick={toggleRateSlider}
              >
                {playbackRate}x
              </span>
              <div className={`${styles.rateSlider} ${showRateSlider ? styles.show : ''}`}>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={playbackRate}
                  onChange={handlePlaybackRateChange}
                  className={styles.rateBar}
                  style={{ '--rate-percent': `${((playbackRate - 0.5) / 1.5) * 100}%` }}
                />
                <div className={styles.rateMarks}>
                  <span onClick={() => handleRateClick(0.5)}>0.5x</span>
                  <span onClick={() => handleRateClick(0.75)}>0.75x</span>
                  <span onClick={() => handleRateClick(1)}>1x</span>
                  <span onClick={() => handleRateClick(1.25)}>1.25x</span>
                  <span onClick={() => handleRateClick(1.5)}>1.5x</span>
                  <span onClick={() => handleRateClick(1.75)}>1.75x</span>
                  <span onClick={() => handleRateClick(2)}>2x</span>
                </div>
              </div>
            </div>
         <button onClick={handleShowQueue} className={styles.controlButton} title="Queue">
            <FiList size={18} />
         </button>
         <div className={styles.volumeControls}>
            <button onClick={toggleMute} className={styles.volumeButton} title={isMuted ? "Unmute" : "Mute"}>
               {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18}/>}
            </button>
            <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={isMuted ? 0 : volume}
               onChange={handleVolumeChange}
               className={styles.volumeBar}
                style={{ '--volume-percent': `${volumePercent}%` }}
             />
         </div>
            <button 
              onClick={toggleMiniPlayer} 
              className={`${styles.controlButton} ${styles.tooltip}`}
              title="Mini Player"
            >
              <FiMinimize size={18} />
              <span className={styles.tooltipText}>Mini Player (Ctrl+M)</span>
            </button>
      </div>
    </footer>
      )}
    </>
  );
};

export default PlayerBar;