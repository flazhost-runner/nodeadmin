import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Media', () => {
  test('media list (authenticated) → 200 + envelope JSON dengan data array', async ({ page }) => {
    await login(page)

    // page.request mewarisi cookie session browser yang sama
    const response = await page.request.get('/admin/v1/media/list')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status', true)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBeTruthy()
  })

  test('media list tanpa login → 302 redirect ke halaman login', async ({ page }) => {
    // Tidak login — request langsung tanpa session
    const response = await page.request.get('/admin/v1/media/list', {
      maxRedirects: 0,
    })
    // ensureAuthenticated middleware redirect ke /auth/login
    expect(response.status()).toBe(302)
    const location = response.headers()['location'] ?? ''
    expect(location).toMatch(/\/auth\/login/)
  })

  test('upload file gambar → 201 + envelope JSON dengan data file', async ({ page }) => {
    await login(page)

    // Buat file PNG 1x1 pixel minimal sebagai test fixture
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const response = await page.request.post('/admin/v1/media/upload', {
      multipart: {
        file: {
          name: `e2e-test-${Date.now()}.png`,
          mimeType: 'image/png',
          buffer: minimalPng,
        },
      },
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body).toHaveProperty('status', true)
    expect(body).toHaveProperty('data')
    // Data berisi informasi file yang diunggah
    expect(body.data).toHaveProperty('url')
  })

  test('delete file yang sudah diunggah → 200 + envelope JSON sukses', async ({ page }) => {
    await login(page)

    // Upload dulu untuk mendapatkan key file
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const fileName = `e2e-del-${Date.now()}.png`

    const uploadRes = await page.request.post('/admin/v1/media/upload', {
      multipart: {
        file: {
          name: fileName,
          mimeType: 'image/png',
          buffer: minimalPng,
        },
      },
    })
    expect(uploadRes.status()).toBe(201)
    const uploaded = await uploadRes.json()
    const fileKey = uploaded.data?.key ?? fileName

    // Hapus file yang baru diunggah
    const deleteRes = await page.request.post('/admin/v1/media/delete', {
      data: { key: fileKey },
    })
    expect(deleteRes.status()).toBe(200)
    const deleteBody = await deleteRes.json()
    expect(deleteBody).toHaveProperty('status', true)
  })
})
