import { Share } from './share.js';
import { getShareById } from '../repositories/share-repository.js';
import { generateHash } from '../util/security.js';
import { getContentType } from '../util/file.js';
import { FILES_PATH, STREAMS_PATH, WEB_OPTIMIZED_PATH } from '../util/constants.js';
import path from 'path';

export class ShareFile {
  constructor(
    public id: number,
    public shareId: number,
    public filePath: string,
    public fileName: string,
    public reference: string,
  ) {}

  get absPath(): string {
    return path.join(FILES_PATH, this.filePath);
  }

  get videoOptimizedPath(): string {
    return path.join(WEB_OPTIMIZED_PATH, `${generateHash(this.filePath)}-${path.basename(this.filePath)}`);
  }
  
  get videoStreamPath(): string {
    return path.join(STREAMS_PATH, `${generateHash(this.filePath)}-${path.basename(this.filePath)}`);
  }

  getShare(): Share | undefined {
    return getShareById(this.shareId);
  }

  isVideo() {
    return isVideo(this);
  }

  isImage() {
    return isImage(this);
  }
}

function isVideo(file: ShareFile): boolean {
  const contentType = getContentType(file.filePath);
  return contentType.startsWith('video/');
}

function isImage(file: ShareFile): boolean {
  const contentType = getContentType(file.filePath);
  return contentType.startsWith('image/');
}
