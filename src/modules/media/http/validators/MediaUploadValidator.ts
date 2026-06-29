import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
import app from '../../../../config/app'

/**
 * Multer untuk upload gambar editor (memoryStorage). Hanya menerima image/*;
 * validasi magic-byte sebenarnya dilakukan fileService.uploadFile (sharp).
 * Batas ukuran mengikuti app.max_photo_size (≈2MB).
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: app.max_photo_size },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('File harus berupa gambar'))
        }
    },
})

export { upload }
