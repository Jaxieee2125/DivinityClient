// src/App.jsx
import React, {useState} from 'react'; // Không cần import useState nếu chỉ dùng placeholder
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout'; // Sẽ tạo
import AdminLayout from './layouts/AdminLayout.jsx';
import SearchModal from './components/SearchModal';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';

// --- Import pages ---
import HomePage from './pages/HomePage.jsx'; // Import từ pages
import SearchResultsPage from './pages/SearchResultsPage.jsx';
// --- Import các trang Đăng nhập/Đăng ký User --- // <<< THÊM IMPORT
import LoginPage from './pages/LoginPage.jsx';       // <<< THÊM IMPORT
import RegisterPage from './pages/RegisterPage.jsx'; // <<< THÊM IMPORT
// --- Tạm thời giữ các placeholder khác ---
const ArtistsPage = () => <div className="p-4">Artists Page Content</div>;
const AlbumsPage = () => <div className="p-4">Albums Page Content</div>;
const PlaylistsPage = () => <div className="p-4">Playlists Page Content</div>;
const SearchPage = () => <div className="p-4">Search Page Content</div>;
const SettingsPage = () => <div className="p-4">Settings Page Content</div>;
const SongsPage = () => <div className="p-4">Songs Page Content</div>;
const MusicGenresPage = () => <div className="p-4">Music Genres Page Content</div>;
const PlaylistDetailPage = () => <div className="p-4">Playlist Detail Page</div>;
const AlbumDetailPage = () => <div className="p-4">Album Detail Page</div>;
const ArtistDetailPage = () => <div className="p-4">Artist Detail Page</div>;
// --- End Placeholders ---
// Admin Pages (Import các trang admin bạn vừa tạo)
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageSongs from './pages/admin/ManageSongs.jsx'; // Ví dụ
import ManageArtists from './pages/admin/ManageArtists.jsx'; // Ví dụ
import ManageAlbums from './pages/admin/ManageAlbums.jsx'; // Ví dụ
import ManageUsers from './pages/admin/ManageUsers.jsx'; // Ví dụ
import ManageGenres from './pages/admin/ManageMusicGenres.jsx'; // Ví dụ

function App() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);
  return (
    <>
    <Router>
      <Routes>
        {/* Các Route chính của User (có thể cần bảo vệ sau này) */}
        <Route path="/" element={<MainLayout openSearchModal={openSearchModal} />}>
          {/* Sử dụng HomePage đã import */}
          <Route index element={<HomePage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="songs" element={<SongsPage />} />
          <Route path="musicgenres" element={<MusicGenresPage />} />
          <Route path="search/:query" element={<SearchResultsPage />} /> {/* Route cho trang kết quả chi tiết */}
          <Route path="playlist/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="album/:albumId" element={<AlbumDetailPage />} />
          <Route path="artist/:artistId" element={<ArtistDetailPage />} />
        </Route>

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
        </Route>

        {/* --- THÊM CÁC ROUTE ĐĂNG NHẬP/ĐĂNG KÝ USER --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* ------------------------------------------------- */}

         {/* Optional: Bạn có thể thêm Route 404 Not Found ở cuối */}
         {/* <Route path="*" element={<div>404 Page Not Found</div>} /> */}

      </Routes>
      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
    </Router>

    </>
  );
}

export default App;