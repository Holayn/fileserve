import { lookup } from 'mime-types';

export function getContentType(filePath: string): string {
  return lookup(filePath) || 'application/octet-stream';
}
