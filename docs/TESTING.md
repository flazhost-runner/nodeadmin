# Testing — Node Admin

Aplikasi memiliki suite pengujian menyeluruh: **Unit, Integration, API, Security, Smoke, E2E, dan BDD**, plus Regression & DB-Compatibility. CI menjalankan Jest + audit + matrix DB; **E2E dijalankan lokal** (lihat Catatan E2E).

## Stack

| Layer | Tool |
|-------|------|
| Test runner | Jest + ts-jest |
| HTTP assertion | supertest (in-process, tanpa listen port) |
| DB test | better-sqlite3 (in-memory) — app dialect-agnostic |
| Redis/OSS | di-mock (`jest.mock`) |
| E2E + browser-compat | Playwright (Chromium/Firefox/WebKit) |
| BDD | @cucumber/cucumber (Gherkin) |

## Konfigurasi

- **`.env.test`** — env khusus test: SQLite in-memory, secret dummy, OSS dummy, `NODE_ENV=test`.
- **`jest.config.js`** — ts-jest; `setupFiles` memuat `.env.test` sebelum modul; `setupFilesAfterEnv` init DataSource + helper seed.
- **`tests/setup/`**:
  - `loadEnv.ts` — muat `.env.test` paling awal.
  - `jest.setup.ts` — mock OSS & Redis, init DataSource SQLite, `resetDb()` (seed admin/user/role/setting).
  - `helpers.ts` — `loginWeb()` (cookie+CSRF), `loginApi()` (JWT), `getCsrf()`.

> Penting: app bisa di-import tanpa auto-listen karena bootstrap dijaga `if (require.main === module)` di `src/index.ts`. Saat `NODE_ENV=test`, session memakai MemoryStore (tanpa Redis).

## Struktur

```
tests/
├── setup/          # loadEnv, jest.setup, helpers
├── unit/           # helper murni (functions, otp, themes, env, date)
├── integration/    # service ↔ SQLite (user/role/setting)
├── api/            # endpoint via supertest (auth, access.user, setting)
├── security/       # RBAC, CSRF, rate-limit, JWT, mass-assign
├── smoke/          # health, login, DB connect
├── e2e/            # Playwright (auth, theme) + playwright.config.ts
└── bdd/
    ├── features/   # *.feature (Gherkin)
    └── steps/      # step definitions + world (supertest)
```

## Menjalankan

```bash
npm test                  # semua Jest (unit+integration+api+security+smoke)
npm run test:unit
npm run test:integration
npm run test:api
npm run test:security
npm run test:smoke
npm run test:coverage     # + laporan coverage di coverage/
npm run test:bdd          # Cucumber (in-process supertest, cepat)
npm run test:e2e          # Playwright — butuh app + MySQL + Redis hidup
```

### Catatan E2E
- **E2E dijalankan LOKAL saja, bukan di CI** (lambat + butuh browser engine + MySQL/Redis; dulu non-blocking di CI sehingga tak bernilai sebagai gate). Jalankan terhadap perubahan nyata sebelum push.
- Lokal default Chromium: `E2E_BROWSERS=chromium npm run test:e2e`.
- Firefox/WebKit butuh system deps (`sudo npx playwright install-deps`).
- Playwright `webServer` menjalankan `npm run start:dev` (pakai DB nyata + admin seed `admin@admin.com` / `12345678`).

## Pemetaan jenis testing

| Jenis | Di mana |
|-------|---------|
| Unit | `tests/unit/` |
| Integration | `tests/integration/` |
| API | `tests/api/` |
| Security | `tests/security/` |
| Smoke | `tests/smoke/` |
| E2E | `tests/e2e/` (Playwright) |
| BDD | `tests/bdd/` (Cucumber) |
| Regression | suite Jest dijalankan CI tiap push |
| Compatibility | CI matrix MySQL/Postgres (migration); E2E multi-browser lokal |

## Menulis test baru

- **Unit** (helper murni): import langsung, tanpa DB.
- **Integration** (service): `new XService()` (dual-mode DI → pakai default repo), panggil `resetDb()` di `beforeEach`.
- **API**: `loginWeb()`/`loginApi()` dari `helpers.ts`, lalu `request(app)`. Untuk mutasi web sertakan `_csrf` (ambil via `getCsrf`).
- **BDD**: tambah `.feature` + step di `tests/bdd/steps`. World menyediakan `agent` (supertest) + seed di hook `Before`.

## CI

`.github/workflows/ci.yml`:
- **test** — `tsc --noEmit` + `jest --coverage`.
- **audit** — `npm audit`.
- **db-compat** — migrasi di matrix MySQL + Postgres (service containers).

> **E2E tidak di CI.** Playwright (3 browser) dijalankan lokal: `npm run test:e2e` (lihat Catatan E2E).
