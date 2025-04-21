// src/components/admin/DataTable.jsx
import React from 'react';
import styles from './DataTable.module.css';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // Icons cho actions

/**
 * Component DataTable tái sử dụng.
 * @param {array} columns - Mảng các object định nghĩa cột. vd: [{ key: 'song_name', header: 'Name' }, { key: 'artist_names', header: 'Artists', render?: (row) => ... }]
 * @param {array} data - Mảng dữ liệu để hiển thị.
 * @param {function} onEdit - Hàm callback khi nhấn nút Edit, nhận row data làm tham số.
 * @param {function} onDelete - Hàm callback khi nhấn nút Delete, nhận row data (hoặc chỉ id) làm tham số.
 * @param {string} idKey - Tên key chứa ID duy nhất cho mỗi hàng (mặc định là '_id').
 */
const DataTable = ({ columns, data, onEdit, onDelete, idKey = '_id' }) => {

  // Hàm render nội dung cell, kiểm tra xem có hàm render tùy chỉnh không
  const renderCell = (row, column, index) => {
    if (column.render && typeof column.render === 'function') {
      return column.render(row, index); // Gọi hàm render tùy chỉnh
    }
    // Nếu không có hàm render, hiển thị giá trị từ key tương ứng
    const value = column.key.split('.').reduce((o, k) => (o || {})[k], row); // Hỗ trợ key dạng 'album.album_name'
    return value !== null && value !== undefined ? String(value) : '-'; // Hiển thị '-' nếu null/undefined
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width || 'auto' }}>{col.header}</th>
            ))}
            {/* Thêm cột Actions nếu có hàm onEdit hoặc onDelete */}
            {(onEdit || onDelete) && <th className={styles.actionsCell}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <tr key={row[idKey]}>
                {columns.map((col) => (
                  <td key={`${row[idKey]}-${col.key}`}>
                    {renderCell(row, col, index)}
                  </td>
                ))}
                {/* Thêm cell Actions */}
                {(onEdit || onDelete) && (
                  <td className={styles.actionsCell}>
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit">
                         <FiEdit /> {/* Edit */}
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row[idKey], row)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete">
                         <FiTrash2 /> {/* Delete */}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              {/* Hiển thị "No data" nếu mảng data rỗng */}
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;