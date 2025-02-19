import { LayerGAPI, LayerGAPIParams } from '@layerg-ua-sdk/aa-sdk';
import { API_URL } from '../config/api';
import {
  AuthData,
  AuthResponse,
  FetchOptions,
  Headers,
  LoginPayload,
  RenewTokenPayload,
} from '../types/api';

export class APIClient {
  public uaHeaders?: Headers;
  public authData?: AuthData;

  constructor(public apiParams: LayerGAPIParams) {}

  request = async <APIResponse, APIPayload = undefined>({
    path,
    method,
    payload,
    headers,
  }: FetchOptions<APIPayload>): Promise<APIResponse> => {
    let body = undefined;

    if (payload) {
      body = JSON.stringify(payload);
    }

    const response = await fetch(API_URL + path, {
      headers,
      method,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return Promise.reject(data);
    }

    return Promise.resolve(data);
  };

  async generateUAHeaders() {
    const layerGAPI = new LayerGAPI(this.apiParams);
    const now = Date.now();
    const { signature, timestamp } = await layerGAPI.createSignature(now);

    this.uaHeaders = {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': `${timestamp}`,
      'x-api-key': this.apiParams.apiKey,
      origin: this.apiParams.origin,
    };
  }

  async login(payload: LoginPayload) {
    const { data } = await this.request<AuthResponse, LoginPayload>({
      path: '/auth/web3',
      method: 'POST',
      headers: this.uaHeaders,
      payload,
    });

    this.authData = data;

    return this.authData;
  }

  async renewToken(payload: RenewTokenPayload) {
    const { data } = await this.request<AuthResponse, RenewTokenPayload>({
      path: '/auth/refresh',
      method: 'POST',
      headers: this.uaHeaders,
      payload,
    });

    this.authData = data;

    return this.authData;
  }

  async getProfile(uaId: number) {
    if (!this.authData) return;

    const { data } = await this.request<any>({
      path: `/user/${uaId}`,
      headers: {
        Authorization: `Bearer ${this.authData.accessToken}`,
        'Content-Type': 'application/json',
        origin: this.apiParams.origin,
      },
    });

    console.log(data);
  }
}
