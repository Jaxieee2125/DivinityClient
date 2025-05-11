// src/components/modals/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './ShareModal.module.css';
import { FiX, FiCopy, FiFacebook, FiTwitter, FiMessageSquare, FiLink } from 'react-icons/fi'; // FiMessageSquare cho WhatsApp
import { toast } from 'react-toastify';

const ShareModal = ({ isOpen, onClose, shareUrl, titleToShare = "this content" }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCopied(false); // Reset trạng thái copied khi modal mở
        }
    }, [isOpen]);

    const handleCopyLink = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000); // Reset nút copy sau 2s
        } catch (err) {
            console.error('Failed to copy link: ', err);
            toast.error("Failed to copy link.");
        }
    };

    // Placeholder cho chia sẻ mạng xã hội
    const handleSocialShare = (platform) => {
        let url = '';
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(`Check out ${titleToShare}!`);

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
                break;
            default:
                return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose(); // Đóng modal sau khi mở link chia sẻ
    };


    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span>Share "{titleToShare}"</span> {/* Hiển thị tên bài hát/album */}
                    <button onClick={onClose} className={styles.closeButton} title="Close"><FiX /></button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.shareDescription}>
                        Share this with your friends or copy the link.
                    </p>

                    <div className={styles.shareLinkContainer}>
                        <FiLink size={18} style={{marginRight: '8px', color: '#a0a0a0'}}/>
                        <input
                            type="text"
                            value={shareUrl || 'Loading link...'}
                            readOnly
                            className={styles.shareLinkInput}
                            onClick={(e) => e.target.select()} // Chọn text khi click
                        />
                        <button
                            onClick={handleCopyLink}
                            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                            disabled={!shareUrl}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className={styles.socialShareTitle}>Share on:</div>
                    <div className={styles.socialButtons}>
                        <button className={`${styles.socialButton} ${styles.facebook}`} onClick={() => handleSocialShare('facebook')} title="Share on Facebook">
                            <FiFacebook />
                        </button>
                        <button className={`${styles.socialButton} ${styles.twitter}`} onClick={() => handleSocialShare('twitter')} title="Share on Twitter">
                            <FiTwitter />
                        </button>
                         <button className={`${styles.socialButton} ${styles.whatsapp}`} onClick={() => handleSocialShare('whatsapp')} title="Share on WhatsApp">
                            <FiMessageSquare /> {/* Hoặc icon WhatsApp nếu có */}
                        </button>
                        {/* Thêm các nút social khác nếu cần */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;