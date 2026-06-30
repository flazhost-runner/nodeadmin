import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { expectToast, confirmAndProceed, clickDropdownItem } from './helpers/ui'

let createdRoleId: string | undefined
const ts = Date.now()
const roleName = `E2E Role ${ts}`

test.describe('Access › Role Management', () => {
  test.describe.configure({ mode: 'serial' })

  // ─── Index ───────────────────────────────────────────────────────────────

  test('halaman role index tampil dengan tabel', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/role')
    await expect(page.locator('h1')).toContainText('Role Management')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('a:has-text("Add Data")')).toBeVisible()
  })

  test('search role berdasarkan nama', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/role')
    await page.fill('input[name="q_name"]', 'Admin')
    await page.locator('button[type="submit"][form="searchform"]').click()
    await expect(page).toHaveURL(/q_name=Admin/)
    await expect(page.locator('table')).toBeVisible()
  })

  // ─── Create ──────────────────────────────────────────────────────────────

  test('halaman create role tampil dengan form', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/role/create')
    await expect(page.locator('h2')).toContainText('Role Form')
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })

  test('create role sukses → redirect index + toast sukses', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/role/create')

    await page.fill('input[name="name"]', roleName)
    await page.fill('input[name="desc"]', `E2E test role created at ${ts}`)
    await page.selectOption('select[name="status"]', 'Active')

    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/role')
    await expectToast(page, 'Store Role Success.')

    // Ambil ID dari link edit pada baris yang baru dibuat
    const row = page.locator(`tbody tr:has-text("${roleName}")`)
    await row.locator('button[data-toggle-dd]').click()
    const href = await row.locator('a.dropdown-item[href*="/edit"]').getAttribute('href')
    createdRoleId = href?.match(/\/access\/role\/(\d+)\/edit/)?.[1]
  })

  test('create role validasi gagal (name kosong) → tetap di form + is-invalid', async ({ page }) => {
    await login(page)
    await page.goto('/admin/v1/access/role/create')
    // Submit tanpa nama
    await page.selectOption('select[name="status"]', 'Active')
    await page.locator('button[type="submit"]').click()
    // Validator express-validator redirect balik ke create
    await expect(page).toHaveURL(/\/admin\/v1\/access\/role\/create/)
    await expect(page.locator('.is-invalid')).toBeVisible()
  })

  // ─── Edit ────────────────────────────────────────────────────────────────

  test('halaman edit role tampil dengan data yang sudah terisi', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/edit`)
    await expect(page.locator('h2')).toContainText('Role Form')
    await expect(page.locator('input[name="name"]')).toHaveValue(roleName)
  })

  test('update role sukses → redirect index + toast sukses', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/edit`)
    await page.fill('input[name="name"]', `${roleName} Updated`)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/admin/v1/access/role')
    await expectToast(page, 'Update Role Success.')
  })

  // ─── Permission Assign/Unassign ──────────────────────────────────────────

  test('halaman permission role tampil dengan daftar permission', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/permission`)
    await expect(page.locator('h2')).toContainText('Permission List')
    await expect(page.locator('table')).toBeVisible()
  })

  test('assign permission ke role → toast sukses', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/permission`)

    // Klik Assign di baris permission pertama yang tersedia
    const firstRow = page.locator('tbody tr').first()
    await clickDropdownItem(firstRow, 'Assign')

    // Controller redirect kembali ke halaman permission dengan toast sukses
    await expectToast(page, 'Assign Permission Success.')
  })

  test('unassign permission dari role → toast sukses', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/permission`)

    // Klik Unassign di baris permission pertama (yang sudah di-assign)
    const firstRow = page.locator('tbody tr').first()
    await clickDropdownItem(firstRow, 'Unassign')

    await expectToast(page, 'Unassign Permission Success.')
  })

  test('assign selected: centang beberapa permission → assign sekaligus', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/permission`)

    // Centang 2 permission pertama
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await page.locator('button:has-text("Assign Selected")').click()
    await confirmAndProceed(page)
    await expectToast(page, 'Assign Permission Success.')
  })

  test('unassign selected: centang beberapa permission → unassign sekaligus', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto(`/admin/v1/access/role/${createdRoleId}/permission`)

    // Centang 2 permission pertama
    const checkboxes = page.locator('tbody input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await page.locator('button:has-text("Unassign Selected")').click()
    await confirmAndProceed(page)
    await expectToast(page, 'Unassign Permission Success.')
  })

  // ─── Delete ──────────────────────────────────────────────────────────────

  test('delete role → confirm dialog → toast sukses', async ({ page }) => {
    if (!createdRoleId) test.skip()
    await login(page)
    await page.goto('/admin/v1/access/role')

    const row = page.locator(`tbody tr:has-text("${roleName} Updated")`)
    await expect(row).toBeVisible()

    await clickDropdownItem(row, 'Delete')
    await confirmAndProceed(page)

    await page.waitForURL('**/admin/v1/access/role')
    await expectToast(page, 'Delete Role Success.')
  })
})
