# MY BRAIN ACADEMY

Ứng dụng Học viện Não bộ đa nền tảng (**Web App máy tính & Mobile App PWA di động**) chuyên sâu rèn luyện phản xạ tính toán và tư duy số học Super Brain (**Tính Nhẩm / Mental Math**).

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **PWA (Progressive Web App)**: `vite-plugin-pwa` với Service Worker tự động cập nhật, hỗ trợ hoạt động ngoại tuyến (Offline) và cài đặt trực tiếp lên iOS / Android / Desktop
- **Icons**: `lucide-react`
- **Deploy Target**: [GitHub Pages (`github.io`)](https://pages.github.com/) & [Vercel](https://vercel.com/)

---

## 📱 Cấu Trúc 2 Tab

1. **Tab Mental Math**: Không gian huấn luyện phản xạ tính nhẩm và tư duy não bộ Super Brain.
2. **Tab Hành trình ký ức Loci**: Không gian rèn luyện phương pháp ghi nhớ không gian Method of Loci / Cung điện ký ức (nội dung sẽ thiết kế và bổ sung sau).

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ (Local)

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### 3. Kiểm tra mã nguồn (Type Check / Lint)
```bash
npm run lint
```

### 4. Build phiên bản phát hành (Production Build)
```bash
npm run build
```
Thư mục xuất bản: `/dist`

---

## 🌐 HƯỚNG DẪN DEPLOY LÊN GITHUB PAGES (`github.io`)

Dự án đã được cấu hình sẵn:
- **`base: './'`** trong `vite.config.ts`: Chạy tốt trên cả root domain lẫn subfolder `https://<username>.github.io/<repo-name>/`.
- **`public/404.html`**: Tự động chuyển hướng và giữ nguyên URL khi refresh trang trên GitHub Pages.
- **Workflow tự động**: `.github/workflows/deploy.yml` tự động build và deploy mỗi khi push code lên GitHub.

### Các bước kích hoạt GitHub Pages:
1. Đẩy mã nguồn lên repository GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "Deploy MY BRAIN ACADEMY"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
   git push -u origin main
   ```
2. Mở repository trên GitHub $\rightarrow$ Vào mục **Settings** $\rightarrow$ Chọn mục **Pages** (ở menu bên trái).
3. Tại phần **Build and deployment** $\rightarrow$ **Source**:
   - Chọn **`GitHub Actions`** (Khuyên dùng - Quy trình CI/CD sẽ tự động chạy thông qua tệp `.github/workflows/deploy.yml`).
4. Chờ khoảng 1 - 2 phút, GitHub Actions sẽ hoàn tất và hiển thị đường link trang web của bạn:
   `https://<tai-khoan-cua-ban>.github.io/<ten-repo>/`

---

## ⚡ Hướng Dẫn Deploy Lên Vercel

Dự án đã cấu hình sẵn tệp `vercel.json` và `.npmrc` chuẩn:
1. Đăng nhập vào [Vercel](https://vercel.com/) $\rightarrow$ Chọn **Add New Project** $\rightarrow$ Chọn **Import Git Repository**.
2. Chọn repository GitHub vừa tạo:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Nhấn **Deploy**. Vercel sẽ tự động build và cấp tên miền `https://<ten-du-an>.vercel.app`.

---

## 📲 Cài Đặt Ứng Dụng PWA (Mobile App)

- **Trên iPhone / iPad (iOS Safari)**: Nhấn biểu tượng **Chia sẻ (Share)** $\rightarrow$ chọn **Thêm vào MH chính (Add to Home Screen)**.
- **Trên Android / Chrome / Windows / Mac**: Nhấn nút **Cài Đặt App** trực tiếp trên thanh điều hướng hoặc menu trình duyệt.
