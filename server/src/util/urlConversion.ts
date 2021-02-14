import logger from './logger';
import fetch from 'node-fetch';

export const urlToBase64 = async (imageUrl: string) => {
  try {
    const buffer = await (await fetch(imageUrl)).arrayBuffer();
    const imgBase64 = Buffer.from(buffer).toString('base64');
    return imgBase64;
  } catch (error) {
    logger.error(error);
    return null;
  }
};