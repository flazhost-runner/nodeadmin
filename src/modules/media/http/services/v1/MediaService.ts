import { injectable } from 'tsyringe'
import crypto from 'crypto'
import fileService from '../../../../../services/fileService'
import Module from '../../../Module'
import { IMediaService } from './IMediaService'
import { AppError } from '@flazhost-nodeadmin/core'

@injectable()
export default class MediaService implements IMediaService {
    /** URL proxy stabil utk sebuah key (route media.file → 302 presigned). */
    public viewUrl(key: string): string {
        const name = key.startsWith(Module.editorPrefix) ? key.slice(Module.editorPrefix.length) : key
        return `/admin/v1/media/file/${name}`
    }

    public async list(): Promise<{ name: string; url: string }[]> {
        return fileService.listFiles(Module.editorPrefix, (key) => this.viewUrl(key))
    }

    public async upload(file: Express.Multer.File): Promise<{ name: string; url: string; key: string }> {
        if (!file) {
            throw new AppError('File tidak ditemukan', 400)
        }
        const ext = (file.originalname.split('.').pop() || '').toLowerCase()
        const unique = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
        const uploadPath = `${Module.editorPrefix}${unique}.${ext}`

        // uploadFile memvalidasi magic-byte (sharp) & konversi ke webp; SVG tak
        // di-allowlist sehingga aman dari SVG-XSS. Tanpa ACL (bucket private).
        const savedName = await fileService.uploadFile(uploadPath, file.buffer)
        return {
            name: savedName.split('/').pop() || savedName,
            url: this.viewUrl(savedName), // URL proxy stabil
            key: savedName,
        }
    }

    /** Presigned URL OSS untuk objek editor (dipakai proxy route saat redirect). */
    public signedUrl(name: string): string {
        return fileService.getSignedUrl(`${Module.editorPrefix}${name}`)
    }

    public async delete(key: string): Promise<void> {
        // Validasi key: hanya boleh di folder editor (anti path-traversal).
        if (!/^modules\/media\/editor\/[A-Za-z0-9._-]+$/.test(key)) {
            throw new AppError('Key tidak valid', 400)
        }
        await fileService.deleteFile(key)
    }
}
