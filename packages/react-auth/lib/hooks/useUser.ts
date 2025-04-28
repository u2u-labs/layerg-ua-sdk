import { useAuth } from './useAuth';

export const useUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading
  };
};