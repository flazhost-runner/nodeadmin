# AGENTS.md — Aturan Pengembangan (untuk AI & developer)

> **Sumber kebenaran tunggal.** Setiap AI (Claude Code, Cursor, Copilot, Codex) dan developer WAJIB mengikuti dokumen ini saat menambah/mengubah kode. `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` hanya mirror tipis yang menunjuk ke sini.

Node Admin adalah **bootstrap** yang dikembangkan menjadi aplikasi apa pun. Konsistensi dijaga oleh: dokumen ini + convention checker `@flazhost-nodeadmin/cli` (`nodeadmin check` via `npm run lint:conventions`; sumber: `packages/cli/lib/checkConventions.js`) sebagai CI gate. Penyimpangan **ditolak CI**.

Sebelum coding, baca juga: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/MODULE_GUIDE.md`](docs/MODULE_GUIDE.md), [`docs/TESTING.md`](docs/TESTING.md).

---

## Alur Wajib (request lifecycle)

```
Route (named-routes)
  → middleware: ensureAuthenticated → AccessMiddleware → validator → upload
  → handler(Controller, 'method')      // DI lazy resolve, .catch(next)
  → Controller (@injectable, inject IService)   // parsing + response, TANPA logika bisnis
  → Service (@injectable, implements IService)  // logika bisnis, throw AppError bila gagal
  → Repository (TypeORM, di-inject)
  → Entity / DB
  ↘ error → errorHandler middleware (terpusat)
```

## Prinsip Wajib

1. **SOLID / DI (tsyringe).** Service & controller `@injectable`; dependency di-inject lewat constructor + token (`src/tokens.ts`), bukan `new`. Service implement interface `I*Service`.
2. **DRY.** Pakai helper yang ADA: `paginate()`, `ciLike()`, `removeEmptyFields()` (`src/helpers/functions.ts`), `renderView()` (`src/utils/view.ts`), `handler()` (`src/utils/routeBinding.ts`), OTP helper (`src/helpers/otp.ts`). Jangan tulis ulang.
3. **Error handling.** Service **`throw`** `AppError`/`NotFoundError`/`ConflictError`/`ValidationError`/`UnauthorizedError` (`src/errors/AppError.ts`). Controller TIDAK menangani error manual — `errorHandler` middleware yang menangani. **Dilarang** `return error` & `instanceof Error`.
4. **Separation of Concerns.** Controller≠Service≠Repository≠View. Logika bisnis hanya di service.
5. **Config terpusat.** Akses env HANYA via `env` dari `src/config/env.ts`. **Dilarang** `process.env.*` di dalam `src/modules/`.
6. **Portabilitas DB (kode HARUS multi-DB, bukan cuma ORM-nya).** ORM mendukung banyak dialek, tapi aplikasi tetap portabel hanya bila kode dijaga:
   - Entity: tipe abstrak (`text`/`varchar`/`int`/`timestamp`/`boolean`). **Dilarang** `longtext`/`mediumtext`/`datetime`, `@Create/UpdateDateColumn({ type })`, dan **`collation` hardcoded** (mis. `utf8mb4_unicode_ci` — beda antar-dialek).
   - Migration: TypeORM Table API, **bukan** raw SQL vendor (no `ENGINE=`, backtick, `AUTO_INCREMENT`).
   - Query: **dilarang raw `.query()` / createQueryRunner** di modul (rawan sintaks DB) & **`LIKE :param` manual** (case-sensitivity beda MySQL vs PG/SQLite) — pakai helper **`ciLike()`** (`LOWER(..) LIKE LOWER(..)`).
   - Test jalan di SQLite in-memory → membuktikan portabilitas. Checker menolak pelanggaran di atas.

## Sebelum Coding: Sajikan Rencana Artefak + Konfirmasi

Saat diminta membuat fitur/modul, AI **wajib** lebih dulu menyimpulkan artefak yang dibutuhkan (pakai Matriks di bawah) lalu **menyajikan rencana** ke user. **Ajukan pertanyaan HANYA bila ambigu**; jika prompt sudah jelas, sajikan rencana lalu lanjut.

Pertanyaan klarifikasi yang umum perlu (bila ambigu):
- Butuh **UI admin** (halaman web) atau **API-only**?
- **Read-only** (lihat saja) atau **CRUD** (ada input tulis)?
- Butuh endpoint **API** (untuk mobile/integrasi) atau cukup web?

Contoh format rencana:
> Fitur **Product**: entity+migration, IProductService+ProductService, validator (ada input), views CRUD, route web **+ api**, test (integration+api+bdd), update README+docs/API.md. → *Butuh UI admin atau API-only?*

## Matriks Kebutuhan Artefak

**TEST WAJIB untuk fitur APA PUN.** Setiap modul yang terjangkau lewat route harus punya minimal 1 test. Modul ber-service → wajib **integration test**; user-facing (service+views) → wajib **BDD**. Ini di-enforce checker (blok).

**Selalu ada** (modul fungsional ber-service):
| Artefak | Catatan |
|---------|---------|
| Service + `I*Service` | semua logika bisnis |
| Controller | pintu HTTP |
| Route (≥1) | minimal web atau api |
| **Test** | **WAJIB** — ≥1 test/modul; integration jika ada service; BDD jika user-facing |
| Update docs | README; + `docs/API.md` bila ada API |

**Kondisional** (sesuai kebutuhan — checker memaksa sesuai sifat modul):
| Artefak | Wajib JIKA | Aturan checker |
|---------|------------|----------------|
| Entity | menyimpan data | — |
| Migration | **ada entity** | entity → migration **wajib** |
| Validation | **ada input tulis** (store/update) | service punya store/update → validator **wajib** |
| Views | ada **UI admin** | views → route web **wajib** |
| Route web | ada views | — |
| Route API | fitur perlu API (mobile/integrasi) | ada `routes/api.ts` → api test + entri `docs/API.md` **wajib** |

**API itu OPSIONAL** untuk modul baru — **tidak dipaksa ada**. Untuk modul resource (CRUD data), **tawarkan** ke user apakah perlu API. JIKA dibuat (`routes/api.ts` ada), checker memaksa kelengkapannya (api test + docs). Modul boleh web-only.
> Catatan: semua modul **existing** (access/setting/dashboard/profile/auth) sudah dilengkapi API + test sebagai **referensi pola yang utuh** — ikuti mereka.

> Checker (`npm run lint:conventions`) memverifikasi kelengkapan ini **kontekstual** — hanya memaksa artefak yang relevan dengan apa yang dibangun, bukan membabi-buta.

## Checklist Membuat Modul Baru

Ikuti `docs/MODULE_GUIDE.md` (ada template lengkap). Urutan & file wajib:

1. **Entity** `modules/<m>/models/<x>.entity.ts` — tipe portabel.
2. **Migration** `modules/<m>/migrations/` — TypeORM API portabel (Table/createTable), bukan raw SQL vendor. Buat via `npm run migration:create`.
3. **Interface** `modules/<m>/http/services/v1/I<X>Service.ts`.
4. **Service** `<X>Service.ts` — `@injectable()`, `implements I<X>Service`, constructor injection **dual-mode** (`@inject(TOKENS.<X>Repository) private repo = AppDataSource.getRepository(<X>)`), `throw` AppError, pakai `paginate`/`ciLike`.
5. **Token + registrasi** — tambah `TOKENS.<X>Repository` & `TOKENS.I<X>Service` di `src/tokens.ts`; daftarkan repo factory + `useClass` di `src/container.ts`.
6. **Controller** `controllers/web/v1` &/ `api/v1` — `@injectable()`, inject `I<X>Service`. Web: `renderView(res, Module.path, 'view', locals)`. API: `ResponseHandler`. Tanpa try/catch error.
7. **Validator** `http/validators/` — Joi dengan `{ stripUnknown: true }`; tulis balik `req.body = value`.
8. **Routes** `routes/web.ts` / `api.ts` — `handler(Controller, 'method')`; urutan middleware `ensureAuthenticated, AccessMiddleware, ...`. (CSRF & rate-limit lihat Security.)
9. **Views** `views/be/default/` — Tailwind, ikuti pola tabel/form/pagination modul `access`.
10. **Test** (lihat `docs/TESTING.md`): integration (service↔sqlite), api (supertest), + BDD bila user-facing.
11. **Docs** — tambah fitur di `README.md`, endpoint di `docs/API.md`.

## Security Checklist

- Route admin: `ensureAuthenticated` SEBELUM `AccessMiddleware` (urutan wajib).
- Form web mutasi: token CSRF (otomatis via `csrfProtection` + injeksi `_csrf` di foot.ejs) — jangan dilewati.
- Endpoint sensitif (login/register/OTP): pasang `authLimiter`/`otpLimiter`.
- Validasi semua input (Joi `stripUnknown`) — cegah mass-assignment.
- Upload: validasi via fileService (magic-byte). Jangan percaya MIME klien.
- Jangan bocorkan detail error ke user (errorHandler sudah generik di production).
- Secret hanya dari `env`; jangan hardcode.

## DO NOT (akan ditolak CI)

- ❌ `new XService()` / `new XController()` di `routes/` → pakai `handler()` + DI.
- ❌ `return error` / `instanceof Error` → pakai `throw AppError`.
- ❌ `res.render(path.resolve(...))` → pakai `renderView()`.
- ❌ `type: 'longtext'|'datetime'|...`, `collation: ...`, atau `@CreateDateColumn({ type })` di entity (tak portabel).
- ❌ raw `.query()`/createQueryRunner di modul, atau `LIKE :param` manual → pakai repository/QueryBuilder + `ciLike()`.
- ❌ `process.env.*` di `src/modules/` → pakai `env`.
- ❌ Service tanpa `@injectable` / tanpa interface `I*Service`.
- ❌ Menambah modul tanpa test & tanpa update docs.
- ❌ Hardcode secret/kredensial.

## Definition of Done (modul/fitur)

- [ ] Mengikuti checklist & pola di atas.
- [ ] `npm run lint:conventions` → lolos.
- [ ] `npx tsc --noEmit` → 0.
- [ ] `npm test` → hijau (+ test baru untuk fitur).
- [ ] Security checklist terpenuhi.
- [ ] README + docs/API.md diperbarui.

## Perintah Penting

```
npm run lint:conventions   # cek kepatuhan pola (WAJIB sebelum selesai)
npm run start:dev          # jalankan dev
npm test                   # semua Jest
npm run test:bdd           # Cucumber
npm run migration:create   # buat migrasi
```
