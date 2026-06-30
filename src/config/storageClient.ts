import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import env from './env'

export interface StorageClient {
    put(key: string, buffer: Buffer): Promise<void>
    signatureUrl(key: string, ttlSeconds: number): string
    list(prefix: string, maxKeys: number): Promise<Array<{ name: string }>>
    delete(key: string): Promise<void>
}

// ---------------------------------------------------------------------------
// AWS Signature V4 presigned URL — synchronous, no extra deps.
// Dipakai driver S3 agar interface StorageClient tetap sync (kompatibel EJS).
// ---------------------------------------------------------------------------
function s3PresignedUrl(opts: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    endpoint: string | undefined
    ssl: boolean
    key: string
    ttlSeconds: number
}): string {
    const { accessKeyId, secretAccessKey, region, bucket, endpoint, ssl, key, ttlSeconds } = opts

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
    const datetimeStr = `${dateStr}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    // path-style bila endpoint diisi (MinIO, R2, OSS-S3-compat, dll)
    const pathStyle = !!endpoint
    const host = pathStyle
        ? endpoint!.replace(/^https?:\/\//, '')
        : `${bucket}.s3.${region}.amazonaws.com`
    const canonicalUri = pathStyle ? `/${bucket}/${key}` : `/${key}`

    const credScope = `${dateStr}/${region}/s3/aws4_request`
    const qp: [string, string][] = [
        ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
        ['X-Amz-Credential', `${accessKeyId}/${credScope}`],
        ['X-Amz-Date', datetimeStr],
        ['X-Amz-Expires', String(ttlSeconds)],
        ['X-Amz-SignedHeaders', 'host'],
    ].sort(([a], [b]) => a.localeCompare(b)) as [string, string][]

    const canonicalQS = qp.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')

    // Encode setiap segment path, biarkan '/' sebagai pemisah
    const encodedUri = canonicalUri.split('/').map(encodeURIComponent).join('/')

    const canonicalRequest = ['GET', encodedUri, canonicalQS, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n')
    const reqHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    const stringToSign = ['AWS4-HMAC-SHA256', datetimeStr, credScope, reqHash].join('\n')

    const hmac = (k: Buffer | string, d: string) => crypto.createHmac('sha256', k).update(d).digest()
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStr), region), 's3'), 'aws4_request')
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

    const protocol = ssl ? 'https' : 'http'
    return `${protocol}://${host}${canonicalUri}?${canonicalQS}&X-Amz-Signature=${signature}`
}

// ---------------------------------------------------------------------------
// Driver: Local filesystem
// ---------------------------------------------------------------------------
function buildLocalClient(basePath: string): StorageClient {
    const absBase = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath)

    return {
        async put(key, buffer) {
            const dest = path.join(absBase, key)
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.writeFileSync(dest, buffer)
        },
        signatureUrl(key) {
            // Return a web-relative URL; serve the base path as a static dir
            return `/${basePath}/${key}`.replace(/\/+/g, '/')
        },
        async list(prefix) {
            const dir = path.join(absBase, prefix)
            if (!fs.existsSync(dir)) return []
            return fs.readdirSync(dir)
                .filter((f) => !fs.statSync(path.join(dir, f)).isDirectory())
                .map((f) => ({ name: `${prefix}/${f}`.replace(/\/+/g, '/') }))
        },
        async delete(key) {
            const dest = path.join(absBase, key)
            if (fs.existsSync(dest)) fs.unlinkSync(dest)
        },
    }
}

// ---------------------------------------------------------------------------
// Driver: Alibaba Cloud OSS (via ali-oss SDK)
// ---------------------------------------------------------------------------
function buildOssClient(): StorageClient {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OSS = require('ali-oss')
    const { accessKeyId, secretAccessKey, endpoint, bucket, ssl } = env.storage
    const client = new OSS({ accessKeyId, accessKeySecret: secretAccessKey, endpoint, bucket, secure: ssl })

    return {
        async put(key, buffer) { await client.put(key, buffer) },
        signatureUrl(key, ttlSeconds) { return client.signatureUrl(key, { expires: ttlSeconds }) },
        async list(prefix, maxKeys) {
            const res = await client.list({ prefix, 'max-keys': maxKeys }, {})
            return (res?.objects || [])
                .filter((o: any) => o.name && o.name !== prefix && !o.name.endsWith('/'))
                .map((o: any) => ({ name: o.name }))
        },
        async delete(key) { await client.delete(key) },
    }
}

// ---------------------------------------------------------------------------
// Driver: AWS S3 / S3-compatible (MinIO, Cloudflare R2, Backblaze B2, dll)
// ---------------------------------------------------------------------------
function buildS3Client(): StorageClient {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3')
    const { accessKeyId, secretAccessKey, endpoint, bucket, region, ssl } = env.storage

    const clientCfg: any = {
        region: region || 'us-east-1',
        credentials: { accessKeyId, secretAccessKey },
    }
    if (endpoint) {
        const proto = ssl ? 'https' : 'http'
        clientCfg.endpoint = endpoint.startsWith('http') ? endpoint : `${proto}://${endpoint}`
        clientCfg.forcePathStyle = true
    }
    const s3 = new S3Client(clientCfg)

    return {
        async put(key, buffer) {
            await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }))
        },
        signatureUrl(key, ttlSeconds) {
            return s3PresignedUrl({
                accessKeyId, secretAccessKey,
                region: region || 'us-east-1',
                bucket: bucket!, endpoint, ssl, key, ttlSeconds,
            })
        },
        async list(prefix, maxKeys) {
            const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys }))
            return (res?.Contents || [])
                .filter((o: any) => o.Key && o.Key !== prefix && !o.Key.endsWith('/'))
                .map((o: any) => ({ name: o.Key }))
        },
        async delete(key) {
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        },
    }
}

// ---------------------------------------------------------------------------
// Lazy singleton — client dibuat saat pertama dipakai, bukan saat import
// ---------------------------------------------------------------------------
let _client: StorageClient | null = null

export function getStorageClient(): StorageClient {
    if (!_client) {
        const { driver, basePath, accessKeyId, secretAccessKey } = env.storage
        if (driver === 'local') {
            _client = buildLocalClient(basePath)
        } else {
            if (!accessKeyId || !secretAccessKey) {
                throw new Error('Storage belum dikonfigurasi (STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY kosong)')
            }
            _client = driver === 's3' ? buildS3Client() : buildOssClient()
        }
    }
    return _client
}

export const storageConfig = env.storage
