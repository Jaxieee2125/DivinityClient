// src/components/RequestSongForm.jsx
import React, { useState } from 'react';
import { requestSong } from '../api/apiClient'; // Đổi đường dẫn nếu cần
import styles from './RequestSongForm.module.css'; // Tạo CSS mới

function RequestDetailModal({ isOpen, onClose, requestData, formatDate }) { // Pass formatDate as prop
    if (!requestData) return null;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{ // Example inline styles, prefer CSS Modules
                overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 },
                content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '25px', maxWidth: '600px', width: '90%', color: '#333', maxHeight: '80vh', overflowY: 'auto' }
            }}
            contentLabel="Song Request Details"
        >
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                Request Details (ID: <code style={{ fontSize: '0.9em', background:'#eee', padding: '2px 4px'}}>{requestData._id}</code>)
            </h2>
            {/* Using a more structured layout (like definition list or grid) */}
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '10px 15px', fontSize: '0.9rem' }}>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Song Title:</dt>       <dd style={{ margin: 0 }}>{requestData.song_title}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Artist:</dt>         <dd style={{ margin: 0 }}>{requestData.artist_name || '-'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Album:</dt>          <dd style={{ margin: 0 }}>{requestData.album_name || '-'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Requested By:</dt>    <dd style={{ margin: 0 }}>{requestData.username || requestData.user_id || 'N/A'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Requested At:</dt>   <dd style={{ margin: 0 }}>{formatDate(requestData.requested_at)}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Status:</dt>         <dd style={{ margin: 0 }}><span className={`${styles.statusBadge} ${styles[`status-${requestData.status}`]}`}>{requestData.status}</span></dd>
                <dt style={{ fontWeight: 'bold', color: '#555', gridColumn: '1 / -1' }}>User Notes:</dt>     <dd style={{ whiteSpace: 'pre-wrap', margin: 0, gridColumn: '1 / -1', background: '#f8f9fa', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>{requestData.notes || '-'}</dd>
                {/* Display admin processing info only if available */}
                {requestData.processed_at && (
                    <>
                       <hr style={{ gridColumn: '1 / -1', border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }}/>
                       <dt style={{ fontWeight: 'bold', color: '#555'}}>Processed At:</dt>   <dd style={{ margin: 0 }}>{formatDate(requestData.processed_at)}</dd>
                       <dt style={{ fontWeight: 'bold', color: '#555', gridColumn: '1 / -1' }}>Admin Notes:</dt>    <dd style={{ whiteSpace: 'pre-wrap', margin: 0, gridColumn: '1 / -1', background: '#f8f9fa', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>{requestData.admin_notes || '-'}</dd>
                    </>
                )}
            </dl>
            <button onClick={onClose} style={{ marginTop: '25px', padding: '8px 15px', cursor: 'pointer' }}>Close</button>
        </ReactModal>
    );
}

function RequestSongForm({ onClose }) { // Thêm prop onClose nếu form nằm trong modal
    const [formData, setFormData] = useState({
        song_title: '',
        artist_name: '',
        album_name: '',
        notes: '',
    });
    const [error, setError] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error[name]) setError(prev => ({...prev, [name]: null}));
        if (error.general) setError(prev => ({...prev, general: null}));
         setSuccessMessage(''); // Xóa success khi bắt đầu nhập lại
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.song_title.trim()) {
             setError({ song_title: 'Vui lòng nhập tên bài hát.' });
             return;
        }
        setError({});
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await requestSong(formData);
            setSuccessMessage(response.data.message || 'Gửi yêu cầu thành công!');
            // Xóa form
            setFormData({ song_title: '', artist_name: '', album_name: '', notes: '' });
            // Có thể tự động đóng modal sau vài giây
            if (onClose) setTimeout(onClose, 2000);

        } catch (err) {
            console.error("Song request error:", err.response || err.message);
             if (err.response && err.response.data) {
                 if (typeof err.response.data === 'object' && err.response.data !== null) {
                     const backendErrors = {};
                     // ... (logic xử lý lỗi backend tương tự các form khác) ...
                      for (const key in err.response.data) {
                         if (Array.isArray(err.response.data[key])) {
                            backendErrors[key] = err.response.data[key].join(' ');
                         } else { backendErrors.general = err.response.data[key]; }
                      }
                     if(err.response.data.detail) backendErrors.general = err.response.data.detail;
                      if(err.response.data.error) backendErrors.general = err.response.data.error;
                     setError(backendErrors);
                 } else { setError({ general: 'Gửi yêu cầu thất bại.' }); }
            } else { setError({ general: 'Lỗi mạng hoặc không xác định.' }); }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
                {successMessage && <p className={styles.success}>{successMessage}</p>}
                {error.general && <p className={styles.error}>{error.general}</p>}

                <div className={styles.inputGroup}>
                    <label htmlFor="song_title" className={styles.label}>Tên bài hát *</label>
                    <input type="text" id="song_title" name="song_title" value={formData.song_title} onChange={handleChange} required className={styles.input} disabled={loading} />
                    {error.song_title && <p className={styles.fieldError}>{error.song_title}</p>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="artist_name" className={styles.label}>Tên nghệ sĩ</label>
                    <input type="text" id="artist_name" name="artist_name" value={formData.artist_name} onChange={handleChange} className={styles.input} disabled={loading} />
                     {error.artist_name && <p className={styles.fieldError}>{error.artist_name}</p>}
                </div>
                 <div className={styles.inputGroup}>
                    <label htmlFor="album_name" className={styles.label}>Tên album</label>
                    <input type="text" id="album_name" name="album_name" value={formData.album_name} onChange={handleChange} className={styles.input} disabled={loading} />
                     {error.album_name && <p className={styles.fieldError}>{error.album_name}</p>}
                </div>
                 <div className={styles.inputGroup}>
                    <label htmlFor="notes" className={styles.label}>Ghi chú (Link, lời nhắn,...)</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" className={styles.textarea} disabled={loading}></textarea>
                     {error.notes && <p className={styles.fieldError}>{error.notes}</p>}
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
                {/* Nút đóng nếu là modal */}
                {onClose && <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>Hủy</button>}
            </form>
        </div>
    );
}

export default RequestSongForm;