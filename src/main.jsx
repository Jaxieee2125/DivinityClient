// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Vite thường dùng .jsx
import './index.css' // Import Tailwind CSS
import { ToastContainer } from 'react-toastify'; // <<< Import
import 'react-toastify/dist/ReactToastify.css'; // <<< Import CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer
        position="top-right" // Vị trí hiển thị
        autoClose={3000} // Tự động đóng sau 3 giây
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Hoặc "light", "dark"
    />
  </React.StrictMode>,
)
