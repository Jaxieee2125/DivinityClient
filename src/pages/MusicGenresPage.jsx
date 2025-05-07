// src/pages/MusicGenresPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; // Dùng NavLink để có thể style active link
import { getMusicGenres } from '../api/apiClient'; // API function
import styles from './MusicGenresPage.module.css'; // <<< CSS Module cho trang này
import { FiTag, FiRefreshCcw, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MusicGenresPage = () => {
    // --- State ---
    const [allMusicGenres, setAllMusicGenres] = useState([]); // <<< Đổi tên state
    const [displayMusicGenres, setDisplayMusicGenres] = useState([]); // <<< Đổi tên state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    // Chỉ cần sort theo tên (A-Z hoặc Z-A)
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' hoặc 'desc'
    const [searchTerm, setSearchTerm] = useState(''); // Nếu muốn thêm tìm kiếm

    // --- Data Fetching ---
    const fetchAllMusicGenres = useCallback(async () => { // <<< Đổi tên hàm
        setLoading(true); setError(null);
        try {
            // API có thể nhận params sort nếu bạn muốn backend sort
            const response = await getMusicGenres(/* { sort: 'musicgenre_name', order: 'asc' } */);
            const fetchedGenres = response.data.results || response.data || [];
            setAllMusicGenres(fetchedGenres);
            setTotalCount(fetchedGenres.length);
        } catch (err) {
            const apiError = err.response?.data?.detail || err.message || "Failed to load music genres.";
            setError(apiError); toast.error(apiError); setAllMusicGenres([]); setTotalCount(0);
            console.error("Fetch music genres error:", err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAllMusicGenres(); }, [fetchAllMusicGenres]);

    // --- useEffect lọc/sort (client-side) ---
    useEffect(() => {
        let processedGenres = [...allMusicGenres];
        const lowerCaseSearch = searchTerm.toLowerCase().trim();

        // 1. Lọc (nếu có ô search)
        if (lowerCaseSearch) {
            processedGenres = processedGenres.filter(genre =>
                genre.musicgenre_name?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // 2. Sắp xếp theo musicgenre_name
        processedGenres.sort((a, b) => {
             let valA = a.musicgenre_name?.toLowerCase() || '';
             let valB = b.musicgenre_name?.toLowerCase() || '';
             let comparison = valA.localeCompare(valB); // So sánh chuỗi theo locale
             return sortOrder === 'desc' ? comparison * -1 : comparison;
        });

        setDisplayMusicGenres(processedGenres);

    }, [allMusicGenres, sortOrder, searchTerm]);

    // --- Handlers ---
    const handleSortOrderToggle = () => {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    };

    // --- Render ---
    if (loading) return <div className={styles.message}>Loading music genres...</div>;
    if (error && allMusicGenres.length === 0) return <div className={`${styles.message} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerIcon}><FiTag /></div>
                <h1 className={styles.pageTitle}>Genres</h1> {/* Giữ title "Genres" cho ngắn gọn */}
                {totalCount > 0 && <span className={styles.itemCount}>{totalCount}</span>}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                 <div className={styles.sortFilterGroup}>
                     {/* Nút Sort Order theo tên */}
                     <button
                        onClick={handleSortOrderToggle}
                        className={styles.sortButton} // Class mới cho nút này
                        title={`Sort Name: ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                        disabled={loading}
                     >
                         Name {sortOrder === 'asc' ? <FiArrowUp size={16} /> : <FiArrowDown size={16} />}
                     </button>
                     {/* TODO: Thêm SearchInput nếu bạn muốn có ô tìm kiếm ở đây */}
                     {/* <SearchInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} ... /> */}
                 </div>
                 <div className={styles.sortFilterGroup}>
                      <button className={styles.filterButton} title="Refresh" onClick={fetchAllMusicGenres} disabled={loading}>
                        <FiRefreshCcw />
                      </button>
                 </div>
            </div>

            {/* Danh sách Genres */}
            {displayMusicGenres.length === 0 && !loading && (
                <div className={styles.message}>No music genres found{searchTerm ? ` matching "${searchTerm}"` : ''}.</div>
            )}
            {displayMusicGenres.length > 0 && (
                <ul className={styles.genreList}>
                    {displayMusicGenres.map((genre) => (
                        <li key={genre._id}>
                            {/* NavLink đến trang chi tiết genre */}
                            <NavLink
                                to={`/musicgenre/${genre._id}`} // Route chi tiết genre
                                className={({ isActive }) => `${styles.genreLink} ${isActive ? styles.active : ''}`}
                            >
                                {/* Sử dụng tên trường từ API (musicgenre_name) */}
                                {genre.musicgenre_name || 'Unknown Genre'}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MusicGenresPage;