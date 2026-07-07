import { createClient } from 'redis'
import connectRedis from 'connect-redis'
import session from 'express-session'
import { env } from '../config/env'

// Klien Redis terpusat — dipisah dari entrypoint (index.ts) agar modul lain
// (authMiddleware, AuthController) tak mengimpor balik ke entrypoint.
// Ini memutus kopling balik dan jadi prasyarat ekstraksi @flazhost-nodeadmin/core.

export const RedisStore = connectRedis(session)

// Managed Redis (flazhost) berada di belakang HAProxy yang route berdasarkan SNI:
// node-redis TIDAK mengirim SNI hanya dari URL `rediss://` → HAProxy menutup koneksi
// (SocketClosedUnexpectedly). Kirim `servername` eksplisit — hanya untuk TLS, agar
// `redis://` lokal (non-TLS) tak berubah.
const redisIsTls = env.redis.url.startsWith('rediss://')

export const clientRedis = createClient({
    url: env.redis.url,
    legacyMode: true,
    ...(redisIsTls && { socket: { tls: true, servername: new URL(env.redis.url).hostname } }),
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
