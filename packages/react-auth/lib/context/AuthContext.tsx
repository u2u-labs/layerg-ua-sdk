import { createContext } from 'react';

export interface User {
  id: string;
  name?: string;
  email: string;
  profilePicture?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  appId: string;
  apiKey: string;
  privateKey: string;
  authUrl: string;

  isOpenLoginPopup: boolean;
  toggleOpenLoginPopup: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
