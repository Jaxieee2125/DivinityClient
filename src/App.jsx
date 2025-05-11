// src/App.jsx
import React, {useState} from 'react'; // Không cần import useState nếu chỉ dùng placeholder
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout'; // Sẽ tạo
import AdminLayout from './layouts/AdminLayout.jsx';
import SearchModal from './components/SearchModal';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AlbumDetailPage from './pages/AlbumDetailPage.jsx'; // Import từ pages
import SongsPage from './pages/SongsPage.jsx'; // Import từ pages
import ArtistDetailPage from './pages/ArtistDetailPage.jsx'; // Import từ pages
import MusicGenresPage from './pages/MusicGenresPage.jsx'; // Import từ pages
import MusicGenreDetailPage from './pages/MusicGenreDetailPage.jsx';
import QueueSidebar from './components/QueueSidebar.jsx';

// --- Import pages ---
import HomePage from './pages/HomePage.jsx'; // Import từ pages
import AlbumsPage from './pages/AlbumsPage.jsx'; // Import từ pages
import SearchResultsPage from './pages/SearchResultsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx'; // Import từ pages
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'; // Import từ pages
import EditProfilePage from './pages/EditProfilePage.jsx'; // Import từ pages

// --- Import các trang Đăng nhập/Đăng ký User --- // <<< THÊM IMPORT
import LoginPage from './pages/LoginPage.jsx';       // <<< THÊM IMPORT
import RegisterPage from './pages/RegisterPage.jsx'; // <<< THÊM IMPORT
// --- Tạm thời giữ các placeholder khác ---
import ArtistsPage from './pages/ArtistsPage.jsx'; // Import từ pages
import PlaylistsPage from './pages/PlaylistsPage.jsx'; // Import từ pages
const SettingsPage = () => <div className="p-4">Settings Page Content</div>;
import PlaylistDetailPage from './pages/PlaylistDetailPage.jsx'; // Import từ pages
// --- End Placeholders ---
// Admin Pages (Import các trang admin bạn vừa tạo)
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageSongs from './pages/admin/ManageSongs.jsx'; // Ví dụ
import ManageArtists from './pages/admin/ManageArtists.jsx'; // Ví dụ
import ManageAlbums from './pages/admin/ManageAlbums.jsx'; // Ví dụ
import ManageUsers from './pages/admin/ManageUsers.jsx'; // Ví dụ
import ManageGenres from './pages/admin/ManageMusicGenres.jsx'; // Ví dụ
import ManageSongRequests from './pages/admin/ManageSongRequests.jsx'; // Ví dụ
import MySongRequestsPage from './pages/MySongRequestsPage.jsx'; // <<< THÊM IMPORT
import LikedSongsPage from './pages/LikedSongsPage.jsx'; // <<< THÊM IMPORT

function App() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isQueueSidebarOpen, setIsQueueSidebarOpen] = useState(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  // --- HÀM MỚI ĐỂ TOGGLE QUEUE ---
  const toggleQueueSidebar = () => {
    setIsQueueSidebarOpen(prev => !prev);
  };
  const closeQueueSidebar = () => {
      setIsQueueSidebarOpen(false);
  }

  return (
    <>
    <Router>
      <Routes>
        {/* Các Route chính của User (có thể cần bảo vệ sau này) */}
        <Route path="/" element={<MainLayout openSearchModal={openSearchModal} />}></Route>
        <Route path="/" element={<MainLayout openSearchModal={openSearchModal} toggleQueueSidebar={toggleQueueSidebar} />}>
          {/* Sử dụng HomePage đã import */}
          <Route index element={<HomePage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          
          <Route path="settings" element={<SettingsPage />} />
          <Route path="songs" element={<SongsPage />} />
          <Route path="musicgenre/:genreId" element={<MusicGenreDetailPage />} />
          <Route path="musicgenres" element={<MusicGenresPage />} />
          <Route path="search/:query" element={<SearchResultsPage />} /> {/* Route cho trang kết quả chi tiết */}
          <Route path="playlist/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="album/:albumId" element={<AlbumDetailPage />} />
          <Route path="artist/:artistId" element={<ArtistDetailPage />} />
          <Route path="liked-songs" element={<LikedSongsPage />} />
          {/* Route cho trang cá nhân (Profile) */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="my-requests" element={<MySongRequestsPage />} /> {/* <<< THÊM ROUTE NÀY */}
        </Route>
        {/* Route cho trang cá nhân (Profile) */}
        
        <Route path="profile/change-password" element={<ChangePasswordPage />} />

        {/* Route Đăng nhập Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Các Route Admin (đã có kiểm tra đăng nhập trong AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="songs" element={<ManageSongs />} />
            <Route path="artists" element={<ManageArtists />} />
            <Route path="albums" element={<ManageAlbums />} />
            <Route path="genres" element={<ManageGenres />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="song-requests" element={<ManageSongRequests />} />
        </Route>

        {/* --- THÊM CÁC ROUTE ĐĂNG NHẬP/ĐĂNG KÝ USER --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* ------------------------------------------------- */}

         {/* Optional: Bạn có thể thêm Route 404 Not Found ở cuối */}
         {/* <Route path="*" element={<div>404 Page Not Found</div>} /> */}

      </Routes>
      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
      <QueueSidebar isOpen={isQueueSidebarOpen} onClose={closeQueueSidebar} />
    </Router>

    </>
  );
}

export default App;