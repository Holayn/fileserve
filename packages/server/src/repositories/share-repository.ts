import { randomUUID } from 'crypto';
import { ShareFile } from '../models/share-file.js';
import { Share } from '../models/share.js';
import { db } from '../config/database.js';
import { posix } from 'path';

interface ShareFileListResult {
  reference: string;
  file_name: string;
}

interface ShareFileDBResult {
  id: number;
  share_id: number;
  file_path: string;
  file_name: string;
  reference: string;
}

export const createShare = (
  name: string,
): { id: number; reference: string } => {
  const reference = randomUUID();

  const stmt = db.prepare('INSERT INTO share (name, reference) VALUES (?, ?)');
  const result = stmt.run(name, reference);

  return { id: result.lastInsertRowid as number, reference };
};

export const addFileToShare = (
  shareId: number,
  filePath: string,
  fileName: string,
): { id: number; reference: string } => {
  const reference = randomUUID();

  const stmt = db.prepare(
    'INSERT INTO share_file (share_id, file_path, file_name, reference) VALUES (?, ?, ?, ?)',
  );
  const result = stmt.run(
    shareId,
    posix.normalize(filePath.replace(/\\/g, '/')),
    fileName,
    reference,
  );

  return { id: result.lastInsertRowid as number, reference };
};

export const getShareByReference = (reference: string) => {
  const stmt = db.prepare('SELECT * FROM share WHERE reference = ?');
  return stmt.get(reference) as
    | { id: number; name: string; reference: string }
    | undefined;
};

export const getShareFiles = (shareId: number) => {
  const stmt = db.prepare<[number], ShareFileListResult>(
    'SELECT id, share_id, file_path, file_name, reference FROM share_file WHERE share_id = ?',
  );
  const results = stmt.all(shareId);
  return results.map((result) => ({
    reference: result.reference,
    fileName: result.file_name,
  }));
};

export const getShareFileByReference = (
  reference: string,
): ShareFile | undefined => {
  const stmt = db.prepare<[string], ShareFileDBResult>(
    'SELECT sf.*, s.reference as share_reference FROM share_file sf JOIN share s ON sf.share_id = s.id WHERE sf.reference = ?',
  );
  const result = stmt.get(reference);
  return result
    ? new ShareFile(
        result.id,
        result.share_id,
        result.file_path,
        result.file_name,
        result.reference,
      )
    : undefined;
};

export const getShareById = (id: number): Share | undefined => {
  const stmt = db.prepare('SELECT * FROM share WHERE id = ?');
  const result = stmt.get(id) as
    | { id: number; name: string; reference: string }
    | undefined;
  return result
    ? new Share(result.id, result.name, result.reference)
    : undefined;
};
