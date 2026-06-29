---
name: make-module
description: Buat modul baru lengkap (entity, migration, service+interface, validator, controller, route, views, test, docs) yang otomatis mengikuti pola & prinsip di AGENTS.md. Gunakan saat user minta "buat modul/fitur X", "tambah resource Y", atau menyebut /make-module. Mendelegasikan eksekusi ke subagent agar context utama hemat, dan memverifikasi via checker+tsc+test sampai hijau.
---

# make-module

Membuat modul baru pada bootstrap NodeAdmin **persis mengikuti pola yang sudah ada**, lalu memvalidasinya otomatis. Eksekusi berat didelegasikan ke subagent (hemat context window utama).

## Kapan dipakai
- User minta membuat modul/fitur/resource baru (mis. "buat modul Order lengkap API").
- User mengetik `/make-module`.

## Langkah

### 1. Klarifikasi spec (di context utama — murah)
Sebelum delegasi, pastikan jelas. Jika kurang, tanya singkat (pakai AskUserQuestion):
- **Nama modul** (singular, mis. `order`) + **field** (nama:tipe, mis. `code:string, total:number, status:enum`).
- **Relasi** ke modul lain? (mis. `user_id` → users).
- **Butuh UI admin** (views) atau **API-only**?
- **Butuh API**? (opsional — tawarkan).
Jika user sudah eksplisit (mis. "lengkap API + UI"), jangan tanya — lanjut.

Sajikan **rencana artefak** singkat ke user lalu lanjut (sesuai aturan AGENTS.md).

### 2. Delegasikan eksekusi ke subagent
Spawn **satu subagent** (Agent tool) per modul dengan instruksi baku berikut. Subagent mengerjakan SEMUA file + verifikasi, sehingga detail kerja tidak membanjiri context utama.

Prompt subagent (isi `{...}` dari spec):
```
Buat modul "{nama}" pada NodeAdmin (Express+TS+TypeORM+tsyringe) MENGIKUTI PERSIS pola di AGENTS.md + docs/MODULE_GUIDE.md. Spec: field {field}, relasi {relasi|tidak ada}, UI admin: {ya/tidak}, API: {ya/tidak}.

WAJIB ikuti (baca dulu): AGENTS.md, docs/MODULE_GUIDE.md, dan modul contoh src/modules/setting & src/modules/access (pola termutakhir).

Buat semua artefak sesuai kebutuhan:
- models/{nama}.entity.ts (tipe portabel: text/varchar/int/timestamp; @CreateDateColumn() tanpa type; relasi via @ManyToOne+@JoinColumn bila ada)
- migrations/ (TypeORM Table API portabel; buat manual file dengan timestamp epoch-ms; FK via TableForeignKey bila relasi)
- http/services/v1/I{Nama}Service.ts + {Nama}Service.ts (@injectable, implements interface, constructor injection DUAL-MODE `@inject(TOKENS.{Nama}Repository) private repo = AppDataSource.getRepository({Nama})`, throw NotFoundError/ConflictError/AppError, pakai paginate()+ciLike())
- http/validators/{Nama}Validator.ts (Joi stripUnknown; cabang /api/ → ResponseHandler.validationError, web → redirect back)
- http/controllers/web/v1/{Nama}Controller.ts (jika UI: @injectable, inject interface, renderView) DAN/ATAU http/controllers/api/v1/{Nama}Controller.ts (jika API: ResponseHandler)
- routes/web.ts (jika UI) dan/atau routes/api.ts (jika API) — pakai handler(Controller,'method'), urutan ensureAuthenticated→AccessMiddleware (web) / ensureAuthenticatedApi→AccessMiddleware (api)
- views/be/default/{nama}/{index,create,edit}.ejs (jika UI; tiru pola users: tabel+search+pagination mt-4, form, status ikon fa-check-circle/fa-times-circle, dropdown relasi bila ada)
- Module.ts
- tests: tests/integration/{nama}Service.test.ts (pakai `new {Nama}Service()` + resetDb) + tests/api/{nama}.test.ts (jika API, pakai loginApi) + tests/bdd (jika UI: feature+steps)
- Registrasi: tambah TOKENS.{Nama}Repository & TOKENS.I{Nama}Service di src/tokens.ts; repo factory + useClass di src/container.ts; entity di src/config/ormconfig.ts entities[]
- Jika test menyentuh tabel baru, tambah DELETE di resetDb (tests/setup/jest.setup.ts) & world (tests/bdd/steps/world.ts) — child sebelum parent.
- Docs: tambah fitur ke README.md + endpoint ke docs/API.md (jika API).

PERHATIAN path import relatif: hitung kedalaman folder dengan benar (controller web/v1 → tokens = ../../../../../../tokens; lintas-modul tambah satu ../). Verifikasi via tsc.

VERIFIKASI WAJIB sebelum lapor (jalankan, perbaiki sampai SEMUA hijau):
1. `npm run lint:conventions` → lolos (pola+prinsip+kelengkapan)
2. `npx tsc --noEmit` → 0 error
3. `npm test` → semua hijau (termasuk test modul baru)
Jika gagal, baca pesan, perbaiki, ulang. JANGAN lapor selesai sebelum ketiganya hijau.
JANGAN jalankan migration ke DB produksi & jangan jalankan playwright (lambat). JANGAN start server.
Laporkan ringkas: daftar file dibuat + hasil 3 verifikasi.
```

### 3. Setelah subagent selesai (di context utama)
- Verifikasi ulang singkat: jalankan `npm run lint:conventions` + `npx tsc --noEmit` sendiri (cek cepat, bukan percaya buta).
- Jika modul ber-migration & user mau pakai di DB: tawarkan `npm run migration:run`.
- Jika ada UI & user mau muncul di menu: tawarkan tambah ke `src/resources/layouts/be/default/sidebar.ejs`.
- Lapor ke user: ringkasan + hasil verifikasi + langkah lanjutan opsional (migration, menu, permission seed untuk non-admin).

## Catatan token
Eksekusi berat (tulis ~15 file + retry verifikasi) terjadi di context subagent → context utama hanya menerima ringkasan. Untuk beberapa modul sekaligus, spawn beberapa subagent (boleh paralel bila tak saling bergantung; jika ada relasi, urutkan parent dulu).

## Larangan (selaras AGENTS.md)
Jangan: `new XService()/XController()` di route, `return error`/`instanceof Error`, `res.render(path.resolve)`, tipe kolom vendor, `process.env` di modules, skip test. Checker akan menolaknya — pastikan subagent memperbaiki, bukan menonaktifkan checker.
