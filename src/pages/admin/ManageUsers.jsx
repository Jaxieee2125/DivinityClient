// src/pages/admin/ManageUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../../api/apiClient';
import DataTable from '../../components/admin/DataTable.jsx';
import UserFormModal from '../../components/admin/UserFormModal.jsx'; // <<< Import form user
import ConfirmationModal from '../../components/admin/ConfirmationModal.jsx';
import styles from './AdminPages.module.css';
import { toast } from 'react-toastify';
import { FiUser } from 'react-icons/fi'; // Icon placeholder

// Component Avatar (Có thể dùng chung)
const UserAvatarDisplay = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [src]);
    return ( <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}> {!imgError && src ? ( <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} /> ) : ( <FiUser size={18} style={{ color: '#aaa' }} /> )} </div> );
};

const ManageUsers = () => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Data Fetching ---
    const fetchUsers = useCallback(async () => {
        if (users.length === 0) setLoading(true); setError(null);
        try {
            const response = await getUsers();
            setUsers(response.data || []);
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load users.";
            setError(apiError); toast.error(apiError);
            console.error("Fetch users error:", err);
        } finally { setLoading(false); }
    }, [users.length]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // --- Modal Handlers ---
    const openAddModal = () => { setEditingUser(null); setIsFormModalOpen(true); };
    const openEditModal = (user) => { setEditingUser(user); setIsFormModalOpen(true); };
    const closeFormModal = () => { setIsFormModalOpen(false); setEditingUser(null); setError(null); };
    const openConfirmModal = (userId, user) => { setUserToDelete({ id: userId, name: user?.username || 'this user' }); setIsConfirmModalOpen(true); };
    const closeConfirmModal = () => { setIsConfirmModalOpen(false); setUserToDelete(null); };

    // --- API Action Handlers ---
    const handleFormSubmit = async (formData) => {
        setIsSubmitting(true); setError(null);
        const action = editingUser ? 'updated' : 'added';
        try {
            if (editingUser) {
                await updateUser(editingUser._id, formData);
            } else {
                 await addUser(formData);
            }
            toast.success(`User ${action} successfully!`);
            closeFormModal();
            fetchUsers();
        } catch (err) {
             console.error(`Save user error (${action}):`, err);
             // Lấy lỗi chi tiết hơn từ backend nếu có (vd: username đã tồn tại)
             let apiError = `Failed to ${action} user.`;
             if (err.response?.data) {
                 // Thử lấy lỗi validation từ DRF/Django
                 const errors = err.response.data;
                 const errorMessages = Object.values(errors).flat(); // Lấy tất cả thông báo lỗi
                 if (errorMessages.length > 0) {
                     apiError = errorMessages.join(' ');
                 } else {
                     apiError = JSON.stringify(errors); // Fallback nếu cấu trúc lỗi khác
                 }
             } else {
                 apiError = err.message;
             }
             toast.error(`Error: ${apiError}`);
             setError(apiError); // Set lỗi để form hiển thị nếu cần
        } finally { setIsSubmitting(false); }
    };

     const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true); setError(null);
         try {
             await deleteUser(userToDelete.id);
             toast.success(`User "${userToDelete.name}" deleted successfully!`);
             closeConfirmModal();
             fetchUsers();
         } catch (err) {
             console.error("Delete user error:", err);
             const apiError = err.response?.data?.detail || err.message || "Failed to delete user.";
             toast.error(`Error deleting user: ${apiError}`);
             setError(apiError);
             closeConfirmModal();
         } finally { setIsDeleting(false); }
     };

    // --- Định nghĩa cột cho DataTable ---
    const columns = [
         { key: '_index', header: '#', width: '5%', render: (row, index) => <div style={{textAlign: 'right', paddingRight: '16px'}}>{index + 1}</div> },
         {
            key: 'username', header: 'User', width: '35%',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserAvatarDisplay src={row.profile_picture_url} alt={row.username} />
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#333', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {row.username || 'N/A'} </div>
                        {/* Có thể thêm email hoặc thông tin khác */}
                    </div>
                </div>
            )
        },
        { key: 'email', header: 'Email', width: '30%' },
        {
            key: 'date_of_birth', header: 'DOB', width: '15%',
            render: (row) => row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString() : '-' // Format ngày tháng
        },
         {
            key: 'is_active', header: 'Active?', width: '10%',
            render: (row) => row.is_active ? 'Yes' : 'No' // Hiển thị trạng thái admin
        },
    ];

    // --- Render ---
    if (loading && users.length === 0) return <div className={styles.message}>Loading users...</div>;
    if (error && !loading && users.length === 0 && !isFormModalOpen && !isConfirmModalOpen) return <div className={styles.error}>{error}</div>;
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>Manage Users</h1>
                <button onClick={openAddModal} className={styles.addButton} disabled={isSubmitting || isDeleting}>
                    Add New User
                </button>
            </div>

             {loading && users.length > 0 && <div className={styles.message}>Refreshing...</div>}

            <DataTable
                columns={columns}
                data={users}
                onEdit={openEditModal}
                onDelete={openConfirmModal}
                idKey="_id"
            />

            {/* --- Render Modals --- */}
            {isFormModalOpen && (
                 <UserFormModal
                   isOpen={isFormModalOpen}
                   onClose={closeFormModal}
                   onSubmit={handleFormSubmit}
                   initialData={editingUser}
                   isLoading={isSubmitting}
                   apiError={error}
                 />
            )}

            {isConfirmModalOpen && (
                 <ConfirmationModal
                   isOpen={isConfirmModalOpen}
                   onClose={closeConfirmModal}
                   onConfirm={confirmDelete}
                   title="Confirm Deletion"
                   message={`Are you sure you want to delete user <strong>${userToDelete?.name || ''}</strong>?`}
                   isLoading={isDeleting}
                 />
            )}
        </div>
    );
};

export default ManageUsers;