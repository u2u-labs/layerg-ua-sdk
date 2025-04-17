import { useAuth } from './useAuth';

export const useLogin = () => {
  const { login, isLoading, error } = useAuth();
  
  return {
    login,
    isLoading,
    error
  };
};