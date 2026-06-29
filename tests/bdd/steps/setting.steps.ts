import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { CustomWorld, ADMIN, extractCsrf } from './world'
import { getSetting } from '../../../src/services/settingCache'

Given('saya login sebagai admin', async function (this: CustomWorld) {
    const page = await this.agent.get('/auth/login')
    const csrf = extractCsrf(page.text)
    await this.agent.post('/auth/login').type('form')
        .send({ email: ADMIN.email, password: ADMIN.password, _csrf: csrf })
})

When('saya membuka halaman setting', async function (this: CustomWorld) {
    this.response = await this.agent.get('/admin/v1/setting')
    this.csrf = extractCsrf(this.response.text)
})

Then('saya melihat pilihan tema', function (this: CustomWorld) {
    assert.strictEqual(this.response.status, 200)
    assert.ok(this.response.text.includes('name="theme"'))
})

When('saya mengganti tema ke {string}', async function (this: CustomWorld, theme: string) {
    const page = await this.agent.get('/admin/v1/setting')
    const csrf = extractCsrf(page.text)
    this.response = await this.agent.post('/admin/v1/setting/update?_method=PUT').type('form')
        .send({ theme, name: 'Test', _csrf: csrf })
})

Then('tema aktif menjadi {string}', async function (this: CustomWorld, theme: string) {
    const s = await getSetting()
    assert.strictEqual(s?.theme, theme)
})
