import fs from 'fs-extra';

export async function getFileInfo(filePath: string) {
  try {
    // Use fs.realpath to recursively resolve symlinks to the final target
    const realPath = await fs.realpath(filePath);
    const stats = await fs.lstat(realPath);

    return {
      path: realPath,
      isFile: stats.isFile(),
    };
  } catch (error) {
    throw new Error('File not found');
  }
}
