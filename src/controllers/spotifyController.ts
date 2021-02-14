'use strict';
import { NextFunction, Request, Response } from 'express';
import { getUserCurrentlyPlayingSpotify } from '../services/spotifyService';
import { Artist, Image, SpotifyV1MePlayerResponse } from '../types/api/spotify';
import { CurrentSongSvgView } from '../types/viewModels';
import logger from '../util/logger';
import { getSpotifyBearerToken } from '../util/spotifyToken';
import { urlToBase64 } from '../util/urlConversion';

const generateViewData = async (data: SpotifyV1MePlayerResponse): Promise<CurrentSongSvgView> => {
  const artistString = (data.item.artists || []).map((elem: Artist) => elem.name).join(', ');
  const correctSizedImages = (data.item.album.images || []).filter((elem: Image) => elem.height === 300 && elem.width === 300);
  const sizedCoverImgUrl = correctSizedImages.length > 0 ? correctSizedImages[0].url : null;
  const coverImgBase64 = sizedCoverImgUrl ? await urlToBase64(sizedCoverImgUrl) : null;

  return {
    height: 495.72,
    title: data.is_playing ? 'Now playing' : 'Recently played',
    link: data?.context?.external_urls?.spotify || data.item.external_urls.spotify,
    artists: artistString,
    coverImageBase64: coverImgBase64 ? `data:image/png;base64,${coverImgBase64}` : null,
    songName: data.item.name,
    currentlyPlaying: true,
    songDurationMs: data.item.duration_ms,
    songProgressMs: data.progress_ms,
    songPopularity: data.item.popularity,
    isSongExplicit: data.item.explicit ?? false
  };
};

export const getCurrentlyPlayingSongSvg = async (req: Request, res: Response, next: NextFunction) => {
  let viewData: Partial<CurrentSongSvgView> = {
    height: 40,
    currentlyPlaying: false
  };

  try {
    const spotifyToken = await getSpotifyBearerToken();
    const response = await getUserCurrentlyPlayingSpotify(spotifyToken);

    if (response.body) {
      viewData = await generateViewData(response.body);
    }
  } catch (exception) {
    logger.error(exception);
  } finally {
    res.contentType('image/svg+xml');
    res.render('current-song', {
      data: viewData,
      layout: false
    });
  }
};
