import * as dotenv from 'dotenv'
import { makeEnvHelpers } from '@flazhost-nodeadmin/core'
dotenv.config()

/**
 * Konfigurasi environment terpusat & tervalidasi.
 * - Secret wajib (SESSION_SECRET, JWT_SECRET) → fail-fast bila kosong di production,
 *   sehingga aplikasi tidak pernah jalan dengan secret default yang bisa ditebak.
 * - Tipe sudah dikonversi (number/boolean), tidak lagi string mentah.
 * - Helper baca/validasi env generik diambil dari @flazhost-nodeadmin/core (makeEnvHelpers);
 *   objek `env` + bagian app-spesifik (roles) tetap di sini.
 */

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProd = NODE_ENV === 'production'

const { required, num, bool } = makeEnvHelpers({ isProd })

export const env = {
    nodeEnv: NODE_ENV,
    isProd,

    app: {
        host: process.env.APP_HOST || 'http://localhost',
        port: num('APP_PORT', 3000),
        name: process.env.APP_NAME || 'Node Admin',
        // Mode aplikasi: 'full' (UI web + REST API) atau 'api' (REST API saja).
        // Varian api-only di-set APP_MODE=api; default 'full'. Upgrade api→full
        // cukup ubah env ini (lihat `nodeadmin add-ui`), tanpa ganti entry.
        mode: (process.env.APP_MODE === 'api' ? 'api' : 'full') as 'full' | 'api',
    },

    db: {
        type: (process.env.DB_TYPE || 'mysql'),
        host: process.env.DB_HOST,
        port: num('DB_PORT', 3306),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: bool('DB_SYNCHRONIZE', false),
        logging: bool('DB_LOGGING', false),
        connectionLimit: num('DB_CONNECTION_LIMIT', 10),
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    },

    session: {
        secret: required('SESSION_SECRET'),
        ttlMs: num('SESSION_TTL_HOURS', 6) * 60 * 60 * 1000,
    },

    jwt: {
        secret: required('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        algorithm: 'HS256' as const,
    },

    security: {
        bcryptRounds: num('BCRYPT_ROUNDS', 10),
        otpExpiryMs: num('OTP_EXPIRY_MINUTES', 10) * 60 * 1000,
    },

    mail: {
        host: process.env.MAIL_HOST,
        port: num('MAIL_PORT', 587),
        secure: bool('MAIL_SECURE', false),
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD,
        fromName: process.env.MAIL_FROM_NAME || 'Node Admin',
        fromAddress: process.env.MAIL_FROM_ADDRESS || 'no-reply@example.com',
    },

    storage: {
        driver: (process.env.STORAGE_DRIVER || 'oss') as 'oss' | 's3',
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY as string,
        endpoint: process.env.STORAGE_ENDPOINT,
        bucket: process.env.STORAGE_BUCKET,
        region: process.env.STORAGE_REGION,
        ssl: bool('STORAGE_SSL', true),
    },

    pagination: {
        defaultPageSize: num('DEFAULT_PAGE_SIZE', 10),
    },

    roles: {
        administrator: 'Administrator',
    },
}

export default env
