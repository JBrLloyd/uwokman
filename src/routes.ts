import { Express } from 'express';
import { spotifyController } from './controllers';


export const setup = (app: Express): void => {
  app.get('/spotify/currently-playing.svg', spotifyController.getCurrentlyPlayingSongSvg);
};