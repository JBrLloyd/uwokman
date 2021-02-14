import { Request, Response, NextFunction } from 'express';
import logger from '../util/logger';

export let requestCancelled = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cancelRequestHandler = ((err: any, req: Request, res: Response, next: NextFunction) => {
  req.on('aborted', function (err: any) {
    logger.info(`Request Cancelled - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    requestCancelled = true;
  });

  req.on('closed', function (err: any) {
    logger.info(`Request Cancelled - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    requestCancelled = true;
  });
});