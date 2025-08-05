import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2).max(100),
    phoneNumber: z.string().optional()
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string()
  }),

  createGroup: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    contributionAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    frequency: z.enum(['weekly', 'monthly', 'bi-weekly']),
    maxMembers: z.number().int().min(2).max(50),
    currency: z.string().length(3).default('USD')
  }),

  makeContribution: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    paymentMethod: z.string()
  }),

  uuidParam: z.object({
    id: z.string().uuid()
  })
};
