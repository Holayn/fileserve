import { lookup } from 'mime-types';
import { execa } from 'execa';
import path from 'path';
import { generateHash } from './security.js';
import { PREVIEWS_PATH } from '../config/env.js';

export function getContentType(filePath: string): string {
  return lookup(filePath) || 'application/octet-stream';
}

export async function isFileNeedsPreview(filePath: string): Promise<boolean> {
  const contentType = getContentType(filePath);

  if (contentType.startsWith('video/')) {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,bit_rate',
      '-of', 'json',
      filePath,
    ]);

    const info = JSON.parse(stdout);
    const videoStream = info.streams[0];
    const width = videoStream.width || 0;
    const bitrate = parseInt(videoStream.bit_rate) || 0;

    // Transcode if width > 1920 (4K) OR bitrate > 10Mbps
    if (width > 1920 || bitrate > 10000000) {
      return true;
    }
  }

  return false;
}

export function getFilePreviewPath(filePath: string): string {
  return path.join(PREVIEWS_PATH, `${generateHash(filePath)}-${path.basename(filePath)}`);
}