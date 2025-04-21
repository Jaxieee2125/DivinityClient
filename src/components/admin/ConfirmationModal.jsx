// src/components/admin/ConfirmationModal.jsx
import React from 'react';
import styles from './ConfirmationModal.module.css';

// Thêm prop isLoading
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Are you sure?", isLoading = false }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={!isLoading ? onClose : undefined}> {/* Ngăn đóng khi đang loading */}
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>{title}</h2>
                <p className={styles.modalMessage} dangerouslySetInnerHTML={{ __html: message }}></p>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={isLoading}> {/* Disable khi loading */}
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={styles.confirmButton} disabled={isLoading}> {/* Disable khi loading */}
                        {isLoading ? 'Deleting...' : 'Confirm'} {/* Hiển thị text loading */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;