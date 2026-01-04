import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.DB_PATH) {
  throw new Error('DB_PATH environment variable is required');
}

if (!process.env.PREVIEWS_PATH) {
  throw new Error('PREVIEWS_PATH environment variable is required');
}

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DB_PATH = process.env.DB_PATH;
export const PREVIEWS_PATH = process.env.PREVIEWS_PATH;