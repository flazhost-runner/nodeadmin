import 'reflect-metadata'
import FeTemplateService from '../../src/modules/home/http/services/v1/FeTemplateService'
import { DEFAULT_FE_TEMPLATE } from '../../src/config/feTemplates'

describe('FeTemplateService (integration)', () => {
    const service = new FeTemplateService()

    it('default template ter-bundle (isCached true)', () => {
        expect(service.isCached(DEFAULT_FE_TEMPLATE)).toBe(true)
    })

    it('getActiveHtml() → HTML berisi </html>', async () => {
        const html = await service.getActiveHtml()
        expect(html.toLowerCase()).toContain('</html>')
    })

    it('ensure() slug tak dikenal → AppError 400', async () => {
        await expect(service.ensure('slug-tidak-ada')).rejects.toMatchObject({ statusCode: 400 })
    })

    it('ensure() slug default (sudah cached) → tak fetch, resolve', async () => {
        await expect(service.ensure(DEFAULT_FE_TEMPLATE)).resolves.toBeUndefined()
    })
})
