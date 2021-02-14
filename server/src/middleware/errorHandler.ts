import { Request, Response, NextFunction } from 'express';
import logger from '../util/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = ((error: any, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};

  logger.error(`${error.statusCode || 500} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  res.status(error.statusCode || 500);
  res.send({
    'error': {
      'status': error.statusCode,
      'message': error.message,
    }
  });
});