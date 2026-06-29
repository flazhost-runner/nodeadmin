import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { IPermissionService } from '../../../services/v1/IPermissionService'
import { TOKENS } from '../../../../../../tokens'
import { validationResult } from 'express-validator'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

@injectable()
export default class PermissionController {
    constructor(@inject(TOKENS.IPermissionService) private permissionService: IPermissionService) {}

    public async index(req: Request, res: Response) {
		this.permissionService.getAllRegisteredRoute(req.app)
        const filter = req.query
        const {datas,paginate_data} = await this.permissionService.index(filter)
        return ResponseHandler.success(res, 'Success', {datas,paginate_data})
    }

    public async store(req: Request, res: Response) {
        if (!req.body.blocked) {
            req.body.blocked = false
        }
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return ResponseHandler.validationError(res, errors.array())
        }
        const result = await this.permissionService.store(req.body)
        return ResponseHandler.success(res, 'Success', result)
    }

    public async edit(req: Request, res: Response) {
        const result = await this.permissionService.edit(req.params.id)
        const data = result
        return ResponseHandler.success(res, 'Success', data)
    }

    public async update(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return ResponseHandler.validationError(res, errors.array())
        }
        await this.permissionService.update(req.params.id, req.body)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete(req: Request, res: Response) {
        await this.permissionService.delete(req.params.id)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.permissionService.delete(id)))
        return ResponseHandler.success(res, 'Success')
    }
}
