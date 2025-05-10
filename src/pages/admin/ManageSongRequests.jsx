// src/pages/admin/ManageSongRequests.jsx
import React, { useState, useEffect, useCallback } from 'react';
// --- Sửa lại import API ---
import { getAdminSongRequests, updateAdminSongRequest } from '../../api/apiClient';
// -----------------------
import styles from './AdminPages.module.css';
import { toast } from 'react-toastify';
import { FiRefreshCcw, FiCheckSquare, FiXSquare, FiCheckCircle, FiEye } from 'react-icons/fi';
import ReactModal from 'react-modal';


// Đặt modal root element (thường trong file index.js hoặc App.js)
// ReactModal.setAppElement('#root'); // Ví dụ

// Format Date (Giữ nguyên)
const formatDate = (dateString) => { return dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; };

function ManageSongRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // Mặc định xem pending
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const response = await getAdminSongRequests(params); // <<< Gọi API đã sửa
            setRequests(Array.isArray(response.data?.results) ? response.data.results : []);
        // eslint-disable-next-line no-unused-vars
        } catch (err) { /* ... xử lý lỗi ... */ }
        finally { setLoading(false); }
        // eslint-disable-next-line no-const-assign, react-hooks/rules-of-hooks
        fetchRequests = useCallback(async () => {
            setLoading(true); setError(null);
            try {
                const params = filterStatus ? { status: filterStatus } : {};
                const response = await getAdminSongRequests(params);
                setRequests(Array.isArray(response.data?.results) ? response.data.results : []);
            } catch (err) {
                const errMsg = err.response?.data?.detail || err.message || "Failed to load song requests.";
                setError(errMsg); toast?.error(errMsg);
            } finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [filterStatus]);


    }, [filterStatus]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    // Handler cập nhật status
    const handleUpdateStatus = async (requestId, newStatus) => {
        setUpdatingId(requestId);
        let adminNotes = null;
        if (newStatus === 'rejected') {
            adminNotes = prompt(`Reason for rejecting request ID ${requestId}? (Optional)`);
             // Nếu người dùng nhấn Cancel trên prompt, adminNotes sẽ là null
             // Nếu muốn bắt buộc nhập lý do khi reject, cần kiểm tra kỹ hơn
        }
        try {
            const updateData = { status: newStatus };
            // Chỉ gửi admin_notes nếu nó có giá trị (không phải null)
            if (adminNotes !== null) {
                // eslint-disable-next-line no-undef
                updateData.admin_notes = admin_notes;
            }
            await updateAdminSongRequest(requestId, updateData); // <<< Gọi API đã sửa
            toast?.success(`Request ${requestId} status updated to ${newStatus}.`);
            fetchRequests(); // Tải lại danh sách
        } catch (err) {
            const updateError = err.response?.data?.detail || err.message || `Failed to update request ${requestId}.`;
            toast?.error(updateError); setError(updateError);
        } finally { setUpdatingId(null); }
    };

    // Modal handlers (Giữ nguyên)
    const openDetailModal = (request) => { setSelectedRequest(request); setIsDetailModalOpen(true); };
    const closeDetailModal = () => { setIsDetailModalOpen(false); setSelectedRequest(null); };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Song Requests</h1>
            </div>

             {/* Filters */}
             <div className={styles.filters}>
                <label htmlFor="statusFilter">Filter by status:</label>
                <select id="statusFilter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} disabled={loading} className={styles.selectInput} >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="added">Added</option>
                </select>
                 <button onClick={fetchRequests} disabled={loading || !!updatingId} className={styles.actionButton} title="Refresh">
                     <FiRefreshCcw />
                 </button>
            </div>

            {loading && <p className={styles.message}>Loading requests...</p>}
            {error && <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>}
            {!loading && requests.length === 0 && <p className={styles.message}>No requests found matching the criteria.</p>}

            {/* Table */}
            {!loading && requests.length > 0 && (
                <div className={styles.tableResponsive}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Song Title</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Requested By</th>{/* <<< Sử dụng thông tin user */}
                                <th>User Notes</th>
                                <th>Date Requested</th>
                                <th>Status</th>
                                {/* <th>Admin Notes</th><<< Thêm cột admin notes */}
                                <th>Processed At</th>{/* <<< Thêm cột thời gian xử lý */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req, index) => (
                                <tr key={req._id} className={updatingId === req._id ? styles.updatingRow : ''}>
                                    <td>{index + 1}</td>
                                    <td>{req.song_title}</td>
                                    <td>{req.artist_name || '-'}</td>
                                    <td>{req.album_name || '-'}</td>
                                    {/* --- SỬA LẠI ĐỂ HIỂN THỊ USERNAME --- */}
                                    <td>{req.username || 'Unknown'}</td>
                                    {/* ----------------------------------- */}
                                    <td title={req.notes || ''}>{req.notes ? `${req.notes.substring(0, 30)}...` : '-'}</td>
                                    <td>{formatDate(req.requested_at)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[`status-${req.status}`]}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    {/* --- THÊM CỘT ADMIN NOTES --- */}
                                    {/* <td title={req.admin_notes || ''}>{req.admin_notes ? `${req.admin_notes.substring(0, 30)}...` : '-'}</td> */}
                                    {/* ---------------------------- */}
                                    {/* --- THÊM CỘT PROCESSED AT --- */}
                                    <td>{formatDate(req.processed_at)}</td>
                                    {/* ---------------------------- */}
                                    <td>
                                        {/* --- Action Buttons --- */}
                                        <div className={styles.actionButtons}>
                                             {/* Nút View Details */}
                                             <button onClick={() => openDetailModal(req)} className={styles.actionButton} title="View Details" > <FiEye size={16} /> </button>
                                            {/* Các nút cập nhật trạng thái */}
                                            {req.status === 'pending' && ( <> <button onClick={() => handleUpdateStatus(req._id, 'approved')} disabled={!!updatingId} className={styles.actionButton} title="Approve" > <FiCheckSquare size={16} /> </button> <button onClick={() => handleUpdateStatus(req._id, 'rejected')} disabled={!!updatingId} className={styles.actionButton} title="Reject" > <FiXSquare size={16} /> </button> </> )}
                                            {req.status === 'approved' && ( <button onClick={() => handleUpdateStatus(req._id, 'added')} disabled={!!updatingId} className={styles.actionButton} title="Mark as Added" > <FiCheckCircle size={16} /> </button> )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Render Detail Modal --- */}
            {selectedRequest && (
                 <RequestDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={closeDetailModal}
                    requestData={selectedRequest}
                    formatDate={formatDate}
                    styles={styles} // Truyền styles nếu modal dùng chung class
                 />
            )}
        </div>
    );
}

// --- Component RequestDetailModal (Giữ nguyên hoặc cập nhật để hiển thị thêm trường) ---
function RequestDetailModal({ isOpen, onClose, requestData, formatDate, styles }) {
    if (!requestData) return null;
    return (
        <ReactModal isOpen={isOpen} onRequestClose={onClose} style={{ overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 }, content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '25px', maxWidth: '600px', width: '90%', color: '#333', maxHeight: '80vh', overflowY: 'auto' } }} contentLabel="Song Request Details" >
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}> Request Details (ID: <code style={{ fontSize: '0.9em', background:'#eee', padding: '2px 4px'}}>{requestData._id}</code>) </h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '10px 15px', fontSize: '0.9rem' }}>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Song Title:</dt> <dd style={{ margin: 0 }}>{requestData.song_title}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Artist:</dt> <dd style={{ margin: 0 }}>{requestData.artist_name || '-'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Album:</dt> <dd style={{ margin: 0 }}>{requestData.album_name || '-'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Requested By:</dt> <dd style={{ margin: 0 }}>{requestData.user?.username || 'Unknown'}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Requested At:</dt> <dd style={{ margin: 0 }}>{formatDate(requestData.requested_at)}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Status:</dt> <dd style={{ margin: 0 }}> <span className={`${styles?.statusBadge} ${styles?.[`status-${requestData.status}`]}`}> {requestData.status} </span> </dd>
                 <dt style={{ fontWeight: 'bold', color: '#555'}}>Processed At:</dt> <dd style={{ margin: 0 }}>{formatDate(requestData.processed_at)}</dd>
                 <dt style={{ fontWeight: 'bold', color: '#555', gridColumn: '1 / -1' }}>User Notes:</dt> <dd style={{ whiteSpace: 'pre-wrap', margin: 0, gridColumn: '1 / -1', background: '#f8f9fa', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>{requestData.notes || '-'}</dd>
                 <dt style={{ fontWeight: 'bold', color: '#555', gridColumn: '1 / -1' }}>Admin Notes:</dt> <dd style={{ whiteSpace: 'pre-wrap', margin: 0, gridColumn: '1 / -1', background: '#f8f9fa', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>{requestData.admin_notes || '-'}</dd>
            </dl>
            <button onClick={onClose} style={{ marginTop: '25px', padding: '8px 15px', cursor: 'pointer' }}>Close</button>
        </ReactModal>
    );
}


export default ManageSongRequests;