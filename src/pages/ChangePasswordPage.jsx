// src/pages/ChangePasswordPage.jsx
import React from 'react';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';
// Import Layout nếu bạn muốn trang này nằm trong layout chung
// import MainLayout from '../layouts/MainLayout';

function ChangePasswordPage() {
    return (
        // <MainLayout> // Hoặc Layout khác nếu cần
             <ChangePasswordForm />
        // </MainLayout>
    );
}

export default ChangePasswordPage;