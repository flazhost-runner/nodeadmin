import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { IUserService } from '../../../services/v1/IUserService'
import { TOKENS } from '../../../../../../tokens'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

@injectable()
export default class UserController {
    constructor(@inject(TOKENS.IUserService) private userService: IUserService) {}

    public async index(req: Request, res: Response) {
        const filter = req.query
        const { datas, roles, paginate_data } = await this.userService.index(filter)
        return ResponseHandler.success(res, 'Success', {datas,paginate_data})
    }

    public async store(req: Request, res: Response) {
        req.body.blocked = (!req.body.blocked) ? false : true
        const result = await this.userService.store(req.body, req.files)
        return ResponseHandler.success(res, 'Success', result)
    }

    public async edit(req: Request, res: Response) {
        const result = await this.userService.edit(req.params.id)
        const { data, roles } = result
        return ResponseHandler.success(res, 'Success', data)
    }

    public async update(req: Request, res: Response) {
        req.body.blocked = (!req.body.blocked) ? false : true
        await this.userService.update(req.params.id, req.body, req.files)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete(req: Request, res: Response) {
        await this.userService.delete(req.params.id)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.userService.delete(id)))
        return ResponseHandler.success(res, 'Success')
    }
}