import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuthProvider = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const useAuth = () => {
  const auth = useAuthProvider();

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    // toggleLoading: auth.toggleLoading,
    isLoading: auth.isLoading,
    // toggleAuthenticated: auth.toggleAuthenticated,
    error: auth.error,
    setError: auth.setError,
    // walletLogin: auth.walletLogin,
    data: auth.data,
    login: auth.login,
    logout: auth.logout,
    apiKey: auth.apiKey,
    apiUrl: auth.apiUrl,
    apiVersion: auth.apiVersion,
    baseApiUrl: auth.baseApiUrl,
    telegramAuthUrl: auth.telegramAuthUrl,
    isOpenLoginPopup: auth.isOpenLoginPopup,
    toggleOpenLoginPopup: auth.toggleOpenLoginPopup,
  };
};
