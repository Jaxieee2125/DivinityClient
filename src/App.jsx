// src/App.jsx
import React from 'react'; // Không cần import useState nếu chỉ dùng placeholder
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout'; // Sẽ tạo


// --- Import pages ---
import HomePage from './pages/HomePage.jsx'; // Import từ pages
// --- Tạm thời giữ các placeholder khác ---
const ArtistsPage = () => <div className="p-4">Artists Page Content</div>;
const AlbumsPage = () => <div className="p-4">Albums Page Content</div>;
const PlaylistsPage = () => <div className="p-4">Playlists Page Content</div>;
const SearchPage = () => <div className="p-4">Search Page Content</div>;
const SettingsPage = () => <div className="p-4">Settings Page Content</div>;
// --- End Placeholders ---

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Sử dụng HomePage đã import */}
          <Route index element={<HomePage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;