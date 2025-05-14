import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy:{
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': { // Hoặc bất kỳ giá trị MEDIA_URL nào bạn đặt trong settings.py
        target: 'http://127.0.0.1:8000', // Backend Django của bạn
        changeOrigin: true,
        // Thông thường không cần rewrite ở đây, vì Django phục vụ media
        // từ /media/ và frontend cũng sẽ request /media/
      }
    },
    allowedHosts: true,
  },
})
