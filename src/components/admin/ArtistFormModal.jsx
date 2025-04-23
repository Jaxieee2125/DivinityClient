// src/components/admin/ArtistFormModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SongFormModal.module.css'; // Tái sử dụng CSS của Song Form Modal
import { FiX, FiSearch } from 'react-icons/fi';
import { getGenreOptions } from '../../api/apiClient'; // Import API lấy genre options

const ArtistFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, apiError = null }) => {
    // --- State cho form fields ---
    const [artistName, setArtistName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(''); // YYYY-MM-DD
    const [national, setNational] = useState('');
    const [description, setDescription] = useState('');
    const [socialMedia, setSocialMedia] = useState('');
    const [musicGenreIds, setMusicGenreIds] = useState([]); // Mảng các ID string được chọn
    const [artistAvatarFile, setArtistAvatarFile] = useState(null); // File object cho avatar mới
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(null); // URL avatar hiện tại (edit mode)
    const [errors, setErrors] = useState({});

    // --- State cho select options ---
    const [availableGenres, setAvailableGenres] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState(null);
    const [genreSearchTerm, setGenreSearchTerm] = useState('');

    // --- Fetch Genre Options ---
    const fetchGenreOptions = useCallback(async () => {
        setOptionsLoading(true); setOptionsError(null);
        try {
            const response = await getGenreOptions();
            setAvailableGenres(response.data || []);
        } catch (err) {
            console.error("Error fetching genre options:", err);
            setOptionsError("Failed to load genre options.");
        } finally { setOptionsLoading(false); }
    }, []);

    useEffect(() => {
        if (isOpen && availableGenres.length === 0) {
            fetchGenreOptions();
        }
         if (!isOpen) { setGenreSearchTerm(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // --- Điền dữ liệu vào form ---
    useEffect(() => {
        if (isOpen) {
            if (initialData) { // Edit
                setArtistName(initialData.artist_name || '');
                setDateOfBirth(initialData.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : '');
                setNational(initialData.national || '');
                setDescription(initialData.description || '');
                setSocialMedia(initialData.social_media || '');
                setMusicGenreIds(initialData.musicgenre_ids?.map(id => String(id)) || []);
                setArtistAvatarFile(null);
                setExistingAvatarUrl(initialData.artist_avatar_url || null);
            } else { // Add
                setArtistName(''); setDateOfBirth(''); setNational(''); setDescription('');
                setSocialMedia(''); setMusicGenreIds([]); setArtistAvatarFile(null);
                setExistingAvatarUrl(null);
            }
            setErrors({});
        }
    }, [initialData, isOpen]);

    // --- Lọc Genre Options ---
    const filteredGenres = useMemo(() => {
        if (!genreSearchTerm) return availableGenres;
        const lowerCaseQuery = genreSearchTerm.toLowerCase();
        return availableGenres.filter(genre =>
            genre.musicgenre_name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [availableGenres, genreSearchTerm]);

    // --- Validation ---
    const validateForm = () => {
        const newErrors = {};
        if (!artistName.trim()) newErrors.artistName = 'Artist name is required.';
        // Thêm validation khác nếu cần (vd: định dạng social media url)
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading || optionsLoading) return;

        const formData = new FormData();
        formData.append('artist_name', artistName.trim());
        if (dateOfBirth) formData.append('date_of_birth', dateOfBirth);
        if (national.trim()) formData.append('national', national.trim());
        if (description.trim()) formData.append('description', description.trim());
        if (socialMedia.trim()) formData.append('social_media', socialMedia.trim());
        musicGenreIds.forEach(id => formData.append('musicgenre_ids', id));

        if (artistAvatarFile instanceof File) {
            formData.append('artist_avatar', artistAvatarFile, artistAvatarFile.name); // Key 'artist_avatar' phải khớp backend
        }
        // Nếu đang edit và không chọn file mới -> không cần gửi gì cho avatar
        // Backend sẽ tự giữ lại ảnh cũ nếu không nhận được key 'artist_avatar'
        // Hoặc bạn có thể gửi 1 trường 'clear_avatar' = true nếu muốn xóa ảnh

        onSubmit(formData, initialData?._id);
    };

    // Handler cho multi-select genres
    const handleGenreSelectChange = (event) => {
        const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
        setMusicGenreIds(selectedOptions);
    };

    // Handler cho input file avatar
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file && file instanceof File) {
            setArtistAvatarFile(file);
            setExistingAvatarUrl(null); // Ẩn hiển thị avatar cũ
            setErrors(prev => ({ ...prev, artistAvatar: undefined }));
        } else {
            setArtistAvatarFile(null);
            if (initialData) setExistingAvatarUrl(initialData.artist_avatar_url || null);
        }
    };

    // --- Render ---
    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}><FiX /></button>
                <div className={styles.modalHeader}>
                    {initialData ? 'Edit Artist' : 'Add New Artist'}
                </div>
                {apiError && <div className={styles.apiErrorBanner}>Error: {apiError}</div>}
                {optionsError && <div className={styles.apiErrorBanner}>{optionsError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                         {optionsLoading ? (
                             <div style={{textAlign: 'center', padding: '40px'}}>Loading options...</div>
                         ) : (
                            <div className={styles.formGrid}>
                                {/* Artist Name */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="artistName" className={styles.required}>Artist Name</label>
                                    <input type="text" id="artistName" value={artistName} onChange={(e) => setArtistName(e.target.value)} disabled={isLoading} required />
                                    {errors.artistName && <span className={styles.errorMessage}>{errors.artistName}</span>}
                                </div>

                                {/* Date of Birth */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="dateOfBirth">Date of Birth</label>
                                    <input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isLoading}/>
                                </div>

                                {/* Nationality */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="national">Nationality</label>
                                    <input type="text" id="national" value={national} onChange={(e) => setNational(e.target.value)} disabled={isLoading} />
                                </div>

                                {/* Social Media */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="socialMedia">Social Media URL</label>
                                    <input type="text" id="socialMedia" value={socialMedia} onChange={(e) => setSocialMedia(e.target.value)} disabled={isLoading} placeholder="e.g., https://twitter.com/artist"/>
                                </div>

                                 {/* Genres (Select Multiple + Search) */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="musicGenreIds">Genres</label>
                                    <div className={styles.selectSearchContainer}>
                                        <FiSearch className={styles.selectSearchIcon} />
                                        <input type="text" placeholder="Search genres..." value={genreSearchTerm} onChange={(e) => setGenreSearchTerm(e.target.value)} className={styles.selectSearchInput} disabled={isLoading || optionsLoading} />
                                    </div>
                                    <select id="musicGenreIds" multiple value={musicGenreIds} onChange={handleGenreSelectChange} disabled={isLoading || optionsLoading} size="5" className={styles.selectMultiple}>
                                        {filteredGenres.map(genre => ( <option key={genre._id} value={genre._id}> {genre.musicgenre_name} </option> ))}
                                        {filteredGenres.length === 0 && genreSearchTerm && ( <option disabled>No genres found matching "{genreSearchTerm}"</option> )}
                                        {filteredGenres.length === 0 && !genreSearchTerm && availableGenres.length > 0 && ( <option disabled>Scroll or search...</option> )}
                                        {availableGenres.length === 0 && !optionsLoading && ( <option disabled>No genres available</option> )}
                                    </select>
                                    <span style={{fontSize: '0.75rem', color: '#888'}}>Hold Ctrl/Cmd to select multiple.</span>
                                </div>


                                {/* Avatar Upload */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="artistAvatar">Avatar Image</label>
                                    {initialData && existingAvatarUrl && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img src={existingAvatarUrl} alt="Current Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}/>
                                        </div>
                                    )}
                                    <input type="file" id="artistAvatar" onChange={handleFileChange} disabled={isLoading} accept="image/*" />
                                    {artistAvatarFile && <span className={styles.fileNameDisplay}>New: {artistAvatarFile.name}</span>}
                                    {errors.artistAvatar && <span className={styles.errorMessage}>{errors.artistAvatar}</span>}
                                </div>


                                {/* Description */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="description">Description</label>
                                    <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading}></textarea>
                                </div>
                            </div>
                         )}
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>Cancel</button>
                        <button type="submit" className={styles.submitButton} disabled={isLoading || optionsLoading}>
                            {isLoading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Artist')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArtistFormModal;