// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getSongs } from '../api/apiClient';
import usePlayerStore from '../store/playerStore';
import { FiPlayCircle, FiPlusSquare } from 'react-icons/fi';
// import styles from './HomePage.module.css';

const HomePage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chỉ lấy action playSong
  const playSong = usePlayerStore(state => state.playSong);
  const addToQueue = usePlayerStore(state => state.addToQueue); // Vẫn giữ nếu cần

  useEffect(() => {
    // ... fetchSongs logic giữ nguyên ...
     const fetchSongs = async () => {
          try {
            setLoading(true);
            const response = await getSongs();
            setSongs(response.data);
            setError(null);
          } catch (err) {
            console.error("Error fetching songs:", err);
            setError("Failed to load songs.");
          } finally {
            setLoading(false);
          }
        };
        fetchSongs();
  }, []);

  if (loading) return <div className="text-center p-10">Loading songs...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (songs.length === 0) return <div className="text-center p-10">No songs found.</div>;

  // Hàm xử lý khi nhấn Play
  const handlePlay = (songToPlay, index) => {
    // Truyền bài hát, toàn bộ danh sách hiện tại, và index của bài hát đó
    playSong(songToPlay, songs, index);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Songs</h1>
      <ul className="space-y-2">
        {/* Truyền index vào map */}
        {songs.map((song, index) => (
          <li
            key={song._id}
            className="flex items-center justify-between p-3 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors duration-150"
          >
            <div>
              <div className="font-medium text-white">{song.song_name}</div>
              <div className="text-sm text-neutral-400">{song.artist_name}</div>
            </div>
            <div className="flex items-center space-x-3">
               <button
                 onClick={() => addToQueue(song)}
                 title="Add to Queue"
                 className="text-neutral-400 hover:text-white"
               >
                   <FiPlusSquare size={20} />
               </button>
               <button
                 // Gọi handlePlay với bài hát và index hiện tại
                 onClick={() => handlePlay(song, index)}
                 title="Play Song"
                 className="text-green-400 hover:text-green-300"
               >
                 <FiPlayCircle size={24} />
               </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HomePage;