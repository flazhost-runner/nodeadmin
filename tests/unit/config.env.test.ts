import env from '../../src/config/env'

describe('config/env', () => {
    it('NODE_ENV = test (dari .env.test)', () => {
        expect(env.nodeEnv).toBe('test')
        expect(env.isProd).toBe(false)
    })

    it('parsing number (port, bcryptRounds)', () => {
        expect(typeof env.app.port).toBe('number')
        expect(env.security.bcryptRounds).toBe(4) // dari .env.test
    })

    it('parsing boolean (db.synchronize)', () => {
        expect(env.db.synchronize).toBe(true) // DB_SYNCHRONIZE=true di .env.test
        expect(typeof env.storage.ssl).toBe('boolean')
    })

    it('secret terbaca dari env', () => {
        expect(env.session.secret).toBeTruthy()
        expect(env.jwt.secret).toBeTruthy()
        expect(env.jwt.algorithm).toBe('HS256')
    })

    it('otpExpiryMs = menit * 60000', () => {
        expect(env.security.otpExpiryMs).toBe(10 * 60 * 1000)
    })
})
