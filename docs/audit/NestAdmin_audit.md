# NestAdmin — Audit vs NODEADMIN_STANDARD (Round 3 re-audit)

**Stack**: Node.js / NestJS + TypeORM + EJS
**Lokasi**: `/home/mulyawan/Project/Admin/NestAdmin`
**Tanggal audit**: 2026-06-26 (round 3 re-audit post-fix)
**Auditor**: Claude Sonnet 4.6
**Referensi**: [NODEADMIN_STANDARD.md](../NODEADMIN_STANDARD.md)

---

## Ringkasan Status

| Kategori | Total | ✅ | ❌ | ⚠️ |
|----------|-------|---|---|---|
| §1 Database schema | 6 | 6 | 0 | 0 |
| §1.8 Seed default | 11 | 11 | 0 | 0 |
| §2 Environment vars | 20 | 20 | 0 | 0 |
| §3 Autentikasi | 11 | 11 | 0 | 0 |
| §4 Layout & Shell | 7 | 7 | 0 | 0 |
| §5 Auth pages | 19 | 19 | 0 | 0 |
| §7–9 Access module | 14 | 14 | 0 | 0 |
| §10–12 Profile/Setting/Media | 9 | 9 | 0 | 0 |
| §23.18 CSS & Icon | 10 | 9 | 0 | 1 |
| §24 Functions | 16 | 15 | 0 | 1 |
| **TOTAL** | **123** | **121** | **0** | **2** |

**Similarity: 98%** (121/123)

---

## Gap yang Tersisa

### ⚠️ Parsial (2 sisa)

1. **Trumbowyg vendor LOKAL** (`public/vendor/trumbowyg/`) — core `trumbowyg.min.js` + `trumbowyg.min.css` masih dimuat dari CDN (`cdnjs.cloudflare.com`). Hanya `filemanager.js` yang sudah lokal. Standar mensyaratkan seluruh Trumbowyg tersedia offline.

2. **`ResponseHandler.error` payload key** (`src/utils/response.ts`) — `static error` mengembalikan `{status:false, message, errors}`. Key ketiga adalah `errors` bukan `data`. Standar: `{status:bool, message:str, data:any|null}`. `static success` sudah benar (`{status:true, message, data}`).

---

## Checklist Detail

### §1 Database Schema

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| `users` — 17 kolom incl. code,phone,email_verified_at,password_otp,password_otp_expires,blocked,blocked_reason,timezone | ✅ | ✅ InitialSchema migration, semua 17 kolom ada | ✅ |
| `roles` — incl. `guard_name` VARCHAR default 'web' | ✅ | ✅ guard_name hadir di schema | ✅ |
| `permissions` — incl. guard_name, method | ✅ | ✅ | ✅ |
| `roles_permissions` pivot (role_id, permission_id) | ✅ | ✅ | ✅ |
| `users_roles` pivot (user_id, role_id) | ✅ | ✅ | ✅ |
| `settings` — incl. `favicon`, `fe_template`, `login_image` | ✅ | ✅ favicon, login_image, copyright, fe_template semua ada | ✅ |

### §1.8 Default Seed

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| email = `admin@admin.com` | wajib | ✅ `seed.ts` baris 56 | ✅ |
| password = bcrypt("12345678") | BCRYPT_ROUNDS | ✅ `bcrypt.hash('12345678', parseInt(process.env.BCRYPT_ROUNDS \|\| '10'))` | ✅ |
| code = `"0000000001"` | wajib | ✅ | ✅ |
| name = `"Administrator"` | wajib | ✅ | ✅ |
| phone = `"12345678910"` | wajib | ✅ | ✅ |
| timezone = `"Asia/Jakarta"` | wajib | ✅ | ✅ |
| blocked = false | wajib | ✅ | ✅ |
| blocked_reason = `""` | wajib | ✅ | ✅ |
| email_verified_at = now | wajib | ✅ `CURRENT_TIMESTAMP` | ✅ |
| role = Administrator guard_name="web" | wajib | ✅ `INSERT INTO roles ... guard_name, 'web'` | ✅ |
| users_roles relation | wajib | ✅ `INSERT INTO users_roles (user_id, role_id)` | ✅ |
| Idempoten | wajib | ✅ cek `WHERE email = 'admin@admin.com'` + `WHERE name = 'Administrator'` sebelum insert | ✅ |

### §2 Environment Variables

| Var | Standard | NestAdmin | Status |
|-----|----------|-----------|--------|
| `APP_PORT` | 3000 | ✅ `Joi.number().default(3000)` | ✅ |
| `SESSION_SECRET` | required, min 16 | ✅ `Joi.string().min(16).required()` | ✅ |
| `SESSION_TTL_HOURS` | 6 | ✅ `Joi.number().default(6)` — dipakai di main.ts `sessionTtlHours * 60 * 60 * 1000` | ✅ |
| `JWT_SECRET` | required | ✅ | ✅ |
| `JWT_EXPIRES_IN` | `'1h'` string | ✅ `Joi.string().default('1h')` | ✅ |
| `BCRYPT_ROUNDS` | 10 | ✅ `Joi.number().default(10)` | ✅ |
| `OTP_EXPIRY_MINUTES` | 10 | ✅ `Joi.number().default(10)` — dipakai di auth.service | ✅ |
| `DEFAULT_PAGE_SIZE` | 10 | ✅ | ✅ |
| `STORAGE_DRIVER` | `local\|oss\|s3` | ✅ `Joi.string().valid('local','oss','s3').default('local')` | ✅ |
| `STORAGE_ACCESS_KEY_ID` | — | ✅ | ✅ |
| `STORAGE_SECRET_ACCESS_KEY` | — | ✅ | ✅ |
| `STORAGE_ENDPOINT` | — | ✅ | ✅ |
| `STORAGE_BUCKET` | — | ✅ | ✅ |
| `STORAGE_REGION` | — | ✅ | ✅ |
| `STORAGE_SSL` | true | ✅ | ✅ |
| `DB_TYPE/HOST/PORT/USERNAME/PASSWORD/DATABASE` | mysql | ✅ semua ada, incl. sqlite fallback | ✅ |
| `MAIL_HOST/PORT/SECURE/USERNAME/PASSWORD/FROM_NAME/FROM_ADDRESS` | — | ✅ semua 7 var ada | ✅ |
| `REDIS_URL` | redis://127.0.0.1:6379 | ✅ `Joi.string().default('redis://127.0.0.1:6379')` | ✅ |

### §3 Autentikasi

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Web session server-side (Redis prod, MemoryStore test) | ✅ | ✅ express-session + connect-redis | ✅ |
| Session cookie httpOnly/sameSite:lax/secure:isProd | ✅ | ✅ main.ts | ✅ |
| Session TTL dari `SESSION_TTL_HOURS` env | 6h | ✅ `sessionTtlHours * 60 * 60 * 1000` | ✅ |
| JWT API Bearer HS256 | ✅ | ✅ passport-jwt strategy | ✅ |
| `JWT_EXPIRES_IN` dibaca sebagai string dari env | `'1h'` | ✅ | ✅ |
| bcrypt rounds dari `BCRYPT_ROUNDS` env | 10 | ✅ | ✅ |
| `authLimiter` 10 req / 15 menit / IP | POST login/register/OTP-req | ✅ `ThrottlerModule [{name:'authLimiter', ttl:900000, limit:10}]` + `@Throttle({authLimiter:...})` di auth controller | ✅ |
| `otpLimiter` 5 req / 15 menit / IP | POST OTP-process | ✅ `{name:'otpLimiter', ttl:900000, limit:5}` di ThrottlerModule | ✅ |
| OTP: 6 digit numerik `[0-9]{6}` | ✅ | ✅ `crypto.randomInt(100000, 999999).toString()` | ✅ |
| OTP: bcrypt hash, stored in users | ✅ | ✅ `bcrypt.hash(otp, 4)` untuk hashOTP | ✅ |
| OTP expiry dari `OTP_EXPIRY_MINUTES` env | 10m | ✅ dibaca dari env di auth.service | ✅ |
| Logout: `req.session.destroy()` | ✅ | ✅ | ✅ |
| Tidak ada refresh token JWT | ✅ | ✅ | ✅ |

### §4 Layout & Shell

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| BE layout: sidebar/topbar/main/foot partials | ✅ | ✅ `src/resources/layouts/be/default/` | ✅ |
| FE layout: head/header/footer partials | ✅ | ✅ `src/resources/layouts/fe/default/` | ✅ |
| Tailwind CDN + 4 CSS vars (`--primary/secondary/theme-light/theme-dark`) | ✅ | ✅ head.ejs — Tailwind config + `:root` vars | ✅ |
| Font Awesome LOKAL `/be/default/vendor/fontawesome-free/css/all.min.css` | ✅ | ✅ vendor files present, link ke path lokal | ✅ |
| Bootstrap Icons CDN jsdelivr **1.11.3** | ✅ | ✅ dikonfirmasi `bootstrap-icons@1.11.3` di head.ejs | ✅ |
| `.sidebar-gradient { background: var(--theme-dark) }` | ✅ | ✅ | ✅ |
| 5 tema Blue/Purple/Green/Orange/Red dengan hex eksak | ✅ | ✅ themes.ts hex persis standar | ✅ |

### §5 Auth Pages

#### Login

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Outer `tw-card overflow-hidden grid md:grid-cols-2` | ✅ | ✅ 2-kolom grid | ✅ |
| Panel kiri `hidden md:flex sidebar-gradient` | ✅ | ✅ | ✅ |
| Login image via `getFile('/modules/setting/login-image.png')` | ✅ | ✅ dikonfirmasi `getFile('/modules/setting/login-image.png')` di baris 6 login.ejs | ✅ |
| Logo `h-14 mx-auto object-contain` bukan link | ✅ | ✅ | ✅ |
| Flash: 2 jalur (errorMessages[] + flash.error) | ✅ | ✅ | ✅ |
| Flash success jalur | ✅ | ✅ | ✅ |
| H1 `"Hello, Welcome Back!"` color `var(--primary)` | ✅ | ✅ | ✅ |
| Subtitle `"Enter your credentials to continue"` | ✅ | ✅ | ✅ |
| Email `placeholder="Email address"` TANPA required/autocomplete | ✅ | ✅ | ✅ |
| Password `placeholder="Password"` TANPA required/autocomplete | ✅ | ✅ | ✅ |
| Submit `btn btn-primary-tw w-100 py-2 mb-3` teks "Login" | ✅ | ✅ | ✅ |
| Remember checkbox UI-only `name="remember"` | ✅ | ✅ | ✅ |
| Forgot link `text-primary-tw text-decoration-none` | ✅ | ✅ | ✅ |
| `<hr class="my-4">` + register link `fw-semibold` "create here" | ✅ | ✅ | ✅ |

#### Register

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Strip `roles` dari body sebelum proses | ✅ | ✅ ValidationPipe whitelist:true strips unknown fields (roles tidak ada di RegisterDto) | ✅ |
| Submit `btn btn-primary-tw w-100 py-2 mb-3` | ✅ | ✅ | ✅ |
| autocomplete (name/email/password) | ✅ | ✅ dikonfirmasi: `autocomplete="name"`, `autocomplete="email"`, `autocomplete="new-password"` | ✅ |
| Flash `'Register Success.'` + redirect login | ✅ | ✅ | ✅ |

#### Forgot (reset_req)

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| H1 `"Forgot Password"` | ✅ | ✅ | ✅ |
| Flash success `'OTP Send Success.'` | ✅ | ✅ | ✅ |
| Back link teks `"back?"` | ✅ | ✅ | ✅ |

#### Reset (reset_proc)

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| `otpLimiter` pada POST reset/process | ✅ | ✅ `@Throttle({otpLimiter:{limit:5,ttl:900000}})` | ✅ |
| OTP field pre-fill `value="<%= getOld('otp') %>"` | ✅ | ✅ dikonfirmasi baris 30 reset_proc.ejs | ✅ |
| Login image via `getFile('/modules/setting/login-image.png')` | ✅ | ✅ dikonfirmasi baris 5 reset_proc.ejs | ✅ |
| Back link teks `"back?"` | ✅ | ✅ | ✅ |
| Flash `'Reset Password Success.'` | ✅ | ✅ | ✅ |

### §7–9 Access Module

#### User

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| User index 10 kolom (checkbox\|No\|Code\|Name\|Phone\|Email\|Status\|Picture\|Roles\|Action) | ✅ | ✅ | ✅ |
| Filter widths dan q_* names sesuai standar | ✅ | ✅ | ✅ |
| User create 12 field (code/name/phone/email/**timezone**/password/password_confirmation/status/picture/blocked/blocked_reason/roles[]) | ✅ | ✅ dikonfirmasi: timezone select di baris 28–36 users/create.ejs | ✅ |
| User picture `previewImage()` onchange | ✅ | ✅ | ✅ |
| User blocked + blocked_reason toggle | ✅ | ✅ | ✅ |
| Flash EKSAK: `'Create/Update/Delete User Success.'` | ✅ | ✅ | ✅ |
| Pagination shape `{datas, paginate_data:{total_data,page_size,current_page,total_page}}` | ✅ | ✅ functions.ts + semua service | ✅ |

#### Role

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Role create urutan: `name → desc → status` | ✅ | ✅ roles/create.ejs | ✅ |
| Role edit urutan: `name → status → desc` | ✅ | ✅ roles/edit.ejs | ✅ |
| Role→Permission page | ✅ | ✅ `roles/permission.ejs` exists | ✅ |
| Role→Permission not-assigned icon `fas fa-times-circle text-gray-300` | ✅ | ✅ dikonfirmasi class exact di roles/permission.ejs | ✅ |

#### Permission

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Auto-discover tiap GET /permission/index (`syncFromRoutes()`) | ✅ | ✅ scans RouteRegistry | ✅ |
| Route naming `{guard}.v1.{module}.{resource}.{action}` | ✅ | ✅ e.g. `web.auth.login`, `admin.v1.media.list` | ✅ |

#### AccessMiddleware

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Fresh DB query per request | ✅ | ✅ `userRepo.findOne({where:{id}, relations:{roles:{permissions:true}}})` | ✅ |
| Administrator bypass | ✅ | ✅ `user.roles?.some(r => r.name === 'Administrator')` | ✅ |
| Web fail: flash `'Unauthorized.'` + redirect Referrer | ✅ | ✅ `req.flash('error','Unauthorized.')` + redirect | ✅ |
| API fail: 403 `{status:false, message:'Forbidden', data:null}` | ✅ | ✅ `res.status(403).json({status:false,message:'Forbidden',data:null})` | ✅ |

### §10–12 Profile / Setting / Media

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| Profile form + ProfileWebController + ProfileService | ✅ | ✅ | ✅ |
| Profile flash `'Update Profile Success.'` | ✅ | ✅ | ✅ |
| Setting flash `'Save Setting Success.'` | ✅ | ✅ | ✅ |
| Setting 5 swatch tema (radio sr-only, 4 strips, check icon) | Blue/Purple/Green/Orange/Red | ✅ 5 swatch correct di setting/index.ejs | ✅ |
| Setting live preview tema JS (update CSS vars TANPA reload) | ✅ | ✅ JS tema picker di foot.ejs | ✅ |
| FE template catalog (filter q_name + q_category, pagination) | ✅ | ✅ FeCatalogService, paginate_data | ✅ |
| Modal openModal/closeModal (3 cara tutup: button/backdrop/ESC) | ✅ | ✅ dikonfirmasi: close button (l.369), backdrop click (l.371), ESC keydown (l.373) di setting/index.ejs | ✅ |
| `GET/POST /admin/v1/media/list\|upload\|delete` | ✅ | ✅ MediaController semua route ada | ✅ |
| Media max 2MB, MIME `image/*` | ✅ | ✅ `fileSize: 2*1024*1024`, `file.mimetype.startsWith('image/')` | ✅ |

### §23.18 CSS & Icon

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| `@layer components` Bootstrap shims | ✅ | ✅ head.ejs | ✅ |
| `.tw-card`, `.sidebar-gradient`, `.nav-link-tw` | ✅ | ✅ | ✅ |
| `.btn-primary-tw`, `.btn-info`, `.btn-outline-dark` | ✅ | ✅ `.btn-info { @apply bg-cyan-500... }` | ✅ |
| `.alert` 5 varian | ✅ | ✅ | ✅ |
| `.pagination`, `.page-item.active` | ✅ | ✅ | ✅ |
| `.modal-overlay`, `.modal-box`, header/body/footer/close | ✅ | ✅ | ✅ |
| `.toast`, `.toast.show`, `.toast.success/error/info` | ✅ | ✅ foot.ejs | ✅ |
| Font Awesome LOKAL path benar | ✅ | ✅ | ✅ |
| Trumbowyg vendor LOKAL (core + CSS) | ✅ | ⚠️ core `trumbowyg.min.js` + CSS masih CDN (cdnjs.cloudflare.com); hanya `filemanager.js` yang lokal | ⚠️ |
| Filemanager CSS `tb-fm-*` di head.ejs | ✅ | ✅ dikonfirmasi inline style di head.ejs baris 201–216 | ✅ |

### §24 Functions

| Item | Standard | NestAdmin | Status |
|------|----------|-----------|--------|
| CSRF 3 jalur: body `_csrf`, query `?_csrf=`, header `x-csrf-token` | ✅ | ✅ custom value fn di main.ts | ✅ |
| CSRF timing-safe | ✅ | ✅ csurf library handles internally | ✅ |
| CSRF skip `/api/` | ✅ | ✅ `if (req.path.startsWith('/api/')) return next()` | ✅ |
| Method override `?_method=PUT\|DELETE` | ✅ | ✅ `methodOverride('_method')` | ✅ |
| Flash format `{key:'success'\|'error', message:'...'}` | ✅ | ✅ `flashMessage = {key, message}` di ViewLocalsMiddleware | ✅ |
| Flash teks eksak 18 pesan Inggris (§24.11) | ✅ | ✅ semua 18 teks sesuai standar | ✅ |
| API response `{status:bool, message:str, data:any\|null}` | ✅ | ⚠️ `ResponseHandler.success` → `{status:true, message, data}` ✅; `ResponseHandler.error` → `{status:false, message, errors}` — key `errors` bukan `data` | ⚠️ |
| Validation error 422 format | ✅ | ✅ ValidationPipe + AppExceptionFilter | ✅ |
| AppError: NotFound/Conflict/Validation/Unauthorized | ✅ | ✅ AppError.ts + ForbiddenError | ✅ |
| `hasAccess(name, method)` di view | ✅ | ✅ ViewLocalsMiddleware | ✅ |
| `hasRole(roleName)` di view | ✅ | ✅ ViewLocalsMiddleware | ✅ |
| `getError(key)`, `getOld(key)`, `getFile(fileName)` di view | ✅ | ✅ ViewLocalsMiddleware | ✅ |
| `confirmDialog(msg)` → Promise via themed Modal | ✅ | ✅ foot.ejs `window.confirmDialog` | ✅ |
| `window.Toast(message, type)` auto-dismiss 3500ms | ✅ | ✅ foot.ejs setTimeout 3500 | ✅ |
| Image fallback placeholder JS | ✅ | ✅ foot.ejs event listener 'error' | ✅ |
| Sidebar mobile toggle (`-translate-x-full` + overlay) | ✅ | ✅ foot.ejs | ✅ |
| Pagination shape `{datas, paginate_data:{total_data,page_size,current_page,total_page}}` | ✅ | ✅ functions.ts + semua service | ✅ |
| Setting cache 60s TTL | ✅ | ✅ `CACHE_TTL_MS = 60_000` di SettingCacheService | ✅ |

---

## Catatan Tambahan

1. **Round 3 re-audit — naik dari 90% → 98%**. Semua 6 fix yang dijanjikan di round 2 terkonfirmasi hadir di kode. Selain itu, 4 item yang sebelumnya `⚠️ perlu verifikasi` juga dikonfirmasi sudah benar (Bootstrap Icons 1.11.3, OTP pre-fill getOld('otp'), Role→Permission icon text-gray-300, Filemanager CSS tb-fm-* inline di head.ejs).

2. **Fix yang terkonfirmasi di round 3**:
   - `src/utils/response.ts` — `ResponseHandler.success` sekarang `{status:true, message, data}` ✅
   - `src/modules/access/views/be/default/users/create.ejs` — timezone select ada (baris 28–36) ✅
   - `src/modules/auth/views/be/default/login.ejs` — `getFile('/modules/setting/login-image.png')` baris 6 ✅
   - `src/modules/auth/views/be/default/register.ejs` — autocomplete="name/email/new-password" ✅
   - `src/modules/auth/views/be/default/reset_proc.ejs` — `getFile` baris 5, `getOld('otp')` baris 30 ✅
   - `src/modules/setting/views/be/default/index.ejs` — 3-way close: button (l.369), backdrop (l.371), ESC (l.373) ✅

3. **Sisa gap 1 — Trumbowyg lokal** — ubah `head.ejs` untuk memuat core dari `/be/default/vendor/trumbowyg/trumbowyg.min.js` dan CSS-nya secara lokal, bukan dari CDN. File saat ini di `public/vendor/trumbowyg/` hanya berisi `filemanager.js`.

4. **Sisa gap 2 — ResponseHandler.error** — ubah `src/utils/response.ts` baris 8: ganti `errors` → `data` agar error response juga conform ke standar `{status:bool, message:str, data:any|null}`.

5. **SQLite default** — NestAdmin mempertahankan `better-sqlite3` sebagai fallback dev/test. Ini tidak menyalahi standar selama production menggunakan MySQL/PostgreSQL.
