import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { IDashboardService } from '../../../services/v1/IDashboardService'
import { TOKENS } from '../../../../../../tokens'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

@injectable()
export default class DashboardController {
    constructor(@inject(TOKENS.IDashboardService) private dashboardService: IDashboardService) {}

    public async index(req: Request, res: Response) {
        const stats = await this.dashboardService.stats()
        return ResponseHandler.success(res, 'Success', stats)
    }
}
