// src/store/playerStore.js
import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  // --- State Variables ---
  currentSong: null,   // Thông tin bài hát đang phát (object)
  queue: [],           // Hàng đợi các bài hát (array of song objects)
  currentQueueIndex: -1, // Vị trí của bài hát đang phát trong hàng đợi (-1 nếu không phát từ queue)
  isPlaying: false,    // Trạng thái phát/dừng
  volume: 1,         // Âm lượng (0 đến 1)
  currentTime: 0,      // Thời gian hiện tại của bài hát (seconds)
  duration: 0,         // Tổng thời lượng của bài hát (seconds)
  isMuted: false,      // Trạng thái tắt tiếng
  repeatMode: 'none',  // Chế độ lặp lại (none, all, one)

  // --- Actions (Hàm để cập nhật state) ---

  /**
   * Bắt đầu phát một bài hát.
   * @param {object} song - Object bài hát để phát.
   * @param {array} [list=[]] - Danh sách bài hát hiện tại (ví dụ: từ trang đang xem) để đặt làm hàng đợi mới.
   * @param {number} [indexInList=-1] - Vị trí của 'song' trong 'list'.
   */
  playSong: (song, list = [], indexInList = -1) => {
    set({
      currentSong: song,
      queue: [...list], // Tạo một bản sao của danh sách làm hàng đợi mới
      currentQueueIndex: indexInList, // Đặt index hiện tại trong hàng đợi mới
      isPlaying: true,
      currentTime: 0, // Reset thời gian khi bắt đầu bài mới
      duration: 0,    // Reset thời lượng, sẽ được cập nhật từ thẻ audio
    });
    // Lưu ý: Logic tương tác trực tiếp với thẻ <audio> (như gọi .play())
    // nên nằm trong component PlayerBar sử dụng các state này qua useEffect.
  },

  /**
   * Phát bài hát tại một vị trí index cụ thể trong hàng đợi hiện tại.
   * @param {number} index - Vị trí trong hàng đợi (queue).
   */
  playFromQueue: (index) => {
    const { queue } = get(); // Lấy hàng đợi hiện tại từ state
    if (index >= 0 && index < queue.length) {
      // Nếu index hợp lệ, cập nhật state để phát bài hát đó
      set({
        currentSong: queue[index],
        currentQueueIndex: index,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      });
    } else {
      // Nếu index không hợp lệ (ví dụ: vượt quá cuối hàng đợi)
      // Có thể dừng phát hoặc xử lý theo logic khác (ví dụ: lặp lại)
      // Hiện tại: Dừng phát và xóa hàng đợi
      set({ currentSong: null, queue: [], currentQueueIndex: -1, isPlaying: false });
    }
  },

  /**
   * Chuyển đổi trạng thái phát/dừng.
   */
  togglePlayPause: () => set((state) => {
    // Chỉ cho phép toggle nếu có bài hát đang được chọn (trong currentSong)
    if (!state.currentSong) return { isPlaying: false };
    return { isPlaying: !state.isPlaying };
  }),

  /**
   * Dừng phát nhạc.
   */
  pause: () => set({ isPlaying: false }),

  /**
   * Tiếp tục phát nhạc (nếu có bài hát).
   */
  play: () => {
      const { currentSong } = get();
      // Chỉ đặt isPlaying thành true nếu thực sự có bài hát để phát
      if (currentSong) {
          set({ isPlaying: true });
      }
  },

  /**
   * Phát bài hát tiếp theo trong hàng đợi.
   */
  playNext: () => {
    const { queue, currentQueueIndex, repeatMode } = get();
    
    if (queue.length === 0) return;

    let nextIndex;
    if (currentQueueIndex === queue.length - 1) {
      // Nếu là bài cuối cùng
      if (repeatMode === 'all') {
        nextIndex = 0; // Quay lại bài đầu
      } else {
        return; // Không làm gì nếu không phải chế độ lặp
      }
    } else {
      nextIndex = currentQueueIndex + 1;
    }

    set({
      currentSong: queue[nextIndex],
      currentQueueIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0
    });
  },

  /**
   * Phát bài hát trước đó trong hàng đợi.
   */
  playPrevious: () => {
    const { queue, currentQueueIndex, repeatMode } = get();
    
    if (queue.length === 0) return;

    let prevIndex;
    if (currentQueueIndex === 0) {
      // Nếu là bài đầu tiên
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1; // Chuyển đến bài cuối
      } else {
        return; // Không làm gì nếu không phải chế độ lặp
      }
    } else {
      prevIndex = currentQueueIndex - 1;
    }

    set({
      currentSong: queue[prevIndex],
      currentQueueIndex: prevIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0
    });
  },

  /**
   * Cập nhật thời gian hiện tại của bài hát đang phát.
   * (Thường được gọi từ sự kiện onTimeUpdate của thẻ audio).
   * @param {number} time - Thời gian hiện tại (tính bằng giây).
   */
  setCurrentTime: (time) => set({ currentTime: time }),

  /**
   * Cập nhật tổng thời lượng của bài hát đang phát.
   * (Thường được gọi từ sự kiện onLoadedMetadata của thẻ audio).
   * @param {number} duration - Tổng thời lượng (tính bằng giây).
   */
  setDuration: (duration) => set({ duration: duration }),

  /**
   * Đặt mức âm lượng.
   * @param {number} volume - Giá trị âm lượng từ 0 đến 1.
   */
  setVolume: (volume) => {
     const newVolume = Math.max(0, Math.min(1, volume)); // Đảm bảo trong khoảng 0-1
     set({ volume: newVolume, isMuted: newVolume === 0 }); // Tự động mute nếu volume là 0
  },

  /**
   * Chuyển đổi trạng thái tắt/bật tiếng.
   */
  toggleMute: () => {
    const { volume, isMuted } = get();
    if (isMuted) {
       // Khi bật lại tiếng, quay về mức volume trước đó
       // Nếu volume trước đó là 0, đặt một giá trị mặc định (ví dụ: 0.5)
       set({ isMuted: false, volume: volume > 0 ? volume : 0.5 });
    } else {
       // Khi tắt tiếng, đặt volume về 0 nhưng vẫn lưu giá trị cũ trong isMuted
       set({ isMuted: true }); // PlayerBar sẽ tự đặt audioRef.current.muted = true
       // Không cần set volume về 0 ở đây, vì useEffect trong PlayerBar sẽ làm điều đó dựa trên isMuted
    }
  },

  /**
   * Thêm một bài hát vào cuối hàng đợi.
   * @param {object} song - Object bài hát cần thêm.
   */
  addToQueue: (song) => {
    set(state => {
       // Kiểm tra để tránh thêm trùng lặp vào hàng đợi (tùy chọn)
       const alreadyInQueue = state.queue.some(item => item._id === song._id);
       if (!alreadyInQueue) {
           return { queue: [...state.queue, song] };
       }
       // Nếu đã có trong queue, không thay đổi state
       return {};
    });
  },

  /**
   * Xóa một bài hát khỏi hàng đợi dựa vào vị trí index.
   * @param {number} index - Vị trí của bài hát cần xóa.
   */
  removeFromQueue: (index) => {
     set(state => {
        const newQueue = [...state.queue];
        if (index >= 0 && index < newQueue.length) {
           newQueue.splice(index, 1); // Xóa bài hát khỏi mảng

           // Điều chỉnh currentQueueIndex nếu cần
           let newCurrentIndex = state.currentQueueIndex;
           if (index === state.currentQueueIndex) {
             // Bài hát đang phát bị xóa -> dừng phát và reset index
             // Hoặc có thể tự động phát bài tiếp theo (logic phức tạp hơn)
             newCurrentIndex = -1; // Reset index, PlayerBar sẽ dừng dựa trên currentSong = null
             // Nếu muốn phát bài tiếp theo:
             // newCurrentIndex = index < newQueue.length ? index : (newQueue.length > 0 ? newQueue.length - 1 : -1);
             // Cần cập nhật cả currentSong trong trường hợp này
           } else if (index < state.currentQueueIndex) {
             // Xóa bài hát phía trước bài đang phát -> giảm index đi 1
             newCurrentIndex -= 1;
           }

           // Nếu bài đang phát bị xóa, cần cập nhật cả currentSong
           const newCurrentSong = newCurrentIndex === -1 ? null : (newQueue[newCurrentIndex] || null);

           return {
               queue: newQueue,
               currentQueueIndex: newCurrentIndex,
               currentSong: index === state.currentQueueIndex ? newCurrentSong : state.currentSong, // Cập nhật currentSong nếu cần
               isPlaying: index === state.currentQueueIndex ? false : state.isPlaying // Dừng phát nếu bài hiện tại bị xóa
            };
        }
        // Nếu index không hợp lệ, không thay đổi state
        return {};
     });
  },

   /**
    * Xóa tất cả bài hát khỏi hàng đợi.
    */
  clearQueue: () => set({ queue: [], currentQueueIndex: -1 }),

  /**
   * Đặt lại toàn bộ hàng đợi và vị trí hiện tại.
   * Hữu ích cho việc sắp xếp lại hàng đợi hoặc tải một playlist mới.
   * @param {array} newQueue - Mảng hàng đợi mới.
   * @param {number} [newIndex=-1] - Vị trí hiện tại trong hàng đợi mới.
   */
  setQueue: (newQueue, newIndex = -1) => set({ queue: newQueue, currentQueueIndex: newIndex }),

}));

export default usePlayerStore;