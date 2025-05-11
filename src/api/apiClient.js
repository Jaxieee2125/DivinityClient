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

/**
 * Lấy chi tiết thông tin của người dùng hiện tại (hoặc user bất kỳ nếu có ID).
 * Backend cần kiểm tra quyền xem user này có phải là chính họ hoặc admin không.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<object>} Promise chứa thông tin chi tiết của user.
 */
export const getUserProfile = (userId) => {
  console.log(`[apiClient] Fetching profile for user ID: ${userId}`);
  // API endpoint này cần được bảo vệ, interceptor sẽ gửi token
  return apiClient.get(`/users/${userId}/`);
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

/**
 * Gửi yêu cầu đổi mật khẩu cho người dùng đang đăng nhập.
 * Gọi đến endpoint POST /users/change-password/ (do ChangePasswordView xử lý).
 * @param {string} oldPassword Mật khẩu cũ
 * @param {string} newPassword Mật khẩu mới
 * @returns {Promise<object>} Promise chứa response từ API (thường là message thành công).
 */
export const changePassword = (oldPassword, newPassword) => {
  console.log("[apiClient] Attempting password change.");
  // Interceptor sẽ tự động đính kèm access token của user
  return apiClient.post('/users/change-password/', {
      old_password: oldPassword, // Đảm bảo key khớp với ChangePasswordSerializer backend
      new_password: newPassword,
  });
};

// === API CHO PROFILE USER HIỆN TẠI ===
/**
 * Lấy thông tin profile của người dùng đang đăng nhập.
 * Gọi GET /api/profile/
 * @returns {Promise<object>}
 */
export const getCurrentUserProfile = () => {
  console.log("[apiClient] GET /profile/ (current user)");
  // Interceptor sẽ gửi token
  return apiClient.get('/profile/');
};

/**
* Cập nhật thông tin profile của người dùng đang đăng nhập.
* Gọi PUT /api/profile/
* @param {FormData | object} userData - Dữ liệu cập nhật.
* @returns {Promise<object>}
*/
export const updateCurrentUserProfile = (userData) => {
  console.log("[apiClient] PUT /profile/ (current user update)");
  // Interceptor sẽ gửi token
  return apiClient.put('/profile/', userData); // Dùng PUT hoặc PATCH tùy backend
};

/**
 * Gửi yêu cầu bài hát mới từ user.
 * @param {object} requestData - { song_title, artist_name?, album_name?, notes? }
 * @returns {Promise<object>}
 */
export const requestSong = (requestData) => {
  console.log("[apiClient] Sending song request:", requestData);
  // Interceptor sẽ gửi token
  return apiClient.post('/song-requests/', requestData);
};

// --- API cho Admin quản lý request ---
export const getAdminSongRequests = (params) => apiClient.get('/admin/song-requests/', { params });
export const updateAdminSongRequest = (requestId, updateData) => apiClient.put(`/admin/song-requests/${requestId}/`, updateData);

export const getRecentlyAddedAlbums = (params) => apiClient.get('/home/new-releases/', { params });
export const getPlaylistDetail = (playlistId) => apiClient.get(`/playlists/${playlistId}/`);

export const createPlaylistApi = (playlistData) => apiClient.post('/playlists/', playlistData);

/** Toggle trạng thái yêu thích của một bài hát cho user hiện tại */
export const toggleUserFavouriteSongApi = (songId) => apiClient.post(`/user/favourites/toggle/${songId}/`);

/** Kiểm tra trạng thái yêu thích của một hoặc nhiều bài hát cho user hiện tại */
export const checkUserFavouriteStatusApi = (songIdsString) => apiClient.get(`/user/favourites/status/?song_ids=${songIdsString}`);

/** Thêm một hoặc nhiều bài hát vào playlist */
export const addSongsToPlaylistApi = (playlistId, songIdsArray) => {
    // songIdsArray là mảng các string ID
    return apiClient.put(`/playlists/${playlistId}/`, {
        action: 'add_songs', // Chỉ định action
        song_ids: songIdsArray // Mảng các ID
    });
};

/** Xóa một bài hát khỏi playlist cụ thể */
export const removeSongFromPlaylistApi = (playlistId, songIdToRemove) => {
    return apiClient.put(`/playlists/${playlistId}/`, { // Vẫn dùng PUT đến detail
        action: 'remove_song',
        song_id: songIdToRemove
    });
};

export default apiClient;