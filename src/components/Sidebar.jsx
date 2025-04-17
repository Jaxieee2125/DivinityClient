// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    // Top Icons
    FiSearch, FiMenu, FiChevronLeft, FiChevronRight,
    // Main Nav Icons
    FiHome, FiDisc, FiMusic, FiUsers, FiTag,
    // Library/Playlist Icons
    FiPlus, FiList, FiBookOpen, FiHeart,
    // Menu Icons
    FiSettings, FiChevronsLeft, FiGithub, FiExternalLink
} from 'react-icons/fi';
import usePlaylistStore from '../store/playlistStore'; // Import playlist store
import styles from './Sidebar.module.css'; // Import CSS Module

const Sidebar = ({openSearchModal}) => {
  const navigate = useNavigate();

  // --- State & Actions từ Playlist Store ---
  const playlists = usePlaylistStore(state => state.playlists);
  const isLoading = usePlaylistStore(state => state.isLoading);
  const error = usePlaylistStore(state => state.error);
  const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);

  // --- State cục bộ cho Menu ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // Ref cho dropdown menu
  const menuButtonRef = useRef(null); // Ref cho nút mở menu

  // Fetch playlists khi component mount
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Effect để đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target) && menuButtonRef.current && !menuButtonRef.current.contains(event.target) ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // --- Handlers ---
  const handleSearchClick = () => {
    openSearchModal(); // Gọi hàm để mở modal
  };
  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen); // Toggle menu
  const handleCreatePlaylist = () => { console.log("Create Playlist clicked"); /* TODO: Implement Create Playlist */ };
  const handleViewListToggle = () => { console.log("Toggle Playlist View clicked"); /* TODO: Implement View Toggle */ };
  const handleCollapseSidebar = () => { console.log("TODO: Implement Collapse Sidebar"); /* TODO: Implement Collapse */ setIsMenuOpen(false); };
  const handleSettingsClick = () => { navigate('/settings'); setIsMenuOpen(false); };
  const handleGoBack = () => { navigate(-1); setIsMenuOpen(false); };
  const handleGoForward = () => { navigate(1); setIsMenuOpen(false); };

  return (
    // Thêm position: relative để định vị menu con
    <aside className={`${styles.sidebar} ${styles.relativeContainer}`}>
      {/* Thanh điều khiển trên cùng */}
      <div className={styles.topControls}>
        <button onClick={handleSearchClick} className={styles.iconButton} title="Search"> <FiSearch /> </button>
        {/* Gắn ref và onClick mới cho nút Menu */}
        <button ref={menuButtonRef} onClick={handleMenuToggle} className={styles.iconButton} title="Menu"> <FiMenu /> </button>
        <button onClick={handleGoBack} className={styles.iconButton} title="Go Back"> <FiChevronLeft /> </button>
        <button onClick={handleGoForward} className={styles.iconButton} title="Go Forward"> <FiChevronRight /> </button>
      </div>

       {/* --- MENU DROPDOWN --- */}
       {isMenuOpen && (
            // Gắn ref vào đây
            <div ref={menuRef} className={styles.dropdownMenu}>
                <ul>
                    <li>
                        {/* Sử dụng handler đã tạo */}
                        <button onClick={handleGoBack}>
                            <FiChevronLeft /> Go back
                        </button>
                    </li>
                    <li>
                        {/* Sử dụng handler đã tạo */}
                        <button onClick={handleGoForward}>
                            <FiChevronRight /> Go forward
                        </button>
                    </li>
                     <li>
                        <button onClick={handleCollapseSidebar}>
                            <FiChevronsLeft /> Collapse sidebar
                        </button>
                    </li>
                    <hr className={styles.menuDivider} /> {/* Đường kẻ phân cách */}
                    <li>
                        <button onClick={handleSettingsClick}>
                            <FiSettings /> Settings
                        </button>
                    </li>
                    {/* Bỏ phần Manage Servers và Select Server */}
                    <hr className={styles.menuDivider} />
                    <li> {/* Chỉ cần 1 li bao ngoài */}
                       <a
                          href="https://github.com/Jaxieee2125/musicclient" // Link repo
                          target="_blank"       // Mở tab mới
                          rel="noopener noreferrer" // Bảo mật và hiệu suất
                          className={styles.versionLink} // Dùng class CSS riêng cho link này
                          title="Open GitHub Repository"
                       >
                            {/* Phần bên trái */}
                            <span className={styles.versionInfo}>
                                <FiGithub/> Version 0.1.0 {/* Version của bạn */}
                            </span>
                             {/* Phần bên phải (icon link ngoài) */}
                            <FiExternalLink />
                       </a>
                    </li>
                </ul>
            </div>
        )}
       {/* ------------------- */}


      {/* Điều hướng chính */}
      <nav className={styles.mainNav}>
         <NavLink to="/" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiHome /> Home </NavLink>
         <NavLink to="/albums" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiDisc /> Albums </NavLink>
         <NavLink to="/songs" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiMusic /> Tracks </NavLink>
         <NavLink to="/artists" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiUsers /> Artists </NavLink>
         <NavLink to="/musicgenres" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiTag /> Genres </NavLink>
      </nav>

      {/* Đường kẻ phân cách */}
      <hr className={styles.divider} />

      {/* Header và Actions cho Playlist */}
      <div className={styles.playlistHeader}>
         <span className={styles.playlistTitle}>Playlists</span>
         <div className={styles.playlistActions}>
           <button onClick={handleCreatePlaylist} title="Create Playlist"> <FiPlus /> </button>
           <button onClick={handleViewListToggle} title="View Options"> <FiList /> </button>
         </div>
      </div>

      {/* Danh sách Playlist (Cuộn) */}
      <div className={styles.playlistScroll}>
        {isLoading && <div className={`${styles.playlistLink} ${styles.loading}`}>Loading...</div>}
        {error && <div className={`${styles.playlistLink} ${styles.error}`}>Error: {error}</div>} {/* Hiển thị lỗi cụ thể */}
        {!isLoading && !error && playlists.length === 0 && (
          <div className={`${styles.playlistLink} ${styles.empty}`}>No playlists found.</div>
        )}
        {!isLoading && !error && playlists.map((playlist) => (
          <NavLink
            key={playlist._id}
            to={`/playlist/${playlist._id}`} // Cần định nghĩa route này
            className={({ isActive }) => `${styles.playlistLink} ${isActive ? styles.active : ''}`}
            title={playlist.playlist_name}
          >
            {playlist.playlist_name || 'Untitled Playlist'}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;