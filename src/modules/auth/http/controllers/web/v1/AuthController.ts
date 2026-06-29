import path from 'path'
import Module from '../../../../Module'
import { Request, Response } from 'express'
import { injectable, inject } from 'tsyringe'
import { Repository } from 'typeorm'
import { validationResult } from 'express-validator'
import { IUserService } from '../../../../../access/http/services/v1/IUserService'
import UserService from '../../../../../access/http/services/v1/UserService'
import { TOKENS } from '../../../../../../tokens'
import AppDataSource from '../../../../../../config/ormconfig'
import { User } from '../../../../../access/models/user.entity'
import { app } from '../../../../../..'
import { sendMail } from '../../../../../../services/mailer'
import bcrypt from 'bcryptjs'
import appConfig from '../../../../../../config/app'
import env from '../../../../../../config/env'
import { generateOTP, hashOTP, verifyOTP, otpExpiry } from '../../../../../../helpers/otp'
import { renderView } from '@flazhost-nodeadmin/core'

@injectable()
export default class AuthController {
	// Dual-mode: prod inject token; fallback default param agar tetap aman.
	constructor(
		@inject(TOKENS.IUserService) private userService: IUserService = new UserService(),
		@inject(TOKENS.UserRepository) private userRepository: Repository<User> = AppDataSource.getRepository(User),
	) {}

	public async getLogin(req: Request, res: Response) {
		if (req.isAuthenticated()) {
            res.redirect('/admin/v1/dashboard')
        }
        renderView(res, Module.path, 'login', {}, 'full-width')
    }

	public async getRegister(req: Request, res: Response) {
        renderView(res, Module.path, 'register', {}, 'full-width')
    }

	public async postRegister(req: Request, res: Response) {
		try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                req.session.errors = errors.array()
                return res.redirect('/auth/register')
            }
            // Registrasi publik: JANGAN percaya role dari klien — paksa role default
            // dan buang field roles agar tidak bisa self-assign Administrator.
            const { roles, ...safeBody } = req.body
            await this.userService.store(safeBody, null, true)
            req.session.flashMessage = { key: 'success', message: 'Register Success. Please Login.' }
            res.redirect('/auth/login')
        } catch (err: any) {
            req.session.flashMessage = { key: 'error', message: err.message }
            return res.redirect('/auth/register')
        }
	}

	public logout(req: Request, res: Response) {
		req.logout(() => {
			res.redirect('/auth/login')
		})
	}

    public request_view(req: Request, res: Response) {
		renderView(res, Module.path, 'reset_req', {}, 'full-width')
	}

    public async request(req: Request, res: Response) {
		try {
			const { email } = req.body
			const user = await this.userRepository.findOne({ where: { email } })
			if (!user) {
                throw new Error('Invalid email')
			}
			const otp = generateOTP()
			const data = this.userRepository.merge(user, {
				password_otp: await hashOTP(otp),
				password_otp_expires: String(otpExpiry())
			})
			await this.userRepository.save(data)

			const html = await new Promise<string>((resolve, reject) => {
				app.render(path.resolve(Module.path, 'views'+appConfig.be_view+'/mail/otp'), {
					otp,
					layout: './mails/main'
				}, (err, html) => {
					if (err) reject(err);
					else resolve(html);
				})
			})
            await sendMail(user.email, 'Request Reset Password', `Your OTP is ${otp}`, html)
			req.session.flashMessage = { key: 'success', message: 'OTP Send Success.' }
            res.redirect('/admin/v1/auth/reset/proc')
		} catch (err: any) {
			req.session.flashMessage = { key: 'error', message: err.message }
            return res.redirect('/auth/login')
		}
	}

    public process_view(req: Request, res: Response) {
		renderView(res, Module.path, 'reset_proc', {}, 'full-width')
	}

	public async process(req: Request, res: Response) {
		try {
			const { email, otp, password } = req.body
			const user = await this.userRepository.findOne({ where: { email } })
			const notExpired = user?.password_otp_expires && Number(user.password_otp_expires) > Date.now()
			const otpOk = user && notExpired && await verifyOTP(otp, user.password_otp)
			if (!user || !otpOk) {
                throw new Error('Invalid or expired OTP')
			}
			const data = this.userRepository.merge(user, {
				password_otp: '',
				password_otp_expires: null,
				password: await bcrypt.hash(password, env.security.bcryptRounds)
			})
			await this.userRepository.save(data)
			req.session.flashMessage = { key: 'success', message: 'Reset Password Success.' }
            res.redirect('/auth/login')
		} catch (err: any) {
			// Pesan generik ke user; detail di log server
			console.error('reset process error:', err)
			req.session.flashMessage = { key: 'error', message: 'Invalid or expired OTP' }
            return res.redirect('/admin/v1/auth/reset/proc')
		}
	}
}