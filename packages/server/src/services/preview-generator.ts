import { execa } from 'execa';
import { getContentType, isFileNeedsPreview, getFilePreviewPath } from "../util/file.js";

export async function generatePreview(filePath: string) {
  if (!await isFileNeedsPreview(filePath)) {
    return;
  }

  if (getContentType(filePath).startsWith('video/')) {
    await generateVideoPreview(filePath);
  }
}

async function generateVideoPreview(videoPath: string) {
  await execa('ffmpeg', [
    '-i', videoPath,
    // This ensures we never upscale, only downscale or stay the same size
    '-vf', 'scale=w=\'min(1920,iw)\':h=-2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    '-y',
    getFilePreviewPath(videoPath),
  ]); 
}