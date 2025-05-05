// src/components/admin/SearchInput.jsx
import React from 'react';
import styles from './SearchInput.module.css'; // Tạo file CSS này
import { FiSearch, FiX } from 'react-icons/fi';

const SearchInput = ({ value, onChange, onSearch, placeholder = "Search...", disabled = false }) => {

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearch(); // Gọi hàm search khi nhấn Enter
        }
    };

    const clearSearch = () => {
        onChange({ target: { value: '' } }); // Mô phỏng event để xóa giá trị
        onSearch(''); // Thực hiện search với query rỗng để reset
    };

    return (
        <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
                type="text"
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={styles.searchInput}
                disabled={disabled}
            />
            {value && ( // Chỉ hiện nút clear nếu có text
                <button onClick={clearSearch} className={styles.clearButton} title="Clear search" disabled={disabled}>
                    <FiX />
                </button>
            )}
             <button onClick={()=> onSearch()} className={styles.searchButton} disabled={disabled}>
                 Search
             </button>
        </div>
    );
};

export default SearchInput;