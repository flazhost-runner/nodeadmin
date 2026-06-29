import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import env from '../config/env'

/**
 * OTP aman:
 * - dibangkitkan dengan crypto.randomInt (CSPRNG), bukan Math.random
 * - disimpan dalam bentuk hash (bcrypt), bukan plaintext
 * - punya masa berlaku (expiry) yang dicek saat verifikasi
 */

export const generateOTP = (length = 6): string => {
    let otp = ''
    for (let i = 0; i < length; i++) {
        otp += crypto.randomInt(0, 10).toString()
    }
    return otp
}

export const hashOTP = async (otp: string): Promise<string> => {
    return bcrypt.hash(otp, env.security.bcryptRounds)
}

export const verifyOTP = async (otp: string, hashed?: string | null): Promise<boolean> => {
    if (!hashed) return false
    return bcrypt.compare(otp, hashed)
}

/** Timestamp (ms) kapan OTP kedaluwarsa, dari sekarang. */
export const otpExpiry = (): number => Date.now() + env.security.otpExpiryMs
