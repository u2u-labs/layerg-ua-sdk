import { createContext, SetStateAction } from 'react';
import { ApiVersion } from '../components/AuthProvider';
import { AuthWalletLoginProps } from '../main';
import { AuthResponse, UserResponse } from '../types/auth';

export interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  toggleLoading: (val?: boolean) => void;
  isLoading: boolean;
  toggleAuthenticated: (val?: boolean) => void;
  error: any;
  setError: SetStateAction<any>;
  login: (val: {
    code: string;
    state: string;
    type: 'google' | 'twitter' | 'facebook';
    error?: string;
  }) => Promise<void>;
  walletLogin: (val: AuthWalletLoginProps) => Promise<void>;
  data: AuthResponse | null;
  logout: () => Promise<void>;
  apiKey: string;
  apiUrl: string;
  apiVersion: ApiVersion;
  baseApiUrl: string;

  telegramAuthUrl: string;

  isOpenLoginPopup: boolean;
  toggleOpenLoginPopup: (val?: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
