import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { IUserService } from '../../../../../access/http/services/v1/IUserService'
import { TOKENS } from '../../../../../../tokens'
import { ResponseHandler } from '@flazhost-nodeadmin/core'
import { User } from '../../../../../access/models/user.entity'

@injectable()
export default class ProfileController {
    constructor(@inject(TOKENS.IUserService) private userService: IUserService) {}

    public async index(req: Request, res: Response) {
        const user = req.user as User
        const result = await this.userService.edit(user.id)
        const { data, roles } = result
        return ResponseHandler.success(res, 'Success', data)
    }

    public async update(req: Request, res: Response) {
        const user = req.user as User
        await this.userService.updateProfile(user.id, req.body, req.files)
        return ResponseHandler.success(res, 'Success')
    }
}
