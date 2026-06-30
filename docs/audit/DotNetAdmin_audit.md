# DotNetAdmin — Audit vs NODEADMIN_STANDARD (Re-audit Round 3)

**Stack**: C# / ASP.NET Core (Razor MVC)
**Lokasi**: `/home/mulyawan/Project/Admin/DotNetAdmin`
**Tanggal audit**: 2026-06-26 (round 3 re-audit setelah perbaikan round 2)
**Auditor**: Claude Sonnet 4.6
**Referensi**: [NODEADMIN_STANDARD.md](../NODEADMIN_STANDARD.md)

---

## Ringkasan Status

| Kategori | Total | ✅ | ⚠️ | ❌ |
|----------|-------|---|---|---|
| §1 Database schema | 20 | 20 | 0 | 0 |
| §1.8 Default seed | 5 | 5 | 0 | 0 |
| §2 Environment vars | 18 | 15 | 3 | 0 |
| §3 Autentikasi | 9 | 9 | 0 | 0 |
| §4 Layout & Shell | 8 | 8 | 0 | 0 |
| §5 Auth pages | 17 | 15 | 2 | 0 |
| §7-9 Access module | 13 | 11 | 2 | 0 |
| §10-12 Profile/Setting/Media | 11 | 10 | 0 | 1 |
| §23.18 CSS & Icon | 12 | 12 | 0 | 0 |
| §24 Functions | 18 | 17 | 1 | 0 |
| **TOTAL** | **131** | **122** | **8** | **1** |

**Similarity: 93%** (122/131)

---

## Gap yang Tersisa

### ❌ Kritis (1)

1. **§10 — openModal/closeModal (3 cara tutup)** — setting FE template catalog tidak punya modal preview overlay; DotNetAdmin pakai `selectTemplate()` yang hanya update selection state (border + hidden input + localStorage), tanpa membuka modal full-screen iframe. Standar: klik thumbnail → modal 92vw × 90vh + tutup via tombol / backdrop / ESC.

### ⚠️ Parsial (8)

| # | Item | Keterangan |
|---|------|-----------|
| 1 | §2 MAIL_* naming | ASP.NET pakai `Email__Host/Port/User/Password/From/Secure/FromName`, bukan `MAIL_HOST/USERNAME/FROM_ADDRESS` |
| 2 | §2 STORAGE_ACCESS_KEY_ID | Named `Storage__AccessKey` bukan `STORAGE_ACCESS_KEY_ID` |
| 3 | §2 STORAGE_SECRET_ACCESS_KEY | Named `Storage__SecretKey` bukan `STORAGE_SECRET_ACCESS_KEY` |
| 4 | §5 Logo right panel | `src="/logo.png"` hardcoded (bukan `setting.logo` dari DB); logo memang ada di panel kanan tapi tidak dinamis |
| 5 | §7 Role→Permission per-row | Bulk checkbox sync; tidak ada icon `fas fa-times-circle text-gray-300` per-row |
| 6 | §7 User picture error class | `invalid-feedback` class vs standar `text-danger small mt-1` |
| 7 | §24 Flash "Unassign Permission Success." | Tidak ada karena role-perm pakai bulk sync |
| 8 | §24 hasAccess() API | Tersedia sebagai `HasAccessFn Func<string,string,bool>`, bukan fungsi template standar |

---

## Perubahan dari Round 2 (84% → 93%)

| Item | Round 2 | Round 3 | Bukti |
|------|---------|---------|-------|
| STORAGE_SSL | ❌ | ✅ | `StorageConfig.Ssl = false` di `AppConfig.cs` |
| MAIL_SECURE | ❌ | ✅ | `EmailConfig.Secure = false` di `AppConfig.cs` |
| MAIL_FROM_NAME | ❌ | ✅ | `EmailConfig.FromName` di `AppConfig.cs` |
| Register autocomplete | ❌ | ✅ | `autocomplete="name/email/new-password"` di `Register.cshtml` |
| hasRole() ViewBag | ❌ | ✅ | `ViewBag.HasRoleFn = new Func<string, bool>(...)` di `AdminViewDataFilter.cs` |
| Trumbowyg local vendor | ⚠️ CDN | ✅ | `/wwwroot/be/default/vendor/trumbowyg/trumbowyg.min.js` |
| Trumbowyg CSS tb-fm-* | ⚠️ tidak terkonfirmasi | ✅ | `trumbowyg.filemanager.css` di vendor + ref di `_AdminLayout.cshtml` |
| CSRF query param `?_csrf=` | ⚠️ 2 jalur | ✅ | `CsrfQueryMiddleware.cs` promote query → header |
| Pagination shape API | ⚠️ berbeda | ✅ | `datas` + `paginate_data.{total_data, page_size, current_page, total_page}` di semua API controller |
| Login image path | ⚠️ `/media/…` | ✅ | `/modules/setting/login-image.png` di `Login.cshtml` |
| "Email already exists." flash | ⚠️ "already in use." | ✅ | `ConflictAppException("Email already exists.")` di `AuthService.cs:43` |
| localStorage template cache | ⚠️ tidak terlihat | ✅ | `localStorage.setItem('fe_html_' + slug, html)` di setting view JS |
| openModal/closeModal 3-way | ❌ | ❌ | Masih hanya `selectTemplate()`, tidak ada modal preview |
| Logo right panel | ⚠️ | ⚠️ | Logo ada tapi `src="/logo.png"` hardcoded |

---

## Perubahan dari Audit Round 1 (untuk konteks)

| Item | Sebelumnya | Round 2+ |
|------|-----------|---------|
| DB `roles.guard_name` | ❌ Tidak ada | ✅ GuardName ditambah ke entity + migration |
| DB `settings.favicon` | ❌ Tidak ada | ✅ Favicon ditambah ke entity + migration |
| JWT expires string | ❌ `JwtExpiresDays` int | ✅ `JwtExpiresIn` string ("1h"), ParseExpiresIn() |
| OTP_EXPIRY_MINUTES | ❌ Hardcoded 10 | ✅ OtpExpiryMinutes dari config |
| BCRYPT_ROUNDS dipakai | ❌ Tidak digunakan | ✅ `BcryptRounds` dipakai di HashPassword calls |
| "Keep me logged in" | ❌ Diproses server (30d cookie) | ✅ UI-only, tidak diproses server |
| 5 tema eksak | ❌ 9 tema | ✅ Blue/Purple/Green/Orange/Red dengan hex eksak |
| Login H1 | ❌ "Welcome back!" | ✅ "Hello, Welcome Back!" |
| Login panel kiri | ❌ Feature list, bukan image | ✅ `hidden md:flex sidebar-gradient` + login-image |
| Flash 2 jalur | ❌ 1 jalur saja | ✅ `errorMessages[]` + single flash |
| API response key | ❌ `{success:bool,...}` | ✅ ResponseHelper pakai `{status:bool,...}` |
| Flash 'Unauthorized.' + Referrer | ❌ Redirect ke dashboard tanpa flash | ✅ Flash 'Unauthorized.' + redirect Referrer |
| otpLimiter window | ❌ 60 menit | ✅ 15 menit |
| OTP pre-fill | ❌ Tidak ada | ✅ `value="@ViewBag.OldOtp"` |
| Reset back link | ❌ "Request new OTP" | ✅ "back?" |
| User index kolom | ❌ 8 kolom (Phone/Picture hilang) | ✅ 10 kolom |
| Role create order | ❌ Name→Status→Desc | ✅ Name→Desc→Status |
| AccessFilter fail web | ❌ Redirect dashboard, no flash | ✅ Flash 'Unauthorized.' + Referrer |
| Media max 2MB + MIME | ❌ Tidak ada limit, .gif allowed | ✅ 2MB, jpeg/jpg/png/webp only |
| Seeder §1.8 | ❌ Missing timezone/phone/code | ✅ Semua field sesuai standar |

---

## Checklist Detail

### §1 — Database

| Item | Status | Catatan |
|------|--------|---------|
| `users` — 18 kolom (id, code, name, phone, email, email_verified_at, password, password_otp, password_otp_expires, status, picture, blocked, blocked_reason, timezone, created_by, updated_by, created_at, updated_at) | ✅ | Semua kolom ada |
| `roles` — semua kolom + guard_name | ✅ | GuardName ditambah di entity + migration |
| `permissions` — semua kolom + guard_name + method | ✅ | |
| `roles_permissions` pivot | ✅ | |
| `users_roles` pivot | ✅ | |
| `settings` — semua kolom + favicon | ✅ | Favicon ditambah di entity + migration |

### §1.8 — Default Seed

| Item | Status | Catatan |
|------|--------|---------|
| User admin@admin.com, code="0000000001", phone="12345678910" | ✅ | DbSeeder.cs |
| Password bcrypt hash "12345678" | ✅ | BCrypt.Net.BCrypt.HashPassword |
| timezone = "Asia/Jakarta", blocked = false, blocked_reason = "" | ✅ | |
| Role "Administrator", guard_name = "web", status = "Active" | ✅ | |
| User→Role assignment + idempoten (cek email sebelum insert) | ✅ | |

### §2 — Environment Variables

| Var | Status | Catatan |
|-----|--------|---------|
| APP_PORT | ✅ | Kestrel URL config |
| SESSION_SECRET, SESSION_TTL_HOURS | ✅ | App__SessionSecret, App__SessionTtlHours |
| JWT_SECRET, JWT_EXPIRES_IN (string '1h') | ✅ | ParseExpiresIn() handles 1h/30m/7d/s |
| BCRYPT_ROUNDS | ✅ | App__BcryptRounds, dipakai di HashPassword |
| OTP_EXPIRY_MINUTES | ✅ | App__OtpExpiryMinutes, diteruskan ke OtpHelper |
| DEFAULT_PAGE_SIZE | ✅ | App__DefaultPageSize |
| STORAGE_DRIVER | ✅ | Storage__Driver |
| STORAGE_ACCESS_KEY_ID | ⚠️ | Named Storage__AccessKey |
| STORAGE_SECRET_ACCESS_KEY | ⚠️ | Named Storage__SecretKey |
| STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_REGION | ✅ | |
| STORAGE_SSL | ✅ | `StorageConfig.Ssl = false` di AppConfig.cs |
| DB_* | ✅ | Database__Type + ConnectionString |
| MAIL_HOST, MAIL_PORT | ⚠️ | Email__Host, Email__Port (naming berbeda) |
| MAIL_SECURE | ✅ | `EmailConfig.Secure = false` di AppConfig.cs |
| MAIL_USERNAME, MAIL_PASSWORD | ✅ | Email__User, Email__Password |
| MAIL_FROM_ADDRESS | ✅ | Email__From |
| MAIL_FROM_NAME | ✅ | `EmailConfig.FromName` di AppConfig.cs |
| REDIS_URL | ✅ | Redis__Url |

### §3 — Autentikasi

| Item | Status | Catatan |
|------|--------|---------|
| Web session cookie-based (server-side) | ✅ | |
| JWT API Bearer HS256 | ✅ | SecurityAlgorithms.HmacSha256 |
| JWT expiresIn dari env (string '1h') | ✅ | ParseExpiresIn() terima string format |
| bcrypt rounds dari env (BCRYPT_ROUNDS=10) | ✅ | Dipakai di semua HashPassword calls |
| authLimiter 10 req / 15 menit / IP | ✅ | FixedWindowLimiter "auth" |
| otpLimiter 5 req / 15 menit / IP | ✅ | FixedWindowLimiter "otp": 5/15min |
| OTP 6 digit numerik, bcrypt hash | ✅ | OtpHelper |
| OTP expiry dari OTP_EXPIRY_MINUTES env | ✅ | OtpHelper.OtpExpiresAt(config.OtpExpiryMinutes) |
| "Keep me logged in" UI-only | ✅ | Tidak diproses server |
| Tidak ada refresh token | ✅ | |

### §4 — Layout & Shell

| Item | Status | Catatan |
|------|--------|---------|
| BE layout (sidebar, topbar, main, foot) | ✅ | _AdminLayout.cshtml |
| FE layout terpisah | ✅ | _FullWidthLayout.cshtml |
| Tailwind CDN + 4 CSS vars | ✅ | --primary/--secondary/--theme-light/--theme-dark |
| Font Awesome LOKAL `/be/default/vendor/fontawesome-free/css/all.min.css` | ✅ | |
| Bootstrap Icons CDN jsdelivr 1.11.3 | ✅ | |
| `.sidebar-gradient` | ✅ | |
| 5 tema Blue/Purple/Green/Orange/Red hex eksak | ✅ | ThemeConfig.cs |
| @layer components Bootstrap shims | ✅ | |

### §5 — Auth Pages

| Item | Status | Catatan |
|------|--------|---------|
| Login outer `tw-card grid md:grid-cols-2` | ✅ | |
| Login panel kiri `hidden md:flex sidebar-gradient` + login-image | ✅ | |
| Login image path `/modules/setting/login-image.png` | ✅ | FIXED — sesuai standar |
| Logo h-14 mx-auto non-link di panel kanan | ⚠️ | Logo ada di right panel tapi `src="/logo.png"` hardcoded, bukan dari `setting.logo` |
| Login 2 jalur flash (errorMessages[] + single flash) | ✅ | ViewBag.ErrorMessages + FlashKey/FlashMessage |
| H1 "Hello, Welcome Back!" color var(--primary) | ✅ | |
| Subtitle "Enter your credentials to continue" | ✅ | |
| Email placeholder tanpa required/autocomplete | ✅ | |
| Submit btn-primary-tw w-100 py-2 mb-3 "Login" | ✅ | |
| Remember checkbox UI-only "Keep me logged in" | ✅ | |
| Forgot link text-primary-tw "Forgot password" | ✅ | |
| hr + register link fw-semibold "create here" | ✅ | |
| Register H1 "Create Account" subtitle "Fill the form to register" | ✅ | |
| Register autocomplete attrs (name/email/new-password) | ✅ | FIXED — `autocomplete="name"`, `"email"`, `"new-password"` di Register.cshtml |
| Register submit "Create Account" | ✅ | |
| Forgot H1 "Forgot Password", back "back?" | ✅ | |
| Reset H1 "Reset Password", OTP pre-fill, back "back?" | ✅ | `value="@ViewBag.OldOtp"` |

### §7-9 — Access Module

| Item | Status | Catatan |
|------|--------|---------|
| User index 10 kolom (checkbox/No/Code/Name/Phone/Email/Status/Picture/Roles/Actions) | ✅ | |
| User create 12 field (code/name/phone/email/timezone/password/password_confirmation/status/picture/blocked/blocked_reason/roles[]) | ✅ | |
| previewImage() onchange | ✅ | |
| User picture error class text-danger small mt-1 | ⚠️ | Pakai `invalid-feedback` class |
| Role create: name→desc→status | ✅ | |
| Role edit: name→status→desc | ✅ | |
| Role→Permission per-row assign/unassign + icon text-gray-300 | ⚠️ | Bulk checkbox sync, tidak ada icon fa-times-circle per-row |
| Permission auto-discover | ✅ | PermissionSyncService scan endpoints |
| Permission route naming {guard}.v1.{module}.{resource}.{action} | ✅ | |
| AccessFilter fresh DB query per request | ✅ | |
| AccessFilter Administrator bypass | ✅ | |
| AccessFilter web fail: flash 'Unauthorized.' + redirect Referrer | ✅ | |
| AccessFilter API fail: 403 {status:false,...} | ✅ | |

### §10-12 — Profile / Setting / Media

| Item | Status | Catatan |
|------|--------|---------|
| Profile form + flash 'Update Profile Success.' | ✅ | |
| Setting 5 tema swatch + live preview | ✅ | |
| FE template catalog grid + filter | ✅ | |
| Thumbnail lazy IntersectionObserver rootMargin 200px | ✅ | |
| openModal(slug,name,url) + 3 cara tutup (button/backdrop/ESC) | ❌ | Setting view hanya `selectTemplate()` — update selection/localStorage, tidak ada modal preview full-screen |
| localStorage cache template HTML | ✅ | FIXED — `localStorage.setItem('fe_html_' + slug, html)` di setting view JS |
| Setting form lengkap (favicon/logo/dll) | ✅ | |
| Flash 'Save Setting Success.' | ✅ | |
| Media GET list | ✅ | |
| Media POST upload (CSRF header, 2MB, jpeg/jpg/png/webp) | ✅ | |
| Media POST delete {key} | ✅ | |

### §23.18 — CSS & Icon

| Item | Status | Catatan |
|------|--------|---------|
| @layer components Bootstrap shims | ✅ | |
| .tw-card, .sidebar-gradient, .nav-link-tw | ✅ | |
| .btn-primary-tw, .btn-info, .btn-outline-dark | ✅ | |
| .btn-success, .btn-danger | ✅ | |
| .alert 5 varian (danger/success/info/warning/primary) | ✅ | |
| .pagination + .page-item.active | ✅ | |
| .dropdown-menu + .dropdown-item.danger:hover | ✅ | |
| .modal-overlay, .modal-box, .modal-header/body/footer | ✅ | |
| .toast, .toast.show, .toast.success/error/info | ✅ | |
| Font Awesome LOKAL | ✅ | wwwroot/be/default/vendor/fontawesome-free/ |
| Trumbowyg vendor LOKAL | ✅ | FIXED — `/wwwroot/be/default/vendor/trumbowyg/trumbowyg.min.js` |
| Trumbowyg filemanager CSS tb-fm-* | ✅ | FIXED — `trumbowyg.filemanager.css` di vendor + direferensikan di `_AdminLayout.cshtml` |

### §24 — Functions

| Item | Status | Catatan |
|------|--------|---------|
| CSRF 3 jalur (body _csrf, query ?_csrf=, header x-csrf-token) | ✅ | FIXED — `CsrfQueryMiddleware.cs` promote query → header sebelum validasi antiforgery |
| CSRF timing-safe | ✅ | ASP.NET Antiforgery built-in |
| CSRF skip /api/ | ✅ | API pakai JWT Bearer |
| Method override ?_method=PUT\|DELETE | ✅ | MethodOverrideMiddleware |
| Session httpOnly/sameSite:lax/secure | ✅ | |
| Flash format {key, message} | ✅ | session flash_key + flash_message |
| Flash teks 18 pesan eksak | ✅ | FIXED — "Email already exists." ✅, "Unassign Permission Success." masih absen (⚠️ di baris bawah) |
| Flash "Unassign Permission Success." | ⚠️ | Tidak ada karena role-perm pakai bulk sync; sisa flash teks sudah sesuai |
| API response {status:bool, message, data} | ✅ | ResponseHelper pakai `status = true/false` |
| Validation error 422 | ✅ | |
| AppError hierarchy NotFound/Conflict/Validation/Unauthorized | ✅ | AppException.cs |
| errorHandler: API→JSON, web→flash+Referrer | ✅ | |
| hasAccess(name, method) di view | ⚠️ | `HasAccessFn Func<string,string,bool>`, bukan fungsi template standar |
| hasRole(roleName) di view | ✅ | FIXED — `ViewBag.HasRoleFn = new Func<string, bool>(roleName => roles.Any(r => r.Name == roleName))` di AdminViewDataFilter.cs |
| getError(key), getOld(key) | ✅ | ViewBag.FieldErrors + OldInput dictionaries |
| confirmDialog() themed Promise | ✅ | window.Modal.open |
| window.Toast() auto-dismiss 3500ms | ✅ | |
| Image fallback placeholder | ✅ | onerror handler |
| Sidebar mobile toggle | ✅ | -translate-x-full + overlay |
| Pagination shape {datas, paginate_data:{total_data,...}} | ✅ | FIXED — `datas = result.Data, paginate_data = new { total_data, page_size, current_page, total_page }` di semua API controller |
| Setting cache 60s TTL | ✅ | SettingCacheService TimeSpan.FromSeconds(60) |

---

> **Round 3 re-audit — naik dari 84% → 93%** (122✅ / 8⚠️ / 1❌ / 131 total)
>
> 12 item diperbaiki di round 2: 5 ❌→✅ (STORAGE_SSL, MAIL_SECURE, MAIL_FROM_NAME, Register autocomplete, hasRole), 7 ⚠️→✅ (Login image path, localStorage cache, Trumbowyg CDN→local, tb-fm-* CSS, CSRF query param, Email flash text, Pagination shape).
> Sisa gap tunggal ❌: openModal 3-cara-tutup untuk template preview di setting.

RESULT:DotNetAdmin:✅122:⚠️8:❌1:TOTAL:131:PCT93%
