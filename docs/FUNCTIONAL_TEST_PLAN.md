# Functional Test Plan — NodeAdmin Derivative Apps

> **Tujuan**: Memastikan setiap fitur yang "kode ada" juga **berjalan benar** di runtime.
> Audit statis hanya cek apakah kode ditulis — dokumen ini cek apakah kode **bekerja**.
>
> **Cara eksekusi**:
> - `[CURL]` = bisa dijalankan otomatis via shell script
> - `[MANUAL]` = perlu buka browser dan interaksi langsung
> - `[DB]` = verifikasi via query ke database
>
> **Level prioritas**:
> - `P0` = Blocker — app tidak bisa dipakai jika gagal
> - `P1` = Critical — fitur inti rusak
> - `P2` = Important — fitur penting tapi ada workaround
> - `P3` = Nice-to-have — detail UI/UX

---

## Prasyarat Sebelum Test

Sebelum menjalankan test apapun, pastikan:

1. Server sudah jalan (`npm start` / `./CppAdmin` / `cargo run` / dll)
2. Database sudah di-migrate dan seed sudah dijalankan
3. Ada user `admin@admin.com` dengan password `12345678`
4. Variabel `BASE_URL` disesuaikan per app (misal `http://localhost:3000`)

---

## T00 — Bootstrap & Koneksi

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T00-01 | Server start tanpa crash | `curl -s -o /dev/null -w "%{http_code}" $BASE/auth/login` | `200` | P0 |
| T00-02 | Database terkoneksi | T00-01 berhasil (jika DB mati, server akan return 500) | `200` bukan `500` | P0 |
| T00-03 | Halaman login dapat dimuat | [MANUAL] Buka `$BASE/auth/login` | Tampil form login, tidak blank/error | P0 |
| T00-04 | Static assets dimuat | [MANUAL] DevTools → Network, tidak ada 404 untuk CSS/JS/font | Semua asset status `200` atau `304` | P1 |
| T00-05 | Font Awesome tampil | [MANUAL] Cek ikon di sidebar/tombol muncul sebagai ikon, bukan kotak | Ikon FA terrender | P1 |

---

## T01 — Auth: Login

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T01-01 | Login dengan kredensial benar | [CURL] `POST /auth/login` body `email=admin@admin.com&password=12345678` | Redirect 302 → `/admin/v1/dashboard` | P0 |
| T01-02 | Login dengan password salah | [CURL] `POST /auth/login` body `email=admin@admin.com&password=wrong` | Redirect kembali ke login + flash error | P0 |
| T01-03 | Login dengan email tidak ada | [CURL] `POST /auth/login` body `email=notexist@test.com&password=12345678` | Redirect kembali ke login + flash error | P0 |
| T01-04 | Flash error tampil di halaman | [MANUAL] Login salah → lihat halaman | Ada elemen `alert-danger` dengan teks "Invalid email or password" | P1 |
| T01-05 | Layout login 2 kolom | [MANUAL] Buka `/auth/login` di layar lebar (≥768px) | Ada panel kiri (gambar) + panel kanan (form) sejajar | P1 |
| T01-06 | Panel kiri tersembunyi di mobile | [MANUAL] Resize browser < 768px | Panel kiri tidak terlihat | P2 |
| T01-07 | Login image tampil | [MANUAL] Panel kiri ada gambar (bukan broken) | Gambar terload dari `/modules/setting/login-image.png` | P2 |
| T01-08 | Logo tampil di panel kanan | [MANUAL] Ada `<img>` logo di atas form | Gambar logo terload | P2 |
| T01-09 | Input email tidak punya `required` | [MANUAL] DevTools → inspect input email | Tidak ada atribut `required` | P2 |
| T01-10 | Input password tidak punya `required` | [MANUAL] DevTools → inspect input password | Tidak ada atribut `required` | P2 |
| T01-11 | H1 "Hello, Welcome Back!" | [MANUAL] Lihat teks heading | `Hello, Welcome Back!` | P2 |
| T01-12 | Rate limit login (10 req/15min) | [CURL] POST login 11x cepat dari IP sama | Request ke-11 → `429 Too Many Requests` | P1 |
| T01-13 | Session terbuat setelah login | [CURL] Login sukses → hit `/admin/v1/dashboard` dengan cookie | `200` (bukan redirect ke login) | P0 |
| T01-14 | CSRF token ada di form | [MANUAL] View source halaman login | Ada `<input name="_csrf">` atau `<meta name="csrf-token">` | P1 |

---

## T02 — Auth: Register

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T02-01 | Halaman register dapat dimuat | [CURL] `GET /auth/register` | `200` | P0 |
| T02-02 | Register dengan data valid | [CURL] `POST /auth/register` body `name=Test&email=test@test.com&password=12345678` | Redirect ke `/auth/login` + flash "Register Success. Please Login." | P0 |
| T02-03 | Register dengan email duplikat | [CURL] `POST /auth/register` email yang sudah ada | Flash error "Email already exists." + kembali ke register | P1 |
| T02-04 | Register dengan password < 8 karakter | [CURL] `POST /auth/register` password=`1234567` | Validation error → kembali ke form | P1 |
| T02-05 | Autocomplete name="name" | [MANUAL] Inspect input name | `autocomplete="name"` | P2 |
| T02-06 | Autocomplete email="email" | [MANUAL] Inspect input email | `autocomplete="email"` | P2 |
| T02-07 | Autocomplete password="new-password" | [MANUAL] Inspect input password | `autocomplete="new-password"` | P2 |
| T02-08 | Register tidak assign role | [DB] Query `users_roles` setelah register publik | User baru tidak ada di `users_roles` | P1 |

---

## T03 — Auth: Forgot & Reset Password

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T03-01 | Halaman forgot password dimuat | [CURL] `GET /admin/v1/auth/reset/req` | `200` | P0 |
| T03-02 | Request OTP dengan email valid | [CURL] `POST /admin/v1/auth/reset/request` email=admin@admin.com | Redirect ke `/admin/v1/auth/reset/proc` + flash "OTP Send Success." | P1 |
| T03-03 | Request OTP dengan email tidak ada | [CURL] `POST /admin/v1/auth/reset/request` email=invalid@test.com | Flash error "Invalid email" | P1 |
| T03-04 | Halaman reset proc dimuat | [CURL] `GET /admin/v1/auth/reset/proc` | `200` | P0 |
| T03-05 | OTP field pre-fill dari old input | [MANUAL] Submit form reset dengan OTP salah → lihat form kembali | Field `otp` terisi dengan nilai yang disubmit sebelumnya | P2 |
| T03-06 | Reset dengan OTP kadaluarsa | [CURL] Submit OTP yang sudah expired | Flash error "Invalid or expired OTP" | P1 |
| T03-07 | Reset sukses dengan OTP valid | [DB] Setelah flow lengkap: request OTP → ambil dari DB → submit | Password berubah di DB, redirect ke login + flash "Reset Password Success." | P1 |

---

## T04 — Auth: Logout

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T04-01 | Logout menghapus session | [CURL] Login → POST `/auth/logout` → hit dashboard | Redirect ke `/auth/login` | P0 |
| T04-02 | Akses dashboard tanpa login → redirect | [CURL] `GET /admin/v1/dashboard` tanpa cookie | Redirect ke `/auth/login` | P0 |

---

## T05 — API Auth

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T05-01 | API login sukses | [CURL] `POST /api/v1/auth/login` JSON `{email, password}` | `200` + `{status:true, data:{access_token, token_type:"Bearer"}}` | P0 |
| T05-02 | API login gagal | [CURL] `POST /api/v1/auth/login` JSON `{email, password: "wrong"}` | `401` + `{status:false, message:"..."}` | P1 |
| T05-03 | API response `status` bukan `success` | [CURL] Cek response key | Key `status` (bool), bukan `success` | P1 |
| T05-04 | API hit endpoint protected tanpa token | [CURL] `GET /api/v1/dashboard` tanpa Authorization header | `401` | P0 |
| T05-05 | API hit endpoint dengan token valid | [CURL] `GET /api/v1/dashboard` + `Authorization: Bearer {token}` | `200` | P0 |
| T05-06 | API logout invalidasi token | [CURL] Logout → pakai token lama → hit protected endpoint | `401` | P1 |

---

## T06 — Dashboard

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T06-01 | Dashboard dimuat setelah login | [CURL] Login → `GET /admin/v1/dashboard` | `200` | P0 |
| T06-02 | Stat cards tampil (4 kartu) | [MANUAL] Lihat halaman dashboard | Ada 4 stat card: Users, Roles, Permissions, Active Theme | P2 |
| T06-03 | Sidebar tampil dengan menu | [MANUAL] Cek sidebar | Ada menu: Dashboard, User, Role, Permission, Setting | P1 |
| T06-04 | Topbar tampil dengan nama user | [MANUAL] Cek topbar kanan | Ada nama user atau avatar | P2 |
| T06-05 | Font Awesome icons tampil | [MANUAL] Ikon sidebar/tombol terrender | Ikon muncul (bukan kotak kosong) | P1 |

---

## T07 — Access: User

### T07-A Index

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T07-A-01 | Halaman user index dimuat | [CURL] `GET /admin/v1/access/user` (dengan session) | `200` | P0 |
| T07-A-02 | Tabel menampilkan 10 kolom | [MANUAL] Lihat tabel | Ada kolom: No, Code, Name, Phone, Email, Status, Picture, Roles, Action + checkbox | P1 |
| T07-A-03 | Filter by name berfungsi | [CURL] `GET /admin/v1/access/user?q_name=Admin` | `200` + hanya data yang sesuai filter | P2 |
| T07-A-04 | Pagination tampil & berfungsi | [MANUAL] Jika data > 10, pagination muncul | Bisa pindah halaman | P2 |
| T07-A-05 | User Administrator tampil di list | [MANUAL] Cek tabel | Ada row dengan code `0000000001` atau email `admin@admin.com` | P1 |

### T07-B Create User

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T07-B-01 | Form create user dimuat | [CURL] `GET /admin/v1/access/user/create` | `200` | P0 |
| T07-B-02 | Semua 12 field ada | [MANUAL] Inspect form | Fields: code, name, phone, email, timezone, password, password_confirmation, status, picture, blocked, blocked_reason, roles[] | P1 |
| T07-B-03 | Create user sukses | [CURL] `POST /admin/v1/access/user/store` dengan semua field valid | Redirect ke index + flash "Create User Success." | P1 |
| T07-B-04 | Create user email duplikat | [CURL] POST dengan email yang sudah ada | Flash error "Email already exists." | P1 |
| T07-B-05 | Preview gambar via JS | [MANUAL] Pilih file gambar → lihat preview muncul tanpa submit | Gambar preview muncul (FileReader) | P2 |
| T07-B-06 | Toggle blocked_reason | [MANUAL] Centang checkbox "blocked" | Field `blocked_reason` muncul | P2 |
| T07-B-07 | Validation error inline | [CURL] POST tanpa field required | Kembali ke form, ada class `is-invalid` + pesan error per field | P1 |

### T07-C Edit User

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T07-C-01 | Form edit user dimuat | [CURL] `GET /admin/v1/access/user/{id}/edit` | `200` | P0 |
| T07-C-02 | Semua field pre-filled dari DB | [MANUAL] Buka form edit | Nilai di form = nilai di DB | P1 |
| T07-C-03 | Edit user sukses | [CURL] `PUT /admin/v1/access/user/{id}/update` | Redirect ke index + flash "Update User Success." | P1 |
| T07-C-04 | Password kosong = tidak diubah | [DB] Edit user tanpa isi password field | Password di DB tidak berubah | P1 |

### T07-D Delete

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T07-D-01 | Delete user sukses | [CURL] `DELETE /admin/v1/access/user/{id}/delete` | Redirect ke index + flash "Delete User Success." | P1 |
| T07-D-02 | Delete selected | [CURL] `POST /admin/v1/access/user/delete_selected` body `selected[]={id1}&selected[]={id2}` | Redirect ke index + flash | P2 |

---

## T08 — Access: Role

### T08-A Index

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T08-A-01 | Halaman role index dimuat | [CURL] `GET /admin/v1/access/role` | `200` | P0 |
| T08-A-02 | Role Administrator tampil | [MANUAL] Lihat tabel | Ada row "Administrator" | P1 |
| T08-A-03 | Tombol Permission ada di action dropdown | [MANUAL] Expand action dropdown | Ada menu "Permission" (ikon fa-key) | P1 |

### T08-B Create & Edit Role

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T08-B-01 | Form create role: urutan field | [MANUAL] Lihat form | Urutan: name → desc → status | P2 |
| T08-B-02 | Create role sukses | [CURL] `POST /admin/v1/access/role/store` | Flash "Create Role Success." | P1 |
| T08-B-03 | Form edit role: urutan field | [MANUAL] Lihat form edit | Urutan: name → status → desc | P2 |
| T08-B-04 | Edit role sukses | [CURL] `PUT /admin/v1/access/role/{id}/update` | Flash "Update Role Success." | P1 |

### T08-C Role → Permission

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T08-C-01 | Halaman permission role dimuat | [CURL] `GET /admin/v1/access/role/{id}/permission` | `200` (bukan 404/500) | P0 |
| T08-C-02 | Tabel permission tampil | [MANUAL] Lihat halaman | Ada tabel dengan daftar permission | P1 |
| T08-C-03 | Permission yang assigned ada ikon hijau | [MANUAL] Cek kolom "Status" | Permission yang di-assign: ✓ hijau; belum di-assign: ○ abu-abu | P2 |
| T08-C-04 | Assign single permission | [CURL] `GET /admin/v1/access/role/{id}/permission/{perm_id}/assign` | Redirect kembali + flash "Assign Permission Success." | P1 |
| T08-C-05 | Unassign single permission | [CURL] `GET /admin/v1/access/role/{id}/permission/{perm_id}/unassign` | Redirect kembali + flash "Unassign Permission Success." | P1 |
| T08-C-06 | Assign selected (bulk) | [CURL] `POST .../assign_selected` body `selected[]={id1}` | Flash "Assign Permission Success." | P2 |

---

## T09 — Access: Permission

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T09-01 | Halaman permission index dimuat | [CURL] `GET /admin/v1/access/permission` | `200` | P0 |
| T09-02 | Auto-discover berjalan saat GET index | [DB] Cek tabel `permissions` setelah GET index | Ada entries untuk semua route yang terdaftar | P1 |
| T09-03 | Create permission sukses | [CURL] `POST /admin/v1/access/permission/store` | Flash "Create Permission Success." | P1 |
| T09-04 | Edit permission pre-filled | [MANUAL] Buka form edit | Nilai field = nilai di DB | P1 |
| T09-05 | Delete permission sukses | [CURL] `DELETE /admin/v1/access/permission/{id}/delete` | Flash "Delete Permission Success." | P1 |

---

## T10 — Profile

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T10-01 | Halaman profile dimuat | [CURL] `GET /admin/v1/profile` | `200` | P0 |
| T10-02 | Form pre-filled dengan data user login | [MANUAL] Buka halaman profile | Nama, email, phone, dll sudah terisi | P1 |
| T10-03 | Update profile sukses | [CURL] `PUT /admin/v1/profile/update` body minimal | Flash "Update Profile Success." | P1 |
| T10-04 | Tidak ada field blocked/roles di profile | [MANUAL] Inspect form | Tidak ada input `blocked`, `blocked_reason`, atau `roles[]` | P1 |
| T10-05 | Preview gambar profil | [MANUAL] Pilih file gambar | Preview muncul sebelum submit | P2 |

---

## T11 — Setting

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T11-01 | Halaman setting dimuat | [CURL] `GET /admin/v1/setting` | `200` | P0 |
| T11-02 | Form fields terisi nilai dari DB | [MANUAL] Buka halaman setting | Field name, description, email, phone, address, copyright tidak kosong (jika sudah ada data) | P1 |
| T11-03 | 5 tema swatch tampil | [MANUAL] Lihat section theme | Ada 5 kartu tema: Blue, Purple, Green, Orange, Red | P1 |
| T11-04 | Swatch 4 strip warna | [MANUAL] Inspect swatch | Setiap swatch punya 4 divisi warna (dark, primary, secondary, light) | P2 |
| T11-05 | Klik tema → live preview tanpa reload | [MANUAL] Klik swatch tema berbeda | Warna sidebar/tombol berubah LANGSUNG (tidak reload halaman) | P1 |
| T11-06 | CSS var `--primary` berubah saat preview | [MANUAL] DevTools → computed style → `--primary` | Nilai berubah saat pilih tema | P1 |
| T11-07 | Save setting sukses | [CURL] `PUT /admin/v1/setting/update` | Flash "Save Setting Success." + redirect ke setting | P1 |
| T11-08 | Tema tersimpan di DB | [DB] Setelah save tema "Purple" | `settings.theme = 'Purple'` | P1 |
| T11-09 | Tema baru berlaku setelah reload | [MANUAL] Save tema Purple → reload halaman | Warna sidebar ungu | P1 |
| T11-10 | Setting cache 60 detik | Tidak mudah ditest tanpa mock — skip untuk manual | Catat jika ada TTL > 60s di kode | P3 |

---

## T12 — Media

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T12-01 | GET media list | [CURL] `GET /admin/v1/media/list` (dengan session) | `200` + JSON array | P1 |
| T12-02 | Upload file gambar | [CURL] `POST /admin/v1/media/upload` multipart file=image.jpg | `200` + `{url, name}` | P1 |
| T12-03 | Upload file bukan gambar ditolak | [CURL] POST upload file .txt | Error response | P1 |
| T12-04 | Upload file > 2MB ditolak | [CURL] POST upload file > 2MB | Error response | P2 |
| T12-05 | Delete file | [CURL] `POST /admin/v1/media/delete` body `{key:"filename"}` | `200` | P1 |

---

## T13 — RBAC (Access Control)

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T13-01 | Administrator bypass semua RBAC | [CURL] Hit semua endpoint dengan user Administrator | Semua `200` | P0 |
| T13-02 | User tanpa role akses protected page | [CURL] Login sebagai user tanpa role → hit protected endpoint | Flash "Unauthorized." + redirect | P1 |
| T13-03 | User tanpa role akses API protected | [CURL] API Bearer user tanpa role → hit protected endpoint | `403 {status:false, message:"Forbidden"}` | P1 |
| T13-04 | User dengan role tapi perm tidak assign | [CURL] Login → hit endpoint yang tidak di-assign | Flash "Unauthorized." + redirect | P1 |
| T13-05 | Assign permission → akses terbuka | [MANUAL] Assign permission ke user → coba akses | Berhasil | P1 |
| T13-06 | Akses endpoint tanpa login → redirect login | [CURL] Hit endpoint tanpa session | Redirect `302` ke `/auth/login` | P0 |

---

## T14 — CSRF Protection

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T14-01 | POST tanpa CSRF token → ditolak | [CURL] POST ke endpoint web tanpa `_csrf` | `403` atau redirect + error | P1 |
| T14-02 | CSRF via body `_csrf` | [CURL] POST dengan `_csrf={token}` di body | `200`/redirect sukses | P1 |
| T14-03 | CSRF via query `?_csrf=` | [CURL] POST ke `?_csrf={token}` | Sukses | P1 |
| T14-04 | CSRF via header `x-csrf-token` (lowercase) | [CURL] AJAX-style request dengan header `x-csrf-token: {token}` | Sukses | P1 |
| T14-05 | API endpoint `/api/` skip CSRF | [CURL] POST ke `/api/v1/...` tanpa CSRF token (dengan Bearer JWT) | Tidak ditolak karena CSRF | P1 |

---

## T15 — Flash Messages (18 Teks Standar)

Verifikasi: trigger action → lihat teks flash yang muncul di UI.

| ID | Action | Teks yang Diharapkan | P |
|----|--------|---------------------|---|
| T15-01 | Register sukses | `"Register Success. Please Login."` | P1 |
| T15-02 | OTP request sukses | `"OTP Send Success."` | P1 |
| T15-03 | Reset password sukses | `"Reset Password Success."` | P1 |
| T15-04 | Create user sukses | `"Create User Success."` | P1 |
| T15-05 | Update user sukses | `"Update User Success."` | P1 |
| T15-06 | Delete user sukses | `"Delete User Success."` | P1 |
| T15-07 | Create role sukses | `"Create Role Success."` | P1 |
| T15-08 | Update role sukses | `"Update Role Success."` | P1 |
| T15-09 | Delete role sukses | `"Delete Role Success."` | P1 |
| T15-10 | Assign permission sukses | `"Assign Permission Success."` | P1 |
| T15-11 | Unassign permission sukses | `"Unassign Permission Success."` | P1 |
| T15-12 | Create permission sukses | `"Create Permission Success."` | P1 |
| T15-13 | Update permission sukses | `"Update Permission Success."` | P1 |
| T15-14 | Delete permission sukses | `"Delete Permission Success."` | P1 |
| T15-15 | Update profile sukses | `"Update Profile Success."` | P1 |
| T15-16 | Save setting sukses | `"Save Setting Success."` | P1 |
| T15-17 | Email duplikat | `"Email already exists."` | P1 |
| T15-18 | Unauthorized access | `"Unauthorized."` | P1 |

---

## T16 — API Endpoints

### T16-A Response Shape

Setiap API response harus mengikuti shape: `{status: bool, message: string, data: any|null}`

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T16-A-01 | Response sukses punya key `status:true` | [CURL] API login sukses → inspect response | Key `status` = `true` (boolean, bukan string `"success"`) | P1 |
| T16-A-02 | Response error punya key `status:false` | [CURL] API login gagal → inspect response | Key `status` = `false` | P1 |
| T16-A-03 | Response selalu punya key `message` | [CURL] Berbagai endpoint | Key `message` selalu ada | P1 |
| T16-A-04 | Response list punya key `data` | [CURL] `GET /api/v1/access/user` | Ada key `data` | P1 |

### T16-B Pagination Shape API

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T16-B-01 | API list punya `datas` + `paginate_data` | [CURL] `GET /api/v1/access/user` | `{status, message, data: {datas:[...], paginate_data:{total_data, page_size, current_page, total_page}}}` | P1 |
| T16-B-02 | Key `total_data` (bukan `total`) | [CURL] Inspect pagination keys | Key = `total_data` | P1 |
| T16-B-03 | Key `current_page` (bukan `page`) | [CURL] Inspect pagination keys | Key = `current_page` | P1 |
| T16-B-04 | Key `total_page` (bukan `last_page`/`total_pages`) | [CURL] Inspect pagination keys | Key = `total_page` | P1 |

### T16-C Semua Endpoint API

| ID | Endpoint | Method | Auth | Expected Status | P |
|----|----------|--------|------|-----------------|---|
| T16-C-01 | `/api/v1/auth/login` | POST | Public | 200 | P0 |
| T16-C-02 | `/api/v1/auth/logout` | POST | Bearer | 200 | P1 |
| T16-C-03 | `/api/v1/auth/register` | POST | Public | 200 | P1 |
| T16-C-04 | `/api/v1/dashboard` | GET | Bearer | 200 | P0 |
| T16-C-05 | `/api/v1/access/user` | GET | Bearer | 200 | P0 |
| T16-C-06 | `/api/v1/access/user/store` | POST | Bearer | 200 | P1 |
| T16-C-07 | `/api/v1/access/user/{id}` | GET | Bearer | 200 | P1 |
| T16-C-08 | `/api/v1/access/user/{id}/update` | PUT | Bearer | 200 | P1 |
| T16-C-09 | `/api/v1/access/user/{id}/delete` | DELETE | Bearer | 200 | P1 |
| T16-C-10 | `/api/v1/access/role` | GET | Bearer | 200 | P0 |
| T16-C-11 | `/api/v1/access/role/store` | POST | Bearer | 200 | P1 |
| T16-C-12 | `/api/v1/access/role/{id}` | GET | Bearer | 200 | P1 |
| T16-C-13 | `/api/v1/access/role/{id}/update` | PUT | Bearer | 200 | P1 |
| T16-C-14 | `/api/v1/access/role/{id}/delete` | DELETE | Bearer | 200 | P1 |
| T16-C-15 | `/api/v1/access/permission` | GET | Bearer | 200 | P0 |
| T16-C-16 | `/api/v1/access/permission/store` | POST | Bearer | 200 | P1 |
| T16-C-17 | `/api/v1/access/permission/{id}` | GET | Bearer | 200 | P1 |
| T16-C-18 | `/api/v1/access/permission/{id}/update` | PUT | Bearer | 200 | P1 |
| T16-C-19 | `/api/v1/access/permission/{id}/delete` | DELETE | Bearer | 200 | P1 |
| T16-C-20 | `/api/v1/profile` | GET | Bearer | 200 | P0 |
| T16-C-21 | `/api/v1/profile/update` | PUT | Bearer | 200 | P1 |
| T16-C-22 | `/api/v1/setting` | GET | Bearer | 200 | P0 |

---

## T17 — CSS & UI

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T17-01 | `.btn-primary-tw` styling tampil | [MANUAL] Lihat tombol Save/Login | Tombol berwarna sesuai tema (bukan hitam/default) | P1 |
| T17-02 | `.btn-info` styling tampil | [MANUAL] Lihat tombol info (misal Assign) | Tombol berwarna cyan/teal | P1 |
| T17-03 | `.btn-outline-dark` tampil | [MANUAL] Lihat tombol outline | Border gelap, background transparan | P2 |
| T17-04 | `.alert-danger` styling | [MANUAL] Trigger error → lihat alert | Alert merah muncul | P1 |
| T17-05 | `.alert-success` styling | [MANUAL] Trigger sukses → Toast muncul | Toast hijau muncul | P1 |
| T17-06 | Sidebar gradient | [MANUAL] Lihat sidebar | Sidebar punya gradient warna (bukan flat) | P2 |
| T17-07 | `.dropdown-item.danger` hover merah | [MANUAL] Hover item Delete di dropdown | Background merah saat hover | P2 |
| T17-08 | Pagination styling | [MANUAL] Lihat pagination | Ada class `page-item` aktif di-highlight | P2 |
| T17-09 | Toast auto-dismiss 3.5 detik | [MANUAL] Trigger sukses action → tunggu | Toast menghilang dalam ~3.5 detik | P2 |

---

## T18 — View Helpers (Template Functions)

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T18-01 | `hasAccess()` menyembunyikan menu | [MANUAL] Login sebagai user tanpa permission ke Setting | Menu Setting tidak tampil di sidebar | P1 |
| T18-02 | `hasRole()` berfungsi | [MANUAL] Kondisional berbasis role | Konten terkondisi tampil/sembunyikan sesuai role | P2 |
| T18-03 | `getError(key)` tampil inline | [MANUAL] Submit form dengan validation error | Error muncul di bawah field spesifik | P1 |
| T18-04 | `getOld(key)` restore input | [MANUAL] Submit register/reset dengan error | Field non-password terisi kembali | P1 |
| T18-05 | `getFile(name)` return valid URL | [MANUAL] Logo/login-image terload | Gambar muncul, tidak broken | P1 |
| T18-06 | `confirmDialog()` sebelum delete | [MANUAL] Klik tombol Delete | Muncul modal konfirmasi (bukan window.confirm native) | P1 |
| T18-07 | `window.Toast()` auto-dismiss | [MANUAL] Flash sukses setelah action | Toast muncul, auto-hilang 3.5 detik | P2 |

---

## T19 — Method Override & Routing

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T19-01 | PUT via POST + `?_method=PUT` | [CURL] POST ke `/admin/v1/setting?_method=PUT` | Diterima sebagai PUT (update dieksekusi) | P1 |
| T19-02 | DELETE via POST + `?_method=DELETE` | [CURL] POST ke `/admin/v1/access/user/{id}/delete?_method=DELETE` | Diterima sebagai DELETE | P1 |

---

## T20 — Seed Data

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T20-01 | User admin@admin.com ada di DB | [DB] `SELECT * FROM users WHERE email='admin@admin.com'` | 1 row | P0 |
| T20-02 | Password di-hash bcrypt | [DB] Inspect kolom `password` | Dimulai dengan `$2b$` atau `$2a$` (bcrypt) | P0 |
| T20-03 | User code = `0000000001` | [DB] Cek kolom `code` | `0000000001` | P1 |
| T20-04 | User phone = `12345678910` | [DB] Cek kolom `phone` | `12345678910` | P1 |
| T20-05 | User timezone = `Asia/Jakarta` | [DB] Cek kolom `timezone` | `Asia/Jakarta` | P1 |
| T20-06 | Role Administrator ada | [DB] `SELECT * FROM roles WHERE name='Administrator'` | 1 row | P0 |
| T20-07 | Role guard_name = `web` | [DB] Cek kolom `guard_name` | `web` | P1 |
| T20-08 | User-Role linked | [DB] `SELECT * FROM users_roles` join user+role | Ada relasi user admin → role Administrator | P0 |
| T20-09 | Seed idempoten | [BASH] Jalankan migration/seed 2x → cek DB | Tidak ada duplikasi | P1 |
| T20-10 | Login dengan seed credential berhasil | [CURL] POST login `admin@admin.com` / `12345678` | `302` redirect ke dashboard | P0 |

---

## T21 — Security Headers

| ID | Test | Cara | Expected | P |
|----|------|------|----------|---|
| T21-01 | Session cookie httpOnly | [CURL] Response header `Set-Cookie` | Ada flag `HttpOnly` | P1 |
| T21-02 | Session cookie SameSite | [CURL] Response header `Set-Cookie` | Ada flag `SameSite=Lax` atau `SameSite=Strict` | P2 |
| T21-03 | Rate limit header muncul | [CURL] Hit endpoint ber-rate-limit | Ada header `X-RateLimit-*` atau `Retry-After` | P3 |

---

## Cara Menjalankan Smoke Test Otomatis (Template)

Simpan script ini dan jalankan: `bash smoke_test.sh http://localhost:3000`

```bash
#!/bin/bash
BASE="${1:-http://localhost:3000}"
PASS=0; FAIL=0; JAR=$(mktemp)

check() {
  local id="$1" desc="$2" expected="$3" actual="$4"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $id: $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $id: $desc | expected=$expected got=$actual"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Smoke Test: $BASE ==="
echo ""

# T00 - Bootstrap
echo "[T00] Bootstrap"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/login")
check T00-01 "Login page reachable" "200" "$STATUS"

# T01 - Login
echo "[T01] Auth Login"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR -X POST "$BASE/auth/login" \
  -d "email=admin@admin.com&password=12345678" -L -o /dev/null -w "%{http_code}")
check T01-01 "Login with valid credentials → dashboard" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -d "email=admin@admin.com&password=wrong")
check T01-02 "Login with wrong password" "302" "$STATUS"

# T04 - Protected routes
echo "[T04] Protected Routes"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/v1/dashboard")
check T04-02 "Dashboard without auth → redirect" "302" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/dashboard")
check T06-01 "Dashboard with auth → 200" "200" "$STATUS"

# T05 - API
echo "[T05] API"
API_RESP=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"12345678"}')
TOKEN=$(echo "$API_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
STATUS_KEY=$(echo "$API_RESP" | grep -o '"status":true')
check T05-01 "API login success" "\"status\":true" "$STATUS_KEY"

if [ -n "$TOKEN" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/dashboard" \
    -H "Authorization: Bearer $TOKEN")
  check T05-05 "API dashboard with token → 200" "200" "$STATUS"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/user" \
    -H "Authorization: Bearer $TOKEN")
  check T16-C-05 "API user list → 200" "200" "$STATUS"

  PAGI=$(curl -s "$BASE/api/v1/access/user" -H "Authorization: Bearer $TOKEN")
  HAS_DATAS=$(echo "$PAGI" | grep -o '"datas":\[')
  check T16-B-01 "API pagination has 'datas' key" '"datas":[' "$HAS_DATAS"
fi

# T06 - Dashboard
echo "[T06] Dashboard"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/dashboard")
check T06-01 "Dashboard loads" "200" "$STATUS"

# T07 - Users
echo "[T07] Users"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/access/user")
check T07-A-01 "User index → 200" "200" "$STATUS"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/access/user/create")
check T07-B-01 "User create page → 200" "200" "$STATUS"

# T08 - Roles
echo "[T08] Roles"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/access/role")
check T08-A-01 "Role index → 200" "200" "$STATUS"

# T09 - Permissions
echo "[T09] Permissions"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/access/permission")
check T09-01 "Permission index → 200" "200" "$STATUS"

# T10 - Profile
echo "[T10] Profile"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/profile")
check T10-01 "Profile → 200" "200" "$STATUS"

# T11 - Setting
echo "[T11] Setting"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/setting")
check T11-01 "Setting → 200" "200" "$STATUS"

# T12 - Media
echo "[T12] Media"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/media/list")
check T12-01 "Media list → 200" "200" "$STATUS"

# T20 - Seed
echo "[T20] Seed Data"
# Only testable via API since we have token
if [ -n "$TOKEN" ]; then
  USERS=$(curl -s "$BASE/api/v1/access/user?q_email=admin@admin.com" \
    -H "Authorization: Bearer $TOKEN")
  HAS_ADMIN=$(echo "$USERS" | grep -o '"email":"admin@admin.com"')
  check T20-01 "admin@admin.com in DB" '"email":"admin@admin.com"' "$HAS_ADMIN"
fi

# Summary
echo ""
echo "=== HASIL ==="
echo "✅ PASS: $PASS"
echo "❌ FAIL: $FAIL"
echo "TOTAL: $((PASS+FAIL))"
[ $FAIL -eq 0 ] && exit 0 || exit 1
```

---

## Cara Penggunaan

### Untuk Test Baru (setelah ada perubahan kode)

1. **Jalankan smoke test** dulu — tangkap masalah P0 sebelum manual test
2. **Manual test** halaman yang berubah — fokus P1
3. **Cek flash messages** — teks harus eksak sesuai T15
4. **Cek form values** — edit page harus pre-filled
5. **Cek CSS live** — tema berubah tanpa reload

### Untuk Audit App Turunan (menggantikan audit statis)

Urutan eksekusi:
1. Build app (jika perlu) + jalankan server
2. Jalankan `smoke_test.sh http://localhost:{PORT}` → catat PASS/FAIL
3. Manual test T11 (setting), T07-B (create form), T08-C (permission page)
4. Skor = total PASS / total test × 100%

> Test yang **[CURL]** bisa diotomasi. Test yang **[MANUAL]** tetap perlu mata manusia.
