import { createClient } from 'redis'
import connectRedis from 'connect-redis'
import session from 'express-session'
import { env } from '../config/env'

// Klien Redis terpusat — dipisah dari entrypoint (index.ts) agar modul lain
// (authMiddleware, AuthController) tak mengimpor balik ke entrypoint.
// Ini memutus kopling balik dan jadi prasyarat ekstraksi @flazhost-nodeadmin/core.

export const RedisStore = connectRedis(session)

export const clientRedis = createClient({
    url: env.redis.url,
    legacyMode: true,
})

clientRedis.on('error', (err) => {
    console.error('Redis error:', err)
})

// Koneksi awal saat bootstrap server (dipanggil dari index.ts).
export const cntRedis = async () => {
    try {
        await clientRedis.connect()
        console.log('Connected to Redis')
    } catch (err) {
        console.error('Could not connect to Redis:', err)
    }
}
