# Default Seed Check — admin@admin.com

**Referensi standar**: §1.8 NODEADMIN_STANDARD.md  
**Tanggal cek**: 2026-06-26  
**Auditor**: Claude Sonnet 4.6

---

## Standar (§1.8)

| Field | Nilai Standar |
|-------|---------------|
| `code` | `"0000000001"` |
| `name` | `"Administrator"` |
| `phone` | `"12345678910"` |
| `email` | `"admin@admin.com"` |
| `email_verified_at` | timestamp saat seed |
| `password` | bcrypt("12345678", rounds=BCRYPT_ROUNDS default 10) |
| `status` | `"Active"` |
| `timezone` | `"Asia/Jakarta"` |
| `blocked` | `false` |
| `blocked_reason` | `""` |
| Role `name` | `"Administrator"` |
| Role `guard_name` | `"web"` |
| Role `status` | `"Active"` |
| Relasi | users_roles (user ↔ role) |
| Idempoten | ya (cek duplikasi sebelum insert) |

---

## Checklist Per App (setelah fix)

| App | File Seed | email | bcrypt | code | phone | timezone | guard_name | idempoten | Status |
|-----|-----------|-------|--------|------|-------|----------|-----------|----------|--------|
| GoAdmin | `internal/modules/access/migration/seeder.go` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RustAdmin | `src/migrations/m0007_seed_admin.rs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Flyway once) | ✅ |
| CppAdmin | `db/seeds/seed.sql` | ✅ | ✅ (pre-hash rounds=10) | ✅ | ✅ | ✅ | ✅ | ✅ (INSERT OR IGNORE) | ✅ |
| PHPAdmin | `db/seeds/InitialSeed.php` | ✅ | ✅ (password_hash BCRYPT) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LaravelAdmin | `database/seeders/AdminSeeder.php` | ✅ | ✅ (Hash::make) | ✅ | ✅ | ✅ | ✅ (updateOrCreate) | ✅ | ✅ |
| DjangoAdmin | `apps/access/migrations/0002_seed.py` | ✅ | ✅ (make_password) | ✅ | ✅ | ✅ | ✅ | ✅ (get_or_create) | ✅ |
| DotNetAdmin | `src/Core/Data/DbSeeder.cs` | ✅ | ✅ (BCrypt.Net) | ✅ | ✅ | ✅ | ✅ (AnyAsync check) | ✅ | ✅ |
| SpringAdmin | `src/main/resources/db/migration/V2__seed_initial_data.sql` | ✅ | ✅ (pre-hash rounds=10) | ✅ | ✅ | ✅ | ✅ | ✅ (Flyway once) | ✅ |
| KotlinAdmin | `src/main/resources/db/migrations/V6__SeedAdminData.sql` | ✅ | ✅ (pre-hash rounds=10) | ✅ | ✅ | ✅ | ✅ | ✅ (INSERT OR IGNORE) | ✅ |
| NestAdmin | `src/database/seed.ts` | ✅ | ✅ (bcrypt.hash env rounds) | ✅ | ✅ | ✅ | ✅ | ✅ (query check) | ✅ |

---

## Tindakan yang Dilakukan

### GoAdmin
- Sebelum: code=dynamic, phone=kosong, email_verified_at=kosong, timezone="UTC", blocked_reason=kosong, guard_name tidak di-set eksplisit, Desc field salah nama
- Fix: `code="0000000001"`, `phone="12345678910"`, `email_verified_at=&now`, `timezone="Asia/Jakarta"`, `blocked_reason=""`, `GuardName="web"`, `Description=""` (field name sesuai model)
- Tambah import `"time"`

### RustAdmin
- Sebelum: role tanpa `guard_name`/`desc`, user tanpa `phone`/`email_verified_at`/`timezone`/`blocked`/`blocked_reason`
- Fix: tambah kolom `guard_name="web"`, `desc=""` ke role; tambah `phone="12345678910"`, `email_verified_at=CURRENT_TIMESTAMP`, `timezone="Asia/Jakarta"`, `blocked=false`, `blocked_reason=""` ke user
- Tambah import `sea_orm_migration::sea_query::SimpleExpr`

### CppAdmin
- Sebelum: code="ADM001", phone="000000000000", timezone="UTC", role tanpa guard_name/desc
- Fix: `code="0000000001"`, `phone="12345678910"`, `email_verified_at=CURRENT_TIMESTAMP`, `timezone="Asia/Jakarta"`, `blocked=0`, `blocked_reason=""`, role dengan `guard_name="web"`, `desc=""`

### PHPAdmin
- Sebelum: code="ADM001", phone=kosong, email_verified_at=kosong, timezone="UTC", blocked_reason=kosong, role tanpa guard_name
- Fix: semua field lengkap sesuai standar, `guard_name="web"`, `desc=""`

### LaravelAdmin
- Sebelum: code="ADM001", phone=kosong, email_verified_at=kosong, timezone=kosong, blocked_reason=kosong
- Fix: semua field lengkap, `blocked=false`, `blocked_reason=""`

### DjangoAdmin
- Sebelum: code="ADM001", phone=kosong, email_verified_at=kosong, timezone=kosong, blocked_reason=kosong, role tanpa guard_name/desc
- Fix: semua field lengkap, `guard_name="web"`, `desc=""`, import `timezone as tz`

### DotNetAdmin
- Sebelum: code="ADM001", phone=kosong, email_verified_at=kosong, timezone="UTC"
- Fix: `code="0000000001"`, `Phone="12345678910"`, `EmailVerifiedAt=DateTime.UtcNow`, `timezone="Asia/Jakarta"`, `BlockedReason=""`

### SpringAdmin
- Sebelum: code="ADM001", phone=NULL, email_verified_at=NULL, timezone="UTC", blocked_reason=NULL, role tanpa guard_name
- Fix: `code="0000000001"`, `phone="12345678910"`, `email_verified_at=CURRENT_TIMESTAMP`, `timezone="Asia/Jakarta"`, `blocked_reason=""`, role dengan `guard_name="web"`, `desc=""`
- Password hash diganti ke bcrypt rounds=10 (sesuai default BCRYPT_ROUNDS)

### KotlinAdmin
- Sebelum: code="ADM001", phone=kosong, email_verified_at=kosong, timezone="UTC", blocked/blocked_reason kosong, role tanpa guard_name, desc="Super Administrator Role"
- Fix: semua field sesuai standar, `guard_name="web"`, `desc=""`
- Password hash diganti ke bcrypt rounds=10

### NestAdmin
- Sebelum: code="ADM001", phone="081234567890", email_verified_at=kosong, timezone="UTC", blocked_reason=kosong, role tanpa guard_name
- Fix: `code="0000000001"`, `phone="12345678910"`, `email_verified_at=CURRENT_TIMESTAMP`, `timezone="Asia/Jakarta"`, `blocked_reason=""`, role dengan `guard_name="web"`
