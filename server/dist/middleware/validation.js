"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validateQuery = exports.validateParams = exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors
                });
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: error.errors
                });
            }
            next(error);
        }
    };
};
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.errors
                });
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
// Common validation schemas
exports.schemas = {
    register: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        fullName: zod_1.z.string().min(2).max(100),
        phoneNumber: zod_1.z.string().optional()
    }),
    login: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string()
    }),
    createGroup: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        description: zod_1.z.string().optional(),
        contributionAmount: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/),
        frequency: zod_1.z.enum(['weekly', 'monthly', 'bi-weekly']),
        maxMembers: zod_1.z.number().int().min(2).max(50),
        currency: zod_1.z.string().length(3).default('USD')
    }),
    makeContribution: zod_1.z.object({
        amount: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/),
        paymentMethod: zod_1.z.string()
    }),
    uuidParam: zod_1.z.object({
        id: zod_1.z.string().uuid()
    })
};
