export interface AuthResponse {
  refreshToken: string;
  refreshTokenExpire: number;
  accessToken: string;
  accessTokenExpire: number;
  userId: string;
  apiKey: string;
  walletId: string;
  walletAddress: string;
}

export interface WalletLoginProps {
  address: `0x${string}`;
  message: `0x${string}`;
}

export interface UserResponse {
  userInfo: UserInfo;
  aaWallet: { aaAddress: string; apps: { appName: string; appKey: string } }[];
}

export interface UserInfo {
  useId: string;
  type: string;
  email: string | null;
  loginSource: string;
  eoaWallet: string;
  socialId: string;
  socialData: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
}
