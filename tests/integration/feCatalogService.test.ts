import 'reflect-metadata'
import FeCatalogService from '../../src/modules/home/http/services/v1/FeCatalogService'
import { deriveFeTemplate } from '../../src/config/feTemplates'

// Stub fetch agar test deterministik (tak menyentuh GitHub).
const TREE = {
    tree: [
        { type: 'blob', path: 'landings/agency-consulting-001-digital-marketing-agency.html' },
        { type: 'blob', path: 'landings/agency-consulting-002-creative-agency.html' },
        { type: 'blob', path: 'landings/technology-saas-001-hero-focused-conversion-page.html' },
        { type: 'blob', path: 'landings/README.md' }, // bukan landing → diabaikan
        { type: 'tree', path: 'landings' },           // bukan blob → diabaikan
    ],
}

describe('deriveFeTemplate (unit)', () => {
    it('parse slug {kategori}-{NNN}-{nama} → name & category title-case', () => {
        const t = deriveFeTemplate('agency-consulting-001-digital-marketing-agency')
        expect(t.category).toBe('Agency Consulting')
        expect(t.name).toBe('Digital Marketing Agency')
    })
    it('slug tak sesuai pola → category Other', () => {
        const t = deriveFeTemplate('randomslug')
        expect(t.category).toBe('Other')
    })
})

describe('FeCatalogService (integration, fetch di-stub)', () => {
    let service: FeCatalogService
    const realFetch = global.fetch
    // Beberapa test SENGAJA memicu jalur fallback (upstream gagal) yang memang
    // memanggil console.error di service — itu perilaku produksi yang benar.
    // Spy menyenyapkan output (agar tak tampak seperti kegagalan test) sekaligus
    // memungkinkan assertion bahwa error memang dipanggil (lihat test fallback).
    let errSpy: jest.SpyInstance

    beforeEach(() => {
        errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        service = new FeCatalogService()
        // Hindari baca cache disk lama → paksa jalur fetch.
        ;(service as any).readDiskCache = () => null
        ;(service as any).writeDiskCache = () => {}
        global.fetch = jest.fn(async () => ({
            ok: true,
            json: async () => TREE,
        })) as any
    })
    afterEach(() => {
        global.fetch = realFetch
        errSpy.mockRestore()
    })

    it('list() → hanya blob landings .html yang diparse (3 item)', async () => {
        const all = await service.list()
        expect(all).toHaveLength(3)
        expect(all.every((t) => !!t.slug && !!t.name && !!t.category)).toBe(true)
    })

    it('list() di-cache memori → fetch hanya sekali', async () => {
        await service.list()
        await service.list()
        expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1)
    })

    it('categories() → unik & terurut', async () => {
        const cats = await service.categories()
        expect(cats).toEqual(['Agency Consulting', 'Technology Saas'])
    })

    it('paginate() → slice sesuai page_size', async () => {
        const res = await service.paginate({ q_page: 1, q_page_size: 2 })
        expect(res.datas).toHaveLength(2)
        expect(res.paginate_data.total_data).toBe(3)
        expect(res.paginate_data.total_page).toBe(2)
    })

    it('paginate() filter q_name (case-insensitive)', async () => {
        const res = await service.paginate({ q_name: 'creative' })
        expect(res.datas).toHaveLength(1)
        expect(res.datas[0].slug).toContain('creative-agency')
    })

    it('paginate() filter q_category', async () => {
        const res = await service.paginate({ q_category: 'Technology Saas' })
        expect(res.datas).toHaveLength(1)
        expect(res.datas[0].category).toBe('Technology Saas')
    })

    it('has() true untuk slug dalam katalog, false untuk asing', async () => {
        expect(await service.has('agency-consulting-002-creative-agency')).toBe(true)
        expect(await service.has('slug-tak-ada')).toBe(false)
    })

    it('previewHtml() slug asing → AppError 400', async () => {
        await expect(service.previewHtml('slug-tak-ada')).rejects.toMatchObject({ statusCode: 400 })
    })

    it('previewHtml() cache lokal ada → kembalikan lokal tanpa fetch upstream', async () => {
        const slug = 'agency-consulting-002-creative-agency'
        await service.list() // hangatkan katalog (memo) agar has() tak fetch lagi
        const before = (global.fetch as jest.Mock).mock.calls.length
        ;(service as any).readLocalHtml = (s: string) =>
            s === slug ? '<html><body>LOKAL</body></html>' : null
        const html = await service.previewHtml(slug)
        expect(html).toContain('LOKAL')
        // Tak ada fetch tambahan: cache lokal dilayani sebelum jalur GitHub.
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(before)
    })

    it('previewHtml() upstream gagal + ada cache lokal → fallback ke lokal', async () => {
        const slug = 'agency-consulting-002-creative-agency'
        let calls = 0
        // readLocalHtml: null saat cek awal (paksa fetch), lalu lokal saat fallback.
        ;(service as any).readLocalHtml = () => (++calls === 1 ? null : '<html>FALLBACK</html>')
        global.fetch = jest.fn(async () => { throw new Error('network down') }) as any
        const html = await service.previewHtml(slug)
        expect(html).toContain('FALLBACK')
        expect(errSpy).toHaveBeenCalled() // error katalog memang diharapkan (fallback)
    })

    it('previewHtml() upstream gagal tanpa cache lokal → AppError 502', async () => {
        const slug = 'agency-consulting-002-creative-agency'
        ;(service as any).readLocalHtml = () => null
        global.fetch = jest.fn(async () => ({ ok: false, status: 503 })) as any
        await expect(service.previewHtml(slug)).rejects.toMatchObject({ statusCode: 502 })
        expect(errSpy).toHaveBeenCalled() // error katalog memang diharapkan (fallback)
    })

    it('list() fallback ke katalog kurasi saat fetch gagal', async () => {
        global.fetch = jest.fn(async () => ({ ok: false, status: 500 })) as any
        const all = await service.list()
        expect(all.length).toBeGreaterThan(0) // FE_TEMPLATES fallback
        expect(errSpy).toHaveBeenCalled() // error katalog memang diharapkan (fallback)
    })
})
