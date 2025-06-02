import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios, { Method } from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useEffect, useMemo, useState } from 'react';
import isURL from 'validator/lib/isURL';
import { WagmiProvider } from 'wagmi';
import wagmiConfig from '../config/wagmi';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { AuthResponse, UserResponse } from '../types/auth';

export type ApiVersion = '3';

interface Props {
  apiKey: string;
  apiVersion: ApiVersion;
  apiUrl: string;

  telegramAuthUrl?: string;

  children: any;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * LayerG Auth Provider
 *
 * - **apiKey**: Ex:"xxxxxxxxxxx"
 * - **apiUrl**: Ex:"https://bundler-dev.layerg.xyz"
 * - **apiVersion**: Ex:"3"
 * - **telegramAuthUrl**: Ex:"https://t.me/layerg_ua_verification_stg_bot"
 */
export const LayerGAuthProvider = ({
  apiKey,
  apiUrl,
  apiVersion,

  telegramAuthUrl = '',

  children,
}: Props) => {
  const [user, setUser] = useState<UserResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const toggleLoading = (isSet?: boolean) => {
    setIsOpenLoginPopup(isSet ?? !isLoading);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const toggleAuthenticated = (isSet?: boolean) => {
    setIsOpenLoginPopup(isSet ?? !isAuthenticated);
  };

  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<AuthResponse | null>(null);

  const [isOpenLoginPopup, setIsOpenLoginPopup] = useState<boolean>(false);
  const toggleOpenLoginPopup = (isOpen?: boolean) => {
    setIsOpenLoginPopup(isOpen ?? !isOpenLoginPopup);
  };

  const [baseTelegramAuth, setBaseTelegramAuth] = useState<string>('');

  const baseApiUrl = useMemo<string>(() => {
    if (apiUrl && apiVersion) {
      return `${apiUrl}/api/v${apiVersion}`;
    }

    return '';
  }, [apiVersion, apiUrl]);

  useEffect(() => {
    if (telegramAuthUrl && isURL(telegramAuthUrl)) {
      setBaseTelegramAuth(telegramAuthUrl);
    }
  }, [telegramAuthUrl]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check for existing session (e.g., from localStorage or cookie)
      const token = localStorage.getItem('layerg-auth-token');

      if (token) {
        const tokenDecoded = jwtDecode<
          JwtPayload & {
            sub?: {
              userId: string;
              apiKey: string;
              walletId: string;
              authMethod: string;
              ownerAddress: string;
              isSystemOwner: boolean;
            };
          }
        >(token);

        // Validate token and get user data
        const userData = await fetchUserData(
          token,
          tokenDecoded?.sub?.userId ?? '',
        );
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Failed to initialize auth:', err);
      setError(err.message);
      // Clear any invalid tokens
      localStorage.removeItem('layerg-auth-token');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize authentication on component mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (baseApiUrl) {
        initializeAuth();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [baseApiUrl]);

  // Helper function to fetch user data
  const fetchUserData = async (token: string, userId: string) => {
    const baseHeaders = {
      Authorization: `Bearer ${token}`,
      'x-api-key': apiKey,
      origin: window?.location?.origin,
    };

    const response = await axios<{
      data: UserResponse;
      success: true;
      message: string;
    }>({
      baseURL: baseApiUrl,
      url: `/user/${userId}`,
      method: 'GET' as Method,
      headers: {
        ...baseHeaders,
      },
    });

    if (!response?.data?.success || !response?.data?.data?.userInfo) {
      throw new Error('Failed to fetch user data');
    }

    return response.data.data;
  };

  const login: AuthContextType['login'] = async ({
    code,
    state,
    type,
    error,
  }) => {
    try {
      const baseHeaders = {
        'x-api-key': apiKey,
        origin: window?.location?.origin,
      };

      const response = await axios<{
        data: AuthResponse;
        message: string;
        success: boolean;
        error: string;
        statusCode: number;
      }>({
        baseURL: baseApiUrl,
        url: `/auth/${type}/callback`,
        method: 'POST' as Method,
        headers: {
          ...baseHeaders,
        },
        data: {
          code,
          state,
          error,
        },
      });

      if (response.data.success && response?.data?.data?.accessToken) {
        setData(response.data.data);
        setIsAuthenticated(true);

        // Store token
        localStorage.setItem(
          'layerg-auth-token',
          response.data.data.accessToken,
        );

        const userResponse = await fetchUserData(
          response.data.data.accessToken,
          response.data.data.userId,
        );

        if (userResponse?.userInfo) {
          setUser(userResponse ?? null);
        }

        toggleOpenLoginPopup(false);
      } else {
        throw new Error(response?.data?.message || response?.data?.error);
      }
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  // Login function
  const walletLogin: AuthContextType['walletLogin'] = async ({
    address,
    message,
  }) => {
    const baseHeaders = {
      'x-api-key': apiKey,
      origin: window?.location?.origin,
    };

    const response = await axios<{ data: AuthResponse }>({
      baseURL: baseApiUrl,
      url: '/auth/web3',
      method: 'POST' as Method,
      headers: {
        ...baseHeaders,
      },
      data: {
        signer: address,
        signature: message,
      },
    });

    if (response.data?.data?.accessToken) {
      setData(response.data.data);

      // Store token
      localStorage.setItem('layerg-auth-token', response.data.data.accessToken);

      const userResponse = await fetchUserData(
        response.data.data.accessToken,
        response.data.data.userId,
      );

      if (userResponse?.userInfo) {
        setUser(userResponse ?? null);
      }

      setIsAuthenticated(true);

      toggleOpenLoginPopup(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // setIsLoading(true);

      const token = localStorage.getItem('layerg-auth-token');

      if (token) {
        await fetch(`${apiUrl}/api/v3/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': apiKey,
          },
        });
      }

      // Clear token
      localStorage.removeItem('layerg-auth-token');

      // Update state
      setUser(null);
      // setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // setIsLoading(false);
    }
  };

  // Provide authentication context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    toggleLoading,
    isLoading,
    toggleAuthenticated,
    error,
    setError,
    login,
    walletLogin,
    data,
    logout,
    apiKey,
    apiUrl,
    apiVersion,
    baseApiUrl,
    telegramAuthUrl: baseTelegramAuth,
    isOpenLoginPopup,
    toggleOpenLoginPopup,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AuthContext.Provider>
  );
};
