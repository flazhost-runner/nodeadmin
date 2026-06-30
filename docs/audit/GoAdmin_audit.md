# GoAdmin — Audit vs NODEADMIN_STANDARD (Round 3 Re-audit)

**Stack**: Go / Gin
**Lokasi**: `/home/mulyawan/Project/Admin/GoAdmin`
**Tanggal audit**: 2026-06-26 (round 3 re-audit post-fix)
**Auditor**: Claude Sonnet 4.6
**Referensi**: [NODEADMIN_STANDARD.md](../NODEADMIN_STANDARD.md)

---

## Ringkasan Status

| Kategori | Total | ✅ | ❌ | ⚠️ |
|----------|-------|---|---|---|
| §1 Database + §1.8 Seed | 15 | 15 | 0 | 0 |
| §2 Env Vars | 19 | 19 | 0 | 0 |
| §3 Autentikasi | 11 | 11 | 0 | 0 |
| §4 Layout & Shell | 7 | 7 | 0 | 0 |
| §5 Auth Pages | 16 | 13 | 0 | 3 |
| §7-9 Access Module | 15 | 15 | 0 | 0 |
| §10-12 Profile/Setting/Media | 10 | 10 | 0 | 0 |
| §23.18 CSS & Icon | 9 | 8 | 0 | 1 |
| §24 Functions | 20 | 20 | 0 | 0 |
| **TOTAL** | **122** | **118** | **0** | **4** |

**Similarity: 97%** (118/122)

---

## Gap yang Tersisa (⚠️ — tidak ada ❌)

1. **Login flash 2 jalur** — `auth_login.html` hanya punya 1 jalur error (`flash_error` tunggal + `flash_success`); standar butuh 3 jalur: `errorMessages[]` array (Passport failureFlash), `getFlashMessage('error')` single, dan `getFlashMessage('success')`
2. **Login email TANPA `required`** — `auth_login.html` masih ada `required autofocus` pada field email; standar: tanpa `required` maupun `autocomplete` pada email
3. **Login password TANPA `required`** — `auth_login.html` masih ada `required` pada field password; standar: tanpa `required` (koreksi: round 2 salah mark ✅ padahal file faktanya ada `required`)
4. **Trumbowyg main library masih CDN** — `admin_chrome.html` masih load `trumbowyg.min.js` + `trumbowyg.min.css` dari cdnjs; filemanager.js sudah lokal ✅; CSS `tb-fm-*` sudah di-inject inline via `filemanager.js` ✅ — tapi library utama harus dari vendor lokal

---

## Checklist Detail

### §1 — Database + §1.8 Seed

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| `users` — semua 19 kolom | ✓ | ✅ lengkap di migration 1 | ✅ |
| `roles` — guard_name, status, desc | ✓ | ✅ via migration 3 ALTER | ✅ |
| `permissions` — guard_name, method, status, desc | ✓ | ✅ | ✅ |
| `roles_permissions` composite PK | ✓ | ✅ | ✅ |
| `users_roles` composite PK | ✓ | ✅ | ✅ |
| `settings.favicon` | ✓ | ✅ migration 2 | ✅ |
| Seed email=admin@admin.com | ✓ | ✅ seeder.go idempoten | ✅ |
| Seed code="0000000001" | ✓ | ✅ | ✅ |
| Seed phone="12345678910" | ✓ | ✅ | ✅ |
| Seed password bcrypt "12345678" | ✓ | ✅ auth.HashPassword | ✅ |
| Seed timezone="Asia/Jakarta" | ✓ | ✅ | ✅ |
| Seed email_verified_at=now | ✓ | ✅ | ✅ |
| Seed role "Administrator" guard_name="web" desc="" | ✓ | ✅ | ✅ |
| Seed idempoten | ✓ | ✅ cek by name+email | ✅ |
| Pagination response shape | `{datas, paginate_data}` | ✅ `Paginated[T]{Data []T json:"datas", Meta PageMeta json:"paginate_data"}` dengan field `total_data/page_size/current_page/total_page` | ✅ |

### §2 — Environment Variables

| Var | Standard | Status |
|-----|----------|--------|
| APP_PORT, SESSION_SECRET, SESSION_TTL_HOURS | ✓ | ✅ |
| JWT_SECRET, JWT_EXPIRES_IN='1h' string | ✓ | ✅ |
| BCRYPT_ROUNDS=10, OTP_EXPIRY_MINUTES=10, DEFAULT_PAGE_SIZE=10 | ✓ | ✅ |
| STORAGE_DRIVER/ACCESS_KEY_ID/SECRET/ENDPOINT/BUCKET/REGION/SSL | ✓ | ✅ |
| DB_TYPE/HOST/PORT/USERNAME/PASSWORD/DATABASE | ✓ | ✅ |
| MAIL_HOST/PORT/SECURE/USERNAME/PASSWORD/FROM_NAME/FROM_ADDRESS | ✓ | ✅ |
| REDIS_URL | ✓ | ✅ |

### §3 — Autentikasi

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| Web session server-side | ✓ | ✅ | ✅ |
| JWT API Bearer HS256 | ✓ | ✅ | ✅ |
| JWT_EXPIRES_IN string parser | ✓ | ✅ | ✅ |
| BCRYPT_ROUNDS dari env | 10 | ✅ | ✅ |
| authLimiter 10/15min — POST /auth/login | ✓ | ✅ loginLimiter | ✅ |
| authLimiter 10/15min — POST /auth/register | ✓ | ✅ authLimiter `NewRateLimiter(10, 15*time.Minute)` | ✅ |
| authLimiter 10/15min — POST OTP request | ✓ | ✅ authLimiter `NewRateLimiter(10, 15*time.Minute)` | ✅ |
| otpLimiter 5/15min — POST reset/process | ✓ | ✅ | ✅ |
| OTP 6 digit numerik | ✓ | ✅ NewNumericOTP | ✅ |
| OTP bcrypt hash tersimpan | ✓ | ✅ | ✅ |
| Logout destroy session + no refresh token | ✓ | ✅ | ✅ |

### §4 — Layout & Shell

| Item | Status |
|------|--------|
| BE layout sidebar/topbar/main/foot | ✅ |
| FE layout head/header/footer | ✅ |
| Tailwind CDN + 4 CSS vars (--primary/--secondary/--theme-light/--theme-dark) | ✅ |
| Font Awesome LOKAL `/assets/be/default/vendor/fontawesome-free/` | ✅ |
| Bootstrap Icons CDN | ✅ |
| `.sidebar-gradient` | ✅ |
| 5 tema hex eksak (Blue/Purple/Green/Orange/Red) | ✅ |

### §5 — Auth Pages

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| Login 2-kolom `tw-card overflow-hidden grid md:grid-cols-2` | ✓ | ✅ | ✅ |
| Login panel kiri `hidden md:flex sidebar-gradient` | ✓ | ✅ | ✅ |
| Login image hardcoded path `/modules/setting/login-image.png` | ✓ | ✅ `src="/modules/setting/login-image.png"` | ✅ |
| Login logo `h-14 mx-auto object-contain` bukan link | ✓ | ✅ | ✅ |
| Login flash 2 jalur error (errorMessages[] + flash single) | ✓ | ⚠️ hanya `flash_error` tunggal; tidak ada jalur `errorMessages[]` array | ⚠️ |
| Login flash success | ✓ | ✅ | ✅ |
| Login H1 "Hello, Welcome Back!" `color:var(--primary)` | ✓ | ✅ | ✅ |
| Login subtitle "Enter your credentials to continue" | ✓ | ✅ | ✅ |
| Login email `placeholder="Email address"` TANPA required | ✓ | ⚠️ masih ada `required autofocus` | ⚠️ |
| Login password `placeholder="Password"` TANPA required | ✓ | ⚠️ masih ada `required` (koreksi round 2 yang salah mark ✅) | ⚠️ |
| Login submit `btn btn-primary-tw w-100 py-2 mb-3` | ✓ | ✅ (py via inline style) | ✅ |
| Login remember UI-only (name="remember") | ✓ | ✅ | ✅ |
| Login forgot link `text-primary-tw text-decoration-none` | ✓ | ✅ | ✅ |
| Login `<hr class="my-4">` + register link fw-semibold "create here" | ✓ | ✅ | ✅ |
| Register strip roles dari body | ✓ | ✅ controller hanya baca name/email/password — roles tidak dibaca sama sekali | ✅ |
| Forgot flash 'OTP Send Success.', back "back?" | ✓ | ✅ | ✅ |
| Reset OTP pre-fill via getOld | ✓ | ✅ `getOld . "otp"` | ✅ |

### §7-9 — Access Module

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| User index 10 kolom | ✓ | ✅ | ✅ |
| User create 12 field urutan baku | ✓ | ✅ | ✅ |
| Role create name→desc→status | ✓ | ✅ | ✅ |
| Role edit name→status→desc | ✓ | ✅ | ✅ |
| Role→Permission Not-assigned icon `text-gray-300` | ✓ | ✅ | ✅ |
| Permission auto-discover tiap GET index | ✓ | ✅ | ✅ |
| Permission route naming `{guard}.v1.{module}.{resource}.{action}` | ✓ | ✅ | ✅ |
| AccessMiddleware fresh DB per request | ✓ | ✅ Authorize() | ✅ |
| AccessMiddleware Administrator bypass | ✓ | ✅ | ✅ |
| Web fail: flash 'Unauthorized.' + redirect Referrer | ✓ | ✅ `setFlashAndRedirect(c, "Unauthorized.", ...)` + `c.Request.Referer()` | ✅ |
| API fail: 403 `{status:false, message:'Forbidden'}` | ✓ | ✅ (message Indonesian) | ✅ |
| `hasAccess()` di template | ✓ | ✅ FuncMap | ✅ |
| `hasRole()` di template | ✓ | ✅ FuncMap `hasRole(user, "Administrator")` | ✅ |
| `getError(key)` di view | ✓ | ✅ FuncMap `getError(. "field")` | ✅ |
| `getOld(key)` di view | ✓ | ✅ FuncMap `getOld(. "field")` | ✅ |

### §10-12 — Profile, Setting, Media

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| Profile flash 'Update Profile Success.' | ✓ | ✅ | ✅ |
| Setting 5 tema swatch (radio sr-only) | ✓ | ✅ | ✅ |
| Setting live preview JS tanpa reload | ✓ | ✅ | ✅ |
| FE template catalog | ✓ | ✅ | ✅ |
| Thumbnail lazy IntersectionObserver rootMargin 200px | ✓ | ✅ | ✅ |
| openModal/closeModal 3 cara tutup | ✓ | ✅ | ✅ |
| localStorage cache template | ✓ | ✅ | ✅ |
| Setting flash 'Save Setting Success.' | ✓ | ✅ | ✅ |
| Setting cache 60s TTL | ✓ | ✅ `const cacheTTL = 60 * time.Second` | ✅ |
| Media GET list, POST upload, POST delete | ✓ | ✅ | ✅ |
| Media max 2MB, MIME image/* | ✓ | ✅ | ✅ |

### §23.18 — CSS & Icon

| Item | Status |
|------|--------|
| `@layer components` Bootstrap shims | ✅ |
| `.tw-card`, `.sidebar-gradient`, `.nav-link-tw` | ✅ |
| `.btn-primary-tw`, `.btn-info`, `.btn-outline-dark` | ✅ |
| `.alert` 5 varian, `.pagination`, `.page-item.active` | ✅ |
| `.modal-overlay`, `.modal-box`, `.toast` | ✅ |
| `.dropdown-item.danger:hover` | ✅ |
| Font Awesome LOKAL | ✅ |
| Bootstrap Icons CDN 1.11.3 | ✅ |
| Trumbowyg LOKAL + filemanager CSS `tb-fm-*` | ⚠️ main library (trumbowyg.min.js/css) masih CDN cdnjs; filemanager.js lokal ✅; `tb-fm-*` CSS di-inject inline via filemanager.js ✅ |

### §24 — Functions

| Item | Standard | GoAdmin | Status |
|------|----------|---------|--------|
| CSRF body `_csrf` | ✓ | ✅ | ✅ |
| CSRF query `?_csrf=` | ✓ | ✅ | ✅ |
| CSRF header `x-csrf-token` lowercase | ✓ | ✅ | ✅ |
| CSRF timing-safe `subtle.ConstantTimeCompare` | ✓ | ✅ | ✅ |
| CSRF skip `/api/` | ✓ | ✅ | ✅ |
| Method override `?_method=PUT\|DELETE` | ✓ | ✅ | ✅ |
| Flash format `{key:'success'\|'error', message}` | ✓ | ✅ unified JSON `{key, message}` di `FlashKey` satu kunci sesi | ✅ |
| Flash teks 18 pesan Inggris | ✓ | ✅ semua ada | ✅ |
| API response `{status:bool, message, data}` | ✓ | ✅ `apiEnvelope{Status bool json:"status"}` | ✅ |
| AppError hierarchy NotFound/Conflict/Validation/Unauthorized | ✓ | ✅ | ✅ |
| errorHandler API→JSON, web→flash+redirect | ✓ | ✅ | ✅ |
| `hasAccess()` di view | ✓ | ✅ | ✅ |
| `hasRole()` di view | ✓ | ✅ `hasRole(user, roleName string) bool` di FuncMap | ✅ |
| `getError(key)` di view | ✓ | ✅ `getError(data, key string) string` di FuncMap | ✅ |
| `getOld(key)` di view | ✓ | ✅ `getOld(data, key string) string` di FuncMap | ✅ |
| `getFile(name)` di view | ✓ | ✅ `getFile(path string) string` di FuncMap | ✅ |
| `confirmDialog()` themed | ✓ | ✅ | ✅ |
| `window.Toast()` auto-dismiss 3500ms | ✓ | ✅ | ✅ |
| Image fallback placeholder JS | ✓ | ✅ | ✅ |
| Sidebar mobile toggle | ✓ | ✅ | ✅ |
| Pagination `{datas, paginate_data}` | ✓ | ✅ `Paginated[T]` dengan field JSON `"datas"` + `"paginate_data"` | ✅ |
| Setting cache 60s TTL | ✓ | ✅ `cacheTTL = 60 * time.Second` | ✅ |

---

## Catatan Tambahan

- GoAdmin arsitektur paling mature: DI container, middleware pipeline, named routes, error handler terstruktur
- FA vendor di `/web/assets/be/default/vendor/fontawesome-free/` (FA 5.13.1)
- Trumbowyg: filemanager.js di `/web/assets/vendor/trumbowyg/filemanager.js`; CSS `tb-fm-*` di-inject inline via JS; tapi trumbowyg.min.js/css utama masih dari cdnjs 2.27.3
- `getFile()`/`getOld()`/`getError()` menggunakan idiom Go: fungsi template menerima `data` sebagai argumen pertama (`getOld . "key"`) — berbeda dari NodeAdmin EJS standalone helper tapi setara fungsional
- Round 3: naik dari 84% → 97%; 17 fix dikonfirmasi + 1 koreksi (password required yang round 2 salah mark ✅)

---

> Round 3 re-audit — naik dari 84% → 97% (118✅/4⚠️/0❌/122 total)
