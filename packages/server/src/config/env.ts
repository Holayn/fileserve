import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.DATA_PATH) {
  throw new Error('DATA_PATH environment variable is required');
}

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DB_PATH = process.env.DATA_PATH;
export const DATA_PATH = process.env.DATA_PATH;