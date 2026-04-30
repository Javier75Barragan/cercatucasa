import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '../types';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Error de validación: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        };
        return res.status(400).json(response);
      }
      return res.status(400).json({ success: false, error: 'Error de validación interno' });
    }
  };
};
