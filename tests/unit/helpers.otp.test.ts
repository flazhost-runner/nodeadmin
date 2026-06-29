import { generateOTP, hashOTP, verifyOTP, otpExpiry } from '../../src/helpers/otp'

describe('helpers/otp', () => {
    it('generateOTP menghasilkan digit dengan panjang benar', () => {
        const otp = generateOTP(6)
        expect(otp).toMatch(/^\d{6}$/)
    })

    it('OTP berbeda antar pemanggilan (CSPRNG)', () => {
        const set = new Set(Array.from({ length: 20 }, () => generateOTP()))
        expect(set.size).toBeGreaterThan(1)
    })

    it('hashOTP + verifyOTP cocok untuk OTP benar', async () => {
        const otp = generateOTP()
        const hash = await hashOTP(otp)
        expect(hash).not.toBe(otp) // tersimpan ter-hash, bukan plaintext
        expect(await verifyOTP(otp, hash)).toBe(true)
    })

    it('verifyOTP gagal untuk OTP salah / hash kosong', async () => {
        const hash = await hashOTP('123456')
        expect(await verifyOTP('000000', hash)).toBe(false)
        expect(await verifyOTP('123456', null)).toBe(false)
    })

    it('otpExpiry mengembalikan timestamp di masa depan', () => {
        expect(otpExpiry()).toBeGreaterThan(Date.now())
    })
})
