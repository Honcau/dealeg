Trả tiền cho một chứng chỉ SSL thông thường vào năm 2026 gần như luôn là không cần thiết. Let's Encrypt đã cấp hàng tỷ chứng chỉ miễn phí, trình duyệt tin tưởng chúng y hệt chứng chỉ trả phí, và việc gia hạn hoàn toàn tự động. Thứ duy nhất chứng chỉ trả phí còn mang lại là dòng chữ xác thực tổ chức chẳng ai đọc và khoản bảo hiểm chẳng ai đòi. Đây là cách thiết lập SSL miễn phí cho đúng, kèm một tình huống duy nhất mà cách khác lại tốt hơn.

## Thiết lập 3 phút với Certbot

Trên một VPS chạy Nginx (Apache cũng làm tương tự với plugin phù hợp):

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot chứng minh bạn sở hữu tên miền, lấy chứng chỉ, viết lại cấu hình Nginx sang HTTPS, và thiết lập tự động chuyển hướng từ HTTP. Xong — site của bạn giờ đã có ổ khóa.

## Tự động gia hạn (đã lo sẵn, nhưng nên kiểm tra)

Chứng chỉ Let's Encrypt có hạn 90 ngày theo thiết kế, buộc phải tự động hóa. Certbot cài một systemd timer để gia hạn bất cứ chứng chỉ nào còn dưới 30 ngày là hết hạn. Kiểm tra nó hoạt động mà không cần chờ đợi:

```bash
sudo certbot renew --dry-run
```

Nếu lệnh đó chạy qua, bạn sẽ không bao giờ phải bận tâm về SSL nữa. Sự cố hết hạn chứng chỉ — vẫn còn phổ biến đến mức xấu hổ trên các site doanh nghiệp — đơn giản là không thể xảy ra với bạn.

## Chứng chỉ wildcard

Một chứng chỉ wildcard (`*.example.com`) bao phủ vô số subdomain chỉ với một chứng chỉ, hữu ích cho ứng dụng đa người thuê hoặc có nhiều dịch vụ. Wildcard đòi hỏi xác thực qua DNS thay vì qua HTTP:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d "*.example.com"
```

Certbot yêu cầu bạn tạo một bản ghi TXT để chứng minh quyền sở hữu tên miền. Để tự động gia hạn wildcard, bạn cần một plugin DNS khớp với nhà cung cấp DNS của mình (của Cloudflare là phổ biến nhất) kèm một API token — thiết lập một lần mất khoảng 10 phút.

## Phương án Cloudflare

Nếu tên miền của bạn đã đi qua proxy của Cloudflare, bạn tự động có HTTPS giữa khách truy cập và Cloudflare mà không cần cấu hình gì trên server. Chi tiết then chốt: đặt chế độ SSL thành **Full (strict)**, chế độ này vẫn yêu cầu một chứng chỉ trên server của bạn (Cloudflare cấp miễn phí một "origin certificate" hạn 15 năm đúng cho việc này). Chế độ "Flexible" nghe hấp dẫn nhưng để lưu lượng giữa Cloudflare và server không mã hóa, và gây ra vòng lặp chuyển hướng khét tiếng — hãy tránh.

Chọn cách nào: chỉ Certbot nếu bạn không dùng Cloudflare; origin certificate của Cloudflare + Full (strict) nếu bạn có dùng, vì nó loại bỏ hoàn toàn việc gia hạn khỏi server của bạn.

## Khi nào bạn vẫn nên trả tiền

Chứng chỉ Extended Validation và xác thực tổ chức chỉ quan trọng với một số yêu cầu tuân thủ cụ thể, và vài doanh nghiệp bắt buộc dùng vì lý do chính sách nội bộ. Còn với mọi blog, SaaS, cửa hàng, và API mà những người còn lại chúng ta vận hành, miễn phí không phải là lựa chọn tiết kiệm — nó là lựa chọn đúng. Hãy dùng khoản tiết kiệm được để đầu tư hosting tốt hơn; đó mới là khác biệt mà khách truy cập thực sự cảm nhận được.
