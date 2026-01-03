import { Request, Response, NextFunction } from 'express';
import { getShareByReference } from '../repositories/share-repository.js';

export function authShare(req: Request, res: Response, next: NextFunction) {
  const { reference } = req.query as { reference: string };

  if (!reference) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const share = getShareByReference(reference);
  if (!share) {
    return res.status(404).json({ error: 'Share not found' });
  }

  if (share.password) {
    const key = `auth---${share.reference}`;
    const auth = req.cookies[key] as string | undefined;
    
    if (!auth || auth !== share.getAuthToken()) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  }

  next();
}