import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { validationResult } from 'express-validator'
import { IRoleService } from '../../../services/v1/IRoleService'
import { TOKENS } from '../../../../../../tokens'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

@injectable()
export default class RoleController {
	constructor(@inject(TOKENS.IRoleService) private roleService: IRoleService) {}

    public async index(req: Request, res: Response) {
        const filter = req.query
        const {datas,paginate_data} = await this.roleService.index(filter)
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
        const result = await this.roleService.store(req.body)
        return ResponseHandler.success(res, 'Success', result)
    }

    public async edit(req: Request, res: Response) {
        const result = await this.roleService.edit(req.params.id)
        const data = result
        return ResponseHandler.success(res, 'Success', data)
    }

    public async update(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return ResponseHandler.validationError(res, errors.array())
        }
        await this.roleService.update(req.params.id, req.body)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete(req: Request, res: Response) {
        await this.roleService.delete(req.params.id)
        return ResponseHandler.success(res, 'Success')
    }

    public async delete_selected(req: Request, res: Response) {
        await Promise.all(req.body.selected.map((id: string) => this.roleService.delete(id)))
        return ResponseHandler.success(res, 'Success')
    }

    public async permission(req: Request, res: Response) {
        const filter = req.query
        const { datas, role, paginate_data } = await this.roleService.permission(req.params.id,filter)
        return ResponseHandler.success(res, 'Success', {role,datas,paginate_data})
    }

    public async permission_assign(req: Request, res: Response) {
        await this.roleService.permission_assign(req.params.id, req.params.permission_id)
        return ResponseHandler.success(res, 'Success')
    }

    public async permission_assign_selected(req: Request, res: Response) {
        await this.roleService.permission_assign_selected(req.params.id, req.body.selected)
        return ResponseHandler.success(res, 'Success')
    }

    public async permission_unassign(req: Request, res: Response) {
        await this.roleService.permission_unassign(req.params.id, req.params.permission_id)
        return ResponseHandler.success(res, 'Success')
    }

    public async permission_unassign_selected(req: Request, res: Response) {
        await this.roleService.permission_unassign_selected(req.params.id, req.body.selected)
        return ResponseHandler.success(res, 'Success')
    }
}