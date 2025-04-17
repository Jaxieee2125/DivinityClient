// src/App.jsx
import React, {useState} from 'react'; // Không cần import useState nếu chỉ dùng placeholder
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout'; // Sẽ tạo
import SearchModal from './components/SearchModal';


// --- Import pages ---
import HomePage from './pages/HomePage.jsx'; // Import từ pages
import SearchResultsPage from './pages/SearchResultsPage.jsx';
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

function App() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);
  return (
    <>
    <Router>
      <Routes>
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
      </Routes>
      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
    </Router>
    
    </>

  );
}

export default App;