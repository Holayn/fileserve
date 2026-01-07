import { Share } from "../models/share.js";
import { getShareFiles } from "../repositories/share-repository.js";
import { getVideoStreamPath, isVideo, getContentType, getVideoOptimizedPath } from "../util/file.js";
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import { isImage } from "../util/file.js";
import { ShareFile } from "../models/share-file.js";

export async function webifyShare(share: Share, updateProgress: (message: string) => void) {
  const files = await getShareFiles(share.id);

  for (const file of files) {
    if (isVideo(file.filePath)) {
      const conversionType = await determineVideoConversionType(file);
      if (conversionType === 'stream') {
        const streamPath = getVideoStreamPath(file);
        if (await fs.exists(streamPath)) {
          continue;
        }

        updateProgress(`Generating video stream for ${file.fileName}`);

        try {
          await generateVideoStream(file);
        } catch (error) {
          console.error(`Error generating video stream for ${file.fileName}:`, error);
          await fs.unlink(streamPath);
          process.exit(1);
        }
      } else if (conversionType === 'optimized') {
        const optimizedPath = getVideoOptimizedPath(file);
        if (await fs.exists(optimizedPath)) {
          continue;
        }

        updateProgress(`Generating optimized video for ${file.fileName}`);

        try {
          await generateOptimizedVideo(file);
        } catch (error) {
          console.error(`Error generating optimized video for ${file.fileName}:`, error);
          await fs.unlink(optimizedPath);
          process.exit(1);
        }
      } else {
        throw new Error('Invalid conversion type');
      }
    }
  }
}

export async function isWebifyingNeeded(filePath: string): Promise<boolean> {
  if (isVideo(filePath)) {
    return true;
  }

  return false;
}


export async function isFileWebViewAvailable(file: ShareFile): Promise<boolean> {
  if (isVideo(file.filePath)) {
    if (await isVideoNeedStreamingConversion(file)) {
      return await fs.exists(getVideoStreamPath(file));
    }
    return await fs.exists(getVideoOptimizedPath(file));
  } else if (isImage(file.filePath)) {
    return isImage(file.filePath, ['.png', '.jpg', '.jpeg', '.gif', '.webp']) && await fs.exists(file.filePath);
  }

  return false;
}

async function determineVideoConversionType(file: ShareFile): Promise<'stream' | 'optimized'> {
  if (isVideo(file.filePath)) {
    if (await isVideoNeedStreamingConversion(file)) {
      return 'stream';
    }
    return 'optimized';
  }

  throw new Error('File is not a video');
}

export async function isVideoNeedStreamingConversion(file: ShareFile): Promise<boolean> {
  const contentType = getContentType(file.filePath);

  if (contentType.startsWith('video/')) {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'format=duration,bit_rate',
      '-of', 'json',
      file.filePath,
    ]);

    const metadata = JSON.parse(stdout);

    const duration = parseFloat(metadata.format.duration);
    const bitRate = parseInt(metadata.format.bit_rate);

    const DURATION_THRESHOLD = 60; // 1 minute
    const BITRATE_THRESHOLD = 6000000; // 6 Mbps

    if (duration > DURATION_THRESHOLD || bitRate > BITRATE_THRESHOLD) {
      return true
    }
  }

  throw new Error('File is not a video');
}

async function generateVideoStream(file: ShareFile) {
  const outputDir = getVideoStreamPath(file);

  if (!await fs.exists(outputDir)) {
    await fs.mkdir(outputDir);
  }

  await execa('ffmpeg', [
    '-i', file.filePath,
    // This ensures we never upscale, only downscale or stay the same size
    '-vf', 'scale=w=\'min(1920,iw)\':h=-2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'copy',
    '-f', 'hls',                 // Force HLS format
    '-hls_time', '6',            // 6-second segments
    '-hls_playlist_type', 'vod', // Tells the player this is not a "live" stream
    '-hls_segment_filename', path.join(outputDir, 'seg-%03d.ts'),
    '-y',
    path.join(outputDir, 'playlist.m3u8'),
  ]);
}

async function generateOptimizedVideo(file: ShareFile) {
  const output = getVideoOptimizedPath(file);

  if (!await fs.exists(path.dirname(output))) {
    await fs.mkdir(path.dirname(output));
  }

  await execa('ffmpeg', [
    '-i', file.filePath,
    // This ensures we never upscale, only downscale or stay the same size
    '-vf', 'scale=w=\'min(1920,iw)\':h=-2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    '-y',
    output,
  ]);
}