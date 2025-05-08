// src/pages/admin/ManageSongRequests.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAdminSongRequests, updateAdminSongRequest } from '../../api/apiClient';
// <<< Sử dụng CSS Module chung của Admin >>>
import styles from './AdminPages.module.css';
import { toast } from 'react-toastify';
import { FiRefreshCcw, FiCheckSquare, FiXSquare, FiCheckCircle, FiEdit, FiTrash2 } from 'react-icons/fi'; // Thêm icon Edit/Trash nếu cần
import ReactModal from 'react-modal'; // Make sure this is imported
import { FiEye } from 'react-icons/fi'; // Add Eye icon
import { Link } from 'react-router-dom'; // For linking to Album/Artist pages

function ManageSongRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchRequests = useCallback(async () => {
        // ... (logic fetch giữ nguyên) ...
        setLoading(true); setError(null);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const response = await getAdminSongRequests(params);
            setRequests(Array.isArray(response.data?.results) ? response.data.results : []);
        } catch (err) {
            const errMsg = err.response?.data?.detail || err.message || "Failed to load song requests.";
            setError(errMsg); toast?.error(errMsg);
        } finally { setLoading(false); }
    }, [filterStatus]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const [selectedRequest, setSelectedRequest] = useState(null); // State to hold the request details
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // State to control modal visibility

    const handleUpdateStatus = async (requestId, newStatus) => {
        // ... (logic update giữ nguyên) ...
         setUpdatingId(requestId);
         let adminNotes = null;
         if (newStatus === 'rejected') { adminNotes = prompt(`Reason for rejecting request ID ${requestId}? (Optional)`); }
         try {
             const updateData = { status: newStatus };
             if (adminNotes !== null) { updateData.admin_notes = adminNotes; }
             await updateAdminSongRequest(requestId, updateData);
             toast?.success(`Request ${requestId} updated to ${newStatus}.`);
             fetchRequests();
         } catch (err) {
             const updateError = err.response?.data?.detail || err.message || `Failed to update request ${requestId}.`;
             toast?.error(updateError); setError(updateError);
         } finally { setUpdatingId(null); }
    };

    // Handlers for the Detail Modal
    const openDetailModal = (request) => {
        setSelectedRequest(request);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedRequest(null); // Clear selected request when closing
    };

    const formatDate = (dateString) => { /* Hàm format ngày giữ nguyên */ return dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', /*hour: '2-digit', minute: '2-digit'*/ }) : '-'; };

    return (
        // <<< Sử dụng class chung >>>
        <div className={styles.pageContainer}>
            {/* <<< Sử dụng class chung >>> */}
            <div className={styles.pageHeader}>
                <h1>Manage Song Requests</h1>
                {/* <button className={styles.addButton}>Add New</button> */}
            </div>

             {/* Filters */}
             <div className={styles.filters}> {/* <<< Sử dụng class chung hoặc tạo mới */}
                <label htmlFor="statusFilter">Filter by status:</label>
                <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    disabled={loading}
                    className={styles.selectInput} // <<< Giả sử có class này
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="added">Added</option>
                    <option value="">All</option>
                </select>
                 <button onClick={fetchRequests} disabled={loading || updatingId} className={styles.actionButton} title="Refresh"> {/* <<< Dùng actionButton chung? */}
                     <FiRefreshCcw />
                 </button>
            </div>

            {/* Loading, Error, No Data Messages */}
            {loading && <p className={styles.message}>Loading requests...</p>}
            {error && <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>}
            {!loading && requests.length === 0 && <p className={styles.message}>No requests found matching the criteria.</p>}

            {/* Table */}
            {!loading && requests.length > 0 && (
                <div className={styles.tableResponsive}> {/* <<< Sử dụng class chung hoặc tạo mới */}
                    {/* <<< Sử dụng class dataTable hoặc tạo mới */}
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                {/* Các th cần class chung nếu có */}
                                <th>#</th>
                                <th>Song Title</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Requested By</th>
                                <th>User Notes</th>
                                <th>Date Requested</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req, index) => (
                                <tr key={req._id} className={updatingId === req._id ? styles.updatingRow : ''}>
                                    <td>{index + 1}</td> {/* Số thứ tự */}
                                    <td>{req.song_title}</td>
                                    <td>{req.artist_name || '-'}</td>
                                    <td>{req.album_name || '-'}</td>
                                    <td>{req.username || req.user_id || 'N/A'}</td>
                                    <td title={req.notes || ''}>
                                        {req.notes ? `${req.notes.substring(0, 30)}${req.notes.length > 30 ? '...' : ''}` : '-'}
                                    </td>
                                    <td>{formatDate(req.requested_at)}</td>
                                    <td>
                                        {/* <<< Sử dụng class statusBadge hoặc tạo mới */}
                                        <span className={`${styles.statusBadge} ${styles[`status-${req.status}`]}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        {/* <<< Sử dụng class actionButtons và actionButton */}
                                        <div className={styles.actionButtons}>
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req._id, 'approved')}
                                                        disabled={updatingId === req._id}
                                                        className={styles.actionButton} // <<< Class chung
                                                        title="Approve"
                                                    >
                                                         <FiCheckSquare size={16} /> {/* Chỉnh size icon */}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req._id, 'rejected')}
                                                        disabled={updatingId === req._id}
                                                        className={styles.actionButton} // <<< Class chung
                                                        title="Reject"
                                                    >
                                                         <FiXSquare size={16} /> {/* Chỉnh size icon */}
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'added')}
                                                    disabled={updatingId === req._id}
                                                    className={styles.actionButton} // <<< Class chung
                                                    title="Mark as Added"
                                                >
                                                    <FiCheckCircle size={16} /> {/* Chỉnh size icon */}
                                                </button>
                                            )}
                                            {/* Thêm nút Edit/Delete nếu cần, dùng icon tương tự */}
                                            {/* <button className={styles.actionButton} title="Edit"><FiEdit size={16}/></button> */}
                                            {/* <button className={styles.actionButton} title="Delete"><FiTrash2 size={16}/></button> */}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            {/* ... Approve/Reject/Added buttons ... */}

                                            {/* View Details Button */}
                                            <button
                                                onClick={() => openDetailModal(req)} // Call the open function
                                                className={styles.actionButton} // Use existing or new style
                                                title="View Details"
                                            >
                                                <FiEye size={16} /> {/* Eye icon */}
                                            </button>

                                            {/* Optional Delete Button (add API and handler if needed) */}
                                            {/* <button
                                                onClick={() => handleDeleteRequest(req._id)} // You'll need handleDeleteRequest
                                                disabled={updatingId === req._id}
                                                className={`${styles.actionButton} ${styles.rejectButton}`} // Example: reuse reject style
                                                title="Delete Request"
                                            >
                                                <FiTrash2 size={16} />
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Render Detail Modal */}
                    <RequestDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={closeDetailModal}
                        requestData={selectedRequest}
                        formatDate={formatDate} // Pass the formatDate function
                    />
                </div>
            )}
        </div>
    );
}

// --- DEFINE THE MODAL COMPONENT HERE (outside ManageSongRequests) ---
function RequestDetailModal({ isOpen, onClose, requestData, formatDate, styles }) { // Receive styles prop
    if (!requestData) return null;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{ /* Your modal styles */
                overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 },
                content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '25px', maxWidth: '600px', width: '90%', color: '#333', maxHeight: '80vh', overflowY: 'auto' }
            }}
            contentLabel="Song Request Details"
        >
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                Request Details (ID: <code style={{ fontSize: '0.9em', background:'#eee', padding: '2px 4px'}}>{requestData._id}</code>)
            </h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '10px 15px', fontSize: '0.9rem' }}>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Song Title:</dt>       <dd style={{ margin: 0 }}>{requestData.song_title}</dd>
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Artist:</dt>         <dd style={{ margin: 0 }}>{requestData.artist_name || '-'}</dd>
                {/* ... other dt/dd pairs ... */}
                <dt style={{ fontWeight: 'bold', color: '#555'}}>Status:</dt>
                <dd style={{ margin: 0 }}>
                    {/* Use styles prop here */}
                    <span className={`${styles?.statusBadge} ${styles?.[`status-${requestData.status}`]}`}>
                         {requestData.status}
                    </span>
                </dd>
                 <dt style={{ fontWeight: 'bold', color: '#555', gridColumn: '1 / -1' }}>User Notes:</dt>
                 <dd style={{ whiteSpace: 'pre-wrap', margin: 0, gridColumn: '1 / -1', background: '#f8f9fa', padding: '8px', borderRadius: '4px', border: '1px solid #eee' }}>{requestData.notes || '-'}</dd>
                 {/* ... Processed At, Admin Notes ... */}
            </dl>
            <button onClick={onClose} style={{ marginTop: '25px', padding: '8px 15px', cursor: 'pointer' }}>Close</button>
        </ReactModal>
    );
}

export default ManageSongRequests;