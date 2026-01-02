import { Share } from './share.js';
import { getShareById } from '../config/database.js';

export class ShareFile {
  constructor(
    public id: number,
    public shareId: number,
    public filePath: string,
    public fileName: string,
    public reference: string,
  ) {}

  getShare(): Share | undefined {
    return getShareById(this.shareId);
  }
}
