// src/store/playlistStore.js
import { create } from 'zustand';
import { getPlaylists } from '../api/apiClient'; // Import hàm gọi API từ apiClient.js

/**
 * Zustand store để quản lý trạng thái liên quan đến playlists.
 */
const usePlaylistStore = create((set, get) => ({
  // --- State ---
  /** @type {Array<object>} Danh sách các playlist đã lấy từ API */
  playlists: [],

  /** @type {boolean} Trạng thái cho biết đang tải danh sách playlist hay không */
  isLoading: false,

  /** @type {string|null} Lưu trữ thông báo lỗi nếu có lỗi xảy ra khi fetch */
  error: null,

  // --- Actions ---

  /**
   * Fetch danh sách playlist từ API backend.
   * Cập nhật state isLoading, playlists và error.
   * @param {boolean} [forceRefresh=false] - Nếu true, sẽ fetch lại ngay cả khi đã có dữ liệu.
   */
  fetchPlaylists: async (forceRefresh = false) => {
    // Chỉ fetch khi chưa có dữ liệu hoặc khi yêu cầu refresh
    if (!forceRefresh && get().playlists.length > 0 && !get().error) {
      // console.log("Using cached playlists."); // Bỏ comment nếu muốn debug cache
      return; // Không cần fetch lại nếu đã có
    }

    set({ isLoading: true, error: null }); // Bắt đầu loading, xóa lỗi cũ

    try {
      // Gọi hàm getPlaylists từ apiClient
      const response = await getPlaylists();

      // Kiểm tra cấu trúc response (API nên trả về mảng trong response.data)
      if (Array.isArray(response.data)) {
        set({ playlists: response.data, isLoading: false }); // Cập nhật thành công
      } else {
        console.error("API response for playlists is not an array:", response.data);
        set({ error: "Invalid data format received from server.", isLoading: false });
      }
    } catch (err) {
      // Xử lý lỗi khi gọi API
      console.error("Error fetching playlists:", err);
      // Cố gắng lấy thông báo lỗi cụ thể từ response hoặc dùng message mặc định
      const errorMessage = err.response?.data?.detail || // DRF thường trả lỗi trong detail
                           err.response?.data?.error ||
                           err.message ||
                           "Failed to load playlists.";
      set({ error: errorMessage, isLoading: false }); // Lưu lỗi, dừng loading
    }
  },

  /**
   * Action ví dụ: Thêm một playlist mới vào state (sau khi tạo thành công trên API)
   * Bạn sẽ gọi action này từ component khác sau khi POST lên API.
   * @param {object} newPlaylist - Object playlist mới từ response API.
   */
  addPlaylistLocal: (newPlaylist) => {
    set(state => ({
      // Thêm vào đầu hoặc cuối danh sách tùy ý
      playlists: [newPlaylist, ...state.playlists]
    }));
  },

  /**
   * Action ví dụ: Xóa playlist khỏi state (sau khi xóa thành công trên API)
   * @param {string} playlistId - ID của playlist cần xóa.
   */
  removePlaylistLocal: (playlistId) => {
    set(state => ({
      playlists: state.playlists.filter(p => p._id !== playlistId)
    }));
  },

  // TODO: Thêm các actions cần thiết khác (ví dụ: updatePlaylistLocal)

}));

// Middleware để theo dõi state thay đổi (tùy chọn, hữu ích khi debug)
// import { devtools } from 'zustand/middleware'
// const usePlaylistStore = create(devtools((set, get) => ({ ...Nội dung store ở trên... })));
// Nếu dùng devtools, cần cài: npm install @redux-devtools/extension

export default usePlaylistStore;