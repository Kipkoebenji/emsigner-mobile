import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenService } from './token.service';

interface RefreshResponse {
  access_token: string;
  refresh_token?: string; // omitted from the response when not rotated
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Refresh a bit before actual expiry so an in-flight request never races
// the token dying mid-air.
const REFRESH_THRESHOLD_MS = 30 * 1000;

const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Plain instance for the refresh call — no interceptors, so it can never
// trigger the response interceptor and loop back into itself.
const refreshClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// RN has no window.location — let the app decide how to react to a
// forced logout (e.g. navigate to /login with expo-router).
type LogoutHandler = () => void;
let onAuthFailure: LogoutHandler | null = null;
export const setOnAuthFailure = (handler: LogoutHandler) => {
  onAuthFailure = handler;
};

/**
 * Refreshes the access token. If a refresh is already in progress, queues
 * the caller and resolves with the token once the in-flight refresh
 * completes, so proactive (request interceptor) and reactive (401 retry)
 * refreshes never fire in parallel.
 */
async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = await tokenService.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const { data } = await refreshClient.post<RefreshResponse>(
      '/auth/refresh',
      { refreshToken }
    );

    const newAccessToken = data.access_token;

    // Refresh token only rotates every 7 days — persist it when present,
    // otherwise keep the existing one.
    if (data.refresh_token) {
      await tokenService.setTokens(newAccessToken, data.refresh_token);
    } else {
      await tokenService.setAccessToken(newAccessToken);
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    processQueue(null, newAccessToken);

    return newAccessToken;
  } catch (error) {
    processQueue(error, null);
    await tokenService.clearTokens();
    onAuthFailure?.(); // e.g. router.replace('/login')
    throw error;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.request.use(
  async (config) => {
    let accessToken = await tokenService.getAccessToken();
    const expiresAt = await tokenService.getAccessTokenExpiresAt();

    const isExpiringSoon =
      accessToken &&
      expiresAt !== null &&
      Date.now() >= expiresAt - REFRESH_THRESHOLD_MS;

    // Never proactively refresh the refresh call itself, and skip if
    // there's no token yet (e.g. pre-login requests).
    const isRefreshCall = config.url?.includes('/auth/refresh');

    if (isExpiringSoon && !isRefreshCall) {
      try {
        accessToken = await refreshAccessToken();
      } catch {
        // Refresh failed — let the request go out without a token (or
        // fall through) and let the response interceptor / 401 path
        // handle the failure/logout.
      }
    }

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;