# 🚀 VPS Manager (MVM - My VPS Manager)

> **Hệ thống Quản lý, Giám sát & Điều khiển Máy chủ Linux (VPS) Trực quan Thời gian thực**

VPS Manager là giải pháp web đa năng giúp quản trị viên quản lý đồng thời nhiều máy chủ Linux (VPS) một cách an toàn và trực quan thông qua giao diện Web hiện đại, không cần cài đặt agent rườm rà trên VPS (chỉ sử dụng kết nối SSH chuẩn).

---

## 🌟 Các Tính Năng Đã Hoàn Thành (Completed Features)

### 1. 🖥️ Quản Lý Đa Máy Chủ VPS (Multi-VPS Management)
- **Tạo & Quản lý Profiles**: Thêm, sửa, xóa danh sách các VPS linh hoạt.
- **Phương thức xác thực SSH linh hoạt**:
  - Xác thực qua **Mật khẩu (Password)**.
  - Xác thực qua **SSH Key (RSA, Ed25519)** hỗ trợ cả Passphrase mã hóa.
- **Kiểm tra kết nối (SSH Health Check)**: Thử kết nối tức thì tới VPS và thông báo trạng thái.
- **Lưu trữ an toàn trên Browser**: Tự động đồng bộ cấu hình cấu hình cục bộ via LocalStorage.

---

### 2. 📊 Giám Sát Tài Nguyên Thời Gian Thực (Real-time System Metrics)
- **Thông tin tổng quan hệ thống**: Tên Hostname, Hệ điều hành (OS / Distribution), Kernel version, Kiến trúc CPU, Uptime (Thời gian hoạt động liên tục).
- **Widgets chỉ số thời gian thực**:
  - **CPU Usage**: Tải trọng CPU hiện tại.
  - **RAM Usage**: Bộ nhớ RAM đã dùng / Tổng RAM khả dụng (MB / GB).
  - **Disk Usage**: Dung lượng ổ cứng root `/` và các phân vùng.
  - **Network I/O**: Lưu lượng mạng nhận / gửi (KB/s).
- **Biểu đồ lịch sử (Metric History Chart)**: Sử dụng Recharts hiển thị diễn biến tài nguyên theo chu kỳ tự động làm mới (Auto Refresh 5s, 10s, 30s hoặc Thủ công).

---

### 3. 💻 Web SSH Terminal Thời Gian Thực (Live Terminal)
- **Truy cập Shell trực tiếp từ Trình duyệt**: Tích hợp terminal chuẩn Linux trên giao diện Web mà không cần ứng dụng SSH bên thứ ba (PuTTY, OpenSSH CLI).
- **Công nghệ kết nối**:
  - Frontend: `@xterm/xterm` + `@xterm/addon-fit` tạo giao diện terminal chuẩn ANSI.
  - Backend: **ASP.NET Core SignalR** truyền nhận dữ liệu qua WebSockets kết hợp stream piping với **Renci.SshNet**.
- **Tính năng nổi bật**:
  - Tự động thay đổi kích thước PTY terminal theo cửa sổ trình duyệt.
  - Hiển thị đầy đủ màu sắc ANSI code, hỗ trợ các phím tắt, autocomplete (Tab), phím điều hướng (Arrow keys).
  - Tự động dọn dẹp và đóng phiên SSH session khi ngắt kết nối WebSocket.

---

### 4. 🐳 Quản Lý Docker & Docker Compose Nâng Cao (Docker Dashboard)
- **Tổng quan Docker (Overview)**: Thống kê số lượng Containers (Running, Stopped, Paused), Images, Volumes, Networks.
- **Quản lý Container (Container Lifecycle Management)**:
  - Xem danh sách chi tiết các container đang chạy / đã dừng (Name, Image, Ports, Status, Created).
  - Thực hiện thao tác: **Start**, **Stop**, **Restart**, **Pause**, **Unpause**, **Delete** (Force remove).
  - **Xem Docker Logs**: Đọc log thời gian thực của từng container với tùy chọn dòng log (tail 50, 100, 200, 500 lines).
- **Quản lý Docker Compose Stacks**:
  - **Tự động quét (Discover)**: Tìm kiếm các file `docker-compose.yml` / `docker-compose.yaml` nằm trong hệ thống file của VPS.
  - **Điều khiển Compose Stack**: Chạy `docker compose up -d`, `down`, `restart`, `build` với 1-click.
  - **Trình chỉnh sửa trực tiếp (Live File Editor)**: Đọc và cho phép chỉnh sửa nội dung file `docker-compose.yml` trực tiếp ngay trên giao diện Web.
- **Dọn dẹp hệ thống (Prune)**: Xóa ổ đĩa rác (Prune Unused Volumes) và dọn dẹp Docker tài nguyên thừa (System Prune).

---

### 5. ⚙️ Giám Sát Dịch Vụ Hệ Thống (System Services Monitor)
- Theo dõi trạng thái hoạt động (Active/Running, Inactive/Stopped) của các dịch vụ hệ thống cốt lõi:
  - **Web Servers**: Nginx, Apache.
  - **Containers & SSH**: Docker, SSHD.
  - **Database & Cache**: MySQL/MariaDB, PostgreSQL, Redis.
  - **Bảo mật & Lịch trình**: UFW Firewall, Cron.

---

### 6. 🛡️ Nhật Ký Hệ Thống & Kiểm Tra An Ninh SSH (Logs & Security Audit)
- **Trình đọc Log Đa Năng**:
  - Đọc log từ `systemd journalctl` hoặc trực tiếp từ file `/var/log/*`.
  - Bộ lọc nâng cao: Lọc theo cấp độ log (Info, Warning, Error), tìm kiếm từ khóa, giới hạn số dòng hiển thị.
- **Kiểm tra An ninh SSH (SSH Security Audit)**:
  - Bóc tách lịch sử đăng nhập SSH (`/var/log/auth.log` / `ssh.service`).
  - Phân loại lượt đăng nhập **Thành công (Accepted)** và **Thất bại (Failed)**.
  - **Phát hiện Tấn công Brute-Force**: Tự động tổng hợp số lượt đăng nhập thất bại theo địa chỉ IP, nhận diện và cảnh báo các địa chỉ IP nghi vấn đang thực hiện tấn công dò quét mật khẩu VPS.

---

## 🛠️ Kiến Trúc & Công Nghệ Sử Dụng (Tech Stack)

### Backend (`/server`)
- **Framework**: .NET 9.0 (ASP.NET Core Web API).
- **Kiến trúc**: Clean Architecture 4 tầng (`Domain`, `Application`, `Infrastructure`, `Api`).
- **Giao tiếp Real-time**: ASP.NET Core SignalR (WebSockets).
- **SSH Library**: `Renci.SshNet` (Quản lý kết nối SSH, SFTP, Interactive Shell Stream).
- **Unit Testing**: xUnit (`serverMVM.Infrastructure.Tests`) kiểm thử bộ bóc tách thông tin Linux Parser.

### Frontend (`/client`)
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 + Lucide Icons + Framer Motion.
- **Biểu đồ**: Recharts.
- **Web Terminal**: `@xterm/xterm` + `@xterm/addon-fit`.
- **Giao tiếp Real-time**: `@microsoft/signalr`.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
my_vps_manager/
├── client/                      # Ung dung Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/          # cac Component UI & Dashboard Tabs
│   │   │   ├── dashboard/       # Overview, SSH Config, Metrics, Terminal, Docker, Logs, Services
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   └── ui/              # Button, Card, Input, Badge, Progress...
│   │   ├── services/            # API Clients (vpsApi, dockerApi, logsApi)
│   │   ├── types/               # TypeScript interfaces & enums
│   │   ├── App.tsx              # Root Component chính
│   │   └── main.tsx             # Entrypoint
│   └── package.json
│
├── server/                      # Ung dung Backend (.NET 9 Web API)
│   ├── src/
│   │   ├── serverMVM.Api/          # Controllers, Hubs (SignalR TerminalHub), Program.cs
│   │   ├── serverMVM.Application/  # Interfaces, DTOs
│   │   ├── serverMVM.Domain/       # Domain Entities & Value Objects
│   │   └── serverMVM.Infrastructure/# Implementations (SshService, DockerService, SystemLogService, TerminalManager, Parsers)
│   └── tests/
│       └── serverMVM.Infrastructure.Tests/ # Unit tests (LinuxSystemInfoParserTests)
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Setup & Run)

### Yêu Cầu Tiền Đề (Prerequisites)
- **Node.js**: v18.0 trở lên
- **.NET SDK**: v9.0 trở lên

---

### 1. Khởi Chạy Backend Server (.NET 9)

```bash
cd server/src/serverMVM.Api
dotnet run
```
> Server sẽ khởi chạy tại: `http://localhost:5141` (Cấu hình Swagger/OpenAPI có sẵn tại môi trường Development).

---

### 2. Khởi Chạy Frontend Client (React + Vite)

```bash
cd client
npm install
npm run dev
```
> Giao diện Web sẽ chạy tại: `http://localhost:5173`. Mở trình duyệt và truy cập địa chỉ này để sử dụng ứng dụng.

---

### 3. Chạy Unit Test Backend

```bash
cd server
dotnet test
```

---

## 📝 Định Hướng Phát Triển Tiếp Theo (Future Roadmap)
- [ ] Hỗ trợ SFTP File Manager (Tải lên, tải xuống, sửa file trên VPS qua giao diện đồ họa).
- [ ] Cảnh báo qua Telegram / Discord Webhook khi CPU/RAM vượt ngưỡng hoặc phát hiện IP tấn công SSH.
- [ ] Quản lý tường lửa UFW trực tiếp trên Web UI.
- [ ] Lưu trữ mật khẩu/SSH key mã hóa an toàn ở phía Server Database (EF Core / SQLite / PostgreSQL).

---
*Dự án được xây dựng và duy trì bởi đội ngũ phát triển VPS Manager.* 💡
