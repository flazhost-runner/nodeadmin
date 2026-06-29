# CLAUDE.md

**Aturan pengembangan lengkap ada di [`AGENTS.md`](AGENTS.md) — baca & patuhi itu sebagai sumber kebenaran.** File ini hanya catatan ringkas untuk Claude Code.

## Wajib sebelum menulis/mengubah kode
1. Baca `AGENTS.md` (alur, prinsip SOLID/DI, error handling, security, larangan).
2. **Fitur/modul baru**: simpulkan artefak via "Matriks Kebutuhan Artefak" di AGENTS.md, **sajikan rencana artefak** ke user; tanya bila ambigu (UI vs API-only, read-only vs CRUD, perlu API?). Lalu ikuti `docs/MODULE_GUIDE.md`.
3. Sebelum menganggap selesai: `npm run lint:conventions` (cek pola + kelengkapan kontekstual) → lolos, lalu `npx tsc --noEmit` & `npm test`.

## Inti yang TIDAK boleh dilanggar
- DI: service/controller `@injectable`, di-inject (bukan `new`); service `implements I*Service`.
- Error: service `throw AppError`; **dilarang** `return error` / `instanceof Error`.
- Render web: `renderView()`; route: `handler(Ctrl, 'method')`.
- Env: hanya via `src/config/env.ts` (tak ada `process.env` di `modules/`).
- Entity: tipe kolom portabel (lihat AGENTS.md).
- Tiap modul baru: + test + update `README.md`/`docs/API.md`.

## Catatan Claude Code
- Gunakan plan mode untuk perubahan multi-file besar.
- Verifikasi nyata (jalankan checker/test), jangan klaim tanpa bukti.
- Pola acuan termutakhir: modul `access` & `setting`.
