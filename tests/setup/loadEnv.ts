import * as dotenv from 'dotenv'
import path from 'path'

// Muat .env.test SEBELUM modul aplikasi di-import (config/env membaca process.env
// saat modul pertama kali di-load). override:true agar menimpa .env biasa.
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true })
process.env.NODE_ENV = 'test'
process.env.TZ = 'UTC'
