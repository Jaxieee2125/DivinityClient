// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom'; // <<< THÊM Link
import {
    // Top Icons
    FiSearch, FiMenu, FiChevronLeft, FiChevronRight,
    // Main Nav Icons
    FiHome, FiDisc, FiMusic, FiUsers, FiTag,
    // Library/Playlist Icons
    FiPlus, FiList, FiBookOpen, FiHeart,
    // Menu Icons
    FiSettings, FiChevronsLeft, FiGithub, FiExternalLink,
    // Auth Icons (Ví dụ)
    FiLogIn, FiLogOut, FiUserPlus, FiUser
} from 'react-icons/fi';
import usePlaylistStore from '../store/playlistStore'; // Import playlist store
import styles from './Sidebar.module.css'; // Import CSS Module

// <<< THÊM PROPS isLoggedIn và handleLogout >>>
const Sidebar = ({ openSearchModal, isLoggedIn, handleLogout }) => {
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
    if (isMenuOpen) { document.addEventListener('mousedown', handleClickOutside); }
    else { document.removeEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [isMenuOpen]);

  // --- Handlers ---
  const handleSearchClick = () => { openSearchModal(); };
  const handleMenuToggle = () => setIsMenuOpen(prev => !prev); // Đảo trạng thái
  const handleCreatePlaylist = () => { console.log("Create Playlist clicked"); };
  const handleViewListToggle = () => { console.log("Toggle Playlist View clicked"); };
  const handleCollapseSidebar = () => { console.log("TODO: Implement Collapse Sidebar"); setIsMenuOpen(false); };
  const handleSettingsClick = () => { navigate('/settings'); setIsMenuOpen(false); }; // Đóng menu
  const handleGoBack = () => { navigate(-1); setIsMenuOpen(false); }; // Đóng menu
  const handleGoForward = () => { navigate(1); setIsMenuOpen(false); }; // Đóng menu

  // Hàm đóng menu (dùng cho các link/button trong menu)
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <aside className={`${styles.sidebar} ${styles.relativeContainer}`}>
      {/* Thanh điều khiển trên cùng */}
      <div className={styles.topControls}>
        <button onClick={handleSearchClick} className={styles.iconButton} title="Search"> <FiSearch /> </button>
        <button ref={menuButtonRef} onClick={handleMenuToggle} className={styles.iconButton} title="Menu"> <FiMenu /> </button>
        <button onClick={handleGoBack} className={styles.iconButton} title="Go Back"> <FiChevronLeft /> </button>
        <button onClick={handleGoForward} className={styles.iconButton} title="Go Forward"> <FiChevronRight /> </button>
      </div>

       {/* --- MENU DROPDOWN --- */}
       {isMenuOpen && (
            <div ref={menuRef} className={styles.dropdownMenu}>
                <ul>
                    {/* Các mục điều hướng cơ bản */}
                    <li><button onClick={handleGoBack}><FiChevronLeft /> Go back</button></li>
                    <li><button onClick={handleGoForward}><FiChevronRight /> Go forward</button></li>
                    <li><button onClick={handleCollapseSidebar}><FiChevronsLeft /> Collapse sidebar</button></li>

                    <hr className={styles.menuDivider} />

                    {/* === MỤC ĐĂNG NHẬP/ĐĂNG KÝ HOẶC TÀI KHOẢN/ĐĂNG XUẤT === */}
                    {!isLoggedIn ? (
                        <>
                            <li>
                                <Link to="/register" onClick={closeMenu}> {/* Đóng menu khi click */}
                                    <FiUserPlus /> Đăng ký
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" onClick={closeMenu}> {/* Đóng menu khi click */}
                                    <FiLogIn /> Đăng nhập
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/profile" onClick={closeMenu}> {/* Đổi thành trang profile */}
                                    <FiUser /> Tài khoản
                                </Link>
                            </li>
                            <li>
                                <button onClick={() => { handleLogout(); closeMenu(); }}> {/* Gọi logout và đóng menu */}
                                    <FiLogOut /> Đăng xuất
                                </button>
                            </li>
                        </>
                    )}
                    {/* ======================================================= */}

                    <hr className={styles.menuDivider} /> {/* Đường kẻ trước Settings */}

                    {/* Mục Settings */}
                    <li>
                        <button onClick={handleSettingsClick}>
                            <FiSettings /> Settings
                        </button>
                    </li>

                    <hr className={styles.menuDivider} />

                    {/* Mục Version */}
                    <li>
                       <a href="https://github.com/Jaxieee2125/musicclient" target="_blank" rel="noopener noreferrer" className={styles.versionLink}>
                            <span className={styles.versionInfo}> <FiGithub/> Version 0.1.0 </span>
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
         {/* ... các NavLink khác ... */}
         <NavLink to="/albums" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiDisc /> Albums </NavLink>
         <NavLink to="/songs" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiMusic /> Tracks </NavLink>
         <NavLink to="/artists" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiUsers /> Artists </NavLink>
         <NavLink to="/musicgenres" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiTag /> Genres </NavLink>
      </nav>

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
        {/* ... code hiển thị playlist ... */}
        {isLoading && <div className={`${styles.playlistLink} ${styles.loading}`}>Loading...</div>}
        {error && <div className={`${styles.playlistLink} ${styles.error}`}>Error: {error}</div>}
        {!isLoading && !error && playlists.length === 0 && ( <div className={`${styles.playlistLink} ${styles.empty}`}>No playlists found.</div> )}
        {!isLoading && !error && playlists.map((playlist) => ( <NavLink key={playlist._id} to={`/playlist/${playlist._id}`} className={({ isActive }) => `${styles.playlistLink} ${isActive ? styles.active : ''}`} title={playlist.playlist_name} > {playlist.playlist_name || 'Untitled Playlist'} </NavLink> ))}
      </div>
    </aside>
  );
};

export default Sidebar;