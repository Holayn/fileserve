import { randomUUID } from 'crypto';
import fs from 'fs-extra';
import { ShareFile } from '../models/share-file.js';
import { Share } from '../models/share.js';
import { db } from '../config/database.js';
import { posix } from 'path';
import { generateHash } from '../util/security.js';

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
  password: string | null,
): { id: number; reference: string, password: string | null } => {
  const reference = randomUUID();

  const stmt = db.prepare('INSERT INTO share (name, reference, password) VALUES (?, ?, ?)');
  const result = stmt.run(name, reference, password ? generateHash(password) : null);

  return { id: result.lastInsertRowid as number, reference, password };
};

export const addFileToShare = async (
  shareId: number,
  filePath: string,
  fileName: string,
): Promise<{ id: number; reference: string }> => {
  // Verify file exists and is accessible
  try {
    const stats = await fs.lstat(filePath);
    
    // Check if file is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    // Check if file is not a directory
    if (!stats.isFile()) {
      throw {
        message: 'Path is a directory, not a file',
        filePath,
      };
    }
  } catch (error) {
    throw {
      message: 'File not accessible or does not exist',
      filePath,
    };
  }

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
  const result = stmt.get(reference) as { id: number; name: string; password: string | null; reference: string } | undefined;
  return result
    ? new Share(result.id, result.name, result.password, result.reference)
    : undefined;
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
  const result = stmt.get(id) as { id: number; name: string; password: string | null; reference: string } | undefined;
  return result
    ? new Share(result.id, result.name, result.password, result.reference)
    : undefined;
};

export const updateSharePassword = (id: number, password: string | null): boolean => {
  const stmt = db.prepare('UPDATE share SET password = ? WHERE id = ?');
  const result = stmt.run(password ? generateHash(password) : null, id);
  return result.changes > 0;
};
