# NodeAdmin Derivative Apps — Audit Index

Referensi standar: [`../NODEADMIN_STANDARD.md`](../NODEADMIN_STANDARD.md)

Setiap app dicek satu per satu. Hasil per app disimpan di file masing-masing.

## Daftar App — Round 3 Re-audit (2026-06-26)

| App | Stack | ✅ | ⚠️ | ❌ | Total | Skor | Round 2 | Awal |
|-----|-------|---|---|---|-------|------|---------|------|
| [KotlinAdmin](./KotlinAdmin_audit.md) | Kotlin / Ktor | 98 | 0 | 1 | 99 | **99%** | 83% | 44% |
| [NestAdmin](./NestAdmin_audit.md) | Node.js / NestJS | 121 | 2 | 0 | 123 | **98%** | 90% | 44% |
| [GoAdmin](./GoAdmin_audit.md) | Go / Gin | 118 | 4 | 0 | 122 | **97%** | 84% | 51% |
| [PHPAdmin](./PHPAdmin_audit.md) | PHP 8.3 native | 135 | 4 | 0 | 139 | **97%** | 91% | 57% |
| [SpringAdmin](./SpringAdmin_audit.md) | Java / Spring Boot | 141 | 4 | 0 | 145 | **97%** | 88% | 58% |
| [LaravelAdmin](./LaravelAdmin_audit.md) | PHP / Laravel | 128 | 5 | 0 | 133 | **96%** | 86% | 37% |
| [RustAdmin](./RustAdmin_audit.md) | Rust / Rocket | 108 | 6 | 0 | 114 | **95%** | 86% | 77% |
| [DotNetAdmin](./DotNetAdmin_audit.md) | C# / ASP.NET Core | 122 | 8 | 1 | 131 | **93%** | 84% | 43% |
| [CppAdmin](./CppAdmin_audit.md) | C++ / Drogon | 125 | 7 | 2 | 134 | **93%** | 88% | 40% |
| [DjangoAdmin](./DjangoAdmin_audit.md) | Python / Django | 123 | 7 | 2 | 135 | **91%** | 85% | 39% |

> Skor = ✅ / Total item. Diurutkan dari yang paling sesuai standar.

## Progres Keseluruhan

| Metrik | Awal | Round 1 | Round 3 | Delta Total |
|--------|------|---------|---------|-------------|
| Rata-rata similarity | **49%** | **87%** | **96%** | **+47%** |
| App ≥ 90% | 0 / 10 | 2 / 10 | 9 / 10 | +9 |
| App ≥ 95% | 0 / 10 | 0 / 10 | 5 / 10 | +5 |
| Total ✅ (gabungan semua app) | ~535 | 1103 | 1219 | +684 |
| Total ❌ (gap kritis) | ~281 | 51 | 6 | -275 |

## Seed Check

| Cek | File | Tanggal | Hasil |
|-----|------|---------|-------|
| Default admin seed (§1.8) | [seed_check.md](./seed_check.md) | 2026-06-26 | ✅ Semua 10 app sesuai standar (setelah fix) |

## Status Legend

| Simbol | Arti |
|--------|------|
| ⬜ Belum | Belum diaudit |
| 🔄 Sedang | Audit sedang berjalan |
| ✅ Selesai | Audit selesai, tidak ada gap |
| ⚠️ Gap | Ada gap signifikan vs standar |
