import { Router, Request, Response } from 'express';
import {
  getShareByReference,
  getShareFiles,
  getShareFileByReference,
} from '../repositories/share-repository.js';
import { asyncHandler } from '../util/route.js';
import logger from '../util/logger.js';
import send from 'send';
import { authShare } from '../middleware/auth.js';
import { getContentType } from '../util/file.js';
import { isFileWebViewAvailable, isVideoNeedStreamingConversion } from '../services/webifier.js';
import path from 'path';
import { DATA_PATH } from '../config/env.js';

const router = Router();

router.get('/',
  authShare(
    req => req.query.reference as string,
    (req, res) => {
      const share = getShareByReference(req.query.reference as string);
      return res.status(401).json({
        error: 'Unauthorized',
        name: share?.name ?? 'Unknown share',
      });
    }
  ),
  (req: Request, res: Response) => {
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
      name: share.name,
      files: files.map((file) => ({
        reference: file.reference,
        fileName: file.fileName,
        contentType: getContentType(file.filePath),
      })),
    });
  });

router.post('/auth', (req: Request, res: Response) => {
  const { reference, password } = req.body as { reference: string; password: string };

  if (!reference || !password) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const share = getShareByReference(reference);
  if (!share) {
    return res.status(404).json({ error: 'Share not found' });
  }

  if (!share.validatePassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.cookie(`auth---${share.reference}`, share.getAuthToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.ENV !== 'development',
  });

  res.sendStatus(200);
});

router.get(
  '/file',
  authShare(
    req => req.query.share as string,
    (req, res) => {
      return res.redirect(`/?share=${req.query.share}`);
    }
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { reference, share: shareReference } = req.query as {
      reference: string;
      share: string;
    };

    if (!reference || !shareReference) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const shareFile = getShareFileByReference(reference);
    if (!shareFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const share = getShareByReference(shareReference);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (shareFile.shareId !== share.id) {
      return res.status(403).json({ error: 'Invalid share reference' });
    }

    const filePath = shareFile.absPath;

    // Set appropriate headers
    const contentType = getContentType(filePath);
    const disposition = 'attachment';

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${shareFile.fileName}"`,
    );
    res.setHeader('Content-Type', contentType);

    sendFile(filePath, req, res);
  }),
);

router.get(
  '/file/view',
  authShare(
    req => req.query.share as string,
    (req, res) => {
      return res.redirect(`/?share=${req.query.share}`);
    }
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { reference, share: shareReference } = req.query as {
      reference: string;
      share: string;
    };

    if (!reference || !shareReference) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const shareFile = getShareFileByReference(reference);
    if (!shareFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const share = getShareByReference(shareReference);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (shareFile.shareId !== share.id) {
      return res.status(403).json({ error: 'Invalid share reference' });
    }

    if (!await isFileWebViewAvailable(shareFile)) {
      return res.status(404).json({ error: 'File preview unavailable' });
    }

    let filePath: string;

    if (shareFile.isVideo()) {
      if (await isVideoNeedStreamingConversion(shareFile)) {
        return res.redirect(`/api/share/hls/${shareReference}/${reference}/playlist.m3u8`);
      } else {
        filePath = shareFile.videoOptimizedPath;
      }
    } else if (shareFile.isImage()) {
      filePath = shareFile.absPath;
    } else {
      return res.status(404).json({ error: 'File preview unavailable' });
    }

    const contentType = getContentType(filePath);
    const disposition = 'inline';

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${shareFile.fileName}"`,
    );
    res.setHeader('Content-Type', contentType);

    sendFile(filePath, req, res);
  }),
);

router.get(
  '/hls/:share/:reference/:filename',
  authShare(
    req => req.params.share,
    (req, res) => res.status(401).json({ error: 'Unauthorized' })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { share: shareReference, reference, filename } = req.params;

    const shareFile = getShareFileByReference(reference);
    if (!shareFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const share = getShareByReference(shareReference);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (shareFile.shareId !== share.id) {
      return res.status(403).json({ error: 'Invalid share reference' });
    }

    const hlsDirectory = shareFile.videoStreamPath;
    const filePath = path.join(hlsDirectory, filename);

    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(403).json({ error: 'Invalid filename' });
    }

    // Set correct MIME types for HLS
    if (filename.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/x-mpegURL');
    } else if (filename.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }

    sendFile(filePath, req, res);
  })
);

function sendFile(filePath: string, req: Request, res: Response) {
  if (process.env.ENV !== 'development') {
    console.log(`X-Accel-Redirect: /files${filePath.replace(DATA_PATH, '')}`);
    res.setHeader('X-Accel-Redirect', `/files${filePath.replace(DATA_PATH, '')}`);
    res.end();
  } else {
    send(req, filePath)
      .on('error', (error: Error) => {
        logger.error(`Error streaming file: ${filePath}`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      })
      .pipe(res);
  }
}

export default router;
