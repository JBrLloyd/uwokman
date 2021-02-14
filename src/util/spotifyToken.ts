'use strict';
import NodeCache from 'node-cache';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';
import AbortController from 'abort-controller';
import queryString from 'query-string';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } from '../config/secrets';
import { API_REQUEST_TIMEOUT_MS } from '../constants/constants';
import logger from './logger';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
};

const spotifyCache = new NodeCache();
const spotifyTokenKey = 'spotifyToken';

export const removeToken = () => {
  spotifyCache.del(spotifyTokenKey);
};

const setSpotifyBearerToken = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    API_REQUEST_TIMEOUT_MS
  );

  const encodedCredentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const getSpotifyTokenUrl = 'https://accounts.spotify.com/api/token';
  const body = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    grant_type: 'refresh_token',
    // eslint-disable-next-line @typescript-eslint/camelcase
    refresh_token: SPOTIFY_REFRESH_TOKEN
  };
  const formUrlEncodedBody = queryString.stringify(body, { sort: false });

  const getSpotifyTokenOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${encodedCredentials}`
    },
    body: formUrlEncodedBody,
    signal: controller.signal,
  };

  const response = await fetch(getSpotifyTokenUrl, getSpotifyTokenOptions);

  if (response.ok) {
    const data: TokenResponse = await response.json();
    const cacheSuccess = spotifyCache.set(spotifyTokenKey, data.access_token);
    return cacheSuccess;
  } else {
    logger.error(`Failed to retrieve token Spotify token: ${response.status}`);
  }

  return false;
};

export const getSpotifyBearerToken = async (): Promise<string | undefined> => {
  let token: string | undefined = spotifyCache.get<string>(spotifyTokenKey);

  if (!token) {
    const tokenCached = await setSpotifyBearerToken();

    if (tokenCached) {
      token = spotifyCache.get<string>(spotifyTokenKey);
    }
  }

  return token;
};
