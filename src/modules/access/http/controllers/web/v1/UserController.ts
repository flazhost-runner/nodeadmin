import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { getTimezones } from '@flazhost-nodeadmin/core'
import { IUserService } from '../../../services/v1/IUserService'
import { TOKENS } from '../../../../../../tokens'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class UserController {
    constructor(@inject(TOKENS.IUserService) private userService: IUserService) {}

    public async index(req: Request, res: Response) {
        const filter = req.query
        const { datas, roles, paginate_data } = await this.userService.index(filter)
        renderView(res, Module.path, 'users/index', { datas, filter, roles, paginate_data })
    }

    public async create(req: Request, res: Response) {
        const roles = await this.userService.create()
        const timezones = getTimezones()
        renderView(res, Module.path, 'users/create', { roles, timezones })
    }

    public async store(req: Request, res: Response) {
        req.body.blocked = (!req.body.blocked) ? false : true
        await this.userService.store(req.body, req.files)
        req.session.flashMessage = { key: 'success', message: 'Store User Success.' }
        res.redirect('/admin/v1/access/user')
    }

    public async edit(req: Request, res: Response) {
        const result = await this.userService.edit(req.params.id)
        const { data, roles } = result
        const timezones = getTimezones()
        renderView(res, Module.path, 'users/edit', { data, roles, timezones })
    }

    public async update(req: Request, res: Response) {
        req.body.blocked = (!req.body.blocked) ? false : true
        await this.userService.update(req.params.id, req.body, req.files)
        req.session.flashMessage = { key: 'success', message: 'Update User Success.' }
        res.redirect('/admin/v1/access/user')
    }

    public async delete(req: Request, res: Response) {
        await this.userService.delete(req.params.id)
        req.session.flashMessage = { key: 'success', message: 'Delete User Success.' }
        res.redirect('/admin/v1/access/user')
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.userService.delete(id)))
        req.session.flashMessage = { key: 'success', message: 'Delete User Success.' }
        res.redirect('/admin/v1/access/user')
    }
}
