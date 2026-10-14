import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // Prisma unique constraint error
  if (err?.code === 'P2002') {
    const fields = err.meta?.target ? ` (${err.meta.target})` : '';
    return res.status(409).json({
      success: false,
      message: `A duplicate record already exists with the same unique identifier${fields}.`,
    });
  }

  // Prisma record not found error
  if (err?.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found.',
    });
  }

  console.error('[Unhandled Error]:', err);

  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
