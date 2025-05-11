// src/pages/MySongRequestsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUserSongRequests /*, deleteUserSongRequest */ } from '../api/apiClient'; // API sẽ tạo
import styles from './MySongRequestsPage.module.css'; // CSS cho trang này
import { toast } from 'react-toastify';
import { FiRefreshCcw, FiTrash2 } from 'react-icons/fi'; // Icon
// import ConfirmationModal from '../components/modals/ConfirmationModal'; // Nếu có chức năng xóa

// Format Date (có thể dùng chung)
const formatDate = (dateString) => { return dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'; };

const MySongRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // State cho confirm delete (nếu có)
    // const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    // const [requestToDelete, setRequestToDelete] = useState(null);
    // const [isDeleting, setIsDeleting] = useState(false);

    const fetchMyRequests = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            // API này cần được bảo vệ bằng IsAuthenticated và tự lấy user_id từ token
            const response = await getUserSongRequests(); // API sẽ tạo
            setRequests(response.data.results || response.data || []);
        } catch (err) {
            const errMsg = err.response?.data?.detail || err.message || "Failed to load your song requests.";
            setError(errMsg); toast.error(errMsg);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

    // const handleDeleteRequest = (requestId, requestTitle) => {
    //     setRequestToDelete({ id: requestId, name: requestTitle });
    //     setIsConfirmOpen(true);
    // };

    // const confirmDelete = async () => {
    //     if (!requestToDelete) return;
    //     setIsDeleting(true);
    //     try {
    //         await deleteUserSongRequest(requestToDelete.id); // API xóa request (user chỉ xóa của mình)
    //         toast.success(`Request "${requestToDelete.name}" deleted.`);
    //         fetchMyRequests();
    //     } catch (err) { /* ... lỗi ... */ }
    //     finally { setIsDeleting(false); setIsConfirmOpen(false); setRequestToDelete(null); }
    // };

    if (loading) return <div className={styles.message}>Loading your requests...</div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>My Song Requests</h1>
                <button onClick={fetchMyRequests} disabled={loading} className={styles.filterButton} title="Refresh"> {/* Tái sử dụng class filterButton */}
                     <FiRefreshCcw />
                 </button>
                {/* TODO: Nút "Make a New Request" có thể mở modal hoặc link đến trang request */}
            </div>

            {requests.length === 0 && !loading && (
                <p className={styles.message}>You haven't made any song requests yet.</p>
            )}

            {requests.length > 0 && (
                <table className={styles.requestTable}>
                    <thead>
                        <tr className={styles.tableHeader}>
                            <th>#</th>
                            <th>Song Title</th>
                            <th>Artist</th>
                            <th>Album</th>
                            <th>Date Requested</th>
                            <th>Status</th>
                            <th>Admin Notes</th>
                            {/* <th>Actions</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req, index) => (
                            <tr key={req._id} className={styles.requestRow}>
                                <td>{index + 1}</td>
                                <td>{req.song_title}</td>
                                <td>{req.artist_name || '-'}</td>
                                <td>{req.album_name || '-'}</td>
                                <td>{formatDate(req.requested_at)}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[`status-${req.status}`]}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td title={req.admin_notes || ''}>
                                    {req.admin_notes ? `${req.admin_notes.substring(0, 50)}${req.admin_notes.length > 50 ? '...' : ''}` : '-'}
                                </td>
                                {/* <td>
                                    {req.status === 'pending' && ( // Chỉ cho phép xóa nếu đang pending
                                        <button
                                            onClick={() => handleDeleteRequest(req._id, req.song_title)}
                                            className={styles.actionButton} // Cần style này
                                            title="Cancel Request"
                                            disabled={isDeleting && requestToDelete?.id === req._id}
                                        >
                                            {isDeleting && requestToDelete?.id === req._id ? '...' : <FiTrash2 />}
                                        </button>
                                    )}
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/*
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Cancel Song Request"
                message={`Are you sure you want to cancel your request for "<strong>${requestToDelete?.name || ''}</strong>"?`}
                isLoading={isDeleting}
            />
            */}
        </div>
    );
};

export default MySongRequestsPage;