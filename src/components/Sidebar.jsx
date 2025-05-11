// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
    FiLogIn, FiLogOut, FiUserPlus, FiUser,
    FiPlusSquare, FiGitPullRequest // <<< Icon cho Request Song
} from 'react-icons/fi';
import usePlaylistStore from '../store/playlistStore';
import styles from './Sidebar.module.css';
import CreatePlaylistModal from './CreatePlaylistModal.jsx';
import ReactModal from 'react-modal'; // <<< Import React Modal
import RequestSongForm from './RequestSongForm'; // <<< Import form request song

// --- Set App Element cho Modal ---
// Nên đặt ở file gốc App.jsx hoặc index.jsx/main.jsx để chạy 1 lần
// Tạm đặt ở đây, đảm bảo nó chạy trước khi modal render lần đầu
if (typeof window !== 'undefined') {
     const rootElement = document.getElementById('root');
     if (rootElement) {
         ReactModal.setAppElement(rootElement);
     } else {
         console.warn('Modal App Element (#root) not found.');
         ReactModal.setAppElement('body'); // Fallback
     }
}
// ----------------------------------


// <<< NHẬN PROPS isLoggedIn và handleLogout >>>
const Sidebar = ({ openSearchModal, isLoggedIn, handleLogout }) => {
  const navigate = useNavigate();
  const playlists = usePlaylistStore(state => state.playlists);
  const isLoading = usePlaylistStore(state => state.isLoading);
  const error = usePlaylistStore(state => state.error);
  const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);

  // --- State cục bộ ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isRequestSongModalOpen, setIsRequestSongModalOpen] = useState(false); // <<< State cho modal request song
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const handleMyRequestsClick = () => {
        navigate('/my-requests'); // Điều hướng đến trang My Song Requests
        setIsMenuOpen(false);
    };

  // Effect đóng menu khi click ra ngoài
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
  const handleMenuToggle = () => setIsMenuOpen(prev => !prev);
  const handleCollapseSidebar = () => { console.log("TODO: Implement Collapse Sidebar"); setIsMenuOpen(false); };
  const handleSettingsClick = () => { navigate('/settings'); setIsMenuOpen(false); };
  const handleGoBack = () => { navigate(-1); setIsMenuOpen(false); };
  const handleGoForward = () => { navigate(1); setIsMenuOpen(false); };
  const closeMenu = () => setIsMenuOpen(false);

  // Playlist Modal Handlers
  const handleOpenCreatePlaylistModal = () => { setIsCreatePlaylistModalOpen(true); };
  const handleCloseCreatePlaylistModal = () => { setIsCreatePlaylistModalOpen(false); };
  const handlePlaylistCreated = () => { fetchPlaylists(true); };

  // --- Request Song Modal Handlers --- // <<< THÊM HANDLERS MỚI
  const openRequestSongModal = () => {
    setIsRequestSongModalOpen(true);
    closeMenu(); // Đóng menu dropdown khi mở modal
  };
  const closeRequestSongModal = () => {
    setIsRequestSongModalOpen(false);
  };
  // -----------------------------------

  return (
    <> {/* <<< Bọc bởi Fragment */}
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
                      {/* <li><button onClick={handleCollapseSidebar}><FiChevronsLeft /> Collapse sidebar</button></li> */}

                      <hr className={styles.menuDivider} />
                      <li>
                            <button onClick={handleMyRequestsClick}>
                                <FiGitPullRequest /> My Song Requests
                            </button>
                      </li>
                      {/* === NÚT YÊU CẦU BÀI HÁT (Chỉ hiển thị khi đã đăng nhập) === */}
                      {isLoggedIn && ( // <<< Điều kiện hiển thị
                          <li>
                              <button onClick={openRequestSongModal}> {/* <<< Gọi hàm mở modal */}
                                  <FiPlusSquare /> New Song Request
                              </button>
                          </li>
                      )}
                      {/* ============================================================ */}

                      {/* Thêm đường kẻ phân cách nếu muốn tách biệt rõ */}
                      {isLoggedIn && <hr className={styles.menuDivider} />}

                      {/* === MỤC ĐĂNG NHẬP/ĐĂNG KÝ HOẶC TÀI KHOẢN/ĐĂNG XUẤT === */}
                      {!isLoggedIn ? (
                          <>
                              <li><Link to="/register" onClick={closeMenu}><FiUserPlus /> Register</Link></li>
                              <li><Link to="/login" onClick={closeMenu}><FiLogIn /> Login</Link></li>
                          </>
                      ) : (
                          <>
                              <li><Link to="/profile" onClick={closeMenu}><FiUser /> Profile</Link></li>
                              <li><button onClick={() => { handleLogout(); closeMenu(); }}><FiLogOut /> Logout</button></li>
                          </>
                      )}
                      {/* ======================================================= */}

                      <hr className={styles.menuDivider} />

                      {/* Mục Settings */}
                      <li><button onClick={handleSettingsClick}><FiSettings /> Settings</button></li>

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
             <NavLink to="/albums" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiDisc /> Albums </NavLink>
             <NavLink to="/songs" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiMusic /> Tracks </NavLink>
             <NavLink to="/artists" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiUsers /> Artists </NavLink>
             <NavLink to="/musicgenres" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}> <FiTag /> Genres </NavLink>
             <NavLink to="/liked-songs" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}><FiHeart /> Loves</NavLink>
        </nav>

        <hr className={styles.divider} />

        {/* Header và Actions cho Playlist */}
        <div className={styles.playlistHeader}>
           <span className={styles.playlistTitle}>Playlists</span>
           <div className={styles.playlistActions}>
             <button onClick={handleOpenCreatePlaylistModal} title="Create Playlist"> <FiPlus /> </button>
             <NavLink to="/playlists" title="View All Playlists"> <FiList /> </NavLink>
           </div>
        </div>

        {/* Danh sách Playlist (Cuộn) */}
        <div className={styles.playlistScroll}>
          {isLoading && <div className={`${styles.playlistLink} ${styles.loading}`}>Loading...</div>}
          {error && <div className={`${styles.playlistLink} ${styles.error}`}>Error: {error}</div>}
          {!isLoading && !error && playlists.length === 0 && ( <div className={`${styles.playlistLink} ${styles.empty}`}>No playlists found.</div> )}
          {!isLoading && !error && playlists.map((playlist) => ( <NavLink key={playlist._id} to={`/playlist/${playlist._id}`} className={({ isActive }) => `${styles.playlistLink} ${isActive ? styles.active : ''}`} title={playlist.playlist_name} > {playlist.playlist_name || 'Untitled Playlist'} </NavLink> ))}
        </div>
      </aside>

      {/* --- MODAL TẠO PLAYLIST --- */}
      <CreatePlaylistModal
          isOpen={isCreatePlaylistModalOpen}
          onClose={handleCloseCreatePlaylistModal}
          onCreateSuccess={handlePlaylistCreated}
      />

      {/* --- MODAL YÊU CẦU BÀI HÁT --- */} {/* <<< THÊM MODAL */}
      <ReactModal
            isOpen={isRequestSongModalOpen}
            onRequestClose={closeRequestSongModal}
            style={{ /* Style cho modal (copy từ ví dụ trước hoặc tùy chỉnh) */
                overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 },
                content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#181818', border: '1px solid #282828', borderRadius: '8px', padding: '20px', maxWidth: '500px', width: '90%', color: '#fff' } // Thêm padding và màu chữ
            }}
            contentLabel="Yêu cầu bài hát mới"
        >
           <h2 align="center">Yêu cầu bài hát</h2> {/* Thêm tiêu đề cho modal */}
           <RequestSongForm onClose={closeRequestSongModal} /> {/* Truyền hàm đóng */}
           {/* Có thể thêm nút đóng riêng nếu muốn */}
           {/* <button onClick={closeRequestSongModal} style={{ marginTop: '15px', ... }}>Đóng</button> */}
       </ReactModal>
      {/* ------------------------------ */}

    </>
  );
};

export default Sidebar;