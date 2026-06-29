# Arsitektur — Node Admin

Dokumen ini menjelaskan struktur, lapisan, dan keputusan desain aplikasi. Ditujukan untuk developer yang akan mengembangkan/menambah fitur.

## Gambaran Umum

Aplikasi **modular per fitur**. Setiap modul (`src/modules/<modul>`) berdiri sendiri dengan lapisannya, dan dimuat otomatis saat startup (`loadRoutes` di `src/index.ts` memindai `routes/web.ts` & `routes/api.ts` tiap modul).

```
Request
  → Route (named-routes, middleware: auth → RBAC → validator → upload)
  → handler() [resolve controller dari DI container, lazy per-request]
  → Controller (parsing req, panggil service, render/JSON response)
  → Service (logika bisnis, throw AppError bila gagal)
  → Repository (TypeORM, di-inject)
  → Entity / DB
  ↘ error apa pun → errorHandler middleware (terpusat)
```

## Lapisan

| Lapisan | Lokasi | Tanggung jawab |
|---------|--------|----------------|
| Route | `modules/*/routes/{web,api}.ts` | Definisi URL + middleware. Bind controller via `handler(Ctrl, method)`. |
| Middleware | `modules/*/http/middleware`, `src/middleware` | Auth, RBAC, CSRF, rate-limit, error handler. |
| Validator | `modules/*/http/validators` | Joi / express-validator + multer. `stripUnknown` (anti mass-assignment). |
| Controller | `modules/*/http/controllers/{web,api}/v1` | Orkestrasi HTTP. `@injectable`, service di-inject. Tidak ada logika bisnis. |
| Service | `modules/*/http/services/v1` | Logika bisnis. `@injectable`, implement `I*Service`, repo di-inject. `throw` saat gagal. |
| Entity | `modules/*/models/*.entity.ts` | Model TypeORM. Tipe kolom portabel (dialect-agnostic). |
| View | `modules/*/views/be/default`, `src/resources/layouts/be/default` | EJS + Tailwind. Dirender via `renderView()`. |

## RBAC (Route-Driven)

Model otorisasi **bukan subject-based** (mis. bukan `user.delete`), melainkan **diturunkan dari route**:

- **Permission = `(name, method, guard_name)`** — `name` = **nama named-route** (mis. `admin.v1.access.user.delete`), `method` = HTTP method (GET/POST/PUT/DELETE), `guard_name` = `api` bila nama berawalan `api.`, selain itu `web`.
- **Auto-sync dari registry route** — `PermissionService.getAllRegisteredRoute(app)` memindai SELURUH named-route yang terdaftar dan meng-upsert permission yang belum ada (idempoten). Dipicu lazy saat membuka halaman Permission. **Tidak ada daftar permission hardcoded.**
- **`AccessMiddleware` tanpa argumen** — middleware menurunkan `(name, method)` dari request berjalan (`req.route.path` + `req.method` → `getNameByPathAndMethod`) lalu mengecek apakah salah satu role user punya permission dengan **`name` DAN `method`** yang cocok. Karena itu `GET` vs `DELETE` pada path yang sama = izin berbeda.
- **Administrator bypass** — role `Administrator` melewati semua pengecekan.
- **Gating UI** — sidebar memakai `hasAccess(name, method)` (mis. `hasAccess('admin.v1.access.user.index','GET')`) untuk menyembunyikan menu yang tak diizinkan.
- **Urutan middleware WAJIB**: `authenticated → authorize` (autentikasi dulu, baru cek izin).

> **Catatan lintas-port:** registry named-route adalah sumber kebenaran RBAC. Port lain WAJIB meniru model ini (mis. Go/Gin: reverse-lookup `(method, FullPath)` → nama route dari registry, middleware `Authorize()` tanpa argumen). **JANGAN** memakai daftar subject tetap — itu menyimpang dari NodeAdmin (lihat anti-pattern di PORTING_GUIDE).

## Dependency Injection (SOLID-D)

Menggunakan **tsyringe** (`reflect-metadata` + decorator).

- **Token** (`src/tokens.ts`) — Symbol untuk repository & service. File terpisah dari container untuk menghindari circular import.
- **Container** (`src/container.ts`) — registrasi:
  - Repository sebagai **factory lazy** (`getRepository` hanya valid setelah `AppDataSource.initialize()`).
  - Service via `useClass` (`TOKENS.IUserService → UserService`).
- **Service** — `@injectable()` + constructor injection. **Dual-mode**: parameter default (`= AppDataSource.getRepository(X)`) agar `new XService()` tetap jalan di unit/integration test tanpa container.
- **Controller** — `@injectable()`, inject interface service (bukan kelas konkret).
- **Route** — `handler(Ctrl, method)` (`src/utils/routeBinding.ts`) me-`resolve` controller dari container **per-request** (lazy, karena `loadRoutes` jalan sebelum DataSource init), dan meneruskan error ke `next()`.

Contoh:
```ts
@injectable()
export default class UserService implements IUserService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepo = AppDataSource.getRepository(User),
    @inject(TOKENS.RoleRepository) private roleRepo = AppDataSource.getRepository(Role),
  ) {}
}
```

## Error Handling (Clean Code / SOLID-S)

- **`src/errors/AppError.ts`** — `AppError(msg, status)` + turunan: `NotFoundError(404)`, `ConflictError(409)`, `ValidationError(422)`, `UnauthorizedError(401)`.
- Service **melempar** error ini (bukan `return error`).
- **`src/middleware/errorHandler.ts`** (4-arg, terdaftar terakhir) menangkap semua error:
  - Path `/api/` → JSON via `ResponseHandler.error`.
  - Web → flash message + redirect.
  - Non-`AppError` → 500 generik (tanpa bocor detail di production).
- `handler()` membungkus `.catch(next)` sehingga error async otomatis sampai ke middleware.

## Konfigurasi (Twelve-Factor)

- **`src/config/env.ts`** — satu-satunya sumber env, sudah dikonversi tipe (number/boolean) & divalidasi. Secret wajib (`SESSION_SECRET`, `JWT_SECRET`) → fail-fast di production.
- **`APP_MODE`** (`env.app.mode`) — `full` (UI web + REST API, default) atau `api` (REST API saja). Entry tunggal `src/index.ts` bercabang via env ini: mode `full` memasang LocalStrategy + sesi web + static + layout; mode `api` hanya JWT (stateless). Varian api-only = source full **dikurangi file UI utuh** (diff murni additive — file shared identik di kedua varian), sehingga install api-only bisa di-upgrade ke full kapan saja lewat `npx nodeadmin add-ui` (set `APP_MODE=full` + salin file UI yang absent, tanpa konflik).
- **`src/config/ormconfig.ts`** — DataSource dialect-agnostic (baca `env.db.type`), pool, timezone kondisional.
- **`src/config/app.ts`** — `be_view`/`be_layout` (set view aktif = `be/default`).
- **`src/config/themes.ts`** — palet 9 tema (template switcher).

## Helper DRY

| Helper | Lokasi | Guna |
|--------|--------|------|
| `paginate(query, conditions)` | `helpers/functions.ts` | skip/take + paginate_data seragam |
| `ciLike(col, param, val)` | `helpers/functions.ts` | LIKE case-insensitive lintas-dialek |
| `removeEmptyFields(obj)` | `helpers/functions.ts` | bersihkan field kosong |
| `renderView(res, modulePath, view, locals, layout?)` | `utils/view.ts` | render EJS + inject be_view/layout |
| `handler(Ctrl, method)` | `utils/routeBinding.ts` | bind controller lazy via DI |
| `generateOTP/hashOTP/verifyOTP` | `helpers/otp.ts` | OTP aman |

## State & Skalabilitas

- **Session** → Redis (`connect-redis`). Stateless app → horizontal scaling tanpa sticky session.
- **File** → Alibaba OSS (`services/fileService.ts`), bukan disk lokal.
- **Setting** → cache in-memory TTL 60s (`services/settingCache.ts`), invalidasi saat update.
- **Graceful shutdown** → SIGTERM/SIGINT menutup Redis + DataSource.

## Frontend Template (Landing)

Halaman publik `/` memakai katalog 640 landing [opentailwind](https://github.com/lindoai/opentailwind). Dua service di modul `home` (`http/services/v1`):

| Service | Tugas |
|---------|-------|
| `FeCatalogService` (`IFeCatalogService`) | Sumber katalog: fetch GitHub **tree API sekali**, cache memori (TTL 6 jam) + disk (`public/fe/templates/_catalog.json`); fallback ke katalog kurasi (`FE_TEMPLATES`) bila offline. `paginate(filter, pinSlug)` — search (`q_name`) + filter (`q_category`) + slice in-memory (server-side), `pinSlug` menyematkan template aktif ke halaman pertama. `previewHtml(slug)` — proxy HTML mentah on-demand (validasi slug via katalog, anti-SSRF). |
| `FeTemplateService` (`IFeTemplateService`) | Template aktif: `ensure(slug)` unduh & cache file lokal saat dipilih; `getActiveHtml()` sajikan landing. Slug divalidasi via pola `FE_TEMPLATE_SLUG_RE` (mencakup 640, bukan enum statis). |

Alur UI (Setting → Frontend Template): katalog paginated di-render server-side; **thumbnail** = iframe ber-`srcdoc` (HTML diambil dari endpoint `admin.v1.setting.fe_preview` lalu di-cache **localStorage** browser, lazy-load via `IntersectionObserver`); klik kartu → **modal preview** penuh (reuse cache). Beban server minimal — server hanya proxy HTML sekali per template.

**Sample:** template default (`views/fe/default` + `resources/layouts/fe/default`) **mengikat data Setting** (name, logo, description, email/phone/address, copyright) dengan guard + fallback. Ini contoh hidup pola binding; 639 template lain disajikan sebagai HTML statis (preview desain murni).

## Menambah Modul Baru (panduan singkat)

1. Buat folder `src/modules/<modul>` dengan `routes/`, `http/controllers`, `http/services`, `models`, `views`, `Module.ts`.
2. Service: `@injectable()` + `implements I<Modul>Service` + inject repository (dual-mode).
3. Tambah token di `src/tokens.ts` + registrasi di `src/container.ts`.
4. Controller: `@injectable()` + inject interface.
5. Route: pakai `handler(Controller, 'method')`.
6. Tambah test (lihat `docs/TESTING.md`).
