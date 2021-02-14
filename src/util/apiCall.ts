'use stricts';
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import AbortController from 'abort-controller';
import logger from './logger';
import { API_REQUEST_TIMEOUT_MS } from '../constants/constants';

export const fetchRetry = async (url: RequestInfo, options: RequestInit, retries: number = 3): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    API_REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(url, options);
  } catch (err) {
    logger.error(`Failed Fetch Retry: ${options.method ? options.method : 'GET'} ${url} - retries left ${retries}`);
    if (retries === 1) throw err;
    return await fetchRetry(url, options, retries - 1);
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchRetrySuccess = async (url: RequestInfo, options: RequestInit, retries: number = 3): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    API_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    } else {
      throw new Error();
    }
  } catch (err) {
    logger.error(`Failed Fetch Retry: ${options.method ? options.method : 'GET'} ${url} - retries left ${retries}`);
    if (retries === 1) throw err;
    return await fetchRetry(url, options, retries - 1);
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchRetrySpotify = async (url: RequestInfo, options: RequestInit, retries: number = 3): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    API_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    } else {
      let errorMsg: string | null = null;

      if (response.body) {
        const errorData = await response.json();
        errorMsg = errorData.error.message;
      }

      return {
        statusCode: response.status,
        message: errorMsg,
      };
    }
  } catch (err) {
    logger.error(`Failed Fetch Retry: ${options.method ? options.method : 'GET'} ${url} - retries left ${retries}`);
    if (retries === 1) throw err;
    return await fetchRetry(url, options, retries - 1);
  } finally {
    clearTimeout(timeout);
  }
};