import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { getTimezones } from '@flazhost-nodeadmin/core'
import { IUserService } from '../../../../../access/http/services/v1/IUserService'
import { TOKENS } from '../../../../../../tokens'
import { User } from '../../../../../access/models/user.entity'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class ProfileController {
    constructor(@inject(TOKENS.IUserService) private userService: IUserService) {}

    public async index(req: Request, res: Response) {
        const user = req.user as User
        const result = await this.userService.edit(user.id)
        const { data, roles } = result
        const timezones = getTimezones()
        renderView(res, Module.path, 'profile', { data, roles, timezones })
    }

    public async update(req: Request, res: Response) {
        req.body.blocked = (!req.body.blocked) ? false : true
        const user = req.user as User
        await this.userService.updateProfile(user.id, req.body, req.files)
        req.session.flashMessage = { key: 'success', message: 'Update Profile Success.' }
        res.redirect('/admin/v1/dashboard')
    }
}
