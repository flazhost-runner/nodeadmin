import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { ISettingService } from '../../../services/v1/ISettingService'
import { TOKENS } from '../../../../../../tokens'
import { ResponseHandler } from '@flazhost-nodeadmin/core'

@injectable()
export default class SettingController {
    constructor(@inject(TOKENS.ISettingService) private settingService: ISettingService) {}

    public async index(req: Request, res: Response) {
        const { data } = await this.settingService.index()
        return ResponseHandler.success(res, 'Success', data)
    }

    public async update(req: Request, res: Response) {
        const result = await this.settingService.update(req.body, req.files)
        return ResponseHandler.success(res, 'Success', result)
    }
}
