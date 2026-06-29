import { convertDatesDeep } from '@flazhost-nodeadmin/core'

describe('utils/date convertDatesDeep', () => {
    it('mengonversi Date ke string timezone', () => {
        const d = new Date('2024-01-15T00:00:00Z')
        const out = convertDatesDeep({ created_at: d }, 'Asia/Jakarta') as any
        expect(typeof out.created_at).toBe('string')
        expect(out.created_at).toContain('2024-01-15')
    })

    it('menelusuri objek & array bersarang', () => {
        const out = convertDatesDeep({ list: [{ at: new Date('2024-01-01T00:00:00Z') }] }, 'UTC') as any
        expect(typeof out.list[0].at).toBe('string')
    })

    it('membiarkan nilai non-Date apa adanya', () => {
        const input = { a: 1, b: 'x', c: true, d: null }
        expect(convertDatesDeep(input, 'UTC')).toEqual(input)
    })
})
