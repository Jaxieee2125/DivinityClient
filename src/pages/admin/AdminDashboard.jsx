// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../api/apiClient'; // Import API lấy stats
import StatCard from '../../components/admin/StatCard'; // Import component thẻ
import styles from './AdminDashboard.module.css'; // CSS riêng cho Dashboard
import adminPageStyles from './AdminPages.module.css'; // CSS chung nếu cần

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAdminStats();
            setStats(response.data);
        } catch (err) {
            setError("Failed to load dashboard statistics.");
            console.error("Fetch stats error:", err);
            // toast.error("Failed to load dashboard statistics.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className={adminPageStyles.pageContainer}> {/* Dùng style chung */}
            <div className={adminPageStyles.pageHeader}> {/* Dùng style chung */}
                <h1>Dashboard</h1>
                {/* Không có nút Add New ở đây */}
            </div>

            {loading && <div className={adminPageStyles.message}>Loading statistics...</div>}
            {error && <div className={adminPageStyles.error}>{error}</div>}

            {/* Phần Thống kê nhanh */}
            {stats && !loading && (
                <div className={styles.statsGrid}>
                    <StatCard type="songs" value={stats.total_songs ?? 0} label="Total Songs" />
                    <StatCard type="artists" value={stats.total_artists ?? 0} label="Total Artists" />
                    <StatCard type="albums" value={stats.total_albums ?? 0} label="Total Albums" />
                    <StatCard type="users" value={stats.total_users ?? 0} label="Total Users" />
                    <StatCard type="genres" value={stats.total_genres ?? 0} label="Total Genres" />
                    <StatCard type="playlists" value={stats.total_playlists ?? 0} label="Total Playlists" />
                </div>
            )}

            {/* Phần Quick Links (Ví dụ) */}
            <div className={styles.quickLinksSection}>
                <h2>Quick Actions</h2>
                <div className={styles.quickLinksGrid}>
                    <Link to="/admin/songs" className={styles.quickLinkCard}>Manage Songs</Link>
                    <Link to="/admin/artists" className={styles.quickLinkCard}>Manage Artists</Link>
                    <Link to="/admin/albums" className={styles.quickLinkCard}>Manage Albums</Link>
                    <Link to="/admin/users" className={styles.quickLinkCard}>Manage Users</Link>
                    <Link to="/admin/genres" className={styles.quickLinkCard}>Manage Genres</Link>
                     {/* Thêm link khác nếu cần */}
                </div>
            </div>

             {/* TODO: Thêm phần Biểu đồ hoặc Hoạt động gần đây nếu muốn */}

        </div>
    );
};

export default AdminDashboard;