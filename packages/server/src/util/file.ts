import { lookup } from 'mime-types';
import path from 'path';
import { generateHash } from './security.js';
import { DATA_PATH } from '../config/env.js';
import { ShareFile } from '../models/share-file.js';

export function getContentType(filePath: string): string {
  return lookup(filePath) || 'application/octet-stream';
}

export function isVideo(filePath: string): boolean {
  const contentType = getContentType(filePath);
  return contentType.startsWith('video/');
}

export function isImage(filePath: string, types?: string[]): boolean {
  const contentType = getContentType(filePath);
  if (types) {
    return contentType.startsWith('image/') && types.includes(path.extname(filePath).toLowerCase());
  }
  return contentType.startsWith('image/');
}

export function getVideoOptimizedPath(file: ShareFile): string {
  return path.join(DATA_PATH, 'web-optimized', `${generateHash(file.filePath)}-${path.basename(file.filePath)}`);
}

export function getVideoStreamPath(file: ShareFile): string {
  return path.join(DATA_PATH, 'streams', `${generateHash(file.filePath)}-${path.basename(file.filePath)}`);
}