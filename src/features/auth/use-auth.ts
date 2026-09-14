import { useMutation } from "@tanstack/react-query";

import api from "@/services/api";
import { tokenService } from "@/services/token.service";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
}

async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);

  if (data.refresh_token) {
    await tokenService.setTokens(data.access_token, data.refresh_token);
  } else {
    await tokenService.setAccessToken(data.access_token);
  }

  return data;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  });
}
