import { join } from 'path';
import { DATA_PATH } from '../config/env.js';

export const FILES_PATH = join(DATA_PATH, 'files');
export const STREAMS_PATH = join(DATA_PATH, 'streams');
export const WEB_OPTIMIZED_PATH = join(DATA_PATH, 'web-optimized');