# NodeAdmin — Standar Spesifikasi Lengkap

> **Dokumen ini adalah sumber kebenaran tunggal** untuk semua app turunan NodeAdmin (GoAdmin, PHPAdmin, RustAdmin, CppAdmin, dst).
> Setiap fitur, field, button, route, dan response harus **1:1** dengan standar ini.
> Gunakan sebagai checklist komparasi: centang ✅ = sudah ada, ❌ = belum ada.

---

## DAFTAR ISI

1. [Struktur Database](#1-struktur-database)
2. [Environment Variables](#2-environment-variables)
3. [Sistem Autentikasi](#3-sistem-autentikasi)
4. [Layout & Shell](#4-layout--shell)
5. [Modul: Auth (Login / Register / Reset Password)](#5-modul-auth)
6. [Modul: Dashboard](#6-modul-dashboard)
7. [Modul: Access — User](#7-modul-access--user)
8. [Modul: Access — Role](#8-modul-access--role)
9. [Modul: Access — Permission](#9-modul-access--permission)
10. [Modul: Profile](#10-modul-profile)
11. [Modul: Setting](#11-modul-setting)
12. [Modul: Media](#12-modul-media)
13. [Modul: Components (UI Showcase)](#13-modul-components-ui-showcase)
14. [Modul: Home (Public Frontend)](#14-modul-home-public-frontend)
15. [Standar Tabel (Index View)](#15-standar-tabel-index-view)
16. [Standar Form (Create / Edit View)](#16-standar-form-create--edit-view)
17. [UI Components Global](#17-ui-components-global)
18. [Standar API Response](#18-standar-api-response)
19. [Semua API Endpoints](#19-semua-api-endpoints)
20. [Tema (Theme System)](#20-tema-theme-system)
21. [Middleware & Security](#21-middleware--security)
22. [Fitur Global Cross-Modul](#22-fitur-global-cross-modul)
- [Lampiran: Ringkasan Checklist per App Turunan](#lampiran-ringkasan-checklist-per-app-turunan)
23. [Standar CSS, Kelas, dan Icon Lengkap (Per File)](#23-standar-css-kelas-dan-icon-lengkap-per-file)
24. [Function Equivalence Checklist](#24-function-equivalence-checklist)

---

## 1. STRUKTUR DATABASE

### 1.1 Tabel `users`

| Kolom | Tipe | Constraint | Catatan |
|-------|------|------------|---------|
| `id` | varchar(36) | PRIMARY KEY | UUID |
| `code` | varchar(20) | NOT NULL, INDEX | Kode unik user |
| `name` | varchar(50) | NOT NULL, INDEX | Nama lengkap |
| `phone` | varchar(15) | nullable, INDEX | — |
| `email` | varchar(255) | NOT NULL, INDEX | Unique identifier login |
| `email_verified_at` | timestamp | nullable | — |
| `password` | varchar(255) | NOT NULL | bcrypt hash |
| `password_otp` | varchar(50) | nullable | bcrypt hash OTP |
| `password_otp_expires` | bigint/varchar(50) | nullable | Unix timestamp expiry |
| `status` | varchar(20) | DEFAULT 'Active', INDEX | 'Active' \| 'Inactive' |
| `picture` | varchar(255) | nullable | Path ke file di storage |
| `timezone` | varchar(255) | nullable, DEFAULT 'UTC', INDEX | IANA timezone string |
| `blocked` | boolean | DEFAULT false, INDEX | — |
| `blocked_reason` | varchar(255) | nullable | Alasan pemblokiran |
| `created_by` | varchar(36) | nullable | FK ke users.id |
| `updated_by` | varchar(36) | nullable | FK ke users.id |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | Auto-update |

**Index**: `users__id`, `users__code`, `users__name`, `users__phone`, `users__email`, `users__status`, `users__timezone`, `users__blocked`

---

### 1.2 Tabel `roles`

| Kolom | Tipe | Constraint | Catatan |
|-------|------|------------|---------|
| `id` | varchar(36) | PRIMARY KEY | UUID |
| `name` | varchar(255) | NOT NULL, UNIQUE INDEX | — |
| `status` | varchar(20) | DEFAULT 'Active', INDEX | 'Active' \| 'Inactive' |
| `desc` | varchar(255) | nullable | Deskripsi singkat |
| `created_by` | varchar(36) | nullable | — |
| `updated_by` | varchar(36) | nullable | — |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |

**Index**: `roles__id`, `roles__name` (UNIQUE), `roles__status`

---

### 1.3 Tabel `permissions`

| Kolom | Tipe | Constraint | Catatan |
|-------|------|------------|---------|
| `id` | varchar(36) | PRIMARY KEY | UUID |
| `name` | varchar(255) | NOT NULL, INDEX | Nama permission |
| `method` | varchar(255) | NOT NULL, INDEX | HTTP method: GET/POST/PUT/DELETE/PATCH |
| `guard_name` | varchar(20) | nullable, DEFAULT 'web', INDEX | 'web' \| 'api' |
| `status` | varchar(20) | DEFAULT 'Active', INDEX | 'Active' \| 'Inactive' |
| `desc` | varchar(255) | nullable | — |
| `created_by` | varchar(36) | nullable | — |
| `updated_by` | varchar(36) | nullable | — |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |

**Index**: `permissions__id`, `permissions__name`, `permissions__method`, `permissions__status`, `permissions__guard`

---

### 1.4 Tabel `roles_permissions` (Pivot)

| Kolom | Tipe |
|-------|------|
| `role_id` | varchar(36) — FK → roles.id |
| `permission_id` | varchar(36) — FK → permissions.id |

PRIMARY KEY: (`role_id`, `permission_id`)

---

### 1.5 Tabel `users_roles` (Pivot)

| Kolom | Tipe |
|-------|------|
| `user_id` | varchar(36) — FK → users.id |
| `role_id` | varchar(36) — FK → roles.id |

PRIMARY KEY: (`user_id`, `role_id`)

---

### 1.6 Tabel `settings`

| Kolom | Tipe | Constraint | Catatan |
|-------|------|------------|---------|
| `id` | char(36) | PRIMARY KEY | UUID |
| `initial` | varchar(255) | nullable, INDEX | Inisial perusahaan (misal "NA") |
| `name` | varchar(255) | nullable, INDEX | Nama perusahaan/app |
| `description` | text | nullable | Rich text (HTML) |
| `icon` | varchar(255) | nullable, INDEX | Path ikon (32×32 atau SVG) |
| `logo` | varchar(255) | nullable, INDEX | Path logo |
| `login_image` | varchar(255) | nullable, INDEX | Gambar panel kiri halaman login |
| `phone` | varchar(255) | nullable, INDEX | — |
| `address` | varchar(255) | nullable | — |
| `email` | varchar(255) | nullable, INDEX | — |
| `copyright` | varchar(255) | nullable, INDEX | Teks copyright footer |
| `theme` | varchar(20) | nullable, DEFAULT 'Blue' | Pilihan tema admin |
| `fe_template` | varchar(80) | nullable, DEFAULT 'agency-consulting-002-creative-agency' | Slug template frontend |
| `created_by` | char(36) | nullable | — |
| `updated_by` | char(36) | nullable | — |
| `created_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |
| `updated_at` | timestamp | DEFAULT CURRENT_TIMESTAMP | — |

> **Catatan**: Tabel `settings` hanya punya **1 baris** (singleton). Seed awal harus menyisipkan 1 row.

---

### 1.7 Relasi Antar Tabel

```
users ──< users_roles >── roles ──< roles_permissions >── permissions
                              │
                              └── users (created_by / updated_by)
settings (singleton)
```

### 1.8 Default Seed Data

Setelah migration, **wajib** ada satu migration/seeder yang menyisipkan data awal berikut:

#### User Administrator

| Kolom | Nilai |
|-------|-------|
| `code` | `"0000000001"` |
| `name` | `"Administrator"` |
| `phone` | `"12345678910"` |
| `email` | `"admin@admin.com"` |
| `email_verified_at` | timestamp saat seed dijalankan |
| `password` | bcrypt hash dari `"12345678"` (rounds = `BCRYPT_ROUNDS` env, default 10) |
| `status` | `"Active"` |
| `timezone` | `"Asia/Jakarta"` |
| `blocked` | `false` |
| `blocked_reason` | `""` (string kosong) |

#### Role Administrator

| Kolom | Nilai |
|-------|-------|
| `name` | `"Administrator"` |
| `guard_name` | `"web"` |
| `status` | `"Active"` |
| `desc` | `""` (string kosong) |

#### Relasi

User `admin@admin.com` di-assign ke role `Administrator` via tabel `users_roles`.

#### Aturan

- Password **wajib** di-hash bcrypt (bukan plain-text, bukan SHA-256, bukan MD5).
- Seed dilakukan dalam satu migration/seeder tersendiri (bukan dicampur dengan DDL migration).
- Jika seed dijalankan ulang, harus idempoten (cek duplikasi by email/name sebelum insert).

---

## 2. ENVIRONMENT VARIABLES

### 2.1 App

| Key | Default | Wajib | Catatan |
|-----|---------|-------|---------|
| `APP_NAME` | `NodeAdmin` | Ya | Judul tab, topbar, email |
| `APP_HOST` | `0.0.0.0` | — | — |
| `APP_PORT` | `3000` | — | — |
| `APP_MODE` | `full` | — | `full` = web+api; `api` = API only |

### 2.2 Database

| Key | Default | Wajib |
|-----|---------|-------|
| `DB_TYPE` | `mysql` | Ya |
| `DB_HOST` | `127.0.0.1` | Ya |
| `DB_PORT` | `3306` | Ya |
| `DB_USERNAME` | — | Ya |
| `DB_PASSWORD` | — | Ya |
| `DB_DATABASE` | — | Ya |

### 2.3 Redis

| Key | Default |
|-----|---------|
| `REDIS_URL` | `redis://127.0.0.1:6379` |

### 2.4 Session (Web)

| Key | Default | Catatan |
|-----|---------|---------|
| `SESSION_SECRET` | **(wajib di production)** | String acak panjang |
| `SESSION_TTL_HOURS` | `6` | Durasi sesi web |

### 2.5 JWT (API)

| Key | Default | Catatan |
|-----|---------|---------|
| `JWT_SECRET` | **(wajib di production)** | — |
| `JWT_EXPIRES_IN` | `1h` | Format: `1h`, `7d`, dll |

### 2.6 Security

| Key | Default |
|-----|---------|
| `BCRYPT_ROUNDS` | `10` |
| `OTP_EXPIRY_MINUTES` | `10` |

### 2.7 Mail

| Key | Default | Catatan |
|-----|---------|---------|
| `MAIL_HOST` | — | SMTP host |
| `MAIL_PORT` | `587` | — |
| `MAIL_SECURE` | `false` | TLS |
| `MAIL_USERNAME` | — | — |
| `MAIL_PASSWORD` | — | — |
| `MAIL_FROM_NAME` | — | Sender name di email |
| `MAIL_FROM_ADDRESS` | — | Sender address |

### 2.8 Storage

| Key | Default | Nilai Valid |
|-----|---------|-------------|
| `STORAGE_DRIVER` | `oss` | `oss` \| `s3` |
| `STORAGE_ACCESS_KEY_ID` | — | — |
| `STORAGE_SECRET_ACCESS_KEY` | — | — |
| `STORAGE_ENDPOINT` | — | URL endpoint (OSS/S3-compatible) |
| `STORAGE_BUCKET` | — | Nama bucket |

---

## 3. SISTEM AUTENTIKASI

### 3.1 Web (Session-based)

- **Strategi**: Passport.js local strategy (email + password)
- **Session store**: Redis (`SESSION_SECRET`, `SESSION_TTL_HOURS`)
- **Remember me**: jika checkbox `remember` dicentang, session TTL diperpanjang (misal 30 hari)
- **Guard middleware**: `ensureAuthenticated` → redirect ke `/auth/login` jika belum login
- **CSRF**: token disematkan di `<meta name="csrf-token">` dan dikirim di setiap form / AJAX header

### 3.2 API (JWT Bearer)

- **Token**: JWT, dikirim di header `Authorization: Bearer <token>`
- **Expiry**: `JWT_EXPIRES_IN` (default 1h)
- **Blacklist**: saat logout, token dimasukkan Redis dengan TTL = sisa masa berlaku
- **Guard middleware**: `ensureAuthenticatedApi` → cek signature + expiry + blacklist

### 3.3 Password & OTP

- **Hash**: bcrypt, rounds dari `BCRYPT_ROUNDS`
- **OTP reset password**: 6 digit numerik, di-hash bcrypt, expiry dari `OTP_EXPIRY_MINUTES`
- **Pengiriman OTP**: via email (Nodemailer), template HTML `mail/otp.ejs`

### 3.4 Rate Limiting

| Limiter | Berlaku Di | Batas |
|---------|-----------|-------|
| `authLimiter` | Login, Register, Reset Request | 5 req / 15 menit per IP |
| `otpLimiter` | Reset Process (submit OTP) | lebih ketat (misal 3 req / 15 menit) |

---

## 4. LAYOUT & SHELL

### 4.1 Backend Layout (`be/default`)

Terdiri dari partial:

#### `head.ejs`
- `<html lang="id">`
- Meta: charset, viewport, CSRF token (`<meta name="csrf-token">`)
- Title: `{PageTitle} — {APP_NAME}`
- Favicon dari `setting.icon`
- **Tailwind CSS** via CDN dengan konfigurasi warna dinamis dari tema:
  ```js
  tailwind.config = {
    theme: { extend: { colors: {
      primary: '<tema.primary>',
      secondary: '<tema.secondary>',
      'theme-light': '<tema.light>',
      'theme-dark': '<tema.dark>'
    }}}
  }
  ```
- `@layer components`: class custom:
  - `.form-control` — input style
  - `.btn`, `.btn-primary-tw`, `.btn-success`, `.btn-danger`, `.btn-info`, `.btn-warning`
  - `.table`, `.table-bordered`, `.table-hover`
  - `.alert`, `.alert-success`, `.alert-danger`, `.alert-info`, `.alert-warning`
  - `.badge`, `.badge-primary`, `.badge-success`, `.badge-danger`, dll
  - `.dropdown`, `.dropdown-menu`, `.dropdown-item`
  - `.pagination`, `.page-item`, `.page-link`
  - `.stat-card`
  - `.invalid-feedback`
- Bootstrap Icons CDN (`bi bi-*`)
- Font Awesome CDN (`fa fa-*` / `fas fa-*`)

#### `sidebar.ejs`
- **Brand**: logo (`setting.logo`) + nama app (`APP_NAME`), link → dashboard
- **Nav items** (visibility dikontrol `hasAccess(routeName, method)`):
  - **Dashboard** (fa-tachometer-alt / fa-gauge) — selalu tampil
  - **UI Components** (fa-puzzle-piece) — jika punya akses
  - **--- MAINTENANCE ---** (section header, tampil jika punya akses ≥1 item di bawah):
    - **Permission** (fa-key) → `/admin/v1/access/permission`
    - **Role** (fa-user-shield) → `/admin/v1/access/role`
    - **User** (fa-users) → `/admin/v1/access/user`
    - **Setting** (fa-cog) → `/admin/v1/setting`
- Footer sidebar: teks copyright dari `setting.copyright`
- **Mobile**: hamburger overlay (sidebar tersembunyi default di layar < md, toggle via JS)
- Active state: item nav yang sedang aktif di-highlight

#### `topbar.ejs`
- **Kiri**: tombol hamburger (mobile), icon Home → dashboard
- **Kanan**: user dropdown:
  - Trigger: avatar (`setting.picture` atau fallback `fa-user`) + `fa-gear` icon
  - Header dropdown: "Welcome, {auth.name}" (hidden di layar kecil)
  - Item: **Profile** (fa-user) → `/admin/v1/profile`
  - Divider
  - Item: **Logout** (fa-sign-out-alt) → POST `/auth/logout` (form dengan CSRF)

#### `main.ejs`
- DOCTYPE + `<html>`
- Include `head.ejs`
- `<div class="flex">` → include `sidebar.ejs`
- `<div class="flex-1 md:ml-64">` → include `topbar.ejs`
- `<main>` → `<%- body %>` (konten halaman)
- Flash message → Toast JS otomatis saat ada flash `success` atau `error`
- Include `foot.ejs`

#### `foot.ejs`
Script global:
- **jQuery**
- **Chart.js**
- **Trumbowyg** (rich text editor)
- Script custom global: Toast, Modal, confirmDialog, select-all, previewImage

#### `full-width.ejs`
- Layout tanpa sidebar (untuk: login, register, reset password)
- `<div class="min-h-screen flex">` → 2 kolom: panel kiri (gambar) + panel kanan (form)

### 4.2 Frontend Layout (`fe/default`)

- `head.ejs`, `header.ejs`, `footer.ejs`, `main.ejs`
- Render template frontend yang dipilih di Setting

### 4.3 Mail Layout

- `mails/header.ejs`, `mails/footer.ejs`, `mails/main.ejs`
- Wrapping HTML email OTP

---

## 5. MODUL: AUTH

### 5.1 Halaman Login

**URL**: `GET /auth/login` (route name: `web.auth.login`)  
**POST**: `route('web.auth.login.post')` — diproses Passport LocalStrategy + `authLimiter`  
**Layout**: `full-width.ejs` (2 kolom, tanpa sidebar)  
**Rate limit**: `authLimiter` pada POST (10 req/15 menit/IP)

#### Struktur Layout

```
<div class="w-full max-w-5xl tw-card overflow-hidden grid md:grid-cols-2">
  <!-- Panel Kiri -->
  <div class="hidden md:flex sidebar-gradient items-center justify-center p-10">
  <!-- Panel Kanan -->
  <div class="p-8 md:p-12 flex flex-col justify-center">
```

> Panel kiri **hidden di mobile** (`hidden md:flex`), muncul hanya di `md:` ke atas.

#### Panel Kiri

| Elemen | Detail |
|--------|--------|
| Wrapper | `hidden md:flex sidebar-gradient items-center justify-center p-10` |
| Gambar | `<img class="max-w-full max-h-80 object-contain">` |
| src gambar | `getFile('/modules/setting/login-image.png')` — **path hardcoded**, bukan dari `setting.*` |

> ⚠️ Login image adalah aset default yang di-serve dari storage. Bukan field `setting.login_image`.

#### Panel Kanan

**Logo** (bukan link — tidak ada `<a>` wrapping):
```html
<div class="mb-8 text-center">
  <img class="h-14 mx-auto object-contain" src="<%= getFile(setting.logo) %>" alt="logo">
</div>
```

**Flash messages — dua jalur error terpisah:**

```html
<%# Jalur 1: errorMessages dari req.flash('error') — Passport failureFlash %>
<% if (errorMessages.length > 0) { %>
  <div class="alert alert-danger">
    <ul class="mb-0 ps-3">
      <% errorMessages.forEach(function(m) { %><li><%= m %></li><% }); %>
    </ul>
  </div>
<% } %>

<%# Jalur 2: getFlashMessage('error') — custom flash dari AuthController %>
<% if (getFlashMessage('error')) { %>
  <div class="alert alert-danger"><%= getFlashMessage('error').message %></div>
<% } %>

<%# Jalur 3: getFlashMessage('success') — flash sukses (mis. dari register) %>
<% if (getFlashMessage('success')) { %>
  <div class="alert alert-success"><%= getFlashMessage('success').message %></div>
<% } %>
```

**Heading block** (`<div class="mb-6">`):
- `<h1 class="text-2xl font-bold" style="color:var(--primary)">Hello, Welcome Back!</h1>`
- `<p class="text-sm text-gray-500">Enter your credentials to continue</p>`

**Form elemen** (`method="POST"` `action="route('web.auth.login.post')"`):

| Urutan | Elemen | Tipe | Class | Atribut | Placeholder |
|--------|--------|------|-------|---------|------------|
| 1 | `email` | `email` | `form-control` | `name="email"` | `"Email address"` |
| 2 | `password` | `password` | `form-control` | `name="password"` | `"Password"` |
| 3 | Submit | `button[type=submit]` | `btn btn-primary-tw w-100 py-2 mb-3` | — | Teks: **"Login"** |
| 4 | Remember + Forgot row | — | `d-flex justify-content-between small mb-3` | — | — |

> ⚠️ Input email & password **tidak punya** atribut `required` maupun `autocomplete`. Validasi dilakukan server-side oleh Passport.

**Remember + Forgot row** (dalam satu `<div class="d-flex justify-content-between small mb-3">`):

```html
<div>
  <input type="checkbox" class="form-check-input" id="remember" name="remember">
  <label class="form-check-label" for="remember">Keep me logged in</label>
</div>
<a href="<%= route('admin.v1.auth.reset.req') %>" class="text-primary-tw text-decoration-none">
  Forgot password
</a>
```

> ⚠️ **"Keep me logged in" adalah UI-only — tidak diproses server-side.**  
> Route POST login langsung `passport.authenticate('local', {...})` tanpa custom callback; `req.body.remember` tidak pernah dibaca. Session TTL selalu tetap `SESSION_TTL_HOURS` (default 6 jam) apapun status checkbox. App turunan **tidak perlu** mengimplementasikan remember-me logic — cukup render checkbox sebagai elemen UI tanpa efek fungsional.

**Divider + Link register:**

```html
<hr class="my-4">
<div class="text-center small">
  <span class="text-gray-500">Don't have an account? </span>
  <a class="text-primary-tw text-decoration-none fw-semibold"
     href="<%= route('web.auth.register') %>">create here</a>
</div>
```

#### Login Flow (POST)

1. Passport LocalStrategy: `findOne({email})` → `bcrypt.compare(password, hash)`
2. Fail → `req.flash('error', 'Invalid email or password')` → redirect `/auth/login`
3. Success → `serializeUser(user.id)` → redirect `/admin/v1/dashboard`
4. Blocked user: **tidak dicek** di login — Passport tidak tahu status `blocked`

---

### 5.2 Halaman Register

**URL**: `GET /auth/register` (route name: `web.auth.register`)  
**POST**: `route('web.auth.register.post')`  
**Layout**: `full-width.ejs` (struktur 2 kolom identik dengan login)  
**Rate limit**: `authLimiter` pada POST

**Flash handler**: hanya `errorMessages[]` (array dari `req.flash('error')`) — **tidak ada** `getFlashMessage`. Validasi field-level via `getError()`.

**Form elemen** (`method="post"`):

| Urutan | Field | Tipe | Class | `autocomplete` | Validasi server |
|--------|-------|------|-------|----------------|----------------|
| 1 | `name` | text | `form-control [is-invalid]` | `"name"` | required |
| 2 | `email` | email | `form-control [is-invalid]` | `"email"` | required, valid email |
| 3 | `password` | password | `form-control [is-invalid]` | `"password"` | required, min 8 kar |
| 4 | Submit | `button[type=submit]` | `btn btn-primary-tw w-100 py-2 mb-3` | — | — |

Setiap field memiliki `invalid-feedback`: `<%= getError('field')['msg'] %>`

**Heading**: `"Create Account"` / subtitle: `"Fill the form to register"`

**Divider + link login:**
```html
<hr class="my-4">
<div class="text-center small">
  <a class="text-primary-tw text-decoration-none fw-semibold"
     href="<%= route('web.auth.login') %>">Already have an account?</a>
</div>
```

**Register flow:**
1. `validationResult(req)` → error → `req.session.errors = errors.array()` + redirect back
2. Strip `roles` dari body → `userService.store(safeBody, null, true)` (isPublicRegister)
3. Sukses: flash `'Register Success. Please Login.'` + redirect `/auth/login`
4. Error (catch): flash `{ key:'error', message: err.message }` + redirect `/auth/register`

> ⚠️ Tidak ada assignment role saat register publik — `true` flag mencegah role assignment.

---

### 5.3 Halaman Forgot Password (Request OTP)

**URL**: `GET /admin/v1/auth/reset/req` (route name: `admin.v1.auth.reset.req`)  
**POST**: `route('admin.v1.auth.reset.request')`  
**Layout**: `full-width.ejs` (struktur 2 kolom identik)  
**Rate limit**: `authLimiter` pada POST

**Flash handler**: `getFlashMessage('error')` + `getFlashMessage('success')` — **tidak ada** `errorMessages[]`.

**Form elemen** (`method="post"`):

| Urutan | Field | Tipe | Class | `autocomplete` | Validasi server |
|--------|-------|------|-------|----------------|----------------|
| 1 | `email` | email | `form-control [is-invalid]` | `"email"` | required, harus ada di DB |
| 2 | Submit | `button[type=submit]` | `btn btn-primary-tw w-100 py-2 mb-3` | — | — |

**Heading**: `"Forgot Password"` / subtitle: `"Enter your Email to continue"`

**Divider + link login:**
```html
<hr class="my-4">
<div class="text-center small">
  <a class="text-primary-tw text-decoration-none"
     href="<%= route('web.auth.login') %>">back?</a>
</div>
```

> Link teks **"back?"** (bukan "Back to login").

**OTP Request flow:**
1. `findOne({email})` → tidak ada → throw Error `'Invalid email'` → flash error + redirect `/auth/login`
2. `generateOTP()` → `hashOTP(otp)` → simpan ke `users.password_otp` + `users.password_otp_expires`
3. `sendMail(email, 'Request Reset Password', ...)` — render template `mail/otp`
4. Sukses: flash `'OTP Send Success.'` + redirect `/admin/v1/auth/reset/proc`
5. Error: flash `err.message` + redirect `/auth/login`

---

### 5.4 Halaman Reset Password (Process OTP)

**URL**: `GET /admin/v1/auth/reset/proc` (route name: `admin.v1.auth.reset.proc`)  
**POST**: `route('admin.v1.auth.reset.process')`  
**Layout**: `full-width.ejs` (struktur 2 kolom identik)  
**Rate limit**: `otpLimiter` pada POST (5 req/15 menit/IP — lebih ketat dari authLimiter)

**Flash handler**: `getFlashMessage('error')` + `getFlashMessage('success')` — identik dengan reset_req.

**Form elemen** (`method="post"`):

| Urutan | Field | Label | Tipe | Class | `autocomplete` |
|--------|-------|-------|------|-------|----------------|
| 1 | `email` | Email | email | `form-control [is-invalid]` | `"email"` |
| 2 | `otp` | OTP | text | `form-control [is-invalid]` | `"otp"` |
| 3 | `password` | Password | password | `form-control [is-invalid]` | `"password"` |
| 4 | `password_confirmation` | Password Confirm | password | `form-control [is-invalid]` | `"password_confirmation"` |
| 5 | Submit | — | `button[type=submit]` | `btn btn-primary-tw w-100 py-2 mb-3` | — |

> `otp` field: `value="<%= getOld('otp') %>"` — satu-satunya field yang pre-fill dari old input.  
> Email, password, password_confirmation: `value=""` selalu kosong (sensitif, tidak di-restore).

**Heading**: `"Reset Password"` / subtitle: `"Enter Your New Password"`

**Divider + link login:** sama dengan reset_req — teks link **"back?"**

**OTP Process flow:**
1. `findOne({email})` → cek `Number(password_otp_expires) > Date.now()` → `verifyOTP(otp, hash)`
2. Jika gagal: throw → flash `'Invalid or expired OTP'` + redirect ke halaman ini
3. Sukses: update `password = bcrypt.hash(...)`, clear `password_otp=''`, `password_otp_expires=null`
4. Flash `'Reset Password Success.'` + redirect `/auth/login`

---

### 5.5 Email Template OTP (`mail/otp.ejs`)

- Layout: `mails/main.ejs`
- Dirender via `app.render(path, { otp, layout: './mails/main' })`
- Subject email: `'Request Reset Password'`
- Body text fallback: `` `Your OTP is ${otp}` ``
- Isi HTML: kode OTP 6 digit, nama app (`APP_NAME`), expiry menit (`OTP_EXPIRY_MINUTES`)

---

### 5.6 Logout

**Route**: `POST /auth/logout` (route name: `web.auth.logout`)  
- `req.logout(callback)` → destroy session
- Redirect → `/auth/login`

---

### 5.7 API Auth Endpoints

| Method | Path | Auth | Body | Response |
|--------|------|------|------|---------|
| POST | `/api/v1/auth/login` | Public | `{email, password}` | `{access_token, token_type:"Bearer", expires_in:3600}` |
| POST | `/api/v1/auth/logout` | Bearer JWT | — | `{message:"Logged out"}` |
| POST | `/api/v1/auth/register` | Public | `{name, email, password}` | `{message:"Registered"}` |
| POST | `/api/v1/auth/reset/request` | Public | `{email}` | `{message:"OTP sent"}` |
| POST | `/api/v1/auth/reset/process` | Public | `{email, otp, password, password_confirmation}` | `{message:"Password reset"}` |

---

## 6. MODUL: DASHBOARD

### 6.1 Route

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/v1/dashboard` | Session + AccessMiddleware |
| GET | `/api/v1/dashboard` | Bearer JWT + AccessMiddleware |

### 6.2 API Response

```json
{
  "status": "success",
  "data": {
    "users": 42,
    "roles": 5,
    "permissions": 120
  }
}
```

### 6.3 Halaman Dashboard

**URL**: `GET /admin/v1/dashboard`  
**Layout**: `be/default/main`

#### Header Section
- Judul: "Dashboard Overview"
- Teks sambutan: "Welcome back, {auth.name}"
- Current date/time (ditampilkan oleh JS, format: "Thursday, 26 June 2026 — 13:24")

#### Stat Cards (4 kartu, animasi counter)

| # | Judul | Nilai | Ikon | Warna |
|---|-------|-------|------|-------|
| 1 | Total Users | `data.users` | `fa-users` | primary |
| 2 | Roles | `data.roles` | `fa-user-shield` | green |
| 3 | Permissions | `data.permissions` | `fa-key` | yellow |
| 4 | Active Theme | `setting.theme` | `fa-palette` | purple |

- Animasi: counter bertambah dari 0 ke nilai dalam 1 detik (`data-target`)

#### Chart Section (2 chart sejajar)

**Chart 1 — Line Chart "Sales Overview"**
- Library: Chart.js
- Tipe: `line`
- Warna ikut tema (CSS var `--primary`)
- Select filter: "Last 7 days" / "Last 30 days" / "Last 3 months" (AJAX update data)
- Label: tanggal/bulan, data: nilai numerik

**Chart 2 — Doughnut Chart "Traffic Sources"**
- Library: Chart.js
- Tipe: `doughnut`
- Data: hardcoded demo (Direct 40%, Social 30%, Organic 20%, Referral 10%)
- Button: "View All" di kanan atas card

#### Recent Activities (Card)
4 item demo (icon, teks, waktu):
1. "New user registered" — 2 minutes ago
2. "New order received" — 15 minutes ago
3. "Low stock alert" — 1 hour ago
4. "New review received" — 3 hours ago

#### Top Products (Card)
5 item demo dengan rank badge (1–5), nama produk, harga, progress bar.  
Button: "View All Products"

#### Recent Orders Table (Card demo)

**Filter row** (form di atas tabel):
- Input: No., Order ID, Customer name (text filter per kolom)
- Select: Status (All / Pending / Processing / Delivered / Cancelled)
- Input: Date (date filter)
- Button: Search (fa-search, btn-primary-tw sm)
- Button: Clear (fa-times, btn-danger sm)

**Bulk Action Bar** (muncul jika ada row terselect):
- Button "Delete" (btn-danger sm)
- Button "Export Selected" (btn-success sm)

**Header Buttons**:
- Button "Export All" (btn-info sm, fa-download)

**Kolom Tabel**:
| # | Kolom | Tipe |
|---|-------|------|
| 1 | Checkbox | select individual (+ select-all di header) |
| 2 | No. | Nomor urut |
| 3 | Order ID | Text (badge) |
| 4 | Customer | Avatar img + nama |
| 5 | Product | Nama produk |
| 6 | Amount | Currency |
| 7 | Status | Badge berwarna (Pending=yellow, Processing=blue, Delivered=green, Cancelled=red) |
| 8 | Date | Tanggal |
| 9 | Actions | Dropdown: "View" (fa-eye) + "Edit" (fa-edit) |

**Pagination**: Previous, 1, 2, 3, Next

---

## 7. MODUL: ACCESS — USER

### 7.1 Routes Web

| Route Name | Method | Path | Middleware |
|-----------|--------|------|-----------|
| `admin.v1.access.user.index` | GET | `/admin/v1/access/user` | auth + Access |
| `admin.v1.access.user.create` | GET | `/admin/v1/access/user/create` | auth + Access |
| `admin.v1.access.user.store` | POST | `/admin/v1/access/user/store` | auth + Access + upload |
| `admin.v1.access.user.edit` | GET | `/admin/v1/access/user/:id/edit` | auth + Access |
| `admin.v1.access.user.update` | PUT | `/admin/v1/access/user/:id/update` | auth + Access + upload |
| `admin.v1.access.user.delete` | DELETE | `/admin/v1/access/user/:id/delete` | auth + Access |
| `admin.v1.access.user.delete_selected` | POST | `/admin/v1/access/user/delete_selected` | auth + Access |

> Method override: PUT/DELETE dikirim via POST dengan `?_method=PUT` atau `?_method=DELETE`

### 7.2 Routes API

| Method | Path |
|--------|------|
| GET | `/api/v1/access/user` |
| POST | `/api/v1/access/user/store` |
| GET | `/api/v1/access/user/:id` |
| PUT | `/api/v1/access/user/:id/update` |
| DELETE | `/api/v1/access/user/:id/delete` |
| POST | `/api/v1/access/user/delete_selected` |

### 7.3 Halaman Index User

**URL**: `GET /admin/v1/access/user`

#### Header
- Breadcrumb: Home → Access → User Management
- Judul halaman: "User Management"

#### Card
- Header: "User List"
- Tombol header card:
  - **Add Data** (btn-success, fa-plus) → `/admin/v1/access/user/create`
  - **Delete Selected** (btn-danger, fa-trash) → submit form `#selection`

#### Form Filter/Search (GET `#searchform`)

| Field | Tipe | Placeholder |
|-------|------|-------------|
| `q_page_size` | select | Pilihan: 10 / 20 / 50 / 100 |
| `q_code` | text | Filter by Code |
| `q_name` | text | Filter by Name |
| `q_phone` | text | Filter by Phone |
| `q_email` | text | Filter by Email |
| `q_status` | select | All / Active / Inactive |
| `q_role` | select | All / {daftar role dari DB} |

Tombol filter:
- **Search** (btn-success sm, fa-search)
- **Clear** (btn-danger sm, fa-times) → redirect ke index tanpa query param

#### Tabel

| # | Kolom | Isi |
|---|-------|-----|
| 1 | Checkbox | select individual + select-all di `<th>` |
| 2 | No. | Nomor urut |
| 3 | Code | Teks |
| 4 | Name | Teks |
| 5 | Phone | Teks |
| 6 | Email | Teks |
| 7 | Status | Icon ✓ (fa-check-circle, green) jika Active / ✕ (fa-times-circle, red) jika Inactive |
| 8 | Picture | `<img>` thumbnail 40×40, fallback icon jika null |
| 9 | Roles | Badge per role (badge-primary) |
| 10 | Action | Dropdown: **Edit** (fa-edit) → `/:id/edit` · divider · **Delete** (fa-trash, btn-danger, `data-confirm`) |

#### Bulk Delete Form
- Form id=`selection` POST ke `/admin/v1/access/user/delete_selected`
- Input tersembunyi `selected[]` diisi via JS saat checkbox dicentang

#### Pagination
- Previous · 1 · 2 · 3 · ... · Next
- Query param: `q_page`, `q_page_size`

---

### 7.4 Halaman Create User

**URL**: `GET /admin/v1/access/user/create`

#### Form `POST /admin/v1/access/user/store` (multipart/form-data)

| Field | Tipe | Validasi | Catatan |
|-------|------|---------|---------|
| `code` | text | required | Kode unik |
| `name` | text | required | — |
| `phone` | text | optional | — |
| `email` | email | required, valid email | — |
| `timezone` | select | optional | Populated dari list IANA timezones |
| `password` | password | required, min 8 | — |
| `password_confirmation` | password | required, harus sama dengan password | — |
| `status` | select | required | Active / Inactive |
| `picture` | file | optional, image only | Preview langsung via JS `previewImage()` |
| `blocked` | checkbox | optional | Jika dicentang, tampilkan `blocked_reason` |
| `blocked_reason` | text | optional | Hanya tampil jika `blocked` dicentang |
| `roles[]` | checkbox | optional (multiple) | List semua role dari DB |

- Inline validation errors: class `is-invalid` + `<div class="invalid-feedback">`
- **Button Save** (btn-primary-tw, fa-save)
- **Button Back** (btn-danger, fa-arrow-left) → index

---

### 7.5 Halaman Edit User

- Sama persis dengan Create, **perbedaan**:
  - Form `PUT /admin/v1/access/user/:id/update` (method override `?_method=PUT`)
  - Semua field **pre-filled** dengan nilai `data.*`
  - `picture`: tampilkan gambar existing, jika diganti maka preview baru
  - `roles[]`: checkbox yang sudah di-assign = `checked`
  - `blocked` + `blocked_reason`: pre-filled
  - Password boleh **kosong** (tidak diubah jika kosong)

---

### 7.6 Validator User

| Field | Aturan |
|-------|--------|
| `code` | required, string |
| `name` | required, string, max 50 |
| `phone` | optional, string, max 15 |
| `email` | required, valid email, max 255 |
| `timezone` | optional, string |
| `password` | required (create) / optional (edit), min 8 |
| `password_confirmation` | required jika password diisi, harus sama |
| `status` | required, in: ['Active','Inactive'] |
| `blocked` | optional, boolean |
| `blocked_reason` | optional, string, max 255 |
| `roles` | optional, array of string (UUID) |

---

## 8. MODUL: ACCESS — ROLE

### 8.1 Routes Web

| Route Name | Method | Path |
|-----------|--------|------|
| `admin.v1.access.role.index` | GET | `/admin/v1/access/role` |
| `admin.v1.access.role.create` | GET | `/admin/v1/access/role/create` |
| `admin.v1.access.role.store` | POST | `/admin/v1/access/role/store` |
| `admin.v1.access.role.edit` | GET | `/admin/v1/access/role/:id/edit` |
| `admin.v1.access.role.update` | PUT | `/admin/v1/access/role/:id/update` |
| `admin.v1.access.role.delete` | DELETE | `/admin/v1/access/role/:id/delete` |
| `admin.v1.access.role.delete_selected` | POST | `/admin/v1/access/role/delete_selected` |
| `admin.v1.access.role.permission` | GET | `/admin/v1/access/role/:id/permission` |
| `admin.v1.access.role.permission.assign` | GET | `/admin/v1/access/role/:id/permission/:permission_id/assign` |
| `admin.v1.access.role.permission.unassign` | GET | `/admin/v1/access/role/:id/permission/:permission_id/unassign` |
| `admin.v1.access.role.permission.assign_selected` | POST | `/admin/v1/access/role/:id/permission/assign_selected` |
| `admin.v1.access.role.permission.unassign_selected` | POST | `/admin/v1/access/role/:id/permission/unassign_selected` |

### 8.2 Routes API

| Method | Path |
|--------|------|
| GET | `/api/v1/access/role` |
| POST | `/api/v1/access/role/store` |
| GET | `/api/v1/access/role/:id` |
| PUT | `/api/v1/access/role/:id/update` |
| DELETE | `/api/v1/access/role/:id/delete` |
| POST | `/api/v1/access/role/delete_selected` |
| GET | `/api/v1/access/role/:id/permission` |
| POST | `/api/v1/access/role/:id/permission/assign_selected` |
| POST | `/api/v1/access/role/:id/permission/unassign_selected` |

### 8.3 Halaman Index Role

**Kolom Tabel**:

| # | Kolom | Isi |
|---|-------|-----|
| 1 | Checkbox | — |
| 2 | No. | Nomor urut |
| 3 | Name | Teks |
| 4 | Status | Icon ✓ / ✕ |
| 5 | Description | Teks |
| 6 | Action | Dropdown: **Permission** (fa-key, btn-info) → `/:id/permission` · **Edit** (fa-edit) · divider · **Delete** (fa-trash, danger) |

**Filter/Search**:
- `q_page_size`, `q_name` (text), `q_status` (select), `q_desc` (text)

**Header Card Buttons**:
- **Add Data** (btn-success)
- **Delete Selected** (btn-danger)

### 8.4 Halaman Create Role

**Form `POST /admin/v1/access/role/store`**:

| Field | Tipe | Validasi |
|-------|------|---------|
| `name` | text | required, unique |
| `desc` | text | optional |
| `status` | select | required, Active/Inactive |

### 8.5 Halaman Edit Role

- Sama dengan Create, pre-filled, form PUT

### 8.6 Halaman Permission Role (Assign/Unassign)

**URL**: `GET /admin/v1/access/role/:id/permission`

#### Header
- Judul: "Permission Management for Role: {role.name}"

#### Header Card Buttons
- **Assign Selected** (btn-info, fa-check) → POST `/:id/permission/assign_selected`
- **Unassign Selected** (btn-danger, fa-times) → POST `/:id/permission/unassign_selected`

#### Filter/Search
- `q_page_size`, `q_name` (text), `q_status` (select: Active/Inactive)

#### Tabel

| # | Kolom | Isi |
|---|-------|-----|
| 1 | Checkbox | — |
| 2 | No. | Nomor urut |
| 3 | Name | Nama permission |
| 4 | Status | ✓ (green, assigned) / ○ (abu-abu, unassigned) |
| 5 | Description | Teks |
| 6 | Action | Dropdown: **Assign** (fa-check, btn-info) → `assign` route · divider · **Unassign** (fa-times, btn-danger) → `unassign` route |

> Assign/Unassign single: via GET request (langsung proses, redirect kembali)  
> Assign/Unassign selected: via POST form dengan `selected[]`

---

## 9. MODUL: ACCESS — PERMISSION

### 9.1 Routes Web

| Route Name | Method | Path |
|-----------|--------|------|
| `admin.v1.access.permission.index` | GET | `/admin/v1/access/permission` |
| `admin.v1.access.permission.create` | GET | `/admin/v1/access/permission/create` |
| `admin.v1.access.permission.store` | POST | `/admin/v1/access/permission/store` |
| `admin.v1.access.permission.edit` | GET | `/admin/v1/access/permission/:id/edit` |
| `admin.v1.access.permission.update` | PUT | `/admin/v1/access/permission/:id/update` |
| `admin.v1.access.permission.delete` | DELETE | `/admin/v1/access/permission/:id/delete` |
| `admin.v1.access.permission.delete_selected` | POST | `/admin/v1/access/permission/delete_selected` |

### 9.2 Routes API

| Method | Path |
|--------|------|
| GET | `/api/v1/access/permission` |
| POST | `/api/v1/access/permission/store` |
| GET | `/api/v1/access/permission/:id` |
| PUT | `/api/v1/access/permission/:id/update` |
| DELETE | `/api/v1/access/permission/:id/delete` |
| POST | `/api/v1/access/permission/delete_selected` |

### 9.3 Halaman Index Permission

**Filter/Search**:
- `q_page_size`, `q_name` (text), `q_guard` (select: web/api), `q_method` (select: GET/POST/PUT/DELETE/PATCH), `q_status` (select), `q_desc` (text)

**Kolom Tabel**:

| # | Kolom | Isi |
|---|-------|-----|
| 1 | Checkbox | — |
| 2 | No. | Nomor urut |
| 3 | Name | Teks |
| 4 | Guard | Badge: `web` (badge-primary) / `api` (badge-info) |
| 5 | Method | Teks: GET/POST/PUT/DELETE/PATCH |
| 6 | Status | Icon ✓ / ✕ |
| 7 | Description | Teks |
| 8 | Action | Dropdown: **Edit** · divider · **Delete** |

### 9.4 Halaman Create Permission

**Form `POST /admin/v1/access/permission/store`**:

| Field | Tipe | Validasi |
|-------|------|---------|
| `name` | text | required |
| `guard_name` | select | required: `web` / `api` |
| `method` | text / select | required: GET/POST/PUT/DELETE/PATCH |
| `desc` | text | optional |
| `status` | select | required: Active/Inactive |

### 9.5 Halaman Edit Permission

- Sama dengan Create, pre-filled, form PUT

---

## 10. MODUL: PROFILE

### 10.1 Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/v1/profile` | Session |
| PUT | `/admin/v1/profile/update` | Session + upload |
| GET | `/api/v1/profile` | Bearer JWT |
| PUT | `/api/v1/profile/update` | Bearer JWT |

### 10.2 Halaman Profile

**URL**: `GET /admin/v1/profile`

**Form `PUT /admin/v1/profile/update`** (multipart):

| Field | Tipe | Validasi | Catatan |
|-------|------|---------|---------|
| `code` | text | required | — |
| `name` | text | required | — |
| `phone` | text | optional | — |
| `email` | email | required | — |
| `timezone` | select | optional | IANA timezones |
| `password` | password | optional, min 8 | Kosong = tidak diubah |
| `password_confirmation` | password | optional | Harus sama jika diisi |
| `status` | select | required | Active/Inactive |
| `picture` | file | optional, image only | Preview via `previewImage()` |

- **Tidak ada field** `blocked`, `blocked_reason`, `roles[]` (hanya admin yang bisa ubah itu)
- **Button Save** (btn-primary-tw, fa-save)
- Live picture preview saat file dipilih

---

## 11. MODUL: SETTING

### 11.1 Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/v1/setting` | Session + Access |
| GET | `/admin/v1/setting/fe-preview/:slug` | Session | (iframe preview FE template) |
| PUT | `/admin/v1/setting/update` | Session + Access + upload |
| GET | `/api/v1/setting` | Bearer JWT |
| PUT | `/api/v1/setting/update` | Bearer JWT |

### 11.2 Halaman Setting

**URL**: `GET /admin/v1/setting`  
**Form tunggal** `PUT /admin/v1/setting/update` (multipart) — 3 section dalam satu halaman

---

#### Section 1: Admin Theme Switcher

- Grid swatch (responsive 2–5 kolom)
- Setiap swatch berisi:
  - 4 strip warna: dark, primary, secondary, light (preview warna tema)
  - `<input type="radio" name="theme" value="{nama_tema}">` (tersembunyi)
  - Label nama tema
  - Ikon checkmark saat tema aktif
- Pilih tema → langsung update CSS variables di halaman (JS tanpa reload form)
- **Pilihan tema**: Blue, Purple, Green, Orange, Red (minimal; bisa lebih)
- Saat form di-submit, nilai `theme` terpilih ikut dikirim

---

#### Section 2: Frontend Template

- Input search `q_name` (text), filter kategori `q_category` (select, server-side)
- Button: **Search**, **Reset**
- Grid kartu template (2–4 kolom responsif):
  - Setiap kartu: thumbnail via `<iframe>` (lazy load via IntersectionObserver, scaled untuk fit)
  - Klik thumbnail → modal preview full-screen (iframe 92vw × 90vh)
  - Button **"PILIH"** / **"TERPILIH"** per kartu (toggle)
  - Pilihan disimpan di `localStorage` → dibawa saat submit via hidden input `fe_template`
- Pagination: windowed dengan ellipsis
- **Modal Preview**:
  - Iframe full-screen
  - Header + tombol "Tutup"
  - Tutup via: tombol, klik overlay, tekan ESC

---

#### Section 3: Company / App Info

| Field | Tipe | Catatan |
|-------|------|---------|
| `initial` | text | Inisial perusahaan (misal "NA") |
| `name` | text | Nama perusahaan/app |
| `description` | textarea (rich text) | class `trumbowyg-editor`, supports HTML |
| `icon` | file | Image, preview existing (90×90), preview baru saat ganti |
| `logo` | file | Image, preview existing (90×90) |
| `login_image` | file | Image, preview existing (90×90) |
| `phone` | text | — |
| `address` | text | — |
| `email` | email | — |
| `copyright` | text | Teks footer copyright |

- **Button Save** (btn-primary-tw, fa-save) — submit seluruh form (tema + template + info)

---

## 12. MODUL: MEDIA

### 12.1 Routes

| Route Name | Method | Path | Auth | Response |
|-----------|--------|------|------|---------|
| `admin.v1.media.list` | GET | `/admin/v1/media/list` | Session | JSON: daftar file |
| `admin.v1.media.upload` | POST | `/admin/v1/media/upload` | Session | JSON: `{url, name}` |
| `admin.v1.media.delete` | POST | `/admin/v1/media/delete` | Session | JSON: `{success}` |
| `admin.v1.media.file` | GET | `/admin/v1/media/file/*` | Session | 302 redirect ke presigned URL |

### 12.2 Perilaku

- **List**: kembalikan array file dari storage bucket (nama, url, ukuran, tipe)
- **Upload**: field `file` (multipart), simpan ke storage, **konversi ke WebP**, kembalikan URL
- **Delete**: body JSON `{key: "filename"}`, hapus dari storage
- **File proxy**: validasi nama file regex `/^[A-Za-z0-9._-]+$/`, redirect ke presigned URL (bucket private)
- Dipakai oleh Trumbowyg rich text editor sebagai file manager

---

## 13. MODUL: COMPONENTS (UI SHOWCASE)

### 13.1 Route

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/v1/components` | Session + Access |

### 13.2 Halaman Components

**URL**: `GET /admin/v1/components`  
Halaman showcase semua UI component yang tersedia:

#### Section 1: Stat Card + Counter
- 3 stat card (primary, green, purple)
- Animated counter: `data-target="{nilai}"`, animasi 0 → nilai dalam 1 detik

#### Section 2: Chart (Chart.js)
- Line Chart (primary color dari tema)
- Doughnut Chart

#### Section 3: Badge & Status
- Badge teks: `badge-primary`, `badge-success`, `badge-danger`, `badge-warning`, `badge-info`
- Status pills: green (Active), yellow (Pending), blue (Processing), red (Cancelled), grey (Inactive)
- Status icons: `fa-check-circle` (green), `fa-times-circle` (red)

#### Section 4: Alert / Flash
- `alert-success`, `alert-danger`, `alert-info`, `alert-warning`, `alert-primary`
- Setiap alert bisa di-dismiss (×)

#### Section 5: Button & Dropdown
- `btn-primary-tw`, `btn-success sm`, `btn-danger sm`, `btn-info sm`, `btn-warning sm`
- Dropdown action: Edit (fa-edit) + divider + Delete (fa-trash, danger)

#### Section 6: Popup Components
- **Modal**: `Modal.open({title: "Judul", body: "<p>Konten</p>"})` — via JS
- **Toast**: `Toast("Pesan sukses", "success")` | `Toast("Error!", "error")` | `Toast("Info", "info")`
- **Confirm Dialog**: `confirmDialog("Yakin hapus?")` → returns Promise<boolean>
- **`data-confirm` attribute**: pasang pada button/form submit → auto trigger confirmDialog sebelum aksi

#### Section 7: Form (CRUD)
- Text input (normal + disabled)
- Invalid input: class `is-invalid` + `<div class="invalid-feedback">Pesan error</div>`
- `<select>` standard
- Checkbox group (multiple)
- `<textarea>` standard
- File upload + preview (img 90×90)

#### Section 8: Rich Text Editor
- `<textarea class="trumbowyg-editor">`
- Trumbowyg toolbar: bold, italic, underline, strike, heading, quote, link, image
- Custom button: **Insert File** (buka file manager via `/admin/v1/media/list` + upload)

#### Section 9: Data Table + Pagination
- Contoh tabel standar: `table-bordered table-hover`
- Header card: "Add Data" button
- Baris aksi: dropdown per row
- Pagination standard

---

## 14. MODUL: HOME (PUBLIC FRONTEND)

### 14.1 Routes

| Method | Path |
|--------|------|
| GET | `/` |
| GET | `/home` |

### 14.2 Perilaku

- Render HTML dari template frontend yang dipilih di Setting (`setting.fe_template`)
- Template diambil dari storage atau cache
- Layout: `fe/default/main`

---

## 15. STANDAR TABEL (INDEX VIEW)

Setiap halaman index modul **harus** mengikuti standar ini:

### 15.1 Struktur Card

```
[Card Container]
  [Card Header]
    [Judul: "{Nama} List"]
    [Tombol: "Add Data" (btn-success, fa-plus)]
    [Tombol: "Delete Selected" (btn-danger, fa-trash)]
  [Card Body]
    [Form Filter (GET, id="searchform")]
      [q_page_size: select 10/20/50/100]
      [... filter per kolom ...]
      [Btn Search (btn-success sm, fa-search)]
      [Btn Clear (btn-danger sm, fa-times)]
    [Table]
      [thead: checkbox-all + header kolom]
      [tbody: row data]
        [td: checkbox individual]
        [td: No. urut]
        [td: ... data kolom ...]
        [td: Action dropdown]
    [Pagination]
```

### 15.2 Action Dropdown Per Row

```
[Dropdown btn-secondary sm, fa-ellipsis-v atau "Actions ▾"]
  [Edit]   ← fa-edit, link ke /:id/edit
  [divider]
  [Delete] ← fa-trash, btn-danger, data-confirm="Yakin hapus {nama}?"
```

> Tambahan item di tengah (sebelum divider) jika ada sub-halaman, misal "Permission" di Role.

### 15.3 Bulk Delete

```html
<form id="selection" method="POST" action="/admin/v1/.../delete_selected">
  <input type="hidden" name="_csrf" value="...">
  <!-- input selected[] diisi via JS -->
</form>
```

### 15.4 Pagination

```
[Previous] [1] [2] [3] [...] [N] [Next]
```

- Query param: `q_page` (default 1), `q_page_size` (default 10)
- Tampilkan info: "Showing {start}–{end} of {total} entries"

### 15.5 Status Icon Standard

| Status | Icon | Warna |
|--------|------|-------|
| Active | `fa-check-circle` | green / text-success |
| Inactive | `fa-times-circle` | red / text-danger |
| Assigned | ✓ (fa-check) | green |
| Unassigned | ○ (fa-circle, outline) | abu-abu |

---

## 16. STANDAR FORM (CREATE / EDIT VIEW)

### 16.1 Struktur

```
[Card Container]
  [Card Header: "{Nama} Form"]
  [Card Body]
    [Form POST/PUT multipart]
      [... field-field ...]
      [Validation Errors per field]
      [Button Row]
        [Save btn-primary-tw fa-save]
        [Back btn-danger fa-arrow-left → index]
```

### 16.2 Inline Validation Error

```html
<div class="mb-3">
  <label>Nama Field</label>
  <input class="form-control is-invalid" name="field" value="nilai">
  <div class="invalid-feedback">Pesan error dari server</div>
</div>
```

### 16.3 File Upload dengan Preview

```html
<input type="file" name="picture" accept="image/*" onchange="previewImage(this, '#preview-img')">
<img id="preview-img" src="{nilai_lama_atau_placeholder}" width="90" height="90" style="object-fit:cover">
```

### 16.4 Checkbox Toggle (untuk blocked/blocked_reason)

```js
document.querySelector('[name="blocked"]').addEventListener('change', function() {
  document.querySelector('#blocked_reason_wrapper').style.display = this.checked ? 'block' : 'none';
});
```

### 16.5 Method Override

- **PUT**: `<form method="POST" action="/...?_method=PUT">`
- **DELETE**: `<form method="POST" action="/...?_method=DELETE">`

---

## 17. UI COMPONENTS GLOBAL

### 17.1 Toast Notification

```js
Toast("Pesan sukses!", "success")  // hijau
Toast("Terjadi error!", "error")   // merah
Toast("Info penting", "info")      // biru
```

- Muncul di sudut kanan bawah / kanan atas
- Auto-dismiss setelah ~3 detik
- Flash message dari server otomatis dirender sebagai Toast di `main.ejs`

### 17.2 Modal Dialog

```js
Modal.open({
  title: "Judul Modal",
  body: "<p>Konten HTML bebas</p>"
})
```

- Backdrop overlay gelap
- Tombol close (×) di header
- Klik backdrop untuk tutup

### 17.3 Confirm Dialog

```js
// Via JS (async)
const ok = await confirmDialog("Yakin ingin menghapus data ini?")
if (ok) { /* lanjutkan */ }

// Via HTML attribute (auto-attach)
<button data-confirm="Yakin hapus?">Hapus</button>
<form data-confirm="Yakin submit?">...</form>
```

### 17.4 Counter Animation

```html
<span class="stat-counter" data-target="1234"></span>
```

- JS menjalankan animasi dari 0 → `data-target` dalam ~1 detik

### 17.5 Select All Checkbox

```js
$('#checkall').on('change', function() {
  $('input[name="selected[]"]').prop('checked', this.checked)
})
```

- Indeterminate state: jika ada yang terselect tapi tidak semua
- Header tombol "Delete Selected" muncul jika ≥1 terselect

### 17.6 previewImage

```js
function previewImage(input, targetSelector) {
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = e => document.querySelector(targetSelector).src = e.target.result
    reader.readAsDataURL(input.files[0])
  }
}
```

---

## 18. STANDAR API RESPONSE

Semua endpoint API harus menggunakan format `ResponseHandler` berikut:

### 18.1 Success Response

```json
{
  "status": "success",
  "message": "Pesan sukses",
  "data": { /* objek atau array */ }
}
```

**HTTP Status**: `200 OK` (get/update) atau `201 Created` (store)

### 18.2 Error Response

```json
{
  "status": "error",
  "message": "Pesan error",
  "data": null,
  "code": 400
}
```

**HTTP Status**: sesuai `code` (400, 401, 403, 404, 500)

### 18.3 Validation Error Response

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email harus valid" },
    { "field": "password", "message": "Password minimal 8 karakter" }
  ]
}
```

**HTTP Status**: `422 Unprocessable Entity`

### 18.4 Auth Error Response

```json
{ "status": "error", "message": "Unauthorized", "data": null, "code": 401 }
```

**HTTP Status**: `401 Unauthorized`

### 18.5 Login Success Response

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### 18.6 List/Pagination Response

```json
{
  "status": "success",
  "data": {
    "list": [ /* array item */ ],
    "total": 100,
    "page": 1,
    "page_size": 10,
    "total_pages": 10
  }
}
```

---

## 19. SEMUA API ENDPOINTS

### 19.1 Auth

| Method | Endpoint | Auth | Body / Params |
|--------|---------|------|---------------|
| POST | `/api/v1/auth/login` | Public | `{email, password}` |
| POST | `/api/v1/auth/logout` | Bearer | — |
| POST | `/api/v1/auth/register` | Public | `{name, email, password}` |
| POST | `/api/v1/auth/reset/request` | Public | `{email}` |
| POST | `/api/v1/auth/reset/process` | Public | `{email, otp, password, password_confirmation}` |

### 19.2 Dashboard

| Method | Endpoint | Auth |
|--------|---------|------|
| GET | `/api/v1/dashboard` | Bearer + Access |

Response: `{users: N, roles: N, permissions: N}`

### 19.3 Profile

| Method | Endpoint | Auth | Body |
|--------|---------|------|------|
| GET | `/api/v1/profile` | Bearer | — |
| PUT | `/api/v1/profile/update` | Bearer | multipart: code, name, phone, email, timezone, password, password_confirmation, status, picture |

### 19.4 User

| Method | Endpoint | Auth | Body / Params |
|--------|---------|------|---------------|
| GET | `/api/v1/access/user` | Bearer + Access | `?q_page=1&q_page_size=10&q_code=&q_name=&q_email=&q_phone=&q_status=&q_role=` |
| POST | `/api/v1/access/user/store` | Bearer + Access | multipart |
| GET | `/api/v1/access/user/:id` | Bearer + Access | — |
| PUT | `/api/v1/access/user/:id/update` | Bearer + Access | multipart |
| DELETE | `/api/v1/access/user/:id/delete` | Bearer + Access | — |
| POST | `/api/v1/access/user/delete_selected` | Bearer + Access | `{selected: ["id1","id2"]}` |

### 19.5 Role

| Method | Endpoint | Auth | Body / Params |
|--------|---------|------|---------------|
| GET | `/api/v1/access/role` | Bearer + Access | `?q_page=1&q_page_size=10&q_name=&q_status=&q_desc=` |
| POST | `/api/v1/access/role/store` | Bearer + Access | `{name, desc, status}` |
| GET | `/api/v1/access/role/:id` | Bearer + Access | — |
| PUT | `/api/v1/access/role/:id/update` | Bearer + Access | `{name, desc, status}` |
| DELETE | `/api/v1/access/role/:id/delete` | Bearer + Access | — |
| POST | `/api/v1/access/role/delete_selected` | Bearer + Access | `{selected: [...]}` |
| GET | `/api/v1/access/role/:id/permission` | Bearer + Access | `?q_page=1&q_page_size=10&q_name=&q_status=` |
| POST | `/api/v1/access/role/:id/permission/assign_selected` | Bearer + Access | `{selected: [...]}` |
| POST | `/api/v1/access/role/:id/permission/unassign_selected` | Bearer + Access | `{selected: [...]}` |

### 19.6 Permission

| Method | Endpoint | Auth | Body / Params |
|--------|---------|------|---------------|
| GET | `/api/v1/access/permission` | Bearer + Access | `?q_page=1&q_page_size=10&q_name=&q_guard=&q_method=&q_status=&q_desc=` |
| POST | `/api/v1/access/permission/store` | Bearer + Access | `{name, guard_name, method, desc, status}` |
| GET | `/api/v1/access/permission/:id` | Bearer + Access | — |
| PUT | `/api/v1/access/permission/:id/update` | Bearer + Access | `{name, guard_name, method, desc, status}` |
| DELETE | `/api/v1/access/permission/:id/delete` | Bearer + Access | — |
| POST | `/api/v1/access/permission/delete_selected` | Bearer + Access | `{selected: [...]}` |

### 19.7 Setting

| Method | Endpoint | Auth | Body |
|--------|---------|------|------|
| GET | `/api/v1/setting` | Bearer | — |
| PUT | `/api/v1/setting/update` | Bearer + Access | multipart: initial, name, description, icon, logo, login_image, phone, address, email, copyright, theme, fe_template |

---

## 20. TEMA (THEME SYSTEM)

### 20.1 Pilihan Tema

| Nama | Primary | Secondary | Light | Dark |
|------|---------|-----------|-------|------|
| Blue | `#3b82f6` | `#60a5fa` | `#eff6ff` | `#1e3a5f` |
| Purple | `#8b5cf6` | `#a78bfa` | `#f5f3ff` | `#2e1065` |
| Green | `#10b981` | `#34d399` | `#ecfdf5` | `#064e3b` |
| Orange | `#f97316` | `#fb923c` | `#fff7ed` | `#431407` |
| Red | `#ef4444` | `#f87171` | `#fef2f2` | `#450a0a` |

> Turunan boleh menambah tema lain, tapi **5 tema di atas wajib ada**.

### 20.2 Penerapan Tema

- CSS Variables ditetapkan di `<head>` berdasarkan `setting.theme`
- Tailwind `extend.colors` di-override lewat `tailwind.config` inline
- Class yang menggunakan tema: `bg-primary`, `text-primary`, `border-primary`, dll
- Sidebar: `bg-theme-dark`
- Button primary: `bg-primary hover:bg-secondary`
- Badge: `bg-primary text-white`

### 20.3 Theme Switcher (Setting Page)

- Preview warna langsung berubah tanpa reload saat swatch diklik
- Nilai tema tersimpan di database (`settings.theme`)

---

## 21. MIDDLEWARE & SECURITY

### 21.1 Daftar Middleware

| Middleware | Fungsi |
|-----------|--------|
| `ensureAuthenticated` | Cek session web, redirect ke `/auth/login` jika tidak ada |
| `ensureAuthenticatedApi` | Cek JWT Bearer, cek blacklist Redis, return 401 jika gagal |
| `AccessMiddleware` | Cek permission route berdasarkan role user (via `hasAccess(routeName, method)`) |
| `authLimiter` | Rate limit 5 req/15 menit per IP (login, register, reset request) |
| `otpLimiter` | Rate limit lebih ketat untuk endpoint OTP |
| `upload` | Multer memory storage untuk file upload |
| `csrfProtection` | CSRF token validation (web routes) |
| `methodOverride` | Izinkan `?_method=PUT|DELETE` di form HTML |

### 21.2 Access Control

- `hasAccess(routeName, httpMethod)` — cek apakah user punya permission
- Permission disimpan di tabel `permissions`, di-assign ke roles, user punya banyak roles
- **Superadmin**: jika user punya role dengan nama tertentu (misal "Admin"), lewati semua cek
- Sidebar: hanya tampilkan nav item yang `hasAccess()` = true

### 21.3 File Proxy Security

- Endpoint `/admin/v1/media/file/*` memvalidasi nama file: hanya huruf, angka, titik, underscore, dash
- Tidak ada path traversal
- Redirect ke presigned URL dari storage (bucket private)

### 21.4 Upload Security

- Validasi tipe file (image only untuk picture, icon, logo, login_image)
- Konversi ke WebP setelah upload
- Nama file disanitasi sebelum disimpan ke storage

---

## 22. FITUR GLOBAL CROSS-MODUL

### 22.1 Permission-aware Sidebar

- Setiap nav item di sidebar hanya tampil jika user punya akses ke route tersebut
- Cek menggunakan `hasAccess(routeName, 'GET')`

### 22.2 Breadcrumb

- Setiap halaman punya breadcrumb: Home → {Modul} → {Sub} → {Aksi}

### 22.3 Flash Messages → Toast

- Setelah redirect (store/update/delete), server set flash: `{type: 'success'|'error', message: '...'}`
- Layout `main.ejs` membaca flash dan render sebagai `Toast()` otomatis

### 22.4 CSRF Protection

- Semua form web punya `<input type="hidden" name="_csrf" value="...">`
- AJAX: header `X-CSRF-Token` dari `<meta name="csrf-token">`

### 22.5 Pagination Standard

- Query params: `q_page`, `q_page_size`
- Default: page=1, page_size=10
- Render: Previous · 1 · 2 · ... · N · Next
- Info teks: "Showing {start}–{end} of {total} entries"

### 22.6 Select All + Bulk Delete

- Pattern ada di **semua** halaman index
- `<input id="checkall">` di header tabel → toggle semua `<input name="selected[]">`
- Bulk delete form `id="selection"` POST ke `.../delete_selected`

### 22.7 Image Upload Pattern

- Input file → multer memory → validasi type → konversi ke WebP → upload ke storage
- Helper `getFile(path)` di view → panggil `/admin/v1/media/file/{path}` → presigned URL

### 22.8 Trumbowyg Rich Text Editor

- Semua textarea dengan class `trumbowyg-editor` otomatis diinisiasi Trumbowyg
- Tombol custom "File Manager": buka dialog list file dari storage, pilih → insert ke editor
- Mendukung: bold, italic, underline, strike, heading, blockquote, unordered list, ordered list, link, image, file

### 22.9 Datetime Display

- Timezone: user masing-masing punya `timezone` field; display timestamp menggunakan timezone user
- Format datetime: "Thursday, 26 June 2026 — 13:24" (lokalisasi via JS)

---

## LAMPIRAN: RINGKASAN CHECKLIST PER APP TURUNAN

Gunakan tabel ini untuk cek cepat kepatuhan app turunan:

### A. Database

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Tabel `users` + semua kolom | | | | |
| Tabel `roles` + semua kolom | | | | |
| Tabel `permissions` + semua kolom | | | | |
| Pivot `roles_permissions` | | | | |
| Pivot `users_roles` | | | | |
| Tabel `settings` (singleton) | | | | |
| Semua index | | | | |

### B. Auth

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Login (email, password, remember) | | | | |
| Register | | | | |
| Forgot password (kirim OTP email) | | | | |
| Reset password (OTP + new password) | | | | |
| Logout (web + api) | | | | |
| Rate limiting auth | | | | |
| JWT API + blacklist Redis | | | | |
| Session web | | | | |

### C. Layout

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Sidebar dengan permission-aware nav | | | | |
| Topbar dengan user dropdown | | | | |
| Full-width layout (login/register) | | | | |
| Theme CSS variables | | | | |
| Flash → Toast otomatis | | | | |
| CSRF protection | | | | |
| Favicon dari setting.icon | | | | |

### D. Dashboard

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| 4 stat cards + counter animasi | | | | |
| Line chart (Sales) + filter | | | | |
| Doughnut chart (Traffic) | | | | |
| Recent Activities | | | | |
| Top Products | | | | |
| Recent Orders table + pagination | | | | |
| Bulk actions (Delete + Export) | | | | |

### E. User Management

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Index + semua filter (code/name/phone/email/status/role) | | | | |
| Create (semua field termasuk picture, roles, blocked) | | | | |
| Edit (pre-filled, password optional) | | | | |
| Delete single + bulk | | | | |
| Status icon ✓/✕ | | | | |
| Picture preview | | | | |
| Roles badge | | | | |

### F. Role Management

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Index + filter | | | | |
| Create / Edit / Delete | | | | |
| Assign/Unassign permission (single) | | | | |
| Assign/Unassign permission (bulk) | | | | |
| Permission page dengan status indicator | | | | |

### G. Permission Management

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Index + filter (name/guard/method/status) | | | | |
| Create (name, guard_name, method, desc, status) | | | | |
| Edit / Delete | | | | |
| Guard badge (web/api) | | | | |

### H. Profile

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Lihat profil sendiri | | | | |
| Update (semua field kecuali blocked/roles) | | | | |
| Ganti picture + preview | | | | |
| Password opsional (kosong = tidak ubah) | | | | |

### I. Setting

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Theme switcher (5 tema) | | | | |
| Frontend template katalog | | | | |
| Template preview iframe + modal | | | | |
| Form company info (semua field) | | | | |
| File upload icon/logo/login_image | | | | |
| Description rich text | | | | |

### J. Media

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Upload file → WebP konversi | | | | |
| List file | | | | |
| Delete file | | | | |
| File proxy (presigned URL) | | | | |
| Integrasi dengan rich text editor | | | | |

### K. Components Showcase

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Halaman `/components` ada | | | | |
| Semua 9 section tercakup | | | | |

### L. API

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Response format standard (status/message/data) | | | | |
| Validation error format (errors array) | | | | |
| Pagination format (list/total/page/page_size) | | | | |
| Auth: login return access_token + token_type + expires_in | | | | |
| Semua endpoint tersedia (lihat Bagian 19) | | | | |

### M. Fitur Global

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Toast notification (success/error/info) | | | | |
| Modal dialog | | | | |
| Confirm dialog + data-confirm attribute | | | | |
| Select all + bulk delete (semua index page) | | | | |
| Pagination (q_page + q_page_size) | | | | |
| Inline validation error (is-invalid + invalid-feedback) | | | | |
| Method override (PUT/DELETE via POST) | | | | |
| Counter animasi stat card | | | | |
| previewImage file upload | | | | |
| Rich text editor (Trumbowyg) | | | | |

---

*Dokumen ini dibuat dari audit codebase NodeAdmin pada 2026-06-26.*  
*Update dokumen ini jika ada fitur baru di NodeAdmin.*

---


## 23. STANDAR CSS, KELAS, DAN ICON LENGKAP (PER FILE)

> Semua class dan icon di bagian ini **diverifikasi langsung dari file `src/`** — bukan asumsi.
> App turunan wajib menggunakan class dan icon yang identik agar tampilan 1:1.

---

### 23.1 Dependencies Wajib (`head.ejs`)

| Library | Versi / Source | Cara Load |
|---------|---------------|-----------|
| **Tailwind CSS** | CDN (latest play) | `<script src="https://cdn.tailwindcss.com">` + config inline |
| **Font Awesome** | lokal (`/be/default/vendor/fontawesome-free/css/all.min.css`) | `<link>` |
| **Bootstrap Icons** | CDN jsdelivr 1.11.3 | `<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">` |
| **Chart.js** | CDN jsdelivr latest | `<script src="https://cdn.jsdelivr.net/npm/chart.js">` |
| **jQuery** | CDN Google 3.5.1 | `<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js">` |
| **DevExtreme** | CDN 23.2.3 (CSS + JS) | dx.light.css + dx.material.blue.light.css + dx.all.js |
| **Trumbowyg** | CDN 2.21.0 | JS + CSS + plugin lokal `/be/default/vendor/trumbowyg/filemanager.js` |
| **Select2** | CDN 4.0.3 | JS + CSS |

> **Urutan load**: Tailwind → FA → BI → Chart.js → jQuery → DevExtreme → Trumbowyg → Select2

---

### 23.2 CSS Variables (`:root` di `head.ejs`)

```css
:root {
  --primary:     /* hex dari tema aktif, contoh: #3b82f6 */
  --secondary:   /* hex */
  --theme-light: /* hex */
  --theme-dark:  /* hex */
}
body {
  background: linear-gradient(135deg, var(--theme-light) 0%, #f8fafc 100%);
}
```

Tailwind config inline (tepat setelah load Tailwind CDN):
```js
tailwind.config = {
  theme: { extend: { colors: {
    primary:       '<%= theme.primary %>',
    secondary:     '<%= theme.secondary %>',
    'theme-light': '<%= theme.light %>',
    'theme-dark':  '<%= theme.dark %>'
  }}}
}
```

---

### 23.3 `@layer components` — Semua Class Custom (`head.ejs`)

#### Form

| Class | Definisi Tailwind |
|-------|-------------------|
| `.form-control` | `block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent` |
| `.form-control:focus` | `--tw-ring-color: var(--primary)` |
| `.form-control.is-invalid` | `border-red-500 focus:ring-red-400` |
| `select.form-control` | `+ bg-white` |
| `textarea.form-control` | `+ min-h-[90px]` |
| `.form-label` | `block mb-1 text-sm text-gray-700` |
| `.form-check-input` | `w-4 h-4 rounded border-gray-300 align-middle` + `accent-color: var(--primary)` |
| `.form-check-label` | `ml-1 text-sm text-gray-700` |
| `.invalid-feedback` | `block mt-1 text-sm text-red-600` |

#### Buttons

| Class | Definisi |
|-------|----------|
| `.btn` | `inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors border-0 no-underline` |
| `.btn-sm` | `px-3 py-1.5 text-xs` |
| `.btn-primary`, `.btn-primary-tw` | `background: var(--primary); color: white` |
| `.btn-primary:hover`, `.btn-primary-tw:hover` | `background: var(--theme-dark); color: white` |
| `.btn-success` | `bg-green-600 text-white hover:bg-green-700` |
| `.btn-danger` | `bg-red-600 text-white hover:bg-red-700` |
| `.btn-group` | `relative inline-flex gap-2` |

> ⚠️ **`btn-info` tidak didefinisikan di @layer** — dipakai di role/permission.ejs (Assign Selected). App turunan harus mendefinisikan class ini (misal: `bg-blue-500 text-white hover:bg-blue-600`).
>
> ⚠️ **`btn-outline-dark` tidak didefinisikan di @layer** — dipakai di setting FE template (btn PILIH). Definisikan sebagai `border border-gray-800 text-gray-800 hover:bg-gray-100`.

#### Tables

| Class | Definisi |
|-------|----------|
| `.table` | `w-full text-sm text-gray-700` |
| `.table thead tr:first-child` | `bg-gray-50` |
| `.table thead th` | `py-3 px-4 text-left font-medium text-gray-600 border-b border-gray-200` |
| `.table tbody td` | `py-3 px-4 align-middle border-b border-gray-100` |
| `.table tbody tr:hover` | `bg-gray-50 transition-colors` |
| `.table-bordered`, `.table-hover` | no-op (class ada di markup, tapi tidak ada style tambahan) |

#### Alerts

| Class | Definisi |
|-------|----------|
| `.alert` | `rounded-lg px-4 py-3 mb-4 text-sm border` |
| `.alert-danger` | `bg-red-50 text-red-700 border-red-200` |
| `.alert-success` | `bg-green-50 text-green-700 border-green-200` |
| `.alert-info` | `bg-blue-50 text-blue-700 border-blue-200` |
| `.alert-warning` | `bg-yellow-50 text-yellow-800 border-yellow-200` |
| `.alert-primary` | `background: var(--theme-light); color: var(--theme-dark); border-color: var(--primary)` |

#### Badges & Pagination

| Class | Definisi |
|-------|----------|
| `.badge` | `inline-flex items-center px-2 py-1 rounded text-xs font-medium leading-none` |
| `.text-bg-primary` | `background: var(--primary); color: white` |
| `.pagination` | `inline-flex items-center gap-1` |
| `.page-item` | `list-none` |
| `.page-link` | `inline-block px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 no-underline hover:bg-gray-50` |
| `.page-item.active .page-link` | `background: var(--primary); color: white; border-color: transparent` |
| `.page-item.disabled .page-link` | (hanya dipakai di setting pagination ellipsis) |

#### Dropdown

| Class | Definisi |
|-------|----------|
| `.dropdown` | `relative inline-block` |
| `.dropdown-toggle` | `gap-1.5` + caret pseudo-element `::after` (border kanan+bawah rotasi 45°) |
| `.dropdown-toggle[aria-expanded="true"]::after` | rotasi -135° |
| `.dropdown-menu` | `absolute right-0 top-full mt-2 min-w-[11rem] bg-white rounded-xl border border-gray-100 py-1.5 z-50` + shadow + animasi opacity/transform |
| `.dropdown-menu.show` | `opacity:1; visibility:visible; transform:translateY(0) scale(1); pointer-events:auto` |
| `.dropdown-item` | `flex items-center gap-2 mx-1.5 px-3 py-2 text-sm text-gray-700 rounded-lg no-underline cursor-pointer transition-colors` |
| `.dropdown-item:hover` | `background: var(--theme-light); color: var(--theme-dark)` |
| `.dropdown-item.danger:hover` | `bg-red-50 text-red-600` |
| `.dropdown-divider` | `my-1 border-t border-gray-100` |

#### Modal & Toast (di luar @layer, vanilla CSS)

| Class | Definisi |
|-------|----------|
| `.modal-overlay` | `position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:60; display:flex; align-items:center; justify-content:center; padding:1rem; opacity:0; visibility:hidden; transition:...` |
| `.modal-overlay.show` | `opacity:1; visibility:visible` |
| `.modal-box` | `background:#fff; border-radius:1rem; width:100%; max-width:28rem; box-shadow:...; transform:translateY(8px) scale(.97); transition:...` |
| `.modal-overlay.show .modal-box` | `transform:translateY(0) scale(1)` |
| `.modal-header` | `padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; font-weight:700; color:var(--theme-dark); display:flex; align-items:center; justify-content:space-between` |
| `.modal-body` | `padding:1.25rem; color:#374151` |
| `.modal-footer` | `padding:1rem 1.25rem; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:.5rem` |
| `.modal-close` | `cursor:pointer; color:#9ca3af; background:none; border:0; font-size:1.1rem` |
| `.toast-container` | `position:fixed; top:1rem; right:1rem; z-index:70; display:flex; flex-direction:column; gap:.5rem` |
| `.toast` | `min-width:16rem; max-width:22rem; background:#fff; border-radius:.75rem; padding:.75rem 1rem; box-shadow:...; border-left:4px solid var(--primary); display:flex; align-items:center; gap:.6rem; font-size:.9rem; transform:translateX(120%); transition:...; opacity:0` |
| `.toast.show` | `transform:translateX(0); opacity:1` |
| `.toast.success` | `border-left-color:#16a34a` |
| `.toast.error` | `border-left-color:#dc2626` |
| `.toast.info` | `border-left-color:var(--primary)` |

#### Custom Utility Classes (di luar @layer)

| Class | Definisi |
|-------|----------|
| `.tw-card` | `bg-white rounded-2xl` + `box-shadow: 0 10px 25px -5px rgba(0,0,0,.08), 0 8px 10px -6px rgba(0,0,0,.05)` |
| `.glass-effect` | `background:rgba(255,255,255,.1); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.2)` |
| `.sidebar-gradient` | `background: var(--theme-dark)` |
| `.nav-link-tw` | `color:rgba(255,255,255,.85); transition:background .15s ease, color .15s ease` |
| `.nav-link-tw:hover` | `background:rgba(255,255,255,.12); color:#fff` |
| `.nav-link-tw.active` | `background:var(--primary); color:#fff; box-shadow:0 4px 12px rgba(0,0,0,.25)` |
| `.text-primary-tw` | `color:var(--primary) !important` |
| `.bg-primary-tw` | `background:var(--primary) !important` |

> ⚠️ **`hover-scale`** — dipakai di stat card tapi TIDAK didefinisikan di head.ejs @layer. App turunan harus mendefinisikan sendiri (misal: `transition-transform hover:scale-105`).

#### Bootstrap Shim Utilities (wajib ada)

```
.row             → display:flex; flex-wrap:wrap
.d-flex          → display:flex
.d-block         → display:block
.d-none          → display:none
.align-items-center → align-items:center
.justify-content-center  → justify-content:center
.justify-content-between → justify-content:space-between
.justify-content-end     → justify-content:flex-end
.fw-semibold     → font-weight:600
.fw-bold         → font-weight:700
.w-100           → width:100%
.mx-auto         → margin-left:auto; margin-right:auto
.me-1            → margin-right:.25rem
.me-2            → margin-right:.5rem
.ms-2            → margin-left:.5rem
.ps-3            → padding-left:1rem
.align-middle    → vertical-align:middle
.sr-only         → position:absolute; width:1px; height:1px; ... (visually hidden)
```

> ⚠️ **Class tanpa definisi eksplisit** yang dipakai di markup (harus ada fallback atau disisipkan):
> - `.small` — dipakai di auth pages (teks kecil footer). Di Tailwind murni = tidak ada. Buat shim: `font-size:.875em`
> - `.text-muted` — dipakai di preview placeholder. Buat shim: `color:#6c757d`
> - `.text-decoration-none` — dipakai di auth links. Buat shim: `text-decoration:none`
> - `.mb-0` — dipakai di alert error list. Buat shim: `margin-bottom:0`

#### Select2 Custom CSS

```css
.select2-container--default .select2-selection--single {
  border: 1px solid #d2d6de;
  border-radius: .5rem !important;
  padding: 6px 12px;
  height: 40px !important;
}
.select2-container--default .select2-selection--single .select2-selection__arrow {
  height: 26px;
  position: absolute;
  top: 6px !important;
  right: 1px;
}
```

---

### 23.4 Layout Shell

#### `sidebar.ejs` — Class Per Elemen (diverifikasi dari file)

| Elemen | Class / Atribut Lengkap |
|--------|------------------------|
| `<aside id="tw-sidebar">` | `sidebar-gradient text-white w-64 min-h-screen fixed top-0 left-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300 flex flex-col` |
| Brand `<a>` | `flex items-center gap-3 px-6 py-5 border-b border-white/10` |
| Logo wrapper `<div>` | `w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden shrink-0` |
| Logo `<img>` | `w-full h-full object-contain p-1` |
| Logo fallback icon | `fas fa-chart-line text-xl` |
| App name `<span>` | `text-lg font-bold truncate` |
| `<nav>` | `flex-1 overflow-y-auto px-3 py-4 space-y-1` |
| Section header `<p>` | `px-4 pt-5 pb-2 text-xs uppercase tracking-wider text-white/70 font-bold` |
| Nav link `<a>` | `nav-link-tw flex items-center gap-3 px-4 py-3 rounded-lg font-medium` + `.active` jika halaman aktif |
| Nav icon `<i>` | `w-5 text-center` (+ icon class, lihat tabel bawah) |
| Copyright `<div>` | `px-6 py-4 text-xs text-white/40 border-t border-white/10` |
| Mobile overlay `<div id="tw-sidebar-overlay">` | `fixed inset-0 bg-black/40 z-30 hidden md:hidden` |

#### `sidebar.ejs` — Icon Per Nav Item

| Nav Item | Class Icon | Kondisi Tampil |
|----------|-----------|----------------|
| Dashboard | `fas fa-tachometer-alt w-5 text-center` | Selalu |
| UI Components | `fas fa-cubes w-5 text-center` | `hasAccess('admin.v1.components.index','GET')` |
| *(section header)* | — | Minimal 1 dari 4 item maintenance |
| Permission | `fas fa-key w-5 text-center` | `hasAccess('admin.v1.access.permission.index','GET')` |
| Role | `fas fa-user-shield w-5 text-center` | `hasAccess('admin.v1.access.role.index','GET')` |
| User | `fas fa-users w-5 text-center` | `hasAccess('admin.v1.access.user.index','GET')` |
| Setting | `fas fa-cog w-5 text-center` | `hasAccess('admin.v1.setting.index','GET')` |

---

#### `topbar.ejs` — Class Per Elemen (diverifikasi dari file)

| Elemen | Class / Atribut Lengkap |
|--------|------------------------|
| `<header>` | `tw-card !rounded-none md:!rounded-xl bg-white px-4 md:px-6 py-3 mb-6 flex items-center justify-between sticky top-0 z-20 shadow-sm` |
| Left group `<div>` | `flex items-center gap-3` |
| Hamburger `<button id="tw-sidebar-toggle">` | `md:hidden text-2xl text-primary-tw` aria-label="Menu" |
| Hamburger icon | `fas fa-bars` |
| Home `<a>` | `text-primary-tw text-xl` (href → dashboard) |
| Home icon | `fas fa-home` |
| Dropdown wrapper `<div>` | `dropdown` |
| User trigger `<a>` | `flex items-center gap-2 no-underline cursor-pointer` href="#" `data-toggle-dd` |
| Welcome `<span>` | `hidden lg:inline text-gray-500` teks "Welcome, {auth.name}" |
| Avatar `<img>` | `rounded-full` style=`width:38px;height:38px;object-fit:cover` |
| Avatar fallback `<span>` | `w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500` |
| Avatar fallback icon | `fas fa-user` |
| Gear icon | `bi bi-gear` style=`color:var(--primary)` |
| Dropdown menu | `dropdown-menu` |
| Profile item `<a>` | `dropdown-item` href → profile | icon `fas fa-user fa-fw` |
| Divider | `dropdown-divider` |
| Logout item `<a>` | `dropdown-item` onclick → form submit | icon `fas fa-sign-out-alt fa-fw` |
| Logout form | `id="logout-form"` method="POST" action → logout route, `style="display:none"` |

---

#### `main.ejs` — Class Per Elemen

| Elemen | Class |
|--------|-------|
| `<body id="page-top">` | `min-h-screen` |
| Content wrapper `<div>` | `md:ml-64 min-h-screen flex flex-col` |
| Topbar wrapper `<div>` | `px-4 md:px-6 pt-4` |
| `<main>` | `flex-1 px-4 md:px-6 pb-10` |
| Toast container (di foot.ejs) | `<div class="toast-container" id="tw-toasts">` |
| Modal overlay (di foot.ejs) | `<div class="modal-overlay" id="tw-modal">` |
| Modal box | `<div class="modal-box">` |
| Modal header | `<div class="modal-header">` |
| Modal close btn | `<button type="button" class="modal-close" data-modal-close>&times;</button>` |
| Modal body | `<div class="modal-body" id="tw-modal-body">` |
| Modal footer | `<div class="modal-footer" id="tw-modal-footer">` |

#### `full-width.ejs` — Body

```html
<body class="min-h-screen flex items-center justify-center p-4">
```

---

### 23.5 Auth Pages

> Semua halaman auth memakai layout `full-width.ejs` (tanpa sidebar).

#### Container & Panel Bersama (login, register, reset_req, reset_proc)

| Elemen | Class / Style |
|--------|--------------|
| Outer card | `w-full max-w-5xl tw-card overflow-hidden grid md:grid-cols-2` |
| Left panel | `hidden md:flex sidebar-gradient items-center justify-center p-10` |
| Login image `<img>` | `max-w-full max-h-80 object-contain` src=`getFile('/modules/setting/login-image.png')` |
| Right panel | `p-8 md:p-12 flex flex-col justify-center` |
| Logo wrapper `<div>` | `mb-8 text-center` |
| Logo `<img>` | `h-14 mx-auto object-contain` src=`getFile(setting.logo)` |
| Error list alert | `alert alert-danger` > `ul.mb-0.ps-3` > `li` (dari errorMessages array) |
| Flash error | `alert alert-danger` (dari getFlashMessage) |
| Flash success | `alert alert-success` |
| Title wrapper `<div>` | `mb-6` |
| Title `<h1>` | `text-2xl font-bold` style=`color:var(--primary)` |
| Subtitle `<p>` | `text-sm text-gray-500` |
| Field wrapper `<div>` | `mb-3` |
| Label | `form-label fw-semibold` |
| Input valid | `form-control` |
| Input invalid | `form-control is-invalid` |
| Error div | `invalid-feedback` |
| Submit `<button>` | `btn btn-primary-tw w-100 py-2 mb-3` |
| HR | `hr.my-4` |
| Bottom link section | `text-center small` |

#### `login.ejs` — Elemen Unik

| Elemen | Detail |
|--------|--------|
| H1 text | **"Hello, Welcome Back!"** |
| Subtitle | **"Enter your credentials to continue"** |
| Field `email` | `type="email"` name="email" placeholder="Email address" |
| Field `password` | `type="password"` name="password" placeholder="Password" |
| Submit text | **"Login"** |
| Remember row `<div>` | `d-flex justify-content-between small mb-3` |
| Remember checkbox | `form-check-input` id="remember" name="remember" |
| Remember label | `form-check-label` for="remember" teks "Keep me logged in" |
| Forgot link `<a>` | `text-primary-tw text-decoration-none` href → reset.req teks **"Forgot password"** |
| Bottom link `<a>` | `text-primary-tw text-decoration-none fw-semibold` href → register teks **"create here"** |
| Bottom static text | `text-gray-500` teks "Don't have an account? " |

#### `register.ejs` — Elemen Unik

| Elemen | Detail |
|--------|--------|
| H1 text | **"Create Account"** |
| Subtitle | **"Fill the form to register"** |
| Field `name` | text, `is-invalid` + `invalid-feedback` |
| Field `email` | email, `is-invalid` + `invalid-feedback` |
| Field `password` | password, `is-invalid` + `invalid-feedback` |
| Submit text | **"Create Account"** |
| *(tidak ada remember/forgot row)* | — |
| Bottom link `<a>` | `text-primary-tw text-decoration-none fw-semibold` href → login teks **"Already have an account?"** |

#### `reset_req.ejs` (Forgot Password) — Elemen Unik

| Elemen | Detail |
|--------|--------|
| H1 text | **"Forgot Password"** |
| Subtitle | **"Enter your Email to continue"** |
| Field `email` | email, `is-invalid` + `invalid-feedback` |
| Submit text | **"Send OTP"** |
| Back link `<a>` | `text-primary-tw text-decoration-none` href → login teks **"back?"** |
| *(tidak ada remember row)* | — |

#### `reset_proc.ejs` (Reset Password) — Elemen Unik

| Elemen | Detail |
|--------|--------|
| H1 text | **"Reset Password"** |
| Subtitle | **"Enter Your New Password"** |
| Field `email` | email, `is-invalid` + `invalid-feedback` |
| Field `otp` | `type="text"` name="otp", `getOld('otp')`, `is-invalid` + `invalid-feedback` |
| Field `password` | password, `is-invalid` + `invalid-feedback` |
| Field `password_confirmation` | password, `is-invalid` + `invalid-feedback` |
| Submit text | **"Reset Password"** |
| Back link `<a>` | `text-primary-tw text-decoration-none` href → login teks **"back?"** |

---

### 23.6 Dashboard (`dashboard/index.ejs`)

#### Page Header

| Elemen | Class |
|--------|-------|
| Header wrapper `<div>` | `flex items-center justify-between mb-2` |
| `<h1>` | `text-2xl font-bold text-gray-800` teks "Dashboard Overview" |
| Welcome `<p>` | `text-sm text-gray-600` |
| Date `<span>` | `text-sm text-gray-500` (dari `<%= now('YYYY-MM-DD HH:mm') %>`) |

#### Stat Cards

| Elemen | Class / Style |
|--------|--------------|
| Grid wrapper | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4` |
| Card 1 (primary) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale` style=`border-left:4px solid var(--primary)` |
| Card 2 (green) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale border-l-4 border-green-500` |
| Card 3 (yellow) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale border-l-4 border-yellow-500` |
| Card 4 (purple) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale border-l-4 border-purple-500` |
| Inner `<div>` | `flex items-center justify-between` |
| Stat label `<p>` | `text-gray-600 text-sm font-medium` |
| Counter `<p>` | `text-3xl font-bold text-gray-800 counter` + `data-target="{nilai}"` |
| Sub-label `<p>` | `text-gray-400 text-sm mt-1` |
| Icon wrapper Card 1 | `w-12 h-12 rounded-lg flex items-center justify-center` style=`background:var(--theme-light)` |
| Icon wrapper Card 2 | `w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center` |
| Icon wrapper Card 3 | `w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center` |
| Icon wrapper Card 4 | `w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center` |

| Card | Icon | Warna Icon |
|------|------|-----------|
| Total Users | `fas fa-users text-xl` | style=`color:var(--primary)` |
| Roles | `fas fa-user-shield text-green-600 text-xl` | — |
| Permissions | `fas fa-key text-yellow-600 text-xl` | — |
| Theme Aktif | `fas fa-palette text-purple-600 text-xl` | — |

> ⚠️ Card 4 (Theme Aktif): nilai adalah **text biasa** (nama tema), bukan angka — `<p class="text-2xl font-bold text-gray-800">` **tanpa class `counter`**.

#### Charts

| Elemen | Class |
|--------|-------|
| Grid wrapper | `grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8` |
| Chart card | `bg-white rounded-xl shadow-lg p-6` |
| Card header | `flex items-center justify-between mb-4` |
| Chart title `<h3>` | `text-lg font-semibold text-gray-800` |
| Sales filter `<select>` | `text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none` |
| "View All" `<button>` | `text-sm font-medium` style=`color:var(--primary)` |
| Canvas wrapper | `h-64` |

#### Recent Activities

| Elemen | Class / Icon |
|--------|-------------|
| Activities card | `bg-white rounded-xl shadow-lg p-6` |
| Title `<h3>` | `text-lg font-semibold text-gray-800 mb-4` |
| Items wrapper | `space-y-4` |
| Item 1 (primary) | `flex items-center gap-3 p-3 rounded-lg` style=`background:var(--theme-light)` |
| Item 1 icon wrapper | `w-8 h-8 rounded-full flex items-center justify-center` style=`background:var(--primary)` |
| Item 1 icon | `fas fa-user text-white text-xs` |
| Item 2 (green) | `flex items-center gap-3 p-3 bg-green-50 rounded-lg` |
| Item 2 icon wrapper | `w-8 h-8 bg-green-500 rounded-full flex items-center justify-center` |
| Item 2 icon | `fas fa-shopping-cart text-white text-xs` |
| Item 3 (yellow) | `flex items-center gap-3 p-3 bg-yellow-50 rounded-lg` |
| Item 3 icon wrapper | `w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center` |
| Item 3 icon | `fas fa-exclamation text-white text-xs` |
| Item 4 (purple) | `flex items-center gap-3 p-3 bg-purple-50 rounded-lg` |
| Item 4 icon wrapper | `w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center` |
| Item 4 icon | `fas fa-star text-white text-xs` |
| Content `<div>` | `flex-1` |
| Item title `<p>` | `text-sm font-medium text-gray-800` |
| Item subtitle `<p>` | `text-xs text-gray-500` |

#### Top Products

| Elemen | Class / Icon |
|--------|-------------|
| Card | `bg-white rounded-xl shadow-lg p-6` |
| Header | `flex items-center justify-between mb-6` |
| Title `<h3>` | `text-lg font-semibold text-gray-800` |
| Month badge | `text-sm px-3 py-1 rounded-full font-medium` style=`color:var(--primary);background:var(--theme-light)` |
| Products list | `space-y-3` |
| Product item | `flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all group` |
| Left section | `flex items-center w-4/5` |
| Icon relative wrapper | `relative flex-shrink-0 mr-3` |
| Icon box | `w-10 h-10 rounded-lg shadow-sm flex items-center justify-center` style=`background:{warna}` |
| Icon | `fas {icon} text-white text-sm` |
| Rank badge | `absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center` style=`background:{warna}` |
| Rank text | `text-white text-xs font-bold leading-none` |
| Product info | `flex-1 min-w-0` |
| Product name `<h4>` | `font-semibold text-gray-800` |
| Product category `<p>` | `text-sm text-gray-500` |
| Right section | `text-right w-1/5 pl-3` |
| Price `<p>` | `text-lg font-bold text-gray-800` |
| Delta up `<p>` | `text-sm flex items-center justify-end text-green-600` |
| Delta down `<p>` | `text-sm flex items-center justify-end text-red-600` |
| Delta up icon | `fas fa-arrow-up text-xs mr-1` |
| Delta down icon | `fas fa-arrow-down text-xs mr-1` |
| Footer | `mt-6 pt-4 border-t border-gray-100` |
| "View All" btn | `w-full text-center font-medium text-sm py-2 rounded-lg` style=`color:var(--primary)` |
| Arrow icon | `fas fa-arrow-right ml-2` |

#### Recent Orders Table

| Elemen | Class / Style |
|--------|--------------|
| Table card | `bg-white rounded-xl shadow-lg p-6` |
| Header | `flex items-center justify-between mb-4` |
| Title `<h3>` | `text-lg font-semibold text-gray-800` "Recent Orders" |
| Actions `<div>` | `flex items-center gap-2` |
| Bulk bar `<div id="bulkActions">` | `hidden items-center gap-2 mr-4` (ditampilkan via JS `style.display='flex'`) |
| Selected count `<span>` | `text-sm text-gray-600` |
| Delete bulk `<button>` | `bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium` icon `fas fa-trash mr-1` |
| Export Selected `<button>` | `bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium` icon `fas fa-file-export mr-1` |
| Export All `<button>` | `text-white px-4 py-2 rounded-lg text-sm font-medium` style=`background:var(--primary)` icon `fas fa-download mr-2` |
| Table wrapper | `overflow-x-auto` |
| Table `<table>` | `w-full` *(bukan `.table` class — dashboard pakai table Tailwind murni)* |
| Filter row `<tr>` | `bg-gray-50 border-b border-gray-200` |
| Filter inputs | `w-full text-xs border border-gray-300 rounded px-2 py-1` |
| Filter status `<select>` | `w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white` |
| Filter date `<input>` | `type="date" w-full text-xs border border-gray-300 rounded px-2 py-1` |
| Filter btn group | `flex space-x-1` |
| Search `<button>` | `text-white px-2 py-1 rounded text-xs` style=`background:var(--primary)` icon `fas fa-search` |
| Clear `<button>` | `bg-gray-500 text-white px-2 py-1 rounded text-xs` icon `fas fa-times` |
| Header row `<tr>` | `border-b border-gray-200` |
| Header `<th>` | `text-left py-3 px-4 font-medium text-gray-600` |
| Select-all `<th>` | `text-left py-3 px-4 w-10` + `input#selectAll type="checkbox" class="w-4 h-4 rounded"` |
| Data row `<tr>` | `border-b border-gray-100 hover:bg-gray-50 transition-colors` |
| Checkbox `<td>` | `py-3 px-4` + `input.row-checkbox.w-4.h-4.rounded` |
| No `<td>` | `py-3 px-4 text-gray-500 font-medium` |
| Other `<td>` | `py-3 px-4` |
| Amount `<td>` | `py-3 px-4 font-semibold` |
| Date `<td>` | `py-3 px-4 text-gray-600` |
| Customer cell | `flex items-center gap-2` + avatar `class="w-8 h-8 rounded-full"` |
| Status: Delivered | `px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm` |
| Status: Processing | `px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm` |
| Status: Shipped | `px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm` |
| Status: Cancelled | `px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm` |
| Eye action `<button>` | (tanpa class) style=`color:var(--primary)` icon `fas fa-eye` |
| Edit action `<button>` | `text-gray-600 hover:text-gray-800` icon `fas fa-edit` |
| Pagination wrapper | `flex items-center justify-between mt-4` |
| Info text | `text-sm text-gray-600` "Showing 1 to 3 of 100 results" |
| Pagination btns | `flex space-x-1` |
| Inactive btn | `px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50` |
| Active btn | `px-3 py-2 text-white rounded-lg text-sm` style=`background:var(--primary)` |

---

### 23.7 Pola CRUD Standar (berlaku untuk User, Role, Permission)

> Semua modul index + form mengikuti pola identik ini. Perbedaan hanya pada kolom/field.

#### Pola Index Page

```html
<!-- Page header -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-gray-800">{Nama} Management</h1>
</div>

<!-- Card wrapper -->
<div class="tw-card p-0 overflow-hidden">
  <!-- Card header -->
  <div class="px-6 py-4 border-b flex items-center justify-between">
    <h2 class="text-lg font-bold" style="color:var(--primary)">{Nama} List</h2>
    <div class="btn-group btn-sm">
      <a href="..." class="btn btn-success btn-sm"><i class="fas fa-fw fa-plus"></i> Add Data</a>
      <button type="submit" form="selection" formmethod="post" formaction="..."
              data-confirm="Confirm Delete"
              class="btn btn-danger btn-sm"><i class="fas fa-fw fa-times"></i> Delete Selected</button>
    </div>
  </div>

  <!-- Table area -->
  <div class="p-4" style="overflow-x:auto">
    <table class="table table-bordered table-hover align-middle">
      <thead>
        <form id="searchform">
          <!-- Filter row (TR 1): input filter per kolom -->
          <tr>
            <th width="2%"></th>
            <th width="7%"><select name="q_page_size" class="form-control">...</select></th>
            <!-- ... filter inputs class="form-control" ... -->
            <th width="5%" class="text-center align-middle">
              <div class="btn-group">
                <button type="submit" form="searchform" class="btn btn-sm btn-success">
                  <i class="fas fa-fw fa-search"></i>
                </button>
                <a href="..." class="btn btn-sm btn-danger"><i class="fas fa-fw fa-times"></i></a>
              </div>
            </th>
          </tr>
          <!-- Header row (TR 2): nama kolom -->
          <tr>
            <th width="5%"><input type="checkbox" id="checkall"/></th>
            <th width="5%">No</th>
            <!-- ... kolom header ... -->
            <th width="5%">Action</th>
          </tr>
        </form>
      </thead>
      <tbody>
        <form id="selection">
          <!-- Data rows -->
          <tr>
            <td><input name="selected[]" value="{id}" type="checkbox"/></td>
            <td>{nomor urut}</td>
            <!-- Status Active: -->
            <td class="text-left">
              <i class="fas fa-check-circle text-green-500 text-xl" title="Active"></i>
              <!-- atau: -->
              <i class="fas fa-times-circle text-red-500 text-xl" title="Inactive"></i>
            </td>
            <!-- Action cell: -->
            <td class="text-center">
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-primary dropdown-toggle"
                        data-toggle-dd aria-expanded="false">Action</button>
                <div class="dropdown-menu dropdown-menu-end">
                  <a href="..." class="dropdown-item"><i class="fas fa-pen fa-fw"></i> Edit</a>
                  <div class="dropdown-divider"></div>
                  <form method="post" action="...?_method=DELETE" class="m-0">
                    <button type="submit" data-confirm="Confirm Delete"
                            class="dropdown-item danger">
                      <i class="fas fa-trash fa-fw"></i> Delete
                    </button>
                  </form>
                </div>
              </div>
            </td>
          </tr>
        </form>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="d-flex justify-content-end mt-4">
      <nav>
        <ul class="pagination">
          <li class="page-item"><a class="page-link" href="...">Previous</a></li>
          <li class="page-item active"><a class="page-link" href="...">1</a></li>
          <li class="page-item"><a class="page-link" href="...">Next</a></li>
        </ul>
      </nav>
    </div>
  </div>
</div>

<script>
  $("#checkall").click(function(){ $('input:checkbox').not(this).prop('checked', this.checked); });
</script>
```

#### Pola Form Page (Create / Edit)

```html
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-gray-800">{Nama} Management</h1>
</div>

<div class="tw-card p-6">
  <h2 class="text-lg font-bold mb-4" style="color:var(--primary)">{Nama} Form</h2>
  <form method="POST" action="..." [enctype="multipart/form-data" jika ada file]>
    <!-- Field pattern: -->
    <div class="mb-3">
      <label for="{field}" class="form-label fw-semibold">{Label}</label>
      <input id="{field}" type="text"
             class="form-control [is-invalid jika error]"
             name="{field}" value="{nilai}">
      <!-- Jika ada error: -->
      <div class="invalid-feedback">{pesan error}</div>
    </div>

    <!-- Button row: -->
    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary-tw px-4 py-2">
        <i class="fas fa-save me-1"></i> Save
      </button>
      <a href="..." class="btn btn-danger px-4 py-2 text-white">Back</a>
    </div>
  </form>
</div>
```

---

### 23.8 Access — User

#### users/index.ejs — Tabel Lengkap

**Filter Row (TR 1) — th width:**

| `<th width>` | Filter Name | Tipe |
|-------------|-------------|------|
| `2%` | *(kosong)* | — |
| `7%` | `q_page_size` | select: 10/20/50/100 |
| `15%` | `q_code` | text |
| `20%` | `q_name` | text |
| `15%` | `q_phone` | text |
| `15%` | `q_email` | text |
| `10%` | `q_status` | select: `<option disabled selected>Select</option>` + Active / Inactive |
| *(kosong)* | *(tidak ada filter untuk Picture)* | — |
| `12%` | `q_role` | select: `<option disabled selected>Select</option>` + dynamic dari array `roles` (value=`role.id`) |
| `5%` | *(search/clear buttons)* | `class="text-center align-middle"` |

**Header Row (TR 2):**

| `<th width>` | Teks Header |
|-------------|-------------|
| `5%` | `<input type="checkbox" id="checkall"/>` |
| `5%` | No |
| `15%` | Code |
| `20%` | Name |
| `20%` | Phone |
| `15%` | Email |
| `15%` | Status |
| `15%` | Picture |
| `10%` | Roles |
| `5%` | Action |

**Data Row — Cell Rendering:**

| Kolom | Markup |
|-------|--------|
| checkbox | `<input name="selected[]" value="{id}" type="checkbox">` |
| No | `(i+1)+(page_size*(current_page-1))` |
| Code | plain text `data.code` |
| Name | plain text `data.name` |
| Phone | plain text `data.phone` |
| Email | plain text `data.email` |
| Status | `td class="text-left"` → icon Active/Inactive |
| Picture | `td class="text-center"` → `<img src="getFile(data.picture??'modules/access/user/user.png')" style="max-width:100px">` |
| Roles | `<span class="badge text-bg-primary">{role.name}</span>` per role, space-separated (via `data.roles.forEach`) |
| Action | `td class="text-center"` → dropdown |

**Action Dropdown User** (2 item, tidak ada Permission):
```html
<div class="dropdown-menu dropdown-menu-end">
  <a href="...edit..." class="dropdown-item"><i class="fas fa-pen fa-fw"></i> Edit</a>
  <div class="dropdown-divider"></div>
  <form method="post" action="...?_method=DELETE" class="m-0">
    <button type="submit" data-confirm="Confirm Delete" class="dropdown-item danger">
      <i class="fas fa-trash fa-fw"></i> Delete
    </button>
  </form>
</div>
```

#### users/create.ejs — Form Lengkap

Form: `method="POST"` `action="route('admin.v1.access.user.store')"` `enctype="multipart/form-data"`

| Urutan | Field | Label | Tipe | Class | Catatan |
|--------|-------|-------|------|-------|---------|
| 1 | `code` | Code | text | `form-control [is-invalid]` | value: `getOld('code')` |
| 2 | `name` | Name | text | `form-control [is-invalid]` | value: `getOld('name')` |
| 3 | `phone` | **Phone Number** | text | `form-control [is-invalid]` | value: `getOld('phone')` |
| 4 | `email` | Email | email | `form-control [is-invalid]` | value: `getOld('email')` |
| 5 | `timezone` | Timezone | select | `form-control [is-invalid]` | options: loop `timezones` array (string), selected: `getOld('timezone') === tz` |
| 6 | `password` | Password | password | `form-control [is-invalid]` | value: `""` (kosong) |
| 7 | `password_confirmation` | **Password Confirm** | password | `form-control [is-invalid]` | value: `""` |
| 8 | `status` | Status | select `required` | `form-control [is-invalid]` | options: Active / Inactive (tanpa `disabled selected`) |
| 9 | `picture` | Picture | file | `form-control [is-invalid]` | `onchange="previewImage(event)"` |
| 10 | `blocked` | Blocked | checkbox | `w-4 h-4` | value="1", label "Blokir akun" |
| 11 | `blocked_reason` | Blocked Reason | text | `form-control [is-invalid]` | div wrapper `id="div_blocked_reason"`, value: `""` |
| 12 | `roles[]` | Role | checkbox group | `w-4 h-4` | `id="roles{i}"` per item, `name="roles[]"`, value=`role.id` |

Picture preview create:
```html
<div class="preview mb-3" id="preview"><p class="text-muted">No image selected</p></div>
<input id="picture" type="file" class="form-control [is-invalid]" name="picture" onchange="previewImage(event)">
<!-- error pakai: -->
<div class="text-danger small mt-1">{msg}</div>
```

Blocked field create:
```html
<div class="mb-3">
  <label class="form-label fw-semibold d-block">Blocked</label>
  <div class="d-flex flex-wrap gap-3 p-2 rounded border">
    <label class="d-flex align-items-center gap-2">
      <input id="blocked" type="checkbox" name="blocked" value="1" class="w-4 h-4">
      <span>Blokir akun</span>
    </label>
  </div>
</div>
<div class="mb-3" id="div_blocked_reason">
  <label for="blocked_reason" class="form-label fw-semibold">Blocked Reason</label>
  <input id="blocked_reason" type="text" class="form-control [is-invalid]" name="blocked_reason" value="">
</div>
```

Roles field:
```html
<div class="mb-4">
  <label class="form-label fw-semibold d-block">Role</label>
  <div class="d-flex flex-wrap gap-3 p-2 rounded border [border-danger jika error]">
    <% let i = 0; %>
    <% roles.forEach(role => { %>
      <label class="d-flex align-items-center gap-2">
        <input id="roles<%= i %>" type="checkbox" name="roles[]" value="<%= role.id %>" class="w-4 h-4">
        <span><%= role.name %></span>
      </label>
    <% i++; }); %>
  </div>
</div>
```

**previewImage JS (FileReader — create & edit sama):**
```js
function previewImage(event) {
  const preview = document.getElementById('preview');
  preview.innerHTML = '';
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '160px';
      img.className = 'rounded border p-1';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '<p class="text-muted">No image selected</p>';
  }
}
```

**Blocked toggle JS:**
```js
$(document).ready(function(){
  $('#div_blocked_reason').toggle($('#blocked').is(':checked'));
  $('#blocked').click(function(){
    if(this.checked){ $('#div_blocked_reason').show(); }
    else { $('#blocked_reason').val(''); $('#div_blocked_reason').hide(); }
  });
});
```

#### users/edit.ejs — Perbedaan dari create

Form: `method="POST"` `action="route('admin.v1.access.user.update',{id})+'?_method=PUT'"` `enctype="multipart/form-data"`

| Field | Perbedaan |
|-------|-----------|
| `code` | value: `data.code` |
| `name` | value: `data.name` |
| `phone` | value: `data.phone` |
| `email` | value: `data.email` |
| `timezone` | selected: `data.timezone === tz` |
| `password` | value: `""` (sama — tidak auto-fill) |
| `password_confirmation` | value: `""` |
| `status` | selected: `data.status == 'Active'/'Inactive'` |
| Picture preview | `<img src="getFile(data.picture??'modules/access/user/user.png')" style="max-width:160px" class="rounded border p-1">` |
| `blocked` | tambah atribut `<%= (data.blocked) ? 'checked' : '' %>` |
| `blocked_reason` | value: `data.blocked_reason \|\| ''` |
| `roles[]` | checked: `data.roles.some(r => r.name === role.name)` |

---

### 23.9 Access — Role

#### roles/index.ejs — Tabel Lengkap

**Filter Row (TR 1):**

| `<th width>` | Filter Name | Tipe |
|-------------|-------------|------|
| `2%` | *(kosong)* | — |
| `7%` | `q_page_size` | select: 10/20/50/100 |
| `24%` | `q_name` | text |
| `12%` | `q_status` | select: `<option disabled selected>Select</option>` + Active / Inactive |
| `13%` | `q_desc` | text |
| `5%` | *(search/clear)* | `class="text-center align-middle"` |

**Header Row (TR 2):**

| `<th width>` | Teks |
|-------------|------|
| `5%` | checkall |
| `5%` | No |
| `24%` | Name |
| `15%` | Status |
| `13%` | Description |
| `5%` | Action |

**Data Row — Cell Rendering:**

| Kolom | Markup |
|-------|--------|
| Status | `td class="text-left"` → `fas fa-check-circle text-green-500 text-xl` / `fas fa-times-circle text-red-500 text-xl` |
| desc | plain text `data.desc` |

**Action Dropdown Role** (3 item — ada Permission):
```html
<div class="dropdown-menu dropdown-menu-end">
  <a href="...permission..." class="dropdown-item"><i class="fas fa-key fa-fw"></i> Permission</a>
  <a href="...edit..." class="dropdown-item"><i class="fas fa-pen fa-fw"></i> Edit</a>
  <div class="dropdown-divider"></div>
  <form method="post" action="...?_method=DELETE" class="m-0">
    <button type="submit" data-confirm="Confirm Delete" class="dropdown-item danger">
      <i class="fas fa-trash fa-fw"></i> Delete
    </button>
  </form>
</div>
```

#### roles/create.ejs — Field Lengkap

Form: `method="POST"` `action="route('admin.v1.access.role.store')"`

| Urutan | Field | Label | Tipe | Class | mb |
|--------|-------|-------|------|-------|----|
| 1 | `name` | Name | text | `form-control [is-invalid]` | `mb-3` |
| 2 | `desc` | Description | text | `form-control [is-invalid]` | `mb-3` |
| 3 | `status` | Status | select `required` | `form-control [is-invalid]` | `mb-4` |

Status options (create — tidak ada selected): `<option value="Active">Active</option>` / `<option value="Inactive">Inactive</option>`

#### roles/edit.ejs — Field Lengkap (URUTAN BEDA dari create!)

Form: `method="POST"` `action="route('admin.v1.access.role.update',{id})+'?_method=PUT'"`

| Urutan | Field | Label | Pre-filled |
|--------|-------|-------|-----------|
| 1 | `name` | Name | `data.name` |
| 2 | `status` | Status | `selected` per `data.status` |
| 3 | `desc` | Description | `data.desc` |

#### roles/permission.ejs — Tabel Lengkap

> Page h1: **"Permission Management"** — bukan "Role Permission" atau lainnya.
> Card header: **"Permission List"**

**Card Header Buttons:**
- `btn btn-info btn-sm` + `data-confirm="Confirm Assign"` + `form="selection"` + `formaction=route('...role.permission.assign_selected',{id:role.id})` → icon `fas fa-fw fa-check` teks **"Assign Selected"**
- `btn btn-danger btn-sm` + `data-confirm="Confirm Unassign"` → icon `fas fa-fw fa-times` teks **"Unassign Selected"**

**Filter Row (TR 1):**

| `<th width>` | Filter | Tipe |
|-------------|--------|------|
| `2%` | *(kosong)* | — |
| `7%` | `q_page_size` | select: 10/20/50/100 |
| `20%` | `q_name` | text |
| `10%` | `q_status` | select: `<option disabled selected>Select</option>` + Active / Inactive |
| `15%` | `q_desc` | text |
| `5%` | *(search/clear)* | `class="text-center align-middle"` |

> ⚠️ Filter `q_status` di sini menfilter status permission (Active/Inactive), BUKAN assigned status.

**Header Row (TR 2):**

| `<th width>` | Teks Header |
|-------------|-------------|
| `5%` | checkall |
| `5%` | No |
| `20%` | Name |
| `15%` | **Status** *(kolom ini = assigned/not-assigned, bukan Active/Inactive!)* |
| `10%` | Description |
| `5%` | Action |

**Data Row — Status Cell (kritis — BERBEDA dari index lain):**

```html
<td class="text-left">
  <% if (role.permissions.some(r => r.id === data.id)) { %>
    <i class="fas fa-check-circle text-green-500 text-xl" title="Assigned"></i>
  <% } else { %>
    <i class="fas fa-times-circle text-gray-300 text-xl" title="Not assigned"></i>
    <!-- ⚠️ text-gray-300 bukan text-red-500! -->
  <% } %>
</td>
```

**Action Dropdown Permission Page** (Assign + Unassign via `<a href>`, bukan form):
```html
<div class="dropdown-menu dropdown-menu-end">
  <a href="route('...role.permission.assign', {id:role.id, permission_id:data.id})"
     class="dropdown-item"><i class="fas fa-check fa-fw"></i> Assign</a>
  <div class="dropdown-divider"></div>
  <a href="route('...role.permission.unassign', {id:role.id, permission_id:data.id})"
     class="dropdown-item danger"><i class="fas fa-times fa-fw"></i> Unassign</a>
</div>
```

> ⚠️ Assign dan Unassign per-item menggunakan `<a href>` (GET navigation), BUKAN form POST.

---

### 23.10 Access — Permission

#### permission/index.ejs — Tabel Lengkap

**Filter Row (TR 1):**

| `<th width>` | Filter | Tipe |
|-------------|--------|------|
| `2%` | *(kosong)* | — |
| `7%` | `q_page_size` | select: 10/20/50/100 |
| `18%` | `q_name` | text |
| `9%` | `q_guard` | select: `<option disabled selected>Select</option>` + `web` / `api` |
| `15%` | `q_method` | select: `<option disabled selected>Select</option>` + GET / POST / PATCH / PUT / DELETE |
| `10%` | `q_status` | select: `<option disabled selected>Select</option>` + Active / Inactive |
| `15%` | `q_desc` | text |
| `5%` | *(search/clear)* | `class="text-center align-middle"` |

**Header Row (TR 2):**

| `<th width>` | Teks |
|-------------|------|
| `5%` | checkall |
| `5%` | No |
| `18%` | Name |
| `9%` | Guard |
| `15%` | Method |
| `15%` | Status |
| `10%` | Description |
| `5%` | Action |

**Data Row — Cell Rendering:**

| Kolom | Markup |
|-------|--------|
| Name | plain text `data.name` |
| Guard | `<span class="badge text-bg-primary">{data.guard_name}</span>` |
| Method | plain text `data.method` *(tidak ada badge)* |
| Status | `td class="text-left"` → icon Active/Inactive (merah, bukan abu) |
| Description | plain text `data.desc` |

#### permission/create.ejs — Form Lengkap

Form: `method="POST"` `action="route('admin.v1.access.permission.store')"`

| Urutan | Field | Label | Tipe | Class | Catatan |
|--------|-------|-------|------|-------|---------|
| 1 | `name` | Name | text | `form-control [is-invalid]` | value: `""` |
| 2 | `guard_name` | **Guard** | select | `form-control` *(tanpa is-invalid!)* | options: `web` / `api`; **tidak ada `getError` check** |
| 3 | `method` | Method | text | `form-control [is-invalid]` | value: `""` |
| 4 | `desc` | Description | text | `form-control [is-invalid]` | `mb-3` |
| 5 | `status` | Status | select `required` | `form-control [is-invalid]` | `mb-4`; options tanpa `disabled selected` |

> ⚠️ `guard_name` pada create: class hanya `form-control` — tidak ada `is-invalid` dan tidak ada `getError` block.
> Label field guard = **"Guard"** (bukan "Guard Name").

#### permission/edit.ejs — Form Lengkap (URUTAN BEDA dari create!)

Form: `method="POST"` `action="route('admin.v1.access.permission.update',{id})+'?_method=PUT'"`

| Urutan | Field | Label | Pre-filled | Catatan |
|--------|-------|-------|-----------|---------|
| 1 | `name` | Name | `data.name` | `is-invalid` |
| 2 | `guard_name` | **Guard** | `selected` per `data.guard_name` | select, tanpa `is-invalid` |
| 3 | `method` | Method | `data.method` | text, `is-invalid` |
| 4 | `status` | Status | `selected` per `data.status` | select `required`, `is-invalid` |
| 5 | `desc` | Description | `data.desc` | text, `mb-4`, `is-invalid` |

---

### 23.10B Route Naming Convention & Auto-Discover Permission

#### Konvensi Penamaan Route (Wajib 1:1)

Semua route mengikuti pola: **`{guard}.v{version}.{module}.{resource}.{action}`**

| Segmen | Nilai |
|--------|-------|
| `guard` | `admin` (web) atau `api` |
| `version` | `v1` |
| `module` | `access`, `setting`, `components`, dll |
| `resource` | `user`, `role`, `permission`, `setting`, dll |
| `action` | `index`, `create`, `store`, `edit`, `update`, `delete`, `delete_selected` |

Untuk sub-resource permission di role, tambah level:
`admin.v1.access.role.permission.{action}`

**Tabel route lengkap — Web (admin):**

| Route Name | Method | Path |
|-----------|--------|------|
| `admin.v1.access.user.index` | GET | `/admin/v1/access/user` |
| `admin.v1.access.user.create` | GET | `/admin/v1/access/user/create` |
| `admin.v1.access.user.store` | POST | `/admin/v1/access/user/store` |
| `admin.v1.access.user.edit` | GET | `/admin/v1/access/user/:id/edit` |
| `admin.v1.access.user.update` | PUT | `/admin/v1/access/user/:id/update` |
| `admin.v1.access.user.delete` | DELETE | `/admin/v1/access/user/:id/delete` |
| `admin.v1.access.user.delete_selected` | POST | `/admin/v1/access/user/delete_selected` |
| `admin.v1.access.permission.index` | GET | `/admin/v1/access/permission` |
| `admin.v1.access.permission.create` | GET | `/admin/v1/access/permission/create` |
| `admin.v1.access.permission.store` | POST | `/admin/v1/access/permission/store` |
| `admin.v1.access.permission.edit` | GET | `/admin/v1/access/permission/:id/edit` |
| `admin.v1.access.permission.update` | PUT | `/admin/v1/access/permission/:id/update` |
| `admin.v1.access.permission.delete` | DELETE | `/admin/v1/access/permission/:id/delete` |
| `admin.v1.access.permission.delete_selected` | POST | `/admin/v1/access/permission/delete_selected` |
| `admin.v1.access.role.index` | GET | `/admin/v1/access/role` |
| `admin.v1.access.role.create` | GET | `/admin/v1/access/role/create` |
| `admin.v1.access.role.store` | POST | `/admin/v1/access/role/store` |
| `admin.v1.access.role.edit` | GET | `/admin/v1/access/role/:id/edit` |
| `admin.v1.access.role.update` | PUT | `/admin/v1/access/role/:id/update` |
| `admin.v1.access.role.delete` | DELETE | `/admin/v1/access/role/:id/delete` |
| `admin.v1.access.role.delete_selected` | POST | `/admin/v1/access/role/delete_selected` |
| `admin.v1.access.role.permission` | GET | `/admin/v1/access/role/:id/permission` |
| `admin.v1.access.role.permission.assign` | GET | `/admin/v1/access/role/:id/permission/:permission_id/assign` |
| `admin.v1.access.role.permission.assign_selected` | POST | `/admin/v1/access/role/:id/permission/assign_selected` |
| `admin.v1.access.role.permission.unassign` | GET | `/admin/v1/access/role/:id/permission/:permission_id/unassign` |
| `admin.v1.access.role.permission.unassign_selected` | POST | `/admin/v1/access/role/:id/permission/unassign_selected` |

**Tabel route lengkap — API:**

| Route Name | Method | Path |
|-----------|--------|------|
| `api.v1.access.user.index` | GET | `/api/v1/access/user` |
| `api.v1.access.user.store` | POST | `/api/v1/access/user/store` |
| `api.v1.access.user.edit` | GET | `/api/v1/access/user/:id/edit` |
| `api.v1.access.user.update` | PUT | `/api/v1/access/user/:id/update` |
| `api.v1.access.user.delete` | DELETE | `/api/v1/access/user/:id/delete` |
| `api.v1.access.user.delete_selected` | POST | `/api/v1/access/user/delete_selected` |
| `api.v1.access.permission.index` | GET | `/api/v1/access/permission` |
| `api.v1.access.permission.store` | POST | `/api/v1/access/permission/store` |
| `api.v1.access.permission.edit` | GET | `/api/v1/access/permission/:id/edit` |
| `api.v1.access.permission.update` | PUT | `/api/v1/access/permission/:id/update` |
| `api.v1.access.permission.delete` | DELETE | `/api/v1/access/permission/:id/delete` |
| `api.v1.access.permission.delete_selected` | POST | `/api/v1/access/permission/delete_selected` |
| `api.v1.access.role.index` | GET | `/api/v1/access/role` |
| `api.v1.access.role.store` | POST | `/api/v1/access/role/store` |
| `api.v1.access.role.edit` | GET | `/api/v1/access/role/:id/edit` |
| `api.v1.access.role.update` | PUT | `/api/v1/access/role/:id/update` |
| `api.v1.access.role.delete` | DELETE | `/api/v1/access/role/:id/delete` |
| `api.v1.access.role.delete_selected` | POST | `/api/v1/access/role/delete_selected` |
| `api.v1.access.role.permission` | GET | `/api/v1/access/role/:id/permission` |
| `api.v1.access.role.permission.assign` | GET | `/api/v1/access/role/:id/permission/:permission_id/assign` |
| `api.v1.access.role.permission.assign_selected` | POST | `/api/v1/access/role/:id/permission/assign_selected` |
| `api.v1.access.role.permission.unassign` | GET | `/api/v1/access/role/:id/permission/:permission_id/unassign` |
| `api.v1.access.role.permission.unassign_selected` | POST | `/api/v1/access/role/:id/permission/unassign_selected` |

> **Guard detection**: `name.startsWith('api.')` → `guard_name = 'api'`, selain itu → `guard_name = 'web'`

> **API tidak punya `create` route** — create/edit dilakukan via form web, bukan API page.

#### Auto-Discover Permission (`getAllRegisteredRoute`)

**Kapan dipanggil**: setiap request `GET /admin/v1/access/permission` (index page), **sebelum** render view.

```ts
// PermissionController.index():
await this.permissionService.getAllRegisteredRoute(req.app)
// lalu baru query + render view
```

**Mekanisme** (`PermissionService.getAllRegisteredRoute`):

```ts
public async getAllRegisteredRoute(app: Application) {
    // 1. Ekstrak semua route dari Express router stack secara rekursif
    const routes: { method: string, path: string }[] = []
    const extractRoutes = (stack: any) => {
        stack.forEach((middleware: any) => {
            if (middleware.route) {
                const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase())
                methods.forEach(method => routes.push({ method, path: middleware.route.path }))
            } else if (middleware.handle?.stack) {
                extractRoutes(middleware.handle.stack)
            }
        })
    }
    extractRoutes(app._router.stack)

    // 2. Per route: cari named route name
    for (const route of routes) {
        const name = named.getNameByPathAndMethod(route.path, route.method)
        if (!name) continue  // ← skip route tidak bernama (anonim)

        // 3. Tentukan guard dari prefix nama
        const guard = name.startsWith('api.') ? 'api' : 'web'

        // 4. Cek apakah sudah ada di DB (match: name + method + guard_name)
        let permission = await this.permissionRepository.findOne({
            where: { name, method: route.method, guard_name: guard }
        })

        // 5. Jika belum ada → create; jika sudah ada → skip (tidak update)
        if (!permission) {
            permission = this.permissionRepository.create({ name, method: route.method, guard_name: guard })
            await this.permissionRepository.save(permission)
        }
    }
}
```

**Behavior yang harus direplikasi di turunan:**

| Aspek | Standar |
|-------|---------|
| Trigger | Tiap `GET /permission` index, **bukan** on startup atau cron |
| Skip kondisi | Route tanpa nama (tidak terdaftar di namedRoutes) |
| Upsert logika | Hanya INSERT jika belum ada — tidak UPDATE field lain |
| Match key | `name` + `method` + `guard_name` — ketiganya harus cocok |
| Default status | `null` / default DB (biasanya Active, tergantung entity default) |
| Default desc | `null` |
| Guard rule | `api.*` → `'api'`, else → `'web'` |
| Idempotent | Ya — aman dijalankan berulang kali |

#### Permission Service — Business Logic Lengkap

| Method | Logika Kunci |
|--------|-------------|
| `index(filter)` | `ciLike` untuk name + desc; exact match untuk method, status, guard |
| `store(request)` | Cek duplikat nama → `ConflictError("Permission Already Exists")`; hapus field kosong via `removeEmptyFields` |
| `edit(id)` | `findOne` by id, return data |
| `update(id, request)` | Cek duplikat nama SELAIN id sendiri (`Not(id)`); `NotFoundError` jika tidak ada; merge + save |
| `delete(id)` | `NotFoundError` jika tidak ada; `remove` |
| `delete_selected` | `Promise.all(selected.map(id => delete(id)))` — paralel |

Flash messages:
- Store: `"Store Permission Success."`
- Update: `"Update Permission Success."`
- Delete: `"Delete Permission Success."`
- Delete Selected: `"Delete Permission Success."` (sama)

#### Role → Permission Service — Logic Lengkap

| Method | Logika Kunci |
|--------|-------------|
| `permission(role_id, filter)` | Load role dengan `relations: ['permissions']`; query semua permission dengan filter khusus untuk status |
| `permission_assign(role_id, permission_id)` | Load role+permissions, push permission baru, save |
| `permission_assign_selected(role_id, permissions[])` | `findBy({id: In(permissions)})` bulk; dedup via `Set` existing ids sebelum push |
| `permission_unassign(role_id, permission_id)` | Filter out `permission.id !== permission_id` dari `role.permissions` |
| `permission_unassign_selected(role_id, permissions[])` | Loop `permissions.forEach` → filter out tiap id |

**Filter `q_status` khusus di `permission()` (berbeda dari index biasa):**

```ts
// q_status = 'Active' → tampilkan HANYA yang sudah di-assign ke role ini
if (cleanConditions.status == 'Active') {
    query = query
        .leftJoinAndSelect('permissions.roles', 'role')
        .andWhere('role.id = :role_id', { role_id })
}
// q_status = 'Inactive' → tampilkan HANYA yang BELUM di-assign ke role ini
else if (cleanConditions.status == 'Inactive') {
    query = query
        .leftJoinAndSelect('permissions.roles', 'role')
        .where(qb => {
            const subQuery = qb.subQuery()
                .select('roles_permissions.permission_id')
                .from('roles_permissions', 'roles_permissions')
                .where('roles_permissions.role_id = :roleId')
                .getQuery()
            return `permissions.id NOT IN ${subQuery}`
        })
        .setParameter('roleId', role_id)
}
```

> ⚠️ `q_status` di role/permission page bukan filter Active/Inactive biasa — maknanya berubah menjadi **Assigned/Unassigned**. App turunan harus mengimplementasikan logika query ini (JOIN vs NOT IN subquery).

**Redirect setelah assign/unassign:**
```ts
// Semua 4 fungsi (assign, assign_selected, unassign, unassign_selected):
return res.redirect(req.get('Referrer') || '/')
// → kembali ke halaman yang sama (preserve filter + pagination)
```

Flash messages role permission:
- Assign: `"Assign Permission Success."`
- Assign Selected: `"Assign Permission Success."` (sama)
- Unassign: `"Unassign Permission Success."`
- Unassign Selected: `"Unassign Permission Success."` (sama)

**Checklist Auto-Discover & Route Naming untuk App Turunan:**

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| Route naming: `{guard}.v1.access.{resource}.{action}` | | | | |
| Route naming: sub-resource `role.permission.{action}` | | | | |
| API routes tidak punya `create` route | | | | |
| `getAllRegisteredRoute` dipanggil tiap GET permission index | | | | |
| Auto-discover: skip route tanpa nama | | | | |
| Auto-discover: upsert (INSERT only, no UPDATE) | | | | |
| Auto-discover: guard detect dari prefix `api.*` | | | | |
| `store`: ConflictError jika nama duplikat | | | | |
| `update`: cek duplikat nama via `Not(id)` | | | | |
| `delete_selected`: paralel (Promise.all) | | | | |
| `permission(filter)`: q_status=Active → JOIN assigned | | | | |
| `permission(filter)`: q_status=Inactive → NOT IN subquery | | | | |
| `assign_selected`: bulk fetch + dedup via Set | | | | |
| redirect assign/unassign → `Referrer` (back to same page) | | | | |

---

### 23.11 Profile (`profile.ejs`)

| Elemen | Detail |
|--------|--------|
| Page h1 | `text-2xl font-bold text-gray-800` teks **"Profile"** |
| Card title h2 | `text-lg font-bold mb-4` style=`color:var(--primary)` teks **"User Form"** |
| Field urutan | `code` → `name` → `phone` → `email` → `timezone` → `password` → `password_confirmation` → `status` → `picture` |
| Password autocomplete | `autocomplete="off"` (bukan "current-password") |
| Picture wrapper | `d-flex align-items-center gap-3` |
| Picture preview `<img id="picturePreview">` | `width="90" height="90" class="rounded border p-1"` style=`object-fit:contain;background:#f8fafc` `onerror="this.style.visibility='hidden'"` |
| Picture file input | `type="file" name="picture" accept="image/*" class="form-control [is-invalid]"` |
| Picture error | `text-danger small mt-1` (bukan `invalid-feedback`) |
| **Tidak ada** | `blocked`, `blocked_reason`, `roles[]` field |
| Button | Hanya **Save** (`btn btn-primary-tw px-4 py-2` icon `fas fa-save me-1`) — **tidak ada tombol Back** |

**Preview JS (pakai `URL.createObjectURL`, bukan FileReader):**
```js
(function () {
  var input = document.getElementById('picture'), prev = document.getElementById('picturePreview');
  if (!input || !prev) return;
  input.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (f && f.type.startsWith('image/')) {
      prev.src = URL.createObjectURL(f);
      prev.style.visibility = 'visible';
    }
  });
})();
```

---

### 23.12 Setting (`setting/index.ejs`)

> Setting menggunakan **dua form terpisah**:
> 1. `<form id="fe_search" method="GET" action="...">` — kosong, dipakai via `form="fe_search"` attribute
> 2. `<form method="POST" action="...?_method=PUT" enctype="multipart/form-data">` — form utama

#### Section 1: Admin Theme Switcher

| Elemen | Class / Detail |
|--------|---------------|
| Card | `tw-card p-6 mb-6` |
| Header | `flex items-center gap-2 mb-1` |
| Icon | `fas fa-palette` style=`color:var(--primary)` |
| Title h2 | `text-lg font-bold` style=`color:var(--primary)` teks **"Admin Theme"** |
| Description p | `text-sm text-gray-500 mb-4` |
| Grid | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4` |
| Swatch `<label>` | `cursor-pointer block` |
| Radio | `type="radio" name="theme" class="sr-only theme-radio"` |
| Swatch container | `theme-swatch rounded-xl overflow-hidden border-2 transition` + `border-gray-800` (active) / `border-transparent` (inactive) style=`box-shadow:0 4px 10px rgba(0,0,0,.08)` |
| Color strips | `h-16 flex` > 4× `div.flex-1` style=`background:{warna}` (urutan: dark, primary, secondary, light) |
| Swatch footer | `bg-white py-2 px-3 flex items-center justify-between` |
| Tema name `<span>` | `text-sm font-semibold text-gray-700` |
| Check icon | `fas fa-check-circle check-icon` + class `hidden` jika tidak aktif, style=`color:{primary tema}` |

#### Section 2: Frontend Template Switcher

| Elemen | Class / Detail |
|--------|---------------|
| Card | `tw-card p-6 mb-6` |
| Icon | `fas fa-window-maximize` style=`color:var(--primary)` |
| Hidden input | `id="fe_template_input" name="fe_template"` — nilai dari localStorage saat load |
| Search row | `flex flex-wrap items-end gap-2 mb-4` |
| Label | `block text-xs text-gray-500 mb-1` |
| Name input | `form="fe_search" class="form-control"` style=`min-width:220px` |
| Category select | `form="fe_search" class="form-control"` style=`min-width:200px` |
| Search btn | `form="fe_search" class="btn btn-success btn-sm"` style=`height:38px` icon `fas fa-search me-1` teks "Cari" |
| Reset link `<a>` | `btn btn-danger btn-sm` style=`height:38px` icon `fas fa-times me-1` teks "Reset" |
| Empty state | `text-center text-gray-400 py-10` icon `fas fa-search fa-2x mb-2` |
| Template grid | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4` |
| Card wrapper | `fe-card block` `data-slug="{slug}"` |
| Swatch | `fe-swatch rounded-xl overflow-hidden border-2 transition` + `border-gray-900` (active) / `border-gray-300` (inactive) style=`box-shadow:0 2px 8px rgba(0,0,0,.12)` |
| Thumb | `fe-thumb fe-preview-trigger relative bg-gray-100 cursor-pointer group` + data-slug/name/preview-url style=`height:140px;overflow:hidden;border-bottom:1px solid #d1d5db;border-top-left-radius:.7rem;border-top-right-radius:.7rem;transform:translateZ(0)` |
| Placeholder | `fe-thumb-placeholder absolute inset-0 flex items-center justify-center text-gray-300` icon `fas fa-spinner fa-spin` |
| Hover overlay | `absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition` style=`background:rgba(0,0,0,.45);pointer-events:none` |
| Preview text | `text-white text-sm font-semibold` icon `fas fa-eye me-1` teks "Preview" |
| Card footer | `bg-white py-2 px-3` |
| Name row | `flex items-center justify-between` |
| Name `<span>` | `text-sm font-semibold text-gray-800 truncate` title=`{t.name}` |
| Check icon | `fas fa-check-circle fe-check` + `hidden` jika tidak active, style=`color:var(--primary)` |
| Category `<span>` | `text-xs text-gray-400` |
| Select btn | `fe-select btn btn-sm w-100 mt-2 fw-bold` + `btn-primary-tw` (active) / `btn-outline-dark` (inactive) style=`font-size:13px;letter-spacing:.3px` |
| Select btn (active) | icon `fas fa-check me-1` teks **"TERPILIH"** |
| Select btn (inactive) | icon `fas fa-hand-pointer me-1` teks **"PILIH"** |
| Image load error | fallback icon `fas fa-image text-2xl` |

**Pagination katalog** (windowed + ellipsis, teks berbeda):
```html
<div class="d-flex justify-content-center mt-5">  <!-- CENTER, bukan end -->
  <nav><ul class="pagination">
    <li class="page-item disabled"><span class="page-link">…</span></li> <!-- ellipsis -->
  </ul></nav>
</div>
```

**Modal Preview FE:**
```html
<div id="fe-preview-modal" class="hidden fixed inset-0 z-50 items-center justify-center"
     style="background:rgba(0,0,0,.6)">
  <div class="bg-white rounded-xl overflow-hidden shadow-2xl"
       style="width:92vw;height:90vh;display:flex;flex-direction:column">
    <div class="flex items-center justify-between px-4 py-3 border-b">
      <h3 id="fe-preview-title" class="font-bold text-gray-800">Preview</h3>
      <button id="fe-preview-close" type="button" class="btn btn-sm btn-danger">
        <i class="fas fa-times"></i> Tutup
      </button>
    </div>
    <iframe id="fe-preview-frame" class="flex-1 w-full" style="border:0"></iframe>
  </div>
</div>
```

#### Section 3: Setting Form

| Field | Tipe / Class | Label |
|-------|-------------|-------|
| `initial` | text, `form-control [is-invalid]` | "Company Initial [initial]" |
| `name` | text, `form-control [is-invalid]` | "Company Name [name]" |
| `description` | `textarea class="trumbowyg-editor form-control [is-invalid]"` | "Description [description]" |
| `icon` | file, wrapper `d-flex align-items-center gap-3` + preview img `width="90" height="90" class="rounded border p-1"` style=`object-fit:contain` | "Company Icon [icon]" |
| `logo` | file, sama dengan icon | "Company Logo [logo]" |
| `login_image` | file, sama dengan icon | "Login Image [login_image]" |
| `phone` | text, `form-control [is-invalid]` | "Phone [phone]" |
| `address` | text, `form-control [is-invalid]` | "Address [address]" |
| `email` | email, `form-control [is-invalid]` | "Email [email]" |
| `copyright` | text, `form-control [is-invalid]` | "Copyright Text [copyright]" |

File field error: `class="text-danger small mt-1"` (bukan `invalid-feedback`)

**Urutan field**: initial → name → description → icon → logo → login_image → phone → address → email → copyright

Save btn: `btn btn-primary-tw px-4 py-2` icon `fas fa-save me-1` teks "Save"

---

### 23.13 Components Showcase (`components/index.ejs`)

| Elemen | Class |
|--------|-------|
| Page header wrapper | `flex items-center justify-between mb-6` |
| h1 | `text-2xl font-bold text-gray-800` teks "UI Components" |
| Subtitle p | `text-sm text-gray-600` |
| Setiap section | `<section class="mb-10">` |
| Section title h2 | `text-lg font-bold mb-3` style=`color:var(--primary)` |

#### Section 1: Stat Card + Counter (3 cards, bukan 4)

| Card | Class | Icon |
|------|-------|------|
| Grid | `grid grid-cols-1 md:grid-cols-3 gap-6` | — |
| Card 1 (primary) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale` style=`border-left:4px solid var(--primary)` | `fas fa-box text-xl` style=`color:var(--primary)` |
| Card 2 (green) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale border-l-4 border-green-500` | `fas fa-dollar-sign text-green-600 text-xl` |
| Card 3 (purple) | `stat-card bg-white rounded-xl shadow-lg p-6 hover-scale border-l-4 border-purple-500` | `fas fa-chart-line text-purple-600 text-xl` |
| Trend arrow | `text-green-500 text-sm mt-1` icon `fas fa-arrow-up` | — |

> Counter dengan prefix/suffix: `$<span class="counter" data-target="42500">0</span>` dan `<span class="counter" data-target="87">0</span>%`

#### Section 2: Charts

Chart card title: `class="text-sm font-semibold text-gray-700 mb-3"` *(bukan `text-lg` — ini `text-sm`)*

#### Section 3: Badges

```html
<div class="bg-white rounded-xl shadow-lg p-6 flex flex-wrap items-center gap-3">
  <span class="badge text-bg-primary">Primary</span>
  <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Delivered</span>
  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Processing</span>
  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Shipped</span>
  <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">Cancelled</span>
  <span class="ml-4 text-sm text-gray-500">Status ikon:</span>
  <i class="fas fa-check-circle text-green-500 text-xl" title="Active"></i>
  <i class="fas fa-times-circle text-red-500 text-xl" title="Inactive"></i>
</div>
```

#### Section 4: Alert

```html
<div class="alert alert-success shadow-sm">...</div>
<div class="alert alert-danger shadow-sm">...</div>
<div class="alert alert-info shadow-sm">...</div>
<div class="alert alert-warning shadow-sm">...</div>
<div class="alert alert-primary shadow-sm">...</div>
```

> Alert di components ditambah class `shadow-sm`.

#### Section 5: Buttons

```html
<div class="bg-white rounded-xl shadow-lg p-6 flex flex-wrap items-center gap-3">
  <button class="btn btn-primary-tw px-4 py-2"><i class="fas fa-save me-1"></i> Primary</button>
  <button class="btn btn-success btn-sm">Success</button>
  <button class="btn btn-danger btn-sm">Danger</button>
  <div class="btn-group">
    <button type="button" class="btn btn-sm btn-primary dropdown-toggle" data-toggle-dd aria-expanded="false">Action</button>
    <div class="dropdown-menu dropdown-menu-end">
      <a href="#" class="dropdown-item"><i class="fas fa-pen fa-fw"></i> Edit</a>
      <div class="dropdown-divider"></div>
      <a href="#" class="dropdown-item danger"><i class="fas fa-trash fa-fw"></i> Delete</a>
    </div>
  </div>
</div>
```

#### Section 6: Popup Buttons

| Button | Class |
|--------|-------|
| Buka Modal | `btn btn-primary-tw px-4 py-2` |
| Toast Success | `btn btn-success btn-sm` |
| Toast Error | `btn btn-danger btn-sm` |
| Toast Info | `btn btn-sm btn-primary` |
| Confirm Dialog | `btn btn-danger px-4 py-2 text-white` |

Toast icons (dari foot.ejs JS):
- success → `fas fa-check-circle`
- error → `fas fa-times-circle`
- info → `fas fa-info-circle`

#### Section 7: Form

File upload preview:
```html
<div class="d-flex align-items-center gap-3">
  <img id="filePreview" src="/be/default/img/placeholder.png"
       width="90" height="90"
       class="rounded border p-1"
       style="object-fit:contain;background:#f8fafc"
       onerror="this.style.visibility='hidden'">
  <input id="fileUpload" type="file" name="file" accept="image/*" class="form-control">
</div>
<small class="text-muted">Form upload pakai ...</small>
```

Preview JS (pakai `URL.createObjectURL`, sama seperti profile):
```js
input.addEventListener('change', function(){
  var f = this.files && this.files[0];
  if (f && f.type.startsWith('image/')) {
    prev.src = URL.createObjectURL(f);
    prev.style.visibility = 'visible';
  }
});
```

#### Section 9: Data Table

Card header title h3: `text-lg font-bold` style=`color:var(--primary)` teks **"List"** *(bukan "Data List" atau lainnya)*

---

### 23.14 Rich Text Editor — Trumbowyg + File Manager

> Dipakai di: **Components Section 8**, **Setting → description field**, dan **modul lain yang punya field HTML**.
> Plugin filemanager adalah custom NodeAdmin (bukan plugin resmi Trumbowyg).

#### Cara Aktivasi (foot.ejs)

Dua class untuk dua mode:

| Class pada `<textarea>` | Mode |
|------------------------|------|
| `.trumbowyg` | Editor polos — toolbar default Trumbowyg tanpa customisasi |
| `.trumbowyg-editor` | Editor lengkap — custom toolbar + tombol File Manager |

```js
// Di foot.ejs (auto-init, tidak perlu kode per-halaman)
$(".trumbowyg").trumbowyg();

$(".trumbowyg-editor").trumbowyg({
    btns: [
        ['viewHTML'],
        ['formatting'],
        ['strong', 'em', 'del'],
        ['superscript', 'subscript'],
        ['link'],
        ['filemanager'],          // ← tombol custom dari plugin
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
        ['unorderedList', 'orderedList'],
        ['horizontalRule'],
        ['removeformat'],
        ['fullscreen']
    ],
    semantic: { div: 'div' },
    removeformatPasted: true,
    autogrow: true,
    plugins: { filemanager: true }
});

// Sinkronkan HTML editor → textarea sumber saat form submit
$("form").on("submit", function () {
    $(this).find(".trumbowyg, .trumbowyg-editor").each(function () {
        if ($(this).data('trumbowyg')) $(this).val($(this).trumbowyg('html'));
    });
});
```

#### Load Order (head.ejs)

```html
<!-- 1. Trumbowyg CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Trumbowyg/2.21.0/trumbowyg.min.js"
        integrity="sha512-..." crossorigin="anonymous"></script>
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/Trumbowyg/2.21.0/ui/trumbowyg.min.css"
      integrity="sha512-..." crossorigin="anonymous">
<!-- 2. Plugin filemanager (lokal, setelah Trumbowyg) -->
<script src="/be/default/vendor/trumbowyg/filemanager.js"></script>
```

File plugin: `public/be/default/vendor/trumbowyg/filemanager.js`

#### Markup di View

```html
<!-- Setting description field: -->
<textarea class="trumbowyg-editor form-control [is-invalid]" name="description"><%- data.description || '' %></textarea>

<!-- Components showcase Section 8: -->
<label class="form-label fw-semibold">Rich Text Editor + File Manager</label>
<textarea class="trumbowyg-editor form-control"><p>Tulis konten...</p></textarea>
```

#### File Manager Plugin — CSS Classes (`tb-fm-*`)

Semua class diinjeksikan via `<style>` tag JS (bukan Tailwind / @layer). App turunan **wajib menyertakan CSS ini** atau ekuivalennya.

| Class | Fungsi | CSS |
|-------|--------|-----|
| `.tb-fm-overlay` | Backdrop full-screen modal | `position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:11000;display:flex;align-items:center;justify-content:center` |
| `.tb-fm-dialog` | Box modal utama | `background:#fff;border-radius:8px;width:min(720px,92vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.3)` |
| `.tb-fm-header` | Bar judul + tombol tutup | `display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eee` |
| `.tb-fm-close` | Tombol × tutup modal | `border:0;background:none;font-size:24px;line-height:1;cursor:pointer;color:#888` |
| `.tb-fm-body` | Area konten modal | `padding:16px 18px;overflow:auto` |
| `.tb-fm-uploadbar` | Form upload (flex row) | `display:flex;gap:8px;margin-bottom:10px` |
| `.tb-fm-uploadbar input[type=file]` | Input file | `flex:1;border:1px solid #ddd;border-radius:6px;padding:6px` |
| `.tb-fm-btn-primary` | Tombol Upload | `background:#2563eb;color:#fff;border:0;border-radius:6px;padding:6px 16px;cursor:pointer;white-space:nowrap` |
| `.tb-fm-btn-primary:disabled` | Status uploading | `opacity:.6;cursor:default` |
| `.tb-fm-hint` | Teks keterangan abu | `color:#888;font-size:12px;margin:6px 0 12px` |
| `.tb-fm-grid` | Grid thumbnail gambar | `display:flex;flex-wrap:wrap;gap:12px` |
| `.tb-fm-item` | Satu item gambar | `display:flex;flex-direction:column;align-items:center;width:120px` |
| `.tb-fm-thumb` | Thumbnail img | `width:120px;height:90px;object-fit:cover;border:1px solid #ddd;border-radius:6px;cursor:pointer` |
| `.tb-fm-thumb:hover` | Hover highlight | `outline:2px solid #2563eb` |
| `.tb-fm-name` | Nama file (truncate) | `font-size:11px;color:#666;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px` |
| `.tb-fm-del` | Tombol hapus file | `margin-top:4px;border:1px solid #dc2626;color:#dc2626;background:#fff;border-radius:5px;font-size:11px;padding:2px 8px;cursor:pointer` |

#### File Manager Plugin — Struktur HTML Modal

```html
<div id="tbFmModal" class="tb-fm-overlay" style="display:none">
  <div class="tb-fm-dialog">
    <div class="tb-fm-header">
      <strong><i class="fas fa-images"></i> File Manager</strong>
      <button type="button" class="tb-fm-close" aria-label="Tutup">&times;</button>
    </div>
    <div class="tb-fm-body">
      <form id="tbFmUploadForm" class="tb-fm-uploadbar">
        <input type="file" name="file" accept="image/*" required>
        <button type="submit" class="tb-fm-btn-primary">Upload</button>
      </form>
      <p class="tb-fm-hint">Klik gambar untuk menyisipkan ke editor.</p>
      <div id="tbFmList" class="tb-fm-grid"></div>
    </div>
  </div>
</div>
```

> Modal di-inject **sekali** ke `document.body` saat plugin pertama kali dipanggil (`ensureModal()`). Tidak perlu ada di EJS.

#### File Manager Plugin — API Endpoints

| Method | Path | Fungsi | Auth |
|--------|------|--------|------|
| `GET` | `/admin/v1/media/list` | Daftar file dari storage | Session (web) |
| `POST` | `/admin/v1/media/upload` | Upload file baru | Session + CSRF header |
| `POST` | `/admin/v1/media/delete` | Hapus file (`{ key }`) | Session + CSRF header |

**CSRF Pattern**: token diambil dari `<meta name="csrf-token">` dan dikirim via header:
```js
headers: { 'x-csrf-token': csrfToken() }
```
*(bukan `X-CSRF-TOKEN` capitalized — header ini lowercase)*

#### File Manager Plugin — Behavior

| Aksi | Behavior |
|------|---------|
| Klik tombol toolbar "File Manager" | Buka modal, set `window.trumbowygTarget = trumbowyg` |
| Klik thumbnail | Insert `<img src="{url}" alt="" style="max-width:100%">` via `execCmd('insertHTML', ...)` + `syncCode()` |
| Upload sukses | Reset form, reload grid |
| Hapus | Fade-out item dari grid (tidak reload seluruhnya) |
| Tutup modal | Klik overlay atau tombol × |
| Loading state | Teks `<div class="tb-fm-hint">Memuat...</div>` |
| Error load | `<p class="tb-fm-hint" style="color:#dc2626">Gagal memuat daftar file.</p>` |
| Empty state | `<p class="tb-fm-hint">Belum ada file.</p>` |

#### Icon di File Manager

| Lokasi | Icon |
|--------|------|
| Header modal | `fas fa-images` (sebelum teks "File Manager") |
| Tombol hapus per item | `fas fa-trash-alt` |
| Toolbar icon plugin | pakai icon `insertImage` bawaan Trumbowyg (`hasIcon: true`, `ico: 'insertImage'`) |

#### Toolbar Button Name (untuk Turunan App)

Nama toolbar button yang didaftarkan: **`filemanager`**
Judul tooltip: `'File Manager'` (lang en & id sama)

---

### 23.15 Admin Theme System — Mekanisme Lengkap

> Theme system berjalan di server-side middleware lalu dikonsumsi EJS. App turunan harus mereplikasi seluruh pipeline ini.

#### 23.15.1 Palet 5 Tema (wajib ada di semua turunan)

| Nama | `primary` | `secondary` | `light` | `dark` |
|------|-----------|-------------|---------|--------|
| `Blue` | `#3b82f6` | `#60a5fa` | `#eff6ff` | `#1e3a5f` |
| `Purple` | `#8b5cf6` | `#a78bfa` | `#f5f3ff` | `#2e1065` |
| `Green` | `#10b981` | `#34d399` | `#ecfdf5` | `#064e3b` |
| `Orange` | `#f97316` | `#fb923c` | `#fff7ed` | `#431407` |
| `Red` | `#ef4444` | `#f87171` | `#fef2f2` | `#450a0a` |

- `DEFAULT_THEME` = **`Blue`**

#### 23.15.2 Injeksi Tema ke View (globalFunctions.ts / middleware)

Dilakukan di **setiap request** (middleware global), sebelum render view apapun:

```ts
// globalFunctions.ts
import { getTheme, DEFAULT_THEME, THEMES } from '@flazhost-nodeadmin/core'
import { DEFAULT_FE_TEMPLATE } from './config/feTemplates'

// Dari setting yang di-cache:
res.locals.themeName = setting?.theme || DEFAULT_THEME
res.locals.theme     = getTheme(setting?.theme)   // { primary, secondary, light, dark }
res.locals.themes    = THEMES                      // seluruh palet untuk UI switcher
res.locals.feTemplate = setting?.fe_template || DEFAULT_FE_TEMPLATE
```

`res.locals.theme` berisi object `{ primary, secondary, light, dark }` yang di-inject ke `head.ejs`:

```html
<!-- head.ejs: CSS var injection -->
<style>
  :root {
    --primary:     <%= theme.primary %>;
    --secondary:   <%= theme.secondary %>;
    --theme-light: <%= theme.light %>;
    --theme-dark:  <%= theme.dark %>;
  }
  body { background: linear-gradient(135deg, var(--theme-light) 0%, #f8fafc 100%); }
  .sidebar-gradient { background: var(--theme-dark); }
</style>

<!-- Tailwind config inline (override color tokens): -->
<script>
  tailwind.config = {
    theme: { extend: { colors: {
      primary:       '<%= theme.primary %>',
      secondary:     '<%= theme.secondary %>',
      'theme-light': '<%= theme.light %>',
      'theme-dark':  '<%= theme.dark %>'
    }}}
  }
</script>
```

#### 23.15.3 Tema Disimpan di Database

- Tabel: `settings`, kolom `theme VARCHAR` (nullable, default = `null` → fallback `Blue`)
- Disetel saat admin submit form setting dengan `name="theme"` (radio)
- Dibaca kembali via `getSetting()` (cache, bukan query per-request)

#### 23.15.4 Live Preview Tema (JS di setting page, tanpa reload)

```js
document.querySelectorAll('.theme-radio').forEach(function (r) {
  r.addEventListener('change', function () {
    // 1. Hapus highlight semua swatch
    document.querySelectorAll('.theme-swatch').forEach(function (s) {
      s.classList.remove('border-gray-800');
      s.classList.add('border-transparent');
    });
    // 2. Sembunyikan semua check icon
    document.querySelectorAll('.check-icon').forEach(function (c) {
      c.classList.add('hidden');
    });
    // 3. Aktifkan swatch yang dipilih
    var box = r.closest('label').querySelector('.theme-swatch');
    box.classList.add('border-gray-800');
    box.classList.remove('border-transparent');
    r.closest('label').querySelector('.check-icon').classList.remove('hidden');
  });
});
```

> ⚠️ Tidak ada perubahan warna live di preview (CSS vars tidak di-update JS). Hanya visual swatch yang berubah. Warna baru diterapkan setelah form di-submit dan halaman reload.

#### 23.15.5 Struktur Swatch di Setting Page (verifikasi dari file)

```html
<!-- Per tema: -->
<label class="cursor-pointer block">
  <input type="radio" name="theme" value="{nama}" class="sr-only theme-radio" [checked]>
  <div class="theme-swatch rounded-xl overflow-hidden border-2 transition {border-gray-800|border-transparent}"
       style="box-shadow:0 4px 10px rgba(0,0,0,.08)">
    <!-- 4 color strips (urutan: dark, primary, secondary, light) -->
    <div class="h-16 flex">
      <div class="flex-1" style="background:{tema.dark}"></div>
      <div class="flex-1" style="background:{tema.primary}"></div>
      <div class="flex-1" style="background:{tema.secondary}"></div>
      <div class="flex-1" style="background:{tema.light}"></div>
    </div>
    <!-- Footer swatch -->
    <div class="bg-white py-2 px-3 flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">{nama tema}</span>
      <i class="fas fa-check-circle check-icon {hidden jika tidak aktif}"
         style="color:{tema.primary}"></i>
    </div>
  </div>
</label>
```

---

### 23.16 Frontend Template System — Arsitektur Lengkap

> FE Template adalah halaman landing publik (`GET /` dan `GET /home`). Admin memilih template di Setting; sistem men-download dan menyajikannya.

#### 23.16.1 Konstanta & Konfigurasi (`src/config/feTemplates.ts`)

| Konstanta | Nilai |
|-----------|-------|
| `DEFAULT_FE_TEMPLATE` | `'agency-consulting-002-creative-agency'` |
| `FE_TEMPLATE_BASE_URL` | `https://raw.githubusercontent.com/lindoai/opentailwind/master/landings` |
| `FE_TEMPLATE_TREE_URL` | `https://api.github.com/repos/lindoai/opentailwind/git/trees/master?recursive=1` |
| `FE_TEMPLATE_DIR` | `public/fe/templates` (relatif root app) |
| `FE_TEMPLATE_CATALOG_FILE` | `public/fe/templates/_catalog.json` |
| `FE_TEMPLATE_SLUG_RE` | `/^([a-z]+(?:-[a-z]+)*)-(\d{3})-([a-z0-9-]+)$/` |

Slug pattern: `{kategori}-{NNN}-{nama}` — misal `agency-consulting-002-creative-agency`

#### 23.16.2 Katalog 15 Template Kurasi (wajib ada)

| slug | name | category |
|------|------|----------|
| `agency-consulting-002-creative-agency` | Creative Agency | Agency |
| `agency-consulting-001-digital-marketing-agency` | Digital Marketing Agency | Agency |
| `technology-saas-001-hero-focused-conversion-page` | SaaS — Hero Focused | Technology |
| `technology-saas-002-feature-rich-multi-section` | SaaS — Feature Rich | Technology |
| `ecommerce-retail-001-fashion-boutique` | Fashion Boutique | E-commerce |
| `ecommerce-retail-002-luxury-fashion-brand` | Luxury Fashion | E-commerce |
| `portfolio-creative-001-creative-portfolio` | Creative Portfolio | Portfolio |
| `portfolio-creative-002-minimal-portfolio` | Minimal Portfolio | Portfolio |
| `professional-services-001-law-firm` | Law Firm | Professional |
| `real-estate-property-001-real-estate-agency` | Real Estate Agency | Real Estate |
| `food-hospitality-001-fine-dining-restaurant` | Fine Dining | Food |
| `healthcare-wellness-001-family-doctor-clinic` | Family Clinic | Healthcare |
| `education-training-001-private-school` | Private School | Education |
| `fitness-sports-001-fitness-center` | Fitness Center | Fitness |
| `travel-tourism-001-travel-agency` | Travel Agency | Travel |

#### 23.16.3 Alur Rendering (`HomeController`)

```
GET / atau /home
  ↓
getActiveSlug() → baca setting.fe_template (+ validasi slug)
  ↓
isDefaultEjs(slug) ?
  → TRUE  : render EJS layout fe/default (head+header+body+footer) ← BUNDLED, offline-capable
  → FALSE : getActiveHtml() → baca file cache lokal → res.send(rawHtml)
                                ↑ jika file tidak ada → fallback ke default bundled
```

#### 23.16.4 `FeTemplateService` — Logika Kunci

| Method | Fungsi |
|--------|--------|
| `isValidSlug(slug)` | Validasi anti-SSRF: harus cocok `FE_TEMPLATE_SLUG_RE` atau `=== DEFAULT_FE_TEMPLATE` |
| `getActiveSlug()` | Baca `setting.fe_template` + validasi; fallback ke `DEFAULT_FE_TEMPLATE` |
| `isDefaultEjs(slug)` | `slug === DEFAULT_FE_TEMPLATE` → render EJS |
| `isCached(slug)` | Cek `public/fe/templates/{slug}.html` exist |
| `ensure(slug)` | Jika belum cached: fetch dari GitHub raw → simpan ke `public/fe/templates/{slug}.html` |
| `getActiveHtml()` | Baca file cache; jika tidak ada → fallback ke default |

#### 23.16.5 Preview Endpoint

```
GET /admin/v1/setting/fe-preview/:slug
```
- Protected: `ensureAuthenticated` + `AccessMiddleware`
- Controller: `SettingController.fePreview()`
- Memanggil `FeCatalogService.previewHtml(slug)` → kembalikan raw HTML
- Digunakan setting page untuk iframe thumbnail + modal preview penuh

#### 23.16.6 localStorage Caching (Setting Page JS)

```js
var LS_PREFIX = 'fe_tpl_html:';   // key = LS_PREFIX + slug, value = HTML string
var LS_SEL    = 'fe_tpl_selected'; // key tetap, value = slug terpilih saat ini

// Restore pilihan saat halaman load (mis. setelah ganti halaman katalog):
var savedSel = localStorage.getItem(LS_SEL);
if (savedSel && input) input.value = savedSel;

// Ambil HTML template (dari cache atau fetch):
function getHtml(slug, url) {
  var cached = null;
  try { cached = localStorage.getItem(LS_PREFIX + slug); } catch (e) {}
  if (cached) return Promise.resolve(cached);
  return fetch(url, { credentials: 'same-origin' })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function(html) {
      try { localStorage.setItem(LS_PREFIX + slug, html); } catch (e) { /* quota penuh: skip */ }
      return html;
    });
}

// Pilih template → simpan ke localStorage + update hidden input + update UI:
function selectSlug(slug) {
  if (input) input.value = slug;
  try { localStorage.setItem(LS_SEL, slug); } catch (e) {}
  // update border/check/btn class per .fe-card ...
}
```

#### 23.16.7 Thumbnail Rendering (Setting Page JS)

```js
// Force light mode di iframe (opentailwind pakai Tailwind v4 dark: variant):
function forceLight(html) {
  var inject =
    '<meta name="color-scheme" content="light">' +
    '<style type="text/tailwindcss">@custom-variant dark (&:where(.dark, .dark *));</style>' +
    '<style>:root{color-scheme:light !important}' +
    '@media (prefers-color-scheme: dark){:root{color-scheme:light !important}}</style>';
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, function(m){ return m + inject; })
    : inject + html;
}

// Render thumbnail: scale iframe 1280px → lebar kartu (~280px):
function renderThumb(box) {
  var slug = box.getAttribute('data-slug');
  var url  = box.getAttribute('data-preview-url');
  getHtml(slug, url).then(function(html) {
    var ph = box.querySelector('.fe-thumb-placeholder');
    if (ph) ph.remove();
    var ifr = document.createElement('iframe');
    var DESIGN_W = 1280;
    var scale = (box.clientWidth || 280) / DESIGN_W;
    ifr.setAttribute('scrolling', 'no');
    ifr.setAttribute('loading', 'lazy');
    ifr.style.cssText = 'width:' + DESIGN_W + 'px;height:' + Math.ceil(140/scale) +
      'px;border:0;transform:scale(' + scale + ');transform-origin:top left;pointer-events:none';
    ifr.srcdoc = forceLight(html);
    box.appendChild(ifr);
  }).catch(function() {
    var ph = box.querySelector('.fe-thumb-placeholder');
    if (ph) ph.innerHTML = '<i class="fas fa-image text-2xl"></i>';
  });
}

// Lazy-load via IntersectionObserver (200px rootMargin):
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) { renderThumb(en.target); io.unobserve(en.target); }
    });
  }, { rootMargin: '200px' });
  thumbs.forEach(function(t) { io.observe(t); });
} else {
  thumbs.forEach(renderThumb); // fallback: render semua langsung
}
```

#### 23.16.8 Modal Preview Penuh (Setting Page)

Trigger element `.fe-preview-trigger` adalah div `.fe-thumb` (thumbnail klik-able), dengan data attributes:

```html
<div class="fe-thumb fe-preview-trigger relative bg-gray-100 cursor-pointer group"
     data-slug="<%= t.slug %>"
     data-name="<%= t.name %>"
     style="height:140px;overflow:hidden;border-bottom:1px solid #d1d5db;
            border-top-left-radius:.7rem;border-top-right-radius:.7rem;transform:translateZ(0)"
     data-preview-url="<%= route('admin.v1.setting.fe_preview', { slug: t.slug }) %>">
  <div class="fe-thumb-placeholder absolute inset-0 flex items-center justify-center text-gray-300">
    <i class="fas fa-spinner fa-spin"></i>
  </div>
  <!-- Overlay hint saat hover -->
  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
       style="background:rgba(0,0,0,.45);pointer-events:none">
    <span class="text-white text-sm font-semibold"><i class="fas fa-eye me-1"></i> Preview</span>
  </div>
</div>
```

Modal HTML:
```html
<div id="fe-preview-modal" class="hidden fixed inset-0 z-50 items-center justify-center"
     style="background:rgba(0,0,0,.6)">
  <div class="bg-white rounded-xl overflow-hidden shadow-2xl"
       style="width:92vw;height:90vh;display:flex;flex-direction:column">
    <div class="flex items-center justify-between px-4 py-3 border-b">
      <h3 id="fe-preview-title" class="font-bold text-gray-800">Preview</h3>
      <button id="fe-preview-close" type="button" class="btn btn-sm btn-danger">
        <i class="fas fa-times"></i> Tutup
      </button>
    </div>
    <iframe id="fe-preview-frame" class="flex-1 w-full" style="border:0"></iframe>
  </div>
</div>
```

JS modal (named functions, tiga cara tutup):
```js
var modal = document.getElementById('fe-preview-modal');
var frame = document.getElementById('fe-preview-frame');
var title = document.getElementById('fe-preview-title');

// Named function openModal — loading state sebelum fetch, error state di .catch
function openModal(slug, name, url) {
  title.textContent = name;
  frame.srcdoc = '<div style="font-family:sans-serif;padding:40px">Memuat…</div>'; // loading state
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  getHtml(slug, url)
    .then(function(html) { frame.srcdoc = forceLight(html); })
    .catch(function() {
      frame.srcdoc = '<p style="padding:40px;font-family:sans-serif">Gagal memuat preview.</p>';
    });
}

// Named function closeModal
function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  frame.srcdoc = '';
}

// Trigger: klik thumbnail .fe-preview-trigger
document.querySelectorAll('.fe-preview-trigger').forEach(function(b) {
  b.addEventListener('click', function() {
    openModal(
      this.getAttribute('data-slug'),
      this.getAttribute('data-name'),
      this.getAttribute('data-preview-url')
    );
  });
});

// Tiga cara tutup modal:
// 1. Tombol close
document.getElementById('fe-preview-close').addEventListener('click', closeModal);
// 2. Klik backdrop (bukan inner dialog)
modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
// 3. Tekan ESC
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
```

#### 23.16.9 FeCatalogService — Katalog 640 Template

`FeCatalogService` (dipisah dari `FeTemplateService`) mengelola katalog 640 landing opentailwind.

**Caching 3 tier `list()`:**

| Tier | Mekanisme | Detail |
|------|-----------|--------|
| 1 | Memo in-memory | TTL 6 jam (`CATALOG_TTL_MS = 6 * 60 * 60 * 1000`) |
| 2 | Disk cache | `public/fe/templates/_catalog.json` (persist lintas-restart) |
| 3 | GitHub Tree API | `GET {FE_TEMPLATE_TREE_URL}` (Accept: `application/vnd.github+json`, timeout 20s) |
| Fallback | Kurasi 15 item | Pakai `FE_TEMPLATES` bila fetch tree gagal — log error ke console |

Parse tree: filter `type==='blob'` + `path.startsWith('landings/')` + `.endsWith('.html')`, buang prefix/suffix, sort by category+name.

**`previewHtml(slug)` — 3 tier fetch:**

| Tier | Mekanisme |
|------|-----------|
| 1 | File lokal `public/fe/templates/{slug}.html` (instan, offline-safe) |
| 2 | Upstream `{FE_TEMPLATE_BASE_URL}/{slug}.html` (timeout 8s, validasi `/<\/html>/i`) |
| 3 | Fallback lokal lagi (jika sempat ter-download sebagian) |

Error: `AppError('Template tidak dikenali', 400)` jika slug tidak ada di katalog; `AppError('Gagal mengambil preview: {reason}', 502)` jika semua tier gagal.

**`paginate(filter, pinSlug)` — server-side:**

```
filter: { q_name, q_category, q_page_size (default 12), q_page (default 1) }
pinSlug: slug aktif → dipindah ke index 0 bila lolos filter (tampil di halaman 1)
Return: PaginateResult<FeTemplate> { datas, paginate_data: { total_data, page_size, current_page, total_page } }
```

Filter: `q_name` → cek `name.includes` ATAU `slug.includes` (case-insensitive); `q_category` → exact match.

---

### 23.17 Frontend Layout `fe/default` — Struktur & Binding ke Setting

> Hanya template DEFAULT (`agency-consulting-002-creative-agency`) yang dirender via layout EJS ini. Template lain = raw HTML self-contained.

#### 23.17.1 File Layout

| File | Fungsi |
|------|--------|
| `fe/default/main.ejs` | Shell utama: include head → header → body → footer |
| `fe/default/head.ejs` | `<head>` dengan dependencies |
| `fe/default/header.ejs` | Navbar global (logo, nav, notif dropdown, dark mode toggle) |
| `fe/default/footer.ejs` | Footer global (newsletter, link columns, brand info, bottom bar) |

`main.ejs` structure:
```html
<%- include('./head.ejs') %>
<body class="bg-white dark:bg-neutral-950">
<div class="page-wraper">
  <%- include('./header.ejs') %>
  <%- body %>
  <%- include('./footer.ejs') %>
</div>
</body>
</html>
```

#### 23.17.2 Dependencies `fe/default/head.ejs`

| Library | CDN / Source | Versi |
|---------|-------------|-------|
| **Google Fonts — Inter** | fonts.googleapis.com | `wght@400;500;600;700;800;900` |
| **Tailwind CSS v4** | cdn.jsdelivr.net | `@tailwindcss/browser@4` (bukan v3!) |
| **Motion.js** | cdn.jsdelivr.net | `motion@latest/dist/motion.js` |
| **Custom CSS** | lokal | `/fe/default/css/style.css` |
| **Motion JS** | lokal | `/fe/default/js/motion.js` (di footer, bukan head) |

> ⚠️ FE layout pakai **Tailwind v4 CDN** (`@tailwindcss/browser@4`) bukan v3. Syntax berbeda: `bg-linear-to-br` bukan `bg-gradient-to-br`, `focus:outline-hidden` bukan `focus:outline-none`, dll.

Title di `<head>`:
```html
<title><%= (typeof setting !== 'undefined' && setting && setting.name)
  ? setting.name
  : (process.env.APP_NAME || 'NodeAdmin') %></title>
```

#### 23.17.3 Binding Setting → `header.ejs`

| Elemen | Binding Setting | Fallback |
|--------|----------------|---------|
| Logo `<img>` | `getFile(setting.logo)` | SVG icon inline (biru/oranye) |
| App name `<span>` | `setting.name` | `'NodeAdmin'` |
| Nav links (Dashboard, Messages, Calendar, Settings) | static `href="#"` | — |
| Dark mode toggle btn | `document.documentElement.classList.toggle('dark')` | — |
| Notification bell | static (5 notif dummy) | — |
| Profile avatar | static Unsplash URL | — |

Logo fallback (jika `setting.logo` kosong):
```html
<div class="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
  <!-- SVG bell icon -->
</div>
```

Notification dropdown class: `notification-dropdown` + `.active` toggle via `onclick="classList.toggle('active')"`

#### 23.17.4 Binding Setting → `footer.ejs`

| Field Setting | Ditampilkan di Footer |
|--------------|----------------------|
| `setting.logo` | Logo gambar di brand column (fallback: SVG cloud icon oranye) |
| `setting.name` | Brand name di brand column dan `<title>` |
| `setting.description` | Deskripsi singkat di brand column (rendered via `<%- ... %>` — HTML) |
| `setting.email` | Link `mailto:` di brand column (`fas fa-envelope me-2`) |
| `setting.phone` | Link `tel:` di brand column (`fas fa-phone me-2`) |
| `setting.address` | Text + icon `fas fa-location-dot me-2` di brand column |
| `setting.copyright` | Bottom bar (fallback: `© 2026 {name}. All rights reserved.`) |

Link columns (Company, Products, Resources, Legal) — **static `href="#"`**, tidak bind ke setting.

Social icons di bottom bar: Twitter/X, GitHub, LinkedIn — **static `href="#"`**, SVG inline (bukan FA).

Footer JS: `<script src="/fe/default/js/motion.js"></script>` — load setelah `</footer>`, sebelum `</div><!-- /page-wraper -->`.

#### 23.17.5 `fe/default/css/style.css` & `motion.js`

File lokal di `public/fe/default/`:
- `css/style.css` — custom CSS untuk animasi dan komponen (`.notification-dropdown`, transisi, dll)
- `js/motion.js` — konfigurasi Motion.js untuk `data-motion="*"` attributes

`data-motion` attributes dipakai di header: `logo`, `icon`, `nav`, `actions`, `button`, `image`  
`data-motion` attributes di footer: `newsletter`, `brand`, `column`, `input`, `button`, `bottom`

---

### 23.18 Checklist CSS & Icon per App Turunan

| Item | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|------|---------|---------|---------|---------|
| **Dependencies** | | | | |
| Tailwind CDN + config inline (4 color vars) | | | | |
| Font Awesome (lokal, bukan CDN) | | | | |
| Bootstrap Icons CDN | | | | |
| Chart.js CDN | | | | |
| jQuery CDN | | | | |
| DevExtreme CDN (CSS + JS) | | | | |
| Trumbowyg CDN (JS + CSS) 2.21.0 | | | | |
| Plugin filemanager lokal (`/be/default/vendor/trumbowyg/filemanager.js`) | | | | |
| Select2 CDN | | | | |
| **CSS Variables** | | | | |
| `--primary`, `--secondary`, `--theme-light`, `--theme-dark` di `:root` | | | | |
| `body` gradient background | | | | |
| **@layer components** | | | | |
| `.form-control` (ring color = `var(--primary)`) | | | | |
| `.form-control.is-invalid` (border red) | | | | |
| `.form-label`, `.form-check-input`, `.form-check-label`, `.invalid-feedback` | | | | |
| `.btn`, `.btn-sm`, `.btn-primary-tw`, `.btn-success`, `.btn-danger` | | | | |
| `.btn-info` (tidak ada di @layer — harus ditambah) | | | | |
| `.btn-group` | | | | |
| `.table` (header bg-gray-50, td border-b, hover) | | | | |
| `.table-bordered`, `.table-hover` (no-op shims) | | | | |
| `.alert` + 5 varian (danger/success/info/warning/primary) | | | | |
| `.badge`, `.text-bg-primary` | | | | |
| `.pagination`, `.page-item`, `.page-link`, `.page-item.active` | | | | |
| `.dropdown`, `.dropdown-menu`, `.dropdown-item`, `.dropdown-divider` | | | | |
| `.dropdown-item.danger:hover` (bg-red-50 text-red-600) | | | | |
| `.modal-overlay`, `.modal-box`, `.modal-header/body/footer`, `.modal-close` | | | | |
| `.toast`, `.toast.show`, `.toast.success/error/info` | | | | |
| `.tw-card` (white + custom shadow) | | | | |
| `.sidebar-gradient` (`var(--theme-dark)`) | | | | |
| `.nav-link-tw`, `.nav-link-tw:hover`, `.nav-link-tw.active` | | | | |
| `.text-primary-tw`, `.bg-primary-tw` | | | | |
| **Bootstrap Shims** | | | | |
| `.d-flex`, `.d-block`, `.d-none` | | | | |
| `.align-items-center`, `.justify-content-between`, `.justify-content-end`, `.justify-content-center` | | | | |
| `.fw-semibold`, `.fw-bold` | | | | |
| `.w-100`, `.mx-auto`, `.me-1`, `.me-2`, `.ms-2`, `.ps-3` | | | | |
| `.align-middle`, `.sr-only` | | | | |
| `.small`, `.text-muted`, `.text-decoration-none`, `.mb-0` (extra shims) | | | | |
| `.hover-scale` (tidak ada di @layer — harus ditambah) | | | | |
| `.btn-outline-dark` (tidak ada di @layer — harus ditambah) | | | | |
| **Select2 CSS override** | | | | |
| **Admin Theme System** | | | | |
| 5 tema wajib: Blue/Purple/Green/Orange/Red (dengan 4 hex masing-masing) | | | | |
| `DEFAULT_THEME = 'Blue'` | | | | |
| Middleware injeksi: `res.locals.theme`, `res.locals.themes`, `res.locals.themeName` | | | | |
| `res.locals.feTemplate` dari `setting.fe_template` (fallback `DEFAULT_FE_TEMPLATE`) | | | | |
| CSS var injection di head: `--primary`, `--secondary`, `--theme-light`, `--theme-dark` | | | | |
| Tailwind config inline override 4 color tokens | | | | |
| `body` gradient: `linear-gradient(135deg, var(--theme-light) 0%, #f8fafc 100%)` | | | | |
| Setting page: theme swatch radio (`sr-only theme-radio`) | | | | |
| Swatch `border-gray-800` (aktif) / `border-transparent` (tidak aktif) | | | | |
| Swatch: 4 strips (urutan: dark, primary, secondary, light) | | | | |
| Swatch footer: `check-icon fas fa-check-circle` (hidden jika tidak aktif) | | | | |
| JS live preview swatch (tanpa reload, hanya border + check icon) | | | | |
| **Frontend Template System** | | | | |
| `DEFAULT_FE_TEMPLATE = 'agency-consulting-002-creative-agency'` | | | | |
| 15 template katalog kurasi (opentailwind) | | | | |
| `FE_TEMPLATE_DIR = 'public/fe/templates'` | | | | |
| Slug validation anti-SSRF via `FE_TEMPLATE_SLUG_RE` | | | | |
| `isDefaultEjs()` → render EJS layout; lainnya → raw HTML | | | | |
| `ensure(slug)` → download dari GitHub raw jika belum cached | | | | |
| Fallback chain: slug → default → pesan error HTML | | | | |
| Preview endpoint: `GET /admin/v1/setting/fe-preview/:slug` | | | | |
| localStorage caching: `LS_PREFIX = 'fe_tpl_html:'`, `LS_SEL = 'fe_tpl_selected'` | | | | |
| `forceLight()`: inject `color-scheme:light` + Tailwind v4 dark variant override | | | | |
| Thumbnail: iframe scale trick (`transform:scale(lebar/1280)`) | | | | |
| IntersectionObserver lazy-load thumbnail (rootMargin: 200px) | | | | |
| Modal preview penuh: `id="fe-preview-modal"` + `id="fe-preview-frame"` iframe | | | | |
| `selectSlug()`: update hidden input + localStorage + border + check + btn class | | | | |
| **FE Layout `fe/default`** | | | | |
| Tailwind v4 CDN (`@tailwindcss/browser@4`) — BUKAN v3 | | | | |
| Google Fonts Inter (400–900) | | | | |
| Motion.js CDN (`motion@latest/dist/motion.js`) | | | | |
| `/fe/default/css/style.css` (lokal) + `/fe/default/js/motion.js` (lokal, di footer) | | | | |
| `<body class="bg-white dark:bg-neutral-950">` + `<div class="page-wraper">` | | | | |
| Header: logo bind `setting.logo` (fallback SVG inline oranye) | | | | |
| Header: app name bind `setting.name` (fallback 'NodeAdmin') | | | | |
| Header: dark mode toggle via `classList.toggle('dark')` pada `<html>` | | | | |
| Header: notification dropdown class `notification-dropdown` + `.active` toggle | | | | |
| Header: `data-motion="logo|icon|nav|actions|button|image"` attributes | | | | |
| Footer: bind `setting.description` via `<%- ... %>` (HTML safe) | | | | |
| Footer: bind `setting.email`, `setting.phone`, `setting.address`, `setting.copyright` | | | | |
| Footer: brand column icons: `fas fa-envelope me-2`, `fas fa-phone me-2`, `fas fa-location-dot me-2` | | | | |
| Footer: social icons (Twitter/X, GitHub, LinkedIn) — SVG inline, bukan FA | | | | |
| Footer: `data-motion="newsletter|brand|column|input|button|bottom"` attributes | | | | |
| **Trumbowyg Rich Text Editor** | | | | |
| `.trumbowyg` → editor polos (default toolbar) | | | | |
| `.trumbowyg-editor` → toolbar custom + filemanager button | | | | |
| Init config: btns 11 grup (viewHTML → fullscreen) | | | | |
| Options: `semantic:{div:'div'}`, `removeformatPasted:true`, `autogrow:true` | | | | |
| Form submit sync: `$(this).val($(this).trumbowyg('html'))` | | | | |
| **File Manager Plugin CSS (`tb-fm-*`)** | | | | |
| `.tb-fm-overlay` (backdrop z-11000) | | | | |
| `.tb-fm-dialog` (max-height:88vh, min(720px,92vw)) | | | | |
| `.tb-fm-header`, `.tb-fm-close` | | | | |
| `.tb-fm-body`, `.tb-fm-uploadbar` | | | | |
| `.tb-fm-btn-primary` (bg:#2563eb) | | | | |
| `.tb-fm-hint` (abu 12px) | | | | |
| `.tb-fm-grid`, `.tb-fm-item` (width:120px) | | | | |
| `.tb-fm-thumb` (120×90px, hover outline:#2563eb) | | | | |
| `.tb-fm-name` (truncate 120px) | | | | |
| `.tb-fm-del` (border+text #dc2626) | | | | |
| **File Manager API** | | | | |
| `GET /admin/v1/media/list` | | | | |
| `POST /admin/v1/media/upload` (CSRF via header `x-csrf-token`) | | | | |
| `POST /admin/v1/media/delete` (body: `{key}`, CSRF via header) | | | | |
| Insert: `execCmd('insertHTML', '<img src="..." style="max-width:100%">')` | | | | |
| **File Manager Icons** | | | | |
| Header modal: `fas fa-images` | | | | |
| Hapus item: `fas fa-trash-alt` | | | | |
| Toolbar btn: `ico:'insertImage'` (Trumbowyg built-in) | | | | |
| **Sidebar Icons** | | | | |
| Brand fallback: `fas fa-chart-line text-xl` | | | | |
| Dashboard: `fas fa-tachometer-alt w-5 text-center` | | | | |
| UI Components: `fas fa-cubes w-5 text-center` | | | | |
| Permission: `fas fa-key w-5 text-center` | | | | |
| Role: `fas fa-user-shield w-5 text-center` | | | | |
| User: `fas fa-users w-5 text-center` | | | | |
| Setting: `fas fa-cog w-5 text-center` | | | | |
| **Topbar Icons** | | | | |
| Hamburger: `fas fa-bars` | | | | |
| Home: `fas fa-home` | | | | |
| Avatar fallback: `fas fa-user` | | | | |
| Gear: `bi bi-gear` (Bootstrap Icons!) | | | | |
| Profile item: `fas fa-user fa-fw` | | | | |
| Logout: `fas fa-sign-out-alt fa-fw` | | | | |
| **Dashboard Icons** | | | | |
| Users card: `fas fa-users text-xl` (color: var(--primary)) | | | | |
| Roles card: `fas fa-user-shield text-green-600 text-xl` | | | | |
| Permissions card: `fas fa-key text-yellow-600 text-xl` | | | | |
| Theme card: `fas fa-palette text-purple-600 text-xl` | | | | |
| Activity 1: `fas fa-user text-white text-xs` | | | | |
| Activity 2: `fas fa-shopping-cart text-white text-xs` | | | | |
| Activity 3: `fas fa-exclamation text-white text-xs` | | | | |
| Activity 4: `fas fa-star text-white text-xs` | | | | |
| Export All: `fas fa-download mr-2` | | | | |
| Bulk Delete: `fas fa-trash mr-1` | | | | |
| Export Selected: `fas fa-file-export mr-1` | | | | |
| Eye action: `fas fa-eye` | | | | |
| Edit action: `fas fa-edit` | | | | |
| Delta up: `fas fa-arrow-up text-xs mr-1` | | | | |
| Delta down: `fas fa-arrow-down text-xs mr-1` | | | | |
| "View All Products" arrow: `fas fa-arrow-right ml-2` | | | | |
| **CRUD Table Icons** | | | | |
| Add Data: `fas fa-fw fa-plus` | | | | |
| Delete Selected: `fas fa-fw fa-times` | | | | |
| Filter Search: `fas fa-fw fa-search` | | | | |
| Filter Clear: `fas fa-fw fa-times` | | | | |
| Edit dropdown: `fas fa-pen fa-fw` | | | | |
| Delete dropdown: `fas fa-trash fa-fw` | | | | |
| Permission (role dropdown): `fas fa-key fa-fw` | | | | |
| Status Active: `fas fa-check-circle text-green-500 text-xl` | | | | |
| Status Inactive: `fas fa-times-circle text-red-500 text-xl` | | | | |
| Assigned: `fas fa-check-circle text-green-500 text-xl` | | | | |
| Not Assigned: `fas fa-times-circle text-gray-300 text-xl` | | | | |
| Assign item: `fas fa-check fa-fw` | | | | |
| Unassign item: `fas fa-times fa-fw` | | | | |
| Role badge: `badge text-bg-primary` | | | | |
| Guard badge: `badge text-bg-primary` | | | | |
| **Form Icons** | | | | |
| Save button: `fas fa-save me-1` | | | | |
| **Setting Icons** | | | | |
| Theme header: `fas fa-palette` | | | | |
| FE Template header: `fas fa-window-maximize` | | | | |
| FE Thumb loading: `fas fa-spinner fa-spin` | | | | |
| FE Hover preview: `fas fa-eye me-1` | | | | |
| FE Selected btn: `fas fa-check me-1` | | | | |
| FE Unselected btn: `fas fa-hand-pointer me-1` | | | | |
| FE Image error: `fas fa-image text-2xl` | | | | |
| FE Modal close btn: `fas fa-times` | | | | |
| FE Search btn: `fas fa-search me-1` | | | | |
| FE Reset btn: `fas fa-times me-1` | | | | |
| FE Empty state: `fas fa-search fa-2x mb-2` | | | | |
| **Toast Icons** | | | | |
| Toast success: `fas fa-check-circle` | | | | |
| Toast error: `fas fa-times-circle` | | | | |
| Toast info: `fas fa-info-circle` | | | | |
| **Components Icons** | | | | |
| Stat card 1: `fas fa-box text-xl` | | | | |
| Stat card 2: `fas fa-dollar-sign text-green-600 text-xl` | | | | |
| Stat card 3: `fas fa-chart-line text-purple-600 text-xl` | | | | |
| Trend arrow: `fas fa-arrow-up` | | | | |

---

## 24. FUNCTION EQUIVALENCE CHECKLIST

> Referensi lengkap seluruh fungsi/behavior NodeAdmin yang **wajib diimplementasikan** oleh app turunan. Setiap subseksi menjelaskan kontrak + nilai default; checklist 24.20 merangkumnya untuk dicentang per app.

---

### 24.1 Middleware Stack — Urutan Wajib

Urutan middleware **harus persis sama** (sebelum error handler):

| # | Middleware | Mode |
|---|-----------|------|
| 1 | `helmet` (CSP disabled, COEP disabled) | all |
| 2 | `compression` (gzip/brotli) | all |
| 3 | `cors` (origin=APP_HOST:PORT, credentials, methods GET/POST/PUT/DELETE) | all |
| 4 | `express.static` (dir=`public`, maxAge=7d prod / 0 dev) | web only |
| 5 | Redis connect guard (no-op di test) | all |
| 6 | `express.json()` | all |
| 7 | `express.urlencoded({extended:true})` | web only |
| 8 | `methodOverride('_method')` | web only |
| 9 | `cookieParser()` | all |
| 10 | `express-session` (RedisStore prod, MemoryStore test) | web only |
| 11 | `passport.initialize()` + `passport.session()` | web only |
| 12 | Flash middleware (custom) | web only |
| 13 | Session vars → `res.locals` (errors, flashMessage, old, successMessages, errorMessages) | web only |
| 14 | `globalFunctions` (auth, setting, theme, helpers ke res.locals) | web only |
| 15 | `csrfProtection` (skip `/api/`) | web only |
| 16 | Date timezone converter (wrap `res.render`) | web only |
| 17 | `passport.initialize()` tanpa session | api only |
| 18 | Module routes (auto-load dari `modulesDir`) | all |
| 19 | `errorHandler` (TERAKHIR, 4-arg) | all |

---

### 24.2 CSRF Protection

| Aspek | Nilai |
|-------|-------|
| Implementasi | Synchronizer token pattern (custom, tanpa library csrf) |
| Token storage | `req.session.csrfToken` (random 32 bytes hex) |
| Expose ke view | `res.locals.csrfToken` |
| META tag (head.ejs) | `<meta name="csrf-token" content="<%= csrfToken %>">` |
| Skip prefix | `/api/` (JWT stateless) |
| Skip methods | GET, HEAD, OPTIONS |
| Form non-multipart | foot.ejs auto-inject `<input type="hidden" name="_csrf" value="...">` |
| Form multipart | foot.ejs auto-append `?_csrf=<token>` ke `action` URL |
| AJAX (JS) | Header `x-csrf-token: <token>` (lowercase, dari meta tag) |
| Token check | `crypto.timingSafeEqual` (timing-safe) |
| Gagal | HTTP 403 text `'Invalid CSRF token'` |

**Tiga jalur CSRF token:**
1. Body: `req.body._csrf`
2. Query: `req.query._csrf`
3. Header: `req.headers['x-csrf-token']`

---

### 24.3 Method Override

| Aspek | Nilai |
|-------|-------|
| Mekanisme | `methodOverride('_method')` — query param |
| Format di form | `<form method="POST" action="...?_method=PUT">` atau `?_method=DELETE` |
| Mode | Web only (API pakai HTTP method langsung) |
| Gunakan di | Semua form edit/delete (PUT/DELETE via POST) |

---

### 24.4 Session & Cookie

| Aspek | Nilai |
|-------|-------|
| `secret` | `SESSION_SECRET` (required — fail-fast di prod) |
| `ttlMs` | `SESSION_TTL_HOURS * 3600 * 1000` (default 6 jam) |
| `resave` | `false` |
| `saveUninitialized` | `false` |
| Cookie `httpOnly` | `true` |
| Cookie `sameSite` | `'lax'` |
| Cookie `secure` | `isProd` (true di production) |
| Cookie `maxAge` | = `session.ttlMs` |
| Store (prod) | RedisStore (`redis://REDIS_URL`) |
| Store (test) | MemoryStore (default express-session) |

---

### 24.5 Autentikasi Web (Session + Passport Local)

| Aspek | Nilai |
|-------|-------|
| Strategy | `passport-local`, `usernameField: 'email'` |
| Password verify | `bcrypt.compare(password, user.password)` |
| Fail message | `'Invalid email or password'` |
| Serialize | `done(null, user.id)` |
| Deserialize | Query DB dengan `relations: ['roles', 'roles.permissions']` |
| Login success redirect | `/admin/v1/dashboard` |
| Login fail flash | Passport `{ message }` → `req.flash('error', msg)` |
| Already authed GET /auth/login | redirect `/admin/v1/dashboard` |
| Logout | `req.logout(callback)` → redirect `/auth/login` |
| Session middleware | `passport.initialize()` + `passport.session()` |

**Register flow:**
1. `validationResult(req)` → jika error: simpan ke `req.session.errors` + redirect back
2. Strip `roles` dari body (cegah self-assign Administrator)
3. `userService.store(safeBody, null, isPublicRegister=true)` → no role assignment
4. Flash `'Register Success. Please Login.'` + redirect `/auth/login`
5. Error: flash `err.message` + redirect `/auth/register`

**Blocked account** — login tetap berhasil (passport tidak cek blocked); logika blokir optional di app.

---

### 24.6 Autentikasi API (JWT)

| Aspek | Nilai |
|-------|-------|
| Strategy | `passport-jwt`, `ExtractJwt.fromAuthHeaderAsBearerToken()` |
| `secret` | `JWT_SECRET` (required) |
| `expiresIn` | `JWT_EXPIRES_IN` (default `'1h'`) |
| `algorithm` | `'HS256'` |
| Blacklist | Redis (mode api — token di-blacklist saat logout) |
| Refresh token | **Tidak ada** — client re-login saat expired |
| Payload | `{ id: user.id }` |
| Fail | 401 (Passport default) |

---

### 24.7 Rate Limiting

| Limiter | Endpoint | Window | Max | Response 429 |
|---------|----------|--------|-----|-------------|
| `authLimiter` | POST `/auth/login`, `/auth/register`, `/admin/v1/auth/reset/request` | 15 menit | 10 req/IP | `{message:'Too many attempts, please try again later.'}` |
| `otpLimiter` | POST `/admin/v1/auth/reset/process` | 15 menit | 5 req/IP | (sama) |

Header: `RateLimit-*` (standard, bukan `X-RateLimit-*`).

---

### 24.8 Access Control (AccessMiddleware)

| Aspek | Nilai |
|-------|-------|
| Trigger | Dipasang per-route setelah `ensureAuthenticated` |
| Derive route name | `namedRoutes.getNameByPathAndMethod(declaredPath, method)` |
| Load user | Fresh query ke DB (tidak pakai `req.user`) dengan `relations:['roles','roles.permissions']` |
| Administrator bypass | `roles.some(r => r.name === 'Administrator')` → pass to `next()` tanpa cek permission |
| Non-admin check | `role.permissions.some(p => p.name === routeName && p.method === method)` |
| Web — tidak punya akses | Flash `{key:'error', message:'Unauthorized.'}` + redirect `Referrer || '/'` |
| Web — tidak authenticated | redirect `/auth/login` |
| API — tidak punya akses | `res.status(403).json({message:'Forbidden'})` |

**`hasAccess()` (di view EJS)** — berbeda dari AccessMiddleware:

| Aspek | Nilai |
|-------|-------|
| Source | `res.locals.hasAccess` (dari `globalFunctions.ts`) |
| Administrator | selalu `true` |
| Other | cek `req.user.roles[].permissions[]` (dari session, bukan fresh DB query) |
| Return | `boolean` |
| Gunakan di view | `<% if(hasAccess('admin.v1.access.user.index','GET')) { %>` |

**`hasRole()` (di view EJS)**:
```
hasRole('Administrator') → boolean — cek role name dari session user
```

---

### 24.9 API Response Format (Standard)

Semua response API **wajib** menggunakan format ini:

```json
// Success (2xx)
{ "status": true, "message": "...", "data": {...} | null }

// Error (4xx / 5xx)
{ "status": false, "message": "...", "data": null }

// Validation Error (422)
{ "status": false, "message": "Validation Error", "errors": [...] }

// Rate limit (429) — dari express-rate-limit langsung
{ "message": "Too many attempts, please try again later." }

// AccessMiddleware Forbidden (403 API)
{ "message": "Forbidden" }
```

Date values di `data` dikonversi ke timezone user (`res.locals.userTimezone`) via `convertDatesDeep()`.

HTTP status codes:
| Situasi | Code |
|---------|------|
| Success (baca) | 200 |
| Created | 201 |
| Validation error | 422 |
| Unauthorized (JWT fail) | 401 |
| Forbidden (tidak punya akses) | 403 |
| Not found | 404 |
| Conflict (duplikat) | 409 |
| Bad gateway (fetch gagal) | 502 |
| Internal error | 500 |

---

### 24.10 Error Handling

**Error class hierarchy:**
```
AppError(message, statusCode=500, details?)
  ├── NotFoundError         → 404  default 'Resource not found'
  ├── ValidationError       → 422  default 'Validation error'
  ├── UnauthorizedError     → 401  default 'Unauthorized'
  └── ConflictError         → 409  default 'Conflict'
```

**`errorHandler` (middleware terakhir) behavior:**

| Path | Tipe Error | Response |
|------|-----------|---------|
| `/api/*` | AppError | `ResponseHandler.error(res, msg, details, statusCode)` |
| `/api/*` | Error lain | `ResponseHandler.error(res, 'Internal server error', null, 500)` |
| Web | AppError / Error | flash `{key:'error', message}` + `req.session.old = req.body` + redirect `Referrer || '/'` |

Service **wajib** `throw AppError` (atau turunannya). **Dilarang** `return error` atau `instanceof Error` check di controller.

---

### 24.11 Flash Messages — Teks Eksak

| Operasi | key | message |
|---------|-----|---------|
| Register sukses | `success` | `'Register Success. Please Login.'` |
| OTP request sukses | `success` | `'OTP Send Success.'` |
| Reset password sukses | `success` | `'Reset Password Success.'` |
| Reset password gagal | `error` | `'Invalid or expired OTP'` |
| Store user | `success` | `'Store User Success.'` |
| Update user | `success` | `'Update User Success.'` |
| Delete user | `success` | `'Delete User Success.'` |
| Delete user (bulk) | `success` | `'Delete User Success.'` |
| Store role | `success` | `'Store Role Success.'` |
| Update role | `success` | `'Update Role Success.'` |
| Delete role | `success` | `'Delete Role Success.'` |
| Delete role (bulk) | `success` | `'Delete Role Success.'` |
| Assign permission | `success` | `'Assign Permission Success.'` |
| Assign permission (bulk) | `success` | `'Assign Permission Success.'` |
| Unassign permission | `success` | `'Unassign Permission Success.'` |
| Unassign permission (bulk) | `success` | `'Unassign Permission Success.'` |
| Store permission | `success` | `'Store Permission Success.'` |
| Update permission | `success` | `'Update Permission Success.'` |
| Delete permission | `success` | `'Delete Permission Success.'` |
| Delete permission (bulk) | `success` | `'Delete Permission Success.'` |
| Update profile | `success` | `'Update Profile Success.'` |
| Save setting | `success` | `'Save Setting Success.'` |
| AccessMiddleware block | `error` | `'Unauthorized.'` |
| Error generik (errorHandler) | `error` | `err.message` (AppError) / `'Internal server error'` |

**Flash storage format:** `req.session.flashMessage = { key: 'success'|'error', message: '...' }`

**Consume di view:** `getFlashMessage('success')` / `getFlashMessage('error')` → `{key, message}` atau `false`

---

### 24.12 Global View Helpers (`res.locals`)

Seluruh helpers berikut tersedia di **semua EJS view** via `globalFunctions` middleware:

| Helper | Signature | Perilaku |
|--------|-----------|---------|
| `getError(key)` | `(key:string) → {path,msg,...} \| false` | Cari error di `res.locals.errors` by `path===key` |
| `getFlashMessage(key)` | `(key:string) → {key,message} \| false` | Cek `res.locals.flashMessage.key === key` |
| `getOld(key)` | `(key:string) → string \| undefined` | Baca `res.locals.old[key]` (input lama sebelum error) |
| `getFile(fileName)` | `(fileName:string) → url:string` | URL file dari storage adapter (OSS/S3) |
| `hasAccess(name, method)` | `(name:string,method:string) → boolean` | Cek permission dari session user (Administrator=always true) |
| `hasRole(roleName)` | `(roleName:string) → boolean` | Cek role name dari session user |
| `formatDate(date, format?)` | `(date, format='YYYY-MM-DD HH:mm:ss') → string` | Dayjs convert UTC → user timezone |
| `now(format?)` | `(format?) → string` | Waktu sekarang dalam user timezone |
| `addOrUpdateQueryParam(url, key, val)` | `→ string` | Tambah/update satu query param di URL |
| `route(name, params?)` | `(name:string, params?) → url:string` | Named route builder |
| `setting` | object | Setting dari DB (cached 60s) |
| `auth` | User | User yang sedang login (`req.user`) |
| `themeName` | string | Nama tema aktif |
| `theme` | `{primary,secondary,light,dark}` | Objek warna tema aktif |
| `themes` | array | Semua 5 tema untuk UI switcher |
| `feTemplate` | string | Slug template FE aktif |
| `userTimezone` | string | Timezone user (dari `user.timezone`, default `'UTC'`) |
| `fullUrl` | string | Full URL request saat ini |
| `queryParams` | object | `req.query` |

---

### 24.13 `renderView()` Helper

```
renderView(res, modulePath, view, locals={}, layout='main')
```

| Param | Nilai |
|-------|-------|
| `modulePath` | `path.resolve(__dirname, '.')` dari Module.ts masing-masing |
| `view` | nama file tanpa `.ejs`, misal `'index'`, `'create'` |
| `locals` | data yang di-pass ke view |
| `layout` | `'main'` (default — dengan sidebar) atau `'full-width'` (auth pages) |
| Path resolve | `{modulePath}/views/be/default/{view}.ejs` |
| Layout resolve | `./layouts/be/default/{main\|full-width}.ejs` |

---

### 24.14 Upload Config

| Aspek | Nilai |
|-------|-------|
| `max_photo_size` | `2 * 1024 * 1024` (2MB) — dari `src/config/app.ts` |
| Allowed MIME (user picture, profile, setting logo/favicon) | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| Allowed MIME (media upload) | semua `image/*` (`mimetype.startsWith('image/')`) |
| Setting MIME | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` + validasi Joi `mimetype.max(2MB)` |
| Multer fileFilter | CB non-image → `cb(null, false)` (tolak tanpa error — validasi error dari Joi) |
| Storage destination | Setting: `uploads/settings/`; User: `uploads/access/users/`; Media: via STORAGE adapter |

---

### 24.15 OTP & Password Config

| Aspek | Nilai |
|-------|-------|
| `OTP_EXPIRY_MINUTES` | default `10` menit |
| OTP format | 6 digit angka |
| OTP hash | bcrypt (disimpan di `users.password_otp`) |
| OTP expiry stored | `String(Date.now() + otpExpiryMs)` di `users.password_otp_expires` |
| OTP verify | `Number(password_otp_expires) > Date.now()` && bcrypt compare |
| Clear OTP setelah reset | `password_otp=''`, `password_otp_expires=null` |
| `BCRYPT_ROUNDS` | default `10` |
| Password hash | `bcrypt.hash(password, rounds)` |
| Password verify | `bcrypt.compare(plain, hash)` |

---

### 24.16 Pagination Helper (`core`)

**`paginate(queryBuilder, conditions)` → `PaginateResult<T>`**

```
conditions: { page?, page_size? }
default page_size: dari DEFAULT_PAGE_SIZE env (default 10)
skip: page===undefined ? 0 : (page-1)*pageSize
Returns:
{
  datas: T[],
  paginate_data: {
    total_data: number,
    page_size: number,
    current_page: number,
    total_page: number  // Math.ceil(total_data / page_size)
  }
}
```

**`ciLike(column, param, value)` → `[sqlFragment, params]`**
```
LOWER({column}) LIKE LOWER(:{param})   -- portable semua DB dialect
value di-wrap: %{value}%
```

**`removePrefix(conditions, 'q_')` → object tanpa prefix**
```
{ q_name: 'x', q_page: 1 } → { name: 'x', page: 1 }
```

---

### 24.17 Setting Cache

| Aspek | Nilai |
|-------|-------|
| Implementasi | `getSetting()` dari `src/services/settingCache.ts` |
| TTL | 60 detik (in-memory) |
| Query saat cache miss | `SELECT * FROM settings LIMIT 1` |
| Dipanggil dari | `globalFunctions` middleware (per-request, tapi return cache) |
| Katalog FE template | **TIDAK** di-cache di globalFunctions (di-inject oleh SettingController.index saja) |

---

### 24.18 DI Container Pattern

| Aspek | Nilai |
|-------|-------|
| Library | `tsyringe` |
| Service decorator | `@injectable()` |
| Inject ke constructor | `@inject(TOKEN)` |
| Token file | `src/tokens.ts` (TOKENS.IUserService, TOKENS.UserRepository, dst.) |
| Container register | `src/container.ts` — dipanggil sekali saat startup |
| Service implements | `I*Service` interface (misal `UserService implements IUserService`) |
| Repository inject | `@inject(TOKENS.UserRepository) private repo: Repository<Entity>` |

---

### 24.19 Client-side JS (foot.ejs)

Semua fungsi berikut diinject via `foot.ejs` ke **setiap halaman backend**:

#### Trumbowyg Init
- `.trumbowyg` (class) → editor polos (default toolbar)
- `.trumbowyg-editor` (class) → toolbar custom + filemanager button (lihat 23.14)
- Form submit auto-sync: `$(form).find('.trumbowyg,.trumbowyg-editor').each → val(html())`

#### Sidebar Mobile Toggle
- `#tw-sidebar-toggle` click → remove `'-translate-x-full'` dari `#tw-sidebar`; remove `hidden` dari `#tw-sidebar-overlay`
- `#tw-sidebar-overlay` click → tambah kembali kedua class

#### CSRF Auto-inject
- Non-GET form biasa → append `<input hidden name="_csrf">` 
- Non-GET form multipart → append `?_csrf=token` ke `action` URL
- (Detail: lihat 24.2)

#### Image Fallback Placeholder
- `document.addEventListener('error', ..., true)` (capture)
- Deteksi `img.naturalWidth === 0` post-DOMContentLoaded
- Avatar context (`img-profile|picture|avatar|user` dalam class/alt) → `fa-user`, else → `fa-image`
- Rounded circle hanya jika class `rounded-full|rounded-circle|img-profile`
- Ganti `<img>` dengan `<span class="img-placeholder">` berisi icon FA

#### Dropdown Vanilla
- `[data-toggle-dd]` click → toggle `.dropdown-menu.show` pada `.dropdown` / `.btn-group` terdekat
- Click di luar → tutup semua `.dropdown-menu.show`

#### `window.Toast(message, type)`
- `type`: `'success'|'error'|'info'` (default `'info'`)
- Container: `#tw-toasts`
- Tambah class `.show` via `requestAnimationFrame`
- Auto-remove setelah 3500ms (animate out 300ms)
- Icon: `fa-check-circle` / `fa-times-circle` / `fa-info-circle`

#### `window.Modal.open(opts)` / `window.Modal.close()`
- `opts: { title, body, buttons: [{label, class, onClick, close}] }`
- Default button: `{label:'Tutup', class:'btn btn-primary-tw px-4 py-2'}`
- Overlay ID: `#tw-modal`; close via: backdrop click, `data-modal-close` attr

#### `window.confirmDialog(message, opts)` → `Promise<boolean>`
- `opts: { title, cancelText, okText }`
- Default: title=`'Konfirmasi'`, cancel=`'Batal'` (btn-danger), ok=`'Ya'` (btn-primary-tw)
- `data-confirm` attribute → auto-intercept click → `confirmDialog(msg).then(ok => submit/navigate)`
- **Bukan** `window.confirm()` browser

---

### 24.20 Function Equivalence Checklist

> Centang (✓) bila implementasi app turunan setara dengan NodeAdmin. Kosong = belum.

#### Middleware & Keamanan

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| Urutan middleware 19 langkah (lihat 24.1) | | | | |
| CSRF synchronizer token (skip /api/) | | | | |
| CSRF auto-inject form non-multipart (hidden field) | | | | |
| CSRF auto-inject form multipart (query ?_csrf) | | | | |
| CSRF AJAX via header `x-csrf-token` | | | | |
| CSRF timing-safe compare | | | | |
| Method override `?_method=PUT\|DELETE` | | | | |
| Helmet (CSP disabled, COEP disabled) | | | | |
| CORS (origin APP_HOST:PORT, credentials) | | | | |
| Compression gzip/brotli | | | | |
| Static assets (maxAge 7d prod / 0 dev) | | | | |
| Redis connect guard | | | | |

#### Session & Auth Web

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| Session TTL `SESSION_TTL_HOURS` (default 6h) | | | | |
| Cookie `httpOnly:true`, `sameSite:'lax'`, `secure:isProd` | | | | |
| Session store RedisStore (prod) / MemoryStore (test) | | | | |
| `resave:false`, `saveUninitialized:false` | | | | |
| Passport LocalStrategy (`usernameField:'email'`) | | | | |
| bcrypt compare password | | | | |
| Serialize → user.id | | | | |
| Deserialize → DB query + `relations:['roles','roles.permissions']` | | | | |
| Login success → redirect `/admin/v1/dashboard` | | | | |
| GET /auth/login (sudah login) → redirect dashboard | | | | |
| Logout → `req.logout()` → redirect `/auth/login` | | | | |
| Register: strip `roles` dari body | | | | |
| Register: `isPublicRegister=true` (no role assign) | | | | |

#### Auth API (JWT)

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| ExtractJwt dari Bearer header | | | | |
| Algorithm HS256 | | | | |
| `expiresIn` dari `JWT_EXPIRES_IN` (default `'1h'`) | | | | |
| Tidak ada refresh token | | | | |
| Redis blacklist JWT (mode api) | | | | |

#### Rate Limiting

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| authLimiter: 10 req / 15 menit / IP (login, register, OTP req) | | | | |
| otpLimiter: 5 req / 15 menit / IP (OTP process) | | | | |
| 429 response: `{message:'Too many attempts, please try again later.'}` | | | | |
| Standard headers RateLimit-* (bukan X-RateLimit) | | | | |

#### Access Control

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| AccessMiddleware: derive routeName via namedRoutes | | | | |
| AccessMiddleware: fresh DB query user+roles+permissions | | | | |
| Administrator role → bypass semua permission check | | | | |
| Web unauthorized → flash `'Unauthorized.'` + redirect Referrer | | | | |
| Web not-auth → redirect `/auth/login` | | | | |
| API unauthorized → 403 `{message:'Forbidden'}` | | | | |
| `hasAccess(name, method)` di view — cek dari session | | | | |
| `hasRole(roleName)` di view | | | | |

#### Error Handling & Response

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| AppError hierarchy (NotFound/Validation/Unauthorized/Conflict) | | | | |
| errorHandler terdaftar terakhir (4-arg) | | | | |
| API error → `{status:false, message, data}` JSON | | | | |
| API success → `{status:true, message, data}` JSON | | | | |
| API validation → `{status:false, message:'Validation Error', errors:[]}` 422 | | | | |
| Web error → flash + redirect Referrer (simpan `req.body` ke old) | | | | |
| Service: `throw AppError` (bukan `return error`) | | | | |
| Log: hanya error ≥500 atau non-AppError ke console | | | | |

#### Flash Messages (teks eksak)

| Flash | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------|---------|---------|---------|---------|
| `'Register Success. Please Login.'` | | | | |
| `'OTP Send Success.'` | | | | |
| `'Reset Password Success.'` | | | | |
| `'Invalid or expired OTP'` | | | | |
| `'Store User Success.'` | | | | |
| `'Update User Success.'` | | | | |
| `'Delete User Success.'` (single & bulk) | | | | |
| `'Store Role Success.'` | | | | |
| `'Update Role Success.'` | | | | |
| `'Delete Role Success.'` (single & bulk) | | | | |
| `'Assign Permission Success.'` (single & bulk) | | | | |
| `'Unassign Permission Success.'` (single & bulk) | | | | |
| `'Store Permission Success.'` | | | | |
| `'Update Permission Success.'` | | | | |
| `'Delete Permission Success.'` (single & bulk) | | | | |
| `'Update Profile Success.'` | | | | |
| `'Save Setting Success.'` | | | | |
| `'Unauthorized.'` (AccessMiddleware) | | | | |

#### View Helpers (`res.locals`)

| Helper | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|--------|---------|---------|---------|---------|
| `getError(key)` → `{path,msg} \| false` | | | | |
| `getFlashMessage(key)` → `{key,message} \| false` | | | | |
| `getOld(key)` → `string \| undefined` | | | | |
| `getFile(fileName)` → URL string | | | | |
| `hasAccess(name, method)` → boolean | | | | |
| `hasRole(roleName)` → boolean | | | | |
| `formatDate(date, format?)` — convert ke user timezone | | | | |
| `now(format?)` — waktu sekarang di user timezone | | | | |
| `addOrUpdateQueryParam(url, key, val)` | | | | |
| `route(name, params?)` — named route builder | | | | |
| `setting` — dari cache (TTL 60s) | | | | |
| `auth` — user yang login | | | | |
| `themeName`, `theme`, `themes` | | | | |
| `feTemplate` | | | | |
| `userTimezone` (default `'UTC'`) | | | | |
| `fullUrl`, `queryParams` | | | | |

#### Upload & File

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| `max_photo_size = 2MB` (config sentral) | | | | |
| Allowed MIME foto: jpeg/jpg/png/webp | | | | |
| Media upload allowed MIME: semua `image/*` | | | | |
| fileFilter: tolak non-image tanpa throw (cb false) | | | | |
| Setting upload: logo + favicon (MIME: jpeg/jpg/png/webp) | | | | |
| `getFile(fileName)` via STORAGE adapter (OSS/S3) | | | | |

#### OTP & Password

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| OTP 6 digit | | | | |
| OTP hash (bcrypt) disimpan di DB | | | | |
| OTP expiry: `OTP_EXPIRY_MINUTES` default 10 menit | | | | |
| OTP verify: check expiry timestamp + hash compare | | | | |
| Clear OTP setelah reset: `password_otp=''`, `password_otp_expires=null` | | | | |
| `BCRYPT_ROUNDS` default 10 | | | | |
| Mail OTP: subject `'Request Reset Password'`, body text + HTML template | | | | |

#### Pagination & Query

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| `paginate(query, {page, page_size})` → PaginateResult | | | | |
| Default page_size: `DEFAULT_PAGE_SIZE` env (default 10) | | | | |
| ciLike: case-insensitive LIKE semua dialect | | | | |
| `removePrefix(conditions, 'q_')` | | | | |
| `PaginateResult` shape: `{datas, paginate_data:{total_data,page_size,current_page,total_page}}` | | | | |

#### Setting Cache

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| `getSetting()` cached 60s in-memory | | | | |
| Injeksi ke semua request via globalFunctions middleware | | | | |

#### DI Pattern

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| Service `@injectable()` | | | | |
| Constructor injection `@inject(TOKEN)` | | | | |
| Service `implements I*Service` | | | | |
| Tokens file sentral | | | | |
| Container register saat startup | | | | |

#### Client-side JS (foot.ejs equivalents)

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| Trumbowyg init `.trumbowyg` (polos) | | | | |
| Trumbowyg init `.trumbowyg-editor` (+ filemanager) | | | | |
| Form submit sync: textarea ← Trumbowyg html | | | | |
| Sidebar mobile toggle (`-translate-x-full` + overlay) | | | | |
| CSRF auto-inject semua form | | | | |
| Image fallback placeholder (FA icon) | | | | |
| Dropdown vanilla (`[data-toggle-dd]`) | | | | |
| `window.Toast(message, type)` (auto-dismiss 3.5s) | | | | |
| `window.Modal.open(opts)` / `window.Modal.close()` | | | | |
| `window.confirmDialog(msg, opts)` → Promise<boolean> | | | | |
| `data-confirm` attribute → intercept + confirmDialog | | | | |

#### renderView

| Fungsi / Behavior | GoAdmin | PHPAdmin | RustAdmin | CppAdmin |
|-------------------|---------|---------|---------|---------|
| `renderView(res, modulePath, view, locals, layout)` | | | | |
| Default layout `'main'` (sidebar), auth layout `'full-width'` | | | | |
| View path: `{modulePath}/views/be/default/{view}` | | | | |
