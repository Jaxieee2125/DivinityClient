// src/components/admin/AlbumFormModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SongFormModal.module.css'; // Tái sử dụng CSS
import { FiX, FiSearch } from 'react-icons/fi';
import { getArtistOptions } from '../../api/apiClient'; // Chỉ cần Artist options

const AlbumFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false, apiError = null }) => {
    // --- State cho form fields ---
    const [albumName, setAlbumName] = useState('');
    const [artistId, setArtistId] = useState(''); // Chỉ chọn 1 artist cho album
    const [releaseTime, setReleaseTime] = useState(''); // Format YYYY-MM-DD
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null); // File object cho ảnh bìa mới
    const [existingImageUrl, setExistingImageUrl] = useState(null); // URL ảnh bìa hiện tại
    const [errors, setErrors] = useState({});

    // --- State cho select options ---
    const [availableArtists, setAvailableArtists] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState(null);
    const [artistSearchTerm, setArtistSearchTerm] = useState('');

    // --- Fetch Artist Options ---
    const fetchArtistOptions = useCallback(async () => {
        setOptionsLoading(true); setOptionsError(null);
        try {
            const response = await getArtistOptions();
            setAvailableArtists(response.data || []);
        } catch (err) {
            console.error("Error fetching artist options:", err);
            setOptionsError("Failed to load artists options.");
        } finally { setOptionsLoading(false); }
    }, []);

    useEffect(() => {
        if (isOpen && availableArtists.length === 0) {
            fetchArtistOptions();
        }
        if (!isOpen) { setArtistSearchTerm(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // --- Điền dữ liệu vào form ---
    useEffect(() => {
        if (isOpen) {
            if (initialData) { // Edit
                setAlbumName(initialData.album_name || '');
                // Lấy artist ID từ artist lồng nhau hoặc artist_id gốc
                setArtistId(String(initialData.artist?._id || initialData.artist_id || ''));
                setReleaseTime(initialData.release_time ? new Date(initialData.release_time).toISOString().split('T')[0] : '');
                setDescription(initialData.description || '');
                setImageFile(null); // Reset file input
                setExistingImageUrl(initialData.image_url || null); // Lưu URL ảnh hiện tại
            } else { // Add
                setAlbumName(''); setArtistId(''); setReleaseTime(''); setDescription('');
                setImageFile(null); setExistingImageUrl(null);
            }
            setErrors({});
        }
    }, [initialData, isOpen]);

    // --- Lọc Artist Options ---
    const filteredArtists = useMemo(() => {
        if (!artistSearchTerm) return availableArtists;
        const lowerCaseQuery = artistSearchTerm.toLowerCase();
        return availableArtists.filter(artist =>
            artist.artist_name.toLowerCase().includes(lowerCaseQuery)
        );
    }, [availableArtists, artistSearchTerm]);

    // --- Validation ---
    const validateForm = () => {
        const newErrors = {};
        if (!albumName.trim()) newErrors.albumName = 'Album name is required.';
        if (!artistId) newErrors.artistId = 'Artist is required.'; // Album phải có nghệ sĩ
        // Thêm validation ảnh nếu cần
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading || optionsLoading) return;

        const formData = new FormData();
        formData.append('album_name', albumName.trim());
        formData.append('artist_id', artistId); // Gửi ID đã chọn
        if (releaseTime) formData.append('release_time', releaseTime);
        if (description.trim()) formData.append('description', description.trim());

        if (imageFile instanceof File) {
            formData.append('image', imageFile, imageFile.name); // Key 'image' phải khớp backend
        }

        onSubmit(formData, initialData?._id);
    };

    // Handler cho input file ảnh
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file && file instanceof File) {
            setImageFile(file);
            setExistingImageUrl(null);
            setErrors(prev => ({ ...prev, image: undefined }));
        } else {
            setImageFile(null);
            if (initialData) setExistingImageUrl(initialData.image_url || null);
        }
    };

    // --- Render ---
    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeButton} title="Close" disabled={isLoading}><FiX /></button>
                <div className={styles.modalHeader}>
                    {initialData ? 'Edit Album' : 'Add New Album'}
                </div>
                {apiError && <div className={styles.apiErrorBanner}>Error: {apiError}</div>}
                {optionsError && <div className={styles.apiErrorBanner}>{optionsError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {optionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Loading options...</div>
                        ) : (
                            <div className={styles.formGrid}>
                                {/* Album Name */}
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label htmlFor="albumName" className={styles.required}>Album Name</label>
                                    <input type="text" id="albumName" value={albumName} onChange={(e) => setAlbumName(e.target.value)} disabled={isLoading} required />
                                    {errors.albumName && <span className={styles.errorMessage}>{errors.albumName}</span>}
                                </div>

                                {/* Artist ID (Select Single + Search) */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="artistId" className={styles.required}>Artist</label>
                                    <div className={styles.selectSearchContainer}>
                                        <FiSearch className={styles.selectSearchIcon} />
                                        <input type="text" placeholder="Search artists..." value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} className={styles.selectSearchInput} disabled={isLoading || optionsLoading} />
                                    </div>
                                    <select id="artistId" value={artistId} onChange={(e) => setArtistId(e.target.value)} disabled={isLoading || optionsLoading} required>
                                        <option value="">-- Select Artist --</option>
                                        {filteredArtists.map(artist => ( <option key={artist._id} value={artist._id}> {artist.artist_name} </option> ))}
                                        {filteredArtists.length === 0 && artistSearchTerm && ( <option disabled>No artists found matching "{artistSearchTerm}"</option> )}
                                        {filteredArtists.length === 0 && !artistSearchTerm && availableArtists.length > 0 && ( <option disabled>Scroll or search...</option> )}
                                        {availableArtists.length === 0 && !optionsLoading && ( <option disabled>No artists available</option> )}
                                    </select>
                                    {errors.artistId && <span className={styles.errorMessage}>{errors.artistId}</span>}
                                </div>

                                {/* Release Time */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="releaseTime">Release Date</label>
                                    <input type="date" id="releaseTime" value={releaseTime} onChange={(e) => setReleaseTime(e.target.value)} disabled={isLoading}/>
                                </div>

                                {/* Image Upload */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="imageFile">Cover Image</label>
                                    {initialData && existingImageUrl && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img src={existingImageUrl} alt="Current Cover" style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #eee' }}/>
                                        </div>
                                    )}
                                    <input type="file" id="imageFile" onChange={handleFileChange} disabled={isLoading} accept="image/*" />
                                    {imageFile && <span className={styles.fileNameDisplay}>New: {imageFile.name}</span>}
                                    {errors.image && <span className={styles.errorMessage}>{errors.image}</span>}
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
                            {isLoading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Album')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AlbumFormModal;