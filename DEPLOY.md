# Hướng dẫn deploy bằng Docker

Cách deploy này đảm bảo **prod = local 100%**: cùng image = cùng code + cùng dependencies + cùng cấu trúc DB + cùng dữ liệu seed.

## Yêu cầu

- Docker + Docker Compose v2+ (kiểm tra: `docker --version` và `docker compose version`)

## Lần đầu setup

### Bước 1 — Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` chỉnh các biến quan trọng:

**Trên prod:**

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `JWT_SECRET` | chuỗi ngẫu nhiên | **Bắt buộc đổi.** Để nguyên chuỗi mẫu thì ai đọc được mã nguồn cũng ký được token quản trị |
| `JWT_REFRESH_SECRET` | chuỗi ngẫu nhiên **khác** | Sinh riêng, không dùng lại của `JWT_SECRET` |
| `DB_PASSWORD` | mật khẩu mạnh | |
| `REVALIDATE_SECRET` | chuỗi ngẫu nhiên | Thiếu thì sửa nội dung trong admin không hiện ra ngay |
| `PUBLIC_URL` | `https://api.topungdung.net` | |
| `CORS_ORIGINS` | `https://topungdung.net` | Thêm cả `www.` nếu dùng |
| `NEXT_PUBLIC_API_URL` | `https://api.topungdung.net` | **Lúc build**, xem cảnh báo dưới |
| `NEXT_PUBLIC_SITE_URL` | `https://topungdung.net` | **Lúc build**, xem cảnh báo dưới |
| `SMTP_*` | | Chỉ cần nếu muốn nhận form liên hệ qua email |
| `FORCE_RESEED` | **bỏ hẳn dòng này** | `=1` sẽ xoá trắng DB rồi nạp lại từ snapshot |

Sinh secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> ⚠️ **`NEXT_PUBLIC_*` được nướng cứng vào bundle lúc BUILD**, không đọc lại lúc
> chạy. Đặt sai là toàn bộ `canonical`, `og:image` và `sitemap` của bản production
> trỏ về localhost — restart không cứu được, phải build lại.
> `next.config.mjs` sẽ **chặn build** nếu hai biến này còn trỏ localhost, nên
> không lỡ tay được; nhưng vẫn phải đặt đúng trước khi chạy `docker compose build`.

### Bước 1b — Kiểm lại trước khi build

```bash
grep -E '^(JWT_SECRET|JWT_REFRESH_SECRET|DB_PASSWORD|REVALIDATE_SECRET)=' .env
grep -E '^(NEXT_PUBLIC_|PUBLIC_URL|CORS_ORIGINS)' .env
grep -c '^FORCE_RESEED' .env     # phải ra 0
```

Không còn `change_this`, không còn `localhost`, `FORCE_RESEED` không có mặt.

### Bước 2 — Build và start

```bash
docker compose up -d --build
```

Lần đầu chạy sẽ:
1. Pull image Postgres 16
2. Build BE image (~3-5 phút)
3. Build FE image (~5-8 phút)
4. Start container theo thứ tự postgres → backend → frontend
5. **Tự động chạy migration + seed dữ liệu từ `snapshot.json`** (vì DB rỗng)

### Bước 3 — Kiểm tra

```bash
docker compose ps                  # cả 3 service phải Up
docker compose logs -f backend     # xem log BE
curl http://localhost:3001/api/health  # nếu có health endpoint
```

Truy cập:
- FE: http://localhost:3000
- BE: http://localhost:3001/docs
- Admin: http://localhost:3000/admin

## Các lệnh thường dùng

| Mục đích | Lệnh |
|---|---|
| Start tất cả | `docker compose up -d` |
| Stop tất cả (giữ data) | `docker compose down` |
| **Stop + xoá DB** ⚠️ | `docker compose down -v` |
| Xem log realtime | `docker compose logs -f` |
| Xem log 1 service | `docker compose logs -f backend` |
| Restart 1 service | `docker compose restart backend` |
| Rebuild khi đổi code | `docker compose up -d --build` |
| Vào shell container | `docker compose exec backend sh` |
| Reset toàn bộ data | `docker compose down -v && docker compose up -d` |

## Cập nhật code lên prod

```bash
git pull
docker compose up -d --build
```

Compose tự động build lại image nào có thay đổi, restart container, giữ nguyên DB và uploads.

### Nạp lại dữ liệu từ snapshot (khi máy chủ đang giữ dữ liệu cũ)

Entrypoint chỉ nạp `snapshot.json` **một lần khi CSDL rỗng**; những lần deploy
sau giữ nguyên CSDL. Nếu máy chủ được dựng lúc snapshot còn cũ, phải nạp lại
một lần bằng tay — **xoá trắng CSDL trên máy chủ** rồi nạp bản mới:

```bash
cd /srv/topungdung/be-topungdung
git pull && (cd ../fe-topungdung && git pull)
# .env: thêm SEED_ADMIN_PASSWORD=<mật khẩu tạm cho admin> — snapshot không chứa băm mật khẩu
FORCE_RESEED=1 docker compose up -d --build backend
docker compose logs -f backend      # chờ thấy "posts: 508" và "Starting NestJS"
docker compose up -d backend         # chạy lại KHÔNG có FORCE_RESEED để lần sau không nạp lại
docker compose up -d --build frontend
```

Đăng nhập `/admin` bằng `SEED_ADMIN_PASSWORD`, đổi mật khẩu trong *Người dùng*,
rồi xoá dòng đó khỏi `.env`.

### Sau mỗi lần build — chạy phép kiểm

```bash
cd ../fe-topungdung
npm run kiem:len-song -- https://topungdung.net https://api.topungdung.net
```

Script mở 13 trang đại diện cho mọi loại bố cục và soi đúng loại lỗi mắt thường
không thấy: `canonical`, `og:image`, `robots.txt`, `sitemap.xml` có còn trỏ
localhost không; biểu tượng và manifest có tồn tại không; ảnh trong `/uploads`
có phục vụ được không; **chứng chỉ SSL của API có được tin cậy không** và trang
chủ có lấy được dữ liệu từ backend không. Thoát mã khác 0 là **đừng trỏ tên miền vào**.

## Khi nào cần rebuild FE

**FE phải rebuild khi đổi:**
- Bất kỳ biến `NEXT_PUBLIC_*` nào trong `.env`
- Code FE (`fe-topungdung/`)
- `package.json`

```bash
docker compose build frontend
docker compose up -d frontend
```

## Quản lý dữ liệu

### Cập nhật snapshot từ local rồi đẩy lên prod

```bash
# Local
cd be-topungdung
npm run dump:all              # sinh snapshot.json mới
cd ..
git add be-topungdung/src/database/seeds/snapshot.json
git commit -m "data: update snapshot"
git push

# Prod
git pull
# Snapshot mới chỉ tự seed khi DB rỗng. Nếu muốn FORCE restore:
docker compose exec backend npm run seed:all -- --reset
```

### Backup DB

```bash
docker compose exec postgres pg_dump -U postgres news_db > backup-$(date +%Y%m%d).sql
```

### Restore DB từ backup

```bash
docker compose exec -T postgres psql -U postgres news_db < backup-20260603.sql
```

## Cấu trúc files

```
.
├── docker-compose.yml          # Orchestrator chính
├── .env.example                # Template config (copy → .env)
├── .env                        # Config thật (KHÔNG commit)
├── be-topungdung/
│   ├── Dockerfile              # Multi-stage build BE
│   ├── docker-entrypoint.sh    # Tự run migration + seed lần đầu
│   ├── .dockerignore
│   └── uploads/                # Volume mount, ảnh sống ngoài container
├── fe-topungdung/
│   ├── Dockerfile              # Multi-stage build FE
│   ├── .dockerignore
│   └── next.config.mjs         # output: 'standalone' cho Docker
└── DEPLOY.md                   # File này
```

## Volumes

| Tên | Dùng cho | Có sống khi `down`? |
|---|---|---|
| `topungdung_postgres_data` | DB Postgres | ✅ Có |
| `./be-topungdung/uploads` | Ảnh upload | ✅ Có (bind mount) |

⚠️ `docker compose down -v` sẽ xoá `postgres_data`. Ảnh upload an toàn vì là bind mount.

## Trouble­shooting

**FE gọi sai API URL** → Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env`, rebuild FE.

**BE 500 khi save settings** → `docker compose logs backend` xem error. Có thể migration chưa chạy.

**Mất ảnh** → Folder `be-topungdung/uploads/` còn không. Nếu rỗng thì restore từ backup hoặc git.

**Container không khởi động** → `docker compose ps` xem trạng thái, `docker compose logs <service>` xem nguyên nhân.
