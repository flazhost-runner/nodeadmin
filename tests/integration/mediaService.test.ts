import 'reflect-metadata'
import MediaService from '../../src/modules/media/http/services/v1/MediaService'

describe('MediaService (integration)', () => {
    const service = new MediaService()

    it('list() tanpa OSS → array kosong (graceful)', async () => {
        const res = await service.list()
        expect(Array.isArray(res)).toBe(true)
        // Tanpa kredensial OSS di env test → fileService.listFiles return [].
        expect(res).toEqual([])
    })

    it('delete() key di luar folder editor → AppError 400', async () => {
        await expect(service.delete('../../etc/passwd')).rejects.toMatchObject({ statusCode: 400 })
    })

    it('upload() tanpa file → AppError 400', async () => {
        await expect(service.upload(undefined as any)).rejects.toMatchObject({ statusCode: 400 })
    })
})
