import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@admin.com', password: '12345678' }

test.describe('Auth E2E', () => {
    test('login → dashboard', async ({ page }) => {
        await page.goto('/auth/login')
        await expect(page).toHaveTitle(/Node Admin/i)
        await page.fill('#email', ADMIN.email)
        await page.fill('#password', ADMIN.password)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/admin/v1/dashboard')
        await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
    })

    test('login salah tetap di halaman login', async ({ page }) => {
        await page.goto('/auth/login')
        await page.fill('#email', ADMIN.email)
        await page.fill('#password', 'salah-password')
        await page.click('button[type="submit"]')
        await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('halaman admin tanpa login → redirect login', async ({ page }) => {
        await page.goto('/admin/v1/access/user')
        await expect(page).toHaveURL(/\/auth\/login/)
    })
})
