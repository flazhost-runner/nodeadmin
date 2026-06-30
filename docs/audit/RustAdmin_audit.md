# RustAdmin — Audit vs NODEADMIN_STANDARD (Round 3 Re-audit)

**Stack**: Rust / Rocket + SeaORM + Tera templates
**Lokasi**: `/home/mulyawan/Project/Admin/RustAdmin`
**Tanggal audit**: 2026-06-26 (round 3 re-audit post-fix)
**Auditor**: Claude Sonnet 4.6
**Referensi**: [NODEADMIN_STANDARD.md](../NODEADMIN_STANDARD.md)

---

## Ringkasan Status

| Kategori | Total | ✅ | ❌ | ⚠️ |
|----------|-------|---|---|---|
| §1 Database | 18 | 18 | 0 | 0 |
| §1.8 Seed | 8 | 8 | 0 | 0 |
| §2 Env Vars | 12 | 12 | 0 | 0 |
| §3 Autentikasi | 9 | 8 | 0 | 1 |
| §4 Layout & Shell | 9 | 9 | 0 | 0 |
| §5 Auth Pages | 11 | 10 | 0 | 1 |
| §7-9 Access Module | 14 | 13 | 0 | 1 |
| §10-12 Profile/Setting/Media | 9 | 8 | 0 | 1 |
| §23.18 CSS & Icon | 8 | 7 | 0 | 1 |
| §24 Functions | 16 | 15 | 0 | 1 |
| **TOTAL** | **114** | **108** | **0** | **6** |

**Similarity: 95%** (108/114)

---

## Gap yang Tersisa (6 ⚠️, 0 ❌)

1. **Session encrypted cookie** — Rocket private cookie (client-side encrypted) bukan server-side session store (NodeAdmin: Redis/MemoryStore); bersifat architectural
2. **Login remember value** — `value="1"` di `templates/be/default/auth/login.tera:38` (standar: tidak ada value attribute)
3. **Web fail: flash + redirect Referrer** — `src/guards/authorized.rs` mengembalikan `Outcome::Error((Status::Forbidden, ()))` yang menjadi 403 page; standar redirect + flash error ke Referrer
4. **Setting cache mechanism** — `src/modules/setting/services/setting_service.rs` pakai invalidate-on-update (`recache()` dipanggil saat update), bukan periodic 60s TTL
5. **Trumbowyg dari CDN** — `templates/layouts/be/default/head.tera` masih load Trumbowyg dari cdnjs.cloudflare.com (filemanager plugin sudah lokal)
6. **CSRF body `_csrf` tidak didukung** — `src/security/csrf.rs` hanya header + query, body `_csrf` tidak diparsing; bersifat architectural (Rocket constraint)

---

## Checklist Detail

### §1 — Database

| Item | Status |
|------|--------|
| `users` — semua 18 kolom (incl. blocked, blocked_reason, timezone) | ✅ |
| `roles.guard_name` VARCHAR DEFAULT 'web' | ✅ ditambah via m0008 |
| `roles` — semua kolom lain | ✅ |
| `permissions` — semua kolom incl. method | ✅ |
| `roles_permissions` composite PK | ✅ m0005 |
| `users_roles` composite PK | ✅ m0004 |
| `settings.favicon` nullable | ✅ ditambah via m0008 |
| `settings` — semua kolom lain (initial, name, description, icon, logo, login_image, phone, address, email, copyright, theme, fe_template) | ✅ |

### §1.8 — Default Seed

| Item | Status |
|------|--------|
| User admin@admin.com | ✅ m0007 |
| code="0000000001", name="Administrator", phone="12345678910" | ✅ |
| email_verified_at = CURRENT_TIMESTAMP | ✅ |
| password = bcrypt("12345678", rounds=10) | ✅ |
| timezone="Asia/Jakarta", blocked=false, blocked_reason="" | ✅ |
| Role name="Administrator", guard_name="web", status="Active", desc="" | ✅ |
| users_roles link | ✅ |
| Idempoten (cek duplikasi sebelum insert) | ✅ m0007 cek `SELECT 1 FROM users WHERE email = 'admin@admin.com'` |

### §2 — Environment Variables

| Var | Status |
|-----|--------|
| `SESSION_TTL_HOURS` (6) | ✅ |
| `JWT_SECRET`, `JWT_EXPIRES_IN` string '1h' | ✅ |
| `BCRYPT_ROUNDS` (10), `OTP_EXPIRY_MINUTES` (10) | ✅ |
| `STORAGE_DRIVER`/`ACCESS_KEY_ID`/`SECRET`/`ENDPOINT`/`BUCKET`/`REGION`/`SSL` | ✅ |
| `MAIL_HOST`/`PORT`/`SECURE`/`USERNAME`/`PASSWORD`/`FROM_NAME`/`FROM_ADDRESS` | ✅ |
| `REDIS_URL` | ✅ |
| `APP_PORT` | ✅ .env.example `APP_PORT=3000`; env.rs `num("APP_PORT", 3000)` |
| `SESSION_SECRET` | ✅ env.rs `required("SESSION_SECRET", is_prod)`; .env.example ada |
| `DEFAULT_PAGE_SIZE` | ✅ .env.example `DEFAULT_PAGE_SIZE=10`; env.rs membaca |

### §3 — Autentikasi

| Item | Status |
|------|--------|
| JWT API Bearer HS256, expiresIn string | ✅ |
| authLimiter 10/15min (`RateLimiter::new(10, 15*60)`) | ✅ |
| otpLimiter 5/15min (`RateLimiter::new(5, 15*60)`) | ✅ |
| OTP 6 digit numerik (`generate_otp(6)`) | ✅ |
| OTP bcrypt hash + verify | ✅ |
| Logout: clear cookies | ✅ |
| Tidak ada refresh token | ✅ |
| bcrypt rounds dari BCRYPT_ROUNDS env | ✅ |
| Session server-side | ⚠️ Rocket private cookie (encrypted client-side) |

### §4 — Layout & Shell

| Item | Status |
|------|--------|
| BE layout 5 parts (sidebar/topbar/main/foot/head) | ✅ |
| FE layout | ✅ |
| Tailwind CDN + 4 CSS vars | ✅ |
| FA LOKAL BE (`/be/default/vendor/fontawesome-free/`) | ✅ |
| FA LOKAL FE | ✅ `fe/default/main.tera` pakai `/static/be/default/vendor/fontawesome-free/css/all.min.css` |
| Bootstrap Icons CDN jsdelivr 1.11.3 | ✅ |
| `.sidebar-gradient` | ✅ |
| 5 tema — primary/secondary hex eksak | ✅ |
| 5 tema — light/dark hex | ✅ semua benar: Blue `#EFF6FF`/`#1E40AF`, Purple `#F5F3FF`/`#5B21B6`, Green `#ECFDF5`/`#065F46`, Orange `#FFFBEB`/`#92400E`, Red `#FEF2F2`/`#991B1B` |

### §5 — Auth Pages

| Item | Status |
|------|--------|
| Login 2-kolom `tw-card overflow-hidden grid md:grid-cols-2` | ✅ |
| Login panel kiri `hidden md:flex sidebar-gradient` | ✅ |
| Login image hardcoded path | ✅ |
| Login logo `h-14 mx-auto object-contain` (non-link) | ✅ |
| Login flash format `{key, message}` | ✅ |
| Login H1 "Hello, Welcome Back!" | ✅ |
| Login email placeholder, tanpa required/autocomplete | ✅ |
| Login submit `btn btn-primary-tw w-100 py-2 mb-3` | ✅ |
| Login remember UI-only | ✅ |
| Login remember: tanpa value attribute | ⚠️ `value="1"` di login.tera:38 |
| Login hr + register link fw-semibold "create here" | ✅ |

### §7-9 — Access Module

| Item | Status |
|------|--------|
| User index 10 kolom | ✅ |
| User create 12 field urutan baku | ✅ |
| User: previewImage() | ✅ |
| User: blocked/blocked_reason toggle | ✅ |
| Role create: name→desc→status | ✅ |
| Role edit: name→status→desc | ✅ |
| Role→Permission: Not-assigned icon `text-gray-300` | ✅ |
| Permission auto-discover tiap GET index | ✅ rbac/registry.rs |
| Permission route naming `{guard}.v1.{module}.{resource}.{action}` | ✅ |
| Permission create/edit urutan baku | ✅ |
| AccessMiddleware: fresh DB per request | ✅ authorized.rs guard |
| Administrator bypass | ✅ |
| Web fail: flash + redirect Referrer | ⚠️ returns 403 page (`Outcome::Error((Status::Forbidden, ()))`), tidak redirect+flash |
| API fail: 403 `{status:false, message:'Forbidden'}` | ✅ |

### §10-12 — Profile / Setting / Media

| Item | Status |
|------|--------|
| Profile flash `'Update Profile Success.'` | ✅ |
| Setting: 5 tema swatch | ✅ |
| Setting: live preview tanpa reload | ✅ |
| Setting: FE template catalog | ✅ |
| Setting: modal openModal/closeModal 3 cara tutup | ✅ |
| Setting flash `'Save Setting Success.'` | ✅ |
| Setting cache | ⚠️ invalidate-on-update via `recache()` (bukan 60s TTL) |
| Media: GET list / POST upload / POST delete | ✅ |
| Media: max 2MB, MIME image/* | ✅ |

### §23.18 — CSS & Icon

| Item | Status |
|------|--------|
| `@layer components` Bootstrap shims | ✅ |
| `.tw-card`, `.sidebar-gradient`, `.nav-link-tw` | ✅ |
| `.btn-primary-tw`, `.btn-info`, `.btn-outline-dark` | ✅ |
| `.alert` 5 varian | ✅ |
| `.pagination`, `.modal-overlay`, `.toast` | ✅ |
| `.dropdown-menu`, `.dropdown-item.danger:hover` | ✅ |
| Font Awesome LOKAL (BE) | ✅ |
| Trumbowyg + filemanager `tb-fm-*` | ⚠️ Trumbowyg core dari CDN (cdnjs); filemanager plugin sudah lokal |

### §24 — Functions

| Item | Status |
|------|--------|
| CSRF header `x-csrf-token` lowercase | ✅ |
| CSRF query `?_csrf=` | ✅ |
| CSRF body `_csrf` | ⚠️ tidak didukung (Rocket constraint) |
| CSRF timing-safe compare | ✅ `subtle::ConstantTimeEq` via `ct_eq()` |
| CSRF skip `/api/` | ✅ |
| Method override `?_method=PUT\|DELETE` | ✅ |
| Flash format `{key:'success'|'error', message:'...'}` | ✅ |
| Flash teks 18 pesan Inggris standar | ✅ semua sesuai |
| API response `{status:bool, message, data}` — response helper | ✅ |
| API response — inline di API controllers | ✅ semua pakai `"status"` key; tidak ada `"success"` key |
| AppError: NotFound/Conflict/Validation/Unauthorized | ✅ |
| `hasAccess()`, `hasRole()` di view | ✅ |
| `getFile()` di template | ✅ |
| `confirmDialog()` themed modal | ✅ |
| `window.Toast()` auto-dismiss 3.5s | ✅ |
| Pagination shape standar `{datas, paginate_data:{...}}` | ✅ `datas` + `paginate_data.{total_data, current_page, page_size, total_page}` di semua API controllers |

---

## Catatan Tambahan

- **Round 3 re-audit — naik dari 86% → 95%** (108/114). 9 item diperbaiki sejak round 2.
- Gap yang tersisa (6) bersifat architectural (session model, CSRF body) atau minor kosmetik (login remember value, Trumbowyg CDN, Web fail redirect, setting cache TTL).
- Satu aksi mudah tersisa: hapus `value="1"` dari checkbox remember di `templates/be/default/auth/login.tera:38`.
- Web fail redirect: perlu ubah `authorized.rs` dari `Outcome::Error` ke flash-set + `Outcome::Forward` ke login/referrer.
- Trumbowyg: unduh `trumbowyg.min.js` + `trumbowyg.min.css` ke `static/be/default/vendor/trumbowyg/` dan ubah link di `head.tera`.
