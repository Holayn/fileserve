import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

export const nonceGenerator = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.locals.nonce = randomBytes(16).toString('base64');
  next();
};

export const cspDirectives = {
  defaultSrc: ["'self'"],
  // data: allows VideoJS base64-encoded WOFF fonts
  fontSrc: ["'self'", 'data:'],
  imgSrc: ['*'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  // blob: allows VideoJS blob workers
  workerSrc: ["'self'", 'blob:'],
};
