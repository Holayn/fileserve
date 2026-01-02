import { Router, Request, Response } from 'express';
import {
  getShareByReference,
  getShareFiles,
  getShareFileByReference,
} from '../repositories/share-repository.js';
import { getFileInfo } from '../util/fs.js';
import { lookup } from 'mime-types';
import { asyncHandler } from '../util/route.js';
import logger from '../util/logger.js';
import send from 'send';

const router = Router();

function getContentType(filePath: string): string {
  return lookup(filePath) || 'application/octet-stream';
}

router.get('/', (req: Request, res: Response) => {
  const { reference } = req.query as { reference: string };

  if (!reference) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const share = getShareByReference(reference);
  if (!share) {
    return res.status(404).json({ error: 'Share not found' });
  }

  const files = getShareFiles(share.id);

  res.json({
    share: {
      name: share.name,
      reference: share.reference,
    },
    files: files.map((file) => ({
      reference: file.reference,
      fileName: file.fileName,
    })),
  });
});

router.get(
  '/file',
  asyncHandler(async (req: Request, res: Response) => {
    const { reference, share: shareReference } = req.query as {
      reference: string;
      share: string;
    };

    if (!reference || !shareReference) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get file info and validate share reference
    const shareFile = getShareFileByReference(reference);
    if (!shareFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const share = getShareByReference(shareReference);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Validate that the share reference matches
    if (share.reference !== shareReference) {
      return res.status(403).json({ error: 'Invalid share reference' });
    }

    // Check if file exists on disk and handle symlinks
    let filePath: string;
    try {
      const fileInfo = await getFileInfo(shareFile.filePath);
      filePath = fileInfo.path;
      if (!fileInfo.isFile) {
        return res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${shareFile.fileName}"`,
    );
    res.setHeader('Content-Type', getContentType(shareFile.filePath));

    // Stream the file using send library (handles range requests automatically)
    send(req, filePath)
      .on('error', (error: Error) => {
        logger.error(`Error streaming file: ${filePath}`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      })
      .pipe(res);
  }),
);

export default router;
