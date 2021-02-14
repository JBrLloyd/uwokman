import logger from '../util/logger';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
    logger.debug('Using .env file to supply config environment variables');
    dotenv.config({ path: '.env' });
}
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === 'production';

export const SPOTIFY_CLIENT_ID = process.env['SPOTIFY_CLIENT_ID'];
export const SPOTIFY_CLIENT_SECRET = process.env['SPOTIFY_CLIENT_SECRET'];
export const SPOTIFY_REFRESH_TOKEN = process.env['SPOTIFY_REFRESH_TOKEN'];

if (!SPOTIFY_CLIENT_ID) {
    logger.error('Set SPOTIFY_CLIENT_ID environment variable.');
    process.exit(1);
}

if (!SPOTIFY_CLIENT_SECRET) {
  logger.error('Set SPOTIFY_CLIENT_SECRET environment variable.');
  process.exit(1);
}

if (!SPOTIFY_REFRESH_TOKEN) {
  logger.error('Set SPOTIFY_REFRESH_TOKEN environment variable.');
  process.exit(1);
}
