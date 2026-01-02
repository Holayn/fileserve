import Database from 'better-sqlite3';
import { DB_PATH } from './env.js';
import { join } from 'path';

export const db: Database.Database = new Database(
  join(DB_PATH, 'fileserve.db'),
);

db.exec(`
    CREATE TABLE IF NOT EXISTS share (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      reference TEXT UNIQUE NOT NULL
    )
  `);

db.exec(`
    CREATE TABLE IF NOT EXISTS share_file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      reference TEXT UNIQUE NOT NULL,
      FOREIGN KEY (share_id) REFERENCES share (id) ON DELETE CASCADE
    )
  `);

export const closeDatabase = (): void => {
  if (db) {
    db.close();
  }
};
