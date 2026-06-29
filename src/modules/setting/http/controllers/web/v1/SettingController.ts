import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { ISettingService } from '../../../services/v1/ISettingService'
import { IFeCatalogService } from '../../../../../home/http/services/v1/IFeCatalogService'
import { DEFAULT_FE_TEMPLATE } from '../../../../../../config/feTemplates'
import { TOKENS } from '../../../../../../tokens'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class SettingController {
    constructor(
        @inject(TOKENS.ISettingService) private settingService: ISettingService,
        @inject(TOKENS.IFeCatalogService) private feCatalog: IFeCatalogService,
    ) {}

    public async index(req: Request, res: Response) {
        const { data } = await this.settingService.index()
        // Katalog FE: paginasi + filter server-side (q_name/q_category/q_page).
        // Template aktif disematkan ke halaman pertama.
        const activeSlug = data?.fe_template || DEFAULT_FE_TEMPLATE
        const { datas: feTemplates, paginate_data } = await this.feCatalog.paginate(req.query, activeSlug)
        const feCategories = await this.feCatalog.categories()
        renderView(res, Module.path, 'index', {
            data, feTemplates, feCategories, paginate_data, filter: req.query,
        })
    }

    public async update(req: Request, res: Response) {
        await this.settingService.update(req.body, req.files)
        req.session.flashMessage = { key: 'success', message: 'Save Setting Success.' }
        res.redirect('/admin/v1/setting')
    }

    /** Preview HTML mentah 1 template (untuk thumbnail/modal; di-cache di klien). */
    public async fePreview(req: Request, res: Response) {
        const html = await this.feCatalog.previewHtml(String(req.params.slug))
        res.type('html').send(html)
    }
}
