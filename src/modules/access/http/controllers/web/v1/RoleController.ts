import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { validationResult } from 'express-validator'
import { IRoleService } from '../../../services/v1/IRoleService'
import { TOKENS } from '../../../../../../tokens'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class RoleController {
	constructor(@inject(TOKENS.IRoleService) private roleService: IRoleService) {}

    public async index(req: Request, res: Response) {
        const filter = req.query
        const {datas,paginate_data} = await this.roleService.index(filter)
        renderView(res, Module.path, 'roles/index', { datas, filter, paginate_data })
    }

    public async create(req: Request, res: Response) {
        renderView(res, Module.path, 'roles/create')
    }

    public async store(req: Request, res: Response) {
        if (!req.body.blocked) {
            req.body.blocked = false
        }
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.session.errors = errors.array()
            req.session.old = req.body
            return res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.create'))
        }
        await this.roleService.store(req.body)
        req.session.flashMessage = { key: 'success', message: 'Store Role Success.' }
        res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.index'))
    }

    public async edit(req: Request, res: Response) {
        const result = await this.roleService.edit(req.params.id)
        const data = result
        renderView(res, Module.path, 'roles/edit', { data })
    }

    public async update(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            req.session.errors = errors.array()
            return res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.edit', { id: req.params.id }))
        }
        await this.roleService.update(req.params.id, req.body)
        req.session.flashMessage = { key: 'success', message: 'Update Role Success.' }
        res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.index'))
    }

    public async delete(req: Request, res: Response) {
        await this.roleService.delete(req.params.id)
        req.session.flashMessage = { key: 'success', message: 'Delete Role Success.' }
        res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.index'))
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.roleService.delete(id)))
        req.session.flashMessage = { key: 'success', message: 'Delete Role Success.' }
        res.redirect((req.app as any).namedRoutes.build('admin.v1.access.role.index'))
    }

    public async permission(req: Request, res: Response) {
        const filter = req.query
        const { datas, role, paginate_data } = await this.roleService.permission(req.params.id,filter)
        renderView(res, Module.path, 'roles/permission', { role, datas, filter, paginate_data })
    }

    public async permission_assign(req: Request, res: Response) {
        await this.roleService.permission_assign(req.params.id, req.params.permission_id)
        req.session.flashMessage = { key: 'success', message: 'Assign Permission Success.' }
        return res.redirect(req.get('Referrer') || '/')
    }

    public async permission_assign_selected(req: Request, res: Response) {
        await this.roleService.permission_assign_selected(req.params.id, req.body.selected)
        req.session.flashMessage = { key: 'success', message: 'Assign Permission Success.' }
        return res.redirect(req.get('Referrer') || '/')
    }

    public async permission_unassign(req: Request, res: Response) {
        await this.roleService.permission_unassign(req.params.id, req.params.permission_id)
        req.session.flashMessage = { key: 'success', message: 'Unassign Permission Success.' }
        return res.redirect(req.get('Referrer') || '/')
    }

    public async permission_unassign_selected(req: Request, res: Response) {
        await this.roleService.permission_unassign_selected(req.params.id, req.body.selected)
        req.session.flashMessage = { key: 'success', message: 'Unassign Permission Success.' }
        return res.redirect(req.get('Referrer') || '/')
    }
}
