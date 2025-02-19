export type FetchOptions<APIPayload> = {
  path: string;
  method?: string;
  headers?: Headers;
  payload?: APIPayload;
};

export type Headers =
  | {
      'x-signature': string;
      'x-timestamp': string;
      'x-api-key': string;
      origin: string;
    }
  | RequestInit['headers'];

export type APIResponse<Data> = {
  success: boolean;
  data: Data;
  message: string;
};

export type LoginPayload = {
  signature: string;
  signer: string;
};

export type RenewTokenPayload = {
  refreshToken: string;
};

export type AuthData = {
  refreshToken: string;
  refreshTokenExpire: number;
  accessToken: string;
  accessTokenExpire: number;
  userId: string;
  apiKey: string;
};

export type AuthResponse = APIResponse<AuthData>;
