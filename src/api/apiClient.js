// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // !!! CHỈNH SỬA NẾU CẦN !!!
});

// --- Interceptor để thêm Token (Ví dụ - Cần điều chỉnh theo cách lưu token của bạn) ---
apiClient.interceptors.request.use(
  (config) => {
    // Chỉ thêm token cho các request API cần bảo vệ (ví dụ: không phải /token/)
    const token = localStorage.getItem('adminAuthToken'); // <<< Key đúng
    if (token && config.url !== '/token/' && config.url !== '/token/refresh/') {
      config.headers['Authorization'] = `Bearer ${token}`; // <<< Header đúng
    }
    console.log("API Request:", config.method.toUpperCase(), config.url, "Headers:", config.headers); // Log để debug
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
/**
* Gửi yêu cầu đăng nhập admin đến backend.
* @param {string} username
* @param {string} password
* @returns {Promise<object>} Promise chứa response từ API (bao gồm access và refresh tokens).
*/
export const loginAdmin = (username, password) => {
   console.log("Attempting admin login for:", username);
   // Gọi đến endpoint /api/token/ của simplejwt
   // Không cần header Authorization cho request này
   return apiClient.post('/token/', { username, password });
};

export const getSongs = () => apiClient.get('/songs/');
export const getArtists = () => apiClient.get('/artists/');
export const getAlbums = () => apiClient.get('/albums/');
export const getPlaylists = () => apiClient.get('/playlists/');
export const getMusicGenres = () => apiClient.get('/musicgenres/');

export const getArtistOptions = () => apiClient.get('/artists/options/'); // <<< HÀM MỚI
export const getAlbumOptions = () => apiClient.get('/albums/options/'); // <<< HÀM MỚI

// Songs (Đã thêm)
export const getSongDetail = (id) => apiClient.get(`/songs/${id}/`);
export const addSong = (songData) => apiClient.post('/songs/', songData);
export const updateSong = (id, songData) => apiClient.put(`/songs/${id}/`, songData);
export const deleteSong = (id) => apiClient.delete(`/songs/${id}/`);

export default apiClient;