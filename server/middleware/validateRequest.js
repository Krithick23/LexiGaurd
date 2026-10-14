import { z } from 'zod';
import { normalizeRole } from '../models/User.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace with validated and sanitized data
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errorDetails = err.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: errorDetails[0]?.message || 'Validation failed',
        errors: errorDetails,
      });
    }
    next(err);
  }
};

// Common Validation Schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z
      .string()
      .optional()
      .transform((val) => normalizeRole(val))
      .default('freelancer'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    role: z
      .string()
      .optional()
      .transform((val) => normalizeRole(val)),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const compareContractsSchema = z.object({
  body: z.object({
    contractId1: z.string().min(1, 'First contract ID is required'),
    contractId2: z.string().min(1, 'Second contract ID is required'),
  }),
});
