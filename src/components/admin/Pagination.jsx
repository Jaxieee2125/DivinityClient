// src/components/admin/Pagination.jsx
import React from 'react';
import styles from './Pagination.module.css'; // Tạo file CSS này

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }) => {
    if (totalPages <= 1) {
        return null; // Không hiển thị nếu chỉ có 1 trang hoặc không có trang nào
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Tạo dãy số trang (có thể làm phức tạp hơn với dấu '...')
    const pageNumbers = [];
    // Logic đơn giản: hiển thị vài trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) { endPage = Math.min(totalPages, 5); }
    if (currentPage >= totalPages - 2) { startPage = Math.max(1, totalPages - 4); }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className={styles.paginationContainer}>
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1 || disabled}
                className={styles.pageButton}
            >
                « Previous
            </button>

            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className={styles.pageNumber} disabled={disabled}>1</button>
                    {startPage > 2 && <span className={styles.ellipsis}>...</span>}
                </>
            )}

            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    disabled={disabled}
                    className={`${styles.pageNumber} ${currentPage === number ? styles.active : ''}`}
                >
                    {number}
                </button>
            ))}

             {endPage < totalPages && (
                <>
                     {endPage < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
                     <button onClick={() => onPageChange(totalPages)} className={styles.pageNumber} disabled={disabled}>{totalPages}</button>
                </>
            )}


            <button
                onClick={handleNext}
                disabled={currentPage === totalPages || disabled}
                className={styles.pageButton}
            >
                Next »
            </button>
        </div>
    );
};

export default Pagination;