import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { IPermissionService } from '../../../services/v1/IPermissionService'
import { TOKENS } from '../../../../../../tokens'
import { validationResult } from 'express-validator'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class PermissionController {
    constructor(@inject(TOKENS.IPermissionService) private permissionService: IPermissionService) {}

    public async index(req: Request, res: Response) {
		await this.permissionService.getAllRegisteredRoute(req.app)
        const filter = req.query
        const {datas,paginate_data} = await this.permissionService.index(filter)
        renderView(res, Module.path, 'permission/index', { datas, filter, paginate_data })
    }

    public async create(req: Request, res: Response) {
        renderView(res, Module.path, 'permission/create')
    }

    public async store(req: Request, res: Response) {
        if (!req.body.blocked) {
            req.body.blocked = false
        }
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.session.errors = errors.array()
            req.session.old = req.body
            return res.redirect('/admin/v1/access/permission/create')
        }
        await this.permissionService.store(req.body)
        req.session.flashMessage = { key: 'success', message: 'Store Permission Success.' }
        res.redirect('/admin/v1/access/permission')
    }

    public async edit(req: Request, res: Response) {
        const result = await this.permissionService.edit(req.params.id)
        const data = result
        renderView(res, Module.path, 'permission/edit', { data })
    }

    public async update(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.session.errors = errors.array()
            return res.redirect('/admin/v1/access/permission/'+req.params.id+'/edit')
        }
        await this.permissionService.update(req.params.id, req.body)
        req.session.flashMessage = { key: 'success', message: 'Update Permission Success.' }
        res.redirect('/admin/v1/access/permission')
    }

    public async delete(req: Request, res: Response) {
        await this.permissionService.delete(req.params.id)
        req.session.flashMessage = { key: 'success', message: 'Delete Permission Success.' }
        res.redirect('/admin/v1/access/permission')
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.permissionService.delete(id)))
        req.session.flashMessage = { key: 'success', message: 'Delete Permission Success.' }
        res.redirect('/admin/v1/access/permission')
    }
}
