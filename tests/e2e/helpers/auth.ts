import { Page } from '@playwright/test'

export const ADMIN = {
  email: 'admin@admin.com',
  password: '12345678',
}

export async function login(page: Page): Promise<void> {
  await page.goto('/auth/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#password', ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin/v1/dashboard')
}
