'use strict';
import { fetchRetrySuccess } from '../util/apiCall';
import { SpotifyV1MePlayerResponse } from '../types/api/spotify';

interface ApiResponse<T> {
  statusCode: number;
  body: T | null;
}

export const getUserCurrentlyPlayingSpotify = async (spotifyRefreshToken: string): Promise<ApiResponse<SpotifyV1MePlayerResponse>> => {
    try {
      const response = await fetchRetrySuccess('https://api.spotify.com/v1/me/player', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyRefreshToken}`
        }
      });

      const data: SpotifyV1MePlayerResponse | null = 
        response.body && response.status !== 204
          ? await response.json()
          : null;

      const returnData: ApiResponse<SpotifyV1MePlayerResponse> = {
        statusCode: response.status,
        body: data,
      };
      return returnData;
    } catch (error) {
      throw error;
    }
};
