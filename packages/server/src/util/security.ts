import crypto from 'crypto';

export function generateHash(str: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}