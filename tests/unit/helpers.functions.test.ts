import { Functions as Function, removePrefix, ciLike } from '@flazhost-nodeadmin/core'

describe('helpers/functions', () => {
    describe('removePrefix', () => {
        it('membuang prefix dari key yang cocok', () => {
            const out = removePrefix({ q_name: 'a', q_page: '1', other: 'x' }, 'q_')
            expect(out).toEqual({ name: 'a', page: '1', other: 'x' })
        })
        it('mempertahankan key tanpa prefix', () => {
            expect(removePrefix({ foo: 'bar' }, 'q_')).toEqual({ foo: 'bar' })
        })
    })

    describe('ciLike', () => {
        it('menghasilkan fragmen LOWER..LIKE LOWER + params', () => {
            const [frag, params] = ciLike('users.name', 'name', 'Admin')
            expect(frag).toBe('LOWER(users.name) LIKE LOWER(:name)')
            expect(params).toEqual({ name: '%Admin%' })
        })
    })

    describe('removeEmptyFields', () => {
        it('membuang field undefined/null/empty', () => {
            const out = Function.removeEmptyFields({ a: 'x', b: '', c: null, d: undefined, e: 0 })
            expect(out).toEqual({ a: 'x', e: 0 })
        })
    })
})
