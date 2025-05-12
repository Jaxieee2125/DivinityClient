// src/store/playerStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Hàm helper để xáo trộn mảng (Fisher-Yates shuffle)
const shuffleArray = (arrayToShuffle) => {
  const array = [...arrayToShuffle]; // Tạo bản sao để không thay đổi mảng gốc
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

const usePlayerStore = create(devtools(
  (set, get) => ({
    // --- State Variables ---
    currentSong: null,
    queue: [],
    currentQueueIndex: -1,
    isPlaying: false,
    volume: 1, // Giữ nguyên giá trị bạn đã đặt
    currentTime: 0,
    duration: 0,
    isMuted: false,
    repeatMode: 'none',  // 'none', 'all', 'one'
    isCurrentSongLiked: false, // Trạng thái like của bài hát hiện tại
    isShuffleActive: false, // Trạng thái shuffle
    originalQueue: [], // Lưu trữ hàng đợi gốc khi chưa shuffle
    playedInShuffle: new Set(), // Theo dõi các bài đã phát trong lượt shuffle hiện tại

    // --- Actions ---
    setCurrentTime: (time) => set({ currentTime: time }, false, 'player/setCurrentTime'),
    setDuration: (duration) => set({ duration: duration }, false, 'player/setDuration'),

    playSong: (song, list = [], indexInList = -1) => {
        const isShuffleCurrentlyActive = get().isShuffleActive;
        const newOriginalQueue = [...list]; // Luôn lưu queue gốc
        let newQueue = [...newOriginalQueue];
        let newIndex = indexInList;
        let newPlayedInShuffle = new Set();

        if (song) { // Chỉ xử lý nếu có bài hát được cung cấp
            if (isShuffleCurrentlyActive && newQueue.length > 0) {
                console.log("[Store] playSong: Shuffle is active, shuffling new list.");
                // Đảm bảo bài hát được chọn là bài đầu tiên trong queue đã xáo trộn
                newQueue = newQueue.filter(item => item._id !== song._id);
                shuffleArray(newQueue); // Xáo trộn phần còn lại
                newQueue.unshift(song); // Đưa bài đang chọn lên đầu
                newIndex = 0;
                newPlayedInShuffle.add(song._id);
            } else if (newQueue.length > 0 && newIndex === -1) {
                // Nếu không shuffle và không có index cụ thể, mặc định là index 0
                // (Trường hợp này có thể không cần thiết nếu indexInList luôn được cung cấp đúng)
                newIndex = 0;
            }
        } else if (newQueue.length > 0) { // Nếu không có song cụ thể nhưng list có
            // Phát bài đầu tiên trong list
            song = newQueue[0];
            newIndex = 0;
            if(isShuffleCurrentlyActive) newPlayedInShuffle.add(song._id);
        }


        set({
            currentSong: song,
            queue: newQueue,
            originalQueue: newOriginalQueue,
            currentQueueIndex: newIndex,
            isPlaying: !!song, // isPlaying là true nếu có bài hát
            currentTime: 0,
            duration: 0,
            playedInShuffle: newPlayedInShuffle,
        }, false, 'player/playSong');
    },

    playFromQueue: (index) => {
        const { queue, isShuffleActive, playedInShuffle } = get();
        if (index >= 0 && index < queue.length) {
            const songToPlay = queue[index];
            let newPlayedInShuffle = new Set(playedInShuffle);
            if (isShuffleActive) {
                newPlayedInShuffle.add(songToPlay._id);
            }
            set({
                currentSong: songToPlay,
                currentQueueIndex: index,
                isPlaying: true,
                currentTime: 0,
                duration: 0,
                playedInShuffle: newPlayedInShuffle,
            }, false, 'player/playFromQueue');
        } else {
            // Nếu index không hợp lệ (ví dụ: hết queue và không lặp)
            set({ isPlaying: false }, false, 'player/playQueueEnd_stop');
            // Không reset queue ở đây, playNext/playPrevious sẽ quyết định
        }
    },

    togglePlayPause: () => set((state) => {
        if (!state.currentSong) return { isPlaying: false };
        return { isPlaying: !state.isPlaying };
    }, false, 'player/togglePlayPause'),

    pause: () => set({ isPlaying: false }, false, 'player/pause'),

    play: () => {
        const { currentSong } = get();
        if (currentSong) set({ isPlaying: true }, false, 'player/play');
    },

    playNext: () => {
        const { queue, currentQueueIndex, repeatMode, isShuffleActive, playedInShuffle, originalQueue, currentSong } = get();
        console.log("[Store] playNext. Shuffle:", isShuffleActive, "Repeat:", repeatMode, "Played:", playedInShuffle.size, "Q:", queue.length, "idx:", currentQueueIndex);

        if (queue.length === 0) {
            set({isPlaying: false, currentSong: null, currentQueueIndex: -1, playedInShuffle: new Set()}, false, 'player/playNext_emptyQueue');
            return;
        }

        if (isShuffleActive) {
            let availableToPlay = queue.filter(song => !playedInShuffle.has(song._id));
            console.log("[Store] playNext Shuffle: Available to play:", availableToPlay.map(s=>s.song_name));

            if (availableToPlay.length === 0) {
                if (repeatMode === 'all') {
                    console.log("[Store] playNext Shuffle: All played, repeating all.");
                    set({ playedInShuffle: new Set() }, false, 'player/playNext_resetShuffle');
                     // Sau khi reset, gọi lại playNext để nó chọn ngẫu nhiên từ đầu
                     // Cần cẩn thận tránh vòng lặp vô hạn nếu queue rỗng hoặc chỉ có 1 bài
                    if (queue.length > 0) {
                        const firstShuffledSongIndex = Math.floor(Math.random() * queue.length);
                        get().playFromQueue(firstShuffledSongIndex);
                    } else {
                         set({ isPlaying: false }, false, 'player/playNext_shuffleEndEmpty');
                    }
                    return;
                } else {
                    console.log("[Store] playNext Shuffle: All played, not repeating all. Stopping.");
                    set({ isPlaying: false }, false, 'player/playNext_shuffleEndNoRepeat');
                    return;
                }
            }
            const randomIndex = Math.floor(Math.random() * availableToPlay.length);
            const nextSong = availableToPlay[randomIndex];
            const nextIndexInQueue = queue.findIndex(song => song._id === nextSong._id);
            get().playFromQueue(nextIndexInQueue);
        } else { // Không shuffle
            let nextIndex = currentQueueIndex + 1;
            if (nextIndex >= queue.length) { // Nếu là bài cuối hoặc vượt quá
                if (repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    set({ isPlaying: false }, false, 'player/playNext_endNoRepeatAll');
                    return;
                }
            }
            get().playFromQueue(nextIndex);
        }
    },

    playPrevious: () => {
        const { queue, currentQueueIndex, repeatMode, isShuffleActive } = get();
        if (queue.length === 0) return;

        if (isShuffleActive) {
            // Khi shuffle, "previous" thường không có ý nghĩa tuần tự.
            // Có thể chọn một bài ngẫu nhiên khác chưa phát, hoặc không làm gì.
            // Để đơn giản, có thể không cho phép previous khi shuffle hoặc phát ngẫu nhiên.
            console.warn("Previous button in shuffle mode might behave unexpectedly or do nothing.");
            // Tạm thời phát một bài ngẫu nhiên khác (không phải bài hiện tại)
            if (queue.length > 1) {
                let randomIndex;
                let randomSong;
                do {
                    randomIndex = Math.floor(Math.random() * queue.length);
                    randomSong = queue[randomIndex];
                } while (randomSong._id === get().currentSong?._id); // Đảm bảo không phải bài hiện tại
                get().playFromQueue(randomIndex);
            }
            return;
        }

        let prevIndex = currentQueueIndex - 1;
        if (prevIndex < 0) {
            if (repeatMode === 'all') {
                prevIndex = queue.length - 1;
            } else {
                // Giữ nguyên bài hiện tại, có thể tua về đầu nếu muốn
                if (get().currentSong) set({ currentTime: 0 }, false, 'player/playPrevious_seekTo0');
                return;
            }
        }
        get().playFromQueue(prevIndex);
    },

    setVolume: (volume) => { const newVolume = Math.max(0, Math.min(1, volume)); set({ volume: newVolume, isMuted: newVolume === 0 }, false, 'player/setVolume'); },
    setCurrentSongLikedStatus: (isLiked) => set({ isCurrentSongLiked: isLiked }, false, 'player/setCurrentSongLikedStatus'),
    toggleMute: () => { const { isMuted } = get(); if (isMuted) { set(state => ({ isMuted: false, volume: state.volume > 0 ? state.volume : 0.5 }), false, 'player/unmute'); } else { set({ isMuted: true }, false, 'player/mute'); } }, // Không set volume = 0 ở đây

    addToQueue: (song) => {
        set(state => {
            if (!state.queue.find(item => (item.song || item)._id === song._id)) { // Kiểm tra ID của song object
                const newQueue = [...state.queue, song];
                const newOriginalQueue = state.isShuffleActive ? [...state.originalQueue, song] : newQueue;
                return { queue: newQueue, originalQueue: newOriginalQueue };
            }
            return {};
        }, false, 'player/addToQueue');
    },

    removeFromQueue: (indexToRemove) => {
        set(state => {
            if (indexToRemove < 0 || indexToRemove >= state.queue.length) return {};

            const songObjectToRemove = state.queue[indexToRemove];
            const songIdToRemove = (songObjectToRemove.song || songObjectToRemove)._id;

            const newQueue = state.queue.filter((_, index) => index !== indexToRemove);
            let newOriginalQueue = state.isShuffleActive ? state.originalQueue.filter(s => (s.song || s)._id !== songIdToRemove) : newQueue;
            let newPlayedInShuffle = new Set(state.playedInShuffle);
            newPlayedInShuffle.delete(songIdToRemove);

            let newCurrentIndex = state.currentQueueIndex;
            let newCurrentSong = state.currentSong;
            let newIsPlaying = state.isPlaying;

            if (songIdToRemove === state.currentSong?._id) { // Nếu bài đang phát bị xóa
                if (newQueue.length > 0) {
                    // Cố gắng phát bài tiếp theo trong queue mới (nếu có)
                    // Hoặc bài đầu tiên nếu index bị xóa là cuối
                    newCurrentIndex = (indexToRemove < newQueue.length) ? indexToRemove : 0;
                    newCurrentSong = newQueue[newCurrentIndex];
                    newIsPlaying = true; // Tiếp tục phát
                } else { // Hết queue
                    newCurrentIndex = -1; newCurrentSong = null; newIsPlaying = false;
                }
            } else if (indexToRemove < state.currentQueueIndex) {
                newCurrentIndex--; // Giảm index nếu xóa bài phía trước
            }

            return {
                queue: newQueue,
                originalQueue: newOriginalQueue,
                currentQueueIndex: newCurrentIndex,
                currentSong: newCurrentSong,
                isPlaying: newIsPlaying,
                playedInShuffle: newPlayedInShuffle
            };
        }, false, 'player/removeFromQueue');
    },

    clearQueue: () => set({ queue: [], originalQueue: [], currentQueueIndex: -1, playedInShuffle: new Set() }, false, 'player/clearQueue'),

    setQueue: (newQueue, newIndex = -1, shouldPlay = true) => {
        const isShuffleCurrentlyActive = get().isShuffleActive;
        let finalQueue = [...newQueue];
        let finalOriginalQueue = [...newQueue];
        let finalIndex = newIndex;
        let newPlayedInShuffle = new Set();
        let songToPlay = null;

        if (finalQueue.length > 0) {
            if (finalIndex === -1) finalIndex = 0; // Mặc định phát từ đầu nếu không có index
            songToPlay = finalQueue[finalIndex];

            if (isShuffleCurrentlyActive) {
                console.log("[Store] setQueue: Shuffle is active, shuffling new queue.");
                finalQueue = finalQueue.filter((item, idx) => idx !== finalIndex); // Loại bài sẽ phát
                shuffleArray(finalQueue);
                if (songToPlay) finalQueue.unshift(songToPlay); // Đặt bài sẽ phát lên đầu
                finalIndex = 0;
                if (songToPlay) newPlayedInShuffle.add(songToPlay._id);
            }
        } else {
            finalIndex = -1; // Không có bài nào trong queue
        }


        set({
            currentSong: songToPlay,
            queue: finalQueue,
            originalQueue: finalOriginalQueue,
            currentQueueIndex: finalIndex,
            isPlaying: shouldPlay && !!songToPlay, // Chỉ play nếu shouldPlay và có bài
            currentTime: 0,
            duration: 0,
            playedInShuffle: newPlayedInShuffle,
        }, false, 'player/setQueue');
    },

    toggleShuffle: () => set((state) => {
        const newShuffleState = !state.isShuffleActive;
        let newQueue = [...state.queue]; // Mặc định lấy queue hiện tại
        let newCurrentIndex = state.currentQueueIndex;
        let newPlayedInShuffle = new Set();

        if (newShuffleState) { // Bật Shuffle
            console.log("[Store] Shuffle ON. Original queue was:", state.originalQueue, "Current Queue:", state.queue);
            // Lưu queue hiện tại (có thể đã được shuffle trước đó hoặc là queue gốc) làm original
            const originalForThisShuffle = [...state.queue];
            if (state.currentSong) {
                newQueue = originalForThisShuffle.filter(song => (song.song || song)._id !== state.currentSong._id);
                shuffleArray(newQueue);
                newQueue.unshift(state.currentSong); // Giữ bài đang phát ở đầu
                newCurrentIndex = 0;
                newPlayedInShuffle.add(state.currentSong._id);
            } else if (originalForThisShuffle.length > 0) {
                shuffleArray(originalForThisShuffle);
                newQueue = originalForThisShuffle;
                newCurrentIndex = 0; // Sẽ phát từ đầu queue mới xáo trộn
            }
            return {
                isShuffleActive: true,
                queue: newQueue,
                originalQueue: originalForThisShuffle, // Lưu lại thứ tự trước khi shuffle LẦN NÀY
                currentQueueIndex: newCurrentIndex,
                playedInShuffle: newPlayedInShuffle,
            };
        } else { // Tắt Shuffle
            console.log("[Store] Shuffle OFF. Restoring from originalQueue:", state.originalQueue);
            newQueue = [...state.originalQueue]; // Khôi phục từ originalQueue đã lưu
            if (state.currentSong) {
                newCurrentIndex = newQueue.findIndex(song => (song.song || song)._id === state.currentSong._id);
                if (newCurrentIndex === -1) newCurrentIndex = 0; // Fallback
            } else {
                newCurrentIndex = -1; // Hoặc 0 nếu muốn phát từ đầu queue gốc
            }
            return {
                isShuffleActive: false,
                queue: newQueue,
                // originalQueue: [], // Có thể xóa originalQueue khi tắt shuffle
                currentQueueIndex: newCurrentIndex,
                playedInShuffle: new Set(),
            };
        }
    }, false, 'player/toggleShuffle'),

    toggleRepeatMode: () => set((state) => {
        let newMode;
        if (state.repeatMode === 'none') newMode = 'all';
        else if (state.repeatMode === 'all') newMode = 'one';
        else newMode = 'none';
        return { repeatMode: newMode };
    }, false, 'player/toggleRepeatMode'),

  }),
  {
    name: "PlayerStore", // Tên cho Redux DevTools
    // serialize: { options: true } // Bật serialize để xem object/set trong devtools (nếu cần)
  }
));

export default usePlayerStore;