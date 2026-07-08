Một VPS mới toanh sẽ nhận những lượt bot thử đăng nhập đầu tiên chỉ vài phút sau khi khởi động — các trình quét tự động rà soát toàn bộ không gian IPv4 suốt ngày đêm. Mười phút bạn bỏ ra để gia cố một server mới sẽ ngăn được phần lớn các vụ xâm nhập thực tế, bởi kẻ tấn công chủ yếu khai thác mật khẩu yếu và cấu hình mặc định chưa vá, chứ không phải lỗ hổng zero-day. Đây là checklist chính xác, theo thứ tự.

## Phút 1–2: Cập nhật mọi thứ

```bash
apt update && apt upgrade -y
```

Image cài mới thường đã cũ vài tuần. Vá trước, cấu hình sau.

## Phút 3–4: Tạo user không phải root

Làm việc dưới quyền root nghĩa là một lỗi gõ nhầm có thể phá hỏng cả hệ thống, và một thông tin đăng nhập bị lộ sẽ chiếm được tất cả.

```bash
adduser deploy
usermod -aG sudo deploy
```

## Phút 5–6: SSH key, rồi khóa cửa mật khẩu

Trên **máy của bạn**, tạo một SSH key hiện đại và copy lên server:

```bash
ssh-keygen -t ed25519
ssh-copy-id deploy@your-server-ip
```

Xác nhận bạn đăng nhập được bằng user `deploy` với key. Chỉ khi đó mới sửa `/etc/ssh/sshd_config` trên server:

```
PermitRootLogin no
PasswordAuthentication no
```

Khởi động lại SSH (`sudo systemctl restart ssh`). Chỉ một thay đổi này thôi đã loại bỏ hoàn toàn các cuộc tấn công dò mật khẩu — vốn là con đường xâm nhập phổ biến nhất trên VPS.

## Phút 7: Tường lửa

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Mọi thứ không được cho phép rõ ràng giờ đều bị chặn, kể cả các cổng database mà bot hay dò tìm.

## Phút 8: Fail2ban

```bash
sudo apt install fail2ban -y
```

Cấu hình mặc định sẽ chặn IP sau nhiều lần thử SSH thất bại. Không cần tinh chỉnh gì, vẫn bảo vệ vững chắc.

## Phút 9: Tự động cập nhật bảo mật

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

Các bản vá bảo mật giờ tự cài. Rủi ro hiếm hoi khi một bản cập nhật gây lỗi vẫn nhỏ hơn nhiều so với rủi ro chạy dịch vụ chưa vá suốt nhiều tháng.

## Phút 10: Kiểm tra lại

```bash
sudo ufw status && sudo systemctl status fail2ban --no-pager
```

Thử đăng nhập SSH thêm một lần từ cửa sổ terminal mới *trước khi đóng phiên hiện tại* — tự khóa mình ra ngoài là lỗi kinh điển.

## Những gì checklist này chưa bao gồm

Nền tảng này chặn được các cuộc tấn công cơ hội, tức là đa số. Nó không thay thế cho bảo mật ở tầng ứng dụng (SQL injection, trang admin bị lộ), sao lưu (một server bị hack mà khôi phục được chỉ là phiền toái; không khôi phục được là thảm họa), hay giám sát. Các nhà cung cấp cũng khác nhau ở điểm này: vài nhà giá rẻ tặng kèm snapshot và chống DDoS miễn phí, số khác tính phí thêm — hãy tính cả những thứ đó vào giá thực khi so sánh deal VPS, đừng chỉ nhìn con số hàng tháng ghi ngoài.
