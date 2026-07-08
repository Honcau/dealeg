Vercel là cách dễ nhất để triển khai Next.js — cho đến khi bạn chạm giới hạn của nó. Timeout của serverless function, chi phí băng thông, và giá tính theo từng thành viên đẩy nhiều lập trình viên sang một VPS thuần, nơi 5–7 đô mỗi tháng mua được hiệu năng ổn định và không bị nền tảng ràng buộc. Hướng dẫn này đi qua một lần triển khai Next.js chuẩn production trên VPS: Docker, Nginx, và SSL — chính bộ công nghệ đang chạy vô số website thực tế.

## Khi nào VPS thắng Vercel (và khi nào không)

VPS thắng về chi phí khi quy mô lớn (giá cố định hàng tháng, không lo băng thông đội giá), tiến trình chạy lâu (không có timeout function), và toàn quyền kiểm soát (cron job, database chung một máy, chạy bất kỳ runtime nào). Vercel thắng ở chỗ không phải bảo trì, edge toàn cầu tức thì, và preview deployment có sẵn. Nếu dự án của bạn là một site cá nhân lưu lượng nhẹ, gói miễn phí của Vercel thực sự khó bì. Lý do chọn VPS bắt đầu khi bạn cần database sẵn rồi, khi hóa đơn băng thông xuất hiện, hoặc đơn giản là khi bạn muốn tự làm chủ hạ tầng của mình.

Các nhà cung cấp VPS giá rẻ như Hostinger, Contabo, Vultr, và DigitalOcean đều làm tốt việc này — 2 vCPU và 4 GB RAM là điểm khởi đầu thoải mái cho Next.js kèm một database (mã giảm giá cho các nhà cung cấp này lưu hành liên tục; hãy xem deal hiện có trước khi trả giá niêm yết).

## Bước 1 — Chuẩn bị ứng dụng

Bật standalone output trong `next.config.js` để bản build chỉ đóng gói những gì cần thiết:

```js
module.exports = { output: 'standalone' };
```

Thêm một `Dockerfile` (nhiều tầng, dùng Alpine):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Bước 2 — Build và chạy trên server

SSH vào, cài Docker (xem bài hướng dẫn Docker của chúng tôi), clone repo, rồi:

```bash
docker build -t myapp .
docker run -d --name myapp --restart unless-stopped -p 3000:3000 myapp
```

Ứng dụng giờ chạy trên cổng 3000. Đừng bao giờ mở cổng 3000 trực tiếp ra internet — Nginx đứng phía trước.

## Bước 3 — Nginx reverse proxy

```nginx
server {
    server_name example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt site, reload Nginx, và trỏ bản ghi A của tên miền về IP của server.

## Bước 4 — SSL miễn phí

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

Certbot viết lại cấu hình Nginx sang HTTPS và tự động gia hạn. Tổng chi phí đến giờ: chỉ bản thân cái VPS.

## Những mặt trái phải nói thật

Giờ bạn chính là đội vận hành. Cập nhật bảo mật, dung lượng ổ đĩa, sao lưu, và sự cố lúc 3 giờ sáng đều là việc của bạn. Hãy dành ra một giờ mỗi tháng để bảo trì và thiết lập sao lưu tự động ngay từ ngày đầu. Nếu sự đánh đổi đó nghe không hợp với dự án của bạn, hosting có quản lý vẫn là lựa chọn tỉnh táo hơn — điều quan trọng là chọn một cách có chủ đích, không phải chọn theo mặc định.
