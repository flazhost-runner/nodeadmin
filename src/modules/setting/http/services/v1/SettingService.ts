import { Repository } from 'typeorm'
import { injectable, inject } from 'tsyringe'
import AppDataSource from '../../../../../config/ormconfig'
import { Functions as functions } from '@flazhost-nodeadmin/core'
import { Setting } from '../../../models/setting.entity'
import fileService from '../../../../../services/fileService'
import Module from '../../../Module'
import { invalidateSetting } from '../../../../../services/settingCache'
import { ISettingService } from './ISettingService'
import { TOKENS } from '../../../../../tokens'
import { AppError } from '@flazhost-nodeadmin/core'
import { cleanRichText } from '../../../../../helpers/sanitizeHtml'

// Tipe struktural minimal — sengaja TIDAK import dari modul home agar file ini
// tetap kompilasi di varian api-only (modul home dibuang). Lihat blok FE di
// bawah: resolve dilakukan lazy & di-guard try/catch.
type FeTemplateEnsurer = { ensure(slug: string): Promise<void> }

function generateUniqueFileName(): string {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let month: string | number = currentDate.getMonth() + 1;
    let day: string | number = currentDate.getDate();
    let hours: string | number = currentDate.getHours();
    let minutes: string | number = currentDate.getMinutes();
    let period = 'am';

    // Pad single digits with zero
    if (month < 10) month = `0${month}`;
    if (day < 10) day = `0${day}`;
    if (hours > 12) {
        hours -= 12;
        period = 'pm';
    }
    if (hours === 0) hours = 12;
    if (minutes < 10) minutes = `0${minutes}`;

    // Generate a random number between 1 and 10000
    const randomNumber = Math.floor(Math.random() * 10000) + 1;

    // Construct the filename
    const filename = `${year}-${month}-${day}_${hours}${minutes}${period}_${randomNumber}`;
    return filename;
}

@injectable()
export default class SettingService implements ISettingService {
	// Dual-mode: prod inject token; test `new SettingService()` pakai default param.
	constructor(
		@inject(TOKENS.SettingRepository) private settingRepository: Repository<Setting> = AppDataSource.getRepository(Setting),
	) {}

	public async index() {
		const data = await this.settingRepository.find()
		return { data:data[0] }
	}

	public async update(request: any, files: any = null) {
			const setting = await this.settingRepository.find()
			request = functions.removeEmptyFields(request)
			// Sanitasi rich-text (Trumbowyg) sebelum simpan — cegah XSS.
			if (typeof request.description === 'string') {
				request.description = cleanRichText(request.description)
			}
            if (Array.isArray(files) && files.length > 0) {
                await Promise.all(
                    files.map((file: { fieldname: string, originalname: string; buffer: Buffer }) => {
                        const fileName = generateUniqueFileName()
                        const uploadPath = Module.filePath + fileName + "." + file.originalname.split('.').pop()!.toLowerCase()
                        return fileService.uploadFile(uploadPath, file.buffer).then((savedName: string) => {
                            if (file.fieldname == 'icon') {
                                request.icon = savedName
                            } else if (file.fieldname == 'logo') {
                                request.logo = savedName
                            } else if (file.fieldname == 'login_image') {
                                request.login_image = savedName
                            }
                        })
                    })
                )
            }
			const data = this.settingRepository.merge(setting[0], { ...request })
			const result = await this.settingRepository.save(data)
			if (!result) {
				throw new AppError("Update Setting Fail", 500)
			}
			invalidateSetting() // refresh cache agar perubahan langsung tampil

			// FE_TEMPLATE_BLOCK_START (penanda untuk generator api — jangan hapus)
			// Template frontend diganti → unduh on-demand (bila belum di-cache).
			// Gagal unduh tidak menggagalkan simpan setting (landing fallback default).
			if (typeof request.fe_template === 'string') {
				try {
					const { container, TOKENS } = await import('../../../../../container')
					const fe = container.resolve<FeTemplateEnsurer>(TOKENS.IFeTemplateService)
					await fe.ensure(request.fe_template)
				} catch (e) {
					console.error('Unduh template frontend gagal:', e)
				}
			}
			// FE_TEMPLATE_BLOCK_END
			return result
	}
}
