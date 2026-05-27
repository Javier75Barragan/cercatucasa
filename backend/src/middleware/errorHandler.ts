import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // LOG DETALLADO PARA EL PROGRAMADOR
  console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.error(`🚨 ERROR EN PROCESO: ${req.method} ${req.originalUrl}`);
  console.error(`📅 ${new Date().toLocaleString()}`);
  console.error(`🔴 MENSAJE: ${err.message}`);
  if (err.code) console.error(`🆔 CÓDIGO: ${err.code}`);
  if (err.stack) {
    const stackLines = err.stack.split('\n');
    if (stackLines.length > 1) {
      console.error(`📚 STACK: ${stackLines[1].trim()}`);
    }
  }
  console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Errores de PostgreSQL
  if (err.code === '23505') {
    res.status(409).json({
      success: false,
      error: 'El recurso ya existe',
      details: err.message,
    });
    return;
  }

  if (err.code?.startsWith('22')) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: err.message,
    });
    return;
  }

  if (err.code?.startsWith('23')) {
    res.status(400).json({
      success: false,
      error: 'Violación de restricción',
      details: err.message,
    });
    return;
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
};

// Wrapper para controladores async
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
