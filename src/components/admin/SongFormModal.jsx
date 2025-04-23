// src/components/admin/SongFormModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SongFormModal.module.css'; // Đảm bảo import CSS Module
import { FiX, FiSearch } from 'react-icons/fi';
import { getArtistOptions, getAlbumOptions } from '../../api/apiClient'; // Import API functions

const SongFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, apiError = null }) => {
    // --- State cho các trường của form ---
    const [songName, setSongName] = useState('');
    const [artistIds, setArtistIds] = useState([]); // Mảng các ID string được chọn
    const [albumId, setAlbumId] = useState('');   // ID string album được chọn hoặc ''
    const [description, setDescription] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [releaseTime, setReleaseTime] = useState(''); // Format YYYY-MM-DD
    const [durationSong, setDurationSong] = useState(''); // String để người dùng nhập
    const [status, setStatus] = useState('draft');
    // const [fileUp, setFileUp] = useState(''); // Không cần state cho path nữa
    const [audioFile, setAudioFile] = useState(null); // State mới để lưu File object
    const [existingFileUrl, setExistingFileUrl] = useState(null); // Lưu URL file hiện tại (chế độ edit)
    const [errors, setErrors] = useState({}); // Lỗi validation phía client

    // --- State cho select options và tìm kiếm ---
    const [availableArtists, setAvailableArtists] = useState([]);
    const [availableAlbums, setAvailableAlbums] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState(null);
    const [artistSearchTerm, setArtistSearchTerm] = useState('');
    const [albumSearchTerm, setAlbumSearchTerm] = useState('');

    // --- Fetch dữ liệu cho Select Options ---
    const fetchOptions = useCallback(async () => {
        setOptionsLoading(true);
        setOptionsError(null);
        try {
            const [artistRes, albumRes] = await Promise.all([
                getArtistOptions(),
                getAlbumOptions()
            ]);
            setAvailableArtists(artistRes.data || []);
            setAvailableAlbums(albumRes.data || []);
        } catch (err) {
            console.error("Error fetching select options:", err);
            setOptionsError("Failed to load artists or albums options.");
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    // Fetch options chỉ khi modal mở lần đầu hoặc khi cần thiết
    useEffect(() => {
        if (isOpen && availableArtists.length === 0 && availableAlbums.length === 0) {
            fetchOptions();
        }
        // Reset search terms khi modal đóng/mở
        if (!isOpen) {
            setArtistSearchTerm('');
            setAlbumSearchTerm('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // --- Điền dữ liệu vào form khi initialData hoặc isOpen thay đổi ---
    useEffect(() => {
        if (isOpen) {
            if (initialData) { // Edit Mode
                setSongName(initialData.song_name || '');
                setArtistIds(initialData.artists?.map(a => String(a._id)) || initialData.artist_ids?.map(id => String(id)) || []);
                setAlbumId(String(initialData.album?._id || initialData.album_id || ''));
                setDescription(initialData.description || '');
                setLyrics(initialData.lyrics || '');
                const releaseDate = initialData.release_time ? new Date(initialData.release_time).toISOString().split('T')[0] : '';
                setReleaseTime(releaseDate);
                setDurationSong(initialData.duration_song !== null && initialData.duration_song !== undefined ? String(initialData.duration_song) : '');
                setStatus(initialData.status || 'draft');
                setAudioFile(null); // Reset file input khi mở edit
                setExistingFileUrl(initialData.file_url || null); // Lưu URL hiện tại để hiển thị
            } else { // Add Mode - Reset form
                setSongName(''); setArtistIds([]); setAlbumId(''); setDescription(''); setLyrics('');
                setReleaseTime(''); setDurationSong(''); setStatus('draft');
                setAudioFile(null); setExistingFileUrl(null);
            }
            setErrors({}); // Xóa lỗi validation cũ
        }
    }, [initialData, isOpen]);

    // --- Lọc danh sách options dựa trên search term (Client-side) ---
    const filteredArtists = useMemo(() => {
        if (!artistSearchTerm) return availableArtists;
        const lowerCaseQuery = artistSearchTerm.toLowerCase();
        return availableArtists.filter(artist =>
            artist.artist_name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [availableArtists, artistSearchTerm]);

    const filteredAlbums = useMemo(() => {
        if (!albumSearchTerm) return availableAlbums;
        const lowerCaseQuery = albumSearchTerm.toLowerCase();
        return availableAlbums.filter(album =>
            album.album_name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [availableAlbums, albumSearchTerm]);

    // --- Client-side Validation ---
    const validateForm = () => {
        const newErrors = {};
        if (!songName.trim()) newErrors.songName = 'Song name is required.';
        if (artistIds.length === 0) newErrors.artistIds = 'At least one Artist must be selected.';
        if (durationSong && (isNaN(Number(durationSong)) || Number(durationSong) < 0)) {
            newErrors.durationSong = 'Duration must be a non-negative number.';
        }
        // Thêm validation cho file nếu cần (ví dụ: kích thước, loại)
        // if (!initialData && !audioFile) newErrors.audioFile = 'Audio file is required for new songs.'; // Bắt buộc file khi thêm mới
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

     // Handler cho multi-select artists
     const handleArtistSelectChange = (event) => {
        console.log("--- Artist Selection Changed ---"); // <<< THÊM LOG
        const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
        console.log("Selected Artist IDs:", selectedOptions); // <<< THÊM LOG
        setArtistIds(selectedOptions); // Cập nhật state
    };

    // --- Submit Handler (SỬ DỤNG FormData) ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading || optionsLoading) return;
    
        const formData = new FormData(); // Tạo FormData mới
    
        // Append các trường khác bình thường
        formData.append('song_name', songName.trim());
        if (albumId) formData.append('album_id', albumId);
        if (description.trim()) formData.append('description', description.trim());
        if (lyrics.trim()) formData.append('lyrics', lyrics.trim());
        if (releaseTime) formData.append('release_time', releaseTime);
        if (durationSong) formData.append('duration_song', parseInt(durationSong, 10));
        formData.append('status', status.trim());
    
        // --- SỬA LẠI PHẦN APPEND artist_ids ---
        console.log("handleSubmit: Current artistIds state:", artistIds);
        if (Array.isArray(artistIds)) {
            if (artistIds.length > 0) {
                artistIds.forEach(id => {
                    // Chỉ append nếu id là string hợp lệ và không rỗng
                    if (typeof id === 'string' && id.trim()) {
                        formData.append('artist_ids', id.trim()); // Append từng ID một
                        console.log("Appended artist_id:", id.trim());
                    } else {
                        console.warn("Skipping invalid artist ID during append:", id);
                    }
                });
            } else {
                 console.log("artistIds array is empty, not appending any artist_ids.");
                 // Bạn có thể quyết định có nên gửi một giá trị trống đặc biệt hay không
                 // tùy thuộc vào cách backend xử lý việc xóa hết artist.
                 // Ví dụ: formData.append('artist_ids', ''); // Gửi giá trị rỗng nếu mảng rỗng
            }
    
        } else {
            console.error("handleSubmit: artistIds is not an array!", artistIds);
        }
        // ------------------------------------
    
        // Append file nếu có
        if (audioFile instanceof File) {
            formData.append('audio_file', audioFile, audioFile.name);
            console.log("Appended audio_file:", audioFile.name);
        } else {
            console.log("No valid audioFile to append.");
        }
    
    
        console.log("--- FormData to be sent ---");
        for (let [key, value] of formData.entries()) {
            console.log(key, value instanceof File ? value.name : value); // In tên file thay vì object File
        }
        console.log("--------------------------");
    
        onSubmit(formData, initialData?._id); // Gọi hàm submit của cha
    };

   

    // Handler cho input file
    const handleFileChange = (event) => {
        const file = event.target.files?.[0]; // Lấy file đầu tiên
        if (file && file instanceof File) { // Kiểm tra là File object
            setAudioFile(file);
            setExistingFileUrl(null);
            setErrors(prev => ({...prev, audioFile: undefined}));
            console.log("Selected file:", file); // Log file object
        } else {
            setAudioFile(null);
            if (initialData) setExistingFileUrl(initialData.file_url || null);
             console.log("File selection cancelled or invalid file.");
        }
    };

    // --- Render ---
    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}><FiX /></button>
                <div className={styles.modalHeader}>
                    {initialData ? 'Edit Song' : 'Add New Song'}
                </div>

                {/* {apiError && <div className={styles.apiErrorBanner}>Error: {apiError}</div>}
                {optionsError && <div className={styles.apiErrorBanner}>{optionsError}</div>} */}

                {/* Đặt thẻ form bao ngoài modalBody */}
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {optionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Loading options...</div>
                        ) : (
                            <div className={styles.formGrid}>
                                {/* Song Name */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="songName" className={styles.required}>Song Name</label>
                                    <input type="text" id="songName" value={songName} onChange={(e) => setSongName(e.target.value)} disabled={isLoading} required />
                                    {errors.songName && <span className={styles.errorMessage}>{errors.songName}</span>}
                                </div>

                                {/* Artist IDs */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="artistIds" className={styles.required}>Artists</label>
                                    <div className={styles.selectSearchContainer}>
                                        <FiSearch className={styles.selectSearchIcon} /><input type="text" placeholder="Search artists..." value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} className={styles.selectSearchInput} disabled={isLoading || optionsLoading} />
                                    </div>
                                    <select id="artistIds" multiple value={artistIds} onChange={handleArtistSelectChange} disabled={isLoading || optionsLoading} size="5" required className={styles.selectMultiple}>
                                        {filteredArtists.map(artist => ( <option key={artist._id} value={artist._id}> {artist.artist_name} </option> ))}
                                        {filteredArtists.length === 0 && artistSearchTerm && ( <option disabled>No artists found matching "{artistSearchTerm}"</option> )}
                                        {filteredArtists.length === 0 && !artistSearchTerm && availableArtists.length > 0 && ( <option disabled>Scroll or search...</option> )}
                                        {availableArtists.length === 0 && !optionsLoading && ( <option disabled>No artists available</option> )}
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Hold Ctrl/Cmd to select multiple.</span>
                                    {errors.artistIds && <span className={styles.errorMessage}>{errors.artistIds}</span>}
                                </div>

                                {/* Album ID */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="albumId">Album</label>
                                    <div className={styles.selectSearchContainer}>
                                        <FiSearch className={styles.selectSearchIcon} />
                                        <input type="text" placeholder="Search albums..." value={albumSearchTerm} onChange={(e) => setAlbumSearchTerm(e.target.value)} className={styles.selectSearchInput} disabled={isLoading || optionsLoading} />
                                    </div>
                                    <select id="albumId" value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={isLoading || optionsLoading}>
                                        <option value="">-- Select Album (Optional) --</option>
                                        {filteredAlbums.map(album => ( <option key={album._id} value={album._id}> {album.album_name} </option> ))}
                                        {filteredAlbums.length === 0 && albumSearchTerm && ( <option disabled>No albums found matching "{albumSearchTerm}"</option> )}
                                        {filteredAlbums.length === 0 && !albumSearchTerm && availableAlbums.length > 0 && ( <option disabled>Scroll or search...</option> )}
                                        {availableAlbums.length === 0 && !optionsLoading && ( <option disabled>No albums available</option> )}
                                    </select>
                                </div>

                                {/* Release Time */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="releaseTime">Release Date</label>
                                    <input type="date" id="releaseTime" value={releaseTime} onChange={(e) => setReleaseTime(e.target.value)} disabled={isLoading}/>
                                </div>

                                {/* Duration */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="durationSong">Duration (seconds)</label>
                                    <input type="number" id="durationSong" value={durationSong} onChange={(e) => setDurationSong(e.target.value)} placeholder="e.g., 180" disabled={isLoading} min="0"/>
                                    {errors.durationSong && <span className={styles.errorMessage}>{errors.durationSong}</span>}
                                </div>

                                {/* Status */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="status">Status</label>
                                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isLoading}>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                {/* File Upload */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="audioFile">Audio File: {initialData && existingFileUrl && (<span style={{ fontSize: '0.8rem', marginBottom: '4px', fontStyle: 'italic' }}><a href={existingFileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#1890ff'}}>{initialData.file_up || 'View Current File'}</a></span>)}</label>
                                    <input
                                        type="file"
                                        id="audioFile"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                        accept="audio/mpeg, audio/wav, audio/ogg, audio/*" // Chấp nhận các loại audio phổ biến
                                    />
                                    {audioFile && <span style={{ fontSize: '0.8rem', marginTop: '4px', color: '#555' }}>New: {audioFile.name}</span>}
                                    {errors.audioFile && <span className={styles.errorMessage}>{errors.audioFile}</span>}
                                </div>

                                {/* Description */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="description">Description</label>
                                    <textarea id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading}></textarea>
                                </div>

                                {/* Lyrics */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="lyrics">Lyrics</label>
                                    <textarea id="lyrics" rows="6" value={lyrics} onChange={(e) => setLyrics(e.target.value)} disabled={isLoading}></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Modal Footer chứa nút submit */}
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancel</button>
                        <button type="submit" className={styles.submitButton} disabled={isLoading || optionsLoading}>
                            {isLoading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Song')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SongFormModal;