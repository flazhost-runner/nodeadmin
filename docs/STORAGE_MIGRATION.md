# Storage Migration: OSS-specific → Generic Storage Adapter

Dokumen ini mencatat semua perubahan yang diperlukan untuk mengganti variabel OSS-specific
menjadi variabel storage yang bersifat umum (compatible OSS + S3 dan provider lain yang
S3-compatible: MinIO, Cloudflare R2, Backblaze B2, dll).

**NodeAdmin** adalah implementasi referensi. Setelah NodeAdmin selesai, gunakan dokumen ini
sebagai checklist eksekusi untuk setiap app turunan.

---

## 1. Env Vars: Penamaan Baru

### Mapping lama → baru

| Var Lama (OSS-specific) | Var Baru (Generic) | Keterangan |
|---|---|---|
| `OSS_ACCESS_ID` | `STORAGE_ACCESS_KEY_ID` | accessKeyId berlaku universal |
| `OSS_ACCESS_KEY` | `STORAGE_SECRET_ACCESS_KEY` | secretAccessKey term S3-standard |
| `OSS_ENDPOINT` | `STORAGE_ENDPOINT` | endpoint custom (OSS/MinIO/R2) |
| `OSS_BUCKET` | `STORAGE_BUCKET` | sama |
| `OSS_SSL` | `STORAGE_SSL` | sama, default: `true` |
| _(tidak ada)_ | `STORAGE_DRIVER` | `oss` \| `s3` — wajib baru |
| _(tidak ada)_ | `STORAGE_REGION` | wajib untuk S3 AWS; opsional untuk OSS |

### Blok .env baru (ganti blok OSS lama)

```env
# Storage (object storage untuk upload file)
# STORAGE_DRIVER: oss | s3
# - oss  : Alibaba Cloud OSS (endpoint wajib, region diabaikan)
# - s3   : AWS S3 atau provider S3-compatible (MinIO, Cloudflare R2, Backblaze B2, dll)
#          Untuk AWS S3 murni: kosongkan STORAGE_ENDPOINT, isi STORAGE_REGION.
#          Untuk S3-compatible custom (MinIO, R2): isi STORAGE_ENDPOINT + STORAGE_REGION.
STORAGE_DRIVER=oss
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_ENDPOINT=oss-ap-southeast-5.aliyuncs.com
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_SSL=true
```

---

## 2. Kontrak Interface Storage Adapter

Semua driver harus mengimplementasikan 4 operasi ini. Nama method mengikuti konvensi
NodeAdmin (sebagai referensi); app turunan menyesuaikan naming convention bahasanya.

```
put(key, buffer)                  → upload file ke bucket
signatureUrl(key, ttlSeconds)     → generate presigned URL (akses private object)
list(prefix, maxKeys)             → list objects dalam folder/prefix
delete(key)                       → hapus object dari bucket
```

**Catatan penting:**
- Operasi `signatureUrl` di OSS menggunakan method `signatureUrl()`, di S3 menggunakan
  `getSignedUrl` dari `@aws-sdk/s3-request-presigner`.
- Operasi `list` di OSS mengembalikan `res.objects[].name`; di S3 `res.Contents[].Key`.
- Semua operasi ini harus di-wrap dalam satu adapter/service agar caller (FileService)
  tidak perlu tahu driver apa yang aktif.

---

## 3. NodeAdmin — File yang Diubah

### 3.1 `src/config/env.ts`

**Ganti** blok `oss:` dengan:

```typescript
storage: {
    driver: (process.env.STORAGE_DRIVER || 'oss') as 'oss' | 's3',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY as string,
    endpoint: process.env.STORAGE_ENDPOINT,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    ssl: bool('STORAGE_SSL', true),
},
```

### 3.2 `src/config/ossconfig.ts` → diganti `src/config/storageClient.ts`

File lama dihapus, diganti dengan adapter pattern:

```typescript
// src/config/storageClient.ts
import env from './env'

export interface StorageClient {
    put(key: string, buffer: Buffer): Promise<void>
    signatureUrl(key: string, ttlSeconds: number): string
    list(prefix: string, maxKeys: number): Promise<Array<{ name: string }>>
    delete(key: string): Promise<void>
}

// Lazy init — client dibuat saat pertama dipakai, bukan saat import
let _client: StorageClient | null = null

function buildOssClient(): StorageClient { ... }   // pakai ali-oss
function buildS3Client(): StorageClient { ... }    // pakai @aws-sdk/client-s3

export function getStorageClient(): StorageClient {
    if (!_client) {
        const { driver, accessKeyId, secretAccessKey } = env.storage
        if (!accessKeyId || !secretAccessKey) {
            throw new Error('Storage belum dikonfigurasi (STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY kosong)')
        }
        _client = env.storage.driver === 's3' ? buildS3Client() : buildOssClient()
    }
    return _client
}

export const storageConfig = env.storage
```

### 3.3 `src/services/fileService.ts`

- Ganti import `oss, { ossConfig }` → `{ getStorageClient, storageConfig }`
- Ganti semua `oss.put(...)` → `getStorageClient().put(...)`
- Ganti `oss.signatureUrl(...)` → `getStorageClient().signatureUrl(...)`
- Ganti `oss.list(...)` → `getStorageClient().list(...)`
- Ganti `oss.delete(...)` → `getStorageClient().delete(...)`
- Ganti guard `!ossConfig.accessKeyId` → `!storageConfig.accessKeyId`
- Method `getFile` yang build public URL: sesuaikan dengan `storageConfig` (tidak lagi `ossConfig`)

### 3.4 `.env.example` (root + `template/` + `template-api/`)

Ganti blok OSS lama dengan blok baru (lihat §1 di atas).
Ketiga file `.env.example` harus identik di bagian storage.

### 3.5 Dependencies (`package.json`)

Tambahkan:
```
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```
`ali-oss` tetap dipertahankan (tidak dihapus).

---

## 4. App Turunan — Checklist Per App

### 4.1 GoAdmin (Go / Gin)

**File config** (biasanya `config/config.go` atau `internal/config/`):
- Rename struct field `OSS` → `Storage`
- Field: `Driver`, `AccessKeyID`, `SecretAccessKey`, `Endpoint`, `Bucket`, `Region`, `SSL bool`

**Adapter interface** (`internal/storage/storage.go`):
```go
type Client interface {
    Put(key string, data []byte) error
    SignedURL(key string, ttl time.Duration) (string, error)
    List(prefix string, maxKeys int) ([]string, error)
    Delete(key string) error
}
```

**Driver OSS**: `github.com/aliyun/aliyun-oss-go-sdk/oss`
**Driver S3**: `github.com/aws/aws-sdk-go-v2/service/s3` + `s3manager`

**Env vars**: sama persis (Go baca dari env langsung atau via godotenv).

---

### 4.2 RustAdmin (Rust / Rocket)

**File config** (`src/config.rs` atau `src/config/mod.rs`):
- Rename struct field `oss` → `storage`
- Field: `driver: String`, `access_key_id: String`, `secret_access_key: String`,
  `endpoint: Option<String>`, `bucket: String`, `region: Option<String>`, `ssl: bool`

**Trait adapter** (`src/storage/mod.rs`):
```rust
pub trait StorageClient: Send + Sync {
    async fn put(&self, key: &str, data: Bytes) -> Result<(), AppError>;
    async fn signed_url(&self, key: &str, ttl_secs: u64) -> Result<String, AppError>;
    async fn list(&self, prefix: &str, max_keys: i32) -> Result<Vec<String>, AppError>;
    async fn delete(&self, key: &str) -> Result<(), AppError>;
}
```

**Driver OSS**: `aliyun-oss` crate atau S3-compatible endpoint via `aws-sdk-s3` dengan custom endpoint
**Driver S3**: `aws-sdk-s3` crate (sudah ada di ekosistem Rust)

**Env vars**: sama persis (Rust baca via `std::env::var` atau `dotenv` crate).

---

### 4.3 PHPAdmin (PHP 8.3 native)

**File config** (`src/Config/AppConfig.php` atau env helper):
- Rename env keys (lihat §1)
- Tambah `STORAGE_DRIVER` ke config reader

**Interface** (`src/Storage/StorageClientInterface.php`):
```php
interface StorageClientInterface {
    public function put(string $key, string $data): void;
    public function signedUrl(string $key, int $ttlSeconds): string;
    public function list(string $prefix, int $maxKeys): array; // array of string keys
    public function delete(string $key): void;
}
```

**Driver OSS**: `aliyuncs/oss-sdk-php`
**Driver S3**: `aws/aws-sdk-php` (S3Client)

**Factory** (`src/Storage/StorageFactory.php`): baca `STORAGE_DRIVER`, return instance yang sesuai.

---

### 4.4 NestAdmin (NestJS)

Karena ekosistem Node.js, perubahan identik dengan NodeAdmin (§3).
Perbedaan hanya pada lokasi file sesuai struktur NestJS:

- Config: `src/config/env.ts` atau modul `ConfigService`
- Adapter: `src/storage/storage.service.ts` (injectable NestJS service)
- Interface: `src/storage/storage.interface.ts`

---

### 4.5 App turunan lain (DjangoAdmin, SpringAdmin, KotlinAdmin, dll)

Prinsip sama:
1. Rename env vars sesuai tabel di §1.
2. Buat interface/trait/protocol dengan 4 method (put, signedUrl, list, delete).
3. Buat dua implementasi konkret (OssDriver dan S3Driver).
4. Factory/provider memilih implementasi berdasarkan `STORAGE_DRIVER`.
5. FileService/MediaService hanya kenal interface, tidak kenal driver.

---

## 5. Aturan Umum (berlaku di semua app)

1. **Lazy init**: client storage jangan dibuat saat startup/import. Buat saat method pertama dipanggil.
   Ini mencegah crash di environment dev tanpa kredensial storage.

2. **Graceful degradation**: bila `ACCESS_KEY_ID` atau `SECRET_ACCESS_KEY` kosong, operasi
   read (getFile/signedUrl/list) fallback ke path lokal — jangan crash. Operasi write (upload)
   boleh throw error.

3. **Bucket tetap private**: jangan set ACL `public-read` per-object. Akses publik via
   presigned URL (TTL pendek) atau proxy route di app.

4. **Env var `STORAGE_DRIVER`**: default `oss` agar backward-compatible dengan deployment lama
   yang belum set var ini. Jangan paksa user set ulang jika sudah jalan dengan OSS.

5. **`STORAGE_REGION`**: wajib untuk AWS S3 murni (`us-east-1`, `ap-southeast-1`, dll).
   Untuk OSS Alibaba, region diabaikan (sudah di-encode dalam endpoint).
   Untuk S3-compatible custom (MinIO, R2), region biasanya `auto` atau `us-east-1`.

6. **`STORAGE_ENDPOINT`**: untuk AWS S3 murni, kosongkan (SDK resolve otomatis).
   Untuk OSS dan S3-compatible custom, wajib diisi.

7. **`STORAGE_SSL`**: default `true`. Set `false` hanya untuk MinIO lokal tanpa TLS.
