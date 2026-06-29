import request from 'supertest'
import { app } from '../../src/index'
import { ADMIN, USER } from './jest.setup'

/**
 * Login web (session + CSRF). Mengembalikan agent supertest dengan cookie
 * tersimpan + token CSRF untuk dipakai di request mutasi.
 */
export async function loginWeb(creds = ADMIN) {
    const agent = request.agent(app)
    const loginPage = await agent.get('/auth/login')
    const csrf = extractCsrf(loginPage.text)
    await agent
        .post('/auth/login')
        .type('form')
        .send({ email: creds.email, password: creds.password, _csrf: csrf })
    return { agent, csrf }
}

/** Ambil token CSRF terbaru dari sebuah halaman (untuk form mutasi). */
export async function getCsrf(agent: any, path = '/admin/v1/setting'): Promise<string> {
    const page = await agent.get(path)
    return extractCsrf(page.text)
}

export function extractCsrf(html: string): string {
    const m = html.match(/name="csrf-token" content="([^"]+)"/)
    return m ? m[1] : ''
}

/** Login API (JWT). Mengembalikan access token. */
export async function loginApi(creds = ADMIN): Promise<string> {
    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: creds.email, password: creds.password })
    return res.body?.data?.access_token || ''
}

export { ADMIN, USER }
