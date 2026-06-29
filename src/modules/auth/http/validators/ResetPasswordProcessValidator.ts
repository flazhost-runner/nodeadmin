import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { ResponseHandler } from '@flazhost-nodeadmin/core';

const userSchema: ObjectSchema = Joi.object({
    otp: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password & confirm password not match.'
    }),
});

const ResetPasswordProcessValidator = (req: Request, res: Response, next: NextFunction): void => {
    let errorTotal: any[] = []

    const { error } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => ({
            path: detail.context?.key,
            msg: detail.message,
        }));
        errorTotal = errors
    }

    if (req.url.includes('/api/')) {
        if (errorTotal.length > 0) {
            return ResponseHandler.validationError(res, errorTotal)
        }
    } else {
        if (errorTotal.length > 0) {
            req.session.errors = errorTotal
            req.session.old = req.body
            return res.redirect(req.get('Referrer') || '/')
        }
    }

    next();
};

export { ResetPasswordProcessValidator };
