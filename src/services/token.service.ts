import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "access_token_expires_at";

// Access tokens are issued with a 15 minute lifetime.
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

export const tokenService = {
  async setTokens(accessToken: string, refreshToken: string) {
    const expiresAt = Date.now() + ACCESS_TOKEN_LIFETIME_MS;

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(expiresAt)
    );
  },

  async setAccessToken(accessToken: string) {
    const expiresAt = Date.now() + ACCESS_TOKEN_LIFETIME_MS;

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(expiresAt)
    );
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async getAccessTokenExpiresAt(): Promise<number | null> {
    const value = await SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY);
    return value ? Number(value) : null;
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY);
  },
};