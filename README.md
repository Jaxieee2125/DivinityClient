# Divinity - Your Personal Music Streaming Client

Divinity là một ứng dụng client nghe nhạc được xây dựng với mục tiêu mang đến trải nghiệm nghe nhạc mượt mà và tùy biến. Dự án này được phát triển bằng React, Vite, và Zustand, kết nối với một API backend riêng biệt để quản lý dữ liệu âm nhạc.

![image](https://github.com/Jaxieee2125/MusicClient/public/ss1)
![image](https://github.com/Jaxieee2125/MusicClient/public/ss2)
![image](https://github.com/Jaxieee2125/MusicClient/public/ss3)


## Tính năng Hiện tại

*   **Giao diện Người dùng Hiện đại:** Lấy cảm hứng từ các ứng dụng nghe nhạc phổ biến, với theme tối và bố cục trực quan.
*   **Phát nhạc:**
    *   Trình phát nhạc đầy đủ tính năng ở cuối trang (Player Bar).
    *   Điều khiển cơ bản: Play, Pause, Next, Previous.
    *   Thanh trượt tiến độ (Seekbar) để tua nhạc.
    *   Điều khiển âm lượng và nút Mute.
    *   Chế độ Lặp lại (Repeat: None, All, One).
    *   Chế độ Phát ngẫu nhiên (Shuffle).
*   **Quản lý Hàng đợi (Queue):**
    *   Hiển thị hàng đợi phát hiện tại trong một sidebar phụ.
    *   Cho phép người dùng phát một bài hát cụ thể từ hàng đợi.
    *   Xóa bài hát khỏi hàng đợi.
*   **Khám phá Âm nhạc:**
    *   **Trang Chủ/Tracks:** Hiển thị danh sách các bài hát.
    *   **Trang Albums:** Hiển thị danh sách albums dưới dạng lưới card.
    *   **Trang Artists:** Hiển thị danh sách nghệ sĩ dưới dạng lưới card tròn.
    *   **Trang Genres:** Hiển thị danh sách các thể loại nhạc.
    *   **Trang Chi tiết Album:** Hiển thị thông tin album và danh sách bài hát thuộc album đó.
    *   **Trang Chi tiết Artist:** Hiển thị thông tin nghệ sĩ, các album mới phát hành và các bài hát phổ biến.
    *   **Trang Chi tiết Genre:** Hiển thị danh sách các bài hát thuộc thể loại được chọn.
    *   **Trang Chi tiết Playlist:** Hiển thị thông tin playlist và danh sách bài hát.
*   **Tương tác Bài hát:**
    *   Thêm bài hát vào hàng đợi.
    *   Yêu thích/Bỏ yêu thích bài hát (trạng thái được quản lý và đồng bộ với API).
    *   Tải bài hát về máy.
*   **Playlist:**
    *   Hiển thị danh sách playlist của người dùng trên sidebar.
    *   Tạo playlist mới thông qua modal.
    *   Thêm bài hát vào playlist hiện có thông qua modal.
    *   Xóa bài hát khỏi playlist.
    *   Xóa toàn bộ playlist.
*   **Tìm kiếm:**
    *   Mở modal tìm kiếm từ sidebar.
    *   Tìm kiếm tức thì (debounced) cho bài hát, album, nghệ sĩ.
    *   Chuyển đến trang kết quả tìm kiếm chi tiết khi nhấn Enter.
*   **Hồ sơ Người dùng:**
    *   Xem thông tin cá nhân.
    *   Chỉnh sửa thông tin cá nhân (username, email, ngày sinh, ảnh đại diện).
    *   (Kế hoạch) Đổi mật khẩu.
*   **Giao diện Quản trị (Admin Interface - Tích hợp):**
    *   Đăng nhập riêng cho Admin.
    *   Quản lý (Xem, Thêm, Sửa, Xóa) các thực thể: Songs, Artists, Albums, Users, Music Genres.
    *   Quản lý Yêu cầu Bài hát từ người dùng (Song Requests).
    *   Dashboard cơ bản hiển thị thống kê.
    *   Phân trang và tìm kiếm trên các trang quản lý.

## Công nghệ Sử dụng (Frontend)

*   **React:** Thư viện JavaScript để xây dựng giao diện người dùng.
*   **Vite:** Công cụ build và server dev siêu nhanh.
*   **Zustand:** Thư viện quản lý state đơn giản và mạnh mẽ.
*   **React Router DOM:** Xử lý routing và điều hướng trang.
*   **Axios:** Gửi request HTTP đến API backend.
*   **CSS Modules:** Để viết CSS có phạm vi cục bộ, tránh xung đột.
*   **React Icons:** Thư viện icon phổ biến.
*   **React Toastify:** Hiển thị thông báo (toast notifications).
*   **React Modal:** (Nếu bạn đã sử dụng một thư viện modal cụ thể, hãy liệt kê ở đây, ví dụ `react-modal`).

## Thiết lập Dự án

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/Jaxieee2125/MusicClient.git # <<< THAY THẾ BẰNG URL REPO CỦA BẠN
    cd MusicClient
    ```

2.  **Cài đặt Dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình API Backend:**
    *   Mở file `vite.config.js`.
    *   Chỉnh sửa `target` để trỏ đến địa chỉ API backend Django của bạn:
        ```javascript
        server: {
          proxy:{
            '/api': {
              target: 'http://127.0.0.1:8000',
              changeOrigin: true,
            },
          },
          allowedHosts: true,
        },
        ```

4.  **Chạy Ứng dụng Development:**
    ```bash
    npm run dev
    ```
    Ứng dụng sẽ khởi chạy trên một cổng cục bộ (thường là `http://localhost:5173` hoặc một cổng khác nếu 5173 đã được sử dụng).

## Để Sử dụng Trang Admin

1.  **Tạo tài khoản Admin ở Backend:** Đảm bảo bạn đã tạo một tài khoản người dùng có quyền admin (`một bản ghi trong collection `admin`).
2.  **Đăng nhập Admin:** Truy cập vào route đăng nhập admin của ứng dụng (ví dụ: `/admin/login` nếu bạn đã tạo).
3.  **Truy cập các trang quản lý:** Sau khi đăng nhập, bạn có thể truy cập các trang quản lý thông qua URL (ví dụ: `/admin`, `/admin/songs`, ...).

## Các Tính năng Kế hoạch (TODO)

*   Tích hợp tìm kiếm vào Toolbar chính (thay vì chỉ trên Sidebar).
*   Trang cài đặt người dùng.
*   Chức năng "Quên mật khẩu".
*   Xử lý lỗi và thông báo người dùng chi tiết hơn.
*   Tối ưu hóa hiệu suất.
*   Viết Unit Test.
*   Hỗ trợ kéo thả cho hàng đợi.
*   Tùy chỉnh theme.
*   ...và nhiều hơn nữa!

## Đóng góp

Nếu bạn muốn đóng góp cho dự án, vui lòng tạo một Issue để thảo luận về thay đổi bạn muốn thực hiện hoặc một Pull Request với các cải tiến của bạn.

## Tác giả

*   **Jaxieee2125** - _Phát triển chính_ - [Jaxieee2125](https://github.com/Jaxieee2125)
*   **thinhziro239** - [thinhziro239](https://github.com/thinhziro239)
