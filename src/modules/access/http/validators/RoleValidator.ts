import { body } from 'express-validator'

export const roleValidationRules = () => {
    let rule = [
        body('name').notEmpty().withMessage('Name is required'),
        body('status').notEmpty().withMessage('Status is required'),
    ]

    return rule
}
