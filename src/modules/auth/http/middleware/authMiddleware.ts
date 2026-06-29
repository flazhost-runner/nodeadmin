import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { clientRedis } from '../../../../services/redisClient'
import { ResponseHandler } from '@flazhost-nodeadmin/core'
import env from '../../../../config/env'

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/auth/login')
}

export const ensureAuthenticatedApi = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token) {
        return ResponseHandler.error(res, "No token provided", null, 401)
    }
    // clientRedis legacyMode → pakai .v4 untuk Promise API (lihat AuthController.logout).
    // clientRedis.get langsung mengembalikan undefined di legacy mode → cek blacklist
    // selalu gagal & token logout tetap diterima.
    const checkToken = await clientRedis.v4.get(token)
    if (checkToken == 'blacklisted') return ResponseHandler.error(res, "Unauthenticated", null, 401)
    jwt.verify(token, env.jwt.secret, { algorithms: [env.jwt.algorithm] }, (err, decoded) => {
        if (err) {
            return ResponseHandler.error(res, "Unauthenticated", null, 401)
        }
        req.user = decoded
        next()
    })
}