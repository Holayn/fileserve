import { Share } from "../models/share.js";
import { getShareFiles } from "../repositories/share-repository.js";
import { getContentType } from "../util/file.js";
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import { ShareFile } from "../models/share-file.js";

const CONVERSION_TYPE_VIDEO_STREAM = 'stream';
const CONVERSION_TYPE_VIDEO_OPTIMIZED = 'optimized';

export async function webifyShare(share: Share, updateProgress: (message: string) => void) {
  const files = await getShareFiles(share.id);

  for (const file of files) {
    if (file.isVideo()) {
      const conversionType = await determineVideoConversionType(file);
      if (conversionType === CONVERSION_TYPE_VIDEO_STREAM) {
        const streamPath = file.videoStreamPath;
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
      } else if (conversionType === CONVERSION_TYPE_VIDEO_OPTIMIZED) {
        const optimizedPath = file.videoOptimizedPath;
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
  if (getContentType(filePath).startsWith('video')) {
    return true;
  }

  return false;
}


export async function isFileWebViewAvailable(file: ShareFile): Promise<boolean> {
  if (file.isVideo()) {
    if (await isVideoNeedStreamingConversion(file)) {
      return await fs.exists(file.videoStreamPath);
    }
    return await fs.exists(file.videoOptimizedPath);
  } else if (file.isImage()) {
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(path.extname(file.filePath).toLowerCase())
  }

  return false;
}

async function determineVideoConversionType(file: ShareFile): Promise<typeof CONVERSION_TYPE_VIDEO_STREAM | typeof CONVERSION_TYPE_VIDEO_OPTIMIZED> {
  if (file.isVideo()) {
    if (await isVideoNeedStreamingConversion(file)) {
      return CONVERSION_TYPE_VIDEO_STREAM;
    }
    return CONVERSION_TYPE_VIDEO_OPTIMIZED;
  }

  throw new Error('File is not a video');
}

export async function isVideoNeedStreamingConversion(file: ShareFile): Promise<boolean> {
  if (file.isVideo()) {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'format=duration,bit_rate',
      '-of', 'json',
      file.absPath,
    ]);

    const metadata = JSON.parse(stdout);

    const duration = parseFloat(metadata.format.duration);
    const bitRate = parseInt(metadata.format.bit_rate);

    const DURATION_THRESHOLD = 60; // 1 minute
    const BITRATE_THRESHOLD = 6000000; // 6 Mbps

    return duration > DURATION_THRESHOLD || bitRate > BITRATE_THRESHOLD;
  }

  throw new Error('File is not a video');
}

async function generateVideoStream(file: ShareFile) {
  const outputDir = file.videoStreamPath;

  if (!await fs.exists(outputDir)) {
    await fs.mkdir(outputDir);
  }

  await execa('ffmpeg', [
    '-i', file.absPath,
    // This ensures we never upscale, only downscale or stay the same size
    '-vf', 'scale=w=\'min(1920,iw)\':h=-2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-c:a', 'aac',               // Transcode audio to AAC for HLS/browser compatibility
    '-b:a', '128k',
    '-f', 'hls',                 // Force HLS format
    '-hls_time', '6',            // 6-second segments
    '-hls_playlist_type', 'vod', // Tells the player this is not a "live" stream
    '-hls_segment_filename', path.join(outputDir, 'seg-%03d.ts'),
    '-y',
    path.join(outputDir, 'playlist.m3u8'),
  ]);
}

async function generateOptimizedVideo(file: ShareFile) {
  const output = file.videoOptimizedPath;

  if (!await fs.exists(path.dirname(output))) {
    await fs.mkdir(path.dirname(output));
  }

  await execa('ffmpeg', [
    '-i', file.absPath,
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