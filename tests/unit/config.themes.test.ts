import { THEMES, THEME_NAMES, DEFAULT_THEME, getTheme } from '@flazhost-nodeadmin/core'

describe('config/themes', () => {
    it('punya 9 tema warna (Flutter dikecualikan)', () => {
        expect(THEME_NAMES.length).toBe(9)
        expect(THEME_NAMES).toContain('Blue')
        expect(THEME_NAMES).not.toContain('Flutter')
    })

    it('default Blue', () => {
        expect(DEFAULT_THEME).toBe('Blue')
    })

    it('getTheme mengembalikan palet tema yang diminta', () => {
        expect(getTheme('Red')).toEqual(THEMES.Red)
    })

    it('getTheme fallback ke default untuk nama tak dikenal / kosong', () => {
        expect(getTheme('Tidak Ada')).toEqual(THEMES.Blue)
        expect(getTheme(undefined)).toEqual(THEMES.Blue)
    })

    it('setiap palet punya 4 warna', () => {
        for (const name of THEME_NAMES) {
            expect(THEMES[name]).toHaveProperty('primary')
            expect(THEMES[name]).toHaveProperty('secondary')
            expect(THEMES[name]).toHaveProperty('light')
            expect(THEMES[name]).toHaveProperty('dark')
        }
    })
})
