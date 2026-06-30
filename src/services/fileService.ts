import path from 'path'
import { getStorageClient, storageConfig } from '../config/storageClient'
import sharp from 'sharp'

class FileService {
    async uploadFile(fileName: string, fileContent: Buffer, is_public: boolean = false): Promise<string> {
        try {
            const ext = path.extname(fileName).toLowerCase().replace('.', '')
            const dir = path.posix.dirname(fileName)
            const stem = path.basename(fileName, path.extname(fileName))
            const basename = dir === '.' ? stem : `${dir}/${stem}`

            // Validasi magic-byte: pastikan konten benar-benar gambar
            const ALLOWED = ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp', 'gif']
            if (!ALLOWED.includes(ext)) throw new Error('Ekstensi file tidak diizinkan')
            const meta = await sharp(fileContent).metadata()
            if (!meta.format) throw new Error('File bukan gambar yang valid')

            const isConvertible = ['jpg', 'jpeg', 'png', 'tiff', 'bmp'].includes(ext)
            let finalBuffer = fileContent
            let finalName = fileName

            if (isConvertible) {
                finalBuffer = await sharp(fileContent).webp({ quality: 80 }).toBuffer()
                finalName = `${basename}.webp`
            }

            // Bucket tetap private — akses publik via presigned URL / proxy route
            await getStorageClient().put(finalName, finalBuffer)
            return finalName
        } catch (e) {
            console.error('Upload/Convert error:', e)
            throw e
        }
    }

    getFile(fileName: string, is_public: boolean = false): string {
        if (storageConfig.driver !== 'local' && (!storageConfig.accessKeyId || !storageConfig.secretAccessKey)) {
            return fileName.startsWith('/') ? fileName : `/${fileName}`
        }
        if (is_public) {
            return this._publicUrl(fileName)
        }
        return getStorageClient().signatureUrl(fileName, 3600 * 6)
    }

    getSignedUrl(fileName: string, ttlSeconds: number = 600): string {
        if (storageConfig.driver !== 'local' && (!storageConfig.accessKeyId || !storageConfig.secretAccessKey)) {
            return fileName.startsWith('/') ? fileName : `/${fileName}`
        }
        return getStorageClient().signatureUrl(fileName, ttlSeconds)
    }

    async listFiles(prefix: string, urlFor?: (key: string) => string): Promise<{ name: string; url: string }[]> {
        if (storageConfig.driver !== 'local' && (!storageConfig.accessKeyId || !storageConfig.secretAccessKey)) return []
        try {
            const objects = await getStorageClient().list(prefix, 100)
            return objects.map((o) => ({ name: o.name, url: urlFor ? urlFor(o.name) : this.getFile(o.name) }))
        } catch (e) {
            console.error('List files error:', e)
            return []
        }
    }

    async deleteFile(fileName: string): Promise<any> {
        try {
            return await getStorageClient().delete(fileName)
        } catch (e) {
            return e
        }
    }

    // Bangun public URL berdasarkan driver & konfigurasi
    private _publicUrl(fileName: string): string {
        const { driver, basePath, bucket, endpoint, region, ssl } = storageConfig
        const protocol = ssl ? 'https' : 'http'
        if (driver === 'local') {
            return `/${basePath}/${fileName}`.replace(/\/+/g, '/')
        }
        if (driver === 's3') {
            if (endpoint) {
                // Path-style: MinIO, Cloudflare R2, S3-compatible custom
                const host = endpoint.replace(/^https?:\/\//, '')
                return `${protocol}://${host}/${bucket}/${fileName}`
            }
            // Virtual-hosted: AWS S3
            return `${protocol}://${bucket}.s3.${region || 'us-east-1'}.amazonaws.com/${fileName}`
        }
        // OSS virtual-hosted: bucket.endpoint/key
        return `${protocol}://${bucket}.${endpoint}/${fileName}`
    }
}

export default new FileService()
