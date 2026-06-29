import { Request, Response } from 'express'
import { injectable } from 'tsyringe'
import Module from '../../../../Module'
import { renderView } from '@flazhost-nodeadmin/core'

/**
 * Halaman showcase komponen UI — acuan visual + markup untuk membuat elemen
 * serupa (chart, badge, card, tabel, form, alert, dropdown). Statis, tanpa service.
 */
@injectable()
export default class ComponentController {
    public async index(req: Request, res: Response) {
        renderView(res, Module.path, 'index')
    }
}
