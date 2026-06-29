import { body } from 'express-validator'

export const permissionValidationRules = () => {
    let rule = [
        body('name').notEmpty().withMessage('Name is required'),
        body('status').notEmpty().withMessage('Status is required'),
        body('method').notEmpty().withMessage('Method is required'),
    ]

    return rule
}
