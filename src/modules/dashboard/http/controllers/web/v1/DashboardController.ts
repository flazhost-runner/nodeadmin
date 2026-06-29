import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import Module from '../../../../Module'
import { renderView } from '@flazhost-nodeadmin/core'
import { IDashboardService } from '../../../services/v1/IDashboardService'
import { TOKENS } from '../../../../../../tokens'

@injectable()
export default class DashboardController {
    constructor(@inject(TOKENS.IDashboardService) private dashboardService: IDashboardService) {}

    public async index(req: Request, res: Response) {
        const stats = await this.dashboardService.stats()
        renderView(res, Module.path, 'index', { stats })
    }
}
