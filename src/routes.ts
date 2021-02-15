import { Express } from 'express';
import { spotifyController } from './controllers';


export const setup = (app: Express): void => {
  app.get('/spotify/current-song.svg', spotifyController.getCurrentlyPlayingSongSvg);
};