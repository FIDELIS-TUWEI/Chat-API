const { body, validationResult } = require("express-validator");

const userValidationRules = () => {
    return [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),

        body('email')
            .isEmail()
            .withMessage('Must be a valid email address')
            .normalizeEmail()
            .isLength({ max: 100 })
            .withMessage('Email must not exceed 100 characters'),

        body('password')
            .isLength({ min: 8, max: 255 })
            .withMessage('Password must be atleast 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

        body('profile_picture')
            .optional()
            .isURL()
            .withMessage('Profile picture must be a valid URL')
            .isLength({ max: 255 })
            .withMessage('Profile picture URL must not exceed 255 characters'),

        body('is_verified')
            .optional()
            .isBoolean()
            .withMessage('Is verified must be a boolean value'),
        
        body('mfa_enabled')
        .optional()
        .isBoolean()
        .withMessage('MFA enabled must be a boolean value'),
    ];
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const extractedErrors = [];
    errors.array().forEach(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors
    })
}

module.exports = {
    userValidationRules, validate
};