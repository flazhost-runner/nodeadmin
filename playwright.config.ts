import { defineConfig, devices } from '@playwright/test'

/**
 * E2E + Browser-compatibility. Menjalankan dev server (MySQL) lalu menguji UI
 * di 3 engine browser (Chromium/Firefox/WebKit).
 * Jalankan: npm run test:e2e  (set E2E_BROWSERS=chromium untuk cepat)
 */
const only = process.env.E2E_BROWSERS // mis. "chromium"

const allProjects = [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    expect: { timeout: 10000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: only ? allProjects.filter(p => only.split(',').includes(p.name)) : allProjects,
    webServer: {
        command: 'npm run start:dev',
        url: 'http://localhost:3000/auth/login',
        timeout: 60000,
        reuseExistingServer: true,
    },
})
