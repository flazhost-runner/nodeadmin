/** Kontrak MediaService (file manager rich text editor). */
export interface IMediaService {
    /** URL proxy stabil utk sebuah key OSS. */
    viewUrl(key: string): string
    /** Presigned URL OSS untuk objek editor (nama file dalam folder editor). */
    signedUrl(name: string): string
    /** Daftar gambar di folder editor. */
    list(): Promise<{ name: string; url: string }[]>
    /** Unggah satu gambar; kembalikan {name,url,key}. */
    upload(file: Express.Multer.File): Promise<{ name: string; url: string; key: string }>
    /** Hapus gambar berdasarkan key (path OSS). */
    delete(key: string): Promise<void>
}
