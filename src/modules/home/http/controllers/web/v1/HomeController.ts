import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import path from 'path'
import Module from '../../../../Module'
import { IFeTemplateService } from '../../../services/v1/IFeTemplateService'
import { TOKENS } from '../../../../../../tokens'

/**
 * Halaman home (frontend publik).
 * - Template DEFAULT → dirender via layout EJS (fe/default) — terpisah head/
 *   header/footer + aset di public/fe/default (konsistensi ala eduzone).
 * - Template lain (hasil switch/download) → HTML mentah self-contained.
 */
@injectable()
export default class HomeController {
    constructor(@inject(TOKENS.IFeTemplateService) private feTemplate: IFeTemplateService) {}

    public async index(_req: Request, res: Response) {
        const slug = await this.feTemplate.getActiveSlug()
        if (this.feTemplate.isDefaultEjs(slug)) {
            return res.render(
                path.join(Module.path, 'views/fe/default/index'),
                { layout: './layouts/fe/default/main' },
            )
        }
        const html = await this.feTemplate.getActiveHtml()
        res.type('html').send(html)
    }
}
