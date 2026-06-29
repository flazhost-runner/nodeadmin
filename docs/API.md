# REST API — Node Admin

Base URL: `http://localhost:3000`
Semua endpoint di bawah `/api/v1/*`. Autentikasi memakai **JWT Bearer**.

## Format Response

Sukses:
```json
{ "status": true, "message": "Success", "data": { } }
```
Error:
```json
{ "status": false, "message": "Pesan error", "data": null }
```
Validation error (422):
```json
{ "status": false, "message": "Validation Error", "errors": [ { "path": "email", "msg": "..." } ] }
```

Kode status: `200` OK · `401` belum auth / token invalid · `403` tak punya akses (RBAC) · `404` tak ditemukan · `409` konflik (duplikat) · `422` validasi · `429` rate limit · `500` error server.

---

## Autentikasi

### POST `/api/v1/auth/login`
```json
{ "email": "admin@admin.com", "password": "12345678" }
```
Response:
```json
{ "status": true, "message": "Ok",
  "data": { "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 } }
```
Gunakan token di header berikutnya:
```
Authorization: Bearer <access_token>
```
Dibatasi rate limit (login berlebihan → `429`).

### POST `/api/v1/auth/register`
Registrasi publik (role default "User"; field `roles` dari klien diabaikan demi keamanan).
```json
{ "name": "Budi", "email": "budi@example.com", "password": "password123" }
```

### POST `/api/v1/auth/logout`
Header `Authorization: Bearer <token>`. Token di-blacklist (berlaku sampai expiry). **POST** karena logout adalah mutasi (GET tak boleh punya efek samping).

### POST `/api/v1/auth/reset/request`
```json
{ "email": "user@example.com" }
```
Mengirim OTP ke email (hashed + expiry 10 menit). Rate-limited.

### POST `/api/v1/auth/reset/process`
```json
{ "email": "user@example.com", "otp": "123456", "password": "passwordBaru" }
```

---

## User — `/api/v1/access/user`  (perlu auth + permission)

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/access/user` | List (query: `q_code`, `q_name`, `q_email`, `q_status`, `q_role`, `q_page`, `q_page_size`) |
| POST | `/api/v1/access/user/store` | Buat user |
| GET | `/api/v1/access/user/:id/edit` | Detail untuk edit |
| PUT | `/api/v1/access/user/:id/update` | Update |
| DELETE | `/api/v1/access/user/:id/delete` | Hapus |
| POST | `/api/v1/access/user/delete_selected` | Hapus banyak (`{ selected: [id,...] }`) |

Contoh body store:
```json
{
  "code": "0000000002", "name": "Budi", "email": "budi@example.com",
  "phone": "08123456789", "password": "password123",
  "password_confirmation": "password123", "status": "Active",
  "roles": ["<role-id>"]
}
```

---

## Role — `/api/v1/access/role`

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/access/role` | List |
| POST | `/api/v1/access/role/store` | Buat (`{ name, status, desc }`) |
| GET | `/api/v1/access/role/:id/edit` | Detail |
| PUT | `/api/v1/access/role/:id/update` | Update |
| DELETE | `/api/v1/access/role/:id/delete` | Hapus |
| GET | `/api/v1/access/role/:id/permission` | Daftar permission untuk role |
| GET | `/api/v1/access/role/:id/permission/:permission_id/assign` | Assign 1 permission |
| GET | `/api/v1/access/role/:id/permission/:permission_id/unassign` | Unassign 1 permission |
| POST | `/api/v1/access/role/:id/permission/assign_selected` | Assign banyak (`{ selected: [permId,...] }`) |
| POST | `/api/v1/access/role/:id/permission/unassign_selected` | Unassign banyak |

---

## Permission — `/api/v1/access/permission`

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/access/permission` | List |
| POST | `/api/v1/access/permission/store` | Buat (`{ name, method, guard_name, status }`) |
| GET | `/api/v1/access/permission/:id/edit` | Detail |
| PUT | `/api/v1/access/permission/:id/update` | Update |
| DELETE | `/api/v1/access/permission/:id/delete` | Hapus |
| POST | `/api/v1/access/permission/delete_selected` | Hapus banyak |

---

## Dashboard — `/api/v1/dashboard`

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/dashboard` | Statistik ringkas (`{ users, roles, permissions }`) |

Contoh response:
```json
{ "status": true, "message": "Success", "data": { "users": 2, "roles": 2, "permissions": 0 } }
```

---

## Setting — `/api/v1/setting`

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/setting` | Ambil data setting (termasuk `theme`) |
| PUT | `/api/v1/setting/update` | Update setting (mis. `theme`, `name`, dll) |

---

## Profile — `/api/v1/profile`

| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/v1/profile` | Profil sendiri |
| PUT | `/api/v1/profile/update` | Update profil sendiri (tak bisa ubah role) |

---

## Catatan

- Semua endpoint non-auth memerlukan header `Authorization: Bearer <token>` **dan** permission yang sesuai (RBAC). Administrator melewati cek permission.
- Method `PUT`/`DELETE` pada web form memakai `?_method=` (method-override); untuk API gunakan HTTP method asli.
- Endpoint web (non-`/api/`) memakai sesi + CSRF, bukan JWT — lihat aplikasi langsung.

> Catatan: spesifikasi OpenAPI/Swagger formal belum disertakan. Dokumen ini adalah referensi manual endpoint. Penambahan Swagger UI + anotasi dapat dilakukan sebagai langkah lanjutan.
