import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import AppDataSource from '../../../../../../config/ormconfig'
import { clientRedis } from '../../../../../../services/redisClient'
import { User } from '../../../../../access/models/user.entity'
import { JwtPayload } from '../../../../../../types/JwtPayload'
import { ResponseHandler } from '@flazhost-nodeadmin/core'
import path from 'path'
import Module from '../../../../Module'
import { sendMail } from '../../../../../../services/mailer'
import env from '../../../../../../config/env'
import { generateOTP, hashOTP, verifyOTP, otpExpiry } from '../../../../../../helpers/otp'

export default class AuthController {
	private userRepository = AppDataSource.getRepository(User)

	public async login(req: Request, res: Response) {
		const { email, password } = req.body
		const user = await this.userRepository.findOne({ where: { email } })
		if (!user) {
			return ResponseHandler.error(res, "Invalid email or password", null, 401)
		}

		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) {
			return ResponseHandler.error(res, "Invalid email or password", null, 401)
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email } as JwtPayload,
			env.jwt.secret,
			{ expiresIn: env.jwt.expiresIn as any, algorithm: env.jwt.algorithm }
		)
		return ResponseHandler.success(res, "Ok", {
			access_token: token,
			token_type: "Bearer",
			expires_in: 3600,
		})
	}

	public async register(req: Request, res: Response) {
        const { name, email, password } = req.body
		const existingUser = await this.userRepository.findOne({ where: { email } })
		if (existingUser) {
			return res.status(400).json({ message: 'Email already in use' })
		}

		const hashedPassword = await bcrypt.hash(password, 10)
		const user = new User()
		user.name = name
		user.email = email
		user.password = hashedPassword

		await this.userRepository.save(user)
		return ResponseHandler.success(res, "User registered successfully")
    }

	public async logout(req: Request, res: Response) {
		const token = req.headers.authorization?.split(' ')[1]
		if (!token) {
			return ResponseHandler.error(res, "No token provided", null, 400)
		}
		// Blacklist dengan TTL = sisa masa berlaku token (hindari key menumpuk selamanya)
		let ttlSec = 3600
		try {
			const decoded: any = jwt.decode(token)
			if (decoded?.exp) ttlSec = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000))
		} catch { /* pakai default */ }
		// PENTING: clientRedis dibuat dengan legacyMode (utk connect-redis v6).
		// Di legacy mode, clientRedis.set/get = API callback v3 dan TIDAK menerima
		// opsi { EX } / Promise → harus pakai clientRedis.v4.* untuk Promise API.
		// Tanpa ini blacklist senyap gagal (token tetap valid setelah logout).
		await clientRedis.v4.set(token, 'blacklisted', { EX: ttlSec })
		return ResponseHandler.success(res, "Success")
	}

	public async request(req: Request, res: Response) {
		try {
			const { email } = req.body
			const user = await this.userRepository.findOne({ where: { email } })
			if (!user) {
				return ResponseHandler.error(res, "Invalid email", null, 401)
			}
			const otp = generateOTP()
			const data = this.userRepository.merge(user, {
				password_otp: await hashOTP(otp),
				password_otp_expires: String(otpExpiry())
			})
			await this.userRepository.save(data)

			const html = await new Promise<string>((resolve, reject) => {
				req.app.render(path.resolve(Module.path, 'views/mail/otp'), {
					otp,
					layout: './mails/main'
				}, (err, html) => {
					if (err) reject(err);
					else resolve(html);
				})
			})
			await sendMail(user.email, 'Request Reset Password', `Your OTP is ${otp}`, html)
			return ResponseHandler.success(res, "Success")
		} catch (error: any) {
			console.error('api reset request error:', error)
			return ResponseHandler.error(res, "Could not process request", null, 500)
		}
	}

	public async process(req: Request, res: Response) {
		try {
			const { email, otp, password } = req.body
			const user = await this.userRepository.findOne({ where: { email } })
			const notExpired = user?.password_otp_expires && Number(user.password_otp_expires) > Date.now()
			const otpOk = user && notExpired && await verifyOTP(otp, user.password_otp)
			if (!user || !otpOk) {
				return ResponseHandler.error(res, "Invalid or expired OTP", null, 401)
			}
			const data = this.userRepository.merge(user, {
				password_otp: '',
				password_otp_expires: null,
				password: await bcrypt.hash(password, env.security.bcryptRounds)
			})
			await this.userRepository.save(data)
			return ResponseHandler.success(res, "Success")
		} catch (error: any) {
			console.error('api reset process error:', error)
			return ResponseHandler.error(res, "Could not process request", null, 500)
		}
	}
}