// src/pages/admin/AdminDashboard.jsx (Ví dụ)
import React from 'react';

const AdminDashboard = () => {
    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>Dashboard</h1>
            <p>Welcome to the Admin Panel!</p>
            {/* TODO: Thêm các widget thống kê ở đây */}
        </div>
    );
};
export default AdminDashboard;

// Tạo các file tương tự cho ManageSongs, ManageArtists,...
// Ví dụ: src/pages/admin/ManageSongs.jsx
// import React from 'react';
// const ManageSongs = () => <div><h1>Manage Songs</h1> {/* TODO */}</div>;
// export default ManageSongs;