// src/components/admin/StatCard.jsx
import React from 'react';
import styles from './StatCard.module.css';
// Import các icons tương ứng
import { FiMusic, FiUsers, FiDisc, FiTag, FiList } from 'react-icons/fi';

// Map loại thống kê với icon và màu sắc
const cardStyles = {
    songs: { icon: FiMusic, className: styles.songs },
    artists: { icon: FiUsers, className: styles.artists },
    albums: { icon: FiDisc, className: styles.albums },
    users: { icon: FiUsers, className: styles.users }, // Có thể dùng icon khác
    genres: { icon: FiTag, className: styles.genres },
    playlists: { icon: FiList, className: styles.playlists },
};

const StatCard = ({ type = 'songs', value = 0, label = 'Items' }) => {
    const Icon = cardStyles[type]?.icon || FiMusic; // Icon mặc định
    const iconBgClass = cardStyles[type]?.className || styles.songs; // Màu nền mặc định

    return (
        <div className={styles.card}>
            <div className={`${styles.iconWrapper} ${iconBgClass}`}>
                <Icon />
            </div>
            <div className={styles.content}>
                <p className={styles.value}>{value}</p>
                <p className={styles.label}>{label}</p>
            </div>
        </div>
    );
};

export default StatCard;