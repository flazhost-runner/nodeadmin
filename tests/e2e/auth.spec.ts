import { test, expect } from '@playwright/test'
import { login, ADMIN } from './helpers/auth'
import { expectAlertError, logout } from './helpers/ui'

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Auth › Login', () => {
  test('login kredensial valid → redirect ke dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveTitle(/Node Admin/i)
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/v1/dashboard')
    await expect(page).toHaveURL(/\/admin\/v1\/dashboard/)
  })

  test('sudah terautentikasi → akses halaman login redirect ke dashboard', async ({ page }) => {
    await login(page)
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/admin\/v1\/dashboard/)
  })

  test('password salah → tetap di login + alert error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#email', ADMIN.email)
    await page.fill('#password', 'salah-password-123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expectAlertError(page)
  })

  test('email tidak terdaftar → tetap di login + alert error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('#email', 'tidakada@example.com')
    await page.fill('#password', 'anypassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/auth\/login/)
    await expectAlertError(page)
  })

  test('form login memiliki field email dan password', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

// ─── Register ─────────────────────────────────────────────────────────────────

test.describe('Auth › Register', () => {
  test('halaman register tampil dengan form', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('h1')).toContainText('Create Account')
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('submit form kosong → kembali ke halaman register (validasi gagal)', async ({ page }) => {
    await page.goto('/auth/register')
    await page.click('button[type="submit"]')
    // Validator membutuhkan code/roles/status yang tidak ada di form → redirect balik
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('link "Already have an account?" mengarah ke halaman login', async ({ page }) => {
    await page.goto('/auth/register')
    await page.locator('a:has-text("Already have an account")').click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// ─── Logout ──────────────────────────────────────────────────────────────────

test.describe('Auth › Logout', () => {
  test('logout sukses → redirect ke halaman login', async ({ page }) => {
    await login(page)
    await logout(page)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('setelah logout akses halaman admin → redirect ke login', async ({ page }) => {
    await login(page)
    await logout(page)
    await page.goto('/admin/v1/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// ─── Reset Password ───────────────────────────────────────────────────────────

test.describe('Auth › Reset Password', () => {
  test('halaman request reset tampil dengan form email', async ({ page }) => {
    await page.goto('/admin/v1/auth/reset/req')
    await expect(page.locator('h1')).toContainText('Forgot Password')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('request reset email tidak terdaftar → redirect login + alert error', async ({ page }) => {
    await page.goto('/admin/v1/auth/reset/req')
    await page.fill('input[name="email"]', 'tidakada@example.com')
    await page.locator('button[type="submit"]').click()
    // Controller redirect ke /auth/login dengan error flash bila email tidak ditemukan
    await expect(page).toHaveURL(/\/auth\/login/)
    await expectAlertError(page)
  })

  test('halaman process reset tampil dengan semua field', async ({ page }) => {
    await page.goto('/admin/v1/auth/reset/proc')
    await expect(page.locator('h1')).toContainText('Reset Password')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="otp"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="password_confirmation"]')).toBeVisible()
  })

  test('submit OTP tidak valid → tetap di process reset + alert error', async ({ page }) => {
    await page.goto('/admin/v1/auth/reset/proc')
    await page.fill('input[name="email"]', ADMIN.email)
    await page.fill('input[name="otp"]', '000000')
    await page.fill('input[name="password"]', 'NewPassword123!')
    await page.fill('input[name="password_confirmation"]', 'NewPassword123!')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/v1\/auth\/reset\/proc/)
    await expectAlertError(page)
  })
})

// ─── Guard ────────────────────────────────────────────────────────────────────

test.describe('Auth › Guard', () => {
  test('akses user management tanpa login → redirect login', async ({ page }) => {
    await page.goto('/admin/v1/access/user')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('akses dashboard tanpa login → redirect login', async ({ page }) => {
    await page.goto('/admin/v1/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('akses setting tanpa login → redirect login', async ({ page }) => {
    await page.goto('/admin/v1/setting')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('akses profile tanpa login → redirect login', async ({ page }) => {
    await page.goto('/admin/v1/profile')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
