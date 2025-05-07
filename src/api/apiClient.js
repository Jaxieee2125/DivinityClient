// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // !!! CHỈNH SỬA NẾU CẦN !!!
});

// --- Interceptor để thêm Token (Ví dụ - Cần điều chỉnh theo cách lưu token của bạn) ---
apiClient.interceptors.request.use(
  (config) => {
    // Nên lấy token chung (vd: 'accessToken') thay vì chỉ 'adminAuthToken'
    // Hoặc có logic để biết khi nào dùng token nào nếu admin/user dùng key khác nhau
    const token = localStorage.getItem('accessToken') || localStorage.getItem('adminAuthToken'); // Thử lấy token user hoặc admin

    // Không thêm token vào các request public như login, register
    const publicUrls = ['/token/', '/users/login/', '/users/register/'];

    if (token && !publicUrls.includes(config.url)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // console.log("API Request:", config.method.toUpperCase(), config.url, "Headers:", config.headers); // Bỏ comment nếu cần debug
    return config;
  },
  (error) => {
    // Có thể thêm xử lý lỗi ở đây (ví dụ: redirect về login nếu lỗi 401)
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
export const getMusicGenres = () => apiClient.get('/musicgenres/'); // 
export const getMusicGenreName = (id) => apiClient.get(`/musicgenres/${id}/`); // <<< HÀM MỚI

export const getArtistOptions = () => apiClient.get('/artists/options/'); // <<< HÀM MỚI
export const getAlbumOptions = () => apiClient.get('/albums/options/'); // <<< HÀM MỚI

// Songs (Đã thêm)
export const getSongDetail = (id) => apiClient.get(`/songs/${id}/`);
export const addSong = (songData) => apiClient.post('/songs/', songData);
export const updateSong = (id, songData) => apiClient.put(`/songs/${id}/`, songData);
export const deleteSong = (id) => apiClient.delete(`/songs/${id}/`);

/**
 * Thêm một nghệ sĩ mới.
 * @param {FormData} artistData - Dùng FormData nếu có upload avatar.
 */
export const addArtist = (artistData) => apiClient.post('/artists/', artistData, {
  // Axios tự xử lý header multipart khi data là FormData
  // headers: { 'Content-Type': 'multipart/form-data' } // Không cần đặt thủ công
});
/**
* Cập nhật thông tin nghệ sĩ.
* @param {string} id - ID của nghệ sĩ.
* @param {FormData} artistData - Dữ liệu cập nhật (FormData nếu có file).
*/
export const updateArtist = (id, artistData) => apiClient.put(`/artists/${id}/`, artistData, {
  // headers: { 'Content-Type': 'multipart/form-data' } // Không cần đặt thủ công
});
export const deleteArtist = (id) => apiClient.delete(`/artists/${id}/`);
export const getGenreOptions = () => apiClient.get('/musicgenres/options/');

export const getGenreTracks = (genreId, params) => apiClient.get(`/musicgenres/${genreId}/tracks/`, { params });

// --- Albums (Thêm CRUD) ---
/** Thêm album mới (FormData nếu có ảnh) */
export const addAlbum = (albumData) => apiClient.post('/albums/', albumData);
/** Cập nhật album (FormData nếu có ảnh) */
export const updateAlbum = (id, albumData) => apiClient.put(`/albums/${id}/`, albumData);
/** Xóa album */
export const deleteAlbum = (id) => apiClient.delete(`/albums/${id}/`);

export const getAlbumSongs = (albumId) => apiClient.get(`/albums/${albumId}/songs/`);

export const getAlbumDetail = (albumId) => apiClient.get(`/albums/${albumId}/`);
// --------------------------

// --- Music Genres ---
/** Lấy danh sách rút gọn thể loại cho select */
export const getMusicGenreOptions = () => apiClient.get('/musicgenres/options/'); // <<< Đổi tên hàm và URL (Cần tạo endpoint này ở backend)
/** Thêm thể loại mới */
export const addMusicGenre = (genreData) => apiClient.post('/musicgenres/', genreData); // <<< Đổi tên hàm và URL
/** Cập nhật thể loại */
export const updateMusicGenre = (id, genreData) => apiClient.put(`/musicgenres/${id}/`, genreData); // <<< Đổi tên hàm và URL
/** Xóa thể loại */
export const deleteMusicGenre = (id) => apiClient.delete(`/musicgenres/${id}/`); // <<< Đổi tên hàm và URL
// --------------------

// --- Users ---
/** Lấy danh sách người dùng (cần quyền admin) */
export const getUsers = (params) => apiClient.get('/users/', { params }); // <<< Endpoint này cần được bảo vệ ở backend
/** Lấy chi tiết một người dùng */
export const getUserDetail = (id) => apiClient.get(`/users/${id}/`); // <<< Endpoint này cần được bảo vệ
/** Thêm người dùng mới (admin tạo) */
export const addUser = (userData) => apiClient.post('/users/', userData); // <<< Cần bảo vệ
/** Cập nhật thông tin người dùng */
export const updateUser = (id, userData) => apiClient.put(`/users/${id}/`, userData); // <<< Cần bảo vệ
/** Xóa người dùng */
export const deleteUser = (id) => apiClient.delete(`/users/${id}/`); // <<< Cần bảo vệ
// -----------

export const getAdminStats = () => apiClient.get('/admin/stats/');

/**
 * Gửi yêu cầu đăng ký user mới đến backend.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Promise chứa response từ API (thường là message thành công).
 */
export const registerUser = (username, email, password) => {
  console.log("Attempting user registration for:", username, email);
  // Gọi đến endpoint /api/users/register/
  // Không cần header Authorization
  return apiClient.post('/users/register/', { username, email, password });
};

/**
* Gửi yêu cầu đăng nhập user thường đến backend.
* @param {string} identifier - Username hoặc Email
* @param {string} password
* @returns {Promise<object>} Promise chứa response từ API (bao gồm access, refresh tokens và user info).
*/
export const loginUser = (identifier, password) => {
  console.log("Attempting user login for identifier:", identifier);
  // Gọi đến endpoint /api/users/login/
  // Không cần header Authorization
  return apiClient.post('/users/login/', { identifier, password });
};

/** Lấy danh sách album của một nghệ sĩ */
export const getArtistAlbums = (artistId, params) => apiClient.get(`/artists/${artistId}/albums/`, { params }); // Thêm params nếu cần pagination/sort

/** Lấy danh sách bài hát phổ biến của một nghệ sĩ */
export const getArtistTopTracks = (artistId, params) => apiClient.get(`/artists/${artistId}/top-tracks/`, { params });

export const getArtistDetail = (artistId) => apiClient.get(`/artists/${artistId}/`);

/**
 * Lấy nội dung nổi bật cho trang chủ (ví dụ: 1 album hoặc playlist).
 */
export const getFeaturedContent = () => apiClient.get('/home/featured/');

/**
 * Lấy danh sách được nghe nhiều nhất.
 * @param {object} params - Ví dụ: { type: 'songs' | 'albums', limit: 10 }
 */
export const getMostPlayed = (params) => apiClient.get('/home/most-played/', { params });

/**
 * Lấy các mục nổi bật từ thư viện (ví dụ: mix albums, playlists).
 * @param {object} params - Ví dụ: { limit: 10 }
 */
export const getLibraryHighlights = (params) => apiClient.get('/home/library-highlights/', { params });

/**
 * Lấy các album mới được thêm/phát hành gần đây.
 * @param {object} params - Ví dụ: { limit: 10 }
 */
export const getRecentlyAddedAlbums = (params) => apiClient.get('/home/new-releases/', { params });


export default apiClient;